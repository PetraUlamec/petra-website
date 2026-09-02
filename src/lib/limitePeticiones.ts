// LÍMITE DE PETICIONES POR IP (2-sep-2026, auditoría de seguridad).
// Sin esto, los formularios y el correo se pueden usar para spam masivo: quema la cuota de
// Resend y mete el dominio de la casa en listas negras. Memoria del proceso (suficiente para
// una tienda pequeña con un solo servidor; si algún día hay varios, esto se mueve a Redis).
const golpes = new Map<string, number[]>();
const MAX_CLAVES = 5000; // tope de memoria: ante una avalancha de IPs, se poda

/** IP real del visitante. Detrás de Cloudflare/nginx llega en estas cabeceras. */
export function ipDe(req: Request): string {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0].trim();
  return req.headers.get("cf-connecting-ip") ?? req.headers.get("x-real-ip") ?? "desconocida";
}

/**
 * ¿Hay que BLOQUEAR esta petición? true = pasarse del límite.
 * @param cubo  nombre del cubo (una ruta = un cubo), p. ej. "correo"
 * @param max   peticiones permitidas dentro de la ventana
 * @param ventanaMs  tamaño de la ventana en milisegundos
 */
export function pasaDelLimite(req: Request, cubo: string, max: number, ventanaMs: number): boolean {
  const ahora = Date.now();
  const clave = `${cubo}:${ipDe(req)}`;
  const recientes = (golpes.get(clave) ?? []).filter((t) => ahora - t < ventanaMs);
  if (recientes.length >= max) {
    golpes.set(clave, recientes); // no se premia al insistente: su marca no se renueva
    return true;
  }
  recientes.push(ahora);
  golpes.set(clave, recientes);
  if (golpes.size > MAX_CLAVES) {
    for (const [k, v] of golpes) {
      if (v.every((t) => ahora - t >= ventanaMs)) golpes.delete(k);
      if (golpes.size <= MAX_CLAVES) break;
    }
  }
  return false;
}

import { NextResponse } from "next/server";
/** Respuesta estándar de "demasiadas peticiones" (o null si puede pasar). */
export function guardaLimite(req: Request, cubo: string, max: number, ventanaMs: number): NextResponse | null {
  if (!pasaDelLimite(req, cubo, max, ventanaMs)) return null;
  return NextResponse.json(
    { error: "Demasiadas peticiones seguidas. Espera un momento y vuelve a intentarlo." },
    { status: 429, headers: { "Retry-After": String(Math.ceil(ventanaMs / 1000)) } },
  );
}
