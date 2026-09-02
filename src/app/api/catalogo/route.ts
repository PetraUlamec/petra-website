// API del catálogo vivo: lee/escribe web/data/catalogo-vivo.json.
// 2-sep-2026 (auditoría): la clave ya no tiene valor por defecto ("petra" estaba escrita en el
// código); ahora pasa por la puerta única del taller. Guardado atómico y topes de tamaño.
import path from "path";
import { NextResponse } from "next/server";
import { esClaveValida } from "@/lib/biblioteca-claves";
import { guardaTaller } from "@/lib/tallerAuth";
import { leerJSON, escribirJSON } from "@/lib/jsonSeguro";

export const runtime = "nodejs";
const FICHERO = path.join(process.cwd(), "data", "catalogo-vivo.json");
const MAX_ITEMS = 500;          // tés o extras publicados
const MAX_TEXTO = 2000;         // largo de cualquier texto que llegue del taller

interface CatalogoVivo { teas: any[]; extras: any[]; deco?: any[] }
const leer = () => leerJSON<CatalogoVivo>(FICHERO, { teas: [], extras: [], deco: [] });
const guardar = (d: unknown) => escribirJSON(FICHERO, d);
/** Recorta cualquier texto del taller: ni descomunal ni con caracteres de control. */
const txt = (v: unknown, max = MAX_TEXTO) =>
  String(v ?? "").replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, max);
const slug = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export async function GET() {
  return NextResponse.json(await leer());
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
  const corte = guardaTaller(req);
  if (corte) return corte;
  const body = await cuerpo(req);
  if (!body) return NextResponse.json({ error: "cuerpo no válido (se espera JSON)" }, { status: 400 });
  const { tipo, item } = body;
  const d = await leer();
  if (tipo === "tea") {
    const precio = Number(item?.precio);
    if (!item?.nombre || !Array.isArray(item?.plantas) || item.plantas.length === 0 || !Number.isFinite(precio) || precio <= 0)
      return NextResponse.json({ error: "Faltan nombre o plantas, o el precio no es válido" }, { status: 400 });
    if (d.teas.length >= MAX_ITEMS) return NextResponse.json({ error: "demasiados tés publicados" }, { status: 409 });
    const t = {
      id: slug(item.nombre), nombre: txt(item.nombre, 120),
      sala: item.sala === "te-premium" ? "te-premium" : "te",
      precio, gramos: Number(item.gramos) || 60,
      paraQueSirve: txt(item.paraQueSirve), colorHoja: /^#[0-9a-fA-F]{3,8}$/.test(String(item.colorHoja)) ? item.colorHoja : "#C9B36A",
      ...(item.foto ? { foto: String(item.foto) } : {}),
      plantas: item.plantas.filter((p: { plantaId?: string }) => p?.plantaId),
    };
    d.teas = d.teas.filter((x: { id: string }) => x.id !== t.id).concat(t);
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

export async function DELETE(req: Request) {
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
