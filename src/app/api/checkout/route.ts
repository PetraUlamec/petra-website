// CHECKOUT REAL PRECONFIGURADO (U5): con STRIPE_SECRET_KEY en .env.local crea una
// Stripe Checkout Session en modo test (tarjeta; PayPal se activa en el Dashboard de
// Stripe y aparece solo). SIN clave → responde {demo:true} y la tienda usa el modo demo.
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { teaById } from "@/data/teas";
import { cajaById } from "@/data/boxes";
import { precioCaja } from "@/lib/season";
import { extraById, PRECIO_CUCHARA } from "@/data/extras";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const key = process.env.STRIPE_SECRET_KEY;
  let body: { lines?: { kind: "tea" | "caja" | "cuchara"; id: string; qty: number }[]; cupon?: string | null };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "cuerpo no válido (se espera JSON)" }, { status: 400 });
  }
  const { lines, cupon } = body ?? {};
  if (!Array.isArray(lines) || lines.length === 0)
    return NextResponse.json({ error: "el carrito va vacío" }, { status: 400 });
  for (const l of lines) {
    if (!l || (l.kind !== "tea" && l.kind !== "caja" && l.kind !== "cuchara") || typeof l.id !== "string" || !Number.isInteger(l.qty) || l.qty <= 0)
      return NextResponse.json({ error: "línea del carrito no válida" }, { status: 400 });
    try {
      if (l.kind === "tea") teaById(l.id);
      else if (l.kind === "caja") cajaById(l.id);
      else extraById(l.id);
    } catch {
      return NextResponse.json({ error: `producto desconocido: ${l.id}` }, { status: 400 });
    }
  }
  if (!key) return NextResponse.json({ demo: true });
  const stripe = new Stripe(key);
  const origin = req.headers.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3111";
  const line_items = lines.map((l) => {
    const nombre = l.kind === "tea"
      ? teaById(l.id).nombre
      : l.kind === "caja"
        ? cajaById(l.id).nombre
        : extraById(l.id).nombre;
    const precio = l.kind === "tea"
      ? teaById(l.id).precio
      : l.kind === "caja"
        ? precioCaja(cajaById(l.id))
        : PRECIO_CUCHARA;
    return {
      quantity: l.qty,
      price_data: {
        currency: "eur",
        unit_amount: Math.round(precio * 100),
        product_data: { name: nombre },
      },
    };
  });
  // cupones nativos de Stripe: crea en el Dashboard cupones con estos IDs (PETRA10…)
  const discounts = cupon ? [{ coupon: cupon }] : undefined;
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      discounts,
      shipping_options: [
        { shipping_rate_data: { display_name: "Envío", type: "fixed_amount", fixed_amount: { amount: 490, currency: "eur" } } },
      ],
      success_url: `${origin}/gracias?paid=1`,
      cancel_url: `${origin}/carrito`,
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    return NextResponse.json({ error: String((e as Error).message).slice(0, 200) }, { status: 400 });
  }
}
