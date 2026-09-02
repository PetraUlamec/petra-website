"use client";
// Atrezzo fino del TALLER (Nosotros) y del ESCRITORIO (Contacto).
// Piezas low-poly cálidas; ninguna toca los componentes compartidos.
import * as THREE from "three";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import GLB from "../Modelos";

const MAD = { clara: "#a8763d", media: "#8a5f38", oscura: "#6b4527", marco: "#4a2f1a" } as const;

/* ═══════════ UTILIDAD: cuerda entre dos puntos (con caída) ═══════════ */

export type P3 = [number, number, number];

/** Punto de la cuerda en t∈[0,1] con caída senoidal (catenaria aproximada) */
export function ropePoint(a: P3, b: P3, t: number, sag: number): P3 {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t - Math.sin(Math.PI * t) * sag,
    a[2] + (b[2] - a[2]) * t,
  ];
}

/** Cuerda de cáñamo entre dos puntos del mundo, en segmentos rectos */
export function Rope({
  a, b, sag = 0.12, r = 0.009, color = "#c9a26a", segs = 16,
}: { a: P3; b: P3; sag?: number; r?: number; color?: string; segs?: number }) {
  const [ax, ay, az] = a;
  const [bx, by, bz] = b;
  const trozos = useMemo(() => {
    const up = new THREE.Vector3(0, 1, 0);
    const A: P3 = [ax, ay, az];
    const B: P3 = [bx, by, bz];
    const out: { p: P3; q: THREE.Quaternion; len: number }[] = [];
    for (let i = 0; i < segs; i++) {
      const p0 = new THREE.Vector3(...ropePoint(A, B, i / segs, sag));
      const p1 = new THREE.Vector3(...ropePoint(A, B, (i + 1) / segs, sag));
      const mid = p0.clone().add(p1).multiplyScalar(0.5);
      const dir = p1.clone().sub(p0);
      const len = dir.length();
      out.push({ p: [mid.x, mid.y, mid.z], q: new THREE.Quaternion().setFromUnitVectors(up, dir.normalize()), len });
    }
    return out;
  }, [ax, ay, az, bx, by, bz, sag, segs]);
  return (
    <group>
      {trozos.map((s, i) => (
        <mesh key={i} position={s.p} quaternion={s.q}>
          <cylinderGeometry args={[r, r, s.len * 1.04, 4]} />
          <meshStandardMaterial color={color} roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

/** Pinza de madera de tender */
function Peg({ position }: { position: P3 }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[0.035, 0.075, 0.022]} />
        <meshStandardMaterial color="#d9c39a" roughness={1} />
      </mesh>
      <mesh position={[0, 0.012, 0]}>
        <boxGeometry args={[0.042, 0.012, 0.026]} />
        <meshStandardMaterial color="#9c9488" metalness={0.5} roughness={0.5} />
      </mesh>
    </group>
  );
}

/* ═══════════ TALLER ═══════════ */

/** Tornillo de banco de Erik: dos mordazas + husillo con maneta */
export function BenchVise({ position, rotY = 0 }: { position: [number, number, number]; rotY?: number }) {
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <mesh castShadow position={[0, 0.06, 0]}>
        <boxGeometry args={[0.3, 0.12, 0.1]} />
        <meshStandardMaterial color={MAD.oscura} roughness={0.8} />
      </mesh>
      <mesh castShadow position={[0, 0.06, 0.16]}>
        <boxGeometry args={[0.3, 0.12, 0.08]} />
        <meshStandardMaterial color={MAD.media} roughness={0.8} />
      </mesh>
      {/* husillo */}
      <mesh position={[0, 0.04, 0.26]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.018, 0.018, 0.22, 8]} />
        <meshStandardMaterial color="#9c9488" metalness={0.6} roughness={0.35} />
      </mesh>
      {/* maneta en T */}
      <mesh position={[0, 0.04, 0.38]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.012, 0.012, 0.16, 6]} />
        <meshStandardMaterial color="#8a8074" metalness={0.6} roughness={0.35} />
      </mesh>
    </group>
  );
}

/** Serrucho colgado en la pared */
export function HandSaw({ position, rotY = 0 }: { position: [number, number, number]; rotY?: number }) {
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      {/* clavo */}
      <mesh position={[0, 0.14, 0]}>
        <sphereGeometry args={[0.02, 6, 6]} />
        <meshStandardMaterial color="#5a5248" metalness={0.5} roughness={0.4} />
      </mesh>
      <group rotation={[0, 0, -0.5]}>
        {/* hoja trapezoidal (dos cajas escalonadas) */}
        <mesh castShadow position={[0.02, -0.1, 0.02]}>
          <boxGeometry args={[0.14, 0.5, 0.015]} />
          <meshStandardMaterial color="#c8c0b0" metalness={0.55} roughness={0.35} />
        </mesh>
        <mesh castShadow position={[0.07, -0.22, 0.02]}>
          <boxGeometry args={[0.07, 0.34, 0.015]} />
          <meshStandardMaterial color="#c8c0b0" metalness={0.55} roughness={0.35} />
        </mesh>
        {/* mango con hueco (marco de cajitas) */}
        <mesh castShadow position={[0, 0.14, 0.02]}>
          <boxGeometry args={[0.16, 0.06, 0.035]} />
          <meshStandardMaterial color={MAD.oscura} roughness={0.75} />
        </mesh>
        <mesh castShadow position={[-0.06, 0.06, 0.02]}>
          <boxGeometry args={[0.05, 0.12, 0.035]} />
          <meshStandardMaterial color={MAD.oscura} roughness={0.75} />
        </mesh>
        <mesh castShadow position={[0.06, 0.06, 0.02]}>
          <boxGeometry args={[0.05, 0.12, 0.035]} />
          <meshStandardMaterial color={MAD.oscura} roughness={0.75} />
        </mesh>
      </group>
    </group>
  );
}

