"use client";
import { useT } from "@/i18n";
import { jsonLdSeguro } from "@/lib/jsonLd";

export default function FaqClasica() {
  const T = useT();
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-12">
      <p className="eyebrow">{T.cl.heroEyebrow}</p>
      <h1 className="font-display text-4xl sm:text-5xl mt-2">{T.cl.faqTitulo}</h1>
      <div className="mt-8 space-y-4">
        {T.cl.faq.map((f) => (
          <details key={f.q} className="lamina p-5 pt-6 group">
            <summary className="font-display text-xl cursor-pointer list-none flex justify-between items-baseline gap-3">
              {f.q} <span aria-hidden className="opacity-70 group-open:rotate-45 transition-transform shrink-0">+</span>
            </summary>
            <p className="mt-3 leading-relaxed opacity-85">{f.a}</p>
          </details>
        ))}
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdSeguro({
        "@context": "https://schema.org", "@type": "FAQPage",
        mainEntity: T.cl.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      }) }} />
    </main>
  );
}
