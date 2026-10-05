import { NextRequest, NextResponse } from "next/server";
import { runtimeEnv } from "../../../lib/runtime-env";
import { privateHeaders } from "../../../lib/billing-input";
import { reportAccess } from "../../../lib/report-access";
import { decryptPayload } from "../../../lib/secure-payload";
import { axisComparison } from "../../../lib/matching";
import { isLocale } from "../../../i18n";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { token?: unknown; shareId?: unknown; locale?: unknown; consent?: unknown } | null;
  if (typeof body?.token !== "string" || typeof body?.shareId !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(body.shareId) || (typeof body.locale !== "string" || !isLocale(body.locale)) || body.consent !== true) return NextResponse.json({ error: "Invalid comparison or missing consent" }, { status: 400, headers: privateHeaders });
  const { DB: db, REPORT_ENCRYPTION_KEY: secret } = runtimeEnv;
  if (!db || !secret) return NextResponse.json({ error: "Unavailable" }, { status: 503, headers: privateHeaders });
  const access = await reportAccess(db, body.token, secret);
  if (!access || access.plan !== "plus") return NextResponse.json({ error: "Report Plus required" }, { status: 403, headers: privateHeaders });
  const shared = await db.prepare("SELECT payload FROM shared_results WHERE id = ? AND expires_at > ?").bind(body.shareId, Math.floor(Date.now() / 1000)).first<{ payload: string }>();
  if (!shared) return NextResponse.json({ error: "Shared result unavailable" }, { status: 404, headers: privateHeaders });
  const friend = await decryptPayload<{ axes: number[]; quizLength: number }>(shared.payload, secret);
  return NextResponse.json({ axes: axisComparison(access.axes, friend.axes, body.locale), yourQuizLength: access.root.quiz_length, friendQuizLength: friend.quizLength }, { headers: privateHeaders });
}