/** Tres cucharas a medio tallar sobre el banco */
export function CarvedSpoons({ position, rotY = 0 }: { position: [number, number, number]; rotY?: number }) {
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      {/* solo el cazo */}
      <mesh castShadow position={[-0.18, 0.03, 0]} rotation={[0.15, 0.4, 0]}>
        <sphereGeometry args={[0.055, 10, 8, 0, Math.PI * 2, 0, Math.PI / 1.9]} />
        <meshStandardMaterial color="#c9a26a" roughness={0.85} side={THREE.DoubleSide} />
      </mesh>
      {/* mango sin pulir + cazo basto */}
      <group position={[0.02, 0.025, 0.08]} rotation={[0, -0.5, 0]}>
        <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.022, 0.028, 0.24, 5]} />
          <meshStandardMaterial color="#b98a4e" roughness={1} />
        </mesh>
        <mesh castShadow position={[-0.15, 0.01, 0]} scale={[1.3, 0.55, 1]}>
          <sphereGeometry args={[0.05, 8, 6]} />
          <meshStandardMaterial color="#b98a4e" roughness={1} />
        </mesh>
      </group>
      {/* taco marcado con la silueta */}
      <group position={[0.22, 0.03, -0.05]} rotation={[0, 0.3, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.28, 0.06, 0.12]} />
          <meshStandardMaterial color={MAD.clara} roughness={0.95} />
        </mesh>
        <mesh position={[-0.04, 0.031, 0]}>
          <boxGeometry args={[0.16, 0.004, 0.05]} />
          <meshStandardMaterial color={MAD.oscura} roughness={1} />
        </mesh>
        <mesh position={[0.09, 0.031, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 0.004, 10]} />
          <meshStandardMaterial color={MAD.oscura} roughness={1} />
        </mesh>
      </group>
    </group>
  );
}

/** Virutas por el suelo alrededor del banco */
export function FloorShavings({ position, spread = 1.4, count = 8 }: { position: [number, number, number]; spread?: number; count?: number }) {
  const curls = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: Math.sin(i * 2.39996) * spread * (0.35 + ((i * 37) % 10) / 16),
        z: Math.cos(i * 2.39996) * spread * (0.3 + ((i * 53) % 10) / 18),
        rot: i * 1.7,
        r: 0.026 + ((i * 13) % 5) * 0.004,
      })),
    [spread, count]
  );
  return (
    <group position={position}>
      {curls.map((c, i) => (
        <mesh key={i} position={[c.x, 0.02, c.z]} rotation={[Math.PI / 2, 0, c.rot]}>
          <torusGeometry args={[c.r, 0.008, 5, 10, Math.PI * 1.55]} />
          <meshStandardMaterial color="#e0c496" roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

/** Estante de pared de Petra con tarritos de hierbas */
export function HerbJarShelf({ position, rotY = 0 }: { position: [number, number, number]; rotY?: number }) {
  const tints = ["#9DB56B", "#C9B36A", "#B4713C", "#7c8a5a", "#c7402e", "#8d79c9"];
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <mesh castShadow>
        <boxGeometry args={[1.6, 0.06, 0.26]} />
        <meshStandardMaterial color={MAD.oscura} roughness={0.8} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} castShadow position={[s * 0.7, -0.09, 0.08]} rotation={[0, 0, s * 0.5]}>
          <boxGeometry args={[0.05, 0.18, 0.05]} />
          <meshStandardMaterial color={MAD.marco} roughness={0.8} />
        </mesh>
      ))}
      {tints.map((c, i) => (
        <group key={i} position={[-0.66 + i * 0.265, 0.115, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.055, 0.05, 0.17, 10]} />
            <meshStandardMaterial color="#dff1e8" roughness={0.15} transparent opacity={0.75} />
          </mesh>
          <mesh position={[0, -0.02, 0]}>
            <cylinderGeometry args={[0.045, 0.04, 0.1, 8]} />
            <meshStandardMaterial color={c} roughness={1} />
          </mesh>
          <mesh position={[0, 0.1, 0]}>
            <cylinderGeometry args={[0.058, 0.058, 0.025, 10]} />
            <meshStandardMaterial color={MAD.oscura} roughness={0.7} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Colador y cazo colgados de ganchos bajo el estante */
export function HangingUtensils({ position, rotY = 0 }: { position: [number, number, number]; rotY?: number }) {
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      {/* colador/tamiz */}
      <group position={[-0.3, 0, 0.06]}>
        <mesh position={[0, 0.09, 0]}>
          <sphereGeometry args={[0.018, 6, 6]} />
          <meshStandardMaterial color="#5a5248" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh castShadow rotation={[Math.PI / 2.3, 0, 0]}>
          <torusGeometry args={[0.09, 0.014, 6, 16]} />
          <meshStandardMaterial color="#b08d57" metalness={0.55} roughness={0.35} />
        </mesh>
        <mesh rotation={[Math.PI / 2.3, 0, 0]} position={[0, -0.01, 0.015]}>
          <circleGeometry args={[0.085, 16]} />
          <meshStandardMaterial color="#d8cdb4" roughness={0.9} side={THREE.DoubleSide} />
        </mesh>
        <mesh castShadow position={[0, -0.14, 0.05]} rotation={[0.4, 0, 0]}>
          <cylinderGeometry args={[0.012, 0.016, 0.16, 6]} />
          <meshStandardMaterial color={MAD.media} roughness={0.9} />
        </mesh>
      </group>
      {/* cazo */}
      <group position={[0.3, 0, 0.06]}>
        <mesh position={[0, 0.09, 0]}>
          <sphereGeometry args={[0.018, 6, 6]} />
          <meshStandardMaterial color="#5a5248" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh castShadow position={[0, -0.05, 0]} rotation={[0.35, 0, 0]}>
          <sphereGeometry args={[0.07, 10, 8, 0, Math.PI * 2, 0, Math.PI / 1.8]} />
          <meshStandardMaterial color="#b08d57" metalness={0.5} roughness={0.4} side={THREE.DoubleSide} />
        </mesh>
        <mesh castShadow position={[0, 0.03, -0.02]} rotation={[0.35, 0, 0]}>
          <cylinderGeometry args={[0.01, 0.012, 0.14, 6]} />
          <meshStandardMaterial color="#8a8074" metalness={0.5} roughness={0.4} />
        </mesh>
      </group>
    </group>
  );
}

/** Cuaderno de recetas abierto */
export function RecipeBook({ position, rotY = 0 }: { position: [number, number, number]; rotY?: number }) {
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.115, 0.012, 0]} rotation={[0, 0, s * -0.12]}>
          <mesh castShadow>
            <boxGeometry args={[0.23, 0.015, 0.3]} />
            <meshStandardMaterial color="#fdf6e0" roughness={1} />
          </mesh>
          {[0, 1, 2, 3].map((l) => (
            <mesh key={l} position={[0, 0.009, -0.09 + l * 0.055]}>
              <boxGeometry args={[0.16, 0.002, 0.008]} />
              <meshStandardMaterial color="#8a7350" roughness={1} />
            </mesh>
          ))}
        </group>
      ))}
      {/* lomo */}
      <mesh position={[0, 0.008, 0]}>
        <boxGeometry args={[0.02, 0.02, 0.3]} />
        <meshStandardMaterial color="#8a4049" roughness={0.85} />
      </mesh>
    </group>
  );
}

