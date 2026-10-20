"use client";
// Detalle fino de las DOS salas de té (encargo de SER: nivel «entrada espectacular»).
// Sala normal: mueble de botica con cajoncitos, escalera, lámpara colgante, cortinas,
// tazas humeantes, tarro derramado, cartelito. Premium: campanas de cristal que se levantan,
// araña de velas, retrato dorado y cordón de terciopelo de museo.
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html, Text, useTexture } from "@react-three/drei";
import { useMemo, useRef } from "react";
import GLB from "../Modelos";

const ORO = "#d9b45b";
const MADERA = "#5e3d24";
const MADERA_OSC = "#4e3119";
const LINO = "#f3e4c4";
const GRANATE = "#8a4049";

/* ══════════ SALA NORMAL ══════════ */

/** Frente de cajoncitos de botica bajo las baldas + copete de moldura arriba. */
export function ApothecaryFront({ position = [0, 0, -4.3] as [number, number, number], width = 6.0 }) {
  const cols = 8;
  const drawerW = (width - 0.5) / cols;
  const rows = [0.32, 0.72]; // alturas de las dos filas (bajo la balda de y=1.1)
  return (
    <group position={position}>
      {/* cuerpo del mueble bajo */}
      <mesh position={[0, 0.51, 0.02]} castShadow receiveShadow>
        <boxGeometry args={[width - 0.2, 0.98, 0.86]} />
        <meshStandardMaterial color={MADERA_OSC} roughness={0.8} />
      </mesh>
      {/* cajoncitos */}
      {rows.map((y, r) =>
        Array.from({ length: cols }).map((_, c) => {
          const x = -width / 2 + 0.35 + drawerW / 2 + c * drawerW;
          return (
            <group key={`${r}-${c}`} position={[x, y, 0.46]}>
              <mesh castShadow>
                <boxGeometry args={[drawerW - 0.08, 0.3, 0.05]} />
                <meshStandardMaterial color={r % 2 ? "#6b4a2c" : "#5f3f24"} roughness={0.75} />
              </mesh>
              {/* tirador dorado */}
              <mesh position={[0, -0.05, 0.045]}>
                <sphereGeometry args={[0.025, 8, 8]} />
                <meshStandardMaterial color={ORO} metalness={0.7} roughness={0.3} />
              </mesh>
              {/* etiquetita de papel */}
              <mesh position={[0, 0.07, 0.032]}>
                <boxGeometry args={[0.16, 0.09, 0.012]} />
                <meshStandardMaterial color="#fdf6e0" roughness={1} />
              </mesh>
              <mesh position={[0, 0.07, 0.04]}>
                <boxGeometry args={[0.1, 0.012, 0.002]} />
                <meshStandardMaterial color="#8a7350" roughness={1} />
              </mesh>
            </group>
          );
        })
      )}
      {/* copete/moldura sobre el mueble alto */}
      <mesh position={[0, 3.02, 0]} castShadow>
        {/* Alineado con el cuerpo inferior: ya no sobresale por los laterales. */}
        <boxGeometry args={[width - 0.2, 0.14, 1.0]} />
        <meshStandardMaterial color={MADERA_OSC} roughness={0.7} />
      </mesh>
      <mesh position={[0, 3.16, 0]} castShadow>
        <boxGeometry args={[width - 0.6, 0.14, 0.8]} />
        <meshStandardMaterial color={MADERA} roughness={0.7} />
      </mesh>
      {/* La moldura termina en la balda larga: se eliminó el bloque central que hundía los tarros superiores. */}
    </group>
  );
}

/** Escalera de mano apoyada DE FRENTE contra el mueble: pivote en la base (suelo),
 *  inclinada -0.32 rad hacia la balda alta. Base z=-3.03 → top toca el frente (~z-3.85). */
