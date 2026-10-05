export type StripeEvent = {
  id: string;
  type: string;
  data: { object: {
    id: string; payment_intent?: string; metadata?: { order_id?: string };
    customer_details?: { email?: string }; customer_email?: string;
    payment_status?: string; amount_total?: number; currency?: string;
    amount?: number; amount_refunded?: number; refunded?: boolean;
  } };
};

export async function verifyStripeSignature(body: string, header: string, secret: string) {
  const parts = header.split(",").map((item) => item.trim().split("="));
  const timestamp = parts.find(([name]) => name === "t")?.[1];
  if (!timestamp || !Number.isFinite(Number(timestamp)) || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
  for (const [name, value] of parts) {
    if (name !== "v1" || !/^[a-f0-9]{64}$/i.test(value)) continue;
    const bytes = Uint8Array.from(value.match(/../g)!, (pair) => parseInt(pair, 16));
    if (await crypto.subtle.verify("HMAC", key, bytes, new TextEncoder().encode(timestamp + "." + body))) return true;
  }
  return false;
}

export async function processStripeEvent(event: StripeEvent, db: D1Database, queue: Queue) {
  if (await db.prepare("SELECT event_id FROM webhook_events WHERE event_id = ?").bind(event.id).first()) return;
  const object = event.data.object;
  const now = Math.floor(Date.now() / 1000);
  if (["checkout.session.completed", "checkout.session.async_payment_succeeded"].includes(event.type) && object.payment_status === "paid") {
    const order = await db.prepare("SELECT id, status, expected_amount FROM orders WHERE id = ? AND (checkout_session_id = ? OR checkout_session_id IS NULL)")
      .bind(object.metadata?.order_id ?? "", object.id).first<{ id: string; status: string; expected_amount: number }>();
    if (order && order.status !== "revoked") {
      if (object.amount_total !== order.expected_amount || object.currency !== "usd") throw new Error("Payment amount or currency mismatch");
      const email = (object.customer_details?.email ?? object.customer_email)?.trim().toLowerCase() ?? null;
      // Check refund state in the same write, including refunds delivered before payment.
      await db.prepare(`UPDATE orders SET
        status = CASE WHEN COALESCE((SELECT full_refund FROM refunded_payments WHERE payment_intent_id = ?), 0) = 1 THEN 'revoked' ELSE 'paid' END,
        refunded_amount = MAX(refunded_amount, COALESCE((SELECT amount_refunded FROM refunded_payments WHERE payment_intent_id = ?), 0)),
        revoked_at = CASE WHEN COALESCE((SELECT full_refund FROM refunded_payments WHERE payment_intent_id = ?), 0) = 1 THEN ? ELSE revoked_at END,
        checkout_session_id = ?, payment_intent_id = ?, customer_email = COALESCE(?, customer_email), amount_total = ?, currency = ?, updated_at = ?, fulfilled_at = COALESCE(fulfilled_at, ?)
        WHERE id = ? AND status != 'revoked'`)
        .bind(object.payment_intent ?? "", object.payment_intent ?? "", object.payment_intent ?? "", now, object.id, object.payment_intent ?? null, email, object.amount_total ?? null, object.currency ?? null, now, now, order.id).run();
      // A durable queue plus the order ID makes event retries safe across event types.
      await queue.send({ orderId: order.id, deliveryId: "paid/" + order.id });
    }
  }
  if (event.type === "charge.refunded") {
    const full = object.refunded === true || (typeof object.amount === "number" && (object.amount_refunded ?? 0) >= object.amount);
    if (object.payment_intent) await db.prepare("INSERT INTO refunded_payments (payment_intent_id, amount_refunded, full_refund, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(payment_intent_id) DO UPDATE SET amount_refunded = MAX(amount_refunded, excluded.amount_refunded), full_refund = MAX(full_refund, excluded.full_refund), updated_at = excluded.updated_at").bind(object.payment_intent, object.amount_refunded ?? 0, full ? 1 : 0, now).run();
    await db.prepare("UPDATE orders SET refunded_amount = MAX(refunded_amount, ?), status = CASE WHEN ? THEN 'revoked' ELSE status END, revoked_at = CASE WHEN ? THEN ? ELSE revoked_at END, updated_at = ? WHERE payment_intent_id = ? OR id = ?")
      .bind(object.amount_refunded ?? 0, full ? 1 : 0, full ? 1 : 0, now, now, object.payment_intent ?? "", object.metadata?.order_id ?? "").run();
  }
  if (event.type === "checkout.session.async_payment_failed") {
    await db.prepare("UPDATE orders SET status = 'failed', updated_at = ? WHERE id = ? AND status = 'pending'")
      .bind(now, object.metadata?.order_id ?? "").run();
  }
  // Save acknowledgement only after all durable side effects have succeeded.
  await db.prepare("INSERT OR IGNORE INTO webhook_events (event_id, event_type, created_at) VALUES (?, ?, ?)").bind(event.id, event.type, now).run();
}
