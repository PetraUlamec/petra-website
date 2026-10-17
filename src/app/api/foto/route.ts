// FOTO → PRODUCTO: sube una foto, opcionalmente le quita el fondo con el rembg local, y la
// guarda para que la tienda pueda mostrarla. Solo con la clave del taller.
//
// 2-sep-2026 (auditoría). Cambios:
//  1. La clave ya no tiene valor por defecto ("petra"): puerta única del taller.
//  2. Límite de subidas por IP (rembg es un proceso pesado: sin tope, tumba el servidor).
//  3. Se comprueba que el fichero SEA una imagen de verdad (por su firma binaria), no solo
//     que lo diga la extensión: antes se alojaba cualquier byte con nombre .png.
//  4. Se guarda en data/fotos/ (NO en public/): en producción `next start` no sirve los
//     ficheros añadidos a public/ después del build — por eso las fotos daban 404 hasta
//     reiniciar. Ahora las sirve /api/imagen/<fichero>, que lee del disco en cada petición.
import { promises as fs } from "fs";
import path from "path";
import { spawn } from "child_process";
import { NextResponse } from "next/server";
import { guardaTaller } from "@/lib/tallerAuth";
import { guardaLimite } from "@/lib/limitePeticiones";

export const runtime = "nodejs";
const DIR_FOTOS = path.join(process.cwd(), "data", "fotos");
const MAX_BYTES = 12 * 1024 * 1024;

const slug = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "producto";

/** Firma binaria real del fichero (los primeros bytes no mienten como la extensión). */
function tipoReal(b: Buffer): "png" | "jpg" | "webp" | null {
  if (b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "png";
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpg";
  if (b.length > 12 && b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") return "webp";
  return null;
}

function rembg(inFile: string, outFile: string): Promise<boolean> {
  return new Promise((res) => {
    const p = spawn("rembg", ["i", inFile, outFile], { timeout: 120000 });
    p.on("close", (code) => res(code === 0));
    p.on("error", () => res(false));
  });
}

export async function POST(req: Request) {
  const corte = guardaTaller(req);
  if (corte) return corte;
  const tope = guardaLimite(req, "foto", 20, 10 * 60 * 1000); // 20 subidas cada 10 min
  if (tope) return tope;

  let form: FormData;
  try { form = await req.formData(); }
  catch { return NextResponse.json({ error: "cuerpo no válido (se espera un formulario)" }, { status: 400 }); }
  const file = form.get("file") as File | null;
  const nombre = String(form.get("nombre") ?? "producto");
  const recortar = form.get("recortar") === "1";
  if (!file) return NextResponse.json({ error: "sin fichero" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "máximo 12 MB" }, { status: 400 });

  const bytes = Buffer.from(await file.arrayBuffer());
  const tipo = tipoReal(bytes);
  if (!tipo) return NextResponse.json({ error: "el fichero no es una imagen (se aceptan PNG, JPG o WEBP)" }, { status: 400 });

  await fs.mkdir(DIR_FOTOS, { recursive: true });
  const base = `${slug(nombre)}-${Date.now().toString(36)}`;
  const original = path.join(DIR_FOTOS, `${base}-orig.${tipo}`);
  await fs.writeFile(original, bytes);

  let fichero = `${base}.${tipo}`;
  let recortada = false;
  if (recortar) {
    const destinoPng = path.join(DIR_FOTOS, `${base}.png`);
    recortada = await rembg(original, destinoPng);   // rembg siempre escribe PNG
    if (recortada) fichero = `${base}.png`;
  }
  if (!recortada) await fs.copyFile(original, path.join(DIR_FOTOS, fichero));
  await fs.rm(original, { force: true });

  return NextResponse.json({ foto: `/api/imagen/${fichero}`, recortada });
}
