"use client";
// El ATREZZO que hace única cada habitación: velas, pedestales, butacas, manojos secándose,
// farol, gato dormido, sacos, quesos, chorizos, libros, lámpara de escritorio, balanza…
import * as THREE from "three";
import { WoodMat, MetalMat } from "./Mats";
import { useFrame } from "@react-three/fiber";
import { useRef, useMemo } from "react";
import { WOOD } from "./Room";

/* ── Vela de pared (premium) ─────────────────────────────── */
export function Sconce({ position, rotY = 0, withLight = false }: { position: [number, number, number]; rotY?: number; withLight?: boolean }) {
  const flame = useRef<THREE.Mesh>(null);
  const light = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    const f = 1 + Math.sin(clock.elapsedTime * 9 + position[0] * 7) * 0.15 + Math.sin(clock.elapsedTime * 23) * 0.06;
    if (flame.current) flame.current.scale.set(f * 0.9, f * 1.25, f * 0.9);
    if (light.current) light.current.intensity = 3.2 * f;
  });
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <mesh castShadow>
        <boxGeometry args={[0.16, 0.5, 0.05]} />
        <meshStandardMaterial color="#4a2f1a" roughness={0.7} />
      </mesh>
      <mesh position={[0, -0.1, 0.12]} castShadow>
        <cylinderGeometry args={[0.05, 0.065, 0.05, 10]} />
        <MetalMat tone="#b08d57" />
      </mesh>
      <mesh position={[0, 0.02, 0.12]} castShadow>
        <cylinderGeometry args={[0.028, 0.032, 0.2, 10]} />
        <meshStandardMaterial color="#f6ecd4" roughness={0.8} />
      </mesh>
      <mesh ref={flame} position={[0, 0.17, 0.12]}>
        <sphereGeometry args={[0.028, 8, 8]} />
        <meshStandardMaterial color="#ffca5f" emissive="#ff9a1f" emissiveIntensity={3.2} />
      </mesh>
      {withLight && <pointLight ref={light} position={[0, 0.22, 0.16]} distance={4.5} color="#ffb46b" intensity={3.2} />}
    </group>
  );
}

/* ── Pedestal del té premium ─────────────────────────────── */
export function Pedestal({ position, h = 1.15 }: { position: [number, number, number]; h?: number }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.06, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.34, 0.38, 0.12, 18]} />
        <WoodMat tone="#4e3119" />
      </mesh>
      <mesh position={[0, h / 2, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.22, h - 0.24, 14]} />
        <WoodMat tone="#5e3d24" />
      </mesh>
      <mesh position={[0, h - 0.05, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.3, 0.24, 0.1, 18]} />
        <WoodMat tone="#6b4527" />
      </mesh>
      {/* filo dorado */}
      <mesh position={[0, h - 0.005, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.285, 0.012, 6, 24]} />
        <meshStandardMaterial color="#d9b45b" metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
}

