"use client";
// Menú discreto siempre visible (VISION §2, confirmado): la red de seguridad junto a los objetos tocables.
import Link from "next/link";
import { conEditor } from "@/lib/editor";
import { usePathname } from "next/navigation";
import { useT, useLang, LANGS } from "@/i18n";
import { useCart, cartCount } from "@/lib/cart";
import { useEffect, useState } from "react";

export default function Menu() {
  const path = usePathname();
  const [edit, setEdit] = useState(false);   // ¿estamos editando? (se sabe al hidratar, no en el servidor)
  useEffect(() => setEdit(new URLSearchParams(location.search).has("editor")), []);
  const T = useT();
  const { lang, setLang } = useLang();
  const ITEMS: { href: string; label: string }[] = [
    { href: "/", label: T.nav.inicio },
    { href: "/salon", label: T.nav.salon },
    { href: "/te", label: T.nav.te },
    { href: "/te-premium", label: T.nav.tePremium },
    { href: "/nosotros", label: T.nav.nosotros },
    { href: "/contacto", label: T.nav.contacto },
    { href: "/clasica", label: `✨ ${T.nav.clasica}` },
  ];
  const pathname = usePathname();
  const lines = useCart((s) => s.lines);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const n = mounted ? cartCount(lines) : 0;
  // La clásica y el recibo llevan su propia cabecera. (El return va DESPUÉS de todos los hooks:
  // con navegación cliente clásica↔3D el componente sigue montado y React exige el mismo número de hooks.)
  if (path.startsWith("/clasica") || path.startsWith("/gracias")) return null;

  return (
    <nav
      aria-label={T.a11y.menuTienda}
      className="fixed top-0 inset-x-0 z-40 flex items-center gap-1.5 px-3 py-2 overflow-x-auto"
    >
      <Link href={edit ? "/?editor=1" : "/"} aria-label={T.marca} title={T.marca}
        className="px-1 shrink-0 transition-transform hover:scale-105">
        {/* Logotipo tipográfico sin fondo ni subrayados. */}
        <span className="font-display leading-none inline-flex items-baseline whitespace-nowrap text-[#17120f]">
          <span className="italic text-[28px]">P</span>
          <span className="text-[19px] font-normal mx-[8px]">+</span>
          <span className="italic text-[28px]">E</span>
          <span className="text-[18px] font-normal ml-[1px]">-espe</span>
        </span>
      </Link>
      <div className="flex gap-1.5 ml-auto items-center">
        {/* selector de idioma */}
        <div className="flex gap-0.5 mr-1" role="group" aria-label={T.a11y.idioma}>
          {LANGS.map((l) => (
            <button
              key={l.id}
              onClick={() => setLang(l.id)}
              className={`sign px-1.5 py-0.5 text-[10px] ${lang === l.id ? "sign-active" : "opacity-70"}`}
            >
              {l.label}
            </button>
          ))}
        </div>
        {ITEMS.map((it) => (
          <Link
            key={it.href}
            href={edit ? `${it.href}?editor=1` : it.href}
            className={`sign px-2.5 py-1 text-xs sm:text-sm whitespace-nowrap ${pathname === it.href ? "sign-active" : ""}`}
          >
            {it.label}
          </Link>
        ))}
        <Link
          href={edit ? "/carrito?editor=1" : "/carrito"}
          className={`sign relative px-2.5 py-1 text-xs sm:text-sm whitespace-nowrap ${pathname === "/carrito" ? "sign-active" : ""}`}
          aria-label={`${T.nav.carrito}${n ? `, ${T.a11y.articulos(n)}` : ""}`}
        >
          {T.nav.carrito}
          {n > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-[var(--miel)] text-[var(--madera-oscura)] text-[10px] font-bold rounded-full min-w-4 h-4 px-0.5 grid place-items-center border border-[var(--madera)]">
              {n}
            </span>
          )}
        </Link>
      </div>
    </nav>
  );
}
