import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch("https://open.er-api.com/v6/latest/USD", { cf: { cacheTtl: 21600, cacheEverything: true }, signal: AbortSignal.timeout(5000) });
    const data = await response.json() as { result?: string; base_code?: string; time_last_update_unix?: number; rates?: Record<string, number> };
    const timestamp = (data.time_last_update_unix ?? NaN) * 1000;
    const age = Date.now() - timestamp;
    const codes = ["BRL", "EUR", "RUB", "CNY"];
    if (!response.ok || data.result !== "success" || data.base_code !== "USD" || !Number.isFinite(age) || age < -86400000 || age > 7 * 86400000 || codes.some(code => !Number.isFinite(data.rates?.[code]) || data.rates![code] <= 0)) throw new Error("Unavailable rate");
    return NextResponse.json({ rates: Object.fromEntries(codes.map(code => [code, data.rates![code]])), date: new Date(timestamp).toISOString().slice(0, 10) });
  } catch {
    return NextResponse.json({ error: "Exchange rate unavailable" }, { status: 503 });
  }
}
