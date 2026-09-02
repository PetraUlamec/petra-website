// CAMBIOS GUARDADOS DE SER SOBRE LAS PIEZAS: lo que mueve/borra con el editor (?editor=1)
// se queda AQUÍ y la capa <Overrides/> lo aplica en cada sala al cargar. Sin tocar código.
// data/overrides.json = { [sala(pathname)]: { [idPieza]: { p, rotY, s, hidden } } }
//
// 2-sep-2026 (auditoría). Tres agujeros tapados:
//   1. Estaba ABIERTO: cualquiera movía u ocultaba los muebles de la tienda.
//   2. `DELETE` sin cuerpo BORRABA TODO (se comprobó: las 73 piezas colocadas → {}).
//      Ahora hay que pedirlo a propósito con {"todo":true} y con la clave del taller.
//   3. `sala` venía del cliente y se usaba como nombre de propiedad: con "__proto__" se
//      contaminaba el prototipo de TODOS los objetos del programa (prototype pollution).
// El GET sigue abierto a propósito: la tienda pública lo necesita para dibujar las salas,
// y solo devuelve posiciones de muebles (nada privado).
import { NextResponse } from "next/server";
import path from "path";
import { guardaTaller } from "@/lib/tallerAuth";
import { leerJSON, escribirJSON, claveSegura } from "@/lib/jsonSeguro";

export const runtime = "nodejs";
const FICHERO = path.join(process.cwd(), "data", "overrides.json");
const MAX_SALAS = 100;
const MAX_PIEZAS_POR_SALA = 1000;

type Ov = { p?: number[]; rotY?: number; s?: number; hidden?: boolean; cuando?: string };
type Todo = Record<string, Record<string, Ov>>;
type Cambio = { id: string; p?: number[]; rotY?: number; s?: number; hidden?: boolean };

/** Copia solo los campos esperados: nada de volcar el objeto del cliente tal cual. */
function aplica(prev: Ov, c: { p?: number[]; rotY?: number; s?: number; hidden?: boolean }): Ov {
  return {
    ...prev,
    ...(Array.isArray(c.p) && c.p.length === 3 && c.p.every((n) => typeof n === "number" && Number.isFinite(n)) ? { p: c.p } : {}),
    ...(typeof c.rotY === "number" && Number.isFinite(c.rotY) ? { rotY: c.rotY } : {}),
    ...(typeof c.s === "number" && Number.isFinite(c.s) ? { s: c.s } : {}),
    ...(typeof c.hidden === "boolean" ? { hidden: c.hidden } : {}),
    cuando: new Date().toISOString(),
  };
}

export async function GET(req: Request) {
  const sala = new URL(req.url).searchParams.get("sala");
  const d = await leerJSON<Todo>(FICHERO, {});
  if (!sala) return NextResponse.json(d);
  return NextResponse.json(Object.hasOwn(d, sala) ? d[sala] : {});
}

export async function POST(req: Request) {
  const corte = guardaTaller(req);
  if (corte) return corte;
  let b: { sala?: string; id?: string; p?: number[]; rotY?: number; s?: number; hidden?: boolean; cambios?: Cambio[] };
  try { b = await req.json(); } catch { return NextResponse.json({ error: "JSON no válido" }, { status: 400 }); }

  if (!claveSegura(b.sala) || b.sala.length > 120)
    return NextResponse.json({ error: "sala no válida" }, { status: 400 });
  const d = await leerJSON<Todo>(FICHERO, {});
  if (!Object.hasOwn(d, b.sala)) {
    if (Object.keys(d).length >= MAX_SALAS) return NextResponse.json({ error: "demasiadas salas guardadas" }, { status: 409 });
    d[b.sala] = {};
  }
  const sala = d[b.sala];

  // LOTE: {sala, cambios:[…]} — lo usa el botón «Guardar todo» del editor
  if (Array.isArray(b.cambios)) {
    let guardadas = 0;
    for (const c of b.cambios) {
      if (!c || !claveSegura(c.id) || c.id.length > 200) continue;
      if (!Object.hasOwn(sala, c.id) && Object.keys(sala).length >= MAX_PIEZAS_POR_SALA) break;
      sala[c.id] = aplica(Object.hasOwn(sala, c.id) ? sala[c.id] : {}, c);
      guardadas++;
    }
    await escribirJSON(FICHERO, d);
    return NextResponse.json({ ok: true, guardadas });
  }

  if (!claveSegura(b.id) || b.id.length > 200) return NextResponse.json({ error: "id no válido" }, { status: 400 });
  if (!Object.hasOwn(sala, b.id) && Object.keys(sala).length >= MAX_PIEZAS_POR_SALA)
    return NextResponse.json({ error: "demasiadas piezas guardadas en esta sala" }, { status: 409 });
  sala[b.id] = aplica(Object.hasOwn(sala, b.id) ? sala[b.id] : {}, b);
  await escribirJSON(FICHERO, d);
  return NextResponse.json({ ok: true, sala: b.sala, id: b.id, total: Object.keys(sala).length });
}

/**
 * DELETE {sala, id} borra el ajuste de una pieza · DELETE {sala} vacía esa sala ·
 * DELETE {todo:true} borra TODOS los ajustes (hay que pedirlo a propósito: antes lo hacía
 * un DELETE sin cuerpo, y cualquiera podía borrar el trabajo de colocación entero).
 */
export async function DELETE(req: Request) {
  const corte = guardaTaller(req);
  if (corte) return corte;
  let b: { sala?: string; id?: string; todo?: boolean } = {};
  try { b = await req.json(); } catch { /* sin cuerpo */ }
  const d = await leerJSON<Todo>(FICHERO, {});
  if (b.todo === true) {
    await escribirJSON(FICHERO, {});
    return NextResponse.json({ ok: true, borrado: "todo" });
  }
  if (!claveSegura(b.sala))
    return NextResponse.json({ error: 'indica {"sala": …} (y opcionalmente "id"), o {"todo": true} para borrarlo todo' }, { status: 400 });
  if (!Object.hasOwn(d, b.sala)) return NextResponse.json({ ok: true, borrado: "nada" });
  if (b.id !== undefined) {
    if (!claveSegura(b.id)) return NextResponse.json({ error: "id no válido" }, { status: 400 });
    delete d[b.sala][b.id];
  } else {
    delete d[b.sala];
  }
  await escribirJSON(FICHERO, d);
  return NextResponse.json({ ok: true });
}
