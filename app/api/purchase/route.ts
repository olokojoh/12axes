import { NextRequest, NextResponse } from "next/server";
import { hashToken } from "../../lib/secure-payload";
import { runtimeEnv } from "../../lib/runtime-env";
import { privateHeaders } from "../../lib/billing-input";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { token?: unknown; orderId?: unknown; consent?: unknown } | null;
  if (body?.consent !== true || typeof body.token !== "string" || typeof body.orderId !== "string") {
    return NextResponse.json({ error: "Invalid purchase measurement request" }, { status: 400, headers: privateHeaders });
  }
  if (!runtimeEnv.DB || runtimeEnv.PUBLIC_BASE_URL !== "https://12axes.net") {
    return new NextResponse(null, { status: 204, headers: privateHeaders });
  }
  // Claim the payment itself, including an upgrade reached through the original report link.
  const purchase = await runtimeEnv.DB.prepare(`UPDATE orders SET analytics_claimed_at = ?
    WHERE id = ? AND status = 'paid' AND analytics_claimed_at IS NULL
    AND checkout_session_id GLOB 'cs_live_*' AND delivery_base_url = 'https://12axes.net'
    AND amount_total > 0 AND currency = 'usd'
    AND (parent_order_id IS NULL OR parent_order_id IN (SELECT id FROM orders WHERE status = 'paid'))
    AND (dependency_order_id IS NULL OR dependency_order_id IN (SELECT id FROM orders WHERE status = 'paid'))
    AND (token_hash = ? OR parent_order_id IN (SELECT COALESCE(parent_order_id, id) FROM orders WHERE token_hash = ? AND status = 'paid'))
    RETURNING id, amount_total, currency, plan`)
    .bind(Math.floor(Date.now() / 1000), body.orderId, await hashToken(body.token), await hashToken(body.token))
    .first<{ id: string; amount_total: number; currency: string; plan: string }>();
  if (!purchase) return new NextResponse(null, { status: 204, headers: privateHeaders });
  return NextResponse.json({ transaction_id: purchase.id, value: purchase.amount_total / 100, currency: "USD", plan: purchase.plan }, { headers: privateHeaders });
}
