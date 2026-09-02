// PUERTA DEL EDITOR VISUAL (24-ago): añadir/borrar piezas de decoración desde el editor (?editor=1)
// sin la clave del taller. Escribe en el MISMO catálogo vivo (data/catalogo-vivo.json → deco[]),
// así lo que SER coloca lo ve la tienda igual que lo que publica Petra desde /taller-privado.
// NOTA para el día que salga a internet: proteger esta ruta igual que /api/catalogo (o quitarla).
import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { esClaveValida } from "@/lib/biblioteca-claves";

const FICHERO = path.join(process.cwd(), "data", "catalogo-vivo.json");
type Deco = { id: string; sala: string; pieza: string; x: number; z: number; rotY: number; escala: number; y?: number };
type Cat = { teas?: unknown[]; extras?: unknown[]; deco?: Deco[] };

async function leer(): Promise<Cat> {
  try { return JSON.parse(await fs.readFile(FICHERO, "utf8")); } catch { return { teas: [], extras: [], deco: [] }; }
}
async function guardar(d: Cat) {
  await fs.mkdir(path.dirname(FICHERO), { recursive: true });
  await fs.writeFile(FICHERO, JSON.stringify(d, null, 2));
}
const lim = (v: unknown, min: number, max: number, def = 0) => {
  const n = Number(v); return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : def;
};

export async function POST(req: Request) {
  let b: { pieza?: string; sala?: string; x?: number; z?: number; y?: number; rotY?: number; escala?: number };
  try { b = await req.json(); } catch { return NextResponse.json({ error: "JSON no válido" }, { status: 400 }); }
  if (!b.pieza || !esClaveValida(String(b.pieza))) return NextResponse.json({ error: `pieza desconocida: ${b.pieza}` }, { status: 400 });
  if (!b.sala) return NextResponse.json({ error: "falta la sala" }, { status: 400 });
  const d = await leer();
  const p: Deco = {
    id: `${b.pieza}-${Date.now().toString(36)}`,
    sala: String(b.sala), pieza: String(b.pieza),
    x: lim(b.x, -18, 18), z: lim(b.z, -18, 18),
    rotY: lim(b.rotY, -360, 360), escala: lim(b.escala, 0.2, 4, 1),
    ...(b.y !== undefined ? { y: lim(b.y, 0, 6) } : {}),
  };
  d.deco = (d.deco ?? []).concat(p);
  await guardar(d);
  return NextResponse.json({ ok: true, pieza: p });
}

export async function DELETE(req: Request) {
  let b: { id?: string };
  try { b = await req.json(); } catch { return NextResponse.json({ error: "JSON no válido" }, { status: 400 }); }
  if (!b.id) return NextResponse.json({ error: "falta el id" }, { status: 400 });
  const d = await leer();
  d.deco = (d.deco ?? []).filter((x) => x.id !== b.id);
  await guardar(d);
  return NextResponse.json({ ok: true });
}
