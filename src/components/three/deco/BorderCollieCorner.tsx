"use client";

import * as THREE from "three";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

type P3 = [number, number, number];

const BLACK = "#171614";
const WHITE = "#eee8dc";
const FUR_WHITE = "#f5f0e5";
const BED = "#6f3940";
const BED_EDGE = "#4d292e";
const METAL = "#a69d8f";

function Limb({ a, b, top, bottom, color }: { a: P3; b: P3; top: number; bottom: number; color: string }) {
  const A = new THREE.Vector3(...a);
  const B = new THREE.Vector3(...b);
  const mid = A.clone().add(B).multiplyScalar(0.5);
  const direction = B.clone().sub(A);
  const length = direction.length();
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  return (
    <mesh castShadow position={[mid.x, mid.y, mid.z]} quaternion={quaternion}>
      <cylinderGeometry args={[top, bottom, length, 12]} />
      <meshStandardMaterial color={color} roughness={0.92} />
    </mesh>
  );
}

/** Border collie sentado: silueta anatómica continua y capas de pelaje. */
function BorderCollie({ position }: { position: P3 }) {
  const tail = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (tail.current) tail.current.rotation.y = Math.sin(clock.elapsedTime * 1.7) * 0.055;
    if (head.current) head.current.rotation.y = Math.sin(clock.elapsedTime * 0.72) * 0.025;
  });

  return (
    <group position={position} scale={0.65} rotation={[0, 0.52, 0]}>
      {/* pelvis baja y torso inclinado: postura sentada natural */}
      <mesh castShadow position={[0, 0.62, -0.48]} scale={[0.72, 0.78, 0.82]}>
        <sphereGeometry args={[0.56, 24, 18]} />
        <meshStandardMaterial color="#151515" roughness={0.88} />
      </mesh>
      <mesh castShadow position={[0, 1, -0.08]} rotation={[-0.27, 0, 0]} scale={[0.67, 0.96, 0.84]}>
        <sphereGeometry args={[0.6, 26, 20]} />
        <meshStandardMaterial color={BLACK} roughness={0.86} />
      </mesh>
      <mesh castShadow position={[0, 1.3, 0.28]} scale={[0.63, 0.78, 0.63]}>
        <sphereGeometry args={[0.51, 24, 18]} />
        <meshStandardMaterial color="#171716" roughness={0.9} />
      </mesh>

      {/* collarín y pecho blanco, voluminosos pero integrados al cuerpo */}
      <mesh castShadow position={[0, 1.23, 0.43]} scale={[0.72, 0.86, 0.51]}>
        <sphereGeometry args={[0.46, 22, 18]} />
        <meshStandardMaterial color={FUR_WHITE} roughness={0.96} />
      </mesh>
      <mesh castShadow position={[0, 0.91, 0.54]} scale={[0.63, 1.05, 0.44]}>
        <sphereGeometry args={[0.43, 20, 16]} />
        <meshStandardMaterial color={WHITE} roughness={0.98} />
      </mesh>
      {/* transición continua desde la garganta hasta las patas */}
      <mesh castShadow position={[0, 0.74, 0.56]} scale={[0.5, 0.52, 0.36]}>
        <sphereGeometry args={[0.43, 24, 18]} />
        <meshStandardMaterial color={FUR_WHITE} roughness={0.98} />
      </mesh>
      <mesh castShadow position={[0, 1.47, 0.38]} scale={[0.61, 0.55, 0.54]}>
        <sphereGeometry args={[0.43, 24, 18]} />
        <meshStandardMaterial color={FUR_WHITE} roughness={0.96} />
      </mesh>

      {/* cabeza redonda con máscara clásica de border collie */}
      <group ref={head} position={[0, 0, 0]}>
        <mesh castShadow position={[-0.025, 1.67, 0.5]} scale={[0.66, 0.61, 0.62]}>
          <sphereGeometry args={[0.48, 26, 20]} />
          <meshStandardMaterial color="#131313" roughness={0.82} />
        </mesh>
        {/* franja estrecha de la frente */}
        <mesh castShadow position={[0, 1.78, 0.72]} rotation={[0.04, 0, 0]} scale={[0.18, 0.72, 0.2]}>
          <sphereGeometry args={[0.36, 18, 14]} />
          <meshStandardMaterial color={FUR_WHITE} roughness={0.94} />
        </mesh>
        {/* puente blanco que une la franja con el hocico */}
        <mesh castShadow position={[0, 1.64, 0.79]} scale={[0.22, 0.46, 0.3]}>
          <sphereGeometry args={[0.36, 20, 15]} />
          <meshStandardMaterial color={FUR_WHITE} roughness={0.92} />
        </mesh>
        {/* hocico blanco redondeado, más ancho que el puente */}
        <mesh castShadow position={[0, 1.5, 0.85]} scale={[0.5, 0.34, 0.42]}>
          <sphereGeometry args={[0.4, 24, 18]} />
          <meshStandardMaterial color={FUR_WHITE} roughness={0.92} />
        </mesh>
        {/* nariz corta, ancha y redondeada */}
        <mesh castShadow position={[0, 1.52, 0.99]} scale={[1.16, 0.76, 0.55]}>
          <sphereGeometry args={[0.105, 16, 12]} />
          <meshStandardMaterial color="#171411" roughness={0.42} />
        </mesh>

        {/* orejas semierectas, con pelo exterior y pliegue interior */}
        {[-1, 1].map((s) => (
          <group
            key={`ear-${s}`}
            position={[s === -1 ? -0.23 : 0.27, 2.02, 0.46]}
            rotation={[0.05, 0, s * -0.12]}
          >
            <mesh castShadow scale={[1, 1.15, 0.64]}>
              <coneGeometry args={[0.2, 0.46, 8]} />
              <meshStandardMaterial color="#101010" roughness={0.96} />
            </mesh>
            <mesh position={[0, -0.015, 0.09]} scale={[0.58, 0.68, 0.42]}>
              <coneGeometry args={[0.18, 0.39, 8]} />
              <meshStandardMaterial color="#684942" roughness={0.98} />
            </mesh>
            <mesh castShadow position={[s * 0.065, -0.18, -0.035]} scale={[0.65, 0.9, 0.55]} rotation={[0, 0, s * -0.35]}>
              <sphereGeometry args={[0.13, 14, 10]} />
              <meshStandardMaterial color={BLACK} roughness={0.96} />
            </mesh>
          </group>
        ))}

        {/* ojos marrones, separados y asentados sobre la máscara negra */}
        {[-1, 1].map((s) => (
          <group key={`eye-${s}`} position={[s * 0.18, 1.79, 0.745]}>
            <mesh scale={[1.25, 0.82, 0.55]}>
              <sphereGeometry args={[0.058, 16, 12]} />
              <meshStandardMaterial color="#8b6239" roughness={0.3} />
            </mesh>
            <mesh position={[0, 0, 0.037]}>
              <sphereGeometry args={[0.027, 12, 9]} />
              <meshStandardMaterial color="#090807" roughness={0.2} />
            </mesh>
            <mesh position={[s * -0.009, 0.015, 0.059]}>
              <sphereGeometry args={[0.009, 8, 6]} />
              <meshBasicMaterial color="#fff8de" />
            </mesh>
          </group>
        ))}

        {/* boca cerrada y discreta bajo la nariz */}
        <mesh position={[0, 1.435, 0.945]} scale={[0.78, 0.12, 0.3]}>
          <sphereGeometry args={[0.095, 16, 10]} />
          <meshStandardMaterial color="#241817" roughness={0.78} />
        </mesh>
      </group>

      {/* patas delanteras rectas, con articulaciones y pies separados */}
      {[-0.23, 0.23].map((x) => (
        <group key={`front-leg-${x}`} position={[x, 0, 0]} scale={[0.85, 1, 1]}>
          <mesh castShadow position={[0, 0.94, 0.43]} scale={[0.62, 1.05, 0.66]}>
            <sphereGeometry args={[0.24, 20, 15]} />
            <meshStandardMaterial color={FUR_WHITE} roughness={0.97} />
          </mesh>
          <Limb a={[0, 0.93, 0.43]} b={[0, 0.5, 0.54]} top={0.14} bottom={0.145} color={FUR_WHITE} />
          <mesh castShadow position={[0, 0.5, 0.54]} scale={[0.72, 1.15, 0.7]}>
            <sphereGeometry args={[0.18, 18, 14]} />
            <meshStandardMaterial color={FUR_WHITE} roughness={0.98} />
          </mesh>
          <Limb a={[0, 0.5, 0.54]} b={[0, 0.16, 0.59]} top={0.12} bottom={0.13} color={FUR_WHITE} />
          <mesh castShadow position={[0, 0.09, 0.68]} scale={[1.05, 0.55, 1.65]}>
            <sphereGeometry args={[0.115, 16, 11]} />
            <meshStandardMaterial color={FUR_WHITE} roughness={0.96} />
          </mesh>
          {[0, 1, 2].map((i) => (
            <mesh key={i} position={[-0.055 + i * 0.055, 0.062, 0.785]} scale={[0.72, 0.45, 0.85]}>
              <sphereGeometry args={[0.04, 10, 7]} />
              <meshStandardMaterial color="#d9d3c8" roughness={1} />
            </mesh>
          ))}
        </group>
      ))}

      {/* muslos apoyados y patas traseras plegadas */}
      {[-0.36, 0.36].map((x) => (
        <group key={`haunch-${x}`} position={[x, 0, 0]} scale={[0.85, 1, 1]}>
          <mesh castShadow position={[0, 0.45, -0.52]} scale={[0.48, 0.66, 0.57]}>
            <sphereGeometry args={[0.5, 22, 17]} />
            <meshStandardMaterial color="#151515" roughness={0.9} />
          </mesh>
          <mesh castShadow position={[0, 0.32, -0.25]} scale={[0.7, 0.75, 1]}>
            <sphereGeometry args={[0.23, 18, 14]} />
            <meshStandardMaterial color="#171716" roughness={0.92} />
          </mesh>
          <mesh castShadow position={[0, 0.19, -0.1]} rotation={[0.2, 0, 0]} scale={[1.1, 0.58, 1.65]}>
            <sphereGeometry args={[0.13, 16, 11]} />
            <meshStandardMaterial color={FUR_WHITE} roughness={0.97} />
          </mesh>
        </group>
      ))}

      {/* cola gruesa descansando de lado, con punta blanca */}
      <group ref={tail} position={[0.05, 0.28, -0.88]}>
        <mesh castShadow position={[0.04, 0.12, 0.08]} scale={[0.9, 0.72, 1.1]}>
          <sphereGeometry args={[0.31, 20, 15]} />
          <meshStandardMaterial color="#151515" roughness={0.94} />
        </mesh>
        <mesh castShadow position={[0.3, 0, -0.1]} rotation={[0, -0.18, 0]} scale={[1.45, 0.34, 0.38]}>
          <sphereGeometry args={[0.32, 18, 13]} />
          <meshStandardMaterial color="#151515" roughness={0.96} />
        </mesh>
        <mesh castShadow position={[0.77, -0.025, 0.02]} rotation={[0, 0.23, 0]} scale={[1.32, 0.3, 0.34]}>
          <sphereGeometry args={[0.28, 18, 13]} />
          <meshStandardMaterial color="#1b1a19" roughness={0.97} />
        </mesh>
        <mesh castShadow position={[0.98, -0.025, 0.02]} rotation={[0, 0.23, 0]} scale={[1.05, 0.3, 0.34]}>
          <sphereGeometry args={[0.25, 17, 12]} />
          <meshStandardMaterial color={FUR_WHITE} roughness={1} />
        </mesh>
      </group>

      {/* collar discreto y placa */}
      <mesh position={[0, 1.4, 0.46]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.285, 0.021, 8, 24]} />
        <meshStandardMaterial color="#7d3a32" roughness={0.72} />
      </mesh>
      <mesh position={[0, 1.31, 0.73]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.047, 0.047, 0.016, 14]} />
        <meshStandardMaterial color="#c8a24e" metalness={0.48} roughness={0.3} />
      </mesh>
    </group>
  );
}