export function ApothecaryLadder({ position = [2.55, 0, -3.03] as [number, number, number] }) {
  const rungs = 5;
  return (
    <group position={position} rotation={[-0.32, 0, 0]}>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.24, 1.3, 0]} castShadow>
          <boxGeometry args={[0.07, 2.6, 0.07]} />
          <meshStandardMaterial color="#8a5f38" roughness={0.85} />
        </mesh>
      ))}
      {Array.from({ length: rungs }).map((_, i) => (
        <mesh key={i} position={[0, 0.4 + i * 0.46, 0.045]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.026, 0.026, 0.46, 7]} />
          <meshStandardMaterial color="#a8763d" roughness={0.85} />
        </mesh>
      ))}
      {/* zapatas */}
      {[-1, 1].map((s) => (
        <mesh key={`z${s}`} position={[s * 0.24, 0.02, 0]}>
          <boxGeometry args={[0.09, 0.05, 0.12]} />
          <meshStandardMaterial color="#4a2f1a" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

/** Mancha de sol de la ventana proyectada en el suelo (aditiva, no bloquea clics). */
export function WindowGlow({ position = [-3.1, 0.02, -2.9] as [number, number, number], w = 1.9, d = 2.7, rotY = 0.42 }) {
  return (
    <mesh raycast={() => null} position={position} rotation={[-Math.PI / 2, 0, rotY]}>
      <planeGeometry args={[w, d]} />
      <meshBasicMaterial color="#ffe6ab" transparent opacity={0.05} blending={THREE.AdditiveBlending} depthWrite={false} />
    </mesh>
  );
}

/** Chimenea del salón premium: mármol oscuro, filo dorado, fuego vivo (1 sola pointLight). */
export function PremiumFireplace({ position = [-4.55, 0, 1.8] as [number, number, number] }) {
  const flames = useRef<THREE.Group>(null);
  const light = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    const f = 1 + Math.sin(clock.elapsedTime * 8) * 0.22 + Math.sin(clock.elapsedTime * 19) * 0.1;
    if (flames.current) flames.current.children.forEach((m, i) => m.scale.set(0.9 + f * 0.12, f * (1 + (i % 2) * 0.15), 0.9 + f * 0.12));
    if (light.current) light.current.intensity = 6 * f;
  });
  return (
    <group position={position} rotation={[0, Math.PI / 2, 0]}>
      {/* cuerpo de mármol oscuro */}
      <mesh position={[0, 0.9, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.7, 1.8, 0.5]} />
        <meshStandardMaterial color="#3c2a30" roughness={0.35} />
      </mesh>
      {/* jambas y repisa con filo dorado */}
      {[-1, 1].map((sx) => (
        <mesh key={sx} position={[sx * 0.72, 0.8, 0.27]} castShadow>
          <boxGeometry args={[0.18, 1.6, 0.1]} />
          <meshStandardMaterial color="#4e3119" roughness={0.6} />
        </mesh>
      ))}
      <mesh position={[0, 1.86, 0.1]} castShadow>
        <boxGeometry args={[1.9, 0.12, 0.7]} />
        <meshStandardMaterial color="#4e3119" roughness={0.55} />
      </mesh>
      <mesh position={[0, 1.79, 0.32]}>
        <boxGeometry args={[1.9, 0.03, 0.06]} />
        <meshStandardMaterial color={ORO} metalness={0.7} roughness={0.3} />
      </mesh>
      {/* hogar */}
      <mesh position={[0, 0.62, 0.26]}>
        <boxGeometry args={[1.0, 1.0, 0.06]} />
        <meshStandardMaterial color="#1c1310" roughness={1} />
      </mesh>
      {/* leños */}
      {[-1, 1].map((sx) => (
        <mesh key={`l${sx}`} position={[sx * 0.14, 0.2, 0.3]} rotation={[0, sx * 0.5, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.42, 7]} />
          <meshStandardMaterial color="#3a2513" roughness={1} />
        </mesh>
      ))}
      {/* llamas */}
      <group ref={flames}>
        <mesh position={[0, 0.42, 0.3]}>
          <coneGeometry args={[0.13, 0.34, 7]} />
          <meshStandardMaterial color="#ffb14d" emissive="#ff8a1f" emissiveIntensity={2.8} transparent opacity={0.92} />
        </mesh>
        <mesh position={[0.08, 0.36, 0.32]}>
          <coneGeometry args={[0.08, 0.22, 6]} />
          <meshStandardMaterial color="#ffd98a" emissive="#ffc25f" emissiveIntensity={3.4} transparent opacity={0.95} />
        </mesh>
        <mesh position={[-0.09, 0.34, 0.3]}>
          <coneGeometry args={[0.06, 0.18, 6]} />
          <meshStandardMaterial color="#ffca5f" emissive="#ff9a1f" emissiveIntensity={3.2} transparent opacity={0.9} />
        </mesh>
      </group>
      <pointLight ref={light} position={[0, 0.55, 0.7]} distance={6} color="#ff9d4f" intensity={6} />
    </group>
  );
}

/** Lámpara de pie: base en el suelo, poste completo y pantalla luminosa arriba. */
export function HangingLamp({
  position = [-1.6, 0, 1.6] as [number, number, number],
  ceiling: _ceiling = 3.6,
}) {
  return (
    <group position={position}>
      {/* base pesada apoyada en el suelo */}
      <mesh position={[0, 0.055, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.25, 0.3, 0.11, 18]} />
        <meshStandardMaterial color="#6f5136" metalness={0.2} roughness={0.62} />
      </mesh>
      {/* poste vertical */}
      <mesh position={[0, 0.84, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.035, 1.58, 10]} />
        <meshStandardMaterial color="#2e2013" metalness={0.35} roughness={0.55} />
      </mesh>
      <mesh position={[0, 1.64, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.045, 0.12, 12]} />
        <meshStandardMaterial color="#6f5136" roughness={0.58} />
      </mesh>
      {/* pantalla y foco en la parte superior */}
      <mesh position={[0, 1.79, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.32, 0.3, 18, 1, true]} />
        <meshStandardMaterial color="#a68157" roughness={0.82} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 1.66, 0]}>
        <sphereGeometry args={[0.075, 12, 10]} />
        <meshStandardMaterial color="#ffe4a5" emissive="#ffc25f" emissiveIntensity={2.25} />
      </mesh>
      <mesh position={[0, 1.97, 0]}>
        <sphereGeometry args={[0.045, 10, 8]} />
        <meshStandardMaterial color="#5b3b24" roughness={0.58} />
      </mesh>
      <pointLight position={[0, 1.6, 0]} distance={3.2} intensity={1.75} color="#ffd28a" />
    </group>
  );
}

/** Cortinas de lino recogidas a los lados de la ventana. */
export function Curtains({ position = [1.6, 2.3, -4.82] as [number, number, number], width = 1.7 }) {
  return (
    <group position={position}>
      {/* barra */}
      <mesh position={[0, 1.12, 0.05]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, width + 0.7, 8]} />
        <meshStandardMaterial color="#4a2f1a" roughness={0.7} />
      </mesh>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * (width / 2 + 0.12), 0, 0.06]}>
          {/* paño recogido: más ancho arriba, pinzado al medio */}
          <mesh position={[0, 0.55, 0]} castShadow>
            <cylinderGeometry args={[0.16, 0.1, 1.1, 8]} />
            <meshStandardMaterial color={LINO} roughness={1} />
          </mesh>
          <mesh position={[0, -0.35, 0]} castShadow>
            <cylinderGeometry args={[0.1, 0.2, 0.75, 8]} />
            <meshStandardMaterial color={LINO} roughness={1} />
          </mesh>
          {/* lazada */}
          <mesh position={[0, 0.0, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.11, 0.025, 6, 12]} />
            <meshStandardMaterial color="#a8763d" roughness={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Dos tazas pequeñas humeando junto a la tetera. */
export function SteamingCups({ position = [-1.15, 1.05, 1.75] as [number, number, number] }) {
  const steam = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!steam.current) return;
    steam.current.children.forEach((m, i) => {
      const t = (clock.elapsedTime * 0.45 + i * 0.5) % 1;
      m.position.y = 0.1 + t * 0.55;
      m.position.x = (i % 2 ? 0 : 0.34) + Math.sin((t + i) * 6) * 0.04;
      m.scale.setScalar(0.045 + t * 0.09);
      (m as THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>).material.opacity = 0.45 * (1 - t);
    });
  });
  return (
    <group position={position}>
      {[0, 0.34].map((x, i) => (
        <group key={i} position={[x, 0, i * 0.12]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.07, 0.055, 0.09, 12]} />
            <meshStandardMaterial color={i ? "#a8593f" : "#7c8a5a"} roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.046, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.055, 12]} />
            <meshStandardMaterial color="#6b4527" roughness={0.9} />
          </mesh>
          <mesh position={[0.085, 0.01, 0]} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.032, 0.011, 6, 10, Math.PI]} />
            <meshStandardMaterial color={i ? "#a8593f" : "#7c8a5a"} roughness={0.5} />
          </mesh>
        </group>
      ))}
      <group ref={steam}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} position={[0, 0.15, 0]}>
            <sphereGeometry args={[1, 8, 7]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.4} depthWrite={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/** Tarro caído de lado con hojas derramadas: el detalle de vida. */
export function SpilledJar({ position = [-2.15, 1.05, 1.45] as [number, number, number] }) {
  return (
    <group position={position} rotation={[0, 0.7, 0]}>
      {/* tarro tumbado */}
      <mesh position={[0, 0.075, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.075, 0.068, 0.19, 14]} />
        <meshPhysicalMaterial color="#eaf6ef" roughness={0.08} transparent opacity={0.35} envMapIntensity={1.1} />
      </mesh>
      {/* corcho al lado */}
      <mesh position={[0.2, 0.03, 0.1]} rotation={[Math.PI / 2, 0, 0.4]} castShadow>
        <cylinderGeometry args={[0.055, 0.055, 0.03, 12]} />
        <meshStandardMaterial color="#d3b078" roughness={1} />
      </mesh>
      {/* hojas derramadas */}
      <mesh position={[-0.14, 0.012, 0.02]} rotation={[-Math.PI / 2, 0, 0.3]}>
        <circleGeometry args={[0.11, 9]} />
        <meshStandardMaterial color="#9DB56B" roughness={1} />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} position={[-0.16 - (i % 3) * 0.05, 0.02, -0.03 + (i % 2) * 0.07]}>
          <sphereGeometry args={[0.018, 6, 5]} />
          <meshStandardMaterial color={i % 2 ? "#8aa25a" : "#9DB56B"} roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

/** Cartelito de madera colgado en la pared. */
export function WallSign({ position, texto, rotY = 0, w = 1.15 }: { position: [number, number, number]; texto: string; rotY?: number; w?: number }) {
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <mesh castShadow>
        <boxGeometry args={[w, 0.4, 0.06]} />
        <meshStandardMaterial color="#6b4527" roughness={0.85} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (w / 2 - 0.13), 0.14, 0.035]}>
          <sphereGeometry args={[0.018, 8, 6]} />
          <meshStandardMaterial color="#2e2013" metalness={0.5} roughness={0.5} />
        </mesh>
      ))}
      <Text position={[0, 0, 0.045]} fontSize={0.128} color="#f3e4c4" font="/fonts/karla-full-700-normal.woff"
        anchorX="center" anchorY="middle" maxWidth={w - 0.12}>
        {texto}
      </Text>
    </group>
  );
}

