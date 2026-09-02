"use client";
// Ficha de una caja de temporada: contenido con las historias de procedencia, precio vigente y añadir.
import { useT, useLang } from "@/i18n";
import { trCaja, trExtra } from "@/i18n/catalogo";
import { cajaById } from "@/data/boxes";
import { extraById } from "@/data/extras";
import { eur } from "@/lib/format";
import { cajaEnTemporada, precioCaja } from "@/lib/season";
import { useCart } from "@/lib/cart";
import { useUi } from "@/lib/ui";

export default function CajaPanel() {
  const T = useT();
  const { lang } = useLang();
  const cajaId = useUi((s) => s.cajaId);
  const setCaja = useUi((s) => s.setCaja);
  const add = useCart((s) => s.add);
  if (!cajaId) return null;
  const caja = trCaja(cajaById(cajaId), lang); // catálogo en el idioma activo (fallback ES)
  const enTemporada = cajaEnTemporada(caja);
  const precio = precioCaja(caja);

  return (
    <aside className="fixed z-30 bottom-3 inset-x-3 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:right-4 sm:left-auto sm:w-[23rem] panel p-4 float-in max-h-[52vh] sm:max-h-[80vh] overflow-y-auto">
      <div className="flex items-start justify-between gap-2">
        <h2 className="font-display text-2xl leading-tight">{caja.nombre}</h2>
        <button onClick={() => setCaja(null)} className="sign px-2 py-0.5 text-xs" aria-label={T.a11y.cerrar}>✕</button>
      </div>
      <p className={`mt-1 text-xs font-bold ${enTemporada ? "text-[var(--salvia)]" : "text-[var(--granate)]"}`}>
        {enTemporada ? T.caja.enTemporada : T.caja.fueraTemporada}
      </p>
      <p className="mt-2 text-sm">{caja.descripcion}</p>

      <h3 className="mt-3 font-display text-sm">{T.caja.contiene}:</h3>
      <ul className="mt-1 space-y-2 text-sm">
        {caja.incluyeTeNormalAlAzar && <li className="pl-2 border-l-2 border-[var(--miel)]">🍃 {T.caja.teAlAzar}</li>}
        {caja.incluyeCucharaAlAzar && <li className="pl-2 border-l-2 border-[var(--miel)]">🥄 {T.caja.cucharaAlAzar}</li>}
        {caja.extras.map((id) => {
          const e = trExtra(extraById(id), lang);
          return (
            <li key={id} className="pl-2 border-l-2 border-[var(--miel)]">
              <span className="font-bold">{e.nombre}</span>
              <span className="block text-xs opacity-75">{e.procedencia}</span>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p>
          <span className="font-display text-xl">{eur(precio)}</span>
          {!enTemporada && (
            <span className="text-xs opacity-60 line-through ml-2">{eur(caja.precioTemporada)}</span>
          )}
        </p>
        <button className="btn-miel px-4 py-2 text-sm" onClick={() => { add("caja", caja.id); setCaja(null); }}>
          {T.sala.anadir}
        </button>
      </div>
      <p className="mt-3 text-[10px] opacity-70">{T.provisional}</p>
    </aside>
  );
}
