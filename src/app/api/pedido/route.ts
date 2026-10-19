import Stripe from "stripe";
import { NextResponse } from "next/server";
import { leerPago } from "@/lib/pedidosStripe";
import { guardaLimite } from "@/lib/limitePeticiones";

export const runtime = "nodejs";
export async function GET(req: Request) {
  const limit = guardaLimite(req, "receipt", 30, 60000);
  if (limit) return limit;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  try {
    const order = await leerPago(new Stripe(key), new URL(req.url).searchParams.get("session_id") || "");
    if (!order) return NextResponse.json({ error: "not_paid" }, { status: 409 });
    return NextResponse.json(order.recibo, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "unavailable" }, { status: 400 }); }
}
