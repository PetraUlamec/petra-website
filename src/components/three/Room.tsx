"use client";
// La habitación base del diorama: suelo de tablas, dos paredes en esquina, ventana con luz,
// alfombra y vigas. Todo procedural — se sustituirá pieza a pieza por los .glb de SER.
import * as THREE from "three";
import { useMemo } from "react";
import { WoodMat, PlasterMat, LinenMat } from "./Mats";

export const WOOD = {
  suelo: "#8a5f38",
  sueloVeta: "#7a5330",
  pared: "#e9d9b8",
  zocalo: "#6b4527",
  viga: "#5b3a21",
  marco: "#4a2f1a",
} as const;

export interface RoomTheme {
  pared: string;
  zocalo: string;
  sueloA: string;
  sueloB: string;
  alfombraA: string;
  alfombraB: string;
}

/** Cada habitación con su carácter (encargo de SER: «cada habitación tiene que ser única») */
export const THEMES: Record<string, RoomTheme> = {
  te:       { pared: "#dfe3c0", zocalo: "#5f7a48", sueloA: "#8a5f38", sueloB: "#7a5330", alfombraA: "#7c8a5a", alfombraB: "#e3b04b" }, // salvia
  premium:  { pared: "#caa9a0", zocalo: "#5c2e35", sueloA: "#5e3d24", sueloB: "#4e3119", alfombraA: "#8a4049", alfombraB: "#d9b45b" }, // granate y oro
  salon:    { pared: "#ecd9b0", zocalo: "#6b4527", sueloA: "#8a5f38", sueloB: "#7a5330", alfombraA: "#a8593f", alfombraB: "#e3b04b" }, // el de siempre
  taller:   { pared: "#e0d3b8", zocalo: "#7a5330", sueloA: "#96703f", sueloB: "#856033", alfombraA: "#8a7350", alfombraB: "#c8a165" }, // madera clara
  correo:   { pared: "#d7dcc8", zocalo: "#54654a", sueloA: "#7a5330", sueloB: "#6b4527", alfombraA: "#54654a", alfombraB: "#d9c39a" }, // verde escritorio
  despensa: { pared: "#e7d2ac", zocalo: "#8a5f38", sueloA: "#a08050", sueloB: "#8f7040", alfombraA: "#b06a3d", alfombraB: "#e3b04b" }, // ocre despensa
};

function Boards({ w, d, a, b }: { w: number; d: number; a: string; b: string }) {
  // tablas del suelo con veta alterna
  const boards = useMemo(() => {
    const arr: { x: number; tone: string }[] = [];
    const n = Math.round(w / 0.62);
    for (let i = 0; i < n; i++) {
      arr.push({ x: -w / 2 + 0.31 + i * (w / n), tone: i % 2 ? a : b });
    }
    return arr;
  }, [w, a, b]);
  return (
    <group>
      {boards.map((b, i) => (
        <mesh key={i} position={[b.x, -0.03, 0]} receiveShadow>
          <boxGeometry args={[(w / boards.length) * 0.96, 0.06, d]} />
          <WoodMat tone={b.tone} />
        </mesh>
      ))}
    </group>
  );
}

type WindowCrossFill = {
  top?: boolean;
  bottom?: boolean;
  left?: boolean;
  right?: boolean;
};