/** Retrato enmarcado de un fundador (low-poly abstracto, con cariño) */
export function Portrait({ position, rotY = 0, who }: { position: [number, number, number]; rotY?: number; who: "petra" | "erik" }) {
  const petra = who === "petra";
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      {/* marco: el de Petra ovalado-cálido, el de Erik recto de nogal */}
      {petra ? (
        <mesh castShadow>
          <cylinderGeometry args={[0.3, 0.3, 0.05, 18]} />
          <meshStandardMaterial color="#b08d57" metalness={0.35} roughness={0.5} />
        </mesh>
      ) : (
        <mesh castShadow>
          <boxGeometry args={[0.56, 0.66, 0.05]} />
          <meshStandardMaterial color={MAD.marco} roughness={0.7} />
        </mesh>
      )}
      {/* fondo del lienzo */}
      <mesh position={[0, 0, petra ? 0.028 : 0.028]} rotation={petra ? [Math.PI / 2, 0, 0] : [0, 0, 0]}>
        {petra ? <cylinderGeometry args={[0.25, 0.25, 0.01, 18]} /> : <boxGeometry args={[0.46, 0.56, 0.01]} />}
        <meshStandardMaterial color={petra ? "#e9cf9e" : "#d9c39a"} roughness={0.95} />
      </mesh>
      {/* silueta: busto */}
      <group position={[0, -0.05, 0.045]}>
        <mesh>
          <sphereGeometry args={[0.085, 12, 10]} />
          <meshStandardMaterial color={petra ? "#c98f56" : "#b57c46"} roughness={0.9} />
        </mesh>
        <mesh position={[0, -0.12, 0]} scale={[1.5, 1, 0.9]}>
          <sphereGeometry args={[0.09, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={petra ? "#8a4049" : "#54654a"} roughness={0.95} />
        </mesh>
        {petra ? (
          /* moño */
          <mesh position={[0, 0.1, -0.02]}>
            <sphereGeometry args={[0.045, 8, 8]} />
            <meshStandardMaterial color="#6f5a3d" roughness={1} />
          </mesh>
        ) : (
          /* barba */
          <mesh position={[0, -0.045, 0.055]} scale={[0.85, 1, 0.6]}>
            <sphereGeometry args={[0.055, 8, 8]} />
            <meshStandardMaterial color="#8a7350" roughness={1} />
          </mesh>
        )}
      </group>
    </group>
  );
}

/** Taburete de tres patas */
export function ThreeLegStool({ position, rotY = 0 }: { position: [number, number, number]; rotY?: number }) {
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <mesh castShadow position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.22, 0.24, 0.06, 12]} />
        <meshStandardMaterial color={MAD.clara} roughness={0.85} />
      </mesh>
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2;
        return (
          <mesh key={i} castShadow position={[Math.cos(a) * 0.14, 0.24, Math.sin(a) * 0.14]} rotation={[Math.sin(a) * 0.18, 0, -Math.cos(a) * 0.18]}>
            <cylinderGeometry args={[0.025, 0.035, 0.5, 7]} />
            <meshStandardMaterial color={MAD.oscura} roughness={0.85} />
          </mesh>
        );
      })}
    </group>
  );
}

