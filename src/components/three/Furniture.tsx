"use client";
// Mobiliario procedural de la casa: estantería, mesa, mostrador, puerta tocable, tetera con vapor,
// maceta, cucharero de Erik. Piezas sustituibles por los .glb reales de SER.
import * as THREE from "three";
import { WoodMat, MetalMat } from "./Mats";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { enEditor } from "@/lib/editor";
import { WOOD } from "./Room";
import { plantById } from "@/data/plants";
import PlantSprig from "./PlantSprig";
import GLB from "./Modelos";

export function Shelf({
  position, width = 5.6, levels = 2, depth = 0.9, sideHeight,
}: { position: [number, number, number]; width?: number; levels?: number; depth?: number; sideHeight?: number }) {
  const defaultSideHeight = 1.1 + (levels - 1) * 1.05 + 0.5;
  const resolvedSideHeight = sideHeight ?? defaultSideHeight;
  return (
    <group position={position}>
      {Array.from({ length: levels }).map((_, i) => (
        <mesh key={i} position={[0, 1.1 + i * 1.05, 0]} castShadow receiveShadow>
          <boxGeometry args={[width, 0.09, depth]} />
          <WoodMat tone={WOOD.viga} />
        </mesh>
      ))}
      {[-width / 2 + 0.12, width / 2 - 0.12].map((x, i) => (
        <mesh key={i} position={[x, 0.05 + resolvedSideHeight / 2, 0]} castShadow>
          <boxGeometry args={[0.14, resolvedSideHeight, depth]} />
          <WoodMat tone={WOOD.marco} />
        </mesh>
      ))}
    </group>
  );
}

export function Table({ position, w = 2.6, d = 1.4, h = 1.0 }: { position: [number, number, number]; w?: number; d?: number; h?: number }) {
  return (
    <group position={position}>
      <mesh position={[0, h, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, 0.1, d]} />
        <WoodMat tone={WOOD.suelo} />
      </mesh>
      {([[-1, -1], [1, -1], [-1, 1], [1, 1]] as const).map(([sx, sz], i) => (
        <mesh key={i} position={[(sx * (w - 0.3)) / 2, h / 2, (sz * (d - 0.3)) / 2]} castShadow>
          <boxGeometry args={[0.12, h, 0.12]} />
          <meshStandardMaterial color={WOOD.marco} />
        </mesh>
      ))}
    </group>
  );
}