/* ── Butaca del salón ────────────────────────────────────── */
export function Armchair({ position, rotY = 0, color = "#8a5b45" }: { position: [number, number, number]; rotY?: number; color?: string }) {
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.85, 0.24, 0.8]} />
        <meshStandardMaterial color={color} roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.75, -0.34]} rotation={[-0.12, 0, 0]} castShadow>
        <boxGeometry args={[0.85, 0.75, 0.16]} />
        <meshStandardMaterial color={color} roughness={0.95} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.43, 0.58, 0]} castShadow>
          <boxGeometry args={[0.14, 0.4, 0.75]} />
          <meshStandardMaterial color={color} roughness={0.95} />
        </mesh>
      ))}
      <mesh position={[0, 0.56, 0.02]} castShadow>
        <boxGeometry args={[0.66, 0.1, 0.6]} />
        <meshStandardMaterial color="#e9cf9e" roughness={1} />
      </mesh>
      {([[-1, -1], [1, -1], [-1, 1], [1, 1]] as const).map(([sx, sz], i) => (
        <mesh key={i} position={[sx * 0.36, 0.14, sz * 0.32]} castShadow>
          <cylinderGeometry args={[0.035, 0.045, 0.28, 8]} />
          <meshStandardMaterial color={WOOD.marco} roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

/* ── Manojos de hierbas colgados (taller de Petra) ───────── */
export function HangingHerbs({ position, width = 3 }: { position: [number, number, number]; width?: number }) {
  const bunches = useMemo(() => Array.from({ length: 6 }, (_, i) => ({
    x: -width / 2 + 0.3 + (i * (width - 0.6)) / 5,
    hue: ["#6f8f5a", "#8fa382", "#b9a0c9", "#9db76a", "#8a9b6e", "#c7402e"][i],
    len: 0.28 + (i % 3) * 0.05,
  })), [width]);
  return (
    <group position={position}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.012, 0.012, width, 6]} />
        <meshStandardMaterial color="#4a2f1a" roughness={0.9} />
      </mesh>
      {bunches.map((b, i) => (
        <group key={i} position={[b.x, -0.05, 0]}>
          <mesh position={[0, -0.03, 0]}>
            <cylinderGeometry args={[0.008, 0.008, 0.07, 5]} />
            <meshStandardMaterial color="#c8a165" roughness={1} />
          </mesh>
          <mesh position={[0, -b.len / 2 - 0.06, 0]} castShadow>
            <coneGeometry args={[0.09, b.len, 7]} />
            <meshStandardMaterial color={b.hue} roughness={0.95} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ── Farol de la entrada ─────────────────────────────────── */
export function Lantern({ position }: { position: [number, number, number] }) {
  const light = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    if (light.current) light.current.intensity = 5 + Math.sin(clock.elapsedTime * 6) * 0.7;
  });
  return (
    <group position={position}>
      <mesh position={[0, 1.1, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.05, 2.2, 8]} />
        <meshStandardMaterial color="#3a2a1a" roughness={0.6} metalness={0.3} />
      </mesh>
      {/* jaula del farol: 4 postes finos y cristal cálido a la vista */}
      {([[-1, -1], [1, -1], [-1, 1], [1, 1]] as const).map(([px, pz], i) => (
        <mesh key={i} position={[px * 0.11, 2.28, pz * 0.11]} castShadow>
          <boxGeometry args={[0.03, 0.34, 0.03]} />
          <meshStandardMaterial color="#3a2a1a" roughness={0.5} metalness={0.4} />
        </mesh>
      ))}
      <mesh position={[0, 2.28, 0]}>
        <boxGeometry args={[0.19, 0.3, 0.19]} />
        <meshStandardMaterial color="#ffdf9e" emissive="#ffc25f" emissiveIntensity={2.6} transparent opacity={0.92} />
      </mesh>
      <mesh position={[0, 2.5, 0]} castShadow>
        <coneGeometry args={[0.22, 0.16, 4]} />
        <meshStandardMaterial color="#2e2013" roughness={0.6} />
      </mesh>
      <pointLight ref={light} position={[0, 2.28, 0]} distance={6} color="#ffc97a" intensity={5} />
    </group>
  );
}

/* ── Gato dormido (la firma de la entrada) ───────────────── */
export function SleepingCat({ position, rotY = 0 }: { position: [number, number, number]; rotY?: number }) {
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (g.current) g.current.scale.y = 1 + Math.sin(clock.elapsedTime * 1.1) * 0.03; // respira
  });
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <group ref={g}>
        <mesh castShadow scale={[1.3, 0.75, 1]}>
          <sphereGeometry args={[0.16, 12, 10]} />
          <meshStandardMaterial color="#c98f56" roughness={0.95} />
        </mesh>
        <mesh position={[0.14, 0.05, 0.05]} castShadow scale={[1, 0.9, 0.95]}>
          <sphereGeometry args={[0.09, 10, 8]} />
          <meshStandardMaterial color="#c98f56" roughness={0.95} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[0.17 + s * 0.035, 0.14, 0.05]} rotation={[0, 0, s * 0.3]} castShadow>
            <coneGeometry args={[0.028, 0.055, 4]} />
            <meshStandardMaterial color="#b57c46" roughness={0.95} />
          </mesh>
        ))}
        <mesh position={[-0.1, 0.02, 0.12]} rotation={[0, 0.8, 0]} castShadow>
          <torusGeometry args={[0.1, 0.028, 6, 14, Math.PI * 1.4]} />
          <meshStandardMaterial color="#b57c46" roughness={0.95} />
        </mesh>
      </group>
    </group>
  );
}

