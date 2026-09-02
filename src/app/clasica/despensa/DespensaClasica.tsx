"use client";
// LA DESPENSA (encargo de SER): qué hay en las baldas por estación y CUÁNTO QUEDA.
// Cuando algo se acaba, se acaba hasta la próxima cosecha — esa es la honestidad de la casa.
import { EXTRAS, extrasVivos } from "@/data/extras";
import { CAJAS } from "@/data/boxes";
import { estacionActual } from "@/lib/season";
import { useT, useLang } from "@/i18n";
import { trExtra, trCaja, nombreEstacion } from "@/i18n/catalogo";
import type { Extra } from "@/lib/types";
import { useEffect, useState } from "react";
import { subscribeVivo, cargarVivo, getVivoVersion } from "@/lib/vivoStore";
import Link from "next/link";

const ORDEN: ("verano" | "otono" | "invierno" | "primavera")[] = ["verano", "otono", "invierno", "primavera"];

function Balda({ e: eRaw }: { e: Extra }) {
  const T = useT();
  const { lang } = useLang();
  const e = trExtra(eRaw, lang);
  const cajaRaw = CAJAS.find((c) => c.extras.includes(e.id));
  const caja = cajaRaw ? trCaja(cajaRaw, lang) : undefined;
  const sinStock = typeof e.quedan === "number" && e.quedan <= 0;
  return (
    <article className={`lamina p-5 pt-6 ${sinStock ? "opacity-70" : ""}`}>
      <h3 className="font-display text-xl leading-tight">{e.nombre}</h3>
      {typeof e.quedan === "number" && (
        sinStock
          ? <span className="inline-block mt-1.5 text-[11px] text-[var(--granate)] border border-[var(--granate)] rounded-full px-2 py-0.5">{T.cl.agotado}</span>
          : <p className={`lamina-num text-sm mt-1 ${e.quedan <= 3 ? "text-[var(--granate)]" : "opacity-70"}`}>
              {T.cl.quedan} <b className="font-display text-lg">{e.quedan}</b> {T.cl.unidades}
              {e.quedan <= 3 && <span className="ml-1.5 text-[11px]">· {T.cl.casiAgotado}</span>}
            </p>
      )}
      <p className="text-sm mt-2 opacity-85 leading-relaxed">{e.procedencia}</p>
      {caja && (
        <p className="text-xs mt-3 opacity-70">
          → {T.cl.vaEnCaja} <Link href="/clasica/cajas" className="underline underline-offset-2">{caja.nombre}</Link>
        </p>
      )}
    </article>
  );
}

export default function DespensaClasica() {
  const T = useT();
  const { lang } = useLang();
  const est = estacionActual();
  const [, setV] = useState(getVivoVersion());
  useEffect(() => { cargarVivo(); return subscribeVivo(() => setV(getVivoVersion())); }, []);
  const todos = extrasVivos().filter((e) => e.tipo !== "cuchara");
  const deEstacion = (s: string | null) => todos.filter((e) => (e.estacion ?? null) === s);
  const estaciones = [est, ...ORDEN.filter((s) => s !== est)];
  return (
    <main className="max-w-[1240px] mx-auto px-4 sm:px-6 pt-12">
      <p className="eyebrow">{T.cl.heroEyebrow}</p>
      <h1 className="font-display text-4xl sm:text-5xl mt-2">{T.cl.despensaTitulo}</h1>
      <p className="opacity-75 mt-2 max-w-[56ch] leading-relaxed">{T.cl.despensaSub}</p>

      {/* primero lo de TODO EL AÑO, luego la estación ACTUAL, luego el resto */}
      {deEstacion(null).length > 0 && (
        <section className="mt-9">
          <h2 className="eyebrow">{T.cl.todoElAno}</h2>
          <div className="grid gap-5 mt-3 [grid-template-columns:repeat(auto-fill,minmax(270px,1fr))]">
            {deEstacion(null).map((e) => <Balda key={e.id} e={e} />)}
          </div>
        </section>
      )}
      {estaciones.map((s) => deEstacion(s).length > 0 && (
        <section key={s} className="mt-9">
          <h2 className="eyebrow">
            {nombreEstacion(s, lang)}{s === est && <span className="ml-2 normal-case tracking-normal"><span className="text-[var(--miel)]">●</span> {T.cl.ahora}</span>}
          </h2>
          <div className="grid gap-5 mt-3 [grid-template-columns:repeat(auto-fill,minmax(270px,1fr))]">
            {deEstacion(s).map((e) => <Balda key={e.id} e={e} />)}
          </div>
        </section>
      ))}
    </main>
  );
}
