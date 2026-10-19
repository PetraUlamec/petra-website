"use client";
// LA CASA EN PORTADA: la estación real manda. Hero editorial, la caja de la estación,
// tres láminas de la casa, procedencias con nombre propio y las cucharas de Erik.
import Link from "next/link";
import { teasBySala } from "@/data/teas";
import { CAJAS } from "@/data/boxes";
import { extraById, cucharas } from "@/data/extras";
import { estacionActual, precioCaja, cajaEnTemporada } from "@/lib/season";
import { eur } from "@/lib/format";
import { useCart } from "@/lib/cart";
import { useT, useLang } from "@/i18n";
import { trCaja, trExtra } from "@/i18n/catalogo";
import Lamina from "@/components/clasica/Lamina";
import { useSyncExternalStore } from "react";
import { subscribeVivo, getVivoVersion } from "@/lib/vivoStore";

const FRASE = {
  verano:    { es: ["Fuera es verano.", "Limonada fría y tés que saben a tarde larga."], en: ["It's summer outside.", "Cold lemonade and teas that taste of long afternoons."], sl: ["Zunaj je poletje.", "Hladna limonada in čaji z okusom dolgih popoldnevov."] },
  invierno:  { es: ["Fuera es invierno.", "La tetera silba y hay chorizo del valle en la caja."], en: ["It's winter outside.", "The kettle whistles; the valley's chorizo is in the box."], sl: ["Zunaj je zima.", "Čajnik žvižga; v škatli je klobasa iz doline."] },
  primavera: { es: ["Fuera es primavera.", "Miel nueva de flores y saúco en la taza."], en: ["It's spring outside.", "New blossom honey and elderflower in the cup."], sl: ["Zunaj je pomlad.", "Novi cvetlični med in bezeg v skodelici."] },
  otono:     { es: ["Fuera es otoño.", "Miel de castaño y mantas en el sofá."], en: ["It's autumn outside.", "Chestnut honey and blankets on the sofa."], sl: ["Zunaj je jesen.", "Kostanjev med in odeje na kavču."] },
} as const;

