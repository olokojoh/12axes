import { NextRequest, NextResponse } from "next/server";
import { matchResult } from "../../lib/matching";
import { locales, type Locale } from "../../i18n";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { axes?: unknown; locale?: unknown } | null;
  if (!Array.isArray(body?.axes) || body.axes.length !== 12 || body.axes.some((value) => !Number.isInteger(value) || value < 0 || value > 100)) {
    return NextResponse.json({ error: "Invalid axes" }, { status: 400 });
  }
  const locale = body.locale === undefined ? "en" : body.locale;
  if (typeof locale !== "string" || !locales.includes(locale as Locale)) return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
  return NextResponse.json(matchResult(body.axes, locale as Locale), { headers: { "cache-control": "no-store", "referrer-policy": "no-referrer" } });
}
