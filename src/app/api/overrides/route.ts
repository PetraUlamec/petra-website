// CAMBIOS GUARDADOS DE SER SOBRE LAS PIEZAS (23-ago): lo que mueve/borra con el editor (?editor=1)
// se queda AQUÍ y la capa <Overrides/> lo aplica en cada sala al cargar. Sin tocar código.
// data/overrides.json = { [sala(pathname)]: { [idPieza]: { p, rotY, s, hidden } } }
import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const FICHERO = path.join(process.cwd(), "data", "overrides.json");
type Ov = { p?: number[]; rotY?: number; s?: number; hidden?: boolean; cuando?: string };
type Todo = Record<string, Record<string, Ov>>;

async function leer(): Promise<Todo> {
  try { return JSON.parse(await fs.readFile(FICHERO, "utf8")); } catch { return {}; }
}
async function guardar(d: Todo) {
  await fs.mkdir(path.dirname(FICHERO), { recursive: true });
  await fs.writeFile(FICHERO, JSON.stringify(d, null, 2));
}

export async function GET(req: Request) {
  const sala = new URL(req.url).searchParams.get("sala");
  const d = await leer();
  return NextResponse.json(sala ? (d[sala] ?? {}) : d);
}

export async function POST(req: Request) {
  let b: { sala?: string; id?: string; p?: number[]; rotY?: number; s?: number; hidden?: boolean;
           cambios?: { id: string; p?: number[]; rotY?: number; s?: number; hidden?: boolean }[] };
  try { b = await req.json(); } catch { return NextResponse.json({ error: "JSON no válido" }, { status: 400 }); }
  // LOTE: {sala, cambios:[…]} — lo usa el botón «Guardar todo» del editor
  if (b.sala && Array.isArray(b.cambios)) {
    const d = await leer();
    d[b.sala] ??= {};
    for (const c of b.cambios) {
      if (!c?.id) continue;
      d[b.sala][c.id] = { ...(d[b.sala][c.id] ?? {}), ...(c.p ? { p: c.p } : {}),
        ...(c.rotY !== undefined ? { rotY: c.rotY } : {}), ...(c.s !== undefined ? { s: c.s } : {}),
        ...(c.hidden !== undefined ? { hidden: c.hidden } : {}), cuando: new Date().toISOString() };
    }
    await guardar(d);
    return NextResponse.json({ ok: true, guardadas: b.cambios.length });
  }
  if (!b.sala || !b.id) return NextResponse.json({ error: "faltan sala e id" }, { status: 400 });
  const d = await leer();
  d[b.sala] ??= {};
  const prev = d[b.sala][b.id] ?? {};
  d[b.sala][b.id] = { ...prev, ...(b.p ? { p: b.p } : {}), ...(b.rotY !== undefined ? { rotY: b.rotY } : {}),
    ...(b.s !== undefined ? { s: b.s } : {}), ...(b.hidden !== undefined ? { hidden: b.hidden } : {}), cuando: new Date().toISOString() };
  await guardar(d);
  return NextResponse.json({ ok: true, sala: b.sala, id: b.id, total: Object.keys(d[b.sala]).length });
}

/** DELETE {sala, id} borra el cambio de una pieza (vuelve a como está en el código); DELETE {sala} vacía la sala. */
export async function DELETE(req: Request) {
  let b: { sala?: string; id?: string } = {};
  try { b = await req.json(); } catch { /* sin cuerpo: todo */ }
  const d = await leer();
  if (b.sala && b.id) { delete d[b.sala]?.[b.id]; }
  else if (b.sala) { delete d[b.sala]; }
  else { for (const k of Object.keys(d)) delete d[k]; }
  await guardar(d);
  return NextResponse.json({ ok: true });
}