/* ══════════ DENSIDAD DE LA SALA DE TÉ (encargo: «todo en toda la habitación») ══════════ */

const HIERBAS = ["#7c8a5a", "#9DB56B", "#8aa25a", "#6f7f4d", "#a8b06a", "#5f7a48", "#b7bd7e"];

/** Guirnalda de manojos de hierbas colgada del frente superior del mueble de botica.
 *  Cuerda con comba + 9 manojitos atados; queda POR ENCIMA de la balda alta (y≈2.2)
 *  y POR DELANTE de los tarros (z=-4.05), sin tocarlos. */
export function HerbGarland({
  position = [0, 3.02, -3.84] as [number, number, number],
  width = 5.5,
  count = 9,
}) {
  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-width / 2, 0, 0),
        new THREE.Vector3(0, -0.12, 0.015),
        new THREE.Vector3(width / 2, 0.02, 0),
      ]),
    [width]
  );
  const bunches = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => {
        const p = curve.getPoint((i + 0.5) / count);
        return {
          p: [p.x, p.y, p.z] as [number, number, number],
          tone: HIERBAS[i % HIERBAS.length],
          h: 0.16 + ((i * 7) % 3) * 0.025,
          tilt: Math.sin(i * 2.3) * 0.18,
        };
      }),
    [curve, count]
  );
  return (
    <group position={position}>
      {/* la cuerda */}
      <mesh raycast={() => null}>
        <tubeGeometry args={[curve, 26, 0.013, 5, false]} />
        <meshStandardMaterial color="#a8763d" roughness={1} />
      </mesh>
      {/* clavos de los extremos */}
      {[-width / 2, width / 2].map((x, i) => (
        <mesh key={i} position={[x, i ? 0.02 : 0, 0]}>
          <sphereGeometry args={[0.022, 7, 6]} />
          <meshStandardMaterial color="#4a2f1a" metalness={0.4} roughness={0.6} />
        </mesh>
      ))}
      {bunches.map((b, i) => (
        <group key={i} position={b.p} rotation={[0, (i % 2 ? 0.4 : -0.3), b.tilt]}>
          {/* atadura de bramante */}
          <mesh position={[0, -0.035, 0]}>
            <cylinderGeometry args={[0.017, 0.017, 0.045, 6]} />
            <meshStandardMaterial color="#d3b078" roughness={1} />
          </mesh>
          {/* tallos: conos con la punta hacia abajo */}
          {[-1, 0, 1].map((s) => (
            <mesh
              key={s}
              position={[s * 0.024, -0.06 - b.h / 2, s * 0.014]}
              rotation={[0, 0, Math.PI + s * 0.16]}
            >
              <coneGeometry args={[0.042, b.h, 6]} />
              <meshStandardMaterial color={s ? b.tone : HIERBAS[(i + 3) % HIERBAS.length]} roughness={1} />
            </mesh>
          ))}
          {/* dos hojitas sueltas */}
          {[-1, 1].map((s) => (
            <mesh key={`h${s}`} position={[s * 0.05, -0.09, 0.02]} rotation={[0, 0, s * 0.7]}>
              <circleGeometry args={[0.032, 7]} />
              <meshStandardMaterial color={b.tone} roughness={1} side={THREE.DoubleSide} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

/** Pila de tres cajas de té estampadas, con la de arriba entreabierta y viruta cayendo. */
export function TeaCrateStack({ position = [-3.6, 0, -3.6] as [number, number, number] }) {
  const crates = [
    { y: 0.21, h: 0.42, w: 0.74, d: 0.52, rot: 0.0, tone: "#8a5f38", sello: "#9DB56B" },
    { y: 0.62, h: 0.4, w: 0.7, d: 0.5, rot: 0.17, tone: "#7a5330", sello: "#a8593f" },
    { y: 1.01, h: 0.38, w: 0.66, d: 0.46, rot: -0.11, tone: "#96703f", sello: "#5f7a48" },
  ];
  const top = crates[2];
  return (
    <group position={position}>
      {crates.map((c, i) => (
        <group key={i} position={[0, c.y, 0]} rotation={[0, c.rot, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[c.w, c.h, c.d]} />
            <meshStandardMaterial color={c.tone} roughness={0.92} />
          </mesh>
          {/* listones de refuerzo */}
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * (c.w / 2 - 0.06), 0, c.d / 2 + 0.008]}>
              <boxGeometry args={[0.075, c.h - 0.03, 0.016]} />
              <meshStandardMaterial color="#6b4527" roughness={0.9} />
            </mesh>
          ))}
          <mesh position={[0, c.h / 2 - 0.03, c.d / 2 + 0.008]}>
            <boxGeometry args={[c.w - 0.02, 0.05, 0.016]} />
            <meshStandardMaterial color="#6b4527" roughness={0.9} />
          </mesh>
          {/* estampado: rectángulo de tinta + dos rayas */}
          <mesh position={[0, -0.02, c.d / 2 + 0.014]}>
            <boxGeometry args={[c.w * 0.5, c.h * 0.36, 0.006]} />
            <meshStandardMaterial color={c.sello} roughness={1} />
          </mesh>
          {[0.055, -0.055].map((dy) => (
            <mesh key={dy} position={[0, -0.02 + dy, c.d / 2 + 0.019]}>
              <boxGeometry args={[c.w * 0.34, 0.014, 0.004]} />
              <meshStandardMaterial color="#3b2a16" roughness={1} />
            </mesh>
          ))}
          {/* sello redondo en el lateral visible */}
          <mesh position={[c.w / 2 + 0.009, 0.02, 0]} rotation={[0, Math.PI / 2, 0]}>
            <circleGeometry args={[0.08, 12]} />
            <meshStandardMaterial color={c.sello} roughness={1} />
          </mesh>
        </group>
      ))}
      {/* tapa entreabierta de la caja de arriba */}
      <group position={[0, top.y + top.h / 2, 0]} rotation={[0, top.rot, 0]}>
        <group position={[0, 0.01, -top.d / 2 + 0.03]} rotation={[-0.55, 0, 0]}>
          <mesh position={[0, 0.012, top.d / 2 - 0.03]} castShadow>
            <boxGeometry args={[top.w, 0.035, top.d]} />
            <meshStandardMaterial color="#a8763d" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.032, top.d / 2 - 0.03]}>
            <boxGeometry args={[top.w * 0.42, 0.006, top.d * 0.4]} />
            <meshStandardMaterial color="#7a5330" roughness={1} />
          </mesh>
        </group>
        {/* hojas asomando dentro */}
        <mesh position={[0, -0.02, 0.04]} rotation={[-Math.PI / 2, 0, 0.3]}>
          <circleGeometry args={[top.w * 0.36, 12]} />
          <meshStandardMaterial color="#6f7f4d" roughness={1} />
        </mesh>
      </group>
      {/* viruta de madera: rizos en el borde y en el suelo */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = i * 1.05;
        const suelo = i > 2;
        return (
          <mesh
            key={i}
            position={
              suelo
                ? [Math.cos(a) * 0.52, 0.03, Math.sin(a) * 0.42]
                : [Math.cos(a) * 0.3, top.y + top.h / 2 + 0.02, Math.sin(a) * 0.22]
            }
            rotation={[Math.PI / 2 + Math.sin(i) * 0.4, 0, a]}
          >
            <torusGeometry args={[0.045 + (i % 3) * 0.012, 0.008, 5, 9, Math.PI * 1.4]} />
            <meshStandardMaterial color={i % 2 ? "#e0c08a" : "#d3b078"} roughness={1} />
          </mesh>
        );
      })}
    </group>
  );
}

