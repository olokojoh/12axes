import { NextRequest, NextResponse } from "next/server";
import { encryptPayload, hashToken, randomToken } from "../../lib/secure-payload";
import { runtimeEnv } from "../../lib/runtime-env";
import { privateHeaders, validResult } from "../../lib/billing-input";
import { matchResult } from "../../lib/matching";

const checkoutTerms = {
  en: "I agree to the [12Axes Terms]({terms}) and [Refund Policy]({refund}).",
  pt: "Concordo com os [Termos do 12Axes]({terms}) e a [Política de Reembolso]({refund}).",
  es: "Acepto los [Términos de 12Axes]({terms}) y la [Política de Reembolsos]({refund}).",
  ru: "Я принимаю [Условия 12Axes]({terms}) и [Политику возврата]({refund}).",
  zh: "我同意 [12Axes 使用条款]({terms})和[退款政策]({refund})。",
};

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!validResult(body) || (body as typeof body & { consent?: boolean }).consent !== true) return NextResponse.json({ error: "Invalid request or missing report consent" }, { status: 400 });
  const { STRIPE_SECRET_KEY: secret, REPORT_ENCRYPTION_KEY: encryptionKey, DB: db } = runtimeEnv;
  const price = {
    en: runtimeEnv.STRIPE_PRICE_ID,
    pt: runtimeEnv.STRIPE_PRICE_ID_PT,
    es: runtimeEnv.STRIPE_PRICE_ID_ES,
    ru: runtimeEnv.STRIPE_PRICE_ID_RU,
    zh: runtimeEnv.STRIPE_PRICE_ID_ZH,
  }[body.locale];
  if (!secret || !price || !encryptionKey || !db || !runtimeEnv.REPORT_EMAIL_QUEUE) {
    return NextResponse.json({ error: "Checkout is not available yet" }, { status: 503, headers: privateHeaders });
  }
  const result = matchResult(body.axes, body.locale);

  const orderId = crypto.randomUUID();
  const token = randomToken();
  const now = Math.floor(Date.now() / 1000);
  const payload = await encryptPayload({ axes: body.axes, result, quizLength: body.quizLength }, encryptionKey);
  const tokenPayload = await encryptPayload({ token }, encryptionKey);
  await db.prepare("INSERT INTO orders (id, token_hash, token_payload, status, payload, locale, variant, quiz_length, created_at, updated_at) VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?)")
    .bind(orderId, await hashToken(token), tokenPayload, payload, body.locale, body.variant, body.quizLength, now, now).run();
  const base = runtimeEnv.PUBLIC_BASE_URL ?? new URL(request.url).origin;
  const prefix = body.locale === "en" ? "" : "/" + body.locale;
  const path = prefix + "/results";
  const terms = checkoutTerms[body.locale].replace("{terms}", base + prefix + "/terms").replace("{refund}", base + prefix + "/refund");
  const params = new URLSearchParams({
    mode: "payment",
    locale: body.locale,
    success_url: base + path + "?paid=1#report=" + token,
    cancel_url: base + path + "?cancelled=1#report=" + token,
    "line_items[0][price]": price,
    "line_items[0][quantity]": "1",
    "payment_method_types[0]": "card",
    "wallet_options[link][display]": "never",
    "metadata[order_id]": orderId,
    "payment_intent_data[metadata][order_id]": orderId,
    "payment_intent_data[statement_descriptor_suffix]": "12AXES",
    "consent_collection[terms_of_service]": "required",
    "custom_text[terms_of_service_acceptance][message]": terms,
  });
  try {
    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST", headers: { authorization: "Bearer " + secret, "content-type": "application/x-www-form-urlencoded", "idempotency-key": "checkout/" + orderId }, body: params,
    });
    const session = await response.json() as { id?: string; url?: string };
    if (!response.ok || !session.id || !session.url) throw new Error("Checkout unavailable");
    await db.prepare("UPDATE orders SET checkout_session_id = ?, updated_at = ? WHERE id = ?").bind(session.id, now, orderId).run();
    return NextResponse.json({ url: session.url }, { headers: privateHeaders });
  } catch {
    await db.prepare("UPDATE orders SET status = 'failed', updated_at = ? WHERE id = ?").bind(now, orderId).run();
    return NextResponse.json({ error: "Checkout unavailable. Please try again." }, { status: 502, headers: privateHeaders });
  }
}
