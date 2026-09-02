// 🩺 EL DOCTOR del taller: revisa lo publicado y avisa de problemas, con gravedad.
// 2-sep-2026 (auditoría): era público y enseñaba el mapa interno de las salas y el catálogo
// procesado. Es una herramienta del taller, así que ahora pide la clave del taller.
import path from "path";
import { NextResponse } from "next/server";
import { guardaTaller } from "@/lib/tallerAuth";
import { leerJSON } from "@/lib/jsonSeguro";

export const runtime = "nodejs";
const FICHERO = path.join(process.cwd(), "data", "catalogo-vivo.json");

// huella aproximada de cada pieza en el suelo (radio en metros) para detectar choques
const RADIO: Record<string, number> = {
  cruz: 0.2, vela: 0.08, frutero: 0.22, mesa: 1.4, silla: 0.35, butaca: 0.55,
  taburete: 0.25, farol: 0.25, lampara: 0.35, maceta: 0.25, tinaja: 0.35,
  queso: 0.25, saco: 0.3, miel: 0.12, candelabro: 0.15,
};
// zonas ya ocupadas por el mobiliario de fábrica (aprox, por sala)
const OCUPADO: Record<string, { x: number; z: number; r: number; que: string }[]> = {
  te: [{ x: 0, z: -4.1, r: 3.2, que: "la botica" }, { x: -1.6, z: 1.6, r: 1.6, que: "la mesa de la tetera" }, { x: 3.4, z: 3.2, r: 0.6, que: "la cesta" }],
  "te-premium": [{ x: 0, z: -1.9, r: 3.1, que: "los pedestales" }, { x: -4.4, z: 1.8, r: 1.1, que: "la chimenea" }, { x: -1.7, z: 3.0, r: 1.1, que: "la mesita" }, { x: 3.4, z: 3.2, r: 0.6, que: "la cesta" }],
  salon: [{ x: 0.5, z: 0.5, r: 2.4, que: "la mesa de las cajas" }, { x: -3.4, z: -3.4, r: 1.8, que: "el mostrador" }, { x: -4.5, z: 1.8, r: 1.2, que: "la chimenea" }, { x: 3.4, z: 3.2, r: 0.6, que: "la cesta" }],
  carrito: [{ x: 0, z: -3.9, r: 2.8, que: "la estantería" }, { x: 0.5, z: 1, r: 0.6, que: "la cesta" }, { x: 3.6, z: -3.1, r: 0.9, que: "los barriles" }],
  nosotros: [{ x: -2.2, z: -2.6, r: 1.9, que: "el banco de Petra" }, { x: 2.4, z: 1.8, r: 1.7, que: "el banco de Erik" }],
  contacto: [{ x: -1.4, z: -1.6, r: 1.6, que: "el escritorio" }, { x: 2.2, z: -4.2, r: 1.9, que: "la librería" }],
  intro: [{ x: 0, z: -1, r: 5, que: "la fachada (la calle admite poco)" }],
};

export async function GET(req: Request) {
  const corte = guardaTaller(req);
  if (corte) return corte;
  const d = await leerJSON<{ teas?: unknown[]; extras?: unknown[]; deco?: unknown[] }>(FICHERO, {});
  const avisos: { nivel: "rojo" | "ambar" | "ok"; texto: string }[] = [];
  const teas = (d.teas ?? []) as { id: string; nombre: string; precio: number; paraQueSirve?: string; plantas: { plantaId: string; porQueEnEsteMix?: string }[] }[];
  const extras = (d.extras ?? []) as { id: string; nombre: string; tipo: string; procedencia?: string }[];
  const deco = (d.deco ?? []) as { id: string; sala: string; pieza: string; x: number; z: number; escala: number }[];

  for (const t of teas) {
    // un té de prueba (la batería crea verif-c1-te y debe borrarlo): nunca debe estar publicado
    if (/verif-|prueba|test/i.test(t.id) || /prueba|test/i.test(t.nombre))
      avisos.push({ nivel: "rojo", texto: `«${t.nombre}» parece un té de PRUEBA (id ${t.id}) — bórralo del catálogo vivo.` });
    if (!t.paraQueSirve?.trim()) avisos.push({ nivel: "ambar", texto: `El té «${t.nombre}» no cuenta para qué sirve.` });
    if (t.precio <= 0) avisos.push({ nivel: "rojo", texto: `El té «${t.nombre}» tiene precio ${t.precio} €.` });
    if (!t.plantas?.length) avisos.push({ nivel: "rojo", texto: `El té «${t.nombre}» no lleva ninguna planta.` });
    for (const p of t.plantas ?? [])
      if (!p.porQueEnEsteMix?.trim())
        avisos.push({ nivel: "ambar", texto: `En «${t.nombre}», la planta ${p.plantaId} no explica por qué está en este mix (la regla de la casa).` });
  }
  for (const e of extras)
    if (!e.procedencia?.trim()) avisos.push({ nivel: "ambar", texto: `«${e.nombre}» no cuenta su historia/procedencia.` });

  const DE_PARED = ["cruz", "candelabro"];
  for (const p of deco) {
    const r = RADIO[p.pieza] ?? 0.3;
    if (!DE_PARED.includes(p.pieza) && (Math.abs(p.x) > 4.4 || Math.abs(p.z) > 4.4))
      avisos.push({ nivel: "rojo", texto: `La pieza ${p.pieza} de ${p.sala} está pegada o fuera de la pared (${p.x.toFixed(1)}, ${p.z.toFixed(1)}).` });
    for (const o of DE_PARED.includes(p.pieza) ? [] : OCUPADO[p.sala] ?? [])
      if (Math.hypot(p.x - o.x, p.z - o.z) < r * p.escala + o.r * 0.55)
        avisos.push({ nivel: "ambar", texto: `La pieza ${p.pieza} de ${p.sala} choca con ${o.que} — muévela un poco.` });
    for (const q of deco)
      if (q !== p && q.sala === p.sala && Math.hypot(p.x - q.x, p.z - q.z) < (r + (RADIO[q.pieza] ?? 0.3)) * 0.8)
        avisos.push({ nivel: "ambar", texto: `En ${p.sala}, ${p.pieza} y ${q.pieza} están una encima de otra.` });
  }
  if (!avisos.length) avisos.push({ nivel: "ok", texto: "Todo en orden: catálogo y decoración sanos. 🍃" });
  return NextResponse.json({ avisos, mapa: { ocupado: OCUPADO, radios: RADIO, deco } });
}
