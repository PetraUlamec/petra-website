"use client";
// Vista previa del RECIBO (VISION §6): esto es lo que llegará por correo desde la dirección
// de la casa (Resend + dominio propio) cuando la tienda esté conectada.
import { useEffect, useState } from "react";
import Link from "next/link";
import { useT, useLang } from "@/i18n";
import { eur } from "@/lib/format";

interface Receipt {
  metodo: string; fecha: string; cupon: string | null;
  entrada?: string;
  lineas: { nombre: string; qty: number; precio: number }[];
  sub: number; disc: number; ship: number; total: number;
  cuchara?: { nombre: string; historia: string } | null;
  fraseIdx?: number;
}

export default function ReceiptView() {
  const T = useT();
  const { lang } = useLang();
  const LOCALE = { es: "es-ES", en: "en-GB", sl: "sl-SI" }[lang];
  const [r, setR] = useState<Receipt | null | "none">(null);
  useEffect(() => {
    let receipt: Receipt | null = null;
    try {
      const raw = sessionStorage.getItem("petra-last-order");
      receipt = raw ? (JSON.parse(raw) as Receipt) : null;
    } catch { receipt = null; }
    setR(receipt ?? "none");
    if (!receipt) return;

    // 2-sep-2026 (auditoría, fallo funcional): con Stripe de verdad el navegador se va a pagar
    // y vuelve aquí con ?paid=1. ESE es el momento de mandar el recibo por correo (antes no se
    // mandaba nunca en pago real). La marca «correo-enviado» evita mandarlo dos veces.
    const pagado = new URLSearchParams(window.location.search).get("paid") === "1";
    if (!pagado) return;
    let correo = "", yaEnviado = "";
    try {
      correo = sessionStorage.getItem("petra-last-email") ?? "";
      yaEnviado = sessionStorage.getItem("petra-correo-enviado") ?? "";
    } catch { /* sin almacenamiento */ }
    if (!correo || yaEnviado === receipt.entrada) return;
    try { sessionStorage.setItem("petra-correo-enviado", receipt.entrada ?? ""); } catch { /* sin almacenamiento */ }
    const frases = T.gracias.bienvenidas;
    fetch("/api/pedido-email", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...receipt, email: correo, frase: frases[(receipt.fraseIdx ?? 0) % frases.length] }),
    }).catch(() => {});
  }, [T]);

  return (
    <main className="fixed inset-0 overflow-y-auto bg-[var(--madera-oscura)] pt-14 pb-8 px-4">
      <div className="max-w-md mx-auto">
        <h1 className="font-display text-3xl text-[var(--crema)] text-center drop-shadow">{T.gracias.titulo}</h1>
        <p className="text-sm text-[var(--crema)]/80 text-center mt-2">{T.gracias.cuerpo}</p>

        {r && r !== "none" ? (
          <div className="panel mt-6 p-5 float-in font-mono text-sm">
            <div className="text-center text-[10px] tracking-[0.35em] opacity-70">{T.gracias.entrada}</div>
            <div className="text-center font-display text-lg not-italic">{T.marca} · {T.tienda}</div>
            <div className="text-center text-xs opacity-60 mt-0.5">
              {r.entrada ? `${T.gracias.pedidoNum} ${r.entrada} · ` : ""}{new Date(r.fecha).toLocaleString(LOCALE)}
            </div>
            <hr className="my-3 border-[var(--madera)]/30 border-dashed" />
            {r.lineas.map((l, i) => (
              <div key={i} className="flex justify-between gap-2">
                <span className="truncate">{l.qty} × {l.nombre}</span>
                <span>{eur(l.precio * l.qty)}</span>
              </div>
            ))}
            <hr className="my-3 border-[var(--madera)]/30 border-dashed" />
            <div className="flex justify-between"><span>{T.carrito.subtotal}</span><span>{eur(r.sub)}</span></div>
            {r.disc > 0 && <div className="flex justify-between"><span>{T.carrito.descuento} ({r.cupon})</span><span>−{eur(r.disc)}</span></div>}
            <div className="flex justify-between"><span>{T.carrito.envio}</span><span>{r.ship === 0 ? T.carrito.envioGratis : eur(r.ship)}</span></div>
            <div className="flex justify-between font-bold text-base mt-1"><span>{T.carrito.total}</span><span>{eur(r.total)}</span></div>
            <div className="text-center text-xs opacity-60 mt-3">
              {r.metodo === "tarjeta" ? T.gracias.pagadoTarjeta : T.gracias.pagadoPaypal}
            </div>
            {r.cuchara && (
              <div className="mt-3 p-3 rounded-lg border border-dashed border-[var(--miel)] bg-[var(--crema)] font-sans">
                <div className="font-display text-sm">🥄 {T.gracias.cucharaTitulo}</div>
                <div className="text-xs mt-1 opacity-80">{T.gracias.cucharaIntro}</div>
                <div className="font-display text-base mt-1">{r.cuchara.nombre}</div>
                <div className="text-xs mt-1 opacity-80">{r.cuchara.historia}</div>
              </div>
            )}
            <div className="text-center text-xs italic mt-4 opacity-85 font-sans">
              “{T.gracias.bienvenidas[(r.fraseIdx ?? 0) % T.gracias.bienvenidas.length]}”
            </div>
            <div className="text-center mt-3 text-lg">🍃</div>
          </div>
        ) : r === "none" ? (
          // visita directa sin pedido: mensaje amable y las dos puertas, nunca una pantalla rota
          <div className="panel mt-6 p-5 float-in text-center">
            <p className="text-sm">{T.gracias.sinPedido} 🍃</p>
          </div>
        ) : null}

        <div className="text-center mt-6 flex flex-wrap gap-2 justify-center">
          <Link href="/salon" className="btn-miel px-5 py-2.5 text-sm inline-block">{T.gracias.volver}</Link>
          <Link href="/clasica" className="sign px-5 py-2.5 text-sm inline-block">{T.gracias.irClasica}</Link>
        </div>
      </div>
    </main>
  );
}