/** Tarro GRANDE de suelo (modelo de Blender) sobre plato de madera, con soga de yute en la base. */
export function FloorTarro({
  position,
  scale = 1.6,
  tone = "#6b4527",
}: {
  position: [number, number, number];
  scale?: number;
  tone?: string;
}) {
  const base = 0.04; // el plato: el .glb apoya justo encima
  return (
    <group position={position}>
      <mesh position={[0, base / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.175 * scale, 0.19 * scale, base, 16]} />
        <meshStandardMaterial color={tone} roughness={0.9} />
      </mesh>
      <GLB
        url="/modelos/tarro.glb"
        position={[0, base + 0.024 * scale, 0]}
        scale={scale}
        fallback={
          <mesh castShadow position={[0, base + 0.2 * scale, 0]}>
            <cylinderGeometry args={[0.165 * scale, 0.15 * scale, 0.4 * scale, 18]} />
            <meshStandardMaterial color="#e7efe3" roughness={0.3} />
          </mesh>
        }
      />
      {/* soga de yute rodeando la panza baja */}
      <mesh position={[0, base + 0.09 * scale, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.176 * scale, 0.016, 6, 20]} />
        <meshStandardMaterial color="#c9a26a" roughness={1} />
      </mesh>
      {/* etiqueta de papel colgada de la soga */}
      <mesh position={[0.19 * scale, base + 0.045 * scale, 0.05]} rotation={[0, 0.35, 0.15]}>
        <boxGeometry args={[0.14, 0.1, 0.008]} />
        <meshStandardMaterial color="#fdf6e0" roughness={1} />
      </mesh>
    </group>
  );
}

