"use client";
import Link from "next/link";
import { useT } from "@/i18n";

export default function Footer() {
  const T = useT();
  return (
    <footer className="mt-20 border-t border-[rgba(58,37,19,0.14)]">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-10 grid gap-8 sm:grid-cols-4 text-sm">
        <div>
          <p className="font-display text-lg">Petra <span className="text-[var(--miel)]">&</span> Erik</p>
          <p className="opacity-70 mt-2 max-w-[26ch]">{T.cl.pieLema}</p>
        </div>
        <div>
          <p className="eyebrow mb-1">{T.cl.pieTienda}</p>
          <Link className="block py-2.5 -my-0.5 opacity-75 hover:opacity-100" href="/clasica/tes">{T.cl.navTes}</Link>
          <Link className="block py-2.5 -my-0.5 opacity-75 hover:opacity-100" href="/clasica/cajas">{T.cl.navCajas}</Link>
          <Link className="block py-2.5 -my-0.5 opacity-75 hover:opacity-100" href="/clasica/despensa">{T.cl.navDespensa}</Link>
          <Link className="block py-2.5 -my-0.5 opacity-75 hover:opacity-100" href="/clasica/cucharas">{T.cl.navCucharas}</Link>
        </div>
        <div>
          <p className="eyebrow mb-1">{T.cl.pieCasa}</p>
          <Link className="block py-2.5 -my-0.5 opacity-75 hover:opacity-100" href="/clasica/nosotros">{T.nav.nosotros}</Link>
          <Link className="block py-2.5 -my-0.5 opacity-75 hover:opacity-100" href="/clasica/contacto">{T.nav.contacto}</Link>
          <Link className="block py-2.5 -my-0.5 opacity-75 hover:opacity-100" href="/clasica/faq">{T.cl.faqTitulo}</Link>
          <Link className="block py-2.5 -my-0.5 opacity-75 hover:opacity-100" href="/clasica/envios">{T.cl.enviosTitulo}</Link>
          <Link className="block py-2.5 -my-0.5 opacity-75 hover:opacity-100" href="/">✨ {T.cl.visita3d}</Link>
        </div>
        <div>
          <p className="eyebrow mb-1">{T.cl.pieLegal}</p>
          <Link className="block py-2.5 -my-0.5 opacity-75 hover:opacity-100" href="/clasica/legal">{T.cl.navLegal}</Link>
          <Link className="block py-2.5 -my-0.5 opacity-75 hover:opacity-100" href="/clasica/privacidad">{T.cl.navPrivacidad}</Link>
          <Link className="block py-2.5 -my-0.5 opacity-75 hover:opacity-100" href="/clasica/cookies">{T.cl.navCookies}</Link>
          <Link className="block py-2.5 -my-0.5 opacity-75 hover:opacity-100" href="/clasica/devoluciones">{T.cl.navDevoluciones}</Link>
          <p className="opacity-70 pt-3">Ajdovščina · Slovenija</p>
        </div>
      </div>
      <p className="text-center text-[11px] opacity-70 pb-2">{T.cl.pagoSenal}</p>
      <p className="text-center text-xs opacity-70 pb-6">© {new Date().getFullYear()} Petra + Erik — {T.cl.pieDerechos}</p>
    </footer>
  );
}
