"use client";
// Carrito global (zustand + localStorage). La cesta de mimbre de cada habitación lee de aquí.
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartLine, Cupon } from "./types";
import { teaById } from "@/data/teas";
import { cajaById } from "@/data/boxes";
import { extraById, PRECIO_CUCHARA } from "@/data/extras";
import { precioCaja } from "./season";

interface CartState {
  lines: CartLine[];
  cupon: Cupon | null;
  add: (kind: CartLine["kind"], id: string) => void;
  remove: (kind: CartLine["kind"], id: string) => void;
  setQty: (kind: CartLine["kind"], id: string, qty: number) => void;
  clear: () => void;
  setCupon: (c: Cupon | null) => void;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      cupon: null,
      add: (kind, id) =>
        set((s) => {
          const i = s.lines.findIndex((l) => l.kind === kind && l.id === id);
          if (i >= 0) {
            const lines = [...s.lines];
            lines[i] = { ...lines[i], qty: lines[i].qty + 1 };
            return { lines };
          }
          return { lines: [...s.lines, { kind, id, qty: 1 }] };
        }),
      remove: (kind, id) =>
        set((s) => ({ lines: s.lines.filter((l) => !(l.kind === kind && l.id === id)) })),
      setQty: (kind, id, qty) =>
        set((s) => ({
          lines:
            qty <= 0
              ? s.lines.filter((l) => !(l.kind === kind && l.id === id))
              : s.lines.map((l) => (l.kind === kind && l.id === id ? { ...l, qty } : l)),
        })),
      clear: () => set({ lines: [], cupon: null }),
      setCupon: (cupon) => set({ cupon }),
    }),
    { name: "petra-cart-v1" }
  )
);

export function linePrice(l: CartLine): number {
  if (l.kind === "tea") return teaById(l.id).precio;
  if (l.kind === "caja") return precioCaja(cajaById(l.id));
  extraById(l.id); // valida que la cuchara exista
  return PRECIO_CUCHARA;
}
export function lineName(l: CartLine): string {
  if (l.kind === "tea") return teaById(l.id).nombre;
  if (l.kind === "caja") return cajaById(l.id).nombre;
  return extraById(l.id).nombre;
}
export function cartSubtotal(lines: CartLine[]): number {
  return Math.round(lines.reduce((a, l) => a + linePrice(l) * l.qty, 0) * 100) / 100;
}
export function cartDiscount(sub: number, cupon: Cupon | null): number {
  if (!cupon) return 0;
  const d = cupon.tipo === "porcentaje" ? (sub * cupon.valor) / 100 : Math.min(cupon.valor, sub);
  return Math.round(d * 100) / 100;
}
// Envío (decidido VISION §11.5): EUR, gratis desde 50 €; zona única en demo (Eslovenia/UE se elige en el pago real).
export const ENVIO_GRATIS_DESDE = 50;
export function cartShipping(sub: number): number {
  if (sub === 0) return 0;
  return sub >= ENVIO_GRATIS_DESDE ? 0 : 4.9;
}
export function cartCount(lines: CartLine[]): number {
  return lines.reduce((a, l) => a + l.qty, 0);
}