export default function HomeClasica() {
  useSyncExternalStore(subscribeVivo, getVivoVersion, () => 0);
  const T = useT();
  const { lang } = useLang();
  const add = useCart((s) => s.add);
  const est = estacionActual();
  const frase = FRASE[est][lang as "es" | "en" | "sl"] ?? FRASE[est].es;
  const caja = trCaja(CAJAS.find((c) => c.estacion === est) ?? CAJAS[0], lang);
  const destacados = [...teasBySala("te").slice(0, 2), ...teasBySala("te-premium").slice(0, 1)];
  const lugares = ["queso-casa", "limonada-frambuesa", "miel-flores", "miel-castano", "chorizo-valle"]
    .map((id) => trExtra(extraById(id), lang)).filter(Boolean);

  return (
    <main className="max-w-[1240px] mx-auto px-4 sm:px-6">
      {/* ── HERO: la estación real, tipografía como titular de almanaque ── */}
      <section className="pt-14 sm:pt-20 pb-10 grid lg:grid-cols-[1.2fr_1fr] gap-10 items-end">
        <div>
          <p className="eyebrow">{T.cl.heroEyebrow}</p>
          <h1 className="font-display leading-[0.98] mt-3 text-[clamp(2.6rem,7vw,5.2rem)]">{frase[0]}</h1>
          <p className="text-lg sm:text-xl mt-4 max-w-[38ch] opacity-85">{frase[1]}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/clasica/tes" className="btn-tinta px-5 py-2.5">{T.cl.verTes}</Link>
            <Link href="/clasica/cajas" className="px-5 py-2.5 border border-[rgba(58,37,19,0.35)] rounded-[3px] hover:bg-[rgba(58,37,19,0.05)] transition-colors">{T.cl.verCaja}</Link>
          </div>
        </div>
        {/* la caja de la estación como ficha de almanaque, no como "card" */}
        <aside className="lamina p-6 pt-7">
          <p className="eyebrow">{T.cl.cajaTemporada}</p>
          <h2 className="font-display text-3xl mt-1">{caja.nombre}</h2>
          <p className="text-sm mt-2 opacity-85 leading-relaxed">{caja.descripcion}</p>
          <hr className="regla my-3" />
          <p className="eyebrow mb-1.5">{T.cl.dentroCaja}</p>
          <ul className="text-sm space-y-1">
            {caja.incluyeTeNormalAlAzar && <li>— {T.cl.teDeLaSala}</li>}
            {caja.extras.map((id) => { const e = extraById(id); return e ? <li key={id}>— {trExtra(e, lang).nombre}</li> : null; })}
            {caja.incluyeCucharaAlAzar && <li>— {T.cl.cucharaSorpresa} <b>🥄?</b></li>}
          </ul>
          <div className="mt-4 flex items-center justify-between">
            <span className="font-display text-2xl">{eur(precioCaja(caja))}</span>
            <button className="btn-tinta px-4 min-h-10 text-sm" onClick={() => add("caja", caja.id)}>{T.cl.anadir}</button>
          </div>
          {!cajaEnTemporada(caja) && <p className="text-xs mt-2 text-[var(--granate)]">{T.cl.recargo}</p>}
        </aside>
      </section>

      {/* ── LÁMINAS DESTACADAS ── */}
      <section className="py-12">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-3xl">{T.cl.destacados}</h2>
          <Link href="/clasica/tes" className="text-sm underline underline-offset-4 opacity-70 hover:opacity-100">{T.cl.verTodos} →</Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {destacados.map((t, i) => <Lamina key={t.id} tea={t} num={i + 1} />)}
        </div>
      </section>

      {/* ── PROCEDENCIAS: la regla de la casa, con nombre propio ── */}
      <section className="py-12">
        <h2 className="font-display text-3xl">{T.cl.procedencias}</h2>
        <p className="opacity-75 mt-1 max-w-[52ch]">{T.cl.procedenciasSub}</p>
        <div className="mt-6 grid sm:grid-cols-2 gap-x-10 gap-y-4">
          {lugares.map((e) => e && (
            <div key={e.id} className="nota-margen">
              <b className="font-display">{e.nombre}</b>
              <span className="block opacity-80 mt-0.5 leading-relaxed">{e.procedencia}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── ERIK ── */}
      <section className="py-12 grid lg:grid-cols-[1fr_1.1fr] gap-8 items-center">
        <div>
          <h2 className="font-display text-3xl">{T.cl.erikTitulo}</h2>
          <p className="opacity-80 mt-2 max-w-[44ch] leading-relaxed">{T.cl.erikSub}</p>
          <Link href="/clasica/cucharas" className="inline-block mt-4 underline underline-offset-4">{T.cl.verColeccion} →</Link>
        </div>
        <div className="flex flex-wrap gap-4 justify-center">
          {cucharas().slice(0, 3).map((cRaw, i) => { const c = trExtra(cRaw, lang); return (
            <Link key={c.id} href="/clasica/cucharas" className="lamina p-4 w-32 sm:w-36 text-center hover:-translate-y-1 transition-transform">
              <svg viewBox="0 0 40 100" width="46" height="110" className="mx-auto" aria-hidden>
                <path d={`M20 8 q${5 + i} 6 ${i - 3} 22 L ${19 - i * 0.4} 88`} stroke="#6b4527" strokeWidth={3 + i * 0.4} fill="none" strokeLinecap="round" />
                <ellipse cx="20" cy="14" rx={7 + i} ry={10 + i} fill="#c9a26a" opacity="0.85" />
                <ellipse cx="20" cy="14" rx={4 + i} ry={7 + i} fill="#8a6a3f" opacity="0.5" />
              </svg>
              <span className="text-xs block mt-2 leading-tight">{c.nombre}</span>
            </Link>
          ); })}
        </div>
      </section>

      {/* ── LA HISTORIA CORTA ── */}
      <section className="py-12 max-w-2xl">
        <h2 className="font-display text-3xl">{T.cl.historiaTitulo}</h2>
        <p className="mt-3 leading-relaxed opacity-85">{T.cl.historia}</p>
        <Link href="/clasica/nosotros" className="inline-block mt-3 underline underline-offset-4">{T.nav.nosotros} →</Link>
      </section>
    </main>
  );
}
