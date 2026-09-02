"use client";
// LA BIBLIOTECA DE PIEZAS del editor del taller: muebles, luces, la cruz de la casa, frutas…
// Cada pieza declara dónde se apoya (suelo o pared) — el editor coloca, esto pinta.
import { Table, PlantPot, Teapot } from "./Furniture";
import { Sconce, Armchair, ThreeLegStoolProxy, Lantern, HoneyPot, CheeseWheel, Sack } from "./piezasProxy";
import { WoodMat } from "./Mats";

/* Cruz de madera de pared — sobria y digna (la casa es cristiana) */
export function CruzDePared({ position, rotY = 0, escala = 1 }: { position: [number, number, number]; rotY?: number; escala?: number }) {
  return (
    <group position={position} rotation={[0, rotY, 0]} scale={escala}>
      <mesh castShadow>
        <boxGeometry args={[0.07, 0.62, 0.05]} />
        <WoodMat tone="#4a2f1a" />
      </mesh>
      <mesh position={[0, 0.12, 0]} castShadow>
        <boxGeometry args={[0.38, 0.07, 0.05]} />
        <WoodMat tone="#4a2f1a" />
      </mesh>
    </group>
  );
}

/* Vela de mesa exenta */
export function VelaDeMesa({ position, escala = 1 }: { position: [number, number, number]; escala?: number }) {
  return (
    <group position={position} scale={escala}>
      <mesh castShadow>
        <cylinderGeometry args={[0.05, 0.065, 0.04, 10]} />
        <meshStandardMaterial color="#b08d57" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.1, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.034, 0.16, 8]} />
        <meshStandardMaterial color="#f6ecd4" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.2, 0]}>
        <sphereGeometry args={[0.024, 8, 8]} />
        <meshStandardMaterial color="#ffca5f" emissive="#ff9a1f" emissiveIntensity={3} />
      </mesh>
    </group>
  );
}

/* Frutero con naranjas y manzanas */
export function Frutero({ position, escala = 1 }: { position: [number, number, number]; escala?: number }) {
  return (
    <group position={position} scale={escala}>
      <group position={[0, 0.045, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.2, 0.14, 0.09, 12]} />
          <WoodMat tone="#8a5f38" />
        </mesh>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} position={[Math.sin(i * 2.2) * 0.08, 0.1 + (i % 2) * 0.05, Math.cos(i * 2.2) * 0.08]} castShadow>
            <sphereGeometry args={[0.055, 10, 8]} />
            <meshStandardMaterial color={i % 2 ? "#c7402e" : "#e8963e"} roughness={0.55} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
