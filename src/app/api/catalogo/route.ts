// API del catálogo vivo: lee/escribe web/data/catalogo-vivo.json.
// 2-sep-2026 (auditoría): la clave ya no tiene valor por defecto ("petra" estaba escrita en el
// código); ahora pasa por la puerta única del taller. Guardado atómico y topes de tamaño.
import path from "path";
import { NextResponse } from "next/server";
import { esClaveValida } from "@/lib/biblioteca-claves";
import { guardaTaller } from "@/lib/tallerAuth";
import { leerJSON, escribirJSON } from "@/lib/jsonSeguro";
import { PLANTS } from "@/data/plants";
import type { Plant } from "@/lib/types";
import { FORMAS_PLANTA } from "@/data/formasPlanta";
import { promises as fs } from "fs";
import { randomUUID } from "crypto";

export const runtime = "nodejs";
const FICHERO = path.join(process.cwd(), "data", "catalogo-vivo.json");
const MAX_ITEMS = 500;          // tés o extras publicados
const MAX_TEXTO = 2000;         // largo de cualquier texto que llegue del taller

interface CatalogoVivo { teas: any[]; extras: any[]; plants?: Plant[]; deco?: any[] }
const leer = () => leerJSON<CatalogoVivo>(FICHERO, { teas: [], extras: [], deco: [] }, true);
const guardar = async (data: unknown) => {
  const directory = path.join(process.cwd(), "data", ".history");
  await fs.mkdir(directory, { recursive: true });
  try { await fs.copyFile(FICHERO, path.join(directory, `catalogo-${Date.now()}-${randomUUID()}.json`)); }
  catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
  await escribirJSON(FICHERO, data);
};
let escritura: Promise<unknown> = Promise.resolve();
function serializar(action: () => Promise<NextResponse>) {
  const next = escritura.then(action, action);
  escritura = next.catch(() => undefined);
  return next;
}
/** Recorta cualquier texto del taller: ni descomunal ni con caracteres de control. */
const txt = (v: unknown, max = MAX_TEXTO) =>
  String(v ?? "").replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, max);
const slug = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export async function GET() {
  return NextResponse.json(await leer(), { headers: { "Cache-Control": "no-store" } });
}

/** Lo que puede llegar del taller (todo opcional: la validación es la de abajo). */
interface ItemIn {
  id?: string;
  latin?: string; color?: string; color2?: string; forma?: string;
  nombre?: string; sala?: string; precio?: number | string; gramos?: number | string;
  paraQueSirve?: string; colorHoja?: string; plantas?: { plantaId?: string; porQueEnEsteMix?: string }[];
  tipo?: string; hechoPor?: string; procedencia?: string; foto?: string;
  pieza?: string; x?: number; z?: number; rotY?: number; escala?: number; y?: number;
}
/** Cuerpo JSON tolerante: un cuerpo roto es un 400 con explicación, no un 500 sin nada. */
async function cuerpo(req: Request): Promise<{ tipo?: string; item?: ItemIn; id?: string } | null> {
  try { const d = await req.json(); return d && typeof d === "object" ? d : null; } catch { return null; }
}

