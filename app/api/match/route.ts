import { NextRequest, NextResponse } from "next/server";

// The upstream match service only localizes result copy for these languages.
const upstreamLangs = new Set(["en", "pt"]);

export async function GET(request: NextRequest) {
  const axes = request.nextUrl.searchParams.get("axes")?.split(",").map(Number);
  const requested = request.nextUrl.searchParams.get("lang") ?? "en";
  const locale = upstreamLangs.has(requested) ? requested : "en";

  if (!axes || axes.length !== 12 || axes.some((value) => !Number.isFinite(value) || value < 0 || value > 100)) {
    return NextResponse.json({ error: "Invalid axes" }, { status: 400 });
  }

  const url = new URL("https://one2axes-backend.onrender.com/api/results/by-axes");
  url.searchParams.set("v", axes.join(","));
  url.searchParams.set("lang", locale);
  const response = await fetch(url, { cache: "no-store" });
  return new NextResponse(await response.text(), {
    status: response.status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
