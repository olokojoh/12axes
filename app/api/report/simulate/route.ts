import { NextRequest, NextResponse } from "next/server";
import { runtimeEnv } from "../../../lib/runtime-env";
import { privateHeaders } from "../../../lib/billing-input";
import { reportAccess } from "../../../lib/report-access";
import { evidenceAxes, quizBanks } from "../../../lib/quiz-evidence";
import { matchResult } from "../../../lib/matching";
import { isLocale } from "../../../i18n";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { token: string; locale: string; questionId: string; answerId: string } | null;
  if (typeof body?.token !== "string" || !isLocale(body.locale) || typeof body.questionId !== "string" || !quizBanks.en.answerOptions.some(option => option.id === body.answerId)) return NextResponse.json({ error: "Invalid simulation" }, { status: 400, headers: privateHeaders });
  const { DB: db, REPORT_ENCRYPTION_KEY: secret } = runtimeEnv;
  if (!db || !secret) return NextResponse.json({ error: "Unavailable" }, { status: 503, headers: privateHeaders });
  const access = await reportAccess(db, body.token, secret);
  if (!access || access.plan !== "deep" || !access.evidence) return NextResponse.json({ error: "Deep report required" }, { status: 403, headers: privateHeaders });
  const index = access.evidence.questionIds.indexOf(body.questionId);
  if (index < 0) return NextResponse.json({ error: "Question not in this report" }, { status: 400, headers: privateHeaders });
  const answers = [...access.evidence.answers];
  answers[index] = body.answerId;
  const axes = evidenceAxes({ ...access.evidence, answers });
  return NextResponse.json({ axes, result: matchResult(axes, body.locale) }, { headers: privateHeaders });
}
