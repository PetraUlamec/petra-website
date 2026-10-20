"use client";
// Panel 2D del té enfocado: para qué sirve, la planta elegida y su porqué EN ESTE MIX, y añadir a la cesta.
import { useT, useLang } from "@/i18n";
import { trTea, trPlanta } from "@/i18n/catalogo";
import { teaById } from "@/data/teas";
import { plantById } from "@/data/plants";
import { eur } from "@/lib/format";
import { useCart } from "@/lib/cart";
import { useUi } from "@/lib/ui";
import { useEffect } from "react";
import PlantaSVG from "@/components/clasica/PlantaSVG";
import { ingredientPage, INGREDIENT_PAGE_SIZE } from "@/lib/ingredientLayout";

export default function TeaPanel({ jarPositions }: { jarPositions: Record<string, [number, number, number]> }) {
  const T = useT();
  const { lang } = useLang();
  const focusTeaId = useUi((s) => s.focusTeaId);
  const plantId = useUi((s) => s.plantId);
  const focusTea = useUi((s) => s.focusTea);
  const launchFly = useUi((s) => s.launchFly);
  const add = useCart((s) => s.add);
  const setPlant = useUi((s) => s.setPlant);
  // puerta para las baterías (i18n_check abre el panel del tarro sin depender del raycast WebGL): window.__petraUi
  useEffect(() => { (window as unknown as { __petraUi?: typeof useUi }).__petraUi = useUi; }, []);

  if (!focusTeaId) return null;
  const tea = trTea(teaById(focusTeaId), lang); // nombre, para qué sirve y porqués en el idioma activo (fallback ES)
  const tp = plantId ? tea.plantas.find((x) => x.plantaId === plantId) : null;
  const planta = tp ? trPlanta(plantById(tp.plantaId), lang) : null;
  const page = ingredientPage(tea.plantas.findIndex(part => part.plantaId === plantId), tea.plantas.length);
  const paging = { es: "Ingredientes en 3D", en: "Ingredients in 3D", sl: "Sestavine v 3D" }[lang];

  return (
    <aside className="fixed z-30 bottom-3 inset-x-3 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:right-4 sm:left-auto sm:w-[22.5rem] panel p-4 float-in max-h-[46vh] sm:max-h-[80vh] overflow-y-auto">
      <div className="flex items-start justify-between gap-2">
        <h2 className="font-display text-2xl leading-tight">{tea.nombre}</h2>
        <button onClick={() => focusTea(null)} className="sign px-2 py-0.5 text-xs shrink-0" aria-label={T.sala.volver}>
          ← {T.sala.volver}
        </button>
      </div>
      <p className="mt-2 text-sm">{tea.paraQueSirve}</p>
      {tea.plantas.length > INGREDIENT_PAGE_SIZE && <nav className="flex items-center justify-between gap-2 mt-3 text-xs" aria-label={paging}>
        <button className="sign min-w-10 min-h-10" aria-label={`${paging} ←`} disabled={page.start === 0} onClick={() => setPlant(tea.plantas[page.start - INGREDIENT_PAGE_SIZE].plantaId)}>←</button>
        <span aria-live="polite">{paging} · {page.start + 1}–{page.end} / {tea.plantas.length}</span>
        <button className="sign min-w-10 min-h-10" aria-label={`${paging} →`} disabled={page.end === tea.plantas.length} onClick={() => setPlant(tea.plantas[page.end].plantaId)}>→</button>
      </nav>}
      <div className="grid grid-cols-3 gap-1.5 mt-3" aria-label={T.cl.plantasDe}>
        {tea.plantas.map((ingredient) => {
          const plant = trPlanta(plantById(ingredient.plantaId), lang);
          return <button key={plant.id} aria-pressed={plantId === plant.id} className={`min-h-20 rounded-md border px-1 py-2 text-xs flex flex-col items-center gap-1 ${plantId === plant.id ? "border-[var(--madera)] bg-[var(--miel-clara)]" : "border-[var(--madera)]/30 bg-[var(--crema)]"}`} onClick={() => setPlant(plant.id)}>
            <PlantaSVG plantId={plant.id} forma={plant.forma} color={plant.color} color2={plant.color2} size={42} />{plant.nombre}
          </button>;
        })}
      </div>

      {tp && planta ? (
        <div className="mt-3 p-3 rounded-lg border-2 float-in" style={{ borderColor: planta.color, background: "var(--crema)" }}>
          <p className="font-display text-base">{planta.nombre}
            <span className="latin text-xs"> · {planta.latin}</span>
          </p>
          <p className="mt-1 text-sm">{tp.porQueEnEsteMix}</p>
        </div>
      ) : (
        <p className="mt-3 text-xs opacity-70">{T.sala.tocaPlanta}</p>
      )}

      {tea.sala === "te-premium" && (
        <p className="mt-3 text-xs p-2 rounded-md border border-dashed border-[var(--miel)] bg-[var(--crema)]">
          <span className="font-display text-base mr-1">🥄 ?</span> {T.sala.sorpresa}
        </p>
      )}
      <div className="mt-4 flex items-center justify-between gap-3">
        <p>
          <span className="font-display text-xl">{eur(tea.precio)}</span>{" "}
          <span className="text-xs opacity-70">{T.sala.precioPor(tea.gramos)}</span>
        </p>
        <button
          className="btn-miel px-4 py-2 text-sm"
          onClick={() => {
            add("tea", tea.id);
            const p = jarPositions[tea.id];
            if (p) launchFly([p[0], p[1] + 0.4, p[2]], tea.colorHoja);
            focusTea(null); // VISION §3.5: la cámara devuelve al usuario a la vista general
          }}
        >
          {T.sala.anadir}
        </button>
      </div>
      <p className="mt-3 text-[10px] opacity-70">{T.provisional}</p>
    </aside>
  );
}
