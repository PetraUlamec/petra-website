import { NextResponse } from "next/server";
import { claveOk, nuevaSesion, renovarSesion, DURACION_SESION } from "@/lib/tallerAuth";
import { guardaLimite } from "@/lib/limitePeticiones";

export const runtime = "nodejs";
export async function GET(req: Request) {
  return NextResponse.json({ authenticated: claveOk(req) }, { headers: { "Cache-Control": "no-store" } });
}
export async function POST(req: Request) {
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Petición no válida" }, { status: 400 }); }
  if (body?.action !== "remember") {
    const limit = guardaLimite(req, "taller-login", 5, 15 * 60 * 1000);
    if (limit) return limit;
  }
  const token = body?.action === "remember" ? renovarSesion(req) : nuevaSesion(body?.password);
  if (!token) return NextResponse.json({ error: "Contraseña incorrecta o taller sin configurar." }, { status: 401 });
  const response = NextResponse.json({ authenticated: true });
  response.cookies.set("petra-taller", token, { httpOnly: true, secure: new URL(process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || req.url).protocol === "https:", sameSite: "strict", path: "/", maxAge: DURACION_SESION });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
export async function DELETE() {
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set("petra-taller", "", { httpOnly: true, sameSite: "strict", path: "/", maxAge: 0 });
  return response;
}
