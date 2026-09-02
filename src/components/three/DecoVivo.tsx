"use client";
// Pinta en cada sala las piezas que Petra (o SER con el editor ?editor=1) ha colocado.
// El QUÉ se dibuja vive en biblioteca.tsx; aquí solo se pinta lo guardado en el catálogo vivo.
import { useEffect, useState } from "react";
import { getVivo, getVivoVersion, subscribeVivo, type PiezaViva } from "@/lib/vivoStore";
import { REGISTRO, ALIAS, etiquetaDe, CATEGORIAS, porCategoria, alturaDe, esDePared } from "./biblioteca";

export { CATEGORIAS, porCategoria, alturaDe, esDePared, etiquetaDe };
export const BIBLIOTECA = Object.keys(REGISTRO);
export const ETIQUETA_PIEZA: Record<string, string> = Object.fromEntries(
  Object.entries(REGISTRO).map(([k, v]) => [k, v.etiqueta]));

function Pieza({ p }: { p: PiezaViva }) {
  const clave = REGISTRO[p.pieza] ? p.pieza : ALIAS[p.pieza];
  const e = clave ? REGISTRO[clave] : undefined;
  return e ? <>{e.render(p)}</> : null;
}

export default function DecoVivo({ sala }: { sala: string }) {
  const [, setV] = useState(0);
  useEffect(() => subscribeVivo(() => setV(getVivoVersion())), []);
  const piezas = (getVivo().deco ?? []).filter((p) => p.sala === sala);
  return (
    <group>
      {/* name = id del catálogo → el editor la reconoce, la mueve, la duplica o la borra */}
      {piezas.map((p) => <group key={p.id} name={p.id} userData={{ vivoId: p.id, vivo: p }}><Pieza p={p} /></group>)}
    </group>
  );
}
