"use client";
// Anillo dorado pulsante: señala en el suelo lo que se puede tocar (UX: que nadie se pierda).
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";

export default function Hotspot({ position, visible }: { position: [number, number, number]; visible: boolean }) {
  const m = useRef<THREE.MeshBasicMaterial>(null);
  const g = useRef<THREE.Mesh>(null);
  useFrame(({ clock }, dt) => {
    if (!m.current || !g.current) return;
    const pulse = (Math.sin(clock.elapsedTime * 2.6) + 1) / 2;
    const target = visible ? 0.15 + pulse * 0.4 : 0;
    m.current.opacity += (target - m.current.opacity) * Math.min(1, dt * 6);
    g.current.scale.setScalar(1 + pulse * 0.12);
  });
  return (
    <mesh ref={g} position={position} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
      <ringGeometry args={[0.3, 0.4, 28]} />
      <meshBasicMaterial ref={m} color="#ffd98a" transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

/** Lógica de visibilidad compartida: visibles 6s al entrar y tras 10s de quietud. */
import { useEffect, useState } from "react";
export function useHotspots() {
  const [on, setOn] = useState(true);
  useEffect(() => {
    let idle: ReturnType<typeof setTimeout>;
    const t0 = setTimeout(() => setOn(false), 6000);
    const wake = () => {
      setOn(false);
      clearTimeout(idle);
      idle = setTimeout(() => setOn(true), 10000);
    };
    window.addEventListener("pointerdown", wake);
    return () => { clearTimeout(t0); clearTimeout(idle); window.removeEventListener("pointerdown", wake); };
  }, []);
  return on;
}