/** Estante alto con la reserva de MADERAS de Erik: tablones y tacos de tres tonos */
export function LumberShelf({ position, rotY = 0, w = 1.7 }: { position: P3; rotY?: number; w?: number }) {
  const tonos = ["#c9a26a", "#a8763d", "#7a5330"];
  const tablones = useMemo(
    () =>
      Array.from({ length: 4 }, (_, i) => ({
        y: 0.075 + i * 0.062,
        z: -0.02 + ((i * 7) % 3) * 0.035,
        len: w - 0.18 - (i % 2) * 0.22,
        dx: (i % 2 ? 1 : -1) * 0.05,
        rot: (i % 2 ? 1 : -1) * 0.014,
        tono: tonos[i % 3],
      })),
    [w]
  );
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      {/* balda */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[w, 0.07, 0.42]} />
        <meshStandardMaterial color={MAD.oscura} roughness={0.85} />
      </mesh>
      {/* escuadras de refuerzo */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * (w / 2 - 0.18), -0.05, -0.02]}>
          <mesh castShadow position={[0, -0.1, 0.02]}>
            <boxGeometry args={[0.05, 0.22, 0.05]} />
            <meshStandardMaterial color={MAD.marco} roughness={0.85} />
          </mesh>
          <mesh castShadow position={[0, -0.11, -0.09]} rotation={[0.72, 0, 0]}>
            <boxGeometry args={[0.045, 0.3, 0.045]} />
            <meshStandardMaterial color={MAD.marco} roughness={0.85} />
          </mesh>
        </group>
      ))}
      {/* tablones apilados */}
      {tablones.map((t, i) => (
        <mesh key={i} castShadow position={[t.dx, t.y, t.z]} rotation={[0, t.rot, 0]}>
          <boxGeometry args={[t.len, 0.055, 0.14]} />
          <meshStandardMaterial color={t.tono} roughness={0.95} />
        </mesh>
      ))}
      {/* tacos de pie, apoyados contra la pared */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} castShadow position={[w / 2 - 0.16 - i * 0.13, 0.16 + (i % 2) * 0.03, -0.13]} rotation={[0.06, (i - 1) * 0.16, (i - 1) * 0.05]}>
          <boxGeometry args={[0.1, 0.26 + (i % 2) * 0.06, 0.1]} />
          <meshStandardMaterial color={tonos[(i + 1) % 3]} roughness={0.95} />
        </mesh>
      ))}
      {/* recorte corto tumbado al borde */}
      <mesh castShadow position={[-w / 2 + 0.22, 0.075, 0.13]} rotation={[0, 0.22, 0]}>
        <boxGeometry args={[0.34, 0.09, 0.11]} />
        <meshStandardMaterial color={MAD.clara} roughness={0.95} />
      </mesh>
    </group>
  );
}

