"use client";
// EL HERBARIO PROCEDURAL: cada planta sale del tarro con su forma botánica reconocible.
// margarita=manzanilla · espiga=lavanda · hoja=menta · umbela=hinojo · raíz=jengibre · corteza=canela…
// Determinista por id (misma planta = misma silueta), barato en triángulos.
import { useMemo } from "react";
import * as THREE from "three";
import type { Plant } from "@/lib/types";
import { visualProfile } from "@/data/botanicalArt";
import BotanicalSpecimen from "./BotanicalSpecimen";

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
  LEAF_GEO = new THREE.ExtrudeGeometry(sh, { depth: 0.004, bevelEnabled: false, curveSegments: 12 });
  return LEAF_GEO;
}
let PETAL_GEO: THREE.ExtrudeGeometry | null = null;
let STRAWBERRY_GEO: THREE.ExtrudeGeometry | null = null;
function strawberryGeo() {
  if (STRAWBERRY_GEO) return STRAWBERRY_GEO;
  const outline = new THREE.Shape();
  outline.moveTo(0, -0.11);
  outline.bezierCurveTo(-0.04, -0.08, -0.12, 0.03, -0.08, 0.08);
  outline.quadraticCurveTo(-0.04, 0.12, 0, 0.08);
  outline.quadraticCurveTo(0.06, 0.12, 0.085, 0.07);
  outline.bezierCurveTo(0.12, 0.02, 0.04, -0.08, 0, -0.11);
  STRAWBERRY_GEO = new THREE.ExtrudeGeometry(outline, { depth: 0.012, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.004, bevelThickness: 0.003, curveSegments: 20 });
  return STRAWBERRY_GEO;
}
function petalGeo() {
  if (PETAL_GEO) return PETAL_GEO;
  const sh = new THREE.Shape();
  sh.moveTo(0, 0);
  sh.quadraticCurveTo(0.02, 0.04, 0.016, 0.085);
  sh.quadraticCurveTo(0.008, 0.105, 0, 0.11);
  sh.quadraticCurveTo(-0.008, 0.105, -0.016, 0.085);
  sh.quadraticCurveTo(-0.02, 0.04, 0, 0);
  PETAL_GEO = new THREE.ExtrudeGeometry(sh, { depth: 0.003, bevelEnabled: false, curveSegments: 12 });
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
    {[0.04, 0.065, 0.09].flatMap(height => [-1, 1].map(side => <mesh key={`${height}-${side}`} position={[side * 0.014, height, 0.006]} rotation={[0, 0, side * -0.7]}>
      <boxGeometry args={[0.0015, 0.036, 0.001]} /><meshStandardMaterial color={color} roughness={1} />
    </mesh>))}
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
  if (visualProfile(plant.id)) return <BotanicalSpecimen plant={plant} scale={scale} />;
  return <GenericPlantSprig plant={plant} scale={scale} />;
}

