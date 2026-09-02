"use client";
// El catálogo completo: todas las láminas de la casa, con el filtro justo y necesario.
import { useEffect, useState } from "react";
import { teasBySala } from "@/data/teas";
import { subscribeVivo, cargarVivo, getVivoVersion } from "@/lib/vivoStore";
import { useT } from "@/i18n";
import Lamina from "@/components/clasica/Lamina";

export default function CatalogoTes() {
  const T = useT();
  const [filtro, setFiltro] = useState<"todos" | "te" | "te-premium">("todos");
  const [, setV] = useState(getVivoVersion());
  useEffect(() => { cargarVivo(); return subscribeVivo(() => setV(getVivoVersion())); }, []);
  const lista = [...teasBySala("te"), ...teasBySala("te-premium")].filter((t) => filtro === "todos" || t.sala === filtro);
  const F = [
    { id: "todos" as const, t: T.cl.filtroTodos },
    { id: "te" as const, t: T.cl.filtroClasicos },
    { id: "te-premium" as const, t: T.cl.filtroPremium },
  ];
  return (
    <main className="max-w-[1240px] mx-auto px-4 sm:px-6 pt-12 pb-4">
      <p className="eyebrow">{T.cl.heroEyebrow}</p>
      <h1 className="font-display text-4xl sm:text-5xl mt-2">{T.cl.navTes}</h1>
      <div className="flex gap-2 mt-6" role="group" aria-label={T.cl.filtroTodos}>
        {F.map((f) => (
          <button key={f.id} onClick={() => setFiltro(f.id)}
            aria-pressed={filtro === f.id}
            className={`px-3.5 min-h-10 text-sm rounded-full border transition-colors ${filtro === f.id ? "bg-[var(--madera-oscura)] text-[var(--crema)] border-transparent" : "border-[rgba(58,37,19,0.3)] hover:bg-[rgba(58,37,19,0.05)]"}`}>
            {f.t}
          </button>
        ))}
      </div>
      {filtro === "te-premium" && <p className="text-sm mt-3 text-[var(--granate)]">{T.cl.premiumNota}</p>}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {lista.map((t, i) => <Lamina key={t.id} tea={t} num={i + 1} />)}
      </div>
    </main>
  );
}
