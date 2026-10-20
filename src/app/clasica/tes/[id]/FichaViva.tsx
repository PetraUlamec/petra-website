"use client";
// Resuelve el té por id: primero el catálogo de la casa, luego el VIVO del taller (foto incluida).
import { useEffect, useState } from "react";
import Link from "next/link";
import { TEAS } from "@/data/teas";
import { getVivo, cargarVivo, subscribeVivo } from "@/lib/vivoStore";
import { useT } from "@/i18n";
import type { Tea, Plant } from "@/lib/types";
import FichaTe from "./FichaTe";

export default function FichaVivaOEstatica({ id, initialTea, initialPlants }: { id: string; initialTea?: Tea | null; initialPlants?: Plant[] }) {
  const T = useT();
  const [tea, setTea] = useState<Tea | null>(() => initialTea ?? TEAS.find((t) => t.id === id) ?? null);
  const [listo, setListo] = useState(!!initialTea || !!TEAS.find((t) => t.id === id));
  useEffect(() => {
    const busca = () => {
      const v = getVivo().teas.find((t) => t.id === id) ?? TEAS.find((t) => t.id === id) ?? null;
      setTea(v); setListo(true);
    };
    cargarVivo().then(busca);
    return subscribeVivo(busca);
  }, [id]);
  if (!listo) return <main className="max-w-4xl mx-auto px-4 pt-16 min-h-[50vh]" />;
  if (!tea) return (
    <main className="max-w-4xl mx-auto px-4 pt-16 min-h-[50vh]">
      <p className="font-display text-2xl">404 — ese tarro no está en la estantería.</p>
      <Link className="underline underline-offset-4 mt-3 inline-block" href="/clasica/tes">← {T.cl.volver}</Link>
    </main>
  );
  return <FichaTe tea={tea} initialPlants={initialPlants} />;
}
