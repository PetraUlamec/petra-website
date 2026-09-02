"use client";
// Las cajas de temporada sobre la mesa del salón (VISION §5.2-5.3).
// La de la estación actual brilla; las guardadas se ven con su +15%.
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { useRef, useState } from "react";
import { CAJAS } from "@/data/boxes";
import { cajaEnTemporada, precioCaja } from "@/lib/season";
import { eur } from "@/lib/format";
import { useUi } from "@/lib/ui";

const BOX_COLORS: Record<string, string> = {
  "caja-general": "#a8763d",
  "caja-verano": "#d9a44c",
  "caja-invierno": "#7d3a44",
  "caja-primavera": "#7c8a5a",
  "caja-otono": "#a65a2e",
};

function BoxMesh({ id, x, z }: { id: string; x: number; z: number }) {
  const caja = CAJAS.find((c) => c.id === id)!;
  const enTemporada = cajaEnTemporada(caja);
  const [hover, setHover] = useState(false);
  const setCaja = useUi((s) => s.setCaja);
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!g.current) return;
    // 24-ago (SER): las de temporada flotaban con vaivén; ahora QUIETAS, solo un poco más altas
    const lift = hover ? 0.22 : enTemporada ? 0.05 : 0;
    g.current.position.y += (lift - g.current.position.y) * 0.15;
  });
  return (
    <group position={[x, 0, z]}>
      <group
        ref={g}
        onClick={(e) => { e.stopPropagation(); setCaja(id); }}
        onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { setHover(false); document.body.style.cursor = "auto"; }}
      >
        <mesh castShadow>
          <boxGeometry args={[0.72, 0.34, 0.5]} />
          <meshStandardMaterial
            color={BOX_COLORS[id]}
            roughness={0.8}
            emissive={hover || enTemporada ? BOX_COLORS[id] : "#000"}
            emissiveIntensity={hover ? 0.45 : enTemporada ? 0.18 : 0}
          />
        </mesh>
        {/* tapa con lazo cruzado (sin caras coplanares: adiós parpadeo) */}
        <mesh position={[0, 0.2, 0]} castShadow>
          <boxGeometry args={[0.78, 0.07, 0.56]} />
          <meshStandardMaterial color={BOX_COLORS[id]} roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.2, 0]}>
          <boxGeometry args={[0.8, 0.028, 0.58]} />
          <meshStandardMaterial color="#e9d9b8" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.245, 0]}>
          <boxGeometry args={[0.82, 0.035, 0.09]} />
          <meshStandardMaterial color="#8a4049" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.245, 0]}>
          <boxGeometry args={[0.09, 0.035, 0.6]} />
          <meshStandardMaterial color="#8a4049" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.275, 0]} castShadow>
          <sphereGeometry args={[0.045, 8, 6]} />
          <meshStandardMaterial color="#8a4049" roughness={0.6} />
        </mesh>
      </group>
      {hover && (
        <Html position={[0, 0.85, 0]} center style={{ pointerEvents: "none" }}>
          <div className={`sign px-2 py-0.5 text-[10px] whitespace-nowrap ${enTemporada ? "sign-active" : ""}`}>
            {caja.nombre} · {eur(precioCaja(caja))}{!enTemporada && " (+15%)"}
          </div>
        </Html>
      )}
    </group>
  );
}

export default function SeasonBoxes({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <BoxMesh id="caja-general" x={0} z={0.25} />
      <BoxMesh id="caja-primavera" x={-1.7} z={-0.2} />
      <BoxMesh id="caja-verano" x={-0.85} z={-0.35} />
      <BoxMesh id="caja-otono" x={0.85} z={-0.35} />
      <BoxMesh id="caja-invierno" x={1.7} z={-0.2} />
    </group>
  );
}
