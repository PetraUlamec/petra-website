// API del catálogo vivo (LOCAL): lee/escribe web/data/catalogo-vivo.json.
// Cuando la tienda salga a internet, esta ruta se protege con clave o se sustituye por un CMS.
import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { esClaveValida } from "@/lib/biblioteca-claves";

export const runtime = "nodejs";
const FICHERO = path.join(process.cwd(), "data", "catalogo-vivo.json");

async function leer() {
  try { return JSON.parse(await fs.readFile(FICHERO, "utf8")); }
  catch { return { teas: [], extras: [], deco: [] }; }
}
async function guardar(d: unknown) {
  await fs.mkdir(path.dirname(FICHERO), { recursive: true });
  await fs.writeFile(FICHERO, JSON.stringify(d, null, 2), "utf8");
}
const slug = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export async function GET() {
  return NextResponse.json(await leer());
}

function claveOk(req: Request) {
  const esperada = process.env.TALLER_KEY ?? "petra";
  return (req.headers.get("x-taller-key") ?? "") === esperada;
}

/** Lo que puede llegar del taller (todo opcional: la validación es la de abajo). */
interface ItemIn {
  nombre?: string; sala?: string; precio?: number | string; gramos?: number | string;
  paraQueSirve?: string; colorHoja?: string; plantas?: { plantaId?: string; porQueEnEsteMix?: string }[];
  tipo?: string; hechoPor?: string; procedencia?: string; foto?: string;
  pieza?: string; x?: number; z?: number; rotY?: number; escala?: number; y?: number;
}
/** Cuerpo JSON tolerante: un cuerpo roto es un 400 con explicación, no un 500 sin nada. */
async function cuerpo(req: Request): Promise<{ tipo?: string; item?: ItemIn; id?: string } | null> {
  try { const d = await req.json(); return d && typeof d === "object" ? d : null; } catch { return null; }
}

export async function POST(req: Request) {
  if (!claveOk(req)) return NextResponse.json({ error: "clave del taller incorrecta" }, { status: 401 });
  const body = await cuerpo(req);
  if (!body) return NextResponse.json({ error: "cuerpo no válido (se espera JSON)" }, { status: 400 });
  const { tipo, item } = body;
  const d = await leer();
  if (tipo === "tea") {
    const precio = Number(item?.precio);
    if (!item?.nombre || !Array.isArray(item?.plantas) || item.plantas.length === 0 || !Number.isFinite(precio) || precio <= 0)
      return NextResponse.json({ error: "Faltan nombre o plantas, o el precio no es válido" }, { status: 400 });
    const t = {
      id: slug(item.nombre), nombre: item.nombre,
      sala: item.sala === "te-premium" ? "te-premium" : "te",
      precio, gramos: Number(item.gramos) || 60,
      paraQueSirve: item.paraQueSirve || "", colorHoja: item.colorHoja || "#C9B36A",
      ...(item.foto ? { foto: String(item.foto) } : {}),
      plantas: item.plantas.filter((p: { plantaId?: string }) => p?.plantaId),
    };
    d.teas = d.teas.filter((x: { id: string }) => x.id !== t.id).concat(t);
  } else if (tipo === "extra") {
    if (!item?.nombre || !item?.procedencia)
      return NextResponse.json({ error: "Faltan nombre o historia/procedencia" }, { status: 400 });
    const e = {
      id: slug(item.nombre), nombre: item.nombre,
      tipo: ["cuchara", "queso", "carne", "limonada", "miel"].includes(item.tipo ?? "") ? item.tipo : "queso",
      hechoPor: item.hechoPor === "Erik" ? "Erik" : "Petra",
      procedencia: item.procedencia,
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

export async function DELETE(req: Request) {
  if (!claveOk(req)) return NextResponse.json({ error: "clave del taller incorrecta" }, { status: 401 });
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
