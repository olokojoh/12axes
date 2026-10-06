import { NextRequest, NextResponse } from "next/server";
import { reportAccess, planAmounts, type ReportPlan } from "../../lib/report-access";
import { decryptPayload, encryptPayload, hashToken, randomToken } from "../../lib/secure-payload";
import { runtimeEnv } from "../../lib/runtime-env";
import { privateHeaders, validResult, type ResultInput } from "../../lib/billing-input";
import { matchResult } from "../../lib/matching";

import { validEvidence, evidenceAxes, type QuizEvidence } from "../../lib/quiz-evidence";

const checkoutTerms = {
  en: "I agree to the [12Axes Terms]({terms}) and [Refund Policy]({refund}).",
  pt: "Concordo com os [Termos do 12Axes]({terms}) e a [Política de Reembolso]({refund}).",
  es: "Acepto los [Términos de 12Axes]({terms}) y la [Política de Reembolsos]({refund}).",
  ru: "Я принимаю [Условия 12Axes]({terms}) и [Политику возврата]({refund}).",
  zh: "我同意 [12Axes 使用条款]({terms})和[退款政策]({refund})。",
};

export async function POST(request: NextRequest) {
  const input = await request.json().catch(() => null);
  const body = input as ResultInput & { consent?: boolean; plan?: string; upgradeToken?: string; evidence?: QuizEvidence; answerConsent?: boolean };
  if (!validResult(body) || (body as typeof body & { consent?: boolean }).consent !== true) return NextResponse.json({ error: "Invalid request or missing report consent" }, { status: 400, headers: privateHeaders });
  const { STRIPE_SECRET_KEY: secret, REPORT_ENCRYPTION_KEY: encryptionKey, DB: db } = runtimeEnv;
  const plan = (body.plan ?? "basic") as ReportPlan;
  if (!["basic", "plus", "deep"].includes(plan) || (body.upgradeToken !== undefined && (typeof body.upgradeToken !== "string" || !body.upgradeToken.trim() || plan === "basic"))) return NextResponse.json({ error: "Invalid plan" }, { status: 400, headers: privateHeaders });
  if (plan === "deep") {
    if (body.answerConsent !== true || !validEvidence(body.evidence) || body.evidence.questionIds.length !== body.quizLength) return NextResponse.json({ error: "Complete a fresh quiz and consent to answer storage before buying Deep" }, { status: 400, headers: privateHeaders });
    const scored = evidenceAxes(body.evidence);
    if (scored.some((value, index) => value !== body.axes[index])) return NextResponse.json({ error: "Answers do not match the result" }, { status: 400, headers: privateHeaders });
  }
  if (!secret || !encryptionKey || !db || !runtimeEnv.REPORT_EMAIL_QUEUE) {
    return NextResponse.json({ error: "Checkout is not available yet" }, { status: 503, headers: privateHeaders });
  }
  let parentOrderId: string | null = null;
  let dependencyOrderId: string | null = null;
  let amount = planAmounts[plan];
  if (body.upgradeToken) {
    const access = await reportAccess(db, body.upgradeToken, encryptionKey);
    const sessionPrefix = /^(sk|rk)_test_/.test(secret) ? "cs_test_" : "cs_live_";
    if (!access || planAmounts[access.plan] >= planAmounts[plan] || !access.root.checkout_session_id?.startsWith(sessionPrefix)) return NextResponse.json({ error: "An eligible paid report in this environment is required" }, { status: 409, headers: privateHeaders });
    parentOrderId = access.root.id;
    dependencyOrderId = access.entitlement.id;
    amount -= planAmounts[access.plan];
    if (plan !== "deep") {
      body.axes = access.axes;
      body.quizLength = access.quizLength;
    }
    const existing = await db.prepare("SELECT id, plan, payload, expected_amount, dependency_order_id, checkout_session_id FROM orders WHERE parent_order_id = ? AND status = 'pending'").bind(parentOrderId).first<{ id: string; plan: string; payload: string; expected_amount: number; dependency_order_id: string | null; checkout_session_id: string | null }>();
    if (existing) {
      if (!existing.checkout_session_id) return NextResponse.json({ error: "Upgrade is being prepared" }, { status: 409, headers: privateHeaders });
      const priorEvidence = plan === "deep" ? (await decryptPayload<{ evidence?: QuizEvidence }>(existing.payload, encryptionKey)).evidence : undefined;
      const sameEvidence = priorEvidence?.version === body.evidence?.version && JSON.stringify(priorEvidence?.questionIds) === JSON.stringify(body.evidence?.questionIds) && JSON.stringify(priorEvidence?.answers) === JSON.stringify(body.evidence?.answers);
      const sameResult = existing.expected_amount === amount && existing.dependency_order_id === dependencyOrderId && (plan !== "deep" || sameEvidence);
      const response = await fetch("https://api.stripe.com/v1/checkout/sessions/" + existing.checkout_session_id, { headers: { authorization: "Bearer " + secret } });
      const session = await response.json() as { status?: string; url?: string };
      if (response.ok && session.status === "open" && session.url && existing.plan === plan && sameResult) return NextResponse.json({ url: session.url }, { headers: privateHeaders });
      if (response.ok && session.status === "open" && (existing.plan !== plan || !sameResult)) {
        const expired = await fetch("https://api.stripe.com/v1/checkout/sessions/" + existing.checkout_session_id + "/expire", { method: "POST", headers: { authorization: "Bearer " + secret } });
        if (expired.ok) session.status = "expired";
      }
      if (response.status !== 404 && (!response.ok || session.status !== "expired")) return NextResponse.json({ error: "Payment confirmation pending" }, { status: 409, headers: privateHeaders });
      await db.prepare("UPDATE orders SET status = 'failed' WHERE id = ? AND status = 'pending'").bind(existing.id).run();
    }
  }
  const prefixKey = plan === "deep" ? (parentOrderId ? amount === 500 ? "STRIPE_DEEP_PLUS_UPGRADE_PRICE_ID" : "STRIPE_DEEP_BASIC_UPGRADE_PRICE_ID" : "STRIPE_DEEP_PRICE_ID") : parentOrderId ? "STRIPE_UPGRADE_PRICE_ID" : plan === "plus" ? "STRIPE_PLUS_PRICE_ID" : "STRIPE_PRICE_ID";
  const priceKey = prefixKey + (body.locale === "en" ? "" : "_" + body.locale.toUpperCase());
  const price = (runtimeEnv as unknown as Record<string, string>)[priceKey];
  if (!price) return NextResponse.json({ error: "Checkout is not configured" }, { status: 503, headers: privateHeaders });
  const result = matchResult(body.axes, body.locale);

  const orderId = crypto.randomUUID();
  const token = randomToken();
  const now = Math.floor(Date.now() / 1000);
  const payload = await encryptPayload({ axes: body.axes, result, quizLength: body.quizLength, ...(plan === "deep" ? { evidence: body.evidence } : {}) }, encryptionKey);
  const tokenPayload = await encryptPayload({ token }, encryptionKey);
  const base = runtimeEnv.PUBLIC_BASE_URL;
  if (!base || !["https://12axes.net", "https://dev.12axes-1dg.pages.dev"].includes(base)) return NextResponse.json({ error: "Checkout is not configured" }, { status: 503, headers: privateHeaders });
  try {
    await db.prepare("INSERT INTO orders (id, token_hash, token_payload, status, payload, locale, variant, quiz_length, created_at, updated_at, plan, parent_order_id, expected_amount, delivery_base_url, dependency_order_id) VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .bind(orderId, await hashToken(token), tokenPayload, payload, body.locale, body.variant, body.quizLength, now, now, plan, parentOrderId, amount, base, dependencyOrderId).run();
  } catch (error) {
    if (parentOrderId && String(error).includes("UNIQUE constraint")) return NextResponse.json({ error: "Checkout is already being prepared. Please retry." }, { status: 409, headers: privateHeaders });
    throw error;
  }
  const prefix = body.locale === "en" ? "" : "/" + body.locale;
  const path = prefix + "/results";
  const terms = checkoutTerms[body.locale].replace("{terms}", base + prefix + "/terms").replace("{refund}", base + prefix + "/refund");
  const params = new URLSearchParams({
    mode: "payment",
    "adaptive_pricing[enabled]": "false",
    locale: body.locale,
    success_url: base + path + "?paid=1#report=" + (body.upgradeToken || token),
    cancel_url: base + path + "?cancelled=1#report=" + (body.upgradeToken || token),
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
    const session = await response.json() as { id?: string; url?: string; amount_total?: number; currency?: string; livemode?: boolean };
    if (!response.ok || !session.id || !session.url) throw new Error("Checkout unavailable");
    if (session.amount_total !== amount || session.currency !== "usd" || session.livemode !== /^(sk|rk)_live_/.test(secret)) {
      await fetch("https://api.stripe.com/v1/checkout/sessions/" + session.id + "/expire", { method: "POST", headers: { authorization: "Bearer " + secret } });
      throw new Error("Checkout price configuration mismatch");
    }
    await db.prepare("UPDATE orders SET checkout_session_id = ?, updated_at = ? WHERE id = ?").bind(session.id, now, orderId).run();
    return NextResponse.json({ url: session.url }, { headers: privateHeaders });
  } catch {
    await db.prepare("UPDATE orders SET status = 'failed', updated_at = ? WHERE id = ? AND status = 'pending'").bind(now, orderId).run();
    return NextResponse.json({ error: "Checkout unavailable. Please try again." }, { status: 502, headers: privateHeaders });
  }
}
