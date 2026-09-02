// FOTO → PRODUCTO (U4, VISION §4): sube una foto, opcionalmente le quita el fondo con el
// rembg LOCAL ya instalado (pipx), y la guarda en public/fotos/. Solo con la clave del taller.
import { promises as fs } from "fs";
import path from "path";
import { spawn } from "child_process";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
const DIR = path.join(process.cwd(), "public", "fotos");
const slug = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function rembg(inFile: string, outFile: string): Promise<boolean> {
  return new Promise((res) => {
    const p = spawn("rembg", ["i", inFile, outFile], { timeout: 120000 });
    p.on("close", (code) => res(code === 0));
    p.on("error", () => res(false));
  });
}

export async function POST(req: Request) {
  if ((req.headers.get("x-taller-key") ?? "") !== (process.env.TALLER_KEY ?? "petra"))
    return NextResponse.json({ error: "clave del taller incorrecta" }, { status: 401 });
  let form: FormData;
  try { form = await req.formData(); }
  catch { return NextResponse.json({ error: "cuerpo no válido (se espera un formulario)" }, { status: 400 }); }
  const file = form.get("file") as File | null;
  const nombre = String(form.get("nombre") ?? "producto");
  const recortar = form.get("recortar") === "1";
  if (!file) return NextResponse.json({ error: "sin fichero" }, { status: 400 });
  if (file.size > 12 * 1024 * 1024) return NextResponse.json({ error: "máximo 12 MB" }, { status: 400 });
  await fs.mkdir(DIR, { recursive: true });
  const base = `${slug(nombre)}-${Date.now().toString(36)}`;
  const tmp = path.join(DIR, `${base}-orig.png`);
  const fin = path.join(DIR, `${base}.png`);
  await fs.writeFile(tmp, Buffer.from(await file.arrayBuffer()));
  let ok = false;
  if (recortar) ok = await rembg(tmp, fin);
  if (!ok) await fs.copyFile(tmp, fin);
  await fs.rm(tmp, { force: true });
  return NextResponse.json({ foto: `/fotos/${base}.png`, recortada: ok });
}