export function POST(req: Request) { return serializar(() => publicar(req)); }
async function publicar(req: Request) {
  const corte = guardaTaller(req);
  if (corte) return corte;
  const body = await cuerpo(req);
  if (!body) return NextResponse.json({ error: "cuerpo no válido (se espera JSON)" }, { status: 400 });
  const { tipo, item } = body;
  const d = await leer();
  if (tipo === "tea") {
    const precio = Number(item?.precio);
    if (!txt(item?.nombre) || !Array.isArray(item?.plantas) || item.plantas.length === 0 || !Number.isFinite(precio) || precio < 0.01)
      return NextResponse.json({ error: "Faltan nombre o plantas, o el precio no es válido" }, { status: 400 });
    const id = item.id ?? slug(txt(item.nombre, 120));
    const gramos = Number(item.gramos ?? 60);
    if (!/^[a-z0-9][a-z0-9-]{0,119}$/.test(id) || !Number.isFinite(gramos) || gramos <= 0 || gramos > 10000 || precio > 10000)
      return NextResponse.json({ error: "Identificador, peso o precio no válido" }, { status: 400 });
    const herbario = [...PLANTS, ...(d.plants ?? [])];
    if (item.plantas.length > herbario.length || item.plantas.some((planta) => !planta || !herbario.some((known) => known.id === planta.plantaId)) || new Set(item.plantas.map((planta) => planta.plantaId)).size !== item.plantas.length)
      return NextResponse.json({ error: "Selecciona plantas del herbario, sin repetir" }, { status: 400 });
    if (item.foto && !/^\/(?:api\/imagen|fotos)\/[a-zA-Z0-9_.-]+$/.test(item.foto))
      return NextResponse.json({ error: "Foto no válida" }, { status: 400 });
    if (d.teas.length >= MAX_ITEMS && !d.teas.some((tea) => tea.id === id)) return NextResponse.json({ error: "demasiados tés publicados" }, { status: 409 });
    const t = {
      id, nombre: txt(item.nombre, 120), editado: true,
      sala: item.sala === "te-premium" ? "te-premium" : "te",
      precio: Math.round(precio * 100) / 100, gramos,
      paraQueSirve: txt(item.paraQueSirve), colorHoja: /^#[0-9a-fA-F]{3,8}$/.test(String(item.colorHoja)) ? item.colorHoja : "#C9B36A",
      ...(item.foto ? { foto: String(item.foto) } : {}),
      plantas: item.plantas.map((planta) => ({ plantaId: planta.plantaId, porQueEnEsteMix: txt(planta.porQueEnEsteMix) })),
    };
    d.teas = d.teas.filter((x: { id: string }) => x.id !== t.id).concat(t);
  } else if (tipo === "plant") {
    const id = item?.id ?? slug(txt(item?.nombre, 120));
    const formas = Object.keys(FORMAS_PLANTA);
    if (!item?.nombre?.trim() || !/^[a-z0-9][a-z0-9-]{0,119}$/.test(id) || !formas.includes(item.forma ?? "") || !/^#[0-9a-f]{6}$/i.test(item.color ?? "") || !/^#[0-9a-f]{6}$/i.test(item.color2 ?? ""))
      return NextResponse.json({ error: "Revisa nombre, forma y colores de la planta" }, { status: 400 });
    if ((d.plants?.length ?? 0) >= MAX_ITEMS && !d.plants?.some((plant) => plant.id === id))
      return NextResponse.json({ error: "Demasiadas plantas" }, { status: 409 });
    const plant: Plant = { id, nombre: txt(item.nombre, 120), latin: txt(item.latin, 120), color: item.color!, color2: item.color2!, forma: item.forma as Plant["forma"] };
    d.plants = [...(d.plants ?? []).filter((known) => known.id !== id), plant];
  } else if (tipo === "extra") {
    if (!item?.nombre || !item?.procedencia)
      return NextResponse.json({ error: "Faltan nombre o historia/procedencia" }, { status: 400 });
    if (d.extras.length >= MAX_ITEMS) return NextResponse.json({ error: "demasiados extras publicados" }, { status: 409 });
    const e = {
      id: slug(item.nombre), nombre: txt(item.nombre, 120),
      tipo: ["cuchara", "queso", "carne", "limonada", "miel"].includes(item.tipo ?? "") ? item.tipo : "queso",
      hechoPor: item.hechoPor === "Erik" ? "Erik" : "Petra",
      procedencia: txt(item.procedencia),
      ...(item.foto ? { foto: String(item.foto) } : {}),
    };
    d.extras = d.extras.filter((x: { id: string }) => x.id !== e.id).concat(e);
  } else if (tipo === "deco") {
    if (!item?.pieza || !esClaveValida(String(item.pieza)) || !item?.sala)
      return NextResponse.json({ error: "pieza o sala no válida" }, { status: 400 });
    const p = {
      id: `${item.pieza}-${Date.now().toString(36)}`,
      sala: String(item.sala), pieza: String(item.pieza),
      x: Math.max(-4.6, Math.min(4.6, Number(item.x) || 0)),
      z: Math.max(-4.6, Math.min(4.6, Number(item.z) || 0)),
      rotY: Number(item.rotY) || 0,
      escala: Math.max(0.4, Math.min(2.5, Number(item.escala) || 1)),
      y: item.y !== undefined ? Math.max(0.4, Math.min(4, Number(item.y))) : undefined,
    };
    d.deco = (d.deco ?? []).concat(p);
  } else return NextResponse.json({ error: "tipo desconocido" }, { status: 400 });
  await guardar(d);
  return NextResponse.json(d);
}

export function DELETE(req: Request) { return serializar(() => retirar(req)); }
async function retirar(req: Request) {
  const corte = guardaTaller(req);
  if (corte) return corte;
  const body = await cuerpo(req);
  if (!body) return NextResponse.json({ error: "cuerpo no válido (se espera JSON)" }, { status: 400 });
  const { tipo, id } = body;
  const d = await leer();
  if (tipo === "tea") d.teas = d.teas.filter((x: { id: string }) => x.id !== id);
  else if (tipo === "extra") d.extras = d.extras.filter((x: { id: string }) => x.id !== id);
  else if (tipo === "deco") d.deco = (d.deco ?? []).filter((x: { id: string }) => x.id !== id);
  await guardar(d);
  return NextResponse.json(d);
}
