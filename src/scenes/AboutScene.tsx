"use client";
// NOSOTROS: el taller. El banco de Petra (tés) y el banco de Erik (madera y cucharas).
import { useState, useEffect } from "react";
import SceneShell, { type CamFocus } from "@/components/three/SceneShell";
import DecoVivo from "@/components/three/DecoVivo";
import Room, { THEMES } from "@/components/three/Room";
import { Table, Door } from "@/components/three/Furniture";
import SpoonRack from "@/components/three/SpoonRack";
import BorderCollieCorner from "@/components/three/deco/BorderCollieCorner";
import { WoodTools } from "@/components/three/Decor";
import {
  BenchVise, HandSaw, CarvedSpoons, FloorShavings, HerbJarShelf,
  Portrait, ThreeLegStool, LumberShelf, ToolJar, ShavingSack,
} from "@/components/three/deco/taller";
import ExtraPanel from "@/components/hud/ExtraPanel";
import GLB from "@/components/three/Modelos";
import Guia from "@/components/hud/Guia";
import Hotspot, { useHotspots } from "@/components/three/Hotspot";
import { useT } from "@/i18n";
import { useUi } from "@/lib/ui";

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

export default function AboutScene() {
  const T = useT();
  const baseZoom = useBaseZoom();
  const setExtra = useUi((s) => s.setExtra);
  const focus: CamFocus = { target: [0.7, 1.25, 0.65], zoom: baseZoom };
  const hs = useHotspots();
  return (
    <main>
      <SceneShell focus={focus} ariaLabel={T.a11y.escena} onMiss={() => setExtra(null)}>
        <Room theme={THEMES.taller} rug={false}>
          {/* banco de Erik: virutas, cucharas y herramientas */}
          <Table position={[2.4, 0, 1.8]} w={3} d={1.5} />
          <group scale={1.45} position={[2.3, 1.13, 1.7]}><WoodTools position={[0, 0, 0]} /></group>
          <BenchVise position={[3.3, 1.05, 2.3]} />
          <group scale={1.4} position={[1.6, 1.11, 2.1]}><CarvedSpoons position={[0, 0, 0]} rotY={0.3} /></group>
          {/* el lote de cucharas variadas (fábrica Blender) descansando en el banco */}
          <GLB url="/modelos/cucharas_variadas.glb" position={[3.1, 1.06, 1.5]} rotation={[0, 0.5, 0]} />
          <ToolJar position={[1.15, 1.05, 1.35]} rotY={0.4} />
          <FloorShavings position={[2.6, 0, 2.7]} spread={1.5} />
          <ShavingSack position={[0.62, 0, 2.62]} rotY={-0.5} />
          <ThreeLegStool position={[2.4, 0, 3.0]} rotY={0.6} />
          <HandSaw position={[3.6, 2.15, -4.85]} />
          {/* la reserva de maderas de Erik, alta y a la derecha (fuera de la ventana x=1.6) */}
          <LumberShelf position={[3.7, 2.95, -4.62]} w={1.4} />
          {/* El único retrato se centra sobre la repisa de cucharas. */}
          <Portrait who="erik" position={[-4.82, 2.6, 1.6]} rotY={Math.PI / 2} />
          <HerbJarShelf position={[-2.6, 2.1, -4.82]} />
          <SpoonRack position={[-4.85, 2.2, 1.6]} rotY={Math.PI / 2} />
          {/* rincón del border collie: al fondo, fuera del paso de la puerta */}
          <BorderCollieCorner position={[-1.7, 0, -3.65]} />
          <Door position={[-4.85, 1.3, -1.4]} rotY={Math.PI / 2} color="#8a6a3f" label={T.nav.salon} href="/salon" felpudo={false} />
          <DecoVivo sala="nosotros" />
          <Hotspot position={[-4.4, 0.03, 1.6]} visible={hs} />
        </Room>
      </SceneShell>
      <header className="fixed z-20 top-12 left-3 sm:left-4 max-w-md pointer-events-none">
        <h1 className="font-display text-2xl sm:text-3xl text-[var(--madera-oscura)] drop-shadow-[0_1px_0_var(--crema)]">
          {T.nosotros.titulo}
        </h1>
      </header>
      <div className="fixed z-20 bottom-3 inset-x-3 sm:inset-x-auto sm:left-4 sm:bottom-4 sm:w-96 panel p-4 float-in">
        <p className="text-sm"><span className="font-display font-bold">Petra.</span> {T.nosotros.petra}</p>
        <p className="text-sm mt-2"><span className="font-display font-bold">Erik.</span> {T.nosotros.erik}</p>
        <p className="mt-2 text-[10px] opacity-50">{T.provisional}</p>
      </div>
      <Guia sala="nosotros" />
      <ExtraPanel />
      <section className="sr-only-block">
        <h2>{T.nosotros.titulo}</h2>
        <p>{T.nosotros.petra}</p>
        <p>{T.nosotros.erik}</p>
      </section>
    </main>
  );
}
