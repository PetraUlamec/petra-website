"use client";
// EL HERBARIO PROCEDURAL: cada planta sale del tarro con su forma botánica reconocible.
// margarita=manzanilla · espiga=lavanda · hoja=menta · umbela=hinojo · raíz=jengibre · corteza=canela…
// Determinista por id (misma planta = misma silueta), barato en triángulos.
import { useMemo } from "react";
import * as THREE from "three";
import type { Plant } from "@/lib/types";

// pseudo-aleatorio determinista a partir del id
function rng(seed: string) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822519);
    h = Math.imul(h ^ (h >>> 13), 3266489917);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

// geometrías con FORMA real, compartidas (se crean una vez)
let LEAF_GEO: THREE.ExtrudeGeometry | null = null;
function leafGeo() {
  if (LEAF_GEO) return LEAF_GEO;
  const sh = new THREE.Shape();
  sh.moveTo(0, 0);
  sh.quadraticCurveTo(0.045, 0.03, 0.05, 0.09);   // borde derecho
  sh.quadraticCurveTo(0.03, 0.13, 0, 0.15);       // punta
  sh.quadraticCurveTo(-0.03, 0.13, -0.05, 0.09);  // borde izquierdo
  sh.quadraticCurveTo(-0.045, 0.03, 0, 0);
  LEAF_GEO = new THREE.ExtrudeGeometry(sh, { depth: 0.004, bevelEnabled: false, curveSegments: 5 });
  return LEAF_GEO;
}
let PETAL_GEO: THREE.ExtrudeGeometry | null = null;
function petalGeo() {
  if (PETAL_GEO) return PETAL_GEO;
  const sh = new THREE.Shape();
  sh.moveTo(0, 0);
  sh.quadraticCurveTo(0.02, 0.04, 0.016, 0.085);
  sh.quadraticCurveTo(0.008, 0.105, 0, 0.11);
  sh.quadraticCurveTo(-0.008, 0.105, -0.016, 0.085);
  sh.quadraticCurveTo(-0.02, 0.04, 0, 0);
  PETAL_GEO = new THREE.ExtrudeGeometry(sh, { depth: 0.003, bevelEnabled: false, curveSegments: 5 });
  return PETAL_GEO;
}

/** hoja con forma de hoja: limbo + nervio central */
const Leaf = ({ p, r, s, color }: { p: [number, number, number]; r: [number, number, number]; s: number; color: string }) => (
  <group position={p} rotation={r} scale={s}>
    <mesh geometry={leafGeo()} castShadow>
      <meshStandardMaterial color={color} roughness={0.8} side={THREE.DoubleSide} />
    </mesh>
    <mesh position={[0, 0.075, 0.005]}>
      <boxGeometry args={[0.004, 0.13, 0.002]} />
      <meshStandardMaterial color={color} roughness={1} />
    </mesh>
  </group>
);

function Stem({ h, color, x = 0, z = 0, tilt = 0 }: { h: number; color: string; x?: number; z?: number; tilt?: number }) {
  // tallo con comba natural (Bézier), no un palo recto
  const geo = useMemo(() => {
    const bend = 0.22 * h * (tilt === 0 ? 0.6 : tilt * 6);
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(bend * 0.4, h * 0.55, 0),
      new THREE.Vector3(bend, h, 0)
    );
    return new THREE.TubeGeometry(curve, 8, 0.01, 6, false);
  }, [h, tilt]);
  return (
    <mesh position={[x, 0, z]} geometry={geo} castShadow>
      <meshStandardMaterial color={color} roughness={0.9} />
    </mesh>
  );
}

