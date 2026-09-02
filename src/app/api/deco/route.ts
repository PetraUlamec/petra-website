// PUERTA DEL EDITOR VISUAL: añadir/borrar piezas de decoración desde el editor (?editor=1).
// Escribe en el MISMO catálogo vivo (data/catalogo-vivo.json → deco[]), así lo que SER coloca
// lo ve la tienda igual que lo que publica Petra desde /taller-privado.
//
// 2-sep-2026 (auditoría): esta ruta estaba ABIERTA — cualquiera en internet podía llenar la
// tienda de piezas o borrar la decoración. Ahora exige la clave del taller, igual que /api/catalogo.
import { NextResponse } from "next/server";
import path from "path";
import { esClaveValida } from "@/lib/biblioteca-claves";
import { guardaTaller } from "@/lib/tallerAuth";
import { leerJSON, escribirJSON } from "@/lib/jsonSeguro";

export const runtime = "nodejs";
const FICHERO = path.join(process.cwd(), "data", "catalogo-vivo.json");
/** Tope de piezas: sin él, un bucle automático llena el disco y ahoga el render 3D. */
const MAX_PIEZAS = 600;

type Deco = { id: string; sala: string; pieza: string; x: number; z: number; rotY: number; escala: number; y?: number };
type Cat = { teas?: unknown[]; extras?: unknown[]; deco?: Deco[] };

const vacio: Cat = { teas: [], extras: [], deco: [] };
const lim = (v: unknown, min: number, max: number, def = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : def;
};

export async function POST(req: Request) {
  const corte = guardaTaller(req);
  if (corte) return corte;
  let b: { pieza?: string; sala?: string; x?: number; z?: number; y?: number; rotY?: number; escala?: number };
  try { b = await req.json(); } catch { return NextResponse.json({ error: "JSON no válido" }, { status: 400 }); }
  if (!b.pieza || !esClaveValida(String(b.pieza))) return NextResponse.json({ error: `pieza desconocida: ${b.pieza}` }, { status: 400 });
  if (!b.sala || typeof b.sala !== "string" || b.sala.length > 60) return NextResponse.json({ error: "falta la sala (o no es válida)" }, { status: 400 });
  const d = await leerJSON<Cat>(FICHERO, vacio);
  const deco = d.deco ?? [];
  if (deco.length >= MAX_PIEZAS)
    return NextResponse.json({ error: `demasiadas piezas (máximo ${MAX_PIEZAS}); borra alguna antes de añadir` }, { status: 409 });
  const p: Deco = {
    id: `${b.pieza}-${Date.now().toString(36)}`,
    sala: String(b.sala), pieza: String(b.pieza),
    x: lim(b.x, -18, 18), z: lim(b.z, -18, 18),
    rotY: lim(b.rotY, -360, 360), escala: lim(b.escala, 0.2, 4, 1),
    ...(b.y !== undefined ? { y: lim(b.y, 0, 6) } : {}),
  };
  d.deco = deco.concat(p);
  await escribirJSON(FICHERO, d);
  return NextResponse.json({ ok: true, pieza: p });
}

export async function DELETE(req: Request) {
  const corte = guardaTaller(req);
  if (corte) return corte;
  let b: { id?: string };
  try { b = await req.json(); } catch { return NextResponse.json({ error: "JSON no válido" }, { status: 400 }); }
  if (!b.id) return NextResponse.json({ error: "falta el id" }, { status: 400 });
  const d = await leerJSON<Cat>(FICHERO, vacio);
  d.deco = (d.deco ?? []).filter((x) => x.id !== b.id);
  await escribirJSON(FICHERO, d);
  return NextResponse.json({ ok: true });
}
