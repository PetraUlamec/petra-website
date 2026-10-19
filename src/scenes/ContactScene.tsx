"use client";
// CONTACTO: el escritorio de la tienda. Se deja una carta.
import { useState, useEffect } from "react";
import SceneShell, { type CamFocus } from "@/components/three/SceneShell";
import DecoVivo from "@/components/three/DecoVivo";
import Room, { THEMES } from "@/components/three/Room";
import { Table, PlantPot, Door } from "@/components/three/Furniture";
import { DeskLamp, BookRow, WallClock } from "@/components/three/Decor";
import Guia from "@/components/hud/Guia";
import {
  Inkwell, SealedEnvelope, EnvelopeStack, LetterOrganizer, WallMailbox,
  DeskChair, WasteBasket, QuillShelf,
  FilingCabinet, Globe, TeaCup, UmbrellaStand,
} from "@/components/three/deco/taller";
import { Shelf } from "@/components/three/Furniture";
import { useT } from "@/i18n";
import Link from "next/link";

function useBaseZoom() {
  const [z, setZ] = useState(44);
  useEffect(() => {
    const f = () => setZ(Math.min(window.innerWidth / 22, window.innerHeight / 13));
    f();
    window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, []);
  return z;
}

export default function ContactScene() {
  const T = useT();
  const baseZoom = useBaseZoom();
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);
  const send = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSending(true); setFailed(false);
    try {
      const response = await fetch("/api/contacto", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nombre: form.get("nombre"), email: form.get("email"), mensaje: form.get("mensaje"), consiente: form.get("consiente") === "on" }) });
      if (!response.ok || !(await response.json()).ok) throw new Error("send failed");
      setSent(true);
    } catch { setFailed(true); }
    finally { setSending(false); }
  };
  const focus: CamFocus = { target: [0, 1.2, 0], zoom: baseZoom };
  return (
    <main>
      <SceneShell focus={focus} ariaLabel={T.a11y.escena}>
        <Room theme={THEMES.correo} windowX={-2.3}>
          {/* Escritorio, objetos, silla y papelera se trasladan como una sola composición. */}
          <group position={[0.4, 0.025, 0.6]}>
            <Table position={[0, 0, 0]} w={2.6} d={1.4} h={1.05} />
            {/* carta y pluma sobre el escritorio */}
            <mesh position={[0, 1.13, 0.1]} rotation={[-Math.PI / 2, 0, 0.2]} receiveShadow>
              <planeGeometry args={[0.6, 0.42]} />
              <meshStandardMaterial color="#fff6e2" roughness={1} />
            </mesh>
            <mesh position={[0.5, 1.15, 0.3]} rotation={[0, 0.5, 1.2]} castShadow>
              <coneGeometry args={[0.02, 0.4, 6]} />
              <meshStandardMaterial color="#4a2f1a" />
            </mesh>
            <DeskLamp position={[-0.8, 1.1, -0.4]} />
            <Inkwell position={[-0.6, 1.11, 0.25]} />
            <SealedEnvelope position={[0.8, 1.11, -0.2]} rotY={-0.3} />
            <EnvelopeStack position={[-0.95, 1.11, -0.3]} rotY={0.3} />
            <LetterOrganizer position={[0.2, 1.1, -0.55]} />
            {/* el té de media tarde, junto a la carta */}
            <TeaCup position={[-0.52, 1.11, 0.58]} rotY={0.6} scale={1.2} />
            <DeskChair position={[0.1, 0, 1.1]} rotY={Math.PI} />
          <WasteBasket position={[-1.2, 0, 0.95]} />
          </group>
          <QuillShelf position={[-0.7, 2.25, -4.82]} />
          <WallMailbox position={[-4.85, 2.0, -0.35]} rotY={Math.PI / 2} />
          {/* Paragüero pequeño con dos paraguas; el perchero permanece eliminado. */}
          <UmbrellaStand position={[-4.5, 0, -0.12]} rotY={0.3} />
          <Shelf position={[2.2, 0, -4.35]} width={3.4} levels={2} />
          {/* Buró y globo, ahora entre la maceta y la estantería. */}
          <FilingCabinet position={[-1.0, 0, -4.35]} rotY={-0.06} />
          <Globe position={[-1.0, 0.9, -4.3]} rotY={0.5} />
          {/* Biblioteca completa: dos hileras de volúmenes antiguos en tonos sobrios. */}
          <BookRow position={[2.2, 1.1, -4.3]} n={29} antique />
          <BookRow position={[2.2, 2.15, -4.3]} n={29} antique />
          {/* Misma carátula legible del salón, fija a las 5:10 p. m. */}
          <WallClock position={[-4.85, 3, 1.8]} rotY={Math.PI / 2} hour={5} minute={10} />
          {/* Maceta centrada bajo la ventana. */}
          <PlantPot position={[-2.3, 0.15, -4.2]} />
          <Door position={[-4.85, 1.3, -1.4]} rotY={Math.PI / 2} color="#8a6a3f" label={T.nav.salon} href="/salon" />
          <DecoVivo sala="contacto" />
        </Room>
      </SceneShell>
      <Guia sala="contacto" />
      <header className="fixed z-20 top-12 left-3 sm:left-4 pointer-events-none">
        <h1 className="font-display text-2xl sm:text-3xl text-[var(--madera-oscura)] drop-shadow-[0_1px_0_var(--crema)]">
          {T.contacto.titulo}
        </h1>
      </header>
      <form
        className="fixed z-20 bottom-3 inset-x-3 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:w-96 panel p-4 float-in space-y-2"
        onSubmit={send}
      >
        {sent ? (
          <p className="text-sm">{T.contacto.enviado}</p>
        ) : (
          <>
            {failed && <p role="alert" className="text-sm text-[var(--granate)]">{T.contacto.error}</p>}
            <input name="nombre" aria-label={T.contacto.nombre} required placeholder={T.contacto.nombre} className="w-full px-3 py-2 rounded-md border border-[var(--madera)]/40 bg-[var(--crema)] text-sm" />
            <input name="email" aria-label={T.contacto.email} required type="email" placeholder={T.contacto.email} className="w-full px-3 py-2 rounded-md border border-[var(--madera)]/40 bg-[var(--crema)] text-sm" />
            <textarea name="mensaje" aria-label={T.contacto.mensaje} required placeholder={T.contacto.mensaje} rows={3} className="w-full px-3 py-2 rounded-md border border-[var(--madera)]/40 bg-[var(--crema)] text-sm" />
            <label className="flex items-start gap-2 text-xs"><input name="consiente" type="checkbox" required /><span>{T.cl.consentimiento} <Link href="/clasica/privacidad" className="underline">{T.cl.navPrivacidad}</Link></span></label>
            <button disabled={sending} type="submit" className="btn-miel px-4 py-2 text-sm w-full">{sending ? "…" : T.contacto.enviar}</button>
          </>
        )}
      </form>
      <section className="sr-only-block"><h2>{T.contacto.titulo}</h2></section>
    </main>
  );
}
