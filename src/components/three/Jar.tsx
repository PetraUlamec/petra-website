"use client";
// El tarro v2: cristal con brillo, hojas de té dentro, tapa de madera con pomo, etiqueta de papel
// con el NOMBRE escrito (drei Text). hover → la tapa se levanta · clic → la escena acerca la cámara.
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html, Text } from "@react-three/drei";
import { useRef, useState } from "react";
import { easing } from "maath";
import { useQuality } from "@/lib/quality";
import type { Tea } from "@/lib/types";

/** Desplazamiento del tarro "cogido": hacia la cámara isométrica y un pelín arriba */
export const PICK_OFFSET: [number, number, number] = [0.85, 0.1, 0.85];

export default function Jar({
  tea, position, focused, dimmed, onSelect,
}: {
  tea: Tea;
  position: [number, number, number];
  focused: boolean;
  dimmed: boolean;
  onSelect: () => void;
}) {
  const [hover, setHover] = useState(false);
  const lid = useRef<THREE.Group>(null);
  const root = useRef<THREE.Group>(null);
  const open = hover || focused;
  const hq = useQuality() === "high";

  useFrame(({ clock }, dt) => {
    if (root.current) {
      // el tarro enfocado sale de la balda hacia la luz; al cerrar, vuelve a su sitio
      const target: [number, number, number] = focused
        ? [position[0] + PICK_OFFSET[0], position[1] + PICK_OFFSET[1], position[2] + PICK_OFFSET[2]]
        : position;
      easing.damp3(root.current.position, target, 0.22, dt);
      easing.damp(root.current.rotation, "y", focused ? 0.4 : 0, 0.25, dt);
      // inclinado hacia el espectador (eje diagonal de la cámara isométrica)
      easing.damp(root.current.rotation, "x", focused ? 0.32 : 0, 0.25, dt);
      easing.damp(root.current.rotation, "z", focused ? -0.32 : 0, 0.25, dt);
    }
    if (!lid.current) return;
    const k = Math.min(1, dt * 7);
    const targetY = focused ? 0.52 : open ? 0.4 : 0.2;
    const targetR = focused ? 0.65 : open ? 0.4 : 0;
    lid.current.position.y += (targetY - lid.current.position.y) * k;
    lid.current.rotation.z += (targetR - lid.current.rotation.z) * k;
    if (open) lid.current.position.y += Math.sin(clock.elapsedTime * 2.2) * 0.004; // respira
  });

  const opacity = dimmed ? 0.22 : 1;

  return (
    <group ref={root} position={position} name={`jar-${tea.id}`}>
      <group
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
        onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { setHover(false); document.body.style.cursor = "auto"; }}
      >
        {/* zona de toque generosa */}
        <mesh position={[0, 0.24, 0]} visible={false}>
          <cylinderGeometry args={[0.24, 0.24, 0.55, 8]} />
        </mesh>
        {/* Cristal satinado: conserva transparencia sin producir halos azulados de bloom. */}
        <mesh castShadow position={[0, 0.2, 0]}>
          <cylinderGeometry args={[0.165, 0.15, 0.34, 20]} />
          <meshPhysicalMaterial
            color="#eadfcd" roughness={0.34} metalness={0} transmission={hq ? (focused ? 0.16 : 0.22) : 0}
            thickness={0.32} ior={1.36} envMapIntensity={focused ? 0.42 : 0.28} transparent
            clearcoat={0.18} clearcoatRoughness={0.58}
            iridescence={0}
            opacity={hq ? Math.min(focused ? 0.9 : 0.84, opacity) : Math.min(0.58, opacity)}
          />
        </mesh>
        <mesh castShadow position={[0, 0.39, 0]}>
          <cylinderGeometry args={[0.12, 0.165, 0.06, 20]} />
          <meshPhysicalMaterial
            color="#eadfcd" roughness={0.36} transmission={hq ? 0.2 : 0} thickness={0.28}
            envMapIntensity={0.26} clearcoat={0.14} clearcoatRoughness={0.62}
            transparent opacity={hq ? Math.min(0.84, opacity) : Math.min(0.58, opacity)}
          />
        </mesh>
        {/* reflejo pequeño y mate, sin la mancha blanca intensa anterior */}
        <mesh position={[-0.075, 0.24, 0.115]} rotation={[0, 0.7, 0.12]} scale={[0.25, 1, 0.6]}>
          <sphereGeometry args={[0.12, 8, 8]} />
          <meshBasicMaterial color="#fff2de" transparent opacity={0.035 * opacity} depthWrite={false} />
        </mesh>
        {/* hojas dentro, con superficie irregular */}
        <mesh position={[0, 0.14, 0]}>
          <cylinderGeometry args={[0.135, 0.12, 0.2, 16]} />
          <meshStandardMaterial color={tea.colorHoja} roughness={1} transparent opacity={opacity} />
        </mesh>
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[Math.sin(i * 2.4) * 0.06, 0.245, Math.cos(i * 2.4) * 0.06]}>
            <sphereGeometry args={[0.035, 7, 6]} />
            <meshStandardMaterial color={tea.colorHoja} roughness={1} transparent opacity={opacity} />
          </mesh>
        ))}
        {/* boca con corcho */}
        <group ref={lid} position={[0, 0.2, 0]}>
          <mesh castShadow position={[0, 0.235, 0]}>
            <cylinderGeometry args={[0.125, 0.125, 0.05, 16]} />
            <meshStandardMaterial color="#d3b078" roughness={1} transparent opacity={opacity} />
          </mesh>
          {[0, 1, 2, 3].map((i) => (
            <mesh key={`poro${i}`} position={[Math.sin(i * 2.2) * 0.07, 0.262, Math.cos(i * 2.2) * 0.07]}>
              <sphereGeometry args={[0.006, 5, 4]} />
              <meshStandardMaterial color="#a8875a" roughness={1} transparent opacity={opacity} />
            </mesh>
          ))}
          <mesh castShadow position={[0, 0.275, 0]}>
            <cylinderGeometry args={[0.155, 0.155, 0.045, 18]} />
            <meshStandardMaterial color="#6b4527" roughness={0.55} transparent opacity={opacity} />
          </mesh>
          <mesh position={[0, 0.315, 0]}>
            <sphereGeometry args={[0.038, 10, 8]} />
            <meshStandardMaterial color="#4a2f1a" roughness={0.5} transparent opacity={opacity} />
          </mesh>
        </group>
        {/* etiqueta de papel con el nombre, atada con cordel */}
        <group position={[0, 0.19, 0.162]}>
          <mesh>
            <boxGeometry args={[0.21, 0.14, 0.012]} />
            <meshStandardMaterial color="#fdf6e0" roughness={1} transparent opacity={opacity} />
          </mesh>
          <mesh position={[0, 0.075, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.004, 0.004, 0.22, 5]} />
            <meshStandardMaterial color="#a8763d" roughness={1} transparent opacity={opacity} />
          </mesh>
          <mesh position={[0.09, -0.06, 0.004]} rotation={[0, 0, 0.5]}>
            <planeGeometry args={[0.035, 0.035]} />
            <meshStandardMaterial color="#efe4c8" roughness={1} transparent opacity={opacity} />
          </mesh>
          <Text
            font="/fonts/karla-latin-700-normal.woff"
            position={[0, 0.008, 0.012]}
            fontSize={0.03}
            maxWidth={0.19}
            textAlign="center"
            color="#3a2513"
            anchorX="center"
            anchorY="middle"
            fillOpacity={opacity}
          >
            {tea.nombre}
          </Text>
        </group>
      </group>
      {hover && !focused && (
        <Html position={[0, 0.82, 0]} center occlude style={{ pointerEvents: "none" }}>
          <div className="sign px-2 py-1 text-xs whitespace-nowrap font-display">{tea.nombre}</div>
        </Html>
      )}
    </group>
  );
}
