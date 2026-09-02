"use client";
// Burbuja de guía de primera visita (una vez por sala, se recuerda).
import { useEffect, useState } from "react";
import { useT } from "@/i18n";

export default function Guia({ sala }: { sala: string }) {
  const T = useT();
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!localStorage.getItem(`petra-guia-${sala}`)) setShow(true);
  }, [sala]);
  if (!show) return null;
  const textos = (T as unknown as { guia?: Record<string, string> }).guia ?? {};
  const texto = textos[sala];
  if (!texto) return null;
  const cerrar = () => { localStorage.setItem(`petra-guia-${sala}`, "1"); setShow(false); };
  return (
    <div className="fixed z-30 bottom-4 left-1/2 -translate-x-1/2 panel px-4 py-2.5 flex items-center gap-3 float-in max-w-[90vw]">
      <span className="text-sm">{texto}</span>
      <button onClick={cerrar} className="sign px-2 py-0.5 text-xs shrink-0" aria-label={T.a11y.cerrar}>✕</button>
    </div>
  );
}
