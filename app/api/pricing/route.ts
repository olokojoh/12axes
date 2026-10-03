import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch("https://api.frankfurter.dev/v1/latest?base=USD&symbols=BRL", { cf: { cacheTtl: 21600, cacheEverything: true }, signal: AbortSignal.timeout(5000) });
    const data = await response.json() as { date?: string; rates?: { BRL?: number } };
    const age = Date.now() - Date.parse(data.date ?? "");
    if (!response.ok || !Number.isFinite(data.rates?.BRL) || (data.rates?.BRL ?? 0) <= 0 || !Number.isFinite(age) || age < -86400000 || age > 7 * 86400000) throw new Error("Unavailable rate");
    return NextResponse.json({ brl: 4.99 * data.rates!.BRL!, date: data.date });
  } catch {
    return NextResponse.json({ error: "Exchange rate unavailable" }, { status: 503 });
  }
}
