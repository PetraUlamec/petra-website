"use client";
// Calidad adaptativa (plan F0b): 3 niveles. low = móvil flojo (sin composer), mid, high.
// Override para depurar: ?q=low|mid|high — PerformanceMonitor de drei degrada en vivo.
import { createContext, useContext } from "react";

export type Quality = "low" | "mid" | "high";

export function qualityOverride(): Quality | null {
  if (typeof window === "undefined") return null;
  const q = new URLSearchParams(window.location.search).get("q");
  return q === "low" || q === "mid" || q === "high" ? q : null;
}

function gpuRenderer(): string {
  try {
    const c = document.createElement("canvas");
    const gl = (c.getContext("webgl2") || c.getContext("webgl")) as WebGLRenderingContext | null;
    if (!gl) return "";
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    const r = ext ? (gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) as string) : "";
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return r || "";
  } catch { return ""; }
}

/** iGPUs y drivers software conocidos que no pueden con el pipeline completo */
const WEAK_GPU = /610M|Mendocino|Radeon\s*Vega\s*[38]|Intel|UHD|Iris|llvmpipe|SwiftShader|Mali|Adreno/i;

export function detectQuality(): Quality {
  if (typeof navigator === "undefined") return "mid";
  const o = qualityOverride();
  if (o) return o;
  const nav = navigator as Navigator & { deviceMemory?: number };
  const mem = nav.deviceMemory ?? 8;
  const cores = navigator.hardwareConcurrency ?? 4;
  const mobile = /Android|iPhone|iPad|Mobi/i.test(navigator.userAgent);
  const coarse = typeof matchMedia !== "undefined" && matchMedia("(pointer: coarse)").matches;
  if ((mobile || coarse) && (mem <= 4 || cores <= 4)) return "low";
  if (mobile || mem <= 4 || cores <= 6) return "mid";
  if (WEAK_GPU.test(gpuRenderer())) return "mid"; // la 610M de SER cae aquí
  return "high";
}

export const QualityContext = createContext<Quality>("mid");
export const useQuality = () => useContext(QualityContext);

export const DPR: Record<Quality, [number, number]> = {
  low: [1, 1], mid: [1, 1.25], high: [1, 1.5],
};

/** dpr efectivo con tope de framebuffer (~2560 px de ancho): una 4K no paga supersampling */
export function effectiveDpr(q: Quality): [number, number] {
  const [lo, hi] = DPR[q];
  if (typeof window === "undefined") return [lo, hi];
  // el tope SÍ puede bajar de 1: en un escritorio escalado (p.ej. 1080p→4K virtual) renderizar
  // a resolución de panel real es lo correcto — el CSS reescala gratis
  const cap = Math.max(0.5, 1920 / Math.max(window.innerWidth, window.innerHeight));
  return [Math.min(lo, cap), Math.min(hi, cap)];
}
export const SHADOW_MAP: Record<Quality, number> = { low: 1024, mid: 1024, high: 2048 };
export const DUST: Record<Quality, number> = { low: 40, mid: 90, high: 90 };
/* ── pase 2 (C-3D-B): presupuesto por nivel ── */
/** resolución del mapa de sombras de contacto (0 = sin sombras de contacto) */
export const CONTACT_RES: Record<Quality, number> = { low: 0, mid: 512, high: 1024 };
