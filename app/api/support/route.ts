import { NextRequest, NextResponse } from "next/server";
import { runtimeEnv } from "../../lib/runtime-env";
import { encryptPayload, hashToken } from "../../lib/secure-payload";
import { privateHeaders } from "../../lib/billing-input";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { email?: unknown; order?: unknown; message?: unknown } | null;
  if (typeof body?.email !== "string" || body.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email) || typeof body.message !== "string" || !body.message.trim() || body.message.length > 2000 || (typeof body.order !== "undefined" && (typeof body.order !== "string" || body.order.length > 120))) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { DB: db, REPORT_ENCRYPTION_KEY: secret } = runtimeEnv;
  if (!db || !secret) return NextResponse.json({ error: "Support unavailable" }, { status: 503 });
  const email = body.email.trim().toLowerCase();
  const emailHash = await hashToken(email);
  const now = Math.floor(Date.now() / 1000);
  const prior = await db.prepare("SELECT id FROM support_requests WHERE email_hash = ? AND created_at > ?").bind(emailHash, now - 60).first();
  if (prior) return NextResponse.json({ error: "Please wait a minute" }, { status: 429 });
  const id = crypto.randomUUID();
  const payload = await encryptPayload({ email, order: body.order ?? "", message: body.message }, secret);
  await db.prepare("INSERT INTO support_requests (id, email_hash, payload, created_at) VALUES (?, ?, ?, ?)").bind(id, emailHash, payload, now).run();
  return NextResponse.json({ id }, { headers: privateHeaders });
}
