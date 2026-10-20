// Tipos del catálogo de Petra Website.
// REGLA CLAVE (VISION §3): el "porqué" de una planta vive en la relación té↔planta, nunca en la planta.

export type RoomId =
  | "intro" | "salon" | "te" | "te-premium" | "nosotros" | "contacto" | "carrito";

export type FormaPlanta = keyof typeof import("@/data/formasPlanta").FORMAS_PLANTA;


export interface Plant {
  nombres?: { en: string; sl: string };
  grupo?: string;
  id: string;
  nombre: string;
  latin: string;
  /** color principal (flor/fruto) */
  color: string;
  /** color secundario (hoja/tallo) */
  color2: string;
  forma: FormaPlanta;
}

export interface TeaPlant {
  plantaId: string;
  /** POR QUÉ ayuda ESTA planta EN ESTE mix — texto propio de cada té (VISION §3.3) */
  porQueEnEsteMix: string;
}

export interface Tea {
  traducciones?: Partial<Record<"en" | "sl", {
    nombre?: string;
    paraQueSirve?: string;
    plantas?: Record<string, string>;
  }>>;
  editado?: boolean;
  id: string;
  nombre: string;
  sala: "te" | "te-premium";
  precio: number; // EUR
  gramos: number;
  /** para qué sirve el mix (VISION §3.2) */
  paraQueSirve: string;
  plantas: TeaPlant[];
  /** color del contenido del tarro */
  colorHoja: string;
  /** posición en la estantería la decide la escena, no el dato */
  /** foto del tarro subida desde el taller (difuminada en la lámina, nítida al abrir) */
  foto?: string;
}

export type ExtraTipo = "cuchara" | "queso" | "carne" | "limonada" | "miel";

export interface Extra {
  id: string;
  tipo: ExtraTipo;
  nombre: string;
  hechoPor: "Petra" | "Erik";
  /** REGLA DE PROCEDENCIA (VISION §3b): cada cosa cuenta SU historia concreta */
  procedencia: string;
  /** existencias en la despensa (contable; sin valor = no se muestra) */
  quedan?: number;
  /** estación en la que se produce (sin valor = todo el año) */
  estacion?: "verano" | "invierno" | "primavera" | "otono" | null;
}

export type Estacion = "primavera" | "verano" | "otono" | "invierno";

export interface CajaTemporada {
  id: string;
  nombre: string;
  /** null = caja GENERAL, disponible todo el año sin recargo */
  estacion: Estacion | null;
  precioTemporada: number; // EUR, precio dentro de su estación
  /** ids de extras fijos; la cuchara es "al azar" y se indica aparte */
  extras: string[];
  incluyeCucharaAlAzar: boolean;
  incluyeTeNormalAlAzar: boolean;
  descripcion: string;
}

export interface Cupon {
  codigo: string;
  tipo: "porcentaje" | "importe";
  valor: number;
  descripcion: string;
}

export type CartLineKind = "tea" | "caja" | "cuchara";
export interface CartLine {
  kind: CartLineKind;
  id: string; // tea id, caja id o cuchara id
  qty: number;
}
