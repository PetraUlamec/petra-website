"use client";
// La cesta v2: mimbre tejido de verdad (varillas verticales + aros trenzados), asa de rama
// y dentro se ven mini-tarros según lo que lleves. Clic → página del carrito (VISION §11.6).
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { useRef, useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { enEditor } from "@/lib/editor";
import { useCart, cartCount } from "@/lib/cart";

export const BASKET_POS: [number, number, number] = [3.4, 0, 3.2];

export default function Basket({ position = BASKET_POS }: { position?: [number, number, number] }) {
  const router = useRouter();
  const [hover, setHover] = useState(false);
  const lines = useCart((s) => s.lines);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const n = mounted ? cartCount(lines) : 0;
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (g.current) g.current.scale.setScalar(hover ? 1.06 : 1 + Math.sin(clock.elapsedTime * 1.4) * 0.006);
  });

  const stakes = useMemo(() => Array.from({ length: 16 }, (_, i) => (i / 16) * Math.PI * 2), []);

  return (
    <group position={position} name="cesta">
      <group
        ref={g}
        onClick={(e) => { e.stopPropagation(); if (enEditor()) return; router.push("/carrito"); }}
        onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { setHover(false); document.body.style.cursor = "auto"; }}
      >
        {/* base */}
        <mesh position={[0, 0.03, 0]} receiveShadow castShadow>
          <cylinderGeometry args={[0.32, 0.28, 0.06, 20]} />
          <meshStandardMaterial color="#9a7040" roughness={0.95} />
        </mesh>
        {/* varillas verticales, ligeramente abiertas */}
        {stakes.map((a, i) => (
          <mesh key={i}
            position={[Math.cos(a) * 0.335, 0.21, Math.sin(a) * 0.335]}
            rotation={[Math.sin(a) * 0.16, 0, -Math.cos(a) * 0.16]} castShadow>
            <cylinderGeometry args={[0.016, 0.02, 0.36, 6]} />
            <meshStandardMaterial color={i % 2 ? "#a8763d" : "#8a5f38"} roughness={0.95} />
          </mesh>
        ))}
        {/* aros del tejido */}
        {[0.08, 0.15, 0.22, 0.29, 0.36].map((y, i) => (
          <mesh key={i} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <torusGeometry args={[0.325 + i * 0.012, 0.02, 7, 26]} />
            <meshStandardMaterial color={i % 2 ? "#c19056" : "#a8763d"} roughness={0.95} />
          </mesh>
        ))}
        {/* borde trenzado */}
        <mesh position={[0, 0.4, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[0.385, 0.032, 8, 28]} />
          <meshStandardMaterial color="#8a5f38" roughness={0.9} />
        </mesh>
        {/* asa */}
        <mesh position={[0, 0.42, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
          <torusGeometry args={[0.3, 0.028, 8, 22, Math.PI]} />
          <meshStandardMaterial color="#6b4527" roughness={0.85} />
        </mesh>
        {/* paño de lino asomando */}
        <mesh position={[0.14, 0.38, -0.1]} rotation={[0.4, 0.5, 0.2]} castShadow>
          <boxGeometry args={[0.22, 0.03, 0.18]} />
          <meshStandardMaterial color="#f3e4c4" roughness={1} />
        </mesh>
        {/* mini-tarros dentro según la cesta (hasta 3 visibles) */}
        {Array.from({ length: Math.min(n, 3) }).map((_, i) => (
          <group key={i} position={[Math.sin(i * 2.3) * 0.11, 0.27, Math.cos(i * 2.3) * 0.11]} scale={0.85}>
            <mesh castShadow>
              <cylinderGeometry args={[0.075, 0.07, 0.16, 12]} />
              <meshPhysicalMaterial color="#eaf6ef" roughness={0.1} transmission={0.5} transparent opacity={0.85} />
            </mesh>
            <mesh position={[0, 0.09, 0]}>
              <cylinderGeometry args={[0.08, 0.08, 0.03, 12]} />
              <meshStandardMaterial color="#6b4527" roughness={0.6} />
            </mesh>
            <mesh position={[0, -0.01, 0]}>
              <cylinderGeometry args={[0.062, 0.058, 0.1, 10]} />
              <meshStandardMaterial color={["#C9B36A", "#9DB56B", "#B4713C"][i]} roughness={1} />
            </mesh>
          </group>
        ))}
      </group>
      <Html position={[0, 1.08, 0]} center occlude style={{ pointerEvents: "none" }}>
        <div className={`sign px-2 py-0.5 text-[11px] whitespace-nowrap ${hover ? "sign-active" : ""}`}>
          Cesta{n > 0 ? ` · ${n}` : ""}
        </div>
      </Html>
    </group>
  );
}
