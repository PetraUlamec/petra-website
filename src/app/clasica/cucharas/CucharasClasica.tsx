"use client";
// La colección de Erik: cada cuchara con su árbol y su historia. La artesanía como catálogo de museo pequeño.
import { cucharas } from "@/data/extras";
import { useT, useLang } from "@/i18n";
import { trExtra } from "@/i18n/catalogo";

const TONOS = ["#6b4527", "#8a4c33", "#c9a26a", "#8a6a3f", "#5b3a21", "#9a5b3c", "#7a5330", "#b0713f", "#4a3826"];

export default function CucharasClasica() {
  const T = useT();
  const { lang } = useLang();
  const lista = cucharas().map((c) => trExtra(c, lang));
  return (
    <main className="max-w-[1240px] mx-auto px-4 sm:px-6 pt-12">
      <p className="eyebrow">{T.cl.heroEyebrow}</p>
      <h1 className="font-display text-4xl sm:text-5xl mt-2">{T.cl.erikTitulo}</h1>
      <p className="opacity-80 mt-2 max-w-[50ch] leading-relaxed">{T.cl.erikSub} {T.cl.cucharaSorpresa}</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {lista.map((c, i) => (
          <article key={c.id} className="lamina p-6 pt-7">
            <div className="flex gap-5">
              <svg viewBox="0 0 40 110" width="44" height="120" aria-hidden className="shrink-0">
                <path d={`M20 10 q${4 + (i % 3)} 8 ${(i % 4) - 2} 26 L ${19 - (i % 3) * 0.5} 96`}
                  stroke={TONOS[i % TONOS.length]} strokeWidth={3.2 + (i % 3) * 0.5} fill="none" strokeLinecap="round" />
                <ellipse cx="20" cy="16" rx={7.5 + (i % 3)} ry={11 + (i % 2) * 2} fill={TONOS[(i + 2) % TONOS.length]} opacity="0.9" />
                <ellipse cx="20" cy="16" rx={4.5 + (i % 3) * 0.7} ry={7.5 + (i % 2) * 1.5} fill={TONOS[i % TONOS.length]} opacity="0.55" />
                {i % 3 === 1 && <circle cx="20" cy="16" r="2" fill="#fdf8ea" />}
              </svg>
              <div>
                <span className="eyebrow lamina-num">№{String(i + 1).padStart(2, "0")}</span>
                <h2 className="font-display text-xl leading-tight mt-1">{c.nombre}</h2>
                <p className="text-sm mt-2 opacity-85 leading-relaxed">{c.procedencia}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
