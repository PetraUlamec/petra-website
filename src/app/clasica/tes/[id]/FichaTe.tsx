"use client";
// LA FICHA GRANDE: la lámina de herbario completa de una mezcla.
// Cada planta dibujada a trazo, su latín, y EL PORQUÉ — la regla de la casa:
// el conocimiento vive en la relación té ↔ planta, nunca repetido.
import Link from "next/link";
import { useState } from "react";
import { plantById } from "@/data/plants";
import { teasBySala } from "@/data/teas";
import { eur } from "@/lib/format";
import { useCart } from "@/lib/cart";
import { useT, useLang } from "@/i18n";
import { trTea, trPlanta } from "@/i18n/catalogo";
import type { Tea } from "@/lib/types";
import PlantaSVG from "@/components/clasica/PlantaSVG";
import Lamina from "@/components/clasica/Lamina";

export default function FichaTe({ tea: teaRaw }: { tea: Tea }) {
  const T = useT();
  const { lang } = useLang();
  const tea = trTea(teaRaw, lang); // té + porqués en el idioma activo (fallback ES)
  const add = useCart((s) => s.add);
  const [puesto, setPuesto] = useState(false);
  const plantas = tea.plantas.map((tp) => ({ tp, p: trPlanta(plantById(tp.plantaId), lang) }));
  const relacionados = teasBySala(tea.sala).filter((t) => t.id !== tea.id).slice(0, 3);
  const anadir = () => { add("tea", tea.id); setPuesto(true); setTimeout(() => setPuesto(false), 1800); };

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-10">
      <Link href="/clasica/tes" className="text-sm opacity-70 hover:opacity-100 underline underline-offset-4">← {T.cl.volver}</Link>

      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-10 mt-6 items-start">
        {/* ── LA LÁMINA: las plantas dibujándose, como recién prensadas ── */}
        <section className="lamina p-7 sm:p-10">
          <div className="flex items-baseline justify-between">
            <span className="eyebrow lamina-num">{T.cl.lamina} · {tea.gramos} g</span>
            {tea.sala === "te-premium" && <span className="sello-premium">PREMIUM 🥄?</span>}
          </div>
          <h1 className="font-display text-4xl sm:text-5xl mt-2 leading-tight">{tea.nombre}</h1>
          <p className="mt-3 text-lg opacity-85 max-w-[46ch] leading-relaxed">{tea.paraQueSirve}</p>
          {tea.sala === "te-premium" && <p className="text-sm mt-2 text-[var(--granate)]">{T.cl.premiumNota}</p>}
          <hr className="regla my-6" />

          {tea.foto && (
            <figure className="relative mx-auto mb-8 max-w-[330px]">
              {/* el tarro por dentro: nítido, y sus plantas BROTAN de la boca */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={tea.foto} alt={tea.nombre} className="w-full rounded-[4px] shadow-[0_14px_30px_-16px_var(--sombra-calida)]" />
              <div className="absolute -top-14 inset-x-0 flex justify-center items-end gap-0 pointer-events-none">
                {plantas.slice(0, 5).map(({ p }, i) => (
                  <div key={p.id} className="brota" style={{ animationDelay: `${0.25 + i * 0.14}s` }}>
                    <PlantaSVG forma={p.forma} color={p.color} color2={p.color2} size={i === 2 ? 96 : 72} />
                  </div>
                ))}
              </div>
            </figure>
          )}

          {/* cada planta: silueta + latín + SU porqué en ESTA mezcla */}
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-7">
            {plantas.map(({ tp, p }, i) => (
              <div key={p.id} className="flex gap-4">
                <div className="shrink-0" style={{ animationDelay: `${i * 0.18}s` }}>
                  <PlantaSVG forma={p.forma} color={p.color} color2={p.color2} size={104} dibuja />
                </div>
                <div className="pt-1">
                  <p className="font-display text-xl leading-tight">{p.nombre}</p>
                  <p className="latin text-xs">{p.latin}</p>
                  <p className="nota-margen mt-2 leading-relaxed">{tp.porQueEnEsteMix}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── COLUMNA DE COMPRA + PREPARACIÓN ── */}
        <aside className="lg:sticky lg:top-20 space-y-5">
          <div className="lamina p-6 pt-7">
            <p className="font-display text-3xl">{eur(tea.precio)} <span className="text-sm opacity-70 font-sans">/ {tea.gramos} g</span></p>
            <button onClick={anadir} className="btn-tinta w-full py-3 mt-4 text-base">
              {puesto ? `✓ ${T.cl.enCesta}` : T.cl.anadir}
            </button>
            <Link href="/clasica/cesta" className="block text-center text-sm mt-3 underline underline-offset-4 opacity-70 hover:opacity-100">{T.cl.cesta} →</Link>
          </div>
          <div className="lamina p-6 pt-7">
            <p className="eyebrow mb-3">{T.cl.preparacion}</p>
            <ul className="text-sm space-y-2.5">
              <li className="flex gap-3 items-baseline"><span className="font-display text-lg">95°</span> {T.cl.prepAgua}</li>
              <li className="flex gap-3 items-baseline"><span className="font-display text-lg">5–7′</span> {T.cl.prepTiempo}</li>
              <li className="flex gap-3 items-baseline"><span className="font-display text-lg">1 🥄</span> {T.cl.prepCantidad}</li>
            </ul>
          </div>
        </aside>
      </div>

      {/* ── MÁS DE LA CASA ── */}
      {relacionados.length > 0 && (
        <section className="mt-14">
          <h2 className="font-display text-2xl">{T.cl.destacados}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-5">
            {relacionados.map((t, i) => <Lamina key={t.id} tea={t} num={i + 1} />)}
          </div>
        </section>
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org", "@type": "Product",
        name: tea.nombre, description: tea.paraQueSirve,
        brand: { "@type": "Brand", name: "Petra & Erik" },
        offers: { "@type": "Offer", price: tea.precio, priceCurrency: "EUR", availability: "https://schema.org/InStock" },
      }) }} />
    </main>
  );
}
