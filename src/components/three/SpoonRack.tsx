"use client";
// Cucharero de Erik: nueve cucharas talladas, cada una con silueta y madera propias.
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useEffect, useRef, useState } from "react";
import { cucharas } from "@/data/extras";
import { useLang } from "@/i18n";
import { trExtra } from "@/i18n/catalogo";
import { subscribeVivo, getVivoVersion } from "@/lib/vivoStore";
import { useUi } from "@/lib/ui";
import { WOOD } from "./Room";

export const SPOON_COLORS = [
  "#6b4527", "#8a4c33", "#c9a26a", "#8a6a3f", "#5b3a21",
  "#9a5b3c", "#7a5330", "#b0713f", "#4a3826",
];

function CarvedSpoon({ i }: { i: number }) {
  const color = SPOON_COLORS[i % SPOON_COLORS.length];
  const dark = new THREE.Color(color).multiplyScalar(0.67).getStyle();
  const bowlW = 0.061 + (i % 3) * 0.007;
  const bowlH = 0.083 + (i % 2) * 0.009;
  const handleRadius = 0.012 + (i % 3) * 0.002;
  const bend = ((i % 4) - 1.5) * 0.012;
  const handleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.075, 0),
    new THREE.Vector3(bend, -0.08, 0),
    new THREE.Vector3(-bend * 0.45, -0.27, 0),
    new THREE.Vector3(bend * 0.25, -0.49, 0),
  ]);
  const lean = Math.sin(i * 1.7) * 0.025;
  return (
    <group rotation={[0, 0, lean]}>
      {/* Cuenco pequeño arriba, igual que las siluetas de la web clásica. */}
      <mesh position={[0, 0.15, 0]} scale={[bowlW, bowlH, 0.034]} castShadow>
        <sphereGeometry args={[1, 22, 16]} />
        <meshStandardMaterial color={color} roughness={0.66} />
      </mesh>
      <mesh position={[0, 0.153, 0.032]} scale={[bowlW * 0.67, bowlH * 0.68, 0.007]}>
        <sphereGeometry args={[1, 18, 12]} />
        <meshStandardMaterial color={dark} roughness={0.88} />
      </mesh>
      {/* Mango largo, fino y apenas curvado: una auténtica cucharita de té. */}
      <mesh castShadow>
        <tubeGeometry args={[handleCurve, 18, handleRadius, 8, false]} />
        <meshStandardMaterial color={color} roughness={0.72} />
      </mesh>
      <mesh position={[bend * 0.25, -0.495, 0]} castShadow>
        <sphereGeometry args={[handleRadius * 1.18, 10, 8]} />
        <meshStandardMaterial color={color} roughness={0.75} />
      </mesh>
      {/* Algunas piezas tienen el pequeño orificio tallado que se ve en el catálogo. */}
      {i % 3 === 1 && (
        <mesh position={[0, 0.153, 0.04]}>
          <circleGeometry args={[0.013, 14]} />
          <meshStandardMaterial color="#f3e7c9" roughness={1} />
        </mesh>
      )}
      {/* Zona invisible generosa para no dificultar el hover ni el clic. */}
      <mesh position={[0, -0.16, -0.015]}>
        <boxGeometry args={[0.2, 0.76, 0.12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

function Spoon({ x, i, id, nombre }: { x: number; i: number; id: string; nombre: string }) {
  const [hover, setHover] = useState(false);
  const setExtra = useUi((s) => s.setExtra);
  const focusTea = useUi((s) => s.focusTea);
  const sel = useUi((s) => s.extraId) === id;
  const g = useRef<THREE.Group>(null);

  useFrame((state, dt) => {
    if (!g.current) return;
    const t = g.current;
    const objetivoZ = sel ? 0.72 : hover ? 0.11 : 0;
    t.position.z += (objetivoZ - t.position.z) * Math.min(1, dt * 5.5);
    const objetivoGiro = sel ? Math.sin(state.clock.elapsedTime * 1.5 + i * 0.2) * 0.16 : 0;
    t.rotation.y += (objetivoGiro - t.rotation.y) * Math.min(1, dt * 5);
    const objetivoEscala = sel ? 1.72 : hover ? 1.17 : 1;
    t.scale.lerp(new THREE.Vector3(objetivoEscala, objetivoEscala, objetivoEscala), Math.min(1, dt * 7));
  });

  return (
    <group position={[x, -0.32, 0.06]} rotation={[0, 0, Math.sin(i * 2.1) * 0.045]}>
      <group
        name={`spoon-${id}`}
        ref={g}
        onClick={(e) => {
          e.stopPropagation();
          focusTea(null);
          setExtra(sel ? null : id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHover(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHover(false);
          document.body.style.cursor = "auto";
        }}
      >
        <CarvedSpoon i={i} />
      </group>
      {hover && !sel && (
        <Html position={[0, 0.4, 0.08]} center style={{ pointerEvents: "none" }}>
          <div className="sign px-1.5 py-0.5 text-[10px] whitespace-nowrap">{nombre}</div>
        </Html>
      )}
    </group>
  );
}

export default function SpoonRack({ position, rotY = 0 }: { position: [number, number, number]; rotY?: number }) {
  const { lang } = useLang();
  const [, setV] = useState(0);
  useEffect(() => subscribeVivo(() => setV(getVivoVersion())), []);
  const list = cucharas().map(spoon => trExtra(spoon, lang));
  const w = list.length * 0.42 + 0.3;
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <mesh castShadow>
        <boxGeometry args={[w, 0.14, 0.08]} />
        <meshStandardMaterial color={WOOD.marco} roughness={0.8} />
      </mesh>
      {list.map((c, i) => (
        <Spoon key={c.id} x={-w / 2 + 0.36 + i * 0.42} i={i} id={c.id} nombre={c.nombre} />
      ))}
    </group>
  );
}
