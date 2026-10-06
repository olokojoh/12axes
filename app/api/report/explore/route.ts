import { NextRequest, NextResponse } from "next/server";
import { runtimeEnv } from "../../../lib/runtime-env";
import { privateHeaders } from "../../../lib/billing-input";
import { reportAccess } from "../../../lib/report-access";
import { exploreProfiles, type ProfileGroup, type ProfileDomain } from "../../../lib/matching";
import { isLocale } from "../../../i18n";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { token: string; locale: string; group: string; domain: string; query: string; filter: string; furthest?: boolean; original?: boolean } | null;
  if (typeof body?.token !== "string" || !isLocale(body.locale) || !["ideologies", "countries", "personalities"].includes(body.group) || !["all", "political", "social", "economic"].includes(body.domain) || typeof body.query !== "string" || body.query.length > 100 || !["all", "current", "historical", "politics", "philosophy", "science", "arts", "economics", "other"].includes(body.filter)) return NextResponse.json({ error: "Invalid search" }, { status: 400, headers: privateHeaders });
  const { DB: db, REPORT_ENCRYPTION_KEY: secret } = runtimeEnv;
  if (!db || !secret) return NextResponse.json({ error: "Unavailable" }, { status: 503, headers: privateHeaders });
  const access = await reportAccess(db, body.token, secret, body.original === true);
  if (!access || access.plan === "basic") return NextResponse.json({ error: "Report Plus required" }, { status: 403, headers: privateHeaders });
  return NextResponse.json({ profiles: exploreProfiles(access.axes, body.locale, body.group as ProfileGroup, body.domain as ProfileDomain, body.query, body.filter, body.furthest === true) }, { headers: privateHeaders });
}
