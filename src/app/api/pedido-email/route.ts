// RECIBO-ENTRADA POR CORREO: con RESEND_API_KEY envía el recibo (entrada nº + líneas + la
// cuchara revelada + frase) desde el correo de la casa. SIN clave → no-op {demo:true}.
//
// 2-sep-2026 (auditoría). Esto era lo más peligroso de la web: la ruta estaba abierta, el
// destinatario lo elegía quien llamara y TODOS los textos se metían en el HTML sin escapar.
// Es decir: cualquiera podía mandar a cualquier víctima un correo con enlaces suyos, firmado
// con el dominio y el diseño de Petra (phishing), y de paso quemar la cuota de Resend y la
// reputación del dominio. Cambios:
//   1. Todo texto se ESCAPA antes de entrar en el HTML (ya no se pueden colar etiquetas).
//   2. Límite por IP: 5 recibos cada 15 minutos.
//   3. Se valida la forma del pedido (antes un cuerpo raro tumbaba la ruta con un 500).
//   4. El correo del cliente se valida y se recorta.
// PENDIENTE (cuando haya Stripe de verdad): disparar el recibo desde el webhook de pago
// confirmado, no desde una llamada del navegador. Es la única forma de cerrarlo del todo.
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { guardaLimite } from "@/lib/limitePeticiones";

export const runtime = "nodejs";

interface Linea { nombre: string; qty: number; precio: number }
interface Pedido {
  email?: string; entrada: string; fecha: string; lineas: Linea[];
  sub: number; disc: number; ship: number; total: number;
  cupon: string | null; cuchara?: { nombre: string; historia: string } | null; frase?: string;
}

/** Convierte texto en texto INERTE para HTML: ningún dato del cliente puede ser una etiqueta. */
const esc = (v: unknown): string =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const num = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : 0);
const eur = (v: unknown) => num(v).toFixed(2);
const EMAIL_OK = /^[^\s@]{1,64}@[^\s@]{1,255}\.[a-z]{2,}$/i;

export async function POST(req: Request) {
  const tope = guardaLimite(req, "correo", 5, 15 * 60 * 1000);
  if (tope) return tope;

  let p: Pedido;
  try { p = (await req.json()) as Pedido; }
  catch { return NextResponse.json({ error: "cuerpo no válido (se espera JSON)" }, { status: 400 }); }
  if (!p || typeof p !== "object") return NextResponse.json({ error: "pedido no válido" }, { status: 400 });

  const key = process.env.RESEND_API_KEY;
  const email = String(p.email ?? "").trim().slice(0, 320);
  if (!key || !email) return NextResponse.json({ demo: true });
  if (!EMAIL_OK.test(email)) return NextResponse.json({ error: "correo no válido" }, { status: 400 });

  const lineas: Linea[] = Array.isArray(p.lineas) ? p.lineas.slice(0, 100) : [];
  const entrada = esc(String(p.entrada ?? "").slice(0, 40));
  let fecha = "";
  try { fecha = new Date(p.fecha).toLocaleString("es-ES"); } catch { fecha = ""; }

  const filas = lineas
    .map((l) => `<tr><td>${num(l?.qty)} × ${esc(String(l?.nombre ?? "").slice(0, 120))}</td><td align="right">${eur(num(l?.precio) * num(l?.qty))} €</td></tr>`)
    .join("");
  const cuchara = p.cuchara
    ? `<div style="border:1px dashed #c98a3b;border-radius:8px;padding:10px;margin-top:12px">
      <b>🥄 El secreto de la ?</b><br/>${esc(String(p.cuchara.nombre ?? "").slice(0, 120))}<br/><small>${esc(String(p.cuchara.historia ?? "").slice(0, 600))}</small></div>`
    : "";
  const html = `<div style="font-family:Georgia,serif;max-width:480px;margin:auto;background:#fbf3e4;padding:24px;border-radius:12px;color:#2e2013">
    <p style="text-align:center;letter-spacing:4px;font-size:11px">ENTRADA A LA CASA DE TÉ</p>
    <h2 style="text-align:center;margin:4px 0">Petra &amp; Erik · Casa de Té</h2>
    <p style="text-align:center;font-size:12px;opacity:.7">${entrada} · ${esc(fecha)}</p>
    <table width="100%" style="font-size:14px;border-collapse:collapse">${filas}</table>
    <hr style="border:none;border-top:1px dashed #c98a3b"/>
    <table width="100%" style="font-size:14px"><tr><td>Subtotal</td><td align="right">${eur(p.sub)} €</td></tr>
    ${num(p.disc) ? `<tr><td>Descuento (${esc(String(p.cupon ?? "").slice(0, 40))})</td><td align="right">−${eur(p.disc)} €</td></tr>` : ""}
    <tr><td>Envío</td><td align="right">${num(p.ship) ? eur(p.ship) + " €" : "Gratis"}</td></tr>
    <tr><td><b>Total</b></td><td align="right"><b>${eur(p.total)} €</b></td></tr></table>
    ${cuchara}
    <p style="text-align:center;font-style:italic;margin-top:16px">“${esc(String(p.frase ?? "La puerta queda abierta: vuelve cuando quieras.").slice(0, 300))}”</p>
    <p style="text-align:center">🍃</p></div>`;

  try {
    const resend = new Resend(key);
    const { error } = await resend.emails.send({
      from: process.env.PEDIDOS_EMAIL_FROM ?? "Petra & Erik <onboarding@resend.dev>",
      to: email,
      subject: `Tu entrada a la Casa de Té — ${entrada}`,
      html,
      headers: { "X-Entity-Ref-ID": entrada },
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ enviado: true });
  } catch (e) {
    return NextResponse.json({ error: String((e as Error).message).slice(0, 200) }, { status: 400 });
  }
}
