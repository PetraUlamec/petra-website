"use client";
// LA INTRO (VISION §2): la fachada de la tienda. Se entra empujando la puerta.
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { enEditor } from "@/lib/editor";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html, Text } from "@react-three/drei";
import { useRef } from "react";
import SceneShell, { type CamFocus } from "@/components/three/SceneShell";
import { WOOD, Window } from "@/components/three/Room";
import { PlantPot } from "@/components/three/Furniture";
import { Lantern } from "@/components/three/Decor";
import { Chispas, Polilla } from "@/components/three/Chispa";
import DecoVivo from "@/components/three/DecoVivo";
import { type P3 } from "@/components/three/deco/taller";
import Guia from "@/components/hud/Guia";
import { useT, useLang } from "@/i18n";
import { trTea } from "@/i18n/catalogo";
import { teaById } from "@/data/teas";

function SwingingSign() {
  // 24-ago: SER lo había colocado ÉL con el editor en (−4.689, 3.166, 0.274) con giro 90° y le gustaba
  // ahí (esquina izquierda de la fachada, saliendo a la calle). Lo que estaba mal era el BRAZO: iba
  // hacia −X (al aire, más allá del muro). Con giro 90°, la pared queda en +X LOCAL: el brazo va ahí.
  const T = useT();
  return (
    <group position={[-4.689, 3.166, 0.274]} rotation={[0, Math.PI / 2, 0]}>
      {/* brazo: del muro (local x≈1.07, o sea z≈−0.8) al extremo del que cuelga la tabla */}
      <mesh position={[0.7, 0.3, 0]} castShadow>
        <boxGeometry args={[0.78, 0.07, 0.07]} />
        <meshStandardMaterial color="#3a2a1a" metalness={0.3} roughness={0.6} />
      </mesh>
      {/* tornapunta contra el muro */}
      <mesh position={[0.86, 0.11, 0]} rotation={[0, 0, -0.72]} castShadow>
        <boxGeometry args={[0.04, 0.5, 0.04]} />
        <meshStandardMaterial color="#3a2a1a" metalness={0.3} roughness={0.6} />
      </mesh>
      {/* cadenas del brazo a la tabla */}
      {[0.02, 0.68].map((x) => (
        <mesh key={x} position={[x, 0.17, 0]}>
          <cylinderGeometry args={[0.011, 0.011, 0.22, 5]} />
          <meshStandardMaterial color="#3a2a1a" metalness={0.4} roughness={0.6} />
        </mesh>
      ))}
      {/* la tabla: acaba antes del muro (local x < 1.07) y no lo atraviesa */}
      <group position={[0.35, -0.07, 0]}>
        <mesh castShadow>
          <boxGeometry args={[1.34, 0.54, 0.08]} />
          <meshStandardMaterial color="#3f2a18" roughness={0.85} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[0, s * 0.2, 0.042]}>
            <boxGeometry args={[1.24, 0.022, 0.01]} />
            <meshStandardMaterial color="#d9b45b" roughness={0.7} metalness={0.2} />
          </mesh>
        ))}
        <Text position={[0, 0.05, 0.046]} fontSize={0.21} color="#f3e4c4" font="/fonts/karla-full-700-normal.woff"
          anchorX="center" anchorY="middle" maxWidth={1.18}>{T.marca}</Text>
        <Text position={[0, -0.12, 0.046]} fontSize={0.065} color="#e8d5ae" font="/fonts/karla-full-700-normal.woff"
          anchorX="center" anchorY="middle" letterSpacing={0.26} maxWidth={1.14}>{T.tienda.toUpperCase()}</Text>
      </group>
    </group>
  );
}