export function Window({
  position,
  rotY = 0,
  curtains = true,
  crossFill,
}: {
  position: [number, number, number];
  rotY?: number;
  curtains?: boolean;
  crossFill?: WindowCrossFill;
}) {
  // Compensación mínima para cerrar el hueco aparente producido por la
  // perspectiva, sin atravesar ni sobresalir del marco exterior.
  const extension = 0.04;
  const topExtension = crossFill?.top ? extension : 0;
  const bottomExtension = crossFill?.bottom ? extension : 0;
  const leftExtension = crossFill?.left ? extension : 0;
  const rightExtension = crossFill?.right ? extension : 0;
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      {/* alféizar */}
      <mesh position={[0, -1.06, 0.12]} castShadow>
        <boxGeometry args={[1.9, 0.1, 0.3]} />
        <meshStandardMaterial color={WOOD.marco} roughness={0.7} />
      </mesh>
      {/* cortinas de lino recogidas */}
      {curtains && [-1, 1].map((sx) => (
        <group key={sx} position={[sx * 0.98, 0.1, 0.14]}>
          <mesh castShadow scale={[0.55, 1, 0.5]}>
            <cylinderGeometry args={[0.16, 0.24, 2.1, 8]} />
            <meshStandardMaterial color="#f3e4c4" roughness={1} />
          </mesh>
          <mesh position={[0, -0.25, 0]} scale={[0.62, 1, 0.55]}>
            <torusGeometry args={[0.14, 0.035, 6, 12]} />
            <meshStandardMaterial color="#c9a26a" roughness={0.9} />
          </mesh>
        </group>
      ))}
      {/* barra de cortina */}
      {curtains && (
        <mesh position={[0, 1.14, 0.14]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.022, 0.022, 1.9, 6]} />
          <meshStandardMaterial color={WOOD.marco} roughness={0.7} />
        </mesh>
      )}
      <mesh>
        <boxGeometry args={[1.7, 2, 0.12]} />
        <WoodMat tone={WOOD.marco} />
      </mesh>
      <mesh position={[0, 0, 0.02]}>
        <boxGeometry args={[1.45, 1.75, 0.12]} />
        <meshStandardMaterial color="#fff2cf" emissive="#ffdf9e" emissiveIntensity={2.6} />
      </mesh>
      {/* cruceta */}
      <mesh position={[0, (topExtension - bottomExtension) / 2, 0.09]}>
        <boxGeometry args={[0.08, 1.75 + topExtension + bottomExtension, 0.04]} />
        <meshStandardMaterial color={WOOD.marco} />
      </mesh>
      <mesh position={[(rightExtension - leftExtension) / 2, 0, 0.09]}>
        <boxGeometry args={[1.45 + leftExtension + rightExtension, 0.08, 0.04]} />
        <meshStandardMaterial color={WOOD.marco} />
      </mesh>
    </group>
  );
}

export default function Room({
  w = 10,
  d = 10,
  h = 4.6,
  windows = true,
  windowX = 1.6,
  windowCurtains = true,
  theme = THEMES.salon,
  rug = true,
  children,
}: {
  w?: number;
  d?: number;
  h?: number;
  windows?: boolean;
  windowX?: number;
  windowCurtains?: boolean;
  theme?: RoomTheme;
  rug?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <group>
      <Boards w={w} d={d} a={theme.sueloA} b={theme.sueloB} />
      {/* alfombra */}
      {rug && (
        <>
          <mesh position={[0.4, 0.012, 0.6]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <circleGeometry args={[2.6, 40]} />
            <LinenMat tone={theme.alfombraA} />
          </mesh>
          <mesh position={[0.4, 0.02, 0.6]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[2.1, 2.3, 40]} />
            <LinenMat tone={theme.alfombraB} />
          </mesh>
          <mesh position={[0.4, 0.018, 0.6]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.4, 1.5, 36]} />
            <meshStandardMaterial color={theme.alfombraB} roughness={1} transparent opacity={0.6} />
          </mesh>
        </>
      )}
      {/* pared trasera (−z) y lateral (−x): la esquina isométrica clásica */}
      <mesh position={[0, h / 2, -d / 2]} receiveShadow>
        <boxGeometry args={[w, h, 0.18]} />
        <PlasterMat tone={theme.pared} />
      </mesh>
      <mesh position={[-w / 2, h / 2, 0]} receiveShadow>
        <boxGeometry args={[0.18, h, d]} />
        <PlasterMat tone={theme.pared} />
      </mesh>
      {/* zócalos */}
      <mesh position={[0, 0.22, -d / 2 + 0.12]}>
        <boxGeometry args={[w, 0.44, 0.08]} />
        <WoodMat tone={theme.zocalo} />
      </mesh>
      <mesh position={[-w / 2 + 0.12, 0.22, 0]}>
        <boxGeometry args={[0.08, 0.44, d]} />
        <WoodMat tone={theme.zocalo} />
      </mesh>
      {windows && <Window position={[windowX, 2.3, -d / 2 + 0.06]} curtains={windowCurtains} />}
      {children}
    </group>
  );
}
