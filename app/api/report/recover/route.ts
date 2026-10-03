import { NextRequest, NextResponse } from "next/server";
import { hashToken } from "../../../lib/secure-payload";
import { runtimeEnv } from "../../../lib/runtime-env";
import { privateHeaders } from "../../../lib/billing-input";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { email?: unknown } | null;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });
  const { DB: db, REPORT_EMAIL_QUEUE: queue } = runtimeEnv;
  if (!db || !queue) return NextResponse.json({ error: "Recovery is temporarily unavailable" }, { status: 503 });
  const now = Math.floor(Date.now() / 1000);
  const emailHash = await hashToken(email);
  const claim = await db.prepare("INSERT INTO recovery_requests (email_hash, requested_at) VALUES (?, ?) ON CONFLICT(email_hash) DO UPDATE SET requested_at = excluded.requested_at WHERE requested_at < ? RETURNING email_hash")
    .bind(emailHash, now, now - 300).first();
  if (claim) {
    const rows = await db.prepare("SELECT id FROM orders WHERE customer_email = ? AND status = 'paid' ORDER BY created_at DESC LIMIT 5").bind(email).all<{ id: string }>();
    try {
      for (const row of rows.results) await queue.send({ orderId: row.id, deliveryId: "recover/" + row.id + "/" + Math.floor(now / 300) });
    } catch {
      await db.prepare("DELETE FROM recovery_requests WHERE email_hash = ? AND requested_at = ?").bind(emailHash, now).run();
      return NextResponse.json({ error: "Please try again later" }, { status: 503 });
    }
  }
  return NextResponse.json({ accepted: true }, { headers: privateHeaders });
}
