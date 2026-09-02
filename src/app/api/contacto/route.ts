// La carta del formulario clásico: si hay RESEND_API_KEY llega al correo de la casa; si no, demo.
// 2-sep-2026 (auditoría): sin límite se podía usar para spam masivo (quema la cuota de Resend
// y la reputación del dominio). Ahora: 5 cartas cada 15 min por IP, campos validados y
// recortados, y el correo del remitente comprobado antes de usarlo como reply_to.
import { NextResponse } from "next/server";
import { guardaLimite } from "@/lib/limitePeticiones";

export const runtime = "nodejs";
const EMAIL_OK = /^[^\s@]{1,64}@[^\s@]{1,255}\.[a-z]{2,}$/i;
const corta = (v: unknown, max: number) => String(v ?? "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, max);

export async function POST(req: Request) {
  const tope = guardaLimite(req, "contacto", 5, 15 * 60 * 1000);
  if (tope) return tope;
  let body: { nombre?: string; email?: string; mensaje?: string; consiente?: boolean };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "JSON no válido" }, { status: 400 }); }
  const nombre = corta(body.nombre, 120), email = corta(body.email, 320), mensaje = corta(body.mensaje, 5000);
  if (!nombre || !email || !mensaje)
    return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
  if (!EMAIL_OK.test(email))
    return NextResponse.json({ error: "El correo no tiene un formato válido" }, { status: 400 });
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
          reply_to: email,
          subject: `Carta de ${nombre} (web)`,
          text: `${mensaje}\n\n— ${nombre} <${email}>`,
        }),
      });
    } catch { /* no romper el formulario por el correo */ }
  }
  return NextResponse.json({ ok: true, demo: !key });
}