function ChimneySmoke() {
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!g.current) return;
    g.current.children.forEach((m, i) => {
      const t = (clock.elapsedTime * 0.24 + i * 0.34) % 1;
      m.position.set(Math.sin((t + i) * 4) * 0.22, t * 2.4, 0);
      const s = 0.14 + t * 0.5;
      m.scale.setScalar(s);
      (m as THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>).material.opacity = 0.35 * (1 - t);
    });
  });
  return (
    <group position={[3.25, 6.35, -3.95]}>
      <group ref={g}>
        {[0, 1, 2].map((i) => (
          <mesh key={i}>
            <sphereGeometry args={[1, 9, 8]} />
            <meshStandardMaterial color="#fff6e6" transparent opacity={0.3} depthWrite={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/* ── Atrezzo de calle (densidad de la fachada) ───────────── */

/** Enredadera de rosas trepando por la pared derecha de la casa (encargo de SER). */
export function RoseVine({ position = [3.15, 0, -0.76] as P3 }) {
  const ramas = useMemo(() => {
    const rnd = (i: number) => Math.abs(Math.sin(i * 127.13) * 43758.54) % 1;
    return [0, 1, 2, 3, 4, 5, 6].map((r) => {
      const x0 = (r - 3) * 0.3;
      const pts = [...Array(6)].map((_, i) => new THREE.Vector3(
        x0 + Math.sin(i * 1.4 + r * 2.1) * (0.16 + r * 0.03),
        i * 0.5 + rnd(r * 7 + i) * 0.16,
        0.045 + rnd(r * 13 + i) * 0.05
      ));
      return { curva: new THREE.CatmullRomCurve3(pts), r };
    });
  }, []);
  const flores = useMemo(() => ramas.flatMap(({ curva, r }) =>
    [0.28, 0.45, 0.62, 0.78, 0.92].map((t, i) => {
      const p = curva.getPoint(t + (((r * 3 + i) % 3) - 1) * 0.06);
      return { p, s: 0.055 + ((r + i) % 3) * 0.012, tono: (r + i) % 2 ? "#c94f6d" : "#e0728f" };
    })), [ramas]);
  const hojas = useMemo(() => ramas.flatMap(({ curva, r }) =>
    [0.14, 0.28, 0.42, 0.56, 0.7, 0.84].map((t, i) => ({
      p: curva.getPoint(t), rot: (r * 2.1 + i * 1.7) % Math.PI, s: 0.09 + ((r + i) % 2) * 0.03,
    }))), [ramas]);
  return (
    <group position={position}>
      {ramas.map(({ curva }, i) => (
        <mesh key={i} castShadow>
          <tubeGeometry args={[curva, 14, 0.016, 5]} />
          <meshStandardMaterial color="#4d6b3a" roughness={0.95} />
        </mesh>
      ))}
      {hojas.map((h, i) => (
        <mesh key={`h${i}`} position={h.p} rotation={[0, 0, h.rot]}>
          <circleGeometry args={[h.s, 6]} />
          <meshStandardMaterial color="#5f7a48" roughness={1} side={THREE.DoubleSide} />
        </mesh>
      ))}
      {flores.map((f, i) => (
        <group key={`f${i}`} position={f.p}>
          <mesh castShadow>
            <sphereGeometry args={[f.s, 8, 6]} />
            <meshStandardMaterial color={f.tono} roughness={0.85} />
          </mesh>
          <mesh position={[0, 0, f.s * 0.7]}>
            <sphereGeometry args={[f.s * 0.42, 6, 5]} />
            <meshStandardMaterial color="#8f2f47" roughness={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Margaritas blancas: al pie de la enredadera y a los lados del camino. QUIETAS
 *  (23-ago, SER: «las quiero estáticas»). `ancho`/`fondo` dan el tamaño del macizo. */
export function Daisies({ position = [3.15, 0, -0.35] as P3, count = 9, ancho = 1.7, fondo = 0.5, semilla = 0 }) {
  const flores = useMemo(() => [...Array(count)].map((_, i) => {
    const j = i + semilla * 7.13;
    const rnd = (n: number) => {
      const v = Math.sin(n) * 43758.5453;
      return v - Math.floor(v);
    };
    return {
      x: rnd(j * 12.9898) * ancho - ancho / 2,
      z: rnd(j * 78.233) * fondo - fondo / 2,
      h: 0.16 + (i % 3) * 0.05, giro: (j * 1.3) % Math.PI,
      inclina: (rnd(j * 3.71) - 0.5) * 0.16, // cada tallo con su gesto, pero quieto
    };
  }), [count, ancho, fondo, semilla]);
  return (
    <group position={position}>
      <group>
        {flores.map((f, i) => (
          <group key={i} position={[f.x, 0, f.z]} rotation={[f.inclina * 0.6, f.giro, f.inclina]}>
            <mesh position={[0, f.h / 2, 0]}>
              <cylinderGeometry args={[0.008, 0.011, f.h, 5]} />
              <meshStandardMaterial color="#5f7a48" roughness={1} />
            </mesh>
            {[...Array(8)].map((_, k) => (
              <mesh key={k} position={[Math.cos((k / 8) * Math.PI * 2) * 0.032, f.h, Math.sin((k / 8) * Math.PI * 2) * 0.032]}
                rotation={[-Math.PI / 2, 0, (k / 8) * Math.PI * 2]}>
                <planeGeometry args={[0.024, 0.05]} />
                <meshStandardMaterial color="#fdf9ee" roughness={0.9} side={THREE.DoubleSide} />
              </mesh>
            ))}
            <mesh position={[0, f.h + 0.004, 0]}>
              <sphereGeometry args={[0.016, 6, 5]} />
              <meshStandardMaterial color="#e8b43a" roughness={0.9} />
            </mesh>
            {/* hojas de la base: dan la masa verde del macizo */}
            {[0, 1, 2].map((k) => (
              <mesh key={`h${k}`} position={[Math.cos(k * 2.1 + f.giro) * 0.035, 0.022, Math.sin(k * 2.1 + f.giro) * 0.035]}
                rotation={[-1.15, k * 2.1 + f.giro, 0]}>
                <planeGeometry args={[0.035, 0.07]} />
                <meshStandardMaterial color={k % 2 ? "#5f7a48" : "#6f8f5a"} roughness={1} side={THREE.DoubleSide} />
              </mesh>
            ))}
          </group>
        ))}
      </group>
    </group>
  );
}

/** Pequeño macizo de césped que contiene las flores y deja libre el sendero. */
function GardenBedPatch({ position, rotY, semilla }: { position: P3; rotY: number; semilla: number }) {
  const briznas = useMemo(() => [...Array(7)].map((_, i) => ({
    x: -0.25 + ((i * 0.173 + semilla * 0.11) % 0.5),
    z: -0.13 + ((i * 0.097 + semilla * 0.07) % 0.26),
    h: 0.07 + (i % 3) * 0.025,
    giro: i * 1.37 + semilla,
  })), [semilla]);

  return (
    <group position={position} rotation={[0, rotY, 0]}>
      {/* Tres formas solapadas evitan que el césped parezca un rectángulo perfecto. */}
      {[
        { x: 0, z: 0, sx: 0.46, sz: 0.3, c: "#627a48" },
        { x: -0.22, z: 0.05, sx: 0.3, sz: 0.22, c: "#718b55" },
        { x: 0.23, z: -0.04, sx: 0.28, sz: 0.21, c: "#587041" },
      ].map((p, i) => (
        <mesh key={i} position={[p.x, 0.007 + i * 0.001, p.z]} rotation={[-Math.PI / 2, 0, 0]} scale={[p.sx, p.sz, 1]} receiveShadow>
          <circleGeometry args={[1, 16]} />
          <meshStandardMaterial color={p.c} roughness={1} />
        </mesh>
      ))}
      {briznas.map((b, i) => (
        <mesh key={`b${i}`} position={[b.x, b.h / 2, b.z]} rotation={[0, b.giro, i % 2 ? 0.13 : -0.1]} castShadow>
          <coneGeometry args={[0.018, b.h, 4]} />
          <meshStandardMaterial color={i % 2 ? "#6f8f5a" : "#4f693c"} roughness={1} />
        </mesh>
      ))}
      <Daisies position={[0, 0.012, 0]} count={8} ancho={0.5} fondo={0.3} semilla={semilla} />
    </group>
  );
}

/** Camino de losas que LLEVA a la puerta por un jardincito (encargo de SER). */
function GardenPath() {
  const curva = useMemo(() => new THREE.QuadraticBezierCurve3(
    // El punto de control comparte la X del destino: así el camino termina
    // perpendicular a la fachada y todas las losas giran de forma progresiva.
    new THREE.Vector3(-1.1, 0, 7.6), new THREE.Vector3(1.05, 0, 4.2), new THREE.Vector3(1.05, 0, 0.3)
  ), []);
  const losas = useMemo(() => [...Array(14)].map((_, i) => {
    const t = i / 13;
    const p = curva.getPoint(t);
    const tg = curva.getTangent(t);
    const angCurva = Math.atan2(tg.x, tg.z);
    const par = i % 2;
    // La losa final apunta directamente al eje de la puerta; las anteriores
    // conservan la orientación orgánica de la curva.
    const esUltima = i === 13;
    return {
      p,
      ang: esUltima ? -Math.PI : angCurva,
      rotLosa: esUltima ? -Math.PI : angCurva + (par ? 0.07 : -0.06),
      par,
    };
  }), [curva]);
  // 23-ago (SER: «las plantas de alrededor son como bolas → pon margaritas»):
  // macizos de margaritas a ambos lados, del mismo tipo que las de la ventana.
  const matas = useMemo(() => [0.12, 0.34, 0.56, 0.78].flatMap((t, i) => [-1, 1].map((lado) => {
    const p = curva.getPoint(t);
    const tg = curva.getTangent(t);
    const ang = Math.atan2(tg.x, tg.z);
    const nx = Math.cos(ang), nz = -Math.sin(ang);
    return {
      x: p.x + nx * lado * 0.92,
      z: p.z + nz * lado * 0.92,
      ang,
      semilla: i * 2 + lado + 3,
    };
  })), [curva]);
  return (
    <group position={[-1.05, 0, -0.35]}>
      {/* El sendero completo se desplaza como una sola pieza para que su llegada
          quede centrada frente a la puerta, conservando su curva y jardines. */}
      {/* borde de tierra del sendero: una cinta continua bajo las losas */}
      {losas.map(({ p, ang }, i) => (
        <mesh key={`t${i}`} position={[p.x, 0.006, p.z]} rotation={[-Math.PI / 2, 0, ang]} receiveShadow>
          <planeGeometry args={[0.95, 0.72]} />
          <meshStandardMaterial color="#a8916f" roughness={1} />
        </mesh>
      ))}
      {losas.map(({ p, rotLosa, par }, i) => (
        <mesh key={i} position={[p.x, 0.014, p.z]} rotation={[-Math.PI / 2, 0, rotLosa]} receiveShadow>
          <planeGeometry args={[0.74, 0.52]} />
          <meshStandardMaterial color={par ? "#d8c6a4" : "#cbb896"} roughness={0.95} />
        </mesh>
      ))}
      {matas.map((m, i) => (
        <GardenBedPatch key={`m${i}`} position={[m.x, 0, m.z]} rotY={m.ang} semilla={m.semilla} />
      ))}
    </group>
  );
}


/** Banco corrido de la calle, bajo el escaparate izquierdo (nunca lo tapa: 0,5 m de alto) */
function StreetBench({ position, rotY = 0 }: { position: P3; rotY?: number }) {
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      {/* tres listones de asiento */}
      {[-0.14, 0, 0.14].map((z, i) => (
        <mesh key={i} position={[0, 0.46, z]} castShadow receiveShadow>
          <boxGeometry args={[1.6, 0.06, 0.12]} />
          <meshStandardMaterial color={i % 2 ? "#8a5f38" : "#7a5330"} roughness={0.95} />
        </mesh>
      ))}
      {/* patas de tabla en los extremos */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.62, 0, 0]}>
          <mesh position={[0, 0.22, 0]} castShadow>
            <boxGeometry args={[0.1, 0.44, 0.42]} />
            <meshStandardMaterial color="#6b4527" roughness={0.95} />
          </mesh>
        </group>
      ))}
      {/* travesaño bajo */}
      <mesh position={[0, 0.16, 0]} castShadow>
        <boxGeometry args={[1.2, 0.07, 0.07]} />
        <meshStandardMaterial color="#5b3a21" roughness={0.95} />
      </mesh>
    </group>
  );
}

/** Carretilla de mano con tres sacos de té, arrimada a la esquina derecha */
function HandCart({ position, rotY = 0 }: { position: P3; rotY?: number }) {
  const sacos = [
    { x: -0.17, z: -0.06, s: 1, tono: "#c2a878" },
    { x: 0.13, z: 0.05, s: 0.88, tono: "#ab9264" },
    { x: 0.02, z: -0.12, s: 0.78, tono: "#d9c39a" },
  ];
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      {/* caja */}
      <mesh castShadow receiveShadow position={[0, 0.42, 0]}>
        <boxGeometry args={[0.78, 0.26, 0.5]} />
        <meshStandardMaterial color="#8a5f38" roughness={0.95} />
      </mesh>
      {/* costados en pendiente */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0, 0.56, s * 0.26]} rotation={[s * 0.24, 0, 0]} castShadow>
          <boxGeometry args={[0.78, 0.22, 0.04]} />
          <meshStandardMaterial color="#7a5330" roughness={0.95} />
        </mesh>
      ))}
      {/* varas / mangos */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0.52, 0.4, s * 0.19]} rotation={[0, 0, -0.12]} castShadow>
          <cylinderGeometry args={[0.028, 0.03, 0.5, 6]} />
          <meshStandardMaterial color="#6b4527" roughness={0.9} />
        </mesh>
      ))}
      {/* rueda de radios */}
      <group position={[-0.44, 0.24, 0]} rotation={[0, 0, 0]}>
        <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.22, 0.035, 6, 16]} />
          <meshStandardMaterial color="#5b3a21" roughness={0.9} />
        </mesh>
        {[0, 1, 2].map((i) => (
          <mesh key={i} rotation={[0, Math.PI / 2, (i / 3) * Math.PI]}>
            <boxGeometry args={[0.42, 0.03, 0.03]} />
            <meshStandardMaterial color="#7a5330" roughness={0.9} />
          </mesh>
        ))}
      </group>
      {/* pata de apoyo */}
      <mesh position={[0.34, 0.14, 0.18]} castShadow>
        <cylinderGeometry args={[0.022, 0.026, 0.3, 6]} />
        <meshStandardMaterial color="#6b4527" roughness={0.9} />
      </mesh>
      {/* tres sacos mini de arpillera */}
      {sacos.map((b, i) => (
        <group key={i} position={[b.x, 0.55, b.z]} scale={b.s}>
          <mesh castShadow>
            <sphereGeometry args={[0.11, 10, 8]} />
            <meshStandardMaterial color={b.tono} roughness={1} />
          </mesh>
          <mesh castShadow position={[0, 0.11, 0]}>
            <cylinderGeometry args={[0.045, 0.075, 0.09, 8]} />
            <meshStandardMaterial color={b.tono} roughness={1} />
          </mesh>
          <mesh position={[0, 0.14, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.05, 0.012, 5, 10]} />
            <meshStandardMaterial color="#8a7350" roughness={1} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Gorrión picoteando el empedrado (mini, quieto) */
function Sparrow({ position, rotY = 0 }: { position: P3; rotY?: number }) {
  return (
    <group position={position} rotation={[0, rotY, 0]} scale={0.62}>
      <group rotation={[0.55, 0, 0]}>
        <mesh castShadow scale={[1, 0.95, 1.3]}>
          <sphereGeometry args={[0.085, 9, 7]} />
          <meshStandardMaterial color="#9c8a6c" roughness={0.95} />
        </mesh>
        <mesh position={[0, 0.05, 0.09]} scale={[0.85, 0.8, 0.85]}>
          <sphereGeometry args={[0.055, 8, 6]} />
          <meshStandardMaterial color="#7a6a58" roughness={0.95} />
        </mesh>
        <mesh position={[0, 0.05, 0.14]} rotation={[Math.PI / 2.4, 0, 0]}>
          <coneGeometry args={[0.012, 0.045, 5]} />
          <meshStandardMaterial color="#5f5344" roughness={0.8} />
        </mesh>
        {/* cola levantada */}
        <mesh position={[0, 0.02, -0.12]} rotation={[-0.6, 0, 0]} scale={[0.45, 0.18, 1]}>
          <sphereGeometry args={[0.085, 8, 6]} />
          <meshStandardMaterial color="#7a6a58" roughness={0.95} />
        </mesh>
      </group>
      {/* patitas */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.035, 0.02, -0.01]}>
          <cylinderGeometry args={[0.006, 0.006, 0.05, 4]} />
          <meshStandardMaterial color="#8a6a3f" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

/** Tres figuras musicales pequeñas, construidas en 3D para no depender de glifos. */
function MusicalNoteMaterial({ color }: { color: string }) {
  return (
    <meshStandardMaterial
      color={color}
      emissive={color}
      emissiveIntensity={0.35}
      transparent
      opacity={0}
      depthWrite={false}
    />
  );
}

function MusicalNote({ kind }: { kind: 0 | 1 | 2 }) {
  const colors = ["#f1c75b", "#e99aa4", "#c8dc87"] as const;
  const color = colors[kind];

  if (kind === 1) {
    return (
      <group scale={0.72}>
        {[-0.045, 0.055].map((x, i) => (
          <group key={x} position={[x, i ? -0.018 : 0, 0]}>
            <mesh scale={[1.3, 0.78, 0.4]}>
              <sphereGeometry args={[0.045, 8, 6]} />
              <MusicalNoteMaterial color={color} />
            </mesh>
            <mesh position={[0.035, 0.085, 0]}>
              <boxGeometry args={[0.014, 0.18, 0.018]} />
              <MusicalNoteMaterial color={color} />
            </mesh>
          </group>
        ))}
        <mesh position={[0.04, 0.165, 0]} rotation={[0, 0, -0.1]}>
          <boxGeometry args={[0.115, 0.022, 0.02]} />
          <MusicalNoteMaterial color={color} />
        </mesh>
      </group>
    );
  }

  return (
    <group scale={0.72}>
      <mesh scale={[1.3, 0.78, 0.4]}>
        <sphereGeometry args={[0.045, 8, 6]} />
        <MusicalNoteMaterial color={color} />
      </mesh>
      <mesh position={[0.04, 0.085, 0]}>
        <boxGeometry args={[0.014, 0.18, 0.018]} />
        <MusicalNoteMaterial color={color} />
      </mesh>
      {kind === 0 && (
        <mesh position={[0.075, 0.155, 0]} rotation={[0, 0, -0.42]}>
          <boxGeometry args={[0.075, 0.02, 0.018]} />
          <MusicalNoteMaterial color={color} />
        </mesh>
      )}
    </group>
  );
}

/** Petirrojo que salta y canta cuando llega su turno dentro del ciclo. */
function SingingRoofBird({
  position,
  turn,
  noteKind,
}: {
  position: P3;
  turn: number;
  noteKind: 0 | 1 | 2;
}) {
  const bird = useRef<THREE.Group>(null);
  const note = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const slot = 1.25;
    const cycle = slot * 3;
    const t = (clock.elapsedTime - turn * slot + cycle) % cycle;

    if (bird.current) {
      const jump = t < 0.55 ? Math.sin((t / 0.55) * Math.PI) : 0;
      bird.current.position.y = jump * 0.17;
      bird.current.rotation.z = jump * 0.1;
    }

    if (note.current) {
      const noteT = (t - 0.12) / 0.9;
      const visible = noteT >= 0 && noteT <= 1;
      note.current.visible = visible;
      if (visible) {
        note.current.position.set(0.08 + noteT * (noteKind === 2 ? -0.07 : 0.06), 0.2 + noteT * 0.55, 0.08);
        note.current.rotation.z = (noteKind - 1) * 0.18 + noteT * 0.22;
        note.current.scale.setScalar(0.88 + noteT * 0.12);
        const opacity = Math.sin(noteT * Math.PI);
        note.current.traverse((child) => {
          if (!(child instanceof THREE.Mesh)) return;
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach((mat) => {
            mat.transparent = true;
            mat.opacity = opacity;
          });
        });
      }
    }
  });

  return (
    <group position={position}>
      <group ref={bird} rotation={[0, 0.7, 0]}>
        <mesh castShadow scale={[1, 0.95, 1.25]}>
          <sphereGeometry args={[0.09, 10, 8]} />
          <meshStandardMaterial color="#7a6a58" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.02, 0.08]} scale={[0.8, 0.75, 0.8]}>
          <sphereGeometry args={[0.07, 9, 7]} />
          <meshStandardMaterial color="#c7563a" roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.09, 0.06]}>
          <sphereGeometry args={[0.05, 9, 7]} />
          <meshStandardMaterial color="#7a6a58" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.09, 0.11]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.014, 0.05, 5]} />
          <meshStandardMaterial color="#e8c25a" roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.02, -0.12]} rotation={[0.5, 0, 0]} scale={[0.5, 0.2, 1]}>
          <sphereGeometry args={[0.09, 8, 6]} />
          <meshStandardMaterial color="#5f5344" roughness={0.9} />
        </mesh>
      </group>
      <group ref={note} visible={false}>
        <MusicalNote kind={noteKind} />
      </group>
    </group>
  );
}

