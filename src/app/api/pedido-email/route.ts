// RECIBO-ENTRADA POR CORREO PRECONFIGURADO (U5): con RESEND_API_KEY envía el recibo
// (entrada nº + líneas + la cuchara ? revelada + frase) desde el correo de la casa.
// SIN clave → no-op {demo:true}. Idempotencia por nº de entrada.
import { NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";

interface Pedido {
  email?: string;
  entrada: string;
  fecha: string;
  lineas: { nombre: string; qty: number; precio: number }[];
  sub: number; disc: number; ship: number; total: number;
  cupon: string | null;
  cuchara?: { nombre: string; historia: string } | null;
  frase?: string;
}

export async function POST(req: Request) {
  const key = process.env.RESEND_API_KEY;
  const p = (await req.json()) as Pedido;
  if (!key || !p.email) return NextResponse.json({ demo: true });
  const resend = new Resend(key);
  const filas = p.lineas.map((l) => `<tr><td>${l.qty} × ${l.nombre}</td><td align="right">${(l.precio * l.qty).toFixed(2)} €</td></tr>`).join("");
  const cuchara = p.cuchara ? `<div style="border:1px dashed #c98a3b;border-radius:8px;padding:10px;margin-top:12px">
      <b>🥄 El secreto de la ?</b><br/>${p.cuchara.nombre}<br/><small>${p.cuchara.historia}</small></div>` : "";
  const html = `<div style="font-family:Georgia,serif;max-width:480px;margin:auto;background:#fbf3e4;padding:24px;border-radius:12px;color:#2e2013">
    <p style="text-align:center;letter-spacing:4px;font-size:11px">ENTRADA A LA CASA DE TÉ</p>
    <h2 style="text-align:center;margin:4px 0">Petra &amp; Erik · Casa de Té</h2>
    <p style="text-align:center;font-size:12px;opacity:.7">${p.entrada} · ${new Date(p.fecha).toLocaleString("es-ES")}</p>
    <table width="100%" style="font-size:14px;border-collapse:collapse">${filas}</table>
    <hr style="border:none;border-top:1px dashed #c98a3b"/>
    <table width="100%" style="font-size:14px"><tr><td>Subtotal</td><td align="right">${p.sub.toFixed(2)} €</td></tr>
    ${p.disc ? `<tr><td>Descuento (${p.cupon})</td><td align="right">−${p.disc.toFixed(2)} €</td></tr>` : ""}
    <tr><td>Envío</td><td align="right">${p.ship ? p.ship.toFixed(2) + " €" : "Gratis"}</td></tr>
    <tr><td><b>Total</b></td><td align="right"><b>${p.total.toFixed(2)} €</b></td></tr></table>
    ${cuchara}
    <p style="text-align:center;font-style:italic;margin-top:16px">“${p.frase ?? "La puerta queda abierta: vuelve cuando quieras."}”</p>
    <p style="text-align:center">🍃</p></div>`;
  try {
    const { error } = await resend.emails.send({
      from: process.env.PEDIDOS_EMAIL_FROM ?? "Petra & Erik <onboarding@resend.dev>",
      to: p.email,
      subject: `Tu entrada a la Casa de Té — ${p.entrada}`,
      html,
      headers: { "X-Entity-Ref-ID": p.entrada },
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ enviado: true });
  } catch (e) {
    return NextResponse.json({ error: String((e as Error).message).slice(0, 200) }, { status: 400 });
  }
}
