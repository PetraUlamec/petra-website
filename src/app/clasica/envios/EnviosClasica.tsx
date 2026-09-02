"use client";
import Link from "next/link";
import { useT } from "@/i18n";

export default function EnviosClasica() {
  const T = useT();
  const B = T.cl.enviosBloques;
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-12">
      <p className="eyebrow">{T.cl.heroEyebrow}</p>
      <h1 className="font-display text-4xl sm:text-5xl mt-2">{T.cl.enviosTitulo}</h1>
      <div className="grid sm:grid-cols-2 gap-5 mt-8">
        <section className="lamina p-6 pt-7">
          <span className="eyebrow">{T.cl.envio}</span>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed">
            {B.envios.map((l) => <li key={l}>— {l}</li>)}
          </ul>
        </section>
        <section className="lamina p-6 pt-7">
          <span className="eyebrow">↩</span>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed">
            {B.devoluciones.map((l) => <li key={l}>— {l}</li>)}
          </ul>
          <Link href="/clasica/contacto" className="inline-block mt-3 text-sm underline underline-offset-4">{T.nav.contacto} →</Link>
        </section>
      </div>
      <p className="lamina p-5 pt-6 mt-5 text-sm opacity-85">{B.pago}</p>
    </main>
  );
}
