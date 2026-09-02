"use client";
// El haz de luz de la ventana: el polvo ya flota — esto le da el rayo donde brillar (VISION: onírico).
import * as THREE from "three";
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";

let sunTex: THREE.Texture | null = null;
/** textura radial suave compartida (generada una vez): centro cálido → borde transparente */
function getSunTexture() {
  if (sunTex || typeof document === "undefined") return sunTex;
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  // los 4 cristales de la ventana proyectados (retícula con cruceta), suavizados
  g.filter = "blur(4px)";
  g.fillStyle = "rgba(255,232,170,0.9)";
  const m = 22, mid = 10; // margen y cruceta (hy3)
  const cw = (256 - 2 * m - mid) / 2, ch = (256 - 2 * m - mid) / 2;
  for (const [cx, cy] of [[m, m], [m + cw + mid, m], [m, m + ch + mid], [m + cw + mid, m + ch + mid]] as const) {
    g.fillRect(cx, cy, cw, ch);
  }
  g.filter = "none";
  // caída radial global para fundirse con el suelo
  const fade = g.createRadialGradient(128, 128, 38, 128, 128, 124);
  fade.addColorStop(0, "rgba(0,0,0,0)");
  fade.addColorStop(1, "rgba(0,0,0,1)");
  g.globalCompositeOperation = "destination-out";
  g.fillStyle = fade;
  g.fillRect(0, 0, 256, 256);
  sunTex = new THREE.CanvasTexture(c);
  sunTex.colorSpace = THREE.SRGBColorSpace;
  return sunTex;
}

let emberTex: THREE.Texture | null = null;
/** 24-ago (SER: «el reflejo del fuego parece el reflejo de una ventana»): el fuego NO puede usar la
 *  textura del sol —que dibuja los 4 cristales y la cruceta—. Esta es una mancha radial cálida. */
function getEmberTexture() {
  if (emberTex || typeof document === "undefined") return emberTex;
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  const rad = g.createRadialGradient(128, 128, 6, 128, 128, 126);
  rad.addColorStop(0, "rgba(255,214,150,0.95)");
  rad.addColorStop(0.35, "rgba(255,160,80,0.5)");
  rad.addColorStop(0.7, "rgba(255,120,50,0.16)");
  rad.addColorStop(1, "rgba(255,110,40,0)");
  g.fillStyle = rad; g.fillRect(0, 0, 256, 256);
  emberTex = new THREE.CanvasTexture(c);
  emberTex.colorSpace = THREE.SRGBColorSpace;
  return emberTex;
}

/** Resplandor de la lumbre en el suelo: mancha redonda que respira, no un reflejo de ventana. */
export function EmberGlow({
  position, size = [1.5, 1.2] as [number, number], color = "#ff9d4f", intensity = 0.42,
}: { position: [number, number, number]; size?: [number, number]; color?: string; intensity?: number }) {
  const tex = useMemo(() => getEmberTexture(), []);
  const m = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(({ clock }) => {
    if (m.current) m.current.opacity = intensity * (0.86 + Math.sin(clock.elapsedTime * 6.5) * 0.09 + Math.sin(clock.elapsedTime * 13) * 0.05);
  });
  if (!tex) return null;
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
      <planeGeometry args={size} />
      <meshBasicMaterial ref={m} map={tex} color={color} transparent opacity={intensity}
        blending={THREE.AdditiveBlending} depthWrite={false} />
    </mesh>
  );
}

/** Mancha de sol en el suelo bajo una ventana. */
export function SunPatch({
  position, rotZ = 0, size = [1.9, 3.1] as [number, number], color = "#ffe6ab", intensity = 0.55,
}: { position: [number, number, number]; rotZ?: number; size?: [number, number]; color?: string; intensity?: number }) {
  const tex = useMemo(() => getSunTexture(), []);
  if (!tex) return null;
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, rotZ]} scale={[1, 1.55, 1]} raycast={() => null}>
      <planeGeometry args={size} />
      <meshBasicMaterial
        map={tex} color={color} transparent opacity={intensity}
        blending={THREE.AdditiveBlending} depthWrite={false}
      />
    </mesh>
  );
}

export default function LightShaft({
  position = [1.6, 2.2, -4.7] as [number, number, number],
  rotY = 0,
}: { position?: [number, number, number]; rotY?: number }) {
  const m = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(({ clock }) => {
    if (m.current) m.current.opacity = 0.10 + Math.sin(clock.elapsedTime * 0.5) * 0.02;
  });
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      {/* sin raycast: el haz no debe robar clics a lo que hay detrás (puertas, hotspots) — C-3D-B */}
      <mesh position={[0, -1.0, 1.05]} rotation={[-0.52, 0, 0]} raycast={() => null} userData={{ intangible: true }}>
        <planeGeometry args={[1.55, 4.2]} />
        <meshBasicMaterial
          ref={m}
          color="#ffe6ab"
          transparent
          opacity={0.12}
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}


let spillTex: THREE.Texture | null = null;
function getSpillTexture() {
  if (spillTex || typeof document === "undefined") return spillTex;
  const c = document.createElement("canvas");
  c.width = 8; c.height = 128;
  const g = c.getContext("2d")!;
  const grad = g.createLinearGradient(0, 0, 0, 128);
  grad.addColorStop(0, "rgba(255,230,171,0.55)");
  grad.addColorStop(1, "rgba(255,230,171,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 8, 128);
  spillTex = new THREE.CanvasTexture(c);
  spillTex.colorSpace = THREE.SRGBColorSpace;
  return spillTex;
}

/** Derrame de luz en la pared bajo la ventana (hy3 #3): plano aditivo con gradiente vertical. */
export function WallSpill({ position, rotY = 0, width = 1.9 }: { position: [number, number, number]; rotY?: number; width?: number }) {
  const tex = getSpillTexture();
  if (!tex) return null;
  return (
    <mesh position={position} rotation={[0, rotY, 0]} raycast={() => null}>
      <planeGeometry args={[width, 1.15]} />
      <meshBasicMaterial map={tex} transparent opacity={0.3} blending={THREE.AdditiveBlending} depthWrite={false} />
    </mesh>
  );
}