/** Tarro (GLB) con gubias y lápices de carpintero sobre el banco */
export function ToolJar({ position, rotY = 0 }: { position: P3; rotY?: number }) {
  const palos = [
    { x: -0.035, z: 0.02, tilt: [0.12, 0, -0.2], color: MAD.oscura, punta: "#c8c0b0", h: 0.3 },
    { x: 0.03, z: -0.03, tilt: [-0.1, 0, 0.16], color: "#54654a", punta: "#c8c0b0", h: 0.26 },
    { x: 0.045, z: 0.045, tilt: [0.2, 0, 0.28], color: "#8a4049", punta: "#e9cf9e", h: 0.22 },
    { x: -0.05, z: -0.04, tilt: [-0.18, 0, -0.3], color: "#b08d57", punta: "#e9cf9e", h: 0.24 },
  ] as const;
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <GLB
        url="/modelos/tarro.glb"
        scale={0.5}
        fallback={
          <mesh castShadow position={[0, 0.1, 0]}>
            <cylinderGeometry args={[0.085, 0.075, 0.2, 12]} />
            <meshStandardMaterial color="#b98a4e" roughness={0.9} />
          </mesh>
        }
      />
      {palos.map((p, i) => (
        <group key={i} position={[p.x, 0.17, p.z]} rotation={[p.tilt[0], 0, p.tilt[2]]}>
          <mesh castShadow position={[0, p.h / 2, 0]}>
            <cylinderGeometry args={[0.011, 0.014, p.h, 6]} />
            <meshStandardMaterial color={p.color} roughness={0.85} />
          </mesh>
          <mesh castShadow position={[0, p.h + 0.03, 0]}>
            <coneGeometry args={[0.012, 0.07, 5]} />
            <meshStandardMaterial color={p.punta} metalness={0.35} roughness={0.5} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Cuerda de tender del taller: las cucharas talladas (GLB) secándose a la vista.
 *  Va de una escarpia en la pared (a) a un puntal de madera apoyado en el suelo (b). */
export function DryingLine({ a, b, n = 4 }: { a: P3; b: P3; n?: number }) {
  const sag = 0.14;
  const [ax, ay, az] = a;
  const [bx, by, bz] = b;
  const puntos = useMemo(
    () => Array.from({ length: n }, (_, i) => ropePoint([ax, ay, az], [bx, by, bz], 0.16 + (i * 0.68) / (n - 1), sag)),
    [ax, ay, az, bx, by, bz, n]
  );
  return (
    <group>
      {/* escarpia en la pared */}
      <group position={a}>
        <mesh castShadow>
          <sphereGeometry args={[0.025, 8, 6]} />
          <meshStandardMaterial color="#5a5248" metalness={0.5} roughness={0.45} />
        </mesh>
      </group>
      {/* puntal del taller: madera de verdad hasta el suelo */}
      <group position={[b[0], 0, b[2]]}>
        <mesh castShadow position={[0, (b[1] + 0.14) / 2, 0]}>
          <cylinderGeometry args={[0.065, 0.08, b[1] + 0.14, 8]} />
          <meshStandardMaterial color={MAD.media} roughness={0.9} />
        </mesh>
        <mesh castShadow position={[0, 0.05, 0]}>
          <boxGeometry args={[0.26, 0.1, 0.26]} />
          <meshStandardMaterial color={MAD.marco} roughness={0.9} />
        </mesh>
        <mesh castShadow position={[0, b[1] + 0.17, 0]}>
          <boxGeometry args={[0.26, 0.08, 0.26]} />
          <meshStandardMaterial color={MAD.oscura} roughness={0.85} />
        </mesh>
      </group>
      <Rope a={a} b={b} sag={sag} />
      {puntos.map((p, i) => (
        <group key={i} position={p}>
          <Peg position={[0, -0.03, 0]} />
          <GLB
            url="/modelos/cuchara.glb"
            position={[0, -0.44, 0]}
            rotation={[Math.PI / 2, 0, Math.sin(i * 1.9) * 0.22]}
            scale={0.9 + (i % 3) * 0.07}
            fallback={
              <mesh castShadow position={[0, -0.28, 0]}>
                <cylinderGeometry args={[0.02, 0.028, 0.42, 8]} />
                <meshStandardMaterial color="#b98a4e" roughness={0.85} />
              </mesh>
            }
          />
        </group>
      ))}
    </group>
  );
}

/** Saco de arpillera rebosando virutas junto al banco */
export function ShavingSack({ position, rotY = 0 }: { position: P3; rotY?: number }) {
  const rizos = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => ({
        x: Math.sin(i * 2.39996) * 0.12,
        z: Math.cos(i * 2.39996) * 0.12,
        y: 0.44 + (i % 3) * 0.035,
        rot: i * 1.3,
      })),
    []
  );
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      {/* cuerpo del saco: panzudo abajo, boca abierta arriba */}
      <mesh castShadow receiveShadow position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.21, 0.26, 0.4, 12]} />
        <meshStandardMaterial color="#c2a878" roughness={1} />
      </mesh>
      {/* boca vuelta hacia fuera */}
      <mesh castShadow position={[0, 0.42, 0]}>
        <cylinderGeometry args={[0.235, 0.2, 0.1, 12, 1, true]} />
        <meshStandardMaterial color="#ab9264" roughness={1} side={THREE.DoubleSide} />
      </mesh>
      {/* cordel a media altura */}
      <mesh position={[0, 0.36, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.205, 0.012, 5, 14]} />
        <meshStandardMaterial color="#8a7350" roughness={1} />
      </mesh>
      {/* virutas asomando */}
      {rizos.map((c, i) => (
        <mesh key={i} castShadow position={[c.x, c.y, c.z]} rotation={[Math.PI / 2.4, 0, c.rot]}>
          <torusGeometry args={[0.05, 0.011, 5, 10, Math.PI * 1.5]} />
          <meshStandardMaterial color="#e0c496" roughness={1} />
        </mesh>
      ))}
      {/* dos que se han caído al suelo */}
      {[[0.3, 0.02, 0.16], [-0.26, 0.02, 0.24]].map((p, i) => (
        <mesh key={i} position={p as P3} rotation={[Math.PI / 2, 0, i * 2.1]}>
          <torusGeometry args={[0.04, 0.009, 5, 10, Math.PI * 1.6]} />
          <meshStandardMaterial color="#e0c496" roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

/** Taza (GLB) sobre platillo; con `steam` echa vapor de verdad */
export function TeaCup({ position, rotY = 0, steam = false, scale = 1.15 }: { position: P3; rotY?: number; steam?: boolean; scale?: number }) {
  const v = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!v.current) return;
    v.current.children.forEach((m, i) => {
      const t = (clock.elapsedTime * 0.5 + i * 0.5) % 1;
      m.position.set(Math.sin((t + i) * 3.4) * 0.035, 0.14 + t * 0.34, 0);
      m.scale.setScalar(0.035 + t * 0.075);
      (m as THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>).material.opacity = 0.34 * (1 - t);
    });
  });
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      {/* platillo */}
      <mesh castShadow receiveShadow position={[0, 0.008, 0]}>
        <cylinderGeometry args={[0.125, 0.105, 0.016, 14]} />
        <meshStandardMaterial color="#f3e4c4" roughness={0.55} />
      </mesh>
      <GLB
        url="/modelos/taza.glb"
        position={[0, 0.016, 0]}
        scale={scale}
        fallback={
          <mesh castShadow position={[0, 0.08, 0]}>
            <cylinderGeometry args={[0.075, 0.06, 0.12, 14]} />
            <meshStandardMaterial color="#fdf6e0" roughness={0.4} />
          </mesh>
        }
      />
      {steam && (
        <group ref={v}>
          {[0, 1].map((i) => (
            <mesh key={i}>
              <sphereGeometry args={[1, 8, 8]} />
              <meshStandardMaterial color="#fff8ec" transparent opacity={0.3} depthWrite={false} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}

/* ═══════════ ESCRITORIO (Contacto) ═══════════ */

/** Tintero con tapa */
export function Inkwell({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <cylinderGeometry args={[0.045, 0.055, 0.07, 10]} />
        <meshStandardMaterial color="#2e2013" roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.028, 0.032, 0.03, 8]} />
        <meshStandardMaterial color="#b08d57" metalness={0.55} roughness={0.35} />
      </mesh>
    </group>
  );
}

/** Sobre con sello de lacre granate */
export function SealedEnvelope({ position, rotY = 0 }: { position: [number, number, number]; rotY?: number }) {
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <mesh castShadow>
        <boxGeometry args={[0.3, 0.012, 0.2]} />
        <meshStandardMaterial color="#f3e4c4" roughness={1} />
      </mesh>
      {/* solapa insinuada */}
      <mesh position={[0, 0.008, -0.03]} rotation={[0.06, 0, 0]}>
        <boxGeometry args={[0.28, 0.004, 0.12]} />
        <meshStandardMaterial color="#e9d9b8" roughness={1} />
      </mesh>
      <mesh position={[0, 0.016, 0.01]}>
        <cylinderGeometry args={[0.028, 0.032, 0.014, 10]} />
        <meshStandardMaterial color="#8a4049" roughness={0.4} />
      </mesh>
    </group>
  );
}

/** Dos sobres apilados */
export function EnvelopeStack({ position, rotY = 0 }: { position: [number, number, number]; rotY?: number }) {
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <mesh castShadow>
        <boxGeometry args={[0.28, 0.012, 0.19]} />
        <meshStandardMaterial color="#f3e4c4" roughness={1} />
      </mesh>
      <mesh castShadow position={[0.02, 0.014, 0.01]} rotation={[0, 0.18, 0]}>
        <boxGeometry args={[0.28, 0.012, 0.19]} />
        <meshStandardMaterial color="#fdf6e0" roughness={1} />
      </mesh>
    </group>
  );
}

/** Organizador de madera con tres cartas asomando */
export function LetterOrganizer({ position, rotY = 0 }: { position: [number, number, number]; rotY?: number }) {
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <mesh castShadow position={[0, 0.05, 0]}>
        <boxGeometry args={[0.4, 0.1, 0.14]} />
        <meshStandardMaterial color={MAD.oscura} roughness={0.8} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} castShadow position={[0, 0.13 + i * 0.005, -0.045 + i * 0.045]} rotation={[-0.15 + i * 0.06, 0, (i - 1) * 0.05]}>
          <boxGeometry args={[0.3, 0.16, 0.008]} />
          <meshStandardMaterial color={["#fdf6e0", "#f3e4c4", "#e9d9b8"][i]} roughness={1} />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={s} castShadow position={[s * 0.19, 0.12, 0]}>
          <boxGeometry args={[0.02, 0.16, 0.14]} />
          <meshStandardMaterial color={MAD.marco} roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

/** Buzón antiguo de pared */
export function WallMailbox({ position, rotY = 0 }: { position: [number, number, number]; rotY?: number }) {
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <mesh castShadow>
        <boxGeometry args={[0.4, 0.5, 0.14]} />
        <meshStandardMaterial color={MAD.media} roughness={0.85} />
      </mesh>
      {/* techito */}
      <mesh castShadow position={[0, 0.28, 0.02]} rotation={[0.5, 0, 0]}>
        <boxGeometry args={[0.46, 0.04, 0.22]} />
        <meshStandardMaterial color={MAD.marco} roughness={0.8} />
      </mesh>
      {/* ranura */}
      <mesh position={[0, 0.12, 0.075]}>
        <boxGeometry args={[0.24, 0.03, 0.01]} />
        <meshStandardMaterial color="#2e2013" roughness={1} />
      </mesh>
      {/* placa */}
      <mesh position={[0, -0.08, 0.075]}>
        <boxGeometry args={[0.18, 0.1, 0.01]} />
        <meshStandardMaterial color="#b08d57" metalness={0.5} roughness={0.4} />
      </mesh>
    </group>
  );
}

/** Silla de escritorio de listones */
export function DeskChair({ position, rotY = 0 }: { position: [number, number, number]; rotY?: number }) {
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      {/* asiento sólido */}
      <mesh position={[0, 0.46, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.46, 0.06, 0.44]} />
        <meshStandardMaterial color="#8a5f38" roughness={0.7} />
      </mesh>
      {/* patas de verdad */}
      {([[-1, -1], [1, -1], [-1, 1], [1, 1]] as const).map(([sx, sz], i) => (
        <mesh key={i} position={[sx * 0.18, 0.23, sz * 0.17]} castShadow>
          <cylinderGeometry args={[0.024, 0.03, 0.46, 8]} />
          <meshStandardMaterial color="#6b4527" roughness={0.75} />
        </mesh>
      ))}
      {/* respaldo: montantes + travesaños */}
      {[-1, 1].map((sx) => (
        <mesh key={sx} position={[sx * 0.19, 0.78, -0.19]} castShadow>
          <cylinderGeometry args={[0.022, 0.026, 0.62, 8]} />
          <meshStandardMaterial color="#6b4527" roughness={0.75} />
        </mesh>
      ))}
      {[0.68, 0.86, 1.02].map((y) => (
        <mesh key={y} position={[0, y, -0.19]} castShadow>
          <boxGeometry args={[0.38, 0.05, 0.03]} />
          <meshStandardMaterial color="#8a5f38" roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

/** Papelera de mimbre con papeles arrugados */
export function WasteBasket({ position }: { position: [number, number, number] }) {
  return (
    <group position={position} scale={1.6}>
      <mesh castShadow position={[0, 0.14, 0]}>
        <cylinderGeometry args={[0.14, 0.11, 0.28, 12, 1, true]} />
        <meshStandardMaterial color="#b98a4e" roughness={1} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.01, 0]}>
        <cylinderGeometry args={[0.11, 0.11, 0.02, 12]} />
        <meshStandardMaterial color="#a8763d" roughness={1} />
      </mesh>
      {[0.09, 0.2].map((y, i) => (
        <mesh key={i} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[i ? 0.135 : 0.12, 0.012, 5, 14]} />
          <meshStandardMaterial color={MAD.media} roughness={1} />
        </mesh>
      ))}
      {/* bolas de papel: una dentro, otra en el suelo */}
      <mesh castShadow position={[0.02, 0.3, 0]}>
        <icosahedronGeometry args={[0.055, 0]} />
        <meshStandardMaterial color="#fdf6e0" roughness={1} flatShading />
      </mesh>
      <mesh castShadow position={[0.3, 0.05, 0.18]} rotation={[0.5, 0.8, 0]}>
        <icosahedronGeometry args={[0.05, 0]} />
        <meshStandardMaterial color="#f3e4c4" roughness={1} flatShading />
      </mesh>
    </group>
  );
}

/** Estantito de pared con tarro de plumas */
export function QuillShelf({ position, rotY = 0 }: { position: [number, number, number]; rotY?: number }) {
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <mesh castShadow>
        <boxGeometry args={[0.7, 0.05, 0.22]} />
        <meshStandardMaterial color={MAD.oscura} roughness={0.8} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} castShadow position={[s * 0.28, -0.08, 0.06]} rotation={[0, 0, s * 0.5]}>
          <boxGeometry args={[0.04, 0.16, 0.04]} />
          <meshStandardMaterial color={MAD.marco} roughness={0.8} />
        </mesh>
      ))}
      <group position={[-0.15, 0.1, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.05, 0.04, 0.14, 10]} />
          <meshStandardMaterial color="#54654a" roughness={0.6} />
        </mesh>
        {[0, 1, 2].map((i) => (
          <mesh key={i} castShadow position={[(i - 1) * 0.025, 0.14, i === 1 ? -0.015 : 0.01]} rotation={[(i - 1) * 0.12, 0, (i - 1) * 0.32]}>
            <coneGeometry args={[0.014, 0.22, 5]} />
            <meshStandardMaterial color={["#e9cf9e", "#8a7350", "#d9c39a"][i]} roughness={0.9} />
          </mesh>
        ))}
      </group>
      {/* pila de tarjetas */}
      <mesh castShadow position={[0.18, 0.045, 0]}>
        <boxGeometry args={[0.2, 0.04, 0.14]} />
        <meshStandardMaterial color="#fdf6e0" roughness={1} />
      </mesh>
    </group>
  );
}

