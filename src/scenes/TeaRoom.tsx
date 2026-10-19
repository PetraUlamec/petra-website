"use client";
// Las salas de venta (VISION §3). CADA UNA ÚNICA:
// · Té normal: estantería de botica, paredes salvia, haz de luz, cucharero, tetera humeando.
// · Té premium: paredes granate, CINCO PEDESTALES en arco con filo dorado y velas encendidas.
import { useMemo, useState, useEffect } from "react";
import SceneShell, { type CamFocus } from "@/components/three/SceneShell";
import Room, { THEMES } from "@/components/three/Room";
import { Shelf, Table, Teapot, PlantPot, Door } from "@/components/three/Furniture";
import { Sconce, Pedestal } from "@/components/three/Decor";
import { SunPatch, WallSpill } from "@/components/three/LightShaft";
import { Chispas } from "@/components/three/Chispa";
import Jar from "@/components/three/Jar";
import { INSPECTION_POSITION } from "@/lib/ingredientLayout";
import PlantChips from "@/components/three/PlantChips";
import DecoVivo from "@/components/three/DecoVivo";
import Basket, { BASKET_POS } from "@/components/three/Basket";
import FlyingItem from "@/components/three/FlyingItem";
import SpoonRack, { SPOON_COLORS } from "@/components/three/SpoonRack";
import {
  ApothecaryFront, ApothecaryLadder, HangingLamp, SteamingCups, SpilledJar, WallSign,
  GlassDome, Chandelier, GoldFramePortrait, VelvetRope, PremiumFireplace,
  TeaCrateStack, FloorTarro, CupTray, PressedHerbFrame, WindowValance,
  VelvetRunner, CornerVitrine, SilverTray, GoldMiniFrame, PalmPlant,
} from "@/components/three/deco/tearoom";
import TeaPanel from "@/components/hud/TeaPanel";
import Guia from "@/components/hud/Guia";
import ExtraPanel from "@/components/hud/ExtraPanel";
import GLB from "@/components/three/Modelos";
import { teasBySala } from "@/data/teas";
import { cucharas } from "@/data/extras";
import { useUi } from "@/lib/ui";
import { subscribeVivo, getVivoVersion, setVivo, cargarVivo } from "@/lib/vivoStore";
import { useT } from "@/i18n";

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

