// ⚠️ CONTENIDO PROVISIONAL inventado por Claude — SER lo sustituirá por las plantas reales.
// Cada planta lleva su FORMA botánica: el generador 3D la hace reconocible (VISION: «tienen que salir
// realmente las plantas»).
import type { Plant } from "@/lib/types";
import { getVivo } from "@/lib/vivoStore";
import { HERBARIO_AMPLIADO } from "./herbario-ampliado";

export const PLANTS: Plant[] = [
  { id: "manzanilla",  nombre: "Manzanilla",        latin: "Matricaria chamomilla",  color: "#ffffff", color2: "#f2c94c", forma: "margarita" },
  { id: "melisa",      nombre: "Melisa",            latin: "Melissa officinalis",    color: "#9dbb61", color2: "#7a9a4a", forma: "hoja" },
  { id: "tila",        nombre: "Tila",              latin: "Tilia cordata",          color: "#e5e0b0", color2: "#a9bd7a", forma: "tallo" },
  { id: "lavanda",     nombre: "Lavanda",           latin: "Lavandula angustifolia", color: "#8d79c9", color2: "#8fa382", forma: "espiga" },
  { id: "menta",       nombre: "Menta piperita",    latin: "Mentha × piperita",      color: "#4f9e64", color2: "#3d7d4e", forma: "hoja" },
  { id: "hinojo",      nombre: "Hinojo",            latin: "Foeniculum vulgare",     color: "#e8d35f", color2: "#9db76a", forma: "umbela" },
  { id: "anis",        nombre: "Anís verde",        latin: "Pimpinella anisum",      color: "#f0ead0", color2: "#b8c48a", forma: "umbela" },
  { id: "jengibre",    nombre: "Jengibre",          latin: "Zingiber officinale",    color: "#d9a44c", color2: "#c08a35", forma: "rizoma" },
  { id: "escaramujo",  nombre: "Escaramujo",        latin: "Rosa canina",            color: "#c7402e", color2: "#6f8f5a", forma: "baya" },
  { id: "saúco",       nombre: "Flor de saúco",     latin: "Sambucus nigra",         color: "#f6efd8", color2: "#87a066", forma: "umbela" },
  { id: "tomillo",     nombre: "Tomillo",           latin: "Thymus vulgaris",        color: "#b9a0c9", color2: "#7e8f68", forma: "aguja" },
  { id: "salvia",      nombre: "Salvia",            latin: "Salvia officinalis",     color: "#a7b7a0", color2: "#8ba184", forma: "hoja" },
  { id: "ortiga",      nombre: "Ortiga",            latin: "Urtica dioica",          color: "#57804f", color2: "#436a3d", forma: "hoja" },
  { id: "colacaballo", nombre: "Cola de caballo",   latin: "Equisetum arvense",      color: "#6f8f5a", color2: "#5a7a48", forma: "tallo" },
  { id: "romero",      nombre: "Romero",            latin: "Rosmarinus officinalis", color: "#7c9484", color2: "#5f7a68", forma: "aguja" },
  { id: "hierbaluisa", nombre: "Hierbaluisa",       latin: "Aloysia citrodora",      color: "#b5ce7c", color2: "#8fb35a", forma: "hoja" },
  { id: "calendula",   nombre: "Caléndula",         latin: "Calendula officinalis",  color: "#f0942e", color2: "#d97a1f", forma: "margarita" },
  { id: "rooibos",     nombre: "Rooibos",           latin: "Aspalathus linearis",    color: "#b4552d", color2: "#94421f", forma: "aguja" },
  { id: "canela",      nombre: "Canela de Ceilán",  latin: "Cinnamomum verum",       color: "#a96a3b", color2: "#8a5028", forma: "corteza" },
  { id: "cardamomo",   nombre: "Cardamomo",         latin: "Elettaria cardamomum",   color: "#9fb56e", color2: "#7e9a52", forma: "vaina" },
  { id: "rosa",        nombre: "Pétalos de rosa",   latin: "Rosa damascena",         color: "#d98a9e", color2: "#b56a7e", forma: "petalos" },
  { id: "azahar",      nombre: "Azahar",            latin: "Citrus aurantium",       color: "#f8f2dd", color2: "#7fa060", forma: "flor5" },
  { id: "regaliz",     nombre: "Regaliz",           latin: "Glycyrrhiza glabra",     color: "#8c7350", color2: "#6f5a3d", forma: "raiz" },
  { id: "frambuesa",   nombre: "Hoja de frambueso", latin: "Rubus idaeus",           color: "#7e9e62", color2: "#63834c", forma: "hoja" },
  { id: "hibisco",     nombre: "Hibisco",           latin: "Hibiscus sabdariffa",    color: "#b3243c", color2: "#7e9e62", forma: "caliz" },
  { id: "jazmin",      nombre: "Jazmín",            latin: "Jasminum officinale",    color: "#f8f4e6", color2: "#7fa060", forma: "flor5" },
  { id: "verbena",     nombre: "Verbena",           latin: "Verbena officinalis",    color: "#c1a8d9", color2: "#8fa382", forma: "espiga" },
  { id: "amapola",     nombre: "Amapola",           latin: "Papaver rhoeas",         color: "#d0342c", color2: "#6f8f5a", forma: "flor5" },
  { id: "aciano",      nombre: "Aciano",            latin: "Centaurea cyanus",       color: "#4a6fd9", color2: "#8ba184", forma: "margarita" },
  { id: "naranjaseca", nombre: "Naranja seca",      latin: "Citrus sinensis",        color: "#e08a2e", color2: "#c9701f", forma: "citrico" },
  { id: "manzanaseca", nombre: "Manzana seca",      latin: "Malus domestica",        color: "#c9a26a", color2: "#a8875a", forma: "fruta-seca" },
  { id: "curcuma",     nombre: "Cúrcuma",           latin: "Curcuma longa",          color: "#e0921f", color2: "#c9791a", forma: "rizoma" },
  { id: "jengibrenegro", nombre: "Jengibre negro",  latin: "Kaempferia parviflora",  color: "#5a4a6f", color2: "#463a56", forma: "rizoma" },
  { id: "hiperico",    nombre: "Hipérico",          latin: "Hypericum perforatum",   color: "#f2c832", color2: "#8a9b6e", forma: "margarita" },
  { id: "milenrama",   nombre: "Milenrama",         latin: "Achillea millefolium",   color: "#f2ede0", color2: "#87a066", forma: "umbela" },
  { id: "malva",       nombre: "Malva",             latin: "Malva sylvestris",       color: "#b87fc9", color2: "#7e8f68", forma: "flor5" },
  { id: "brezo",       nombre: "Brezo",             latin: "Calluna vulgaris",       color: "#d987b3", color2: "#6f7a5a", forma: "espiga" },
  { id: "abeto",       nombre: "Brotes de abeto",   latin: "Abies alba",             color: "#3f6a4a", color2: "#2e5238", forma: "aguja" },
  { id: "laurel",      nombre: "Laurel",            latin: "Laurus nobilis",         color: "#4a6a3f", color2: "#3a5632", forma: "hoja" },
  { id: "eucalipto",   nombre: "Eucalipto",         latin: "Eucalyptus globulus",    color: "#8fa89a", color2: "#748a7e", forma: "hoja" },
  ...HERBARIO_AMPLIADO,
];

export const plantById = (id: string): Plant => {
  const p = getVivo().plants?.find((x) => x.id === id) ?? PLANTS.find((x) => x.id === id);
  if (!p) throw new Error(`Planta desconocida: ${id}`);
  return p;
};
