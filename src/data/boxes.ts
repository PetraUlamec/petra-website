// Cajas de temporada (VISION §5.2, confirmado por SER):
// GENERAL = base todo el año; cada estación = base + su extra; primavera y otoño SEPARADAS.
// Fuera de temporada: +15% (VISION §5.3), calculado en lib/season.ts.
import type { CajaTemporada } from "@/lib/types";

export const CAJAS: CajaTemporada[] = [
  {
    id: "caja-general", nombre: "Caja de la Casa", estacion: null, precioTemporada: 24,
    extras: ["queso-casa"], incluyeCucharaAlAzar: false, incluyeTeNormalAlAzar: true,
    descripcion: "Disponible todo el año: un té de la casa al azar y queso. Sin cuchara.",
  },
  {
    id: "caja-verano", nombre: "Caja de Verano", estacion: "verano", precioTemporada: 29,
    extras: ["limonada-frambuesa"], incluyeCucharaAlAzar: true, incluyeTeNormalAlAzar: true,
    descripcion: "Un té de la casa al azar, limonada y una cucharita de Erik al azar. Sin queso.",
  },
  {
    id: "caja-invierno", nombre: "Caja de Invierno", estacion: "invierno", precioTemporada: 32,
    extras: ["queso-casa", "chorizo-valle"], incluyeCucharaAlAzar: true, incluyeTeNormalAlAzar: true,
    descripcion: "Un té de la casa al azar, carne, queso y una cucharita de Erik al azar.",
  },
  {
    id: "caja-primavera", nombre: "Caja de Primavera", estacion: "primavera", precioTemporada: 28,
    extras: ["miel-flores"], incluyeCucharaAlAzar: true, incluyeTeNormalAlAzar: true,
    descripcion: "Un té de la casa al azar, miel de flores y una cucharita de Erik al azar. Sin queso.",
  },
  {
    id: "caja-otono", nombre: "Caja de Otoño", estacion: "otono", precioTemporada: 28,
    extras: ["miel-castano"], incluyeCucharaAlAzar: true, incluyeTeNormalAlAzar: true,
    descripcion: "Un té de la casa al azar, miel de castaño y una cucharita de Erik al azar. Sin queso.",
  },
];

export const cajaById = (id: string): CajaTemporada => {
  const c = CAJAS.find((x) => x.id === id);
  if (!c) throw new Error(`Caja desconocida: ${id}`);
  return c;
};