/** Frontón triangular lateral que cierra correctamente el espacio bajo el tejado. */
function SideGable({ x }: { x: number }) {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-3.1, 0);
    s.lineTo(3.1, 0);
    s.lineTo(0, 1.55);
    s.closePath();
    return s;
  }, []);

  // La extrusión crece 0.18 hacia el exterior. Se retrasa esa misma medida
  // para que el frontón y la pared inferior compartan exactamente el plano.
  const flushX = x - Math.sign(x) * 0.18;
  return (
    <mesh position={[flushX, 4.58, -3.4]} rotation={[0, x > 0 ? Math.PI / 2 : -Math.PI / 2, 0]} castShadow receiveShadow>
      <extrudeGeometry args={[shape, { depth: 0.18, bevelEnabled: false }]} />
      <meshStandardMaterial color={x > 0 ? "#cfb78d" : "#c7ae82"} roughness={0.96} />
    </mesh>
  );
}

/** Volumen completo y estilizado de la casa, conservando la fachada original. */
function HouseShell() {
  const roofAngle = Math.atan2(1.5, 3.1);
  return (
    <group>
      {/* cuerpo profundo: su cara frontal queda detrás de la fachada original */}
      <mesh position={[0, 2.3, -3.4]} receiveShadow castShadow>
        <boxGeometry args={[9.5, 4.6, 4.8]} />
        <meshStandardMaterial color="#cfb78d" roughness={0.97} />
      </mesh>
      {/* fachada clara original */}
      <mesh position={[0, 2.3, -1]} receiveShadow castShadow>
        <boxGeometry args={[9.5, 4.6, 0.4]} />
        <meshStandardMaterial color="#d9c39a" roughness={0.95} />
      </mesh>
      <SideGable x={4.75} />
      <SideGable x={-4.75} />

      {/* faldón delantero y faldón trasero del tejado */}
      <mesh position={[0, 5.4, -1.85]} rotation={[roofAngle, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[10.8, 0.16, 3.45]} />
        <meshStandardMaterial color="#99451f" roughness={0.92} />
      </mesh>
      <mesh position={[0, 5.4, -4.95]} rotation={[-roofAngle, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[10.8, 0.16, 3.45]} />
        <meshStandardMaterial color="#873d21" roughness={0.94} />
      </mesh>

      {/* cumbrera y remates de los aleros */}
      <mesh position={[0, 6.18, -3.4]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.11, 0.11, 10.8, 8]} />
        <meshStandardMaterial color="#6f3828" roughness={0.9} />
      </mesh>
      {[-0.27, -6.53].map((z) => (
        <mesh key={z} position={[0, 4.64, z]} castShadow>
          <boxGeometry args={[10.8, 0.14, 0.12]} />
          <meshStandardMaterial color="#6f3828" roughness={0.92} />
        </mesh>
      ))}

      {/* zócalo y esquineros de madera para integrar la pared lateral */}
      <mesh position={[0, 0.14, -3.4]} castShadow receiveShadow>
        <boxGeometry args={[9.72, 0.28, 5.02]} />
        <meshStandardMaterial color="#7a6045" roughness={0.98} />
      </mesh>
      {[
        { z: -0.9, y: 2.3, h: 4.6 },
        // El poste trasero sube hasta quedar oculto bajo la pendiente del techo.
        { z: -5.8, y: 2.5, h: 5.0 },
      ].map(({ z, y, h }) => (
        <mesh key={z} position={[4.77, y, z]} castShadow>
          <boxGeometry args={[0.18, h, 0.18]} />
          <meshStandardMaterial color="#806044" roughness={0.94} />
        </mesh>
      ))}
      {/* remates inclinados del frontón derecho: cierran el espacio entre postes y tejado */}
      <mesh position={[4.77, 5.4, -1.85]} rotation={[roofAngle, 0, 0]} castShadow>
        <boxGeometry args={[0.18, 0.12, 3.45]} />
        <meshStandardMaterial color="#806044" roughness={0.94} />
      </mesh>
      <mesh position={[4.77, 5.4, -4.95]} rotation={[-roofAngle, 0, 0]} castShadow>
        <boxGeometry args={[0.18, 0.12, 3.45]} />
        <meshStandardMaterial color="#806044" roughness={0.94} />
      </mesh>

      {/* ventana lateral derecha: hace evidente que ya existe un volumen completo */}
      <Window
        position={[4.82, 2.25, -3.45]}
        rotY={Math.PI / 2}
        curtains={false}
        crossFill={{ top: true, left: true }}
      />

      {/* chimenea asentada sobre el faldón posterior */}
      <mesh position={[3.25, 5.78, -3.95]} castShadow>
        <boxGeometry args={[0.62, 1.18, 0.62]} />
        <meshStandardMaterial color="#927b67" roughness={1} />
      </mesh>
      <mesh position={[3.25, 6.4, -3.95]} castShadow>
        <boxGeometry args={[0.76, 0.12, 0.76]} />
        <meshStandardMaterial color="#6f6257" roughness={0.98} />
      </mesh>
    </group>
  );
}

function Facade({ onEnter }: { onEnter: () => void }) {
  const [hover, setHover] = useState(false);
  const door = useRef<THREE.Group>(null);
  const interior = useRef<THREE.Group>(null);
  const opening = useRef(false);

  useFrame((_, dt) => {
    if (!door.current) return;
    const target = opening.current ? -1.35 : 0; // el hover no la entreabre: solo brilla el pomo
    door.current.rotation.y += (target - door.current.rotation.y) * Math.min(1, dt * 5);
    // El fondo negro permanece totalmente oculto hasta que la hoja ya empezó a abrirse.
    if (interior.current) interior.current.visible = opening.current && door.current.rotation.y < -0.16;
  });
  const enter = () => {
    if (enEditor()) return;   // editando: la puerta no entra
    if (opening.current) return;
    opening.current = true;
    setTimeout(onEnter, 620); // la puerta se abre y pasas
  };
  return (
    <group>
      {/* suelo de calle empedrada */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        {/* 23-ago (SER: «el suelo se ve recortado»): el plano acababa dentro del encuadre y se veía
            la diagonal del borde. Ahora llega más allá de la niebla (fog 21→40). */}
        <planeGeometry args={[120, 120]} />
        <meshStandardMaterial color="#b9a184" roughness={1} />
      </mesh>
      <HouseShell />
      {/* escaparates */}
      <Window position={[-2.8, 2, -0.78]} curtains={false} crossFill={{ top: true, right: true }} />
      <Window position={[2.6, 2, -0.78]} curtains={false} crossFill={{ top: true }} />
      {/* fondo negro del hueco; jamás se renderiza con la puerta cerrada */}
      <group ref={interior} visible={false}>
        <mesh position={[0, 1.5, -0.795]}>
          <planeGeometry args={[1.6, 3.08]} />
          <meshBasicMaterial color="#000000" toneMapped={false} />
        </mesh>
      </group>

      {/* marco de tres piezas: deja libre el centro de la puerta */}
      {[-0.81, 0.81].map((x) => (
        <mesh key={x} position={[x, 1.55, -0.85]} castShadow>
          <boxGeometry args={[0.18, 3.1, 0.25]} />
          <meshStandardMaterial color={WOOD.marco} roughness={0.8} />
        </mesh>
      ))}
      <mesh position={[0, 3.01, -0.85]} castShadow>
        <boxGeometry args={[1.8, 0.18, 0.25]} />
        <meshStandardMaterial color={WOOD.marco} roughness={0.8} />
      </mesh>
      {/* la puerta que se empuja (pivota en el lado izquierdo) */}
      <group position={[-0.72, 1.5, -0.8]}>
        <group ref={door}>
          <mesh
            position={[0.72, 0, 0]}
            castShadow
            onClick={(e) => { e.stopPropagation(); enter(); }}
            onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = "pointer"; }}
            onPointerOut={() => { setHover(false); document.body.style.cursor = "auto"; }}
          >
            <boxGeometry args={[1.44, 2.9, 0.12]} />
            <meshStandardMaterial color="#5f6b45" roughness={0.62} />
          </mesh>
          <mesh position={[1.28, 0, 0.1]}>
            <sphereGeometry args={[0.08, 12, 12]} />
            <meshStandardMaterial
              color="#d9b45b" metalness={0.6} roughness={0.3}
              emissive="#8a6a1f" emissiveIntensity={hover ? 2.2 : 0}
            />
          </mesh>
        </group>
      </group>
      {/* cartel colgante que se mece */}
      <SwingingSign />
      {/* chimenea con humo */}
      <ChimneySmoke />
      {/* Cantan por turnos: derecha, centro e izquierda. */}
      <SingingRoofBird position={[2.65, 5.03, -0.78]} turn={2} noteKind={2} />
      <SingingRoofBird position={[3.05, 5.03, -0.78]} turn={1} noteKind={1} />
      <SingingRoofBird position={[3.45, 5.03, -0.78]} turn={0} noteKind={0} />
      {/* buzón de la casa junto a la puerta */}
      <group position={[-1.15, 1.3, -0.76]}>
        <mesh castShadow>
          <boxGeometry args={[0.3, 0.42, 0.14]} />
          <meshStandardMaterial color="#54654a" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.24, 0.02]} rotation={[0.35, 0, 0]} castShadow>
          <boxGeometry args={[0.34, 0.05, 0.2]} />
          <meshStandardMaterial color="#3e4a37" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.1, 0.075]}>
          <boxGeometry args={[0.2, 0.025, 0.01]} />
          <meshStandardMaterial color="#2e2013" />
        </mesh>
        <mesh position={[0, -0.05, 0.075]}>
          <boxGeometry args={[0.14, 0.1, 0.008]} />
          <meshStandardMaterial color="#f3e4c4" roughness={1} />
        </mesh>
      </group>
      <Lantern position={[-3.9, 0, 0.6]} />
      <Chispas position={[-3.9, 2.3, 0.6]} scale={[1.4, 1.6, 1.4]} count={18} color="#ffc97a" />
      <Polilla position={[-3.9, 2.35, 0.6]} radio={0.5} />
      {/* banco de la calle, bajo el escaparate izquierdo (no lo tapa) */}
      <StreetBench position={[-2.8, 0, -0.3]} rotY={0.03} />
      {/* el gato de la casa, dormido al sol en el banco (en el alféizar no cabía: 46 cm de gato en 30 de repisa) */}
      {/* un gorrión picoteando entre los adoquines */}
      <Sparrow position={[1.05, 0.08, 1.7]} rotY={-0.9} />
      <PlantPot position={[-1.6, 0.15, -0.2]} />
      <PlantPot position={[3.85, 0.15, -0.12]} />
    </group>
  );
}

