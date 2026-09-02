// ¿Está SER editando la tienda? (?editor=1). 24-ago: hacía clic en una puerta mientras colocaba
// piezas y la puerta lo llevaba a otra sala. En modo editor NADA navega ni abre paneles.
export const enEditor = (): boolean =>
  typeof window !== "undefined" && new URLSearchParams(window.location.search).has("editor");

/** Añade ?editor=1 a un enlace si estamos editando: cambiar de sala sin salir del editor. */
export const conEditor = (href: string): string =>
  enEditor() ? (href.includes("?") ? `${href}&editor=1` : `${href}?editor=1`) : href;

// ── LA CLAVE DEL TALLER, DESDE EL NAVEGADOR (2-sep-2026, auditoría) ────────────────────────
// Las rutas que guardan (overrides, deco, editor-log) ya no están abiertas: piden la clave del
// taller, la misma que se escribe en /taller-privado. El editor la manda en cada guardado.
export const CLAVE_TALLER_LS = "petra-taller-clave";

export function claveTaller(): string {
  if (typeof window === "undefined") return "";
  try { return localStorage.getItem(CLAVE_TALLER_LS) ?? ""; } catch { return ""; }
}

/** Si no hay clave guardada, la pide una vez y la recuerda (para no romper el flujo del editor). */
export function pedirClaveTaller(): string {
  const actual = claveTaller();
  if (actual) return actual;
  if (typeof window === "undefined") return "";
  const dada = window.prompt("Clave del taller (la misma de /taller-privado) para guardar los cambios:") ?? "";
  if (dada) { try { localStorage.setItem(CLAVE_TALLER_LS, dada); } catch { /* sin almacenamiento */ } }
  return dada;
}

/** Cabeceras para hablar con las rutas privadas del taller. */
export function cabecerasTaller(json = true): Record<string, string> {
  return { ...(json ? { "Content-Type": "application/json" } : {}), "x-taller-key": pedirClaveTaller() };
}
