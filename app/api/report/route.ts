import { deepReport } from "../../lib/quiz-evidence";
import type { QuizEvidence } from "../../lib/quiz-evidence";
import { NextRequest, NextResponse } from "next/server";
import { decryptPayload, hashToken } from "../../lib/secure-payload";
import { runtimeEnv } from "../../lib/runtime-env";
import { privateHeaders } from "../../lib/billing-input";
import { reportAccess } from "../../lib/report-access";
import { matchResult, plusReport } from "../../lib/matching";
import { isLocale, type Locale } from "../../i18n";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { token?: unknown; preview?: unknown; locale?: unknown; original?: unknown } | null;
  const secret = runtimeEnv.REPORT_ENCRYPTION_KEY;
  if (typeof body?.token !== "string" || !runtimeEnv.DB || !secret) return NextResponse.json({ status: "missing" }, { status: 404, headers: privateHeaders });
  if (body.locale !== undefined && (typeof body.locale !== "string" || !isLocale(body.locale))) return NextResponse.json({ error: "Invalid locale" }, { status: 400, headers: privateHeaders });
  const row = await runtimeEnv.DB.prepare("SELECT id, status, payload, locale, quiz_length, variant, amount_total, currency FROM orders WHERE token_hash = ?")
    .bind(await hashToken(body.token)).first<{ id: string; status: string; payload: string; locale: string; quiz_length: number; variant: string; amount_total: number; currency: string }>();
  if (row && ["pending", "failed"].includes(row.status) && body.preview === true) {
    const payload = await decryptPayload<{ axes: number[]; evidence?: QuizEvidence }>(row.payload, secret);
    return NextResponse.json({ status: "preview", axes: payload.axes, quizLength: row.quiz_length, evidence: payload.evidence }, { headers: privateHeaders });
  }
  if (!row || row.status !== "paid") return NextResponse.json({ status: row?.status ?? "missing" }, { status: row?.status === "pending" ? 202 : 404, headers: privateHeaders });
  const access = await reportAccess(runtimeEnv.DB, body.token, secret, body.original === true);
  if (!access) return NextResponse.json({ status: "revoked" }, { status: 404, headers: privateHeaders });
  const locale = (body.locale ?? row.locale) as Locale;
  return NextResponse.json({ status: "paid", axes: access.axes, result: matchResult(access.axes, locale), plan: access.plan, plus: access.plan !== "basic" ? plusReport(access.axes, locale) : null, deep: access.plan === "deep" && access.evidence ? deepReport(access.evidence, locale) : null, hasOriginal: access.hasOriginal, entitlement: access.entitlement.plan, locale, quizLength: access.quizLength, variant: row.variant }, { headers: privateHeaders });
}