/** Bandeja ovalada con dos tazas (modelo de Blender) y una cucharilla. Apoya en la mesa (top=1.05). */
export function CupTray({
  position,
  rotY = 0.22,
  cupScale = 1.2,
}: {
  position: [number, number, number];
  rotY?: number;
  cupScale?: number;
}) {
  const alto = 0.035; // grosor de la bandeja
  const top = alto; // cara superior relativa
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <mesh position={[0, alto / 2, 0]} scale={[1, 1, 0.68]} castShadow receiveShadow>
        <cylinderGeometry args={[0.28, 0.27, alto, 22]} />
        <meshStandardMaterial color="#7a5330" roughness={0.85} />
      </mesh>
      {/* borde levantado (aro achatado en Z) */}
      <mesh position={[0, top, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.68, 1]}>
        <torusGeometry args={[0.272, 0.015, 6, 26]} />
        <meshStandardMaterial color="#6b4527" roughness={0.8} />
      </mesh>
      {/* asas */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.285, top - 0.004, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.5, 1]}>
          <torusGeometry args={[0.045, 0.012, 5, 10, Math.PI]} />
          <meshStandardMaterial color="#6b4527" roughness={0.8} />
        </mesh>
      ))}
      {/* dos tazas */}
      {[-1, 1].map((s, i) => (
        <GLB
          key={s}
          url="/modelos/taza.glb"
          position={[s * 0.125, top + 0.006 * cupScale, i ? -0.02 : 0.02]}
          rotation={[0, s * 1.1 + 0.4, 0]}
          scale={cupScale}
          fallback={
            <mesh position={[s * 0.125, top + 0.055, 0]} castShadow>
              <cylinderGeometry args={[0.075, 0.06, 0.11, 12]} />
              <meshStandardMaterial color={i ? "#a8593f" : "#f3e4c4"} roughness={0.5} />
            </mesh>
          }
        />
      ))}
      {/* cucharilla apoyada en la bandeja */}
      <group position={[0, top + 0.012, 0.115]} rotation={[0, 0.5, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.008, 0.01, 0.15, 6]} />
          <meshStandardMaterial color="#c9a26a" roughness={0.75} />
        </mesh>
        <mesh position={[-0.095, 0, 0]} scale={[1, 0.35, 0.7]}>
          <sphereGeometry args={[0.035, 8, 7]} />
          <meshStandardMaterial color="#c9a26a" roughness={0.75} />
        </mesh>
      </group>
      {/* terroncitos de azúcar */}
      {[0, 1].map((i) => (
        <mesh key={i} position={[0.02 + i * 0.045, top + 0.018, -0.1]} rotation={[0, i * 0.6, 0]}>
          <boxGeometry args={[0.032, 0.03, 0.032]} />
          <meshStandardMaterial color="#fdf6e0" roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

/** Cuadrito de hierba prensada: marco, pasepartú, tallo con hojas y cristal. */
export function PressedHerbFrame({
  position,
  rotY = 0,
  w = 0.3,
  h = 0.4,
  tone = "#6b4527",
  herb = "#7c8a5a",
}: {
  position: [number, number, number];
  rotY?: number;
  w?: number;
  h?: number;
  tone?: string;
  herb?: string;
}) {
  const hojas = [0, 1, 2, 3, 4];
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <mesh castShadow>
        <boxGeometry args={[w, h, 0.035]} />
        <meshStandardMaterial color={tone} roughness={0.85} />
      </mesh>
      {/* pasepartú de papel */}
      <mesh position={[0, 0, 0.021]}>
        <boxGeometry args={[w - 0.06, h - 0.06, 0.006]} />
        <meshStandardMaterial color="#fdf6e0" roughness={1} />
      </mesh>
      {/* tallo */}
      <mesh position={[0, -0.02, 0.026]}>
        <boxGeometry args={[0.008, h * 0.55, 0.004]} />
        <meshStandardMaterial color="#6f7f4d" roughness={1} />
      </mesh>
      {/* hojas prensadas alternas */}
      {hojas.map((i) => {
        const s = i % 2 ? 1 : -1;
        const y = -h * 0.2 + i * (h * 0.11);
        return (
          <mesh key={i} position={[s * 0.035, y, 0.027]} rotation={[0, 0, s * 0.9]} scale={[1, 0.45, 1]}>
            <circleGeometry args={[0.042 - i * 0.004, 8]} />
            <meshStandardMaterial color={i % 2 ? herb : "#8aa25a"} roughness={1} side={THREE.DoubleSide} />
          </mesh>
        );
      })}
      {/* etiqueta manuscrita */}
      <mesh position={[0, -h / 2 + 0.05, 0.027]}>
        <boxGeometry args={[w * 0.4, 0.012, 0.003]} />
        <meshStandardMaterial color="#8a7350" roughness={1} />
      </mesh>
      {/* cristal */}
      <mesh raycast={() => null} position={[0, 0, 0.031]}>
        <planeGeometry args={[w - 0.05, h - 0.05]} />
        <meshPhysicalMaterial color="#eaf6ef" roughness={0.06} transparent opacity={0.16} depthWrite={false} />
      </mesh>
    </group>
  );
}

/** Cenefa de madera + estor recogido sobre la ventana (queda por encima de la barra de cortina). */
export function WindowValance({
  position,
  width = 2.0,
  tone = "#7c8a5a",
}: {
  position: [number, number, number];
  width?: number;
  tone?: string;
}) {
  const festones = 7;
  return (
    <group position={position}>
      {/* tabla de la cenefa */}
      <mesh castShadow>
        <boxGeometry args={[width, 0.12, 0.16]} />
        <meshStandardMaterial color={MADERA_OSC} roughness={0.75} />
      </mesh>
      <mesh position={[0, 0.07, 0.01]}>
        <boxGeometry args={[width + 0.08, 0.03, 0.19]} />
        <meshStandardMaterial color={MADERA} roughness={0.7} />
      </mesh>
      {/* festón de lino bajo la tabla */}
      {Array.from({ length: festones }).map((_, i) => {
        const x = -width / 2 + (width / festones) * (i + 0.5);
        return (
          <mesh key={i} position={[x, -0.06, 0.06]} scale={[1, 0.85, 0.3]}>
            <sphereGeometry args={[width / festones / 2, 10, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
            <meshStandardMaterial color={LINO} roughness={1} side={THREE.DoubleSide} />
          </mesh>
        );
      })}
      {/* estor enrollado */}
      <mesh position={[0, -0.14, 0.06]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.075, 0.075, width - 0.22, 12]} />
        <meshStandardMaterial color={tone} roughness={1} />
      </mesh>
      {/* pliegue que asoma */}
      <mesh position={[0, -0.24, 0.05]} rotation={[0.18, 0, 0]}>
        <boxGeometry args={[width - 0.26, 0.1, 0.02]} />
        <meshStandardMaterial color={tone} roughness={1} />
      </mesh>
      {/* cordones con borla */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * (width / 2 - 0.28), 0, 0.09]}>
          <mesh position={[0, -0.26, 0]}>
            <cylinderGeometry args={[0.006, 0.006, 0.3, 5]} />
            <meshStandardMaterial color="#c9a26a" roughness={1} />
          </mesh>
          <mesh position={[0, -0.43, 0]}>
            <coneGeometry args={[0.028, 0.07, 7]} />
            <meshStandardMaterial color="#c9a26a" roughness={1} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Felpudo trenzado de interior, con flecos, para dejar ante una puerta. */
export function BraidedMat({
  position,
  rotY = 0,
  w = 0.66,
  d = 1.0,
  tone = "#8a7350",
  tone2 = "#5f7a48",
}: {
  position: [number, number, number];
  rotY?: number;
  w?: number;
  d?: number;
  tone?: string;
  tone2?: string;
}) {
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <mesh receiveShadow>
        <boxGeometry args={[w, 0.022, d]} />
        <meshStandardMaterial color={tone} roughness={1} />
      </mesh>
      {/* dos cenefas concéntricas (marcos de cuatro tiras) */}
      {[0.86, 0.6].map((k, i) =>
        ([[0, 1], [0, -1], [1, 0], [-1, 0]] as const).map(([sx, sz], j) => (
          <mesh
            key={`${k}-${j}`}
            position={[(sx * w * k) / 2, 0.013, (sz * d * k) / 2]}
          >
            <boxGeometry args={sx ? [0.028, 0.006, d * k] : [w * k, 0.006, 0.028]} />
            <meshStandardMaterial color={i ? tone2 : "#c9a26a"} roughness={1} />
          </mesh>
        ))
      )}
      {/* trenzado: rayas cortas alternas */}
      {Array.from({ length: 7 }).map((_, i) => (
        <mesh key={i} position={[0, 0.012, -d / 2 + 0.1 + i * ((d - 0.2) / 6)]}>
          <boxGeometry args={[w * 0.72, 0.004, 0.03]} />
          <meshStandardMaterial color={i % 2 ? tone2 : "#a8763d"} roughness={1} />
        </mesh>
      ))}
      {/* flecos en los dos extremos */}
      {[-1, 1].map((s) =>
        Array.from({ length: 9 }).map((_, i) => (
          <mesh
            key={`${s}-${i}`}
            position={[-w / 2 + 0.05 + i * ((w - 0.1) / 8), 0.008, s * (d / 2 + 0.03)]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[0.006, 0.005, 0.07, 4]} />
            <meshStandardMaterial color="#d3b078" roughness={1} />
          </mesh>
        ))
      )}
    </group>
  );
}

/* ══════════ SALA PREMIUM ══════════ */

/** Campana de cristal sobre el tarro premium; se LEVANTA cuando el tarro está enfocado.
 *  raycast anulado: nunca bloquea el clic al tarro. */
export function GlassDome({ position, lifted }: { position: [number, number, number]; lifted: boolean }) {
  const g = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (!g.current) return;
    const k = Math.min(1, dt * 5);
    const ty = lifted ? position[1] + 1.05 : position[1];
    const tr = lifted ? 0.35 : 0;
    g.current.position.y += (ty - g.current.position.y) * k;
    g.current.rotation.z += (tr - g.current.rotation.z) * k;
  });
  return (
    <group ref={g} position={position}>
      <mesh raycast={() => null} position={[0, 0.3, 0]} scale={[1, 1.28, 1]} castShadow>
        <sphereGeometry args={[0.27, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
        <meshPhysicalMaterial
          color="#f2fbf5" roughness={0.03} metalness={0}
          thickness={0.2} ior={1.45} transparent opacity={0.4} side={THREE.DoubleSide} depthWrite={false}
        />
      </mesh>
      {/* pomo dorado */}
      <mesh raycast={() => null} position={[0, 0.68, 0]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color={ORO} metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
}

/** Araña colgante: aro de madera con 4 velas de llama viva (una sola pointLight). */
export function Chandelier({
  position = [0, 0, -1.9] as [number, number, number],
  ceiling = 4.5,
  height = 2.85,
}: {
  position?: [number, number, number];
  ceiling?: number;
  height?: number;
}) {
  const flames = useRef<THREE.Group>(null);
  const light = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    const f = 1 + Math.sin(clock.elapsedTime * 8.5) * 0.14 + Math.sin(clock.elapsedTime * 21) * 0.06;
    if (light.current) light.current.intensity = 4.2 * f;
    if (flames.current) flames.current.children.forEach((m, i) => {
      m.scale.setScalar(0.9 + 0.18 * Math.sin(clock.elapsedTime * 9 + i * 1.7));
    });
  });
  const hubY = height; // altura configurable del aro
  return (
    <group position={[position[0], 0, position[2]]}>
      {/* cadena central corta hacia el techo */}
      <mesh position={[0, (hubY + ceiling) / 2, 0]}>
        <cylinderGeometry args={[0.016, 0.016, ceiling - hubY, 5]} />
        <meshStandardMaterial color="#2e2013" metalness={0.4} roughness={0.6} />
      </mesh>
      {/* aro de madera */}
      <mesh position={[0, hubY, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.55, 0.05, 8, 24]} />
        <meshStandardMaterial color="#4a2f1a" roughness={0.7} />
      </mesh>
      {/* tres cadenas cortas inclinadas del aro al eje */}
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.27, hubY + 0.22, Math.sin(a) * 0.27]}
            rotation={[Math.sin(a) * 0.55, 0, -Math.cos(a) * 0.55]}>
            <cylinderGeometry args={[0.01, 0.01, 0.52, 5]} />
            <meshStandardMaterial color="#2e2013" metalness={0.4} roughness={0.6} />
          </mesh>
        );
      })}
      {/* cuatro velas sobre el aro */}
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2 + 0.4;
        const x = Math.cos(a) * 0.55, z = Math.sin(a) * 0.55;
        return (
          <group key={i} position={[x, hubY, z]}>
            <mesh position={[0, 0.09, 0]} castShadow>
              <cylinderGeometry args={[0.028, 0.032, 0.16, 8]} />
              <meshStandardMaterial color="#f6ecd4" roughness={0.8} />
            </mesh>
          </group>
        );
      })}
      <group ref={flames}>
        {[0, 1, 2, 3].map((i) => {
          const a = (i / 4) * Math.PI * 2 + 0.4;
          return (
            <mesh key={i} position={[Math.cos(a) * 0.55, hubY + 0.22, Math.sin(a) * 0.55]}>
              <sphereGeometry args={[0.026, 8, 8]} />
              <meshStandardMaterial color="#ffca5f" emissive="#ff9a1f" emissiveIntensity={3.4} />
            </mesh>
          );
        })}
      </group>
      <pointLight ref={light} position={[0, hubY + 0.3, 0]} distance={6} color="#ffbf6f" intensity={4.2} />
    </group>
  );
}

