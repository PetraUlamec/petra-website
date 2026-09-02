"use client";
// Multi-idioma (encargo de SER: «que se adapte a cualquier idioma»).
// La interfaz cambia al vuelo (ES/EN/SL) y se recuerda en localStorage.
// El catálogo (tés/plantas/historias) se traduce con los helpers de ./catalogo (fallback ES).
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { T as T_ES } from "./es";
import { cargarVivo } from "@/lib/vivoStore";
import { T_EN } from "./en";
import { T_SL } from "./sl";

export type Lang = "es" | "en" | "sl";
export const LANGS: { id: Lang; label: string }[] = [
  { id: "es", label: "ES" }, { id: "en", label: "EN" }, { id: "sl", label: "SL" },
];

type Dict = typeof T_ES;
const DICTS: Record<Lang, Dict> = {
  es: T_ES,
  en: T_EN as unknown as Dict,
  sl: T_SL as unknown as Dict,
};

const LangCtx = createContext<{ lang: Lang; t: Dict; setLang: (l: Lang) => void }>({
  lang: "es", t: T_ES, setLang: () => {},
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("es");
  useEffect(() => {
    cargarVivo();
    const saved = localStorage.getItem("petra-lang") as Lang | null;
    if (saved && DICTS[saved]) setLangState(saved);
    else {
      const nav = navigator.language.slice(0, 2);
      if (nav === "en") setLangState("en");
      else if (nav === "sl") setLangState("sl");
    }
  }, []);
  // html[lang] sigue al idioma elegido (lectores de pantalla, traductores, SEO): el servidor sirve "es" y aquí se corrige
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  const setLang = (l: Lang) => { setLangState(l); localStorage.setItem("petra-lang", l); };
  return <LangCtx.Provider value={{ lang, t: DICTS[lang], setLang }}>{children}</LangCtx.Provider>;
}

/** El diccionario activo. Sustituto directo del viejo `import { T }`. */
export const useT = () => useContext(LangCtx).t;
export const useLang = () => useContext(LangCtx);
