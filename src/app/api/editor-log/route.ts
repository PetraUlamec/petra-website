// Registro del MODO EDITOR: cada pieza que se mueve/rota/marca queda aquí.
// 2-sep-2026 (auditoría): estaba ABIERTO — cualquiera podía leerlo, inflarlo hasta llenar el
// disco (se reescribe entero en cada apunte) o vaciarlo. Ahora exige la clave del taller y
// tiene tope de entradas.
import { NextResponse } from "next/server";
import path from "path";
import { guardaTaller } from "@/lib/tallerAuth";
import { leerJSON, escribirJSON } from "@/lib/jsonSeguro";

export const runtime = "nodejs";
const FICHERO = path.join(process.cwd(), "data", "editor-log.json");
/** Se queda con los últimos N apuntes: el registro no puede crecer sin fin. */
const MAX_APUNTES = 2000;

export async function GET(req: Request) {
  const corte = guardaTaller(req);
  if (corte) return corte;
  return NextResponse.json(await leerJSON<unknown[]>(FICHERO, []));
}

export async function POST(req: Request) {
  const corte = guardaTaller(req);
  if (corte) return corte;
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "JSON no válido" }, { status: 400 }); }
  const lista = await leerJSON<unknown[]>(FICHERO, []);
  lista.push({ ...(body as object), cuando: new Date().toISOString() });
  const recortada = lista.length > MAX_APUNTES ? lista.slice(-MAX_APUNTES) : lista;
  await escribirJSON(FICHERO, recortada);
  return NextResponse.json({ ok: true, total: recortada.length });
}

export async function DELETE(req: Request) {
  const corte = guardaTaller(req);
  if (corte) return corte;
  await escribirJSON(FICHERO, []);
  return NextResponse.json({ ok: true });
}