/** Fotografía de Petra y Erik con marco dorado para la pared del fondo. */
export function GoldFramePortrait({ position = [-1.2, 2.7, -4.86] as [number, number, number] }) {
  const foto = useTexture("/images/salon/petra-erik-te-premium.webp");
  foto.colorSpace = THREE.SRGBColorSpace;
  foto.wrapS = THREE.ClampToEdgeWrapping;
  foto.wrapT = THREE.ClampToEdgeWrapping;
  foto.anisotropy = 8;

  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[1.1, 1.4, 0.07]} />
        <meshStandardMaterial color={ORO} metalness={0.65} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0, 0.04]}>
        <boxGeometry args={[0.9, 1.2, 0.02]} />
        <meshStandardMaterial color="#e8d6b8" roughness={0.95} />
      </mesh>
      {/* fotografía 3:4, ligeramente por delante del paspartú */}
      <mesh position={[0, 0, 0.058]}>
        <boxGeometry args={[0.84, 1.12, 0.008]} />
        <meshStandardMaterial map={foto} color="#ffffff" roughness={0.92} metalness={0} />
      </mesh>
    </group>
  );
}

/** Cordón de terciopelo con postes dorados, como en un museo. */
export function VelvetRope({
  from = [-2.2, 0, 0.4] as [number, number, number],
  to = [2.2, 0, 0.4] as [number, number, number],
}) {
  const curve = useMemo(() => {
    const a = new THREE.Vector3(from[0], 0.78, from[2]);
    const b = new THREE.Vector3(to[0], 0.78, to[2]);
    const mid = a.clone().lerp(b, 0.5);
    mid.y = 0.52; // comba del cordón
    return new THREE.CatmullRomCurve3([a, mid, b]);
  }, [from, to]);
  const Post = ({ p }: { p: [number, number, number] }) => (
    <group position={p}>
      <mesh castShadow>
        <cylinderGeometry args={[0.14, 0.17, 0.05, 14]} />
        <meshStandardMaterial color={ORO} metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.42, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.03, 0.8, 10]} />
        <meshStandardMaterial color={ORO} metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.84, 0]}>
        <sphereGeometry args={[0.05, 10, 8]} />
        <meshStandardMaterial color={ORO} metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
  return (
    <group>
      <Post p={from} />
      <Post p={to} />
      <mesh castShadow>
        <tubeGeometry args={[curve, 20, 0.032, 7, false]} />
        <meshStandardMaterial color={GRANATE} roughness={0.95} />
      </mesh>
    </group>
  );
}

/* ══════════ DENSIDAD DE LA SALA PREMIUM ══════════ */

