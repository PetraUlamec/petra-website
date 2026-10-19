"use client";
// El salón (HOME): mostrador, chimenea, la mesa de las cajas de temporada y las puertas a las salas.
import { useState, useEffect, useMemo } from "react";
import SceneShell, { type CamFocus } from "@/components/three/SceneShell";
import Room, { THEMES } from "@/components/three/Room";
import { Table, Teapot, PlantPot, Door } from "@/components/three/Furniture";
import { Armchair, Scale } from "@/components/three/Decor";
import {
  FramedPicture, MantelSet, LogBasket, CupShelf, GrandfatherClock, Clogs,
  LowBookcase, SideTable, DoorDrapes, SewingBasket, HangingPlant, MagazineRack, PhotoFrame,
} from "@/components/three/deco/salon";
import { SunPatch, WallSpill, EmberGlow } from "@/components/three/LightShaft";
import { Hoguera } from "@/components/three/Fuego";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useRef } from "react";
import SeasonBoxes from "@/components/three/SeasonBoxes";
import GLB from "@/components/three/Modelos";
import DecoVivo from "@/components/three/DecoVivo";
import Basket, { BASKET_POS } from "@/components/three/Basket";
import FlyingItem from "@/components/three/FlyingItem";
import CajaPanel from "@/components/hud/CajaPanel";
import Guia from "@/components/hud/Guia";
import ExtraPanel from "@/components/hud/ExtraPanel";
import { WOOD } from "@/components/three/Room";
import { useT } from "@/i18n";
import { CAJAS } from "@/data/boxes";
import { estacionActual, NOMBRE_ESTACION, precioCaja } from "@/lib/season";
import { useUi } from "@/lib/ui";

