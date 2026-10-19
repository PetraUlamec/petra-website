"use client";
// La cesta completa de la web clásica: líneas, cupón, pago (demo/Stripe) y la ENTRADA con la 🥄 sorpresa.
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { subscribeVivo, getVivoVersion } from "@/lib/vivoStore";
import { useCart, linePrice, cartSubtotal, cartDiscount, cartShipping, ENVIO_GRATIS_DESDE } from "@/lib/cart";
import { cuponByCodigo } from "@/data/coupons";
import { teaById } from "@/data/teas";
import { cajaById } from "@/data/boxes";
import { cucharas, extraById } from "@/data/extras";
import { eur } from "@/lib/format";
import { useT, useLang } from "@/i18n";
import { trTea, trCaja, trExtra, trCupon } from "@/i18n/catalogo";
import type { Cupon, CartLine } from "@/lib/types";
import { iniciarPago } from "@/lib/pagoCliente";

export default function CestaClasica() {
  useSyncExternalStore(subscribeVivo, getVivoVersion, () => 0);
  const T = useT();
  const { lang } = useLang();
  // nombre de la línea EN EL IDIOMA ACTIVO (y así queda congelado en el recibo)
  const nombreDe = (l: CartLine) =>
    l.kind === "tea"
      ? trTea(teaById(l.id), lang).nombre
      : l.kind === "caja"
        ? trCaja(cajaById(l.id), lang).nombre
        : trExtra(extraById(l.id), lang).nombre;
  const { lines, cupon, setCupon, setQty, remove, clear } = useCart();
  const [mounted, setMounted] = useState(false);
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [aviso, setAviso] = useState("");
  const [confirmando, setConfirmando] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [errorPago, setErrorPago] = useState("");
  useEffect(() => setMounted(true), []);
  if (!mounted) return <main className="max-w-4xl mx-auto px-4 pt-12 min-h-[50vh]" />;

  const sub = cartSubtotal(lines);
  const disc = cartDiscount(sub, cupon as Cupon | null);
  const ship = cartShipping(sub - disc);
  const total = sub - disc + ship;

  const aplicar = () => {
    const c = cuponByCodigo(code);
    if (c) { setCupon(c); setAviso("✓ " + trCupon(c, lang).descripcion); } else setAviso("✗");
  };

  const pagar = async () => {
    setProcesando(true);
    setErrorPago("");
    try { await iniciarPago(lines, cupon?.codigo ?? null, email, true); }
    catch (error) { setErrorPago((error as Error).message); setProcesando(false); }
  };
  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-12">
      <h1 className="font-display text-4xl">{T.cl.cestaTitulo}</h1>
      {lines.length === 0 ? (
        <div className="lamina p-8 mt-8 text-center">
          <p className="opacity-80 text-lg">{T.cl.cestaVacia}</p>
          <Link href="/clasica/tes" className="btn-tinta inline-block px-5 py-2.5 mt-4">{T.cl.verTes}</Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[1.5fr_1fr] gap-8 mt-8 items-start">
          <section className="lamina p-6 pt-7 divide-y divide-[rgba(58,37,19,0.1)]">
            {lines.map((l) => (
              <div key={`${l.kind}-${l.id}`} className="py-3 first:pt-0 last:pb-0 flex items-center gap-3">
                <div className="flex-1">
                  <p className="font-display text-lg leading-tight">{nombreDe(l)}</p>
                  <p className="text-xs opacity-70">{eur(linePrice(l))} × {l.qty}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button aria-label="−" className="w-10 h-10 rounded border border-[rgba(58,37,19,0.3)] hover:bg-[rgba(58,37,19,0.06)]" onClick={() => setQty(l.kind, l.id, Math.max(1, l.qty - 1))}>−</button>
                  <span className="w-6 text-center text-sm">{l.qty}</span>
                  <button aria-label="+" className="w-10 h-10 rounded border border-[rgba(58,37,19,0.3)] hover:bg-[rgba(58,37,19,0.06)]" onClick={() => setQty(l.kind, l.id, l.qty + 1)}>+</button>
                </div>
                <span className="w-20 text-right font-display">{eur(linePrice(l) * l.qty)}</span>
                <button aria-label={T.carrito.quitar} className="text-xs underline opacity-70 hover:opacity-100 w-10 h-10" onClick={() => remove(l.kind, l.id)}>✕</button>
              </div>
            ))}
          </section>

          <aside className="lamina p-6 pt-7 lg:sticky lg:top-20">
            <div className="flex gap-2">
              <input value={code} onChange={(e) => setCode(e.target.value)} placeholder={T.cl.cupon} aria-label={T.cl.cuponEtiqueta}
                className="flex-1 border border-[rgba(58,37,19,0.25)] rounded-[3px] px-3 min-h-10 text-sm bg-white/60" />
              <button className="btn-tinta px-3 min-h-10 text-sm" onClick={aplicar}>{T.cl.aplicar}</button>
            </div>
            {aviso && <p className="text-xs mt-1.5">{aviso}</p>}
            <hr className="regla my-4" />
            <dl className="text-sm space-y-1.5">
              <div className="flex justify-between"><dt className="opacity-70">{T.cl.subtotal}</dt><dd>{eur(sub)}</dd></div>
              {disc > 0 && <div className="flex justify-between text-[var(--salvia)]"><dt>{T.cl.cuponEtiqueta}</dt><dd>−{eur(disc)}</dd></div>}
              <div className="flex justify-between"><dt className="opacity-70">{T.cl.envio}</dt><dd>{ship === 0 ? "0 €" : eur(ship)}</dd></div>
            </dl>
            <p className="text-[11px] opacity-70 mt-1">{T.cl.envioGratis}</p>
            <div className="flex justify-between font-display text-2xl mt-3"><span>{T.cl.total}</span><span>{eur(total)}</span></div>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder={T.cl.emailRecibo} type="email" aria-label={T.cl.emailRecibo}
              className="w-full border border-[rgba(58,37,19,0.25)] rounded-[3px] px-3 py-2 text-sm bg-white/60 mt-4" />
            {errorPago && <p role="alert" className="text-sm text-[var(--granate)] mt-3">{errorPago}</p>}
            {!confirmando ? (
              <button className="btn-tinta w-full py-3 mt-3" onClick={() => setConfirmando(true)}>💳 {T.cl.pagarTarjeta}</button>
            ) : (
              <button className="btn-tinta w-full py-3 mt-3 bg-[var(--granate)]" disabled={procesando} onClick={pagar}>
                {procesando ? "…" : T.cl.pagarTarjeta}
              </button>
            )}
            <p className="text-[10px] opacity-70 mt-2 leading-snug">{T.cl.demoAviso}</p>
            <p className="text-[11px] mt-2 leading-snug opacity-80">🎟 {T.cl.entradaReclamo}{lines.some((l) => l.kind === "caja") ? " " + T.cl.entradaCuchara : ""}.</p>
            <Link href="/clasica/tes" className="block text-center text-sm mt-3 underline underline-offset-4 opacity-70">{T.cl.seguirComprando}</Link>
          </aside>
        </div>
      )}
    </main>
  );
}
