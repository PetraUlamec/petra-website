// Cajas de temporada (VISION §5.2, confirmado por SER):
// GENERAL = base todo el año; cada estación = base + su extra; primavera y otoño SEPARADAS.
// Fuera de temporada: +15% (VISION §5.3), calculado en lib/season.ts.
import type { CajaTemporada } from "@/lib/types";

export const CAJAS: CajaTemporada[] = [
  {
    id: "caja-general", nombre: "Caja de la Casa", estacion: null, precioTemporada: 24,
    extras: ["queso-casa"], incluyeCucharaAlAzar: true, incluyeTeNormalAlAzar: true,
    descripcion: "La caja de siempre, disponible todo el año: un té de la sala, una cucharita de Erik al azar y el queso hecho en casa.",
  },
  {
    id: "caja-verano", nombre: "Caja de Verano", estacion: "verano", precioTemporada: 29,
    extras: ["queso-casa", "limonada-frambuesa"], incluyeCucharaAlAzar: true, incluyeTeNormalAlAzar: true,
    descripcion: "La caja de la casa más la limonada con frambuesas: limones del huerto junto al mar y frambuesas del borde del bosque.",
  },
  {
    id: "caja-invierno", nombre: "Caja de Invierno", estacion: "invierno", precioTemporada: 32,
    extras: ["queso-casa", "chorizo-valle"], incluyeCucharaAlAzar: true, incluyeTeNormalAlAzar: true,
    descripcion: "La caja de la casa más algo de la matanza del valle: chorizo ahumado con haya o lomo curado al aire de la montaña.",
  },
  {
    id: "caja-primavera", nombre: "Caja de Primavera", estacion: "primavera", precioTemporada: 28,
    extras: ["queso-casa", "miel-flores"], incluyeCucharaAlAzar: true, incluyeTeNormalAlAzar: true,
    descripcion: "La caja de la casa más la miel de flores del prado alto, recién cosechada.",
  },
  {
    id: "caja-otono", nombre: "Caja de Otoño", estacion: "otono", precioTemporada: 28,
    extras: ["queso-casa", "miel-castano"], incluyeCucharaAlAzar: true, incluyeTeNormalAlAzar: true,
    descripcion: "La caja de la casa más la miel de castaño de octubre: oscura, seria, inolvidable.",
  },
];

export const cajaById = (id: string): CajaTemporada => {
  const c = CAJAS.find((x) => x.id === id);
  if (!c) throw new Error(`Caja desconocida: ${id}`);
  return c;
};
