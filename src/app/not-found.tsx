"use client";
// 404 de la casa: una balda vacía, en papel y lámina, con las dos puertas (clásica y 3D) — ×3 idiomas.
import Link from "next/link";
import { useT } from "@/i18n";
import "./clasica/clasica.css";

export default function NotFound() {
  const T = useT();
  return (
    <div className="papel min-h-screen">
      <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-24 pb-20">
        <p className="eyebrow">{T.cl.heroEyebrow} · 404</p>
        <h1 className="font-display text-4xl sm:text-5xl mt-2">{T.cl.e404Titulo}</h1>
        <section className="lamina p-7 pt-9 mt-8">
          {/* balda vacía: un tarro dibujado a línea, sin nada dentro */}
          <svg viewBox="0 0 120 120" width="96" height="96" className="mx-auto lamina-dibuja" aria-hidden>
            <path d="M38 30h44v6a6 6 0 0 1-6 6h-32a6 6 0 0 1-6-6z" fill="none" stroke="#5b3a21" strokeWidth="2" />
            <path d="M34 42h52l4 62a6 6 0 0 1-6 6H36a6 6 0 0 1-6-6z" fill="none" stroke="#5b3a21" strokeWidth="2" strokeLinejoin="round" />
            <path d="M44 56q16 -8 32 0" fill="none" stroke="#c98a3b" strokeWidth="1.5" strokeDasharray="3 4" />
            <path d="M20 112h80" stroke="#8a5f38" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <p className="text-center mt-5 leading-relaxed opacity-85">{T.cl.e404Cuerpo}</p>
          <div className="mt-7 flex flex-wrap gap-3 justify-center">
            <Link href="/clasica" className="btn-tinta px-5 py-3">{T.gracias.irClasica}</Link>
            <Link href="/" className="px-5 py-3 border border-[rgba(58,37,19,0.35)] rounded-[3px] hover:bg-[rgba(58,37,19,0.05)] transition-colors">✨ {T.gracias.ir3d}</Link>
          </div>
        </section>
      </main>
    </div>
  );
}