/** Puerta tocable: el camino bonito entre habitaciones (VISION §2). */
export function Door({
  position, rotY = 0, color = "#6f7f4d", label, href, felpudo = true,
}: { position: [number, number, number]; rotY?: number; color?: string; label: string; href: string; felpudo?: boolean }) {
  const router = useRouter();
  const [hover, setHover] = useState(false);
  const g = useRef<THREE.Group>(null);
  const opening = useRef(false);
  const elapsed = useRef(0);
  const enter = () => {
    if (enEditor() || opening.current) return;
    opening.current = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) router.push(href);
  };
  useEffect(() => () => { document.body.style.cursor = "auto"; }, []);
  useFrame((_, delta) => {
    if (g.current) g.current.rotation.y = THREE.MathUtils.damp(g.current.rotation.y, opening.current ? -Math.PI / 2 : hover ? -0.12 : 0, 10, delta);
    if (opening.current) {
      elapsed.current += delta;
      if (elapsed.current >= 0.45 && elapsed.current < 100) {
        elapsed.current = 100;
        document.body.style.cursor = "auto";
        router.push(href);
      }
    }
  });
  return (
    <group name={`puerta-${href.replace(/\//g, "")}`} position={position} rotation={[0, rotY, 0]}>
      <mesh position={[0, 0, -0.025]}>
        <boxGeometry args={[1.3, 2.6, 0.03]} />
        <meshBasicMaterial color="#21180f" />
      </mesh>
      <group ref={g} position={[-0.65, 0, 0]}>
        <group
          position={[0.65, 0, 0]}
          onClick={(e) => { e.stopPropagation(); enter(); }}
          onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = "pointer"; }}
          onPointerOut={() => { setHover(false); document.body.style.cursor = "auto"; }}
        >
          <mesh castShadow>
            <boxGeometry args={[1.3, 2.6, 0.12]} />
            <meshStandardMaterial color={color} roughness={0.65} emissive={hover ? "#3a2f14" : "#000000"} />
          </mesh>
          {/* cuarterones hundidos */}
          {[0.62, -0.55].map((py, i) => (
            <mesh key={i} position={[0, py, 0.065]}>
              <boxGeometry args={[0.92, i === 0 ? 0.95 : 1.15, 0.03]} />
              <meshStandardMaterial color={color} roughness={0.8} />
            </mesh>
          ))}
          {[0.62, -0.55].map((py, i) => (
            <mesh key={`b${i}`} position={[0, py, 0.082]}>
              <boxGeometry args={[0.7, i === 0 ? 0.72 : 0.92, 0.02]} />
              <meshStandardMaterial color={color} roughness={0.55} emissive={hover ? "#241f0d" : "#000000"} />
            </mesh>
          ))}
          {/* pomo y cerradura */}
          <mesh position={[0.45, 0, 0.1]}>
            <sphereGeometry args={[0.07, 12, 12]} />
            <meshStandardMaterial color="#d9b45b" metalness={0.6} roughness={0.3} />
          </mesh>
          <mesh position={[0.45, -0.16, 0.09]}>
            <boxGeometry args={[0.05, 0.09, 0.02]} />
            <meshStandardMaterial color="#b08d57" metalness={0.5} roughness={0.4} />
          </mesh>
          {/* bisagras */}
          {[0.85, -0.85].map((py) => (
            <mesh key={py} position={[-0.61, py, 0.07]}>
              <boxGeometry args={[0.07, 0.16, 0.03]} />
              <meshStandardMaterial color="#2e2013" metalness={0.4} roughness={0.5} />
            </mesh>
          ))}
        </group>
      </group>
      {/* marco completo: jambas y dintel */}
      <group>
        <mesh position={[0, 1.42, 0]}>
          <boxGeometry args={[1.66, 0.16, 0.22]} />
          <meshStandardMaterial color={WOOD.marco} />
        </mesh>
        {[-0.72, 0.72].map((px) => (
          <mesh key={px} position={[px, 0.075, 0]}>
            <boxGeometry args={[0.14, 2.75, 0.2]} />
            <meshStandardMaterial color={WOOD.marco} />
          </mesh>
        ))}
        {/* felpudo opcional: algunas puertas interiores no lo necesitan */}
        {felpudo && (
          <mesh position={[0, -1.29, 0.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[1.1, 0.55]} />
            <meshStandardMaterial color="#77603f" roughness={1} />
          </mesh>
        )}
      </group>
      {(
        <Html position={[0.45, 0, 0.18]} center zIndexRange={[10, 0]}>
          <button data-door-link type="button" onClick={enter} className="block h-10 w-10 rounded-full bg-transparent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-700" aria-label={label} />
        </Html>
      )}
    </group>
  );
}

/** Tetera con vapor: el sueño en marcha. */
export function Teapot({ position }: { position: [number, number, number] }) {
  const steam = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!steam.current) return;
    steam.current.children.forEach((m, i) => {
      const t = (clock.elapsedTime * 0.5 + i * 0.33) % 1;
      m.position.y = 0.35 + t * 1.1;
      m.position.x = Math.sin((t + i) * 5) * 0.08;
      const s = 0.035 + t * 0.06;
      m.scale.set(s, s * 1.5, s);
      (m as THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>).material.opacity = 0.2 * (1 - t) * (1 - t);
    });
  });
  return (
    <group position={position}>
      {/* tetera TALLADA en Blender (fábrica bpy); la esfera vieja queda de fallback */}
      <GLB
        url="/modelos/tetera.glb"
        scale={1.05}
        fallback={
          <mesh castShadow position={[0, 0.16, 0]}>
            <sphereGeometry args={[0.24, 20, 16]} />
            <meshStandardMaterial color="#a8593f" roughness={0.4} />
          </mesh>
        }
      />
      <group ref={steam}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[0, 0.4, 0]}>
            <sphereGeometry args={[1, 10, 10]} />
            <meshStandardMaterial color="#fff8ec" transparent opacity={0.25} depthWrite={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

export function PlantPot({ position, flores = ["manzanilla", "lavanda", "menta"] }: { position: [number, number, number]; flores?: string[] }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <cylinderGeometry args={[0.22, 0.16, 0.3, 12]} />
        <meshStandardMaterial color="#b06a3d" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.14, 0]}>
        <cylinderGeometry args={[0.19, 0.19, 0.05, 12]} />
        <meshStandardMaterial color="#4a3320" roughness={1} />
      </mesh>
      {/* brotes REALES del herbario, en corro */}
      {flores.map((id, i) => {
        const a = (i / flores.length) * Math.PI * 2 + 0.6;
        try {
          const plant = plantById(id);
          return (
            <group key={id} position={[Math.cos(a) * 0.09, 0.16, Math.sin(a) * 0.09]} rotation={[0, a, 0]} scale={1.5}>
              <PlantSprig plant={plant} />
            </group>
          );
        } catch { return null; }
      })}
    </group>
  );
}
