"use client";
// Las páginas legales de una tienda de la UE, en el papel de la casa: aviso legal, privacidad (RGPD),
// cookies (solo localStorage) y devoluciones (14 días). Textos cortos ×3 idiomas en src/i18n; los datos
// que solo Petra conoce van marcados «[PENDIENTE: …]» — nada inventado.
import Link from "next/link";
import { useT } from "@/i18n";

type Clave = "legal" | "privacidad" | "cookies" | "devoluciones";

export default function PaginaLegal({ clave }: { clave: Clave }) {
  const T = useT();
  const titulo = T.cl[`${clave}Titulo` as const];
  const bloques = T.cl[clave] as readonly { t: string; p: readonly string[] }[];
  const otras: { href: string; t: string }[] = [
    { href: "/clasica/legal", t: T.cl.navLegal },
    { href: "/clasica/privacidad", t: T.cl.navPrivacidad },
    { href: "/clasica/cookies", t: T.cl.navCookies },
    { href: "/clasica/devoluciones", t: T.cl.navDevoluciones },
  ].filter((o) => o.href !== `/clasica/${clave}`);
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-12">
      <p className="eyebrow">{T.cl.heroEyebrow} · {T.cl.pieLegal}</p>
      <h1 className="font-display text-4xl sm:text-5xl mt-2">{titulo}</h1>
      <div className="mt-8 space-y-5">
        {bloques.map((b) => (
          <section key={b.t} className="lamina p-6 pt-7">
            <h2 className="font-display text-xl">{b.t}</h2>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed">
              {b.p.map((linea) => (
                <li key={linea} className={linea.includes("[PENDIENTE") ? "text-[var(--granate)]" : ""}>— {linea}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <nav className="mt-8 flex flex-wrap gap-x-5 gap-y-1 text-sm" aria-label={T.cl.pieLegal}>
        {otras.map((o) => (
          <Link key={o.href} href={o.href} className="inline-flex items-center min-h-10 underline underline-offset-4 opacity-80 hover:opacity-100">{o.t} →</Link>
        ))}
        <Link href="/clasica/contacto" className="inline-flex items-center min-h-10 underline underline-offset-4 opacity-80 hover:opacity-100">{T.nav.contacto} →</Link>
      </nav>
    </main>
  );
}