/* ── Despensa: saco, queso, ristra ───────────────────────── */
export function Sack({ position, color = "#cbb083" }: { position: [number, number, number]; color?: string }) {
  return (
    <group position={position}>
      <mesh castShadow scale={[1, 1.1, 1]}>
        <sphereGeometry args={[0.28, 12, 10]} />
        <meshStandardMaterial color={color} roughness={1} />
      </mesh>
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.13, 0.14, 8]} />
        <meshStandardMaterial color={color} roughness={1} />
      </mesh>
      <mesh position={[0, 0.31, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.1, 0.015, 5, 10]} />
        <meshStandardMaterial color="#8a5f38" roughness={1} />
      </mesh>
    </group>
  );
}

export function CheeseWheel({ position, r = 0.2 }: { position: [number, number, number]; r?: number }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <cylinderGeometry args={[r, r, r * 0.55, 18]} />
        <meshStandardMaterial color="#e8c25a" roughness={0.85} />
      </mesh>
      {/* cuña cortada */}
      <mesh position={[r * 0.55, 0, r * 0.35]} rotation={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[r * 0.5, r * 0.55, r * 0.5]} />
        <meshStandardMaterial color="#f6dd8a" roughness={0.9} />
      </mesh>
    </group>
  );
}

export function SausageString({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh>
        <cylinderGeometry args={[0.006, 0.006, 0.25, 5]} />
        <meshStandardMaterial color="#c8a165" roughness={1} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[Math.sin(i * 2.1) * 0.03, -0.22 - i * 0.14, 0]} rotation={[0.15 * i, 0, 0.2]} castShadow>
          <capsuleGeometry args={[0.045, 0.12, 4, 8]} />
          <meshStandardMaterial color="#8a3030" roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

export function HoneyPot({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow scale={[1, 0.85, 1]}>
        <sphereGeometry args={[0.11, 12, 10]} />
        <meshStandardMaterial color="#d9a44c" roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.1, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.075, 0.05, 10]} />
        <meshStandardMaterial color="#f3e4c4" roughness={0.9} />
      </mesh>
    </group>
  );
}

/* ── Escritorio: lámpara, libros, reloj ──────────────────── */
export function DeskLamp({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <cylinderGeometry args={[0.09, 0.11, 0.03, 12]} />
        <MetalMat tone="#b08d57" />
      </mesh>
      <mesh position={[0.03, 0.15, 0]} rotation={[0, 0, -0.25]} castShadow>
        <cylinderGeometry args={[0.012, 0.012, 0.3, 6]} />
        <MetalMat tone="#b08d57" />
      </mesh>
      <mesh position={[0.1, 0.3, 0]} rotation={[0, 0, 0.9]} castShadow>
        <cylinderGeometry args={[0.075, 0.11, 0.12, 12, 1, true]} />
        <meshStandardMaterial color="#54654a" roughness={0.4} side={2} />
      </mesh>
      <mesh position={[0.12, 0.27, 0]}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshStandardMaterial color="#ffe9b0" emissive="#ffd06f" emissiveIntensity={2} />
      </mesh>
      <pointLight position={[0.15, 0.22, 0]} distance={2.5} color="#ffe0a0" intensity={2.5} />
    </group>
  );
}