/** Camino de terciopelo con filo dorado: del cordón hacia los pedestales. */
export function VelvetRunner({
  position,
  w = 0.8,
  l = 3.0,
  tone = GRANATE,
}: {
  position: [number, number, number];
  w?: number;
  l?: number;
  tone?: string;
}) {
  return (
    <group position={position}>
      <mesh receiveShadow>
        <boxGeometry args={[w, 0.014, l]} />
        <meshStandardMaterial color={tone} roughness={0.98} />
      </mesh>
      {/* filo dorado a los dos lados (hilo, no metal: rugosidad alta) */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (w / 2 - 0.045), 0.006, 0]}>
          <boxGeometry args={[0.035, 0.008, l - 0.06]} />
          <meshStandardMaterial color={ORO} roughness={0.72} metalness={0.15} />
        </mesh>
      ))}
      {/* remates de los extremos */}
      {[-1, 1].map((s) => (
        <mesh key={`e${s}`} position={[0, 0.006, s * (l / 2 - 0.07)]}>
          <boxGeometry args={[w - 0.11, 0.008, 0.035]} />
          <meshStandardMaterial color={ORO} roughness={0.72} metalness={0.15} />
        </mesh>
      ))}
      {/* flecos en los dos cabos */}
      {[-1, 1].map((s) =>
        Array.from({ length: 11 }).map((_, i) => (
          <mesh
            key={`${s}-${i}`}
            position={[-w / 2 + 0.05 + i * ((w - 0.1) / 10), 0.004, s * (l / 2 + 0.03)]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[0.006, 0.005, 0.06, 4]} />
            <meshStandardMaterial color={ORO} roughness={0.7} metalness={0.15} />
          </mesh>
        ))
      )}
    </group>
  );
}

/** Vitrina esquinera: mueble alto y estrecho, dos baldas con tarros y cristal frontal. */
export function CornerVitrine({
  position,
  rotY = 0.5,
  jarScale = 0.55,
}: {
  position: [number, number, number];
  rotY?: number;
  jarScale?: number;
}) {
  const W = 0.9, D = 0.44, H = 1.66; // cuerpo (sin cornisa)
  const baldas = [0.72, 1.22];
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      {/* patas */}
      {([[-1, -1], [1, -1], [-1, 1], [1, 1]] as const).map(([sx, sz], i) => (
        <mesh key={i} position={[(sx * (W - 0.14)) / 2, 0.08, (sz * (D - 0.12)) / 2]} castShadow>
          <boxGeometry args={[0.07, 0.16, 0.07]} />
          <meshStandardMaterial color={MADERA_OSC} roughness={0.8} />
        </mesh>
      ))}
      {/* fondo y costados */}
      <mesh position={[0, 0.16 + (H - 0.16) / 2, -D / 2 + 0.02]} castShadow receiveShadow>
        <boxGeometry args={[W, H - 0.16, 0.04]} />
        <meshStandardMaterial color={MADERA_OSC} roughness={0.85} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (W / 2 - 0.025), 0.16 + (H - 0.16) / 2, 0]} castShadow>
          <boxGeometry args={[0.05, H - 0.16, D]} />
          <meshStandardMaterial color={MADERA} roughness={0.8} />
        </mesh>
      ))}
      {/* suelo del mueble */}
      <mesh position={[0, 0.19, 0]} receiveShadow>
        <boxGeometry args={[W - 0.06, 0.05, D - 0.03]} />
        <meshStandardMaterial color="#5e3d24" roughness={0.85} />
      </mesh>
      {/* dos baldas */}
      {baldas.map((y) => (
        <mesh key={y} position={[0, y, 0]} receiveShadow>
          <boxGeometry args={[W - 0.08, 0.04, D - 0.06]} />
          <meshStandardMaterial color="#6b4527" roughness={0.8} />
        </mesh>
      ))}
      {/* cornisa con filo dorado */}
      <mesh position={[0, H + 0.04, 0]} castShadow>
        <boxGeometry args={[W + 0.1, 0.08, D + 0.08]} />
        <meshStandardMaterial color={MADERA_OSC} roughness={0.75} />
      </mesh>
      <mesh position={[0, H - 0.01, D / 2 + 0.02]}>
        <boxGeometry args={[W + 0.06, 0.02, 0.02]} />
        <meshStandardMaterial color={ORO} metalness={0.7} roughness={0.3} />
      </mesh>
      {/* un tarro por balda + cajita de té en la de abajo */}
      {baldas.map((y, i) => (
        <GLB
          key={`t${y}`}
          url="/modelos/tarro.glb"
          position={[i ? 0.1 : -0.16, y + 0.02 + 0.024 * jarScale, 0]}
          rotation={[0, i ? 0.6 : -0.4, 0]}
          scale={jarScale + i * 0.06}
          fallback={
            <mesh position={[i ? 0.1 : -0.16, y + 0.13, 0]} castShadow>
              <cylinderGeometry args={[0.09, 0.08, 0.2, 14]} />
              <meshStandardMaterial color="#e7efe3" roughness={0.3} />
            </mesh>
          }
        />
      ))}
      <mesh position={[0.2, baldas[0] + 0.08, 0.02]} rotation={[0, -0.3, 0]} castShadow>
        <boxGeometry args={[0.16, 0.12, 0.11]} />
        <meshStandardMaterial color="#5c2e35" roughness={0.9} />
      </mesh>
      <mesh position={[0.2, baldas[0] + 0.145, 0.02]} rotation={[0, -0.3, 0]}>
        <boxGeometry args={[0.17, 0.012, 0.12]} />
        <meshStandardMaterial color={ORO} metalness={0.6} roughness={0.35} />
      </mesh>
      {/* cristal frontal + su marco */}
      <mesh raycast={() => null} position={[0, 0.16 + (H - 0.16) / 2, D / 2 - 0.005]}>
        <planeGeometry args={[W - 0.12, H - 0.24]} />
        <meshPhysicalMaterial
          color="#eaf6ef" roughness={0.05} transparent opacity={0.25} depthWrite={false} side={THREE.DoubleSide}
        />
      </mesh>
      {[H - 0.02, 0.22].map((y) => (
        <mesh key={y} position={[0, y, D / 2 - 0.005]}>
          <boxGeometry args={[W - 0.09, 0.03, 0.03]} />
          <meshStandardMaterial color={MADERA} roughness={0.8} />
        </mesh>
      ))}
      <mesh position={[0, 0.16 + (H - 0.16) / 2, D / 2 - 0.005]}>
        <boxGeometry args={[0.025, H - 0.24, 0.03]} />
        <meshStandardMaterial color={MADERA} roughness={0.8} />
      </mesh>
      {/* pomito dorado */}
      <mesh position={[W / 2 - 0.14, 0.86, D / 2 + 0.02]}>
        <sphereGeometry args={[0.022, 8, 8]} />
        <meshStandardMaterial color={ORO} metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
}