/** Percha de pie con chal colgado */
export function CoatStand({ position, rotY = 0 }: { position: [number, number, number]; rotY?: number }) {
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <mesh position={[0, 0.9, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.04, 1.8, 8]} />
        <meshStandardMaterial color="#6b4527" roughness={0.75} />
      </mesh>
      <mesh position={[0, 0.04, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.26, 0.08, 10]} />
        <meshStandardMaterial color="#4a2f1a" roughness={0.8} />
      </mesh>
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.14, 1.72, Math.sin(a) * 0.14]} rotation={[Math.sin(a) * 0.6, 0, -Math.cos(a) * 0.6]} castShadow>
            <cylinderGeometry args={[0.015, 0.02, 0.3, 6]} />
            <meshStandardMaterial color="#6b4527" roughness={0.75} />
          </mesh>
        );
      })}
      {/* chal granate con caída en V y dobladillo */}
      <group position={[0.16, 1.66, 0.05]} rotation={[0, 0.4, 0]}>
        <mesh rotation={[0, 0, 0.16]} castShadow>
          <boxGeometry args={[0.2, 0.62, 0.035]} />
          <meshStandardMaterial color="#8a4049" roughness={0.95} />
        </mesh>
        <mesh position={[0.13, -0.06, 0.01]} rotation={[0, 0, -0.22]} castShadow>
          <boxGeometry args={[0.18, 0.5, 0.035]} />
          <meshStandardMaterial color="#7d3a44" roughness={0.95} />
        </mesh>
        <mesh position={[0.02, -0.32, 0.012]} rotation={[0, 0, 0.05]}>
          <boxGeometry args={[0.3, 0.05, 0.04]} />
          <meshStandardMaterial color="#d9b45b" roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
}