export function BookRow({
  position,
  n = 7,
  rotY = 0,
  antique = false,
}: {
  position: [number, number, number];
  n?: number;
  rotY?: number;
  antique?: boolean;
}) {
  const antiqueColors = ["#51301f", "#6b4527", "#8a7350", "#d1bc91", "#46513a", "#713b3b", "#3d2c22", "#977046"];
  const regularColors = ["#8a4049", "#54654a", "#b06a3d", "#4a5a7a", "#6b4527", "#7c8a5a", "#a8593f"];
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      {Array.from({ length: n }).map((_, i) => {
        const spacing = antique ? 0.104 : 0.09;
        const width = antique ? 0.078 + (i % 4) * 0.006 : 0.07;
        const height = antique ? 0.43 + ((i * 7) % 5) * 0.025 : 0.28 - (i % 3) * 0.03;
        const depth = antique ? 0.23 : 0.2;
        const lean = antique
          ? i % 13 === 11 ? -0.1 : i % 17 === 8 ? 0.08 : 0
          : i === n - 1 ? -0.18 : 0;
        return (
          <group
            key={i}
            position={[(i - (n - 1) / 2) * spacing, height / 2, 0]}
            rotation={[0, 0, lean]}
          >
            <mesh castShadow>
              <boxGeometry args={[width, height, depth]} />
              <meshStandardMaterial
                color={(antique ? antiqueColors : regularColors)[i % (antique ? antiqueColors.length : regularColors.length)]}
                roughness={antique ? 0.88 : 0.85}
              />
            </mesh>
            {/* nervios y etiqueta envejecida del lomo */}
            {antique && [-0.35, 0.35].map((s) => (
              <mesh key={s} position={[0, s * height, 0.118]}>
                <boxGeometry args={[width * 0.84, 0.014, 0.009]} />
                <meshStandardMaterial color={i % 3 === 0 ? "#c5a262" : "#aa8954"} roughness={0.72} />
              </mesh>
            ))}
            {antique && i % 4 === 0 && (
              <mesh position={[0, 0.015, 0.119]}>
                <boxGeometry args={[width * 0.68, height * 0.2, 0.009]} />
                <meshStandardMaterial color="#ded0ad" roughness={0.95} />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}

export function WallClock({
  position,
  rotY = 0,
  hour = 5,
  minute = 10,
}: {
  position: [number, number, number];
  rotY?: number;
  hour?: number;
  minute?: number;
}) {
  const minuteAngle = (minute / 60) * Math.PI * 2;
  const hourAngle = (((hour % 12) + minute / 60) / 12) * Math.PI * 2;
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.28, 0.28, 0.07, 20]} />
        <meshStandardMaterial color="#4a2f1a" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0, 0.04]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.012, 20]} />
        <meshStandardMaterial color="#f6ecd4" roughness={0.9} />
      </mesh>
      {/* Doce marcas separadas y cortas: ninguna se confunde con una manecilla. */}
      {Array.from({ length: 12 }, (_, i) => {
        const angle = (i * Math.PI) / 6;
        const cardinal = i % 3 === 0;
        return (
          <mesh
            key={`contact-clock-mark-${i}`}
            position={[Math.sin(angle) * 0.18, Math.cos(angle) * 0.18, 0.058]}
            rotation={[0, 0, -angle]}
          >
            <boxGeometry args={[cardinal ? 0.016 : 0.01, cardinal ? 0.032 : 0.024, 0.011]} />
            <meshStandardMaterial color="#352417" roughness={0.65} />
          </mesh>
        );
      })}
      {/* Sólo dos manecillas, fijas a las 5:10 p. m. */}
      <group position={[0, 0, 0.069]} rotation={[0, 0, -hourAngle]}>
        <mesh position={[0, 0.058, 0]}>
          <boxGeometry args={[0.028, 0.116, 0.014]} />
          <meshStandardMaterial color="#24170f" roughness={0.48} />
        </mesh>
      </group>
      <group position={[0, 0, 0.073]} rotation={[0, 0, -minuteAngle]}>
        <mesh position={[0, 0.082, 0]}>
          <boxGeometry args={[0.019, 0.164, 0.012]} />
          <meshStandardMaterial color="#24170f" roughness={0.48} />
        </mesh>
      </group>
      <mesh position={[0, 0, 0.083]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.028, 0.028, 0.014, 12]} />
        <meshStandardMaterial color="#9b7134" metalness={0.45} roughness={0.38} />
      </mesh>
    </group>
  );
}

