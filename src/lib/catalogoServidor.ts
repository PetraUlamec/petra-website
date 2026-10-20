// EL CATÁLOGO VIVO, VISTO DESDE EL SERVIDOR (2-sep-2026).
// `vivoStore` es "use client": vive en el navegador y se llena con un fetch. Por eso el
// servidor NO conocía los tés que Petra publica desde el taller y el pago los rechazaba con
// «producto desconocido» (medido en la auditoría). Esto lee el mismo fichero desde el
// servidor, que es quien tiene que decidir el precio.
import path from "path";
import { leerJSON } from "./jsonSeguro";
import type { Tea, Extra, Plant } from "./types";
import { TEAS } from "@/data/teas";

const FICHERO = path.join(process.cwd(), "data", "catalogo-vivo.json");

export interface CatalogoVivo { teas: Tea[]; extras: Extra[]; plants?: Plant[] }

export async function catalogoVivo(): Promise<CatalogoVivo> {
  const d = await leerJSON<Partial<CatalogoVivo>>(FICHERO, {}, true);
  return { teas: Array.isArray(d.teas) ? d.teas : [], extras: Array.isArray(d.extras) ? d.extras : [], plants: Array.isArray(d.plants) ? d.plants : [] };
}

export async function tesPublicados(): Promise<Tea[]> {
  const live = await catalogoVivo();
  return [...new Map([...TEAS, ...live.teas].map((tea) => [tea.id, tea])).values()];
}
