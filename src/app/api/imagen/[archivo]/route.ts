// SIRVE LAS FOTOS SUBIDAS DESDE EL TALLER (2-sep-2026).
// Existe porque en producción `next start` solo sirve los ficheros de public/ que había EN EL
// BUILD: una foto subida después daba 404 hasta reiniciar el servidor. Esta ruta las lee del
// disco en cada petición, así aparecen al instante.
// Es pública a propósito (son las fotos del catálogo), pero solo puede devolver ficheros de
// data/fotos/ o public/fotos/, y solo con un nombre simple: nada de subir por el árbol.
import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
const DIRS = [path.join(process.cwd(), "data", "fotos"), path.join(process.cwd(), "public", "fotos")];
const TIPOS: Record<string, string> = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp" };
/** Solo letras, números y guiones + extensión conocida: mata ".." y las rutas absolutas. */
const NOMBRE_OK = /^[a-z0-9][a-z0-9-]{0,120}\.(png|jpe?g|webp)$/i;

export async function GET(_req: Request, { params }: { params: Promise<{ archivo: string }> }) {
  const { archivo } = await params;
  if (!NOMBRE_OK.test(archivo)) return NextResponse.json({ error: "nombre no válido" }, { status: 400 });
  const ext = archivo.split(".").pop()!.toLowerCase();
  for (const dir of DIRS) {
    const completa = path.join(dir, archivo);
    if (path.dirname(path.resolve(completa)) !== path.resolve(dir)) continue; // cinturón y tirantes
    try {
      const datos = await fs.readFile(completa);
      return new NextResponse(new Uint8Array(datos), {
        headers: {
          "Content-Type": TIPOS[ext] ?? "application/octet-stream",
          "Cache-Control": "public, max-age=300",
          "X-Content-Type-Options": "nosniff",
        },
      });
    } catch { /* probamos la siguiente carpeta */ }
  }
  return NextResponse.json({ error: "no encontrada" }, { status: 404 });
}
