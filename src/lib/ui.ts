"use client";
// Estado de interacción de las escenas: qué tarro está enfocado, animación de vuelo a la cesta, etc.
import { create } from "zustand";

export type FlyPayload = { from: [number, number, number]; color: string; key: number } | null;

interface UiState {
  /** id del té con la cámara encima (null = vista general de la habitación) */
  focusTeaId: string | null;
  /** planta seleccionada dentro del té enfocado */
  plantId: string | null;
  /** caja o extra seleccionados (paneles 2D) */
  cajaId: string | null;
  extraId: string | null;
  fly: FlyPayload;
  focusTea: (id: string | null) => void;
  setPlant: (id: string | null) => void;
  setCaja: (id: string | null) => void;
  setExtra: (id: string | null) => void;
  launchFly: (from: [number, number, number], color: string) => void;
  clearFly: () => void;
}

export const useUi = create<UiState>((set) => ({
  focusTeaId: null, plantId: null, cajaId: null, extraId: null, fly: null,
  focusTea: (id) => set({ focusTeaId: id, plantId: null }),
  setPlant: (id) => set({ plantId: id }),
  setCaja: (id) => set({ cajaId: id }),
  setExtra: (id) => set({ extraId: id }),
  launchFly: (from, color) => set({ fly: { from, color, key: Date.now() } }),
  clearFly: () => set({ fly: null }),
}));
