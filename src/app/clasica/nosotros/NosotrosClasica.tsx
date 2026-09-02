"use client";
// La casa: dos personas, dos oficios, un valle. Texto provisional hasta las palabras reales de Petra.
import Link from "next/link";
import { useT } from "@/i18n";

export default function NosotrosClasica() {
  const T = useT();
  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-12">
      <p className="eyebrow">{T.cl.heroEyebrow}</p>
      <h1 className="font-display text-4xl sm:text-5xl mt-2">{T.cl.historiaTitulo}</h1>
      <div className="grid sm:grid-cols-2 gap-6 mt-9">
        <section className="lamina p-7 pt-8">
          <span className="eyebrow">— Petra</span>
          <h2 className="font-display text-2xl mt-1">{T.cl.mezclasT}</h2>
          <p className="mt-3 leading-relaxed opacity-85">{T.nosotros.petra}</p>
        </section>
        <section className="lamina p-7 pt-8">
          <span className="eyebrow">— Erik</span>
          <h2 className="font-display text-2xl mt-1">{T.cl.maderaT}</h2>
          <p className="mt-3 leading-relaxed opacity-85">{T.nosotros.erik}</p>
        </section>
      </div>
      <section className="mt-10">
        <h2 className="font-display text-2xl">{T.cl.metodoTitulo}</h2>
        <div className="grid sm:grid-cols-3 gap-5 mt-4">
          {T.cl.metodo.map((m) => (
            <div key={m.t} className="lamina p-5 pt-6">
              <span className="eyebrow">{m.t}</span>
              <p className="text-sm mt-2 leading-relaxed opacity-85">{m.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10 max-w-2xl">
        <p className="leading-relaxed opacity-85">{T.cl.historia}</p>
        <p className="text-xs opacity-70 mt-6">{T.provisional}</p>
        <div className="mt-6 flex gap-3">
          <Link href="/clasica/tes" className="btn-tinta px-5 py-2.5">{T.cl.verTes}</Link>
          <Link href="/clasica/contacto" className="px-5 py-2.5 border border-[rgba(58,37,19,0.35)] rounded-[3px] hover:bg-[rgba(58,37,19,0.05)]">{T.nav.contacto}</Link>
        </div>
      </section>
    </main>
  );
}
