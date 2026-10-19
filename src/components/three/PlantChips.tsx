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
import { useLang } from "@/i18n";
import { trPlanta } from "@/i18n/catalogo";
import { ingredientPage, ingredientOffset } from "@/lib/ingredientLayout";

function FloatingPlant({
  center, offset, plantId, selected, onPick, delay, showLabel,
}: {
  center: [number, number, number]; offset: [number, number, number];
  plantId: string; selected: boolean; onPick: () => void; delay: number;
  showLabel: boolean;
}) {
  const { lang } = useLang();
  const plant = trPlanta(plantById(plantId), lang);
  const g = useRef<THREE.Group>(null);
  const born = useRef<number | null>(null);
  const [hover, setHover] = useState(false);
  useFrame(({ clock }) => {
    if (!g.current) return;
    if (born.current === null) born.current = clock.elapsedTime;
    const t = Math.min(1, Math.max(0, (clock.elapsedTime - born.current - delay) * 2.2));
    const e = 1 - Math.pow(1 - t, 3);
    const bob = Math.sin(clock.elapsedTime * 1.5 + delay * 3) * 0.015;
    g.current.position.set(
      center[0] + offset[0] * e,
      center[1] + offset[1] * e + bob,
      center[2] + offset[2] * e
    );
    g.current.scale.setScalar(0.001 + e * (hover || selected ? 1.2 : 1.05));
    g.current.rotation.y = Math.PI / 4;
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
      {(showLabel || hover || selected) && <Html position={[0, 0.56, 0]} center style={{ pointerEvents: "none" }}>
        <div className={`px-1.5 py-0.5 rounded text-[10px] whitespace-nowrap border shadow-sm ${selected ? "bg-[var(--miel-clara)] border-[var(--madera)] font-bold" : "bg-[var(--crema)]/95 border-[var(--madera)]/40"}`}>
          {plant.nombre}
        </div>
      </Html>}
    </group>
  );
}

export default function PlantChips({
  tea, jarPos, selectedPlantId, onPick,
}: {
  tea: Tea; jarPos: [number, number, number]; selectedPlantId: string | null; onPick: (id: string) => void;
}) {
  const page = ingredientPage(tea.plantas.findIndex(part => part.plantaId === selectedPlantId), tea.plantas.length);
  const visible = tea.plantas.slice(page.start, page.end);
  return (
    <group>
      {visible.map((tp, index) => {
        return (
          <FloatingPlant
            key={tp.plantaId}
            center={jarPos}
            offset={ingredientOffset(index, visible.length)}
            plantId={tp.plantaId}
            showLabel={false}
            selected={selectedPlantId === tp.plantaId}
            onPick={() => onPick(tp.plantaId)}
            delay={index * 0.06}
          />
        );
      })}
    </group>
  );
}
