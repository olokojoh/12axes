import { NextRequest, NextResponse } from "next/server";
import { runtimeEnv } from "../../../lib/runtime-env";
import { verifyStripeSignature, type StripeEvent, processStripeEvent } from "../../../lib/stripe-events";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  const { STRIPE_WEBHOOK_SECRET: secret, DB: db, REPORT_EMAIL_QUEUE: queue } = runtimeEnv;
  if (!secret || !db || !queue) return NextResponse.json({ error: "Webhook unavailable" }, { status: 503 });
  if (!signature || !await verifyStripeSignature(body, signature, secret)) return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  let event: StripeEvent;
  try { event = JSON.parse(body); } catch { return NextResponse.json({ error: "Invalid event" }, { status: 400 }); }
  if (!event.id || !event.type || !event.data?.object) return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  try {
    await processStripeEvent(event, db, queue);
    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "Please retry delivery" }, { status: 503 });
  }
}