function PetBed({ position }: { position: P3 }) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow position={[0, 0.1, 0]} scale={[1, 1, 0.72]}>
        <cylinderGeometry args={[0.78, 0.82, 0.2, 24]} />
        <meshStandardMaterial color={BED_EDGE} roughness={0.95} />
      </mesh>
      <mesh castShadow position={[0, 0.18, 0]} scale={[1, 1, 0.72]}>
        <cylinderGeometry args={[0.62, 0.67, 0.18, 24]} />
        <meshStandardMaterial color={BED} roughness={1} />
      </mesh>
      <mesh position={[0, 0.285, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 0.72, 1]}>
        <circleGeometry args={[0.52, 24]} />
        <meshStandardMaterial color="#a76f5c" roughness={1} />
      </mesh>
      {[-0.25, 0, 0.25].map((x) => (
        <mesh key={x} position={[x, 0.292, 0.05]} rotation={[-Math.PI / 2, 0, 0]}>
          <boxGeometry args={[0.012, 0.48, 0.008]} />
          <meshStandardMaterial color="#895446" roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

function PetBowl({ position, kind }: { position: P3; kind: "water" | "food" }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 0.09, 0]}>
        <cylinderGeometry args={[0.25, 0.19, 0.16, 18]} />
        <meshStandardMaterial color={METAL} metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.18, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.22, 0.035, 7, 20]} />
        <meshStandardMaterial color="#c5bba9" metalness={0.45} roughness={0.38} />
      </mesh>
      <mesh position={[0, 0.185, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.19, 20]} />
        <meshStandardMaterial
          color={kind === "water" ? "#9caeae" : "#80603a"}
          roughness={kind === "water" ? 0.68 : 1}
          metalness={kind === "water" ? 0.02 : 0}
        />
      </mesh>
      {kind === "food" &&
        Array.from({ length: 9 }, (_, i) => {
          const a = (i / 9) * Math.PI * 2;
          const r = i % 3 === 0 ? 0.1 : 0.06;
          return (
            <mesh key={i} castShadow position={[Math.cos(a) * r, 0.21, Math.sin(a) * r]}>
              <dodecahedronGeometry args={[0.035, 0]} />
              <meshStandardMaterial color={i % 2 ? "#9a7240" : "#6f4c2b"} roughness={1} />
            </mesh>
          );
        })}
    </group>
  );
}

/** Rincón tranquilo del border collie, alejado del paso de la puerta. */
export default function BorderCollieCorner({ position }: { position: P3 }) {
  return (
    <group position={position}>
      <PetBed position={[0.72, 0, -0.42]} />
      <BorderCollie position={[-0.62, 0, 0.02]} />
      <PetBowl position={[0.28, 0, 0.76]} kind="water" />
      <PetBowl position={[0.88, 0, 0.72]} kind="food" />
    </group>
  );
}
