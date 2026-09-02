// CHECKOUT REAL: con STRIPE_SECRET_KEY crea una Stripe Checkout Session (tarjeta; PayPal se
// activa en el Dashboard de Stripe y aparece solo). SIN clave → {demo:true} y la tienda usa
// el modo demo.
//
// 2-sep-2026 (auditoría). Cambios:
//  1. La dirección de vuelta ya NO sale de la cabecera `Origin` que manda el cliente: un
//     atacante podía hacer que, tras pagar de verdad, el comprador aterrizara en su web falsa.
//     Ahora se usa NEXT_PUBLIC_SITE_URL (o la propia dirección del servidor).
//  2. Tope de unidades por línea (antes pasaba qty = 1.000.000.000).
//  3. Los tés y extras publicados desde el taller YA SE PUEDEN COMPRAR: el servidor lee el
//     catálogo vivo del disco (antes solo miraba el catálogo del código y respondía
//     «producto desconocido»).
//  4. Stripe pide dirección de envío y teléfono: sin eso Petra no sabía a dónde mandar el té.
// PENDIENTE (requiere la cuenta de Stripe de SER): webhook `checkout.session.completed` para
// confirmar el pago en el servidor y disparar el recibo.
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { teaById } from "@/data/teas";
import { cajaById } from "@/data/boxes";
import { precioCaja } from "@/lib/season";
import { extraById, PRECIO_CUCHARA } from "@/data/extras";
import { catalogoVivo } from "@/lib/catalogoServidor";
import { guardaLimite } from "@/lib/limitePeticiones";

export const runtime = "nodejs";

const MAX_UNIDADES = 99;
const MAX_LINEAS = 50;
type Kind = "tea" | "caja" | "cuchara";
interface Linea { kind: Kind; id: string; qty: number }

/** Países a los que se envía. Configurable con ENVIO_PAISES="ES,SI,IT"; por defecto, la UE. */
function paisesEnvio(): Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[] {
  const env = process.env.ENVIO_PAISES;
  const lista = (env ? env.split(",") : [
    "SI","ES","IT","AT","HR","DE","FR","PT","NL","BE","LU","IE","DK","SE","FI","PL","CZ","SK","HU","RO","BG","GR","EE","LV","LT","CY","MT",
  ]).map((c) => c.trim().toUpperCase()).filter(Boolean);
  return lista as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[];
}

/** Precio y nombre los decide SIEMPRE el servidor: el cliente solo dice qué y cuánto. */
async function resolver(l: Linea): Promise<{ nombre: string; precio: number } | null> {
  try {
    if (l.kind === "tea") { const t = teaById(l.id); return { nombre: t.nombre, precio: t.precio }; }
    if (l.kind === "caja") { const c = cajaById(l.id); return { nombre: c.nombre, precio: precioCaja(c) }; }
    const e = extraById(l.id); return { nombre: e.nombre, precio: PRECIO_CUCHARA };
  } catch { /* no está en el catálogo del código: puede ser del taller */ }
  const vivo = await catalogoVivo();
  if (l.kind === "tea") {
    const t = vivo.teas.find((x) => x.id === l.id);
    if (t && Number.isFinite(t.precio) && t.precio > 0) return { nombre: t.nombre, precio: t.precio };
  } else if (l.kind === "cuchara") {
    const e = vivo.extras.find((x) => x.id === l.id);
    if (e) return { nombre: e.nombre, precio: PRECIO_CUCHARA };
  }
  return null;
}

export async function POST(req: Request) {
  const tope = guardaLimite(req, "checkout", 30, 10 * 60 * 1000);
  if (tope) return tope;

  const key = process.env.STRIPE_SECRET_KEY;
  let body: { lines?: Linea[]; cupon?: string | null };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "cuerpo no válido (se espera JSON)" }, { status: 400 });
  }
  const { lines, cupon } = body ?? {};
  if (!Array.isArray(lines) || lines.length === 0)
    return NextResponse.json({ error: "el carrito va vacío" }, { status: 400 });
  if (lines.length > MAX_LINEAS)
    return NextResponse.json({ error: "demasiadas líneas en el carrito" }, { status: 400 });

  const resueltas: { nombre: string; precio: number; qty: number }[] = [];
  for (const l of lines) {
    if (!l || (l.kind !== "tea" && l.kind !== "caja" && l.kind !== "cuchara") || typeof l.id !== "string" || l.id.length > 200
        || !Number.isInteger(l.qty) || l.qty <= 0 || l.qty > MAX_UNIDADES)
      return NextResponse.json({ error: "línea del carrito no válida" }, { status: 400 });
    const r = await resolver(l);
    if (!r) return NextResponse.json({ error: `producto desconocido: ${l.id}` }, { status: 400 });
    resueltas.push({ ...r, qty: l.qty });
  }

  if (!key) return NextResponse.json({ demo: true });
  const stripe = new Stripe(key);
  // La dirección de vuelta la manda el SERVIDOR, nunca la cabecera Origin del cliente.
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin).replace(/\/+$/, "");
  const line_items = resueltas.map((r) => ({
    quantity: r.qty,
    price_data: { currency: "eur", unit_amount: Math.round(r.precio * 100), product_data: { name: r.nombre } },
  }));
  const discounts = typeof cupon === "string" && /^[A-Za-z0-9_-]{1,40}$/.test(cupon) ? [{ coupon: cupon }] : undefined;
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      discounts,
      shipping_address_collection: { allowed_countries: paisesEnvio() },
      phone_number_collection: { enabled: true },
      shipping_options: [
        { shipping_rate_data: { display_name: "Envío", type: "fixed_amount", fixed_amount: { amount: 490, currency: "eur" } } },
      ],
      success_url: `${base}/gracias?paid=1`,
      cancel_url: `${base}/carrito`,
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    // El detalle del fallo se queda en el servidor: al cliente, un mensaje genérico.
    console.error("[checkout] Stripe:", (e as Error).message);
    return NextResponse.json({ error: "No se ha podido iniciar el pago. Inténtalo de nuevo en un momento." }, { status: 400 });
  }
}