function useBaseZoom() {
  const [z, setZ] = useState(44);
  useEffect(() => {
    const f = () => setZ(Math.min(window.innerWidth / 24, window.innerHeight / 12.5));
    f();
    window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, []);
  return z;
}

export default function IntroScene() {
  const T = useT();
  const router = useRouter();
  const baseZoom = useBaseZoom();
  const [entering, setEntering] = useState(false);
  const focus: CamFocus = entering
    ? { target: [0, 1.6, -0.8], zoom: baseZoom * 3.2 } // la cámara entra por la puerta
    : { target: [0.72, 1.9, -0.72], zoom: baseZoom };

  const enter = () => { setEntering(true); router.push("/salon"); };

  return (
    <main>
      <SceneShell focus={focus} ariaLabel={T.a11y.escena}>
        <Facade onEnter={enter} />
        <GardenPath />
        <RoseVine position={[3.15, 0, -0.67]} />
        <Daisies position={[3.15, 0, -0.12]} />
        {/* piezas añadidas desde el editor/taller también en la entrada */}
        <DecoVivo sala="intro" />
      </SceneShell>
      <Guia sala="intro" />
      <header className="fixed z-20 inset-x-0 bottom-8 sm:bottom-12 text-center pointer-events-none px-4">
        <h1 className="font-display text-3xl sm:text-5xl text-[var(--crema)] drop-shadow-[0_3px_10px_var(--sombra-calida)]">
          {T.intro.titulo}
        </h1>
        <p className="mt-2 text-sm sm:text-base text-[var(--crema)]/90 max-w-xl mx-auto">{T.intro.subtitulo}</p>
        <button onClick={enter} className="btn-miel px-6 py-2.5 mt-4 pointer-events-auto text-sm sm:text-base">
          {T.intro.entrar}
        </button>
        <p className="mt-2 text-xs text-[var(--crema)]/60">{T.intro.pista}</p>
      </header>
      <section className="sr-only-block">
        <h2>{T.intro.titulo}</h2>
        <p>{T.intro.subtitulo}</p>
        <p>Tés de mezcla propia, té premium, cajas de temporada, cucharas de madera talladas a mano.</p>
      </section>
    </main>
  );
}
