import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const axes = request.nextUrl.searchParams.get("axes")?.split(",").map(Number);
  const locale = request.nextUrl.searchParams.get("lang") === "pt" ? "pt" : "en";

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
