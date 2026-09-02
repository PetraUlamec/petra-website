// Estaciones y regla del +15% fuera de temporada (VISION §5.3, decidido §11.5: automático por fecha).
import type { CajaTemporada, Estacion } from "./types";

export const RECARGO_FUERA_TEMPORADA = 0.15;

/** Estación por fecha (hemisferio norte, cortes meteorológicos simples por mes). */
export function estacionActual(fecha: Date = new Date()): Estacion {
  const m = fecha.getMonth() + 1; // 1..12
  if (m >= 3 && m <= 5) return "primavera";
  if (m >= 6 && m <= 8) return "verano";
  if (m >= 9 && m <= 11) return "otono";
  return "invierno";
}

export function cajaEnTemporada(caja: CajaTemporada, fecha?: Date): boolean {
  return caja.estacion === null || caja.estacion === estacionActual(fecha);
}

/** Precio vigente de una caja: temporada, o +15% guardada fuera de estación. */
export function precioCaja(caja: CajaTemporada, fecha?: Date): number {
  const p = cajaEnTemporada(caja, fecha)
    ? caja.precioTemporada
    : caja.precioTemporada * (1 + RECARGO_FUERA_TEMPORADA);
  return Math.round(p * 100) / 100;
}

export const NOMBRE_ESTACION: Record<Estacion, string> = {
  primavera: "primavera", verano: "verano", otono: "otoño", invierno: "invierno",
};