export default function PlantSprig({ plant, scale = 1 }: { plant: Plant; scale?: number }) {
  const parts = useMemo(() => {
    const r = rng(plant.id);
    const out: React.ReactNode[] = [];
    const C = plant.color, C2 = plant.color2;

    switch (plant.forma) {
      case "margarita": {
        out.push(<Stem key="s" h={0.22} color={C2} />);
        out.push(<Leaf key="l1" p={[0.04, 0.1, 0]} r={[0, 0, -0.9]} s={0.8} color={C2} />);
        const petals = 13;
        for (let i = 0; i < petals; i++) {
          const a = (i / petals) * Math.PI * 2 + r() * 0.1;
          out.push(
            <group key={`p${i}`} position={[Math.cos(a) * 0.035, 0.245, Math.sin(a) * 0.035]}
              rotation={[Math.PI / 2.2 + r() * 0.12, -a + Math.PI / 2, 0]} scale={0.95 + r() * 0.15}>
              <mesh geometry={petalGeo()} castShadow>
                <meshStandardMaterial color={C} roughness={0.65} side={THREE.DoubleSide} />
              </mesh>
            </group>
          );
        }
        out.push(
          <mesh key="c" position={[0, 0.252, 0]} castShadow>
            <sphereGeometry args={[0.04, 10, 8]} />
            <meshStandardMaterial color={plant.id === "calendula" ? "#a8540f" : C2} roughness={0.9} />
          </mesh>
        );
        for (let i = 0; i < 9; i++) {
          const a = r() * Math.PI * 2, rr = r() * 0.026;
          out.push(
            <mesh key={`s${i}`} position={[Math.cos(a) * rr, 0.288, Math.sin(a) * rr]}>
              <sphereGeometry args={[0.007, 5, 4]} />
              <meshStandardMaterial color="#7a5a1f" roughness={1} />
            </mesh>
          );
        }
        break;
      }
      case "espiga": {
        out.push(<Stem key="s" h={0.26} color={C2} />);
        for (let i = 0; i < 14; i++) {
          const a = i * 2.4 + r();  // espiral de filotaxis
          const rad = 0.02 + (i % 2) * 0.008;
          out.push(
            <mesh key={`f${i}`} position={[Math.cos(a) * rad, 0.23 + i * 0.016, Math.sin(a) * rad]}
              scale={[1, 1.4, 1]} castShadow>
              <sphereGeometry args={[0.017 - i * 0.0005, 7, 6]} />
              <meshStandardMaterial color={C} roughness={0.72} />
            </mesh>
          );
        }
        out.push(<Leaf key="l1" p={[-0.03, 0.08, 0]} r={[0, 0, 0.9]} s={0.65} color={C2} />);
        out.push(<Leaf key="l2" p={[0.03, 0.12, 0.01]} r={[0, 0, -0.9]} s={0.6} color={C2} />);
        break;
      }
      case "hoja": {
        out.push(<Stem key="s" h={0.3} color={C2} tilt={0.08} />);
        for (let i = 0; i < 6; i++) {
          const side = i % 2 ? 1 : -1;
          const y = 0.1 + i * 0.045;
          out.push(
            <Leaf key={`l${i}`} p={[side * (0.05 + r() * 0.01), y, (r() - 0.5) * 0.02]}
              r={[0.2, side * 0.4, side * -1.1]} s={1 - i * 0.09} color={i < 2 ? C2 : C} />
          );
        }
        out.push(<Leaf key="top" p={[0.01, 0.33, 0]} r={[0.1, 0, -0.15]} s={0.6} color={C} />);
        break;
      }
      case "flor5": {
        out.push(<Stem key="s" h={0.2} color={C2} />);
        out.push(<Leaf key="l" p={[0.04, 0.09, 0]} r={[0, 0, -1]} s={0.7} color={C2} />);
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2;
          out.push(
            <mesh key={`p${i}`} position={[Math.cos(a) * 0.05, 0.22, Math.sin(a) * 0.05]}
              rotation={[Math.PI / 2.6, 0, -a]} scale={[0.9, 1.1, 0.3]} castShadow>
              <sphereGeometry args={[0.05, 8, 6]} />
              <meshStandardMaterial color={C} roughness={0.6} />
            </mesh>
          );
        }
        out.push(
          <mesh key="c" position={[0, 0.235, 0]}>
            <sphereGeometry args={[0.03, 8, 6]} />
            <meshStandardMaterial color="#e8c25a" roughness={0.8} />
          </mesh>
        );
        break;
      }
      case "baya": {
        out.push(<Stem key="s" h={0.24} color="#7a5330" tilt={-0.12} />);
        for (let i = 0; i < 5; i++) {
          const a = r() * Math.PI * 2;
          out.push(
            <mesh key={`b${i}`} position={[Math.cos(a) * 0.05, 0.2 + r() * 0.08, Math.sin(a) * 0.05]}
              scale={[1, 1.35, 1]} castShadow>
              <sphereGeometry args={[0.032, 9, 7]} />
              <meshStandardMaterial color={C} roughness={0.35} />
            </mesh>
          );
        }
        out.push(<Leaf key="l1" p={[-0.05, 0.14, 0]} r={[0, 0, 1]} s={0.8} color={C2} />);
        out.push(<Leaf key="l2" p={[0.05, 0.1, 0.02]} r={[0, 0.4, -1]} s={0.7} color={C2} />);
        break;
      }
      case "umbela": {
        out.push(<Stem key="s" h={0.24} color={C2} />);
        const brazos = 6;
        for (let b = 0; b < brazos; b++) {
          const a = (b / brazos) * Math.PI * 2 + r();
          const bx = Math.cos(a) * 0.055, bz = Math.sin(a) * 0.055;
          out.push(
            <mesh key={`br${b}`} position={[bx / 2, 0.27, bz / 2]} rotation={[bz * 8, 0, -bx * 8]} castShadow>
              <cylinderGeometry args={[0.005, 0.007, 0.08, 5]} />
              <meshStandardMaterial color={C2} roughness={0.9} />
            </mesh>
          );
          for (let f = 0; f < 5; f++) {
            const fa = (f / 5) * Math.PI * 2;
            out.push(
              <mesh key={`fl${b}-${f}`} position={[bx + Math.cos(fa) * 0.018, 0.31, bz + Math.sin(fa) * 0.018]} castShadow>
                <sphereGeometry args={[0.013, 6, 5]} />
                <meshStandardMaterial color={C} roughness={0.7} />
              </mesh>
            );
          }
        }
        // hojas plumosas
        out.push(
          <mesh key="pl" position={[0.045, 0.12, 0]} rotation={[0, 0, -1.1]} castShadow>
            <coneGeometry args={[0.02, 0.11, 5]} />
            <meshStandardMaterial color={C2} roughness={0.9} />
          </mesh>
        );
        break;
      }
      case "raiz": {
        // rizoma nudoso tumbado
        const lobes = 4;
        for (let i = 0; i < lobes; i++) {
          out.push(
            <mesh key={`r${i}`} position={[-0.06 + i * 0.045, 0.05 + (i % 2) * 0.025, (r() - 0.5) * 0.03]}
              rotation={[r(), r(), r()]} scale={[1.5, 0.9, 1]} castShadow>
              <sphereGeometry args={[0.042, 9, 7]} />
              <meshStandardMaterial color={C} roughness={0.95} />
            </mesh>
          );
        }
        // rodaja cortada que enseña el interior
        out.push(
          <mesh key="cut" position={[0.1, 0.045, 0.02]} rotation={[0.2, 0.6, 0]} castShadow>
            <cylinderGeometry args={[0.038, 0.038, 0.012, 12]} />
            <meshStandardMaterial color="#f2dfa8" roughness={0.8} />
          </mesh>
        );
        out.push(
          <mesh key="sprout" position={[-0.07, 0.11, 0]} rotation={[0, 0, 0.3]} castShadow>
            <coneGeometry args={[0.015, 0.07, 5]} />
            <meshStandardMaterial color="#8fb35a" roughness={0.9} />
          </mesh>
        );
        break;
      }
      case "corteza": {
        // dos ramas de canela enrolladas, cruzadas
        for (let i = 0; i < 2; i++) {
          out.push(
            <group key={`c${i}`} position={[0, 0.035 + i * 0.05, 0]} rotation={[Math.PI / 2, 0, i ? 0.5 : -0.25]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.028, 0.028, 0.3, 12, 1, true]} />
                <meshStandardMaterial color={C} roughness={0.9} side={2} />
              </mesh>
              <mesh>
                <cylinderGeometry args={[0.018, 0.018, 0.3, 10]} />
                <meshStandardMaterial color={C2} roughness={1} />
              </mesh>
            </group>
          );
        }
        break;
      }
      case "vaina": {
        out.push(<Stem key="s" h={0.2} color={C2} tilt={0.15} />);
        for (let i = 0; i < 5; i++) {
          const a = r() * Math.PI * 2;
          out.push(
            <mesh key={`v${i}`} position={[Math.cos(a) * 0.045, 0.13 + r() * 0.1, Math.sin(a) * 0.045]}
              rotation={[r(), r(), r()]} scale={[0.7, 1.5, 0.7]} castShadow>
              <sphereGeometry args={[0.026, 8, 6]} />
              <meshStandardMaterial color={C} roughness={0.6} />
            </mesh>
          );
        }
        break;
      }
      case "aguja": {
        out.push(<Stem key="s" h={0.3} color="#6f5a3d" tilt={-0.06} />);
        for (let i = 0; i < 14; i++) {
          const y = 0.08 + (i / 14) * 0.24;
          const a = r() * Math.PI * 2;
          out.push(
            <mesh key={`n${i}`} position={[Math.cos(a) * 0.02, y, Math.sin(a) * 0.02]}
              rotation={[Math.sin(a), 0, Math.cos(a) * 1.2]} castShadow>
              <cylinderGeometry args={[0.003, 0.006, 0.06, 4]} />
              <meshStandardMaterial color={C} roughness={0.85} />
            </mesh>
          );
        }
        break;
      }
      case "tallo": {
        // tallo segmentado (cola de caballo) o tila con bráctea pálida
        const segs = 5;
        for (let i = 0; i < segs; i++) {
          out.push(
            <mesh key={`t${i}`} position={[0, 0.035 + i * 0.062, 0]} castShadow>
              <cylinderGeometry args={[0.012 - i * 0.0012, 0.014 - i * 0.0012, 0.055, 6]} />
              <meshStandardMaterial color={C2} roughness={0.9} />
            </mesh>
          );
          out.push(
            <mesh key={`n${i}`} position={[0, 0.065 + i * 0.062, 0]}>
              <torusGeometry args={[0.014, 0.004, 6, 10]} />
              <meshStandardMaterial color={C} roughness={0.9} />
            </mesh>
          );
        }
        if (plant.id === "tila") {
          out.push(
            <mesh key="bract" position={[0.05, 0.22, 0]} rotation={[0.2, 0, -0.7]} scale={[0.5, 1.8, 0.15]} castShadow>
              <sphereGeometry args={[0.05, 8, 6]} />
              <meshStandardMaterial color={C} roughness={0.85} />
            </mesh>
          );
          out.push(
            <mesh key="fl" position={[0.09, 0.16, 0.01]} castShadow>
              <sphereGeometry args={[0.018, 7, 6]} />
              <meshStandardMaterial color="#f0e6b8" roughness={0.7} />
            </mesh>
          );
        }
        break;
      }
    }
    return out;
  }, [plant]);

  return <group scale={scale}>{parts}</group>;
}