/** Bandeja de plata con una taza (modelo de Blender), terrón y cucharilla. */
export function SilverTray({
  position,
  rotY = -0.3,
  cupScale = 1.15,
}: {
  position: [number, number, number];
  rotY?: number;
  cupScale?: number;
}) {
  const alto = 0.028;
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <mesh position={[0, alto / 2, 0]} scale={[1, 1, 0.68]} castShadow receiveShadow>
        <cylinderGeometry args={[0.19, 0.185, alto, 20]} />
        <meshStandardMaterial color="#d6dade" metalness={0.55} roughness={0.32} />
      </mesh>
      <mesh position={[0, alto, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.68, 1]}>
        <torusGeometry args={[0.184, 0.012, 6, 24]} />
        <meshStandardMaterial color="#e6eaee" metalness={0.6} roughness={0.28} />
      </mesh>
      <GLB
        url="/modelos/taza.glb"
        position={[-0.03, alto + 0.006 * cupScale, 0]}
        rotation={[0, 0.9, 0]}
        scale={cupScale}
        fallback={
          <mesh position={[-0.03, alto + 0.06, 0]} castShadow>
            <cylinderGeometry args={[0.07, 0.055, 0.1, 12]} />
            <meshStandardMaterial color="#f6ecd4" roughness={0.45} />
          </mesh>
        }
      />
      {/* cucharilla de plata */}
      <group position={[0.09, alto + 0.01, 0.07]} rotation={[0, -0.7, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.006, 0.008, 0.12, 6]} />
          <meshStandardMaterial color="#d6dade" metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[-0.075, 0, 0]} scale={[1, 0.35, 0.7]}>
          <sphereGeometry args={[0.028, 8, 7]} />
          <meshStandardMaterial color="#d6dade" metalness={0.6} roughness={0.3} />
        </mesh>
      </group>
      {/* terrón de azúcar con su pinza */}
      <mesh position={[0.075, alto + 0.017, -0.05]} rotation={[0, 0.4, 0]}>
        <boxGeometry args={[0.03, 0.028, 0.03]} />
        <meshStandardMaterial color="#fdf6e0" roughness={1} />
      </mesh>
    </group>
  );
}

/** Cuadrito de marco dorado para acompañar al retrato grande. */
export function GoldMiniFrame({
  position,
  rotY = 0,
  w = 0.34,
  h = 0.42,
  fondo = "#e8d6b8",
  motivo = GRANATE,
}: {
  position: [number, number, number];
  rotY?: number;
  w?: number;
  h?: number;
  fondo?: string;
  motivo?: string;
}) {
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <mesh castShadow>
        <boxGeometry args={[w, h, 0.05]} />
        <meshStandardMaterial color={ORO} metalness={0.65} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0, 0.028]}>
        <boxGeometry args={[w - 0.08, h - 0.08, 0.015]} />
        <meshStandardMaterial color={fondo} roughness={0.95} />
      </mesh>
      {/* motivo: tacita con su platillo */}
      <mesh position={[0, -0.03, 0.037]} scale={[1, 0.7, 0.4]}>
        <sphereGeometry args={[0.062, 12, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
        <meshStandardMaterial color={motivo} roughness={0.9} />
      </mesh>
      <mesh position={[0, -0.075, 0.036]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.085, 14]} />
        <meshStandardMaterial color={motivo} roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      {/* vapor estilizado */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.025, 0.075, 0.036]} rotation={[0, 0, s * 0.3]}>
          <boxGeometry args={[0.01, 0.07, 0.004]} />
          <meshStandardMaterial color={motivo} roughness={0.9} transparent opacity={0.7} />
        </mesh>
      ))}
      {/* cartela dorada */}
      <mesh position={[0, -h / 2 - 0.03, 0.02]}>
        <boxGeometry args={[w * 0.42, 0.05, 0.02]} />
        <meshStandardMaterial color={ORO} metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
}

/** Palmita de interior: maceta vidriada y 7 hojas largas arqueadas (segmentos encadenados). */
export function PalmPlant({
  position,
  rotY = 0,
  hojas = 7,
  maceta = "#4e5f45",
  verde = "#5f7a48",
}: {
  position: [number, number, number];
  rotY?: number;
  hojas?: number;
  maceta?: string;
  verde?: string;
}) {
  // cada hoja = 5 segmentos que se van inclinando: nace vertical y cae arqueada
  const segs = useMemo(() => {
    const out: { p: [number, number, number]; rx: number; len: number; wid: number }[] = [];
    let y = 0, z = 0, ang = 0;
    for (let j = 0; j < 5; j++) {
      const len = 0.3 * Math.pow(0.9, j);
      const wid = 0.105 * Math.pow(0.74, j);
      out.push({ p: [0, y + (Math.cos(ang) * len) / 2, z + (Math.sin(ang) * len) / 2], rx: ang, len, wid });
      y += Math.cos(ang) * len;
      z += Math.sin(ang) * len;
      ang += 0.32 + j * 0.12;
    }
    return out;
  }, []);
  const H = 0.42; // alto de la maceta
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      {/* maceta vidriada con filo */}
      <mesh position={[0, H / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.24, 0.18, H, 16]} />
        <meshStandardMaterial color={maceta} roughness={0.55} />
      </mesh>
      <mesh position={[0, H - 0.01, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.243, 0.022, 7, 20]} />
        <meshStandardMaterial color="#3d4b36" roughness={0.6} />
      </mesh>
      <mesh position={[0, H * 0.62, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.222, 0.01, 6, 20]} />
        <meshStandardMaterial color={ORO} metalness={0.6} roughness={0.4} />
      </mesh>
      {/* tierra */}
      <mesh position={[0, H - 0.03, 0]}>
        <cylinderGeometry args={[0.222, 0.222, 0.04, 16]} />
        <meshStandardMaterial color="#4a3320" roughness={1} />
      </mesh>
      {/* las hojas */}
      {Array.from({ length: hojas }).map((_, i) => {
        const az = (i / hojas) * Math.PI * 2 + 0.35;
        const tono = i % 3 === 0 ? verde : i % 3 === 1 ? "#6f7f4d" : "#7c8a5a";
        const esc = 0.82 + ((i * 5) % 3) * 0.11;
        return (
          <group key={i} position={[0, H - 0.02, 0]} rotation={[0, az, 0]} scale={esc}>
            <group rotation={[0, 0, Math.sin(i * 1.9) * 0.12]}>
              {segs.map((s, j) => (
                <mesh key={j} position={s.p} rotation={[s.rx, 0, 0]}>
                  <boxGeometry args={[s.wid, s.len, 0.012]} />
                  <meshStandardMaterial color={tono} roughness={0.92} side={THREE.DoubleSide} />
                </mesh>
              ))}
            </group>
          </group>
        );
      })}
      {/* dos brotes cortos en el centro */}
      {[0.35, -1.1].map((a, i) => (
        <mesh key={i} position={[Math.cos(a) * 0.05, H + 0.16, Math.sin(a) * 0.05]} rotation={[0, a, 0.12]}>
          <coneGeometry args={[0.035, 0.34, 6]} />
          <meshStandardMaterial color="#8aa25a" roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}
