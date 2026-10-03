import { NextRequest, NextResponse } from "next/server";
import { decryptPayload, encryptPayload, randomToken } from "../../lib/secure-payload";
import { runtimeEnv } from "../../lib/runtime-env";
import { privateHeaders, validResult, type ResultInput } from "../../lib/billing-input";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!validResult(body) || body === null || (body as ResultInput & { consent?: boolean }).consent !== true) return NextResponse.json({ error: "Invalid request or missing sharing consent" }, { status: 400 });
  const secret = runtimeEnv.REPORT_ENCRYPTION_KEY;
  if (!runtimeEnv.DB || !secret) return NextResponse.json({ error: "Sharing unavailable" }, { status: 503 });
  const id = randomToken();
  const payload = await encryptPayload({ axes: body.axes, quizLength: body.quizLength }, secret);
  const now = Math.floor(Date.now() / 1000);
  await runtimeEnv.DB.prepare("INSERT INTO shared_results (id, payload, locale, created_at, expires_at) VALUES (?, ?, ?, ?, ?)")
    .bind(id, payload, body.locale, now, now + 365 * 86400).run();
  return NextResponse.json({ id }, { headers: privateHeaders });
}

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  const secret = runtimeEnv.REPORT_ENCRYPTION_KEY;
  if (!id || !runtimeEnv.DB || !secret) return NextResponse.json({ error: "Not found" }, { status: 404, headers: privateHeaders });
  const row = await runtimeEnv.DB.prepare("SELECT payload, locale FROM shared_results WHERE id = ? AND expires_at > ?")
    .bind(id, Math.floor(Date.now() / 1000)).first<{ payload: string; locale: string }>();
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404, headers: privateHeaders });
  const decoded = await decryptPayload<{ axes: number[]; quizLength: number }>(row.payload, secret);
  return NextResponse.json({ ...decoded, locale: row.locale }, { headers: privateHeaders });
}
