"use client";
// La LÁMINA de herbario: cómo esta casa enseña un té. Silueta botánica de sus plantas,
// número de lámina, latín y el porqué — el conocimiento de Petra hecho página.
import Link from "next/link";
import { plantById } from "@/data/plants";
import { eur } from "@/lib/format";
import { useCart } from "@/lib/cart";
import { useT, useLang } from "@/i18n";
import { trTea, trPlanta } from "@/i18n/catalogo";
import type { Tea } from "@/lib/types";
import PlantaSVG from "./PlantaSVG";

export default function Lamina({ tea: teaRaw, num }: { tea: Tea; num: number }) {
  const T = useT();
  const { lang } = useLang();
  const tea = trTea(teaRaw, lang); // catálogo en el idioma activo (fallback ES)
  const add = useCart((s) => s.add);
  const plantas = tea.plantas.map((tp) => trPlanta(plantById(tp.plantaId), lang));
  return (
    <article className="lamina p-5 pt-6 flex flex-col">
      <div className="flex items-baseline justify-between">
        <span className="eyebrow lamina-num">{T.cl.lamina} №{String(num).padStart(2, "0")}</span>
        {tea.sala === "te-premium" && <span className="sello-premium">PREMIUM 🥄?</span>}
      </div>
      <Link href={`/clasica/tes/${tea.id}`} className="group">
        {tea.foto ? (
          <div className="relative my-3 h-[150px] overflow-hidden rounded-[3px]">
            {/* la foto del tarro, velada: el nombre emerge sobre ella (encargo de SER) */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={tea.foto} alt={tea.nombre} className="tarro-velado absolute inset-0 w-full h-full object-cover" />
            <span className="nombre-emerge absolute inset-0 grid place-items-center font-display text-2xl text-center px-3 text-[#fffdf6] [text-shadow:0_1px_10px_rgba(46,32,19,0.75)]">
              {tea.nombre}
            </span>
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-1 my-3 min-h-[118px]">
            {plantas.map((p, i) => (
              <PlantaSVG key={p.id} plantId={p.id} forma={p.forma} color={p.color} color2={p.color2} size={i === 1 ? 116 : 96} />
            ))}
          </div>
        )}
        <h3 className="font-display text-2xl leading-tight group-hover:text-[var(--madera)] transition-colors">{tea.nombre}</h3>
      </Link>
      <p className="text-xs mt-2">{plantas.length} {T.cl.plantasDe}: {plantas.map((p) => p.nombre).join(" · ")}</p>
      <p className="latin text-xs mt-1">{plantas.map((p) => p.latin).filter(Boolean).join(" · ")}</p>
      <p className="text-sm mt-2 opacity-85 leading-relaxed">{tea.paraQueSirve}</p>
      <hr className="regla my-3" />
      <div className="mt-auto flex items-center justify-between">
        <span className="font-display text-lg">{eur(tea.precio)} <span className="text-xs opacity-70 font-sans">/ {tea.gramos} g</span></span>
        <div className="flex gap-2">
          <Link href={`/clasica/tes/${tea.id}`} className="text-sm underline underline-offset-4 opacity-70 hover:opacity-100 inline-flex items-center min-h-10">{T.cl.porQue.split(" ")[0]}…</Link>
          <button className="btn-tinta px-3 min-h-10 text-sm" onClick={() => add("tea", tea.id)}>{T.cl.anadir}</button>
        </div>
      </div>
    </article>
  );
}