function Fireplace({ position, rotY = 0 }: { position: [number, number, number]; rotY?: number }) {
  // 24-ago (SER): «tiene que ser como una chimenea EMPOTRADA que veas las llamas dentro; así se
  // soluciona lo de la madera fuera». Antes era un bloque pegado a la pared con el fuego por delante.
  // Ahora: hueco METIDO en el muro (marco + jambas + dintel), leña y llamas DENTRO, repisa encima.
  const fire = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    // la luz del hogar late con el fuego (informe §3.2: vende el fuego en toda la sala sin postproceso)
    const t0 = clock.elapsedTime;
    const f = 1 + Math.sin(t0 * 5.5) * 0.16 + Math.sin(t0 * 13.7) * 0.09 + Math.sin(t0 * 2.1) * 0.06;
    if (fire.current) fire.current.intensity = 2.1 * f;
  });
  const PIEDRA = "#a89684", PIEDRA_OSCURA = "#8d7c6c";
  // hollín del fondo: negro con manchas y el humo subiendo por la campana (textura generada, nada que descargar)
  const hollin = useMemo(() => {
    if (typeof document === "undefined") return null;
    const N = 128, c = document.createElement("canvas"); c.width = c.height = N;
    const g = c.getContext("2d")!;
    g.fillStyle = "#0c0806"; g.fillRect(0, 0, N, N);
    for (let i = 0; i < 90; i++) {
      const x = Math.random() * N, y = Math.random() * N, r = 4 + Math.random() * 16;
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      const cl = Math.random() < 0.55 ? "26,18,14" : "10,7,5";
      gr.addColorStop(0, `rgba(${cl},0.5)`); gr.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    }
    const sube = g.createLinearGradient(0, N, 0, 0);
    sube.addColorStop(0, "rgba(52,32,20,0.35)"); sube.addColorStop(1, "rgba(0,0,0,0.55)");
    g.fillStyle = sube; g.fillRect(0, 0, N, N);
    const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; return tx;
  }, []);
  return (
    <group name="chimenea" position={position} rotation={[0, rotY, 0]}>
      {/* el hueco: paredes de ladrillo ennegrecido metidas en el muro (frente en z = 0) */}
      <mesh position={[0, 0, -0.2]}>
        <boxGeometry args={[1.34, 1.5, 0.04]} />
        <meshBasicMaterial map={hollin} color="#ffffff" />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.66, 0, -0.09]} receiveShadow>
          <boxGeometry args={[0.04, 1.5, 0.26]} />
          <meshBasicMaterial color="#150f0b" />
        </mesh>
      ))}
      <mesh position={[0, 0.72, -0.09]} receiveShadow>
        <boxGeometry args={[1.34, 0.04, 0.26]} />
        <meshBasicMaterial color="#0d0907" />
      </mesh>
      {/* solera */}
      <mesh position={[0, -0.56, -0.08]} receiveShadow>
        <boxGeometry args={[1.2, 0.05, 0.3]} />
        <meshBasicMaterial color="#241a13" />
      </mesh>
      {/* MARCO de piedra alrededor del hueco (jambas + dintel): lo empotrado se lee por el marco */}
      {[-1, 1].map((s) => (
        <mesh key={`j${s}`} position={[s * 0.78, 0, 0.05]} castShadow receiveShadow>
          <boxGeometry args={[0.36, 1.5, 0.2]} />
          <meshStandardMaterial color={PIEDRA} roughness={0.95} />
        </mesh>
      ))}
      <mesh position={[0, 0.72, 0.05]} castShadow receiveShadow>
        <boxGeometry args={[1.92, 0.28, 0.2]} />
        <meshStandardMaterial color={PIEDRA} roughness={0.95} />
      </mesh>
      <mesh position={[0, -0.68, 0.06]} castShadow receiveShadow>
        <boxGeometry args={[1.92, 0.2, 0.24]} />
        <meshStandardMaterial color={PIEDRA_OSCURA} roughness={0.95} />
      </mesh>
      {/* repisa */}
      <mesh position={[0, 0.94, 0.1]} castShadow>
        <boxGeometry args={[2.16, 0.14, 0.34]} />
        <meshStandardMaterial color={WOOD.viga} roughness={0.85} />
      </mesh>
      {/* LA LEÑA, dentro del hueco y apoyada en la solera */}
      {[-0.16, 0.02, 0.2].map((x, i) => (
        <mesh key={x} position={[x, -0.47, -0.06 + (i % 2) * 0.06]} rotation={[0, (i - 1) * 0.5, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.055, 0.05, 0.5, 7]} />
          <meshBasicMaterial color={i === 1 ? "#4a3020" : "#5c3a23"} />
        </mesh>
      ))}
      <mesh position={[0.02, -0.36, -0.04]} rotation={[0.35, 0.4, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.045, 0.04, 0.42, 7]} />
        <meshBasicMaterial color="#6b452a" />
      </mesh>
      {/* EL FUEGO: llama procedural por shader (ruido que sube en capas) + chispas */}
      <Hoguera position={[0, -0.53, -0.04]} escala={0.92} chispas={false}
        mostrarBrasas={false} corteSuperior={0.58} />
      {/* PUERTA DE CRISTAL (24-ago, SER): el fuego se ve DETRÁS del vidrio, moviéndose */}
      <mesh position={[0, 0, 0.015]} raycast={() => null}>
        <planeGeometry args={[1.1, 1.06]} />
        {/* Cristal ahumado sin reflejo especular. Conserva la transparencia, pero no puede
            convertir la luz puntual del fuego en el punto naranja fijo que aparecía detrás. */}
        <meshBasicMaterial color="#100b08" transparent opacity={0.12}
          depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      {/* marco de hierro del cristal y su tirador */}
      {[-1, 1].map((s) => (
        <mesh key={`mv${s}`} position={[s * 0.56, 0, 0.02]} castShadow>
          <boxGeometry args={[0.05, 1.12, 0.05]} />
          <meshStandardMaterial color="#2b231d" metalness={0.55} roughness={0.45} />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={`mh${s}`} position={[0, s * 0.55, 0.02]} castShadow>
          <boxGeometry args={[1.16, 0.045, 0.045]} />
          <meshStandardMaterial color="#2b231d" metalness={0.55} roughness={0.45} />
        </mesh>
      ))}
      <group position={[0.52, 0, 0.05]}>
        <mesh position={[0, 0, 0.03]}>
          <cylinderGeometry args={[0.012, 0.012, 0.22, 8]} />
          <meshStandardMaterial color="#9a8b6a" metalness={0.7} roughness={0.35} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[0, s * 0.1, 0.015]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.008, 0.008, 0.035, 6]} />
            <meshStandardMaterial color="#9a8b6a" metalness={0.7} roughness={0.4} />
          </mesh>
        ))}
      </group>
      <pointLight ref={fire} position={[0, -0.25, 0.1]} distance={3.6} color="#ff8a3a" intensity={1.9} />
      {/* resplandor en el suelo, delante del hueco (el grupo va a y = 0.85) */}
      <EmberGlow position={[0, -0.77, 0.62]} color="#ff9d4f" intensity={0.38} size={[1.5, 1.25]} />
    </group>
  );
}

function Counter({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow position={[0, 0.55, 0]}>
        <boxGeometry args={[3, 1.1, 0.8]} />
        <meshStandardMaterial color={WOOD.viga} roughness={0.75} />
      </mesh>
      <mesh position={[0, 1.13, 0]} castShadow>
        <boxGeometry args={[3.2, 0.08, 0.95]} />
        <meshStandardMaterial color={WOOD.suelo} roughness={0.55} />
      </mesh>
    </group>
  );
}

/** Cruz de madera colocada sobre la chimenea. */
function WallCross({ position, rotY = 0 }: { position: [number, number, number]; rotY?: number }) {
  const material = <meshStandardMaterial color="#5b321c" roughness={0.78} />;
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <mesh castShadow position={[0, 0, 0]}>
        <boxGeometry args={[0.13, 0.72, 0.07]} />
        {material}
      </mesh>
      <mesh castShadow position={[0, 0.11, 0.006]}>
        <boxGeometry args={[0.47, 0.13, 0.075]} />
        <meshStandardMaterial color="#5b321c" roughness={0.78} />
      </mesh>
    </group>
  );
}

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

