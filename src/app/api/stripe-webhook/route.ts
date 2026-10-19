import Stripe from "stripe";
import { NextResponse } from "next/server";
import { confirmarPedido } from "@/lib/pedidosStripe";

export const runtime = "nodejs";
export async function POST(req: Request) {
  const key = process.env.STRIPE_SECRET_KEY, secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!key || !secret) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  const stripe = new Stripe(key);
  let event: Stripe.Event;
  try { event = stripe.webhooks.constructEvent(await req.text(), req.headers.get("stripe-signature") || "", secret); }
  catch { return NextResponse.json({ error: "invalid_signature" }, { status: 400 }); }
  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    if (event.data.object.metadata?.app !== "petra") return NextResponse.json({ received: true });
    try { await confirmarPedido(stripe, event.data.object.id); }
    catch { console.error("[stripe-webhook] fulfillment failed; retry required"); return NextResponse.json({ error: "retry" }, { status: 500 }); }
  }
  return NextResponse.json({ received: true });
}