export default function TeaRoom({ sala }: { sala: "te" | "te-premium" }) {
  const T = useT();
  const [vivoV, setVivoV] = useState(getVivoVersion());
  useEffect(() => subscribeVivo(() => setVivoV(getVivoVersion())), []);
  const allTeas = useMemo(() => teasBySala(sala), [sala, vivoV]);
  const [shelfPage, setShelfPage] = useState(0);
  const capacity = sala === "te-premium" ? 7 : 12;
  const pages = Math.max(1, Math.ceil(allTeas.length / capacity));
  const activePage = Math.min(shelfPage, pages - 1);
  const teas = useMemo(() => allTeas.slice(activePage * capacity, (activePage + 1) * capacity), [allTeas, activePage, capacity]);
  const focusTeaId = useUi((s) => s.focusTeaId);
  const plantId = useUi((s) => s.plantId);
  const focusTea = useUi((s) => s.focusTea);
  const setPlant = useUi((s) => s.setPlant);
  const extraId = useUi((s) => s.extraId);
  const setExtra = useUi((s) => s.setExtra);
  const baseZoom = useBaseZoom();
  const premium = sala === "te-premium";

  useEffect(() => () => { focusTea(null); setExtra(null); }, [focusTea, setExtra, sala]);
  useEffect(() => {
    let active = true;
    const preview = (event: MessageEvent) => {
      if (window.parent !== window && event.source === window.parent && event.origin === location.origin && event.data?.type === "petra-studio-preview" && Array.isArray(event.data.catalog?.teas) && new URLSearchParams(location.search).get("studio") === "1") {
        cargarVivo().then(() => {
          if (!active) return;
          setVivo(event.data.catalog);
          const index = teasBySala(sala).findIndex((tea) => tea.id === event.data.teaId);
          if (index >= 0) { setShelfPage(Math.floor(index / capacity)); focusTea(event.data.teaId); }
        });
      }
    };
    window.addEventListener("message", preview);
    if (window.parent !== window && new URLSearchParams(location.search).get("studio") === "1") window.parent.postMessage({ type: "petra-studio-ready" }, location.origin);
    return () => { active = false; window.removeEventListener("message", preview); };
  }, [sala, capacity, focusTea]);

  const spoonList = useMemo(() => cucharas(), [vivoV]);
  const spoonPositions = useMemo(() => {
    const pos: Record<string, [number, number, number]> = {};
    const w = spoonList.length * 0.42 + 0.3;
    spoonList.forEach((spoon, i) => {
      const localX = -w / 2 + 0.36 + i * 0.42;
      // El cucharero está girado 90°: +Z local avanza en +X mundial y X local pasa a -Z.
      pos[spoon.id] = [-4.08, 1.62, 0.6 - localX];
    });
    return pos;
  }, [spoonList]);
  const spoonColors = useMemo(() => Object.fromEntries(
    spoonList.map((spoon, i) => [spoon.id, SPOON_COLORS[i % SPOON_COLORS.length]])
  ), [spoonList]);

  // posiciones: estantería (normal) o arco de pedestales (premium)
  const jarPositions = useMemo(() => {
    const pos: Record<string, [number, number, number]> = {};
    if (premium) {
      // Seis conjuntos forman un círculo sobre la alfombra y el séptimo ocupa el centro.
      // La alfombra circular está centrada en (0.4, 0.6); radio de distribución: 1.85.
      const arc: [number, number][] = [
        [0.4, -1.25],
        [2.0, -0.325],
        [2.0, 1.525],
        [0.4, 2.45],
        [-1.2, 1.525],
        [-1.2, -0.325],
        [0.4, 0.6],
      ];
      teas.forEach((t, i) => {
        const [x, z] = arc[i % arc.length];
        pos[t.id] = [x, 1.15, z];
      });
    } else {
      // 12 tés → 2 baldas de 6 (con 3 filas la última entraba en el copete de la botica)
      const perLevel = 6;
      const gap = 1.0;
      teas.forEach((t, i) => {
        const level = Math.floor(i / perLevel);
        const idx = i % perLevel;
        const rowCount = Math.min(perLevel, teas.length - level * perLevel);
        const x = (idx - (rowCount - 1) / 2) * gap;
        pos[t.id] = [x, 1.15 + level * 1.05, -4.05];
      });
    }
    return pos;
  }, [teas, premium]);

  const focused = focusTeaId ? jarPositions[focusTeaId] : null;
  // el tarro enfocado se ADELANTA de la balda (gesto de cogerlo): cámara y plantas van al punto adelantado
  const picked: [number, number, number] | null = focused
    ? INSPECTION_POSITION
    : null;
  const focusedSpoon = !premium && extraId ? spoonPositions[extraId] : null;
  const focus: CamFocus = picked
    ? { target: [picked[0] + (baseZoom < 30 ? 0 : 0.75), picked[1] + (baseZoom < 30 ? 0.1 : 0.9), picked[2] - (baseZoom < 30 ? 0 : 0.75)], zoom: baseZoom * 2.3 }
    : focusedSpoon
      ? { target: focusedSpoon, zoom: baseZoom * 2.7 }
      : { target: [0, 1.35, 0], zoom: baseZoom };

  const titulo = premium ? T.sala.tePremium : T.sala.te;

  return (
    <main>
      {pages > 1 && <nav aria-label={T.sala.te} className="fixed z-30 left-3 bottom-16 flex items-center gap-2 panel p-2">
        <button className="sign min-w-10 min-h-10" disabled={activePage === 0} onClick={() => { focusTea(null); setShelfPage(activePage - 1); }}>←</button>
        <span>{activePage + 1} / {pages}</span>
        <button className="sign min-w-10 min-h-10" disabled={activePage === pages - 1} onClick={() => { focusTea(null); setShelfPage(activePage + 1); }}>→</button>
      </nav>}
      <SceneShell
        focus={focus}
        ariaLabel={T.a11y.escena}
        onMiss={() => { focusTea(null); setExtra(null); }}
        bg={premium ? "#e8cdb6" : "#eee7c4"}
      >
        <Room theme={premium ? THEMES.premium : THEMES.te} windowX={premium ? 1.6 : -3.95} windowCurtains={premium}>
          {premium ? (
            <>
              {teas.map((t) => {
                const p = jarPositions[t.id];
                return <Pedestal key={`p-${t.id}`} position={[p[0], 0, p[2]]} />;
              })}
              {teas.map((t) => (
                <GlassDome key={`d-${t.id}`} position={jarPositions[t.id]} lifted={focusTeaId === t.id} />
              ))}
              <Sconce position={[-1.6, 2.6, -4.88]} withLight />
              <Sconce position={[3.2, 2.6, -4.88]} />
              <Sconce position={[-4.88, 2.6, -0.8]} rotY={Math.PI / 2} withLight />
              <PremiumFireplace position={[-4.55, 0, 1.8]} />
              <SunPatch position={[1.6, 0.02, -2.9]} size={[1.7, 2.7]} intensity={0.5} />
              <WallSpill position={[1.6, 0.72, -4.88]} />
              <Chispas position={[1.6, 2.3, -4.2]} />
              <Chispas position={[0, 2.9, -1.9]} scale={[1.6, 1.2, 1.6]} count={18} />
              {/* Lámpara centrada sobre la alfombra y el séptimo frasco. */}
              <Chandelier position={[0.4, 0, 0.6]} ceiling={4.5} height={3.6} />
              <GoldFramePortrait position={[-0.4, 2.7, -4.86]} />
              {/* Barandal fuera de la alfombra, detrás del círculo de frascos. */}
              <VelvetRope from={[-1.9, 0, -2.35]} to={[1.9, 0, -2.35]} />
              {/* La alfombra rectangular y la mesa forman una sola composición en el frente del cuarto. */}
              <group position={[-1.55, 0, 3.9]}>
                <group rotation={[0, Math.PI / 2, 0]}>
                  <VelvetRunner position={[0, 0.03, 0]} w={1.35} l={2.6} />
                </group>
                {/* Mesa elevada al nivel superior de la alfombra: las cuatro patas descansan sobre ella. */}
                <group position={[0, 0.04, 0]}>
                  <Table position={[0, 0, 0]} w={1.6} d={1.1} />
                  <Teapot position={[0, 1.05, 0]} />
                  {/* Se conserva la distribución original de los objetos sobre la mesa. */}
                  <GLB url="/modelos/bandeja_servida.glb" position={[-0.5, 1.06, -0.25]} rotation={[0, 0.4, 0]} />
                  <SilverTray position={[0.55, 1.05, 0.3]} />
                </group>
              </group>
              {/* — densidad premium — */}
              <CornerVitrine position={[-4.55, 0, 3.55]} rotY={Math.PI / 2} />
              <GoldMiniFrame position={[2.95, 3.02, -4.86]} w={0.34} h={0.42} />
              <GoldMiniFrame position={[2.95, 2.32, -4.86]} w={0.3} h={0.36} fondo="#f0e2c6" motivo="#7d3a44" />
              <PalmPlant position={[2.62, 0, -4.2]} rotY={0.4} />
            </>
          ) : (
            <>
              <Shelf position={[0, 0, -4.3]} width={6.0} levels={2} sideHeight={2.9} />
              <ApothecaryFront />
              <ApothecaryLadder />
              <HangingLamp />
              <SunPatch position={[-3.9, 0.02, -2.85]} size={[1.7, 2.7]} intensity={0.55} />
              <WallSpill position={[-3.95, 0.72, -4.88]} />
              <Chispas position={[-3.9, 2.3, -4.2]} />
              {/* Mesa y servicio centrados como una sola composición en la alfombra (centro 0.4, 0.6). */}
              <Table position={[0.4, 0, 0.6]} />
              <Teapot position={[0.4, 1.05, 0.6]} />
              <SteamingCups position={[0.85, 1.05, 0.75]} />
              <SpilledJar position={[-0.2, 1.05, 0.35]} />
              <WallSign position={[0.2, 3.95, -4.88]} w={1.75} texto={T.sala.mezclas} />
              <SpoonRack position={[-4.85, 2.2, 0.6]} rotY={Math.PI / 2} />
              <PlantPot position={[-4.3, 0.15, 2.6]} />
              {/* — densidad de la sala de té — */}
              <TeaCrateStack position={[-4.25, 0, 1.65]} />
              {/* Los dos botes grandes quedan juntos contra la pared izquierda, después de la maceta. */}
              <FloorTarro position={[-4.55, 0, 3.38]} scale={1.6} />
              <FloorTarro position={[-4.55, 0, 4.12]} scale={1.5} tone="#5e3d24" />
              <CupTray position={[1.15, 1.05, 0.15]} />
              <PressedHerbFrame position={[-4.86, 3.02, 0.02]} rotY={Math.PI / 2} w={0.3} h={0.4} />
              <PressedHerbFrame position={[-4.86, 2.92, 1.15]} rotY={Math.PI / 2} w={0.26} h={0.34} tone="#7a5330" herb="#8aa25a" />
              <PressedHerbFrame position={[-4.86, 2.82, 2.18]} rotY={Math.PI / 2} w={0.21} h={0.28} tone="#6b4527" herb="#7c8a5a" />
              <WindowValance position={[-3.92, 3.56, -4.73]} width={1.72} />
            </>
          )}
          {teas.map((t) => (
            <Jar
              key={t.id}
              tea={t}
              position={jarPositions[t.id]}
              focused={focusTeaId === t.id}
              dimmed={focusTeaId !== null && focusTeaId !== t.id}
              onSelect={() => { setExtra(null); focusTea(focusTeaId === t.id ? null : t.id); }}
            />
          ))}
          {focusTeaId && picked && teas.some((tea) => tea.id === focusTeaId) && (
            <PlantChips
              tea={teas.find((t) => t.id === focusTeaId)!}
              jarPos={picked!}
              selectedPlantId={plantId}
              onPick={(id) => setPlant(id)}
            />
          )}
          <Door position={[-4.85, 1.3, -2.6]} rotY={Math.PI / 2} color="#8a6a3f" label={T.nav.salon} href="/salon" felpudo={!premium} />
          <Door
            position={[4.15, 1.3, -4.85]}
            color={premium ? "#6f7f4d" : "#7d3a44"}
            label={premium ? T.nav.te : T.nav.tePremium}
            href={premium ? "/te" : "/te-premium"}
            felpudo={!premium}
          />
          <DecoVivo sala={premium ? "te-premium" : "te"} />
          <Basket />
          <FlyingItem to={BASKET_POS} />
        </Room>
      </SceneShell>

      <header className="fixed z-20 top-12 left-3 sm:left-4 pointer-events-none">
        <h1 className="font-display text-2xl sm:text-3xl text-[var(--madera-oscura)] drop-shadow-[0_1px_0_var(--crema)]">
          {titulo}
        </h1>
        {!focusTeaId && <p className="text-xs sm:text-sm text-[var(--madera)]/90 mt-1 max-w-56">{T.sala.pistaTarros}</p>}
      </header>
      <Guia sala={premium ? "tePremium" : "te"} />
      <TeaPanel jarPositions={jarPositions} />
      <ExtraPanel spoonPositions={premium ? undefined : spoonPositions} spoonColors={premium ? undefined : spoonColors} />

      <section className="sr-only-block" aria-label={titulo}>
        <h2>{titulo}</h2>
        <ul>
          {teas.map((t) => (
            <li key={t.id}>
              <h3>{t.nombre} — {t.precio.toFixed(2)} € ({t.gramos} g)</h3>
              <p>{t.paraQueSirve}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
