// Registro del MODO EDITOR de SER: cada pieza que mueve/rota/marca queda aquí,
// y Claude lo lee para fijar los cambios en el código. Solo en local.
import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const FICHERO = path.join(process.cwd(), "data", "editor-log.json");

async function leer(): Promise<unknown[]> {
  try { return JSON.parse(await fs.readFile(FICHERO, "utf8")); } catch { return []; }
}

export async function GET() {
  return NextResponse.json(await leer());
}

export async function POST(req: Request) {
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "JSON no válido" }, { status: 400 }); }
  const lista = await leer();
  lista.push({ ...(body as object), cuando: new Date().toISOString() });
  await fs.mkdir(path.dirname(FICHERO), { recursive: true });
  await fs.writeFile(FICHERO, JSON.stringify(lista, null, 2));
  return NextResponse.json({ ok: true, total: lista.length });
}

export async function DELETE() {
  await fs.mkdir(path.dirname(FICHERO), { recursive: true });
  await fs.writeFile(FICHERO, "[]");
  return NextResponse.json({ ok: true });
}
