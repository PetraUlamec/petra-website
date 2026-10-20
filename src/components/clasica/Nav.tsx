"use client";
// Cabecera de la casa: sello P&E, las secciones, la cesta con cuenta.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart, cartCount } from "@/lib/cart";
import { useT, useLang, LANGS } from "@/i18n";

export default function Nav() {
  const T = useT();
  const path = usePathname();
  const lines = useCart((s) => s.lines);
  const [mounted, setMounted] = useState(false);
  const { lang, setLang } = useLang();
  useEffect(() => setMounted(true), []);
  const n = mounted ? cartCount(lines) : 0;
  const S = [
    { href: "/clasica/tes", t: T.cl.navTes },
    { href: "/clasica/cajas", t: T.cl.navCajas },
    { href: "/clasica/despensa", t: T.cl.navDespensa },
    { href: "/clasica/cucharas", t: T.cl.navCucharas },
    { href: "/clasica/nosotros", t: T.nav.nosotros },
    { href: "/clasica/contacto", t: T.nav.contacto },
  ];
  return (
    <header className="sticky top-0 z-40 bg-[#fdf8ea]/92 backdrop-blur border-b border-[rgba(58,37,19,0.12)]">
      <div className="max-w-[1240px] mx-auto px-3 sm:px-6 h-14 flex items-center gap-1 sm:gap-5">
        <Link href="/clasica" aria-label={T.a11y.inicio} className="shrink-0 group min-h-10 flex items-center">
          {/* Logotipo tipográfico sin fondo ni subrayados. */}
          <span className="font-display leading-none inline-flex items-baseline whitespace-nowrap text-[#17120f]">
            <span className="italic text-[28px]">P</span>
            <span className="text-[19px] font-normal mx-[8px]">+</span>
            <span className="italic text-[28px]">E</span>
            <span className="text-[18px] font-normal ml-[1px]">-sp</span>
          </span>
        </Link>
        <nav className="hidden xl:flex gap-3.5 text-[13.5px] items-center" aria-label={T.cl.navA11y}>
          {S.map((s) => (
            <Link key={s.href} href={s.href}
              className={`whitespace-nowrap inline-flex items-center min-h-10 hover:opacity-100 transition-opacity ${path.startsWith(s.href) ? "opacity-100 underline underline-offset-8 decoration-[var(--miel)]" : "opacity-70"}`}>
              {s.t}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          {/* puente a la otra cara de la tienda: la misma cesta y el mismo idioma te acompañan */}
          <Link href="/" className="hidden sm:inline-flex items-center min-h-10 px-2 text-[12.5px] whitespace-nowrap opacity-75 hover:opacity-100 transition-opacity" title={T.cl.visita3d}>
            ✨ {T.nav.tienda3d}
          </Link>
          <div className="flex gap-0.5" role="group" aria-label={T.a11y.idioma}>
            {LANGS.map((l) => (
              <button key={l.id} onClick={() => setLang(l.id)} aria-pressed={lang === l.id}
                className={`text-[11px] font-bold min-w-10 min-h-10 px-2 rounded ${lang === l.id ? "bg-[var(--madera-oscura)] text-[var(--crema)]" : "opacity-70 hover:opacity-100"}`}>
                {l.id.toUpperCase()}
              </button>
            ))}
          </div>
          <Link href="/clasica/cesta" className="btn-tinta px-3 min-h-10 inline-flex items-center text-sm relative">
            {T.cl.cesta}
            {n > 0 && <span className="absolute -top-2 -right-2 bg-[var(--miel)] text-[var(--madera-oscura)] text-[10px] font-bold rounded-full w-5 h-5 grid place-items-center">{n}</span>}
          </Link>
        </div>
      </div>
      {/* nav móvil */}
      <nav className="xl:hidden flex gap-3 px-4 pb-1 text-[13px] overflow-x-auto" aria-label={T.cl.navA11y}>
        {S.map((s) => (
          <Link key={s.href} href={s.href} className={`whitespace-nowrap inline-flex items-center min-h-10 ${path.startsWith(s.href) ? "underline underline-offset-4 decoration-[var(--miel)]" : "opacity-70"}`}>{s.t}</Link>
        ))}
        <Link href="/" className="whitespace-nowrap inline-flex items-center min-h-10 opacity-70">✨ {T.nav.tienda3d}</Link>
      </nav>
    </header>
  );
}
