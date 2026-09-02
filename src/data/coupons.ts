// Cupones DEMO locales. En producción se sustituyen por cupones nativos de Stripe (VISION §5.4)
// para que el descuento lo valide el servidor de pago, no el navegador.
import type { Cupon } from "@/lib/types";

export const CUPONES: Cupon[] = [
  { codigo: "PETRA10",     tipo: "porcentaje", valor: 10, descripcion: "10% de descuento de bienvenida" },
  { codigo: "ERIK5",       tipo: "importe",    valor: 5,  descripcion: "5 € de descuento" },
  { codigo: "TEPREMIUM15", tipo: "porcentaje", valor: 15, descripcion: "15% en tu primera compra premium" },
];

export const cuponByCodigo = (codigo: string): Cupon | undefined =>
  CUPONES.find((c) => c.codigo.toUpperCase() === codigo.trim().toUpperCase());