function GenericPlantSprig({ plant, scale = 1 }: { plant: Plant; scale?: number }) {
  const parts = useMemo(() => {
    const r = rng(plant.id);
    const out: React.ReactNode[] = [];
    const C = plant.color, C2 = plant.color2;

    switch (plant.forma) {
      case "te-seco": {
        for (let index = 0; index < 11; index++) out.push(<mesh key={index} geometry={leafGeo()} position={[(r()-0.5)*0.2,0.03+r()*0.05,(r()-0.5)*0.18]} rotation={[-1.2+r()*0.5,r()*3,r()*6]} scale={[0.6+r()*0.4,0.5+r()*0.5,1]} castShadow>
          <meshStandardMaterial color={index%3 ? C : C2} roughness={0.95} side={THREE.DoubleSide} />
        </mesh>);
        break;
      }
      case "te-bola": {
        for (let index = 0; index < 9; index++) out.push(<mesh key={index} position={[(r()-0.5)*0.18,0.03+r()*0.05,(r()-0.5)*0.16]} scale={[1,0.8+r()*0.3,1]} castShadow>
          <sphereGeometry args={[0.027,16,12]} /><meshStandardMaterial color={index%3 ? C : C2} roughness={0.95} />
        </mesh>);
        break;
      }
      case "polvo": {
        out.push(<mesh key="mound" position={[0,0.025,0]} scale={[1,0.42,1]} castShadow><sphereGeometry args={[0.12,24,16,0,Math.PI*2,0,Math.PI/2]} /><meshStandardMaterial color={C} roughness={1} side={THREE.DoubleSide} /></mesh>);
        for (let index = 0; index < 15; index++) out.push(<mesh key={index} position={[(r()-0.5)*0.22,0.03+r()*0.03,(r()-0.5)*0.22]}><sphereGeometry args={[0.003,5,4]} /><meshStandardMaterial color={C} roughness={1} /></mesh>);
        break;
      }
      case "trozos": {
        for (let index = 0; index < 6; index++) out.push(<mesh key={index} position={[(r()-0.5)*0.15,0.04+index%2*0.035,(r()-0.5)*0.13]} rotation={[r(),r()*5,r()]} scale={[1.1,0.55+r()*0.35,0.8]} castShadow>
          <dodecahedronGeometry args={[0.055,0]} /><meshStandardMaterial color={index%3 ? C : C2} roughness={0.92} flatShading />
        </mesh>);
        break;
      }
      case "citrico": {
        for (let slice = 0; slice < 2; slice++) out.push(<group key={slice} position={[(slice-0.5)*0.07,0.04+slice*0.04,0]} rotation={[0.2+slice*0.3,0,slice*0.5]}>
          <mesh castShadow><cylinderGeometry args={[0.12,0.12,0.015,36]} /><meshStandardMaterial color={C} roughness={0.9} /></mesh>
          <mesh rotation={[Math.PI/2,0,0]}><torusGeometry args={[0.12,0.009,8,36]} /><meshStandardMaterial color={C2} roughness={0.8} /></mesh>
          {Array.from({ length: 9 }, (_, segment) => <group key={segment} rotation={[0,segment*Math.PI*2/9,0]}>
            <mesh position={[0,0.009,0.059]}><boxGeometry args={[0.003,0.002,0.107]} /><meshStandardMaterial color="#fff1c6" /></mesh>
          </group>)}
        </group>);
        break;
      }
      case "frambuesa": {
        for (let ring = 0; ring < 4; ring++) for (let bead = 0; bead < 7; bead++) {
          const angle = bead*Math.PI*2/7+ring*0.4;
          const radius = 0.025+Math.sin(ring/4*Math.PI)*0.025;
          out.push(<mesh key={`${ring}-${bead}`} position={[Math.cos(angle)*radius,0.045+ring*0.029,Math.sin(angle)*radius]} castShadow><sphereGeometry args={[0.023,12,8]} /><meshStandardMaterial color={C} roughness={0.65} /></mesh>);
        }
        break;
      }
      case "estrella": {
        for (let point = 0; point < 8; point++) out.push(<group key={point} rotation={[0,point*Math.PI/4,0]}>
          <mesh geometry={leafGeo()} position={[0,0.025,0]} rotation={[-Math.PI/2,0,0]} scale={[0.85,0.9,2]} castShadow><meshStandardMaterial color={C} roughness={1} side={THREE.DoubleSide} /></mesh>
          <mesh position={[0,0.032,-0.07]} scale={[0.6,0.5,1.4]}><sphereGeometry args={[0.015,12,8]} /><meshStandardMaterial color={C2} roughness={0.7} /></mesh>
        </group>);
        break;
      }
      case "clavo": {
        for (let index = 0; index < 3; index++) out.push(<group key={index} position={[(index-1)*0.065,0.04+index*0.014,0]} rotation={[1.2,0,index*0.7]}>
          <mesh castShadow><cylinderGeometry args={[0.018,0.005,0.17,12]} /><meshStandardMaterial color={C} roughness={0.95} /></mesh>
          <mesh position={[0,0.095,0]} castShadow><sphereGeometry args={[0.029,16,10]} /><meshStandardMaterial color={C2} roughness={0.9} /></mesh>
          <mesh position={[0,0.075,0]} rotation={[0,Math.PI/4,0]}><boxGeometry args={[0.053,0.012,0.053]} /><meshStandardMaterial color={C} roughness={0.95} /></mesh>
        </group>);
        break;
      }
      case "coco": {
        for (let index = 0; index < 3; index++) out.push(<group key={index} position={[(index-1)*0.045,0.035+index*0.025,0]} rotation={[0.4,index*1.8,0.3]}>
          <mesh castShadow><sphereGeometry args={[0.13,24,12,0,Math.PI*0.65,Math.PI*0.25,Math.PI*0.22]} /><meshStandardMaterial color={C2} roughness={0.95} side={THREE.DoubleSide} /></mesh>
          <mesh><sphereGeometry args={[0.124,24,12,0,Math.PI*0.65,Math.PI*0.25,Math.PI*0.22]} /><meshStandardMaterial color={C} roughness={0.8} side={THREE.DoubleSide} /></mesh>
        </group>);
        break;
      }
      case "grano":
      case "nuez": {
        const grain = plant.forma === "grano";
        for (let index = 0; index < (grain ? 12 : 4); index++) out.push(<group key={index} position={[(r()-0.5)*0.18,0.025+index%2*0.02,(r()-0.5)*0.14]} rotation={[0,r()*6,0]} scale={grain ? 0.5 : 1}>
          <mesh scale={[0.6,0.35,1.3]} castShadow><sphereGeometry args={[0.055,20,12]} /><meshStandardMaterial color={C} roughness={0.95} /></mesh>
          <mesh position={[0,0.019,0]}><boxGeometry args={[0.002,0.001,0.09]} /><meshStandardMaterial color={C2} roughness={1} /></mesh>
        </group>);
        break;
      }
      case "hebras": {
        for (let index = 0; index < 12; index++) out.push(<mesh key={index} position={[(r()-0.5)*0.12,0.03+index%3*0.012,(r()-0.5)*0.12]} rotation={[Math.PI/2,r(),r()*3]} castShadow><cylinderGeometry args={[0.003,0.005,0.12+r()*0.08,6]} /><meshStandardMaterial color={index%3 ? C : C2} roughness={1} /></mesh>);
        break;
      }
      case "piel": {
        for (let peel = 0; peel < 3; peel++) out.push(<group key={peel} position={[(peel - 1) * 0.07, 0.06 + peel * 0.025, 0]} rotation={[0.7, peel * 2.1, -0.3]} scale={[1, 0.65, 1]}>
          <mesh castShadow><sphereGeometry args={[0.13, 24, 16, 0, Math.PI * 0.85, Math.PI * 0.28, Math.PI * 0.25]} /><meshStandardMaterial color={C} roughness={0.86} side={THREE.DoubleSide} /></mesh>
          <mesh><sphereGeometry args={[0.122, 24, 16, 0, Math.PI * 0.85, Math.PI * 0.28, Math.PI * 0.25]} /><meshStandardMaterial color="#fff2ce" roughness={1} side={THREE.DoubleSide} /></mesh>
        </group>);
        break;
      }
      case "fresa": {
        for (let slice = 0; slice < 2; slice++) out.push(<group key={slice} position={[(slice - 0.5) * 0.08, 0.07 + slice * 0.045, 0]} rotation={[-Math.PI / 2 + 0.25, 0, slice * 0.7]}>
          <mesh geometry={strawberryGeo()} castShadow><meshStandardMaterial color={C} roughness={0.92} /></mesh>
          <mesh geometry={strawberryGeo()} scale={[0.4, 0.74, 0.15]} position={[0, 0, 0.016]}><meshStandardMaterial color="#eab6a1" roughness={1} /></mesh>
          {[-1,1].flatMap(side => [0,1,2,3].map(seed => <mesh key={`${side}-${seed}`} position={[side * (0.063 - seed * 0.012), 0.065 - seed * 0.042, 0.019]} rotation={[0, 0, side * -0.3]} scale={[0.5,1,0.25]}>
            <sphereGeometry args={[0.007, 8, 6]} /><meshStandardMaterial color="#e8c78b" roughness={0.8} />
          </mesh>))}
        </group>);
        break;
      }
      case "caliz": {
        out.push(<mesh key="base" position={[0,0.07,0]} scale={[0.8,1.2,0.8]} castShadow><sphereGeometry args={[0.055,16,12]} /><meshStandardMaterial color={C} roughness={0.9} /></mesh>);
        for (let lobe = 0; lobe < 5; lobe++) { const angle = lobe * Math.PI * 2 / 5; out.push(<group key={lobe} position={[Math.cos(angle)*0.025,0.05,Math.sin(angle)*0.025]} rotation={[0, -angle + Math.PI / 2, -0.45]}>
          <Leaf p={[0,0,0]} r={[0,0,0]} s={0.95} color={C} />
        </group>); }
        break;
      }
      case "petalos": {
        for (let petal = 0; petal < 6; petal++) out.push(<mesh key={petal} geometry={petalGeo()} position={[Math.cos(petal*2.4)*0.075,0.03+petal*0.008,Math.sin(petal*2.4)*0.06]} rotation={[-1.2,0,petal*2.4]} scale={[2.6,1,1]} castShadow>
          <meshStandardMaterial color={C} roughness={0.8} side={THREE.DoubleSide} />
        </mesh>);
        break;
      }
      case "fruta-seca": {
        for (let slice = 0; slice < 3; slice++) out.push(<group key={slice} position={[(slice - 1) * 0.07, 0.055 + slice * 0.04, 0]} rotation={[0.25 + slice * 0.22, slice, 0.2]}>
          <mesh castShadow><cylinderGeometry args={[0.1, 0.1, 0.018, 32]} /><meshStandardMaterial color={C} roughness={0.95} /></mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.097, 0.008, 8, 32]} /><meshStandardMaterial color={C2} roughness={0.9} /></mesh>
          <mesh position={[0, 0.012, 0]}><cylinderGeometry args={[0.016, 0.014, 0.004, 12]} /><meshStandardMaterial color="#785037" /></mesh>
        </group>);
        break;
      }
      case "fruta": {
        out.push(<group key="fruit" position={[0, 0.13, 0]}>
          <mesh castShadow scale={[1, 0.85, 1]}><sphereGeometry args={[0.13, 24, 16]} /><meshStandardMaterial color={C} roughness={0.45} /></mesh>
          <mesh position={[0, 0.13, 0]} rotation={[0, 0, -0.2]}><cylinderGeometry args={[0.008, 0.012, 0.08, 8]} /><meshStandardMaterial color="#795337" /></mesh>
          <Leaf p={[0.01, 0.14, 0]} r={[0.3, 0, -0.8]} s={0.7} color={C2} />
        </group>);
        break;
      }
      case "semilla": {
        for (let seed = 0; seed < 7; seed++) {
          const angle = seed * 2.4;
          out.push(<mesh key={`seed-${seed}`} position={[Math.cos(angle) * 0.08, 0.025 + seed % 2 * 0.02, Math.sin(angle) * 0.08]} rotation={[0.3, angle, 0.5]} scale={[0.55, 0.4, 1]} castShadow>
            <sphereGeometry args={[0.045, 14, 10]} /><meshStandardMaterial color={C} roughness={0.65} />
          </mesh>);
        }
        break;
      }
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
        out.push(<mesh key="root" position={[0,0.12,0]} rotation={[0,0,-0.3]} castShadow><cylinderGeometry args={[0.04,0.012,0.22,16]} /><meshStandardMaterial color={C} roughness={1} /></mesh>);
        for (let branch = 0; branch < 7; branch++) {
          const angle = branch * 2.4;
          const height = 0.05 + branch * 0.021;
          out.push(<mesh key={branch} position={[Math.cos(angle)*0.043,height,Math.sin(angle)*0.035]} rotation={[Math.sin(angle)*0.8,0,-Math.cos(angle)*0.9]} castShadow><cylinderGeometry args={[0.009,0.001,0.11,8]} /><meshStandardMaterial color={C2} roughness={1} /></mesh>);
        }
        out.push(<mesh key="cut" position={[0.031,0.225,0]} rotation={[0,0,-0.3]}><circleGeometry args={[0.037,20]} /><meshStandardMaterial color="#d7bd88" side={THREE.DoubleSide} /></mesh>);
        break;
      }
      case "rizoma": {
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

  return <group name={`specimen-${plant.id}`} scale={scale}>{parts}</group>;
}
