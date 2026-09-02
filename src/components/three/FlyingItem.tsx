"use client";
// La animación de añadir al carrito (VISION §3.4): el producto vuela del tarro a la cesta.
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { useUi } from "@/lib/ui";

const NTRAIL = 7;

export default function FlyingItem({ to }: { to: [number, number, number] }) {
  const fly = useUi((s) => s.fly);
  const clearFly = useUi((s) => s.clearFly);
  const ref = useRef<THREE.Mesh>(null);
  const trail = useRef<THREE.Group>(null);
  const t = useRef(0);
  const key = useRef<number | null>(null);

  useFrame((_, dt) => {
    if (!fly || !ref.current) return;
    if (key.current !== fly.key) { key.current = fly.key; t.current = 0; }
    t.current = Math.min(1, t.current + dt * 1.4);
    const e = t.current;
    const from = new THREE.Vector3(...fly.from);
    const dest = new THREE.Vector3(to[0], to[1] + 0.45, to[2]);
    const p = from.clone().lerp(dest, e);
    p.y += Math.sin(e * Math.PI) * 1.6; // arco por el aire
    ref.current.position.copy(p);
    ref.current.scale.setScalar(0.9 - e * 0.55);
    ref.current.visible = true;
    // estela dorada que se queda atrás y se apaga
    if (trail.current) {
      trail.current.children.forEach((m, i) => {
        const tt = Math.max(0, t.current - (i + 1) * 0.06);
        const pp = from.clone().lerp(dest, tt);
        pp.y += Math.sin(tt * Math.PI) * 1.6;
        m.position.copy(pp);
        const mat = (m as THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>).material;
        mat.opacity = tt > 0 ? Math.max(0, 0.5 - (t.current - tt) * 1.4) : 0;
        m.scale.setScalar(0.5 - i * 0.05);
      });
    }
    if (t.current >= 1) { ref.current.visible = false; clearFly(); }
  });

  if (!fly) return null;
  return (
    <group>
      <mesh ref={ref} visible={false}>
        <sphereGeometry args={[0.14, 14, 12]} />
        <meshStandardMaterial color={fly.color} roughness={0.6} emissive={fly.color} emissiveIntensity={0.25} />
      </mesh>
      <group ref={trail}>
        {Array.from({ length: NTRAIL }).map((_, i) => (
          <mesh key={i}>
            <sphereGeometry args={[0.08, 8, 6]} />
            <meshStandardMaterial color="#ffd98a" emissive="#c9932f" emissiveIntensity={1.2} transparent opacity={0} depthWrite={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
