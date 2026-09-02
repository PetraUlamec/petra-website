"use client";
// EL CATÁLOGO VIVO: lo que Petra y Erik publican desde /taller-privado sin tocar código.
// Se guarda en web/data/catalogo-vivo.json vía /api/catalogo y se suma al catálogo base.
import type { Tea, Extra } from "./types";

export interface PiezaViva {
  id: string;
  sala: string;       // te | te-premium | salon | carrito | nosotros | contacto | intro
  pieza: string;      // clave de la biblioteca (cruz, vela, frutero, mesa, silla, butaca, farol, lampara…)
  x: number; z: number;
  rotY: number;       // grados
  escala: number;
  y?: number;         // altura (piezas de pared)
}
export interface VivoData { teas: Tea[]; extras: Extra[]; deco?: PiezaViva[]; }
let VIVO: VivoData = { teas: [], extras: [], deco: [] };
let version = 0;
const listeners = new Set<() => void>();

export function setVivo(d: VivoData) {
  VIVO = { teas: d.teas ?? [], extras: d.extras ?? [], deco: d.deco ?? [] };
  version++;
  listeners.forEach((l) => l());
}
export const getVivo = () => VIVO;
export const getVivoVersion = () => version;
export function subscribeVivo(fn: () => void) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

let cargado = false;
export async function cargarVivo() {
  if (cargado || typeof window === "undefined") return;
  cargado = true;
  try {
    const r = await fetch("/api/catalogo");
    if (r.ok) setVivo(await r.json());
  } catch { /* sin catálogo vivo: solo base */ }
}

/** Vuelve a leer el catálogo vivo (tras añadir/borrar desde el editor). */
export async function recargarVivo() {
  try { const r = await fetch("/api/catalogo", { cache: "no-store" }); if (r.ok) setVivo(await r.json()); } catch { /* sin red */ }
}