/* ── Balanza del mostrador ───────────────────────────────── */
export function Scale({ position }: { position: [number, number, number] }) {
  const arm = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (arm.current) arm.current.rotation.z = Math.sin(clock.elapsedTime * 0.9) * 0.05;
  });
  return (
    <group position={position}>
      <mesh castShadow>
        <cylinderGeometry args={[0.1, 0.13, 0.05, 10]} />
        <MetalMat tone="#b08d57" />
      </mesh>
      <mesh position={[0, 0.16, 0]} castShadow>
        <cylinderGeometry args={[0.015, 0.02, 0.28, 8]} />
        <MetalMat tone="#b08d57" />
      </mesh>
      <group ref={arm} position={[0, 0.3, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.012, 0.012, 0.55, 6]} />
          <MetalMat tone="#b08d57" />
        </mesh>
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 0.26, -0.1, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.09, 0.06, 0.035, 12]} />
              <MetalMat tone="#b08d57" />
            </mesh>
            {[0, 1, 2].map((w) => (
              <mesh key={w} position={[Math.cos(w * 2.1) * 0.05, 0.06, Math.sin(w * 2.1) * 0.05]}>
                <cylinderGeometry args={[0.008, 0.008, 0.12, 4]} />
                <meshStandardMaterial color="#8a7350" roughness={0.8} />
              </mesh>
            ))}
          </group>
        ))}
      </group>
    </group>
  );
}

/* ── Mortero de Petra y herramientas de Erik ─────────────── */
export function Mortar({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <cylinderGeometry args={[0.11, 0.08, 0.12, 14]} />
        <meshStandardMaterial color="#9c9488" roughness={0.9} />
      </mesh>
      <mesh position={[0.1, 0.1, 0]} rotation={[0, 0, -0.9]} castShadow>
        <capsuleGeometry args={[0.025, 0.14, 4, 8]} />
        <meshStandardMaterial color="#8a8074" roughness={0.9} />
      </mesh>
    </group>
  );
}

export function WoodTools({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* gubia y mazo */}
      <mesh position={[0, 0.02, 0]} rotation={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.018, 0.022, 0.22, 8]} />
        <meshStandardMaterial color="#8a5f38" roughness={0.8} />
      </mesh>
      <mesh position={[0.12, 0.02, 0.1]} rotation={[0, -0.4, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.014, 0.014, 0.18, 6]} />
        <meshStandardMaterial color="#c8c0b0" metalness={0.6} roughness={0.3} />
      </mesh>
      <group position={[0.28, 0.05, -0.05]} rotation={[0, 0.9, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.12, 10]} />
          <meshStandardMaterial color="#a8763d" roughness={0.9} />
        </mesh>
        <mesh position={[0, -0.1, 0]} castShadow>
          <cylinderGeometry args={[0.015, 0.015, 0.14, 6]} />
          <meshStandardMaterial color="#8a5f38" roughness={0.9} />
        </mesh>
      </group>
      {/* virutas */}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[-0.1 + i * 0.08, 0.01, 0.14 - (i % 2) * 0.1]} rotation={[Math.PI / 2, 0, i]}>
          <torusGeometry args={[0.03, 0.008, 5, 10, Math.PI * 1.5]} />
          <meshStandardMaterial color="#e0c496" roughness={1} />
        </mesh>
      ))}
    </group>
  );
}
