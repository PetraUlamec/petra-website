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
import { TEAS } from "@/data/teas";
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
  const vivo = await catalogoVivo();
  if (l.kind === "tea") {
    const tea = vivo.teas.find((item) => item.id === l.id) ?? TEAS.find((item) => item.id === l.id);
    return tea && Number.isFinite(tea.precio) && tea.precio > 0 ? { nombre: tea.nombre, precio: tea.precio } : null;
  }
  try {
    if (l.kind === "caja") { const c = cajaById(l.id); return { nombre: c.nombre, precio: precioCaja(c) }; }
    const e = extraById(l.id); return { nombre: e.nombre, precio: PRECIO_CUCHARA };
  } catch { /* no está en el catálogo del código: puede ser del taller */ }
  if (l.kind === "cuchara") {
    const e = vivo.extras.find((x) => x.id === l.id);
    if (e) return { nombre: e.nombre, precio: PRECIO_CUCHARA };
  }
  return null;
}

export async function POST(req: Request) {
  const tope = guardaLimite(req, "checkout", 30, 10 * 60 * 1000);
  if (tope) return tope;

  const key = process.env.STRIPE_SECRET_KEY;
  let body: { lines?: Linea[]; cupon?: string | null; email?: string; clasica?: boolean };
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

  if (!key) return NextResponse.json({ error: "Los pagos no están disponibles todavía." }, { status: 503 });
  if (key.startsWith("sk_live_") && (process.env.STRIPE_LIVE_ENABLED !== "true" || !process.env.STRIPE_WEBHOOK_SECRET || !process.env.PEDIDOS_EMAIL_TO || !process.env.RESEND_API_KEY))
    return NextResponse.json({ error: "La tienda todavía no ha activado los pagos reales." }, { status: 503 });
  const stripe = new Stripe(key);
  // La dirección de vuelta la manda el SERVIDOR, nunca la cabecera Origin del cliente.
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin).replace(/\/+$/, "");
  const line_items = resueltas.map((r) => ({
    quantity: r.qty,
    price_data: { currency: "eur", unit_amount: Math.round(r.precio * 100), product_data: { name: r.nombre } },
  }));
  const discounts = typeof cupon === "string" && /^[A-Za-z0-9_-]{1,40}$/.test(cupon) ? [{ coupon: cupon }] : undefined;
  try {
    const subtotal = resueltas.reduce((sum, item) => sum + Math.round(item.precio * 100) * item.qty, 0);
    let discount = 0;
    if (discounts) {
      const coupon = await stripe.coupons.retrieve(discounts[0].coupon);
      if (!coupon.valid || coupon.applies_to?.products?.length || (coupon.amount_off && coupon.currency !== "eur"))
        return NextResponse.json({ error: "Ese cupón no está disponible para esta compra." }, { status: 400 });
      discount = coupon.percent_off ? Math.round(subtotal * coupon.percent_off / 100) : Math.min(subtotal, coupon.amount_off || 0);
    }
    const shipping = subtotal - discount >= 5000 ? 0 : 490;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      metadata: { app: "petra" },
      customer_email: typeof body.email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim()) ? body.email.trim().slice(0, 320) : undefined,
      line_items,
      discounts,
      shipping_address_collection: { allowed_countries: paisesEnvio() },
      phone_number_collection: { enabled: true },
      shipping_options: [
        { shipping_rate_data: { display_name: "Delivery / Dostava / Envío", type: "fixed_amount", fixed_amount: { amount: shipping, currency: "eur" } } },
      ],
      success_url: `${base}/gracias?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}${body.clasica ? "/clasica/cesta" : "/carrito"}`,
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    // El detalle del fallo se queda en el servidor: al cliente, un mensaje genérico.
    console.error("[checkout] Stripe:", (e as Error).message);
    return NextResponse.json({ error: "No se ha podido iniciar el pago. Inténtalo de nuevo en un momento." }, { status: 400 });
  }
}
