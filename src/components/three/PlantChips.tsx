"use client";
// Al abrir un tarro, SUS plantas brotan y quedan flotando en corcho, cada una con su forma real.
// hover/clic → la escena cuenta POR QUÉ ayuda EN ESTE MIX (VISION §3.3).
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { useRef, useState } from "react";
import type { Tea } from "@/lib/types";
import { plantById } from "@/data/plants";
import PlantSprig from "./PlantSprig";

function FloatingPlant({
  center, angle, radius, plantId, selected, onPick, delay,
}: {
  center: [number, number, number]; angle: number; radius: number;
  plantId: string; selected: boolean; onPick: () => void; delay: number;
}) {
  const plant = plantById(plantId);
  const g = useRef<THREE.Group>(null);
  const born = useRef<number | null>(null);
  const [hover, setHover] = useState(false);
  useFrame(({ clock }) => {
    if (!g.current) return;
    if (born.current === null) born.current = clock.elapsedTime;
    const t = Math.min(1, Math.max(0, (clock.elapsedTime - born.current - delay) * 2.2));
    const e = 1 - Math.pow(1 - t, 3);
    const bob = Math.sin(clock.elapsedTime * 1.5 + angle * 3) * 0.045;
    g.current.position.set(
      center[0] + Math.cos(angle) * radius * e,
      center[1] + 0.42 + 0.42 * e + bob,
      center[2] + Math.sin(angle) * radius * e
    );
    g.current.scale.setScalar(0.001 + e * 1.45 * (hover || selected ? 1.18 : 1));
    g.current.rotation.y = angle + Math.sin(clock.elapsedTime * 0.4) * 0.15;
  });
  return (
    <group ref={g}>
      {/* peana de corcho flotante */}
      <group
        onClick={(ev) => { ev.stopPropagation(); onPick(); }}
        onPointerOver={(ev) => { ev.stopPropagation(); setHover(true); onPick(); document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { setHover(false); document.body.style.cursor = "auto"; }}
      >
        <mesh castShadow>
          <cylinderGeometry args={[0.14, 0.12, 0.05, 16]} />
          <meshStandardMaterial color={selected ? "#d9b45b" : "#c8a165"} roughness={0.95} />
        </mesh>
        <mesh position={[0, -0.032, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.17, 18]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.16} depthWrite={false} />
        </mesh>
        {/* halo suave al elegirla */}
        {selected && (
          <mesh position={[0, -0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.15, 0.2, 24]} />
            <meshBasicMaterial color="#ffd98a" transparent opacity={0.75} side={2} />
          </mesh>
        )}
        {/* zona de toque generosa e invisible */}
        <mesh position={[0, 0.18, 0]} visible={false}>
          <cylinderGeometry args={[0.2, 0.2, 0.45, 8]} />
        </mesh>
        <group position={[0, 0.025, 0]}>
          <PlantSprig plant={plant} scale={1.15} />
        </group>
      </group>
      <Html position={[0, 0.56, 0]} center style={{ pointerEvents: "none" }}>
        <div className={`px-1.5 py-0.5 rounded text-[10px] whitespace-nowrap border shadow-sm ${selected ? "bg-[var(--miel-clara)] border-[var(--madera)] font-bold" : "bg-[var(--crema)]/95 border-[var(--madera)]/40"}`}>
          {plant.nombre}
        </div>
      </Html>
    </group>
  );
}

export default function PlantChips({
  tea, jarPos, selectedPlantId, onPick,
}: {
  tea: Tea; jarPos: [number, number, number]; selectedPlantId: string | null; onPick: (id: string) => void;
}) {
  const n = tea.plantas.length;
  // B5: si el tarro está contra la pared/mueble (z bajo), las plantas brotan en ARCO ABIERTO
  // hacia la cámara isométrica (dirección +x,+z = π/4), nunca dentro de la madera.
  const nearWall = jarPos[2] < -3.4 || jarPos[0] < -4.2;
  const toCam = Math.PI / 4;
  const span = Math.PI * 0.85; // 153° de abanico frontal
  const center: [number, number, number] = nearWall
    ? [jarPos[0] + Math.cos(toCam) * 0.35, jarPos[1], jarPos[2] + Math.sin(toCam) * 0.35]
    : jarPos;
  return (
    <group>
      {tea.plantas.map((tp, i) => {
        const angle = nearWall
          ? toCam - span / 2 + (n === 1 ? span / 2 : (i / (n - 1)) * span)
          : (i / n) * Math.PI * 2 - Math.PI / 2 + Math.PI / n;
        return (
          <FloatingPlant
            key={tp.plantaId}
            center={center}
            angle={angle}
            radius={nearWall ? 1.2 : 0.95}
            plantId={tp.plantaId}
            selected={selectedPlantId === tp.plantaId}
            onPick={() => onPick(tp.plantaId)}
            delay={i * 0.1}
          />
        );
      })}
    </group>
  );
}
