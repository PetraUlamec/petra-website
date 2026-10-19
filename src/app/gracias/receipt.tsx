"use client";
// Vista previa del RECIBO (VISION §6): esto es lo que llegará por correo desde la dirección
// de la casa (Resend + dominio propio) cuando la tienda esté conectada.
import { useEffect, useState } from "react";
import Link from "next/link";
import { useT, useLang } from "@/i18n";
import { eur } from "@/lib/format";
import { useCart } from "@/lib/cart";

interface Receipt {
  test: boolean;
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
  const [failed, setFailed] = useState(false);
  const clear = useCart((state) => state.clear);
  const checking = { es: "No hemos podido confirmar el pago. Si ya pagaste, no repitas la compra: vuelve a comprobarlo en unos momentos.", en: "We could not confirm payment. If you already paid, do not pay again: check back in a moment.", sl: "Plačila ni bilo mogoče potrditi. Če ste že plačali, ne plačujte znova: preverite čez nekaj trenutkov." }[lang];
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("session_id");
    if (!id) { setR("none"); return; }
    let cancelled = false;
    fetch(`/api/pedido?session_id=${encodeURIComponent(id)}`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("not_confirmed");
        const receipt = await response.json();
        if (!cancelled) { setR(receipt); clear(); }
      })
      .catch(() => { if (!cancelled) { setR("none"); setFailed(true); } });
    return () => { cancelled = true; };
  }, [clear]);

  return (
    <main className="fixed inset-0 overflow-y-auto bg-[var(--madera-oscura)] pt-14 pb-8 px-4">
      <div className="max-w-md mx-auto">
        <h1 className="font-display text-3xl text-[var(--crema)] text-center drop-shadow">{T.gracias.titulo}</h1>
        {r && r !== "none" && <p className="text-sm text-[var(--crema)]/80 text-center mt-2">{r.test ? "TEST · PRUEBA · PREIZKUS — 0 real charges" : T.gracias.cuerpo}</p>}

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
              {r.test ? "Stripe TEST" : "Stripe ✓"}
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
            <p role="status" className="text-sm">{failed ? checking : T.gracias.sinPedido} 🍃</p>
            {failed && <button className="btn-miel px-4 py-2 mt-3" onClick={() => window.location.reload()}>↻</button>}
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
