"use client";
// Ficha de procedencia. En la sala de té, las cucharas también son productos comprables.
import { extraById, PRECIO_CUCHARA } from "@/data/extras";
import { useUi } from "@/lib/ui";
import { useCart } from "@/lib/cart";
import { eur } from "@/lib/format";
import { useT, useLang } from "@/i18n";
import { trExtra } from "@/i18n/catalogo";

type Pos = [number, number, number];

export default function ExtraPanel({
  spoonPositions,
  spoonColors,
}: {
  spoonPositions?: Record<string, Pos>;
  spoonColors?: Record<string, string>;
} = {}) {
  const T = useT();
  const { lang } = useLang();
  const extraId = useUi((s) => s.extraId);
  const setExtra = useUi((s) => s.setExtra);
  const launchFly = useUi((s) => s.launchFly);
  const add = useCart((s) => s.add);
  if (!extraId) return null;
  const e = trExtra(extraById(extraId), lang) as ReturnType<typeof extraById> & { foto?: string };
  const buyable = e.tipo === "cuchara" && Boolean(spoonPositions?.[e.id]);

  return (
    <aside className={`fixed z-30 inset-x-3 sm:inset-x-auto sm:right-4 sm:w-80 panel p-4 float-in ${
      buyable ? "bottom-3 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2" : "bottom-3 sm:bottom-4"
    }`}>
      <div className="flex items-start justify-between gap-2">
        <h2 className="font-display text-xl leading-tight">{e.nombre}</h2>
        <button onClick={() => setExtra(null)} className="sign px-2 py-0.5 text-xs" aria-label={T.a11y.cerrar}>
          {buyable ? `← ${T.sala.volver}` : "✕"}
        </button>
      </div>
      <p className="mt-1 text-xs uppercase tracking-wide opacity-60">
        {e.tipo === "cuchara" ? `${T.extra.talladaPor} ${e.hechoPor}` : `${T.extra.despensaDe} ${e.hechoPor}`}
      </p>
      {e.foto && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={e.foto} alt={e.nombre} className="mt-2 rounded-lg max-h-40 mx-auto" />
      )}
      <p className="mt-2 text-sm leading-relaxed">{e.procedencia}</p>

      {buyable && (
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--madera)]/20 pt-3">
          <p>
            <span className="font-display text-xl">{eur(PRECIO_CUCHARA)}</span>
          </p>
          <button
            className="btn-miel px-4 py-2 text-sm"
            onClick={() => {
              add("cuchara", e.id);
              const p = spoonPositions?.[e.id];
              if (p) launchFly(p, spoonColors?.[e.id] ?? "#9a6843");
              setExtra(null);
            }}
          >
            {T.sala.anadir}
          </button>
        </div>
      )}
    </aside>
  );
}
