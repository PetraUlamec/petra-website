// La carta del formulario clásico: si hay RESEND_API_KEY llega al correo de la casa; si no, demo.
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  let body: { nombre?: string; email?: string; mensaje?: string; consiente?: boolean };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "JSON no válido" }, { status: 400 }); }
  if (!body.nombre || !body.email || !body.mensaje)
    return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
  // RGPD: sin consentimiento explícito no se trata el dato (la casilla del formulario es obligatoria)
  if (body.consiente !== true)
    return NextResponse.json({ error: "Falta el consentimiento de privacidad" }, { status: 400 });
  const key = process.env.RESEND_API_KEY;
  if (key) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: process.env.PEDIDOS_EMAIL_FROM ?? "tienda@petra-erik.local",
          to: process.env.PEDIDOS_EMAIL_FROM ?? "tienda@petra-erik.local",
          reply_to: body.email,
          subject: `Carta de ${body.nombre} (web)`,
          text: `${body.mensaje}\n\n— ${body.nombre} <${body.email}>`,
        }),
      });
    } catch { /* no romper el formulario por el correo */ }
  }
  return NextResponse.json({ ok: true, demo: !key });
}
