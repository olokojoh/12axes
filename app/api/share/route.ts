import { Buffer } from "node:buffer";
import { NextRequest, NextResponse } from "next/server";
import { decryptPayload, encryptPayload, hashToken, randomToken } from "../../lib/secure-payload";
import { runtimeEnv } from "../../lib/runtime-env";
import { privateHeaders, validResult, type ResultInput } from "../../lib/billing-input";
import { readPublicShare, shareIdPattern, shareUrls } from "../../lib/public-share";
import { maxShareImageBytes, validSharePng } from "../../lib/share-png";
import type { Locale } from "../../i18n";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!validResult(body) || body === null || (body as ResultInput & { consent?: boolean }).consent !== true) return NextResponse.json({ error: "Invalid request or missing sharing consent" }, { status: 400, headers: privateHeaders });
  const secret = runtimeEnv.REPORT_ENCRYPTION_KEY;
  const base = runtimeEnv.PUBLIC_BASE_URL;
  if (!runtimeEnv.DB || !secret || !base || !/^https:\/\/[^/?#]+$/.test(base)) return NextResponse.json({ error: "Sharing unavailable" }, { status: 503, headers: privateHeaders });
  const id = randomToken(), uploadToken = randomToken();
  const payload = await encryptPayload({ axes: body.axes, quizLength: body.quizLength }, secret);
  const now = Math.floor(Date.now() / 1000);
  await runtimeEnv.DB.batch([
    runtimeEnv.DB.prepare("INSERT INTO shared_results (id, payload, locale, created_at, expires_at) VALUES (?, ?, ?, ?, ?)").bind(id, payload, body.locale, now, now + 365 * 86400),
    runtimeEnv.DB.prepare("INSERT INTO share_cards (share_id, upload_token_hash, base_url) VALUES (?, ?, ?)").bind(id, await hashToken(uploadToken), base),
  ]);
  return NextResponse.json({ id, uploadToken, ...shareUrls(base, body.locale, id), ready: false }, { headers: privateHeaders });
}

export async function PUT(request: NextRequest) {
  const { DB: db, REPORT_ENCRYPTION_KEY: secret } = runtimeEnv;
  if (!db || !secret) return NextResponse.json({ error: "Sharing unavailable" }, { status: 503, headers: privateHeaders });
  const limit = maxShareImageBytes + 16384;
  if (Number(request.headers.get("content-length")) > limit || !request.body) return NextResponse.json({ error: "Image too large" }, { status: 413, headers: privateHeaders });
  const reader = request.body.getReader(), parts: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > limit) { await reader.cancel(); return NextResponse.json({ error: "Image too large" }, { status: 413, headers: privateHeaders }); }
    parts.push(value);
  }
  const form = await new Response(Buffer.concat(parts), { headers: { "content-type": request.headers.get("content-type") ?? "" } }).formData().catch(() => null);
  const id = form?.get("id"), uploadToken = form?.get("uploadToken"), image = form?.get("image");
  if (typeof id !== "string" || !shareIdPattern.test(id) || typeof uploadToken !== "string" || !shareIdPattern.test(uploadToken) || !(image instanceof File) || image.type !== "image/png") return NextResponse.json({ error: "Invalid share image" }, { status: 400, headers: privateHeaders });
  if (image.size > maxShareImageBytes) return NextResponse.json({ error: "Image too large" }, { status: 413, headers: privateHeaders });
  const row = await db.prepare("SELECT c.base_url, c.image_payload, s.locale FROM share_cards c JOIN shared_results s ON s.id = c.share_id WHERE c.share_id = ? AND c.upload_token_hash = ? AND s.expires_at > ?")
    .bind(id, await hashToken(uploadToken), Math.floor(Date.now() / 1000)).first<{ base_url: string; image_payload: string | null; locale: Locale }>();
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404, headers: privateHeaders });
  if (!row.image_payload) {
    const bytes = new Uint8Array(await image.arrayBuffer());
    if (!validSharePng(bytes)) return NextResponse.json({ error: "A valid 1200 × 630 PNG is required" }, { status: 400, headers: privateHeaders });
    const payload = await encryptPayload({ png: Buffer.from(bytes).toString("base64") }, secret);
    await db.prepare("UPDATE share_cards SET image_payload = ?, image_bytes = ?, ready_at = ? WHERE share_id = ? AND image_payload IS NULL")
      .bind(payload, bytes.length, Math.floor(Date.now() / 1000), id).run();
  }
  return NextResponse.json({ id, ...shareUrls(row.base_url, row.locale, id), ready: true }, { headers: privateHeaders });
}

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  const row = id ? await readPublicShare(id) : null;
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404, headers: privateHeaders });
  const decoded = await decryptPayload<{ axes: number[]; quizLength: number }>(row.payload, runtimeEnv.REPORT_ENCRYPTION_KEY!);
  return NextResponse.json({ ...decoded, locale: row.locale }, { headers: privateHeaders });
}