export default function SalonScene() {
  const T = useT();
  const baseZoom = useBaseZoom();
  const setCaja = useUi((s) => s.setCaja);
  const focus: CamFocus = { target: [0, 1.3, 0], zoom: baseZoom };
  const est = estacionActual();

  return (
    <main>
      <SceneShell
        focus={focus}
        ariaLabel={T.a11y.escena}
        onMiss={() => setCaja(null)}
        bg="#eee9df"
        visualProfile="natural"
      >
        <Room theme={THEMES.salon} windowX={-1.2}>
          <Counter position={[-3.3, 0, -3.4]} />
          {/* y 1.2→1.173: la base del GLB flota 2.5 cm sobre el mostrador (apoyo medido malla-a-malla) */}
          <Teapot position={[-3.2, 1.173, -3.3]} />
          {/* bandeja servida COMPUESTA por las funciones absorbidas (fábrica Blender, C3) */}
          <GLB url="/modelos/bandeja_servida.glb" position={[-3.85, 1.17, -3.35]} rotation={[0, 0.5, 0]} scale={0.85} />
          <Scale position={[-4.55, 1.2, -3.4]} />
          <SunPatch position={[-1.2, 0.02, -2.85]} size={[1.7, 2.7]} intensity={0.5} />
          <WallSpill position={[-1.2, 0.72, -4.88]} />
          <Armchair position={[4.05, 0, 0.7]} rotY={-2.05} />
          <Armchair position={[-3.1, 0, 0.6]} rotY={2.4} color="#7c8a5a" />
          <Fireplace position={[-4.62, 0.78, 1.6]} rotY={Math.PI / 2} />   {/* el fondo del hogar queda EN la cara del muro (x=−4,96): antes el hueco estaba detrás del muro y el propio muro lo tapaba */}
          {/* la mesa grande con las cajas */}
          <Table position={[0.5, 0, 0.5]} w={4.4} d={2.2} h={0.95} />
          <SeasonBoxes position={[0.5, 1.173, 0.5]} />
          <PlantPot position={[4.3, 0.15, -4]} />
          {/* detalle fino del salón */}
          <FramedPicture position={[-3.2, 2.95, -4.88]} w={1.5} h={1.05} variant={0} />
          <FramedPicture position={[-4.88, 2.7, 3.3]} rotY={Math.PI / 2} w={0.9} h={0.7} variant={1} />
          <MantelSet position={[-4.25, 1.99, 1.6]} />
          <WallCross position={[-4.86, 2.85, 1.6]} rotY={Math.PI / 2} />
          <LogBasket position={[-4.62, 0, 2.85]} />
          <CupShelf position={[-3.6, 2.2, -4.84]} />
          <GrandfatherClock position={[-4.62, 0, 0.05]} rotY={Math.PI / 2} />
          <Clogs position={[-2.45, 0, 1.3]} rotY={0.7} />
          {/* densidad v3: la habitación amueblada de verdad */}
          <LowBookcase position={[-0.42, 0, -4.62]} />
          <SideTable position={[-2.85, 0, 1.75]} rotY={0.4} />
          <DoorDrapes position={[-4.86, 0, -1.4]} rotY={Math.PI / 2} />
          <SewingBasket position={[-2.45, 0, -0.25]} rotY={-0.5} />
          <HangingPlant position={[4.15, 4.6, -0.9]} />
          <MagazineRack position={[4.25, 0, 1.8]} rotY={-0.9} />
          <PhotoFrame position={[-2.35, 1.18, -3.5]} rotY={-0.5} />
          <Door position={[1.2, 1.3, -4.85]} color="#6f7f4d" label={T.nav.te} href="/te" felpudo={false} />
          <Door position={[3.4, 1.3, -4.85]} color="#7d3a44" label={T.nav.tePremium} href="/te-premium" felpudo={false} />
          <Door position={[-4.85, 1.3, -1.4]} rotY={Math.PI / 2} color="#8a6a3f" label={T.nav.nosotros} href="/nosotros" />
          <DecoVivo sala="salon" />
          <Basket />
          <FlyingItem to={BASKET_POS} />
        </Room>
      </SceneShell>

      <header className="fixed z-20 top-12 left-3 sm:left-4 pointer-events-none">
        <h1 className="font-display text-2xl sm:text-3xl text-[var(--madera-oscura)] drop-shadow-[0_1px_0_var(--crema)]">
          {T.salon.titulo}
        </h1>
        <p className="text-xs sm:text-sm text-[var(--madera)]/90 mt-1 max-w-60">
          Estamos en {NOMBRE_ESTACION[est]} — {T.salon.cajas}.
        </p>
      </header>
      <Guia sala="salon" />
      <CajaPanel />
      <ExtraPanel />

      <section className="sr-only-block" aria-label="Cajas de temporada">
        <h2>Cajas de temporada</h2>
        <ul>
          {CAJAS.map((c) => (
            <li key={c.id}>
              <h3>{c.nombre} — {precioCaja(c).toFixed(2)} €</h3>
              <p>{c.descripcion}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
