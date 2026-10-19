"use client";
// Las cajas: la de la estación real primero y en grande; las demás con su +15% explicado.
import { CAJAS } from "@/data/boxes";
import { extraById } from "@/data/extras";
import { estacionActual, precioCaja, cajaEnTemporada } from "@/lib/season";
import { eur } from "@/lib/format";
import { useCart } from "@/lib/cart";
import { useT, useLang } from "@/i18n";
import { trCaja, trExtra, nombreEstacion, todoElAno } from "@/i18n/catalogo";
import type { CajaTemporada } from "@/lib/types";

function FichaCaja({ caja: cajaRaw, grande }: { caja: CajaTemporada; grande?: boolean }) {
  const T = useT();
  const { lang } = useLang();
  const caja = trCaja(cajaRaw, lang);
  const add = useCart((s) => s.add);
  const enTemporada = cajaEnTemporada(caja);
  return (
    <article className={`lamina ${grande ? "p-8 pt-9" : "p-5 pt-6"} flex flex-col`}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="eyebrow">{caja.estacion ? nombreEstacion(caja.estacion, lang) : todoElAno(lang)}</span>
        {!enTemporada && <span className="text-[10px] text-[var(--granate)] border border-[var(--granate)] rounded-full px-2 py-0.5">{T.cl.fueraTemporada}</span>}
      </div>
      <h2 className={`font-display ${grande ? "text-4xl" : "text-2xl"} mt-1`}>{caja.nombre}</h2>
      <p className={`${grande ? "text-base" : "text-sm"} mt-2 opacity-85 leading-relaxed`}>{caja.descripcion}</p>
      <hr className="regla my-3" />
      <p className="eyebrow mb-1.5">{T.cl.dentroCaja}</p>
      <ul className={`${grande ? "text-base" : "text-sm"} space-y-1`}>
        {caja.incluyeTeNormalAlAzar && <li>— {T.cl.teDeLaSala} 🍃</li>}
        {caja.extras.map((id) => { const e = extraById(id); return e ? <li key={id}>— {trExtra(e, lang).nombre}</li> : null; })}
        {caja.incluyeCucharaAlAzar && <li>— {T.cl.cucharaCorta} <b>🥄?</b></li>}
      </ul>
      <div className="mt-auto pt-4">
        {!enTemporada && <p className="text-xs text-[var(--granate)] mb-2">{T.cl.recargo}</p>}
        {grande ? (
          <div className="flex items-center justify-between gap-3">
            <span className="font-display text-3xl whitespace-nowrap">{eur(precioCaja(caja))}</span>
            <button className="btn-tinta px-5 py-2.5 shrink-0" onClick={() => add("caja", caja.id)}>{T.cl.anadir}</button>
          </div>
        ) : (
          <>
            <span className="font-display text-2xl block">{eur(precioCaja(caja))}</span>
            <button className="btn-tinta w-full py-2.5 mt-2 text-sm" onClick={() => add("caja", caja.id)}>{T.cl.anadir}</button>
          </>
        )}
      </div>
    </article>
  );
}

export default function CajasClasica() {
  const T = useT();
  const est = estacionActual();
  const actual = CAJAS.find((c) => c.estacion === est) ?? CAJAS.find((c) => !c.estacion);
  const resto = CAJAS.filter((c) => c.id !== actual?.id);
  return (
    <main className="max-w-[1240px] mx-auto px-4 sm:px-6 pt-12">
      <p className="eyebrow">{T.cl.heroEyebrow}</p>
      <h1 className="font-display text-4xl sm:text-5xl mt-2">{T.cl.navCajas}</h1>
      {actual && <div className="mt-8 max-w-2xl"><FichaCaja caja={actual} grande /></div>}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {resto.map((c) => <FichaCaja key={c.id} caja={c} />)}
      </div>
    </main>
  );
}