/** Archivador bajo de dos cajones, junto a la librería */
export function FilingCabinet({ position, rotY = 0 }: { position: P3; rotY?: number }) {
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      {/* cuerpo */}
      <mesh castShadow receiveShadow position={[0, 0.44, 0]}>
        <boxGeometry args={[0.9, 0.76, 0.55]} />
        <meshStandardMaterial color={MAD.media} roughness={0.85} />
      </mesh>
      {/* zócalo */}
      <mesh castShadow position={[0, 0.04, 0]}>
        <boxGeometry args={[0.86, 0.08, 0.51]} />
        <meshStandardMaterial color={MAD.marco} roughness={0.9} />
      </mesh>
      {/* tapa que vuela un poco */}
      <mesh castShadow receiveShadow position={[0, 0.85, 0]}>
        <boxGeometry args={[0.98, 0.06, 0.61]} />
        <meshStandardMaterial color={MAD.oscura} roughness={0.8} />
      </mesh>
      {/* frentes de los dos cajones (el de arriba, medio abierto) */}
      {[
        { y: 0.62, z: 0.29, papel: true },
        { y: 0.26, z: 0.28, papel: false },
      ].map((c, i) => (
        <group key={i} position={[0, c.y, c.z]}>
          <mesh castShadow>
            <boxGeometry args={[0.8, 0.3, 0.04]} />
            <meshStandardMaterial color={MAD.clara} roughness={0.85} />
          </mesh>
          {/* tirador de latón */}
          <mesh castShadow position={[0, 0, 0.035]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.055, 0.012, 6, 14]} />
            <meshStandardMaterial color="#b08d57" metalness={0.55} roughness={0.4} />
          </mesh>
          {/* porta-etiqueta */}
          <mesh position={[-0.26, 0.07, 0.032]}>
            <boxGeometry args={[0.16, 0.06, 0.008]} />
            <meshStandardMaterial color="#f3e4c4" roughness={1} />
          </mesh>
          {/* carpeta asomando del cajón de arriba */}
          {c.papel && (
            <mesh castShadow position={[0.1, 0.19, -0.06]} rotation={[0.18, 0.06, 0]}>
              <boxGeometry args={[0.42, 0.02, 0.3]} />
              <meshStandardMaterial color="#e9d9b8" roughness={1} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}

/** Globo terráqueo pequeño de sobremesa */
export function Globe({ position, rotY = 0 }: { position: P3; rotY?: number }) {
  const manchas = [
    { p: [0.09, 0.05, 0.11] as P3, s: [1.5, 1, 1] as P3 },
    { p: [-0.11, -0.03, 0.07] as P3, s: [1, 1.4, 1] as P3 },
    { p: [0.02, 0.1, -0.12] as P3, s: [1.3, 0.8, 1] as P3 },
    { p: [-0.06, -0.1, -0.1] as P3, s: [1, 1, 1.2] as P3 },
  ];
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      {/* peana */}
      <mesh castShadow>
        <cylinderGeometry args={[0.085, 0.1, 0.035, 12]} />
        <meshStandardMaterial color={MAD.marco} roughness={0.8} />
      </mesh>
      <mesh castShadow position={[0, 0.07, 0]}>
        <cylinderGeometry args={[0.018, 0.024, 0.11, 8]} />
        <meshStandardMaterial color="#b08d57" metalness={0.5} roughness={0.45} />
      </mesh>
      {/* meridiano de latón */}
      <mesh position={[0, 0.24, 0]} rotation={[0.28, 0, 0.32]}>
        <torusGeometry args={[0.155, 0.012, 6, 20]} />
        <meshStandardMaterial color="#b08d57" metalness={0.55} roughness={0.4} />
      </mesh>
      {/* la bola, inclinada como debe */}
      <group position={[0, 0.24, 0]} rotation={[0, 0, 0.32]}>
        <mesh castShadow>
          <sphereGeometry args={[0.135, 16, 12]} />
          <meshStandardMaterial color="#9db8c9" roughness={0.75} />
        </mesh>
        {manchas.map((m, i) => (
          <mesh key={i} position={m.p} scale={m.s}>
            <sphereGeometry args={[0.042, 8, 6]} />
            <meshStandardMaterial color={i % 2 ? "#7c8a5a" : "#a8763d"} roughness={0.95} flatShading />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/** Felpudo de fibra del recibidor */
export function DoorMat({ position, rotY = 0 }: { position: P3; rotY?: number }) {
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <mesh receiveShadow position={[0, 0.015, 0]}>
        <boxGeometry args={[0.78, 0.03, 1.18]} />
        <meshStandardMaterial color="#8a7350" roughness={1} />
      </mesh>
      {/* cenefa */}
      <mesh position={[0, 0.032, 0]}>
        <boxGeometry args={[0.64, 0.004, 1.04]} />
        <meshStandardMaterial color="#a8763d" roughness={1} />
      </mesh>
      {/* fibras: listones cruzados */}
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} position={[0, 0.034, -0.42 + i * 0.21]}>
          <boxGeometry args={[0.6, 0.004, 0.05]} />
          <meshStandardMaterial color="#6f5a3d" roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

/** Paragüero de duelas con dos paraguas plegados */
export function UmbrellaStand({ position, rotY = 0 }: { position: P3; rotY?: number }) {
  const paraguas = [
    { x: -0.045, z: 0.03, tilt: [0.1, 0, -0.16] as P3, tela: "#54654a", h: 0.78 },
    { x: 0.05, z: -0.035, tilt: [-0.12, 0, 0.2] as P3, tela: "#8a4049", h: 0.72 },
  ];
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      {/* cubo de duelas */}
      <mesh castShadow position={[0, 0.24, 0]}>
        <cylinderGeometry args={[0.16, 0.14, 0.48, 12, 1, true]} />
        <meshStandardMaterial color={MAD.media} roughness={0.95} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.14, 0.14, 0.04, 12]} />
        <meshStandardMaterial color={MAD.marco} roughness={0.95} />
      </mesh>
      {[0.1, 0.4].map((y, i) => (
        <mesh key={i} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[i ? 0.155 : 0.142, 0.014, 5, 14]} />
          <meshStandardMaterial color="#8a8074" metalness={0.45} roughness={0.55} />
        </mesh>
      ))}
      {paraguas.map((p, i) => (
        <group key={i} position={[p.x, 0.1, p.z]} rotation={p.tilt}>
          {/* vara */}
          <mesh castShadow position={[0, p.h / 2, 0]}>
            <cylinderGeometry args={[0.014, 0.016, p.h, 6]} />
            <meshStandardMaterial color={MAD.oscura} roughness={0.85} />
          </mesh>
          {/* tela plegada */}
          <mesh castShadow position={[0, p.h * 0.72, 0]}>
            <coneGeometry args={[0.052, 0.42, 6]} />
            <meshStandardMaterial color={p.tela} roughness={0.95} />
          </mesh>
          {/* mango curvo */}
          <mesh castShadow position={[0.045, p.h + 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.045, 0.014, 6, 12, Math.PI]} />
            <meshStandardMaterial color={MAD.oscura} roughness={0.85} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Cuerda con postales colgadas de pinzas sobre el escritorio */
export function PostcardLine({ a, b, n = 3 }: { a: P3; b: P3; n?: number }) {
  const sag = 0.16;
  const [ax, ay, az] = a;
  const [bx, by, bz] = b;
  const puntos = useMemo(
    () => Array.from({ length: n }, (_, i) => ropePoint([ax, ay, az], [bx, by, bz], 0.3 + (i * 0.36) / (n - 1), sag)),
    [ax, ay, az, bx, by, bz, n]
  );
  const fondos = ["#e9d9b8", "#dfe3c0", "#f3e4c4"];
  const tintas = ["#8a4049", "#54654a", "#a8593f"];
  return (
    <group>
      {/* escarpias en las dos paredes */}
      {[a, b].map((p, i) => (
        <mesh key={i} position={p} castShadow>
          <sphereGeometry args={[0.022, 8, 6]} />
          <meshStandardMaterial color="#5a5248" metalness={0.5} roughness={0.45} />
        </mesh>
      ))}
      <Rope a={a} b={b} sag={sag} r={0.007} color="#b98a4e" />
      {puntos.map((p, i) => (
        <group key={i} position={p} rotation={[0, -Math.PI / 4 + Math.sin(i * 1.7) * 0.12, 0]}>
          <Peg position={[0, -0.03, 0]} />
          {/* la postal: un plano dibujado a mano */}
          <group position={[0, -0.19, 0]} rotation={[0, 0, Math.sin(i * 2.3) * 0.06]}>
            <mesh castShadow>
              <boxGeometry args={[0.25, 0.185, 0.006]} />
              <meshStandardMaterial color={fondos[i % 3]} roughness={1} />
            </mesh>
            {/* horizonte */}
            <mesh position={[0, -0.04, 0.004]}>
              <boxGeometry args={[0.21, 0.045, 0.002]} />
              <meshStandardMaterial color={tintas[i % 3]} roughness={1} />
            </mesh>
            {/* montaña / tejado */}
            <mesh position={[-0.04, 0.005, 0.004]} rotation={[0, 0, Math.PI / 4]}>
              <boxGeometry args={[0.06, 0.06, 0.002]} />
              <meshStandardMaterial color={tintas[(i + 1) % 3]} roughness={1} />
            </mesh>
            {/* sol / sello */}
            <mesh position={[0.07, 0.045, 0.004]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.022, 0.022, 0.002, 10]} />
              <meshStandardMaterial color="#d9b45b" roughness={1} />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  );
}
