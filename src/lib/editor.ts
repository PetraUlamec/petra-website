// ¿Está SER editando la tienda? (?editor=1). 24-ago: hacía clic en una puerta mientras colocaba
// piezas y la puerta lo llevaba a otra sala. En modo editor NADA navega ni abre paneles.
export const enEditor = (): boolean =>
  typeof window !== "undefined" && new URLSearchParams(window.location.search).has("editor");

/** Añade ?editor=1 a un enlace si estamos editando: cambiar de sala sin salir del editor. */
export const conEditor = (href: string): string =>
  enEditor() ? (href.includes("?") ? `${href}&editor=1` : `${href}?editor=1`) : href;
