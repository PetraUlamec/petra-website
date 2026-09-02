// LA PUERTA ÚNICA DEL TALLER (2-sep-2026, auditoría de seguridad).
// TODA ruta que escriba en el catálogo, mueva piezas, suba fotos o mande correo pasa por aquí.
//
// Antes cada ruta hacía `process.env.TALLER_KEY ?? "petra"`: si el servidor arrancaba sin
// definir la clave, la llave maestra de la tienda era la palabra "petra" — escrita además en
// el propio código y en .env.example. Ahora: SIN clave configurada NO se abre nada (503).
import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "crypto";

export const CABECERA_CLAVE = "x-taller-key";
/** Una clave de 5 letras no protege nada; se exige un mínimo razonable. */
export const LARGO_MINIMO = 8;

export function hayClaveConfigurada(): boolean {
  const k = process.env.TALLER_KEY;
  return typeof k === "string" && k.length >= LARGO_MINIMO;
}

/**
 * Compara en TIEMPO CONSTANTE: tarda lo mismo acierte o falle, así no se puede
 * adivinar la clave letra a letra midiendo el reloj. Se comparan los hashes
 * (siempre 32 bytes) para que timingSafeEqual no reviente con largos distintos.
 */
function igualSeguro(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a, "utf8").digest();
  const hb = createHash("sha256").update(b, "utf8").digest();
  return timingSafeEqual(ha, hb);
}

export function claveOk(req: Request): boolean {
  const esperada = process.env.TALLER_KEY;
  if (!esperada || esperada.length < LARGO_MINIMO) return false;
  const dada = req.headers.get(CABECERA_CLAVE);
  if (!dada) return false;
  return igualSeguro(dada, esperada);
}

/**
 * Guardián de las rutas privadas: devuelve la respuesta de corte, o null si puede pasar.
 *   const corte = guardaTaller(req); if (corte) return corte;
 */
export function guardaTaller(req: Request): NextResponse | null {
  if (!hayClaveConfigurada())
    return NextResponse.json(
      { error: `El taller no está configurado: falta TALLER_KEY (mínimo ${LARGO_MINIMO} caracteres) en el servidor.` },
      { status: 503 },
    );
  if (!claveOk(req)) return NextResponse.json({ error: "clave del taller incorrecta" }, { status: 401 });
  return null;
}
