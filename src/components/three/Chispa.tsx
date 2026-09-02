"use client";
// LA CHISPA: destellos dorados junto a las fuentes de luz + la polilla que revolotea la lámpara.
import * as THREE from "three";
import { Sparkles } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";

/** Destellos dorados suaves (envuelven ventanas, velas, arañas) */
export function Chispas({
  position, scale = [2.2, 2.2, 1.2] as [number, number, number], count = 24, color = "#ffd98a",
}: { position: [number, number, number]; scale?: [number, number, number]; count?: number; color?: string }) {
  return (
    <Sparkles
      position={position}
      count={count}
      scale={scale}
      size={3.2}
      speed={0.28}
      opacity={0.75}
      color={color}
      noise={0.6}
    />
  );
}

/** Polilla dorada: revolotea en lissajous alrededor de un punto de luz. */
export function Polilla({ position, radio = 0.5 }: { position: [number, number, number]; radio?: number }) {
  const g = useRef<THREE.Group>(null);
  const alaL = useRef<THREE.Mesh>(null);
  const alaR = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (g.current) {
      g.current.position.set(
        position[0] + Math.sin(t * 1.3) * radio,
        position[1] + Math.sin(t * 2.1) * radio * 0.4,
        position[2] + Math.cos(t * 1.7) * radio
      );
      g.current.rotation.y = Math.atan2(Math.cos(t * 1.3) * 1.3, -Math.sin(t * 1.7) * 1.7);
    }
    const flap = Math.sin(t * 26) * 0.9;
    if (alaL.current) alaL.current.rotation.z = 0.4 + flap * 0.5;
    if (alaR.current) alaR.current.rotation.z = -0.4 - flap * 0.5;
  });
  return (
    <group ref={g}>
      <mesh castShadow>
        <capsuleGeometry args={[0.016, 0.05, 4, 6]} />
        <meshStandardMaterial color="#8a6a3f" roughness={0.8} />
      </mesh>
      <mesh ref={alaL} position={[0.02, 0.01, 0]}>
        <planeGeometry args={[0.09, 0.06]} />
        <meshStandardMaterial color="#ffd98a" emissive="#c9932f" emissiveIntensity={0.7} side={THREE.DoubleSide} transparent opacity={0.9} />
      </mesh>
      <mesh ref={alaR} position={[-0.02, 0.01, 0]}>
        <planeGeometry args={[0.09, 0.06]} />
        <meshStandardMaterial color="#ffd98a" emissive="#c9932f" emissiveIntensity={0.7} side={THREE.DoubleSide} transparent opacity={0.9} />
      </mesh>
    </group>
  );
}
