import { decryptPayload, hashToken } from "./secure-payload";

export type ReportOrder = { id: string; status: string; payload: string; locale: string; quiz_length: number; variant: string; plan: "basic" | "plus"; parent_order_id: string | null; checkout_session_id: string | null; delivery_base_url: string };

export async function reportAccess(db: D1Database, token: string, secret: string) {
  const order = await db.prepare("SELECT id, status, payload, locale, quiz_length, variant, plan, parent_order_id, checkout_session_id, delivery_base_url FROM orders WHERE token_hash = ?").bind(await hashToken(token)).first<ReportOrder>();
  if (!order || order.status !== "paid") return null;
  const root = order.parent_order_id ? await db.prepare("SELECT id, status, payload, locale, quiz_length, variant, plan, parent_order_id, checkout_session_id, delivery_base_url FROM orders WHERE id = ?").bind(order.parent_order_id).first<ReportOrder>() : order;
  if (!root || root.status !== "paid") return null;
  const upgrade = root.plan === "basic" ? await db.prepare("SELECT id FROM orders WHERE parent_order_id = ? AND status = 'paid'").bind(root.id).first() : null;
  const { axes } = await decryptPayload<{ axes: number[] }>(root.payload, secret);
  return { root, axes, plan: root.plan === "plus" || upgrade ? "plus" as const : "basic" as const };
}
