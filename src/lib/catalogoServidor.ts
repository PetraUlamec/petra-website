// EL CATÁLOGO VIVO, VISTO DESDE EL SERVIDOR (2-sep-2026).
// `vivoStore` es "use client": vive en el navegador y se llena con un fetch. Por eso el
// servidor NO conocía los tés que Petra publica desde el taller y el pago los rechazaba con
// «producto desconocido» (medido en la auditoría). Esto lee el mismo fichero desde el
// servidor, que es quien tiene que decidir el precio.
import path from "path";
import { leerJSON } from "./jsonSeguro";
import type { Tea, Extra } from "./types";

const FICHERO = path.join(process.cwd(), "data", "catalogo-vivo.json");

export interface CatalogoVivo { teas: Tea[]; extras: Extra[] }

export async function catalogoVivo(): Promise<CatalogoVivo> {
  const d = await leerJSON<Partial<CatalogoVivo>>(FICHERO, {});
  return { teas: Array.isArray(d.teas) ? d.teas : [], extras: Array.isArray(d.extras) ? d.extras : [] };
}
