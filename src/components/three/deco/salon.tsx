"use client";
// Atrezzo fino del SALÓN y la DESPENSA (fan-out de detalle, 18-ago-2026).
// Piezas nuevas de este dominio: cuadros, repisa de chimenea, leñero, estante de tazas,
// reloj de péndulo, zuecos · barriles, ristra de cebollas, conservas, quesera, ojo de buey.
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { useRef } from "react";
import GLB from "../Modelos";
import { BookRow, CheeseWheel } from "../Decor";

const MADERA = "#8a5f38";
const MADERA_MEDIA = "#6b4527";
const MADERA_OSCURA = "#4a2f1a";
const WOODTOP = "#9c6c40";

/* ══════════════ SALÓN ══════════════ */

const FOTOS_SALON = [
  "/images/salon/petra-erik-arbol.webp",
  "/images/salon/petra-erik-flores.webp",
] as const;

/** Marco de pared con una fotografía real adaptada a su proporción interior. */
export function FramedPicture({
  position, rotY = 0, w = 1.1, h = 0.8, variant = 0,
}: { position: [number, number, number]; rotY?: number; w?: number; h?: number; variant?: number }) {
  const rutaFoto = FOTOS_SALON[variant === 1 ? 1 : 0];
  const foto = useTexture(rutaFoto);
  foto.colorSpace = THREE.SRGBColorSpace;
  foto.wrapS = THREE.ClampToEdgeWrapping;
  foto.wrapT = THREE.ClampToEdgeWrapping;
  foto.anisotropy = 8;

  return (
    <group position={position} rotation={[0, rotY, 0]}>
      {/* marco */}
      <mesh castShadow>
        <boxGeometry args={[w, h, 0.06]} />
        <meshStandardMaterial color={MADERA_OSCURA} roughness={0.7} />
      </mesh>
      {/* paspartú */}
      <mesh position={[0, 0, 0.035]}>
        <boxGeometry args={[w - 0.12, h - 0.12, 0.01]} />
        <meshStandardMaterial color="#f6ecd4" roughness={0.95} />
      </mesh>
      {/* fotografía: un poco por delante del paspartú para evitar z-fighting */}
      <mesh position={[0, 0, 0.047]}>
        <boxGeometry args={[w - 0.26, h - 0.26, 0.008]} />
        <meshStandardMaterial map={foto} color="#ffffff" roughness={0.92} metalness={0} />
      </mesh>
      {/* cordel de colgar */}
      <mesh position={[0, h / 2 + 0.05, -0.01]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.006, 0.006, 0.1, 4]} />
        <meshStandardMaterial color="#a8763d" roughness={1} />
      </mesh>
    </group>
  );
}

/** Vela pequeña de repisa: candelero + llama emisiva (SIN luz, solo brilla). */
function MantelCandle({ position }: { position: [number, number, number] }) {
  const flame = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const f = 1 + Math.sin(clock.elapsedTime * 8 + position[2] * 9) * 0.14;
    if (flame.current) flame.current.scale.set(f * 0.9, f * 1.2, f * 0.9);
  });
  return (
    <group position={position}>
      <mesh castShadow>
        <cylinderGeometry args={[0.045, 0.06, 0.03, 10]} />
        <meshStandardMaterial color="#b08d57" metalness={0.55} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.075, 0]} castShadow>
        <cylinderGeometry args={[0.022, 0.026, 0.12, 8]} />
        <meshStandardMaterial color="#f6ecd4" roughness={0.85} />
      </mesh>
      <mesh ref={flame} position={[0, 0.16, 0]}>
        <sphereGeometry args={[0.02, 7, 7]} />
        <meshStandardMaterial color="#ffca5f" emissive="#ff9a1f" emissiveIntensity={2.8} />
      </mesh>
    </group>
  );
}

/** Conjunto de repisa de chimenea: dos velas y un jarroncito con ramita. */
export function MantelSet({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <MantelCandle position={[-0.45, 0, 0]} />
      <MantelCandle position={[0.45, 0, 0]} />
      {/* jarroncito */}
      <group position={[0, 0, 0]}>
        <mesh castShadow scale={[1, 1.15, 1]}>
          <sphereGeometry args={[0.06, 10, 8]} />
          <meshStandardMaterial color="#8a4049" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.09, 0]}>
          <cylinderGeometry args={[0.02, 0.028, 0.05, 8]} />
          <meshStandardMaterial color="#8a4049" roughness={0.5} />
        </mesh>
        <mesh position={[0.015, 0.17, 0]} rotation={[0, 0, -0.25]}>
          <cylinderGeometry args={[0.005, 0.007, 0.14, 4]} />
          <meshStandardMaterial color="#7c8a5a" roughness={1} />
        </mesh>
        <mesh position={[0.04, 0.23, 0]} scale={[0.6, 1.4, 0.3]}>
          <sphereGeometry args={[0.025, 6, 5]} />
          <meshStandardMaterial color="#9db76a" roughness={1} />
        </mesh>
      </group>
    </group>
  );
}

/** Leñero: aro bajo de hierro con troncos apilados. */
export function LogBasket({ position }: { position: [number, number, number] }) {
  const logs: { p: [number, number, number]; r: number }[] = [
    { p: [0, 0.09, 0], r: 0.2 },
    { p: [0.16, 0.09, 0.1], r: 0.9 },
    { p: [-0.14, 0.1, 0.12], r: -0.4 },
    { p: [0.03, 0.24, 0.06], r: 0.5 },
    { p: [-0.05, 0.23, -0.08], r: -0.8 },
  ];
  return (
    <group position={position}>
      <mesh position={[0, 0.1, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.34, 0.022, 6, 20]} />
        <meshStandardMaterial color="#3a2a1a" metalness={0.4} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.26, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.3, 0.018, 6, 20]} />
        <meshStandardMaterial color="#3a2a1a" metalness={0.4} roughness={0.6} />
      </mesh>
      {logs.map((l, i) => (
        <group key={i} position={l.p} rotation={[0, l.r, Math.PI / 2]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.07, 0.075, 0.5, 8]} />
            <meshStandardMaterial color={i % 2 ? MADERA_OSCURA : "#5b3a21"} roughness={1} />
          </mesh>
          {/* corte claro del tronco */}
          <mesh position={[0, 0.253, 0]}>
            <cylinderGeometry args={[0.062, 0.062, 0.006, 8]} />
            <meshStandardMaterial color="#d9bc8a" roughness={1} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Taza colgada: media esfera + asa. */
function Cup({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <group position={position}>
      <mesh castShadow rotation={[Math.PI, 0, 0]}>
        <sphereGeometry args={[0.075, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={color} roughness={0.45} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0.08, 0.01, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.035, 0.011, 6, 12, Math.PI * 1.5]} />
        <meshStandardMaterial color={color} roughness={0.45} />
      </mesh>
    </group>
  );
}

/** Estante de tazas de la casa: balda con 4 tazas y ganchos. */
export function CupShelf({ position, rotY = 0 }: { position: [number, number, number]; rotY?: number }) {
  const colores = ["#a8593f", "#7c8a5a", "#e3b04b", "#8a4049"];
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <mesh castShadow>
        <boxGeometry args={[1.5, 0.06, 0.28]} />
        <meshStandardMaterial color={MADERA_MEDIA} roughness={0.8} />
      </mesh>
      {/* ménsulas */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.62, -0.09, -0.06]}>
          <boxGeometry args={[0.06, 0.14, 0.14]} />
          <meshStandardMaterial color={MADERA_OSCURA} roughness={0.8} />
        </mesh>
      ))}
      {colores.map((c, i) => (
        <Cup key={i} position={[-0.55 + i * 0.37, 0.1, 0.02]} color={c} />
      ))}
    </group>
  );
}

/** Reloj de péndulo de pie: caja alta, esfera y péndulo que oscila. */
export function GrandfatherClock({ position, rotY = 0 }: { position: [number, number, number]; rotY?: number }) {
  const pend = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (pend.current) pend.current.rotation.z = Math.sin(clock.elapsedTime * 2.1) * 0.10;
  });
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      {/* base y caja */}
      <mesh position={[0, 0.12, 0]} castShadow>
        <boxGeometry args={[0.62, 0.24, 0.4]} />
        <meshStandardMaterial color={MADERA_OSCURA} roughness={0.65} />
      </mesh>
      {/* Caja trasera. La cavidad oscura y el marco frontal hacen que el
          péndulo se lea dentro del reloj, no colgado delante de él. */}
      <mesh position={[0, 1.35, -0.06]} castShadow>
        <boxGeometry args={[0.5, 2.25, 0.2]} />
        <meshStandardMaterial color={MADERA_MEDIA} roughness={0.6} />
      </mesh>
      {/* fondo de la ventana del péndulo */}
      <mesh position={[0, 1.15, 0.055]}>
        <boxGeometry args={[0.34, 1.15, 0.02]} />
        <meshStandardMaterial color="#2a1a10" roughness={0.4} />
      </mesh>
      <group ref={pend} position={[0, 1.72, 0.09]}>
        <mesh position={[0, -0.4, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.8, 5]} />
          <meshStandardMaterial color="#b08d57" metalness={0.65} roughness={0.3} />
        </mesh>
        <mesh position={[0, -0.82, 0]}>
          <cylinderGeometry args={[0.075, 0.075, 0.02, 14]} />
          <meshStandardMaterial color="#d9b45b" metalness={0.7} roughness={0.25} />
        </mesh>
      </group>
      {/* marco de madera delante del péndulo: tapa sus extremos al oscilar */}
      {[-1, 1].map((s) => (
        <mesh key={`pend-side-${s}`} position={[s * 0.215, 1.15, 0.13]} castShadow>
          <boxGeometry args={[0.09, 1.31, 0.08]} />
          <meshStandardMaterial color={MADERA_MEDIA} roughness={0.6} />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={`pend-edge-${s}`} position={[0, 1.15 + s * 0.62, 0.13]} castShadow>
          <boxGeometry args={[0.52, 0.09, 0.08]} />
          <meshStandardMaterial color={MADERA_MEDIA} roughness={0.6} />
        </mesh>
      ))}
      {/* cabeza con esfera */}
      <mesh position={[0, 2.72, 0]} castShadow>
        <boxGeometry args={[0.6, 0.52, 0.36]} />
        <meshStandardMaterial color={MADERA_OSCURA} roughness={0.6} />
      </mesh>
      <mesh position={[0, 2.98, 0]} castShadow>
        <boxGeometry args={[0.66, 0.08, 0.4]} />
        <meshStandardMaterial color="#3a2a1a" roughness={0.6} />
      </mesh>
      <mesh position={[0, 2.72, 0.19]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.19, 0.19, 0.015, 18]} />
        <meshStandardMaterial color="#f6ecd4" roughness={0.9} />
      </mesh>
      {/* Doce marcas horarias cortas y pegadas al borde. */}
      {Array.from({ length: 12 }, (_, i) => {
        const angle = (i * Math.PI) / 6;
        const cardinal = i % 3 === 0;
        return (
          <mesh
            key={`hour-mark-${i}`}
            position={[Math.sin(angle) * 0.165, 2.72 + Math.cos(angle) * 0.165, 0.205]}
            rotation={[0, 0, -angle]}
          >
            <boxGeometry args={[cardinal ? 0.014 : 0.009, cardinal ? 0.028 : 0.021, 0.012]} />
            <meshStandardMaterial color="#352417" roughness={0.65} />
          </mesh>
        );
      })}
      {/* Manecillas fijas a las 4:10 p. m.; ambas nacen en el centro. */}
      <group position={[0, 2.72, 0.217]} rotation={[0, 0, -(25 * Math.PI) / 36]}>
        <mesh position={[0, 0.047, 0]}>
          <boxGeometry args={[0.024, 0.094, 0.014]} />
          <meshStandardMaterial color="#24170f" roughness={0.48} />
        </mesh>
      </group>
      <group position={[0, 2.72, 0.221]} rotation={[0, 0, -Math.PI / 3]}>
        <mesh position={[0, 0.067, 0]}>
          <boxGeometry args={[0.017, 0.134, 0.012]} />
          <meshStandardMaterial color="#24170f" roughness={0.48} />
        </mesh>
      </group>
      <mesh position={[0, 2.72, 0.23]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.014, 12]} />
        <meshStandardMaterial color="#9b7134" metalness={0.45} roughness={0.38} />
      </mesh>
    </group>
  );
}

/** Zuecos junto al fuego: dos piezas de madera con hueco oscuro. */
export function Clogs({ position, rotY = 0 }: { position: [number, number, number]; rotY?: number }) {
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.09, 0.045, s * 0.02]} rotation={[0, s * 0.15, 0]}>
          <mesh castShadow scale={[0.6, 0.45, 1]}>
            <sphereGeometry args={[0.11, 10, 8]} />
            <meshStandardMaterial color="#a8763d" roughness={0.85} />
          </mesh>
          <mesh position={[0, 0.035, -0.045]} scale={[0.42, 0.3, 0.5]}>
            <sphereGeometry args={[0.1, 8, 6]} />
            <meshStandardMaterial color="#3a2513" roughness={1} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ══════════════ DESPENSA ══════════════ */

/** Barril de madera con aros: duelas insinuadas con dos tonos. */
export function Barrel({
  position, r = 0.34, h = 0.95, rotZ = 0,
}: { position: [number, number, number]; r?: number; h?: number; rotZ?: number }) {
  return (
    <group position={position} rotation={[0, 0, rotZ]}>
      <mesh position={[0, h / 2, 0]} castShadow>
        <cylinderGeometry args={[r * 0.88, r * 0.88, h, 14]} />
        <meshStandardMaterial color={MADERA} roughness={0.9} />
      </mesh>
      {/* barriga */}
      <mesh position={[0, h / 2, 0]} castShadow>
        <cylinderGeometry args={[r, r * 0.92, h * 0.55, 14]} />
        <meshStandardMaterial color="#96703f" roughness={0.9} />
      </mesh>
      {/* aros */}
      {[0.18, 0.5, 0.82].map((t, i) => (
        <mesh key={i} position={[0, h * t, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[i === 1 ? r * 0.99 : r * 0.9, 0.018, 6, 18]} />
          <meshStandardMaterial color="#3a2a1a" metalness={0.5} roughness={0.5} />
        </mesh>
      ))}
      {/* tapa */}
      <mesh position={[0, h + 0.005, 0]}>
        <cylinderGeometry args={[r * 0.82, r * 0.82, 0.02, 14]} />
        <meshStandardMaterial color={MADERA_MEDIA} roughness={1} />
      </mesh>
    </group>
  );
}

/** Barril pequeño con grifo de madera. */
export function TapBarrel({
  position,
  rotY = 0,
  withMug = true,
}: {
  position: [number, number, number];
  rotY?: number;
  withMug?: boolean;
}) {
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <Barrel position={[0, 0, 0]} r={0.26} h={0.7} />
      {/* grifo */}
      <group position={[0, 0.28, 0.27]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.022, 0.028, 0.12, 8]} />
          <meshStandardMaterial color={MADERA_OSCURA} roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.05, 0.03]}>
          <cylinderGeometry args={[0.012, 0.012, 0.06, 6]} />
          <meshStandardMaterial color={MADERA_OSCURA} roughness={0.8} />
        </mesh>
      </group>
      {/* jarra opcional al lado; en la Cesta se oculta para limpiar el suelo */}
      {withMug && (
        <group position={[0.02, 0, 0.48]}>
          <mesh position={[0, 0.07, 0]} castShadow>
            <cylinderGeometry args={[0.055, 0.05, 0.14, 10]} />
            <meshStandardMaterial color="#cbb083" roughness={0.7} />
          </mesh>
          <mesh position={[0.06, 0.08, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.028, 0.008, 5, 10, Math.PI * 1.4]} />
            <meshStandardMaterial color="#cbb083" roughness={0.7} />
          </mesh>
        </group>
      )}
    </group>
  );
}

/** Ristra de cebollas colgando: esferitas encadenadas con rabillo. */
export function OnionString({ position }: { position: [number, number, number] }) {
  const onions: { y: number; x: number; c: string }[] = [
    { y: -0.16, x: 0.015, c: "#e8d6b0" },
    { y: -0.3, x: -0.02, c: "#c9a0a8" },
    { y: -0.44, x: 0.02, c: "#e8d6b0" },
    { y: -0.58, x: -0.015, c: "#d9b48a" },
  ];
  return (
    <group position={position}>
      <mesh position={[0, -0.32, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 0.68, 4]} />
        <meshStandardMaterial color="#c8a165" roughness={1} />
      </mesh>
      {onions.map((o, i) => (
        <group key={i} position={[o.x, o.y, 0]}>
          <mesh castShadow scale={[1, 0.9, 1]}>
            <sphereGeometry args={[0.055, 9, 7]} />
            <meshStandardMaterial color={o.c} roughness={0.75} />
          </mesh>
          <mesh position={[0, 0.055, 0]}>
            <coneGeometry args={[0.012, 0.04, 5]} />
            <meshStandardMaterial color="#b99a6b" roughness={1} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Tarro de conserva: cristal, contenido de color, tapa de tela con cordel. */
export function ConserveJar({
  position, color, cloth = "#e9cf9e",
}: { position: [number, number, number]; color: string; cloth?: string }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.11, 0]} castShadow>
        <cylinderGeometry args={[0.075, 0.07, 0.22, 12]} />
        <meshPhysicalMaterial color="#eaf6ef" roughness={0.08} transparent opacity={0.35} envMapIntensity={1.1} />
      </mesh>
      <mesh position={[0, 0.095, 0]}>
        <cylinderGeometry args={[0.062, 0.058, 0.17, 10]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
      {/* tapa de tela abombada */}
      <mesh position={[0, 0.225, 0]} scale={[1, 0.5, 1]} castShadow>
        <sphereGeometry args={[0.085, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={cloth} roughness={1} />
      </mesh>
      <mesh position={[0, 0.21, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.075, 0.007, 5, 12]} />
        <meshStandardMaterial color="#8a5f38" roughness={1} />
      </mesh>
    </group>
  );
}

/** Fila de conservas para una balda. */
export function ConserveRow({ position }: { position: [number, number, number] }) {
  const jars = [
    { c: "#b83a2a", t: "#e9cf9e" },  // tomate
    { c: "#6f8f4a", t: "#c9d6b0" },  // pepinillo
    { c: "#e08a2e", t: "#e9cf9e" },  // melocotón
    { c: "#8a4049", t: "#d9b48a" },  // remolacha
    { c: "#c9a83c", t: "#e9cf9e" },  // membrillo
  ];
  return (
    <group position={position}>
      {jars.map((j, i) => (
        <ConserveJar key={i} position={[i * 0.24, 0, i % 2 ? -0.03 : 0.03]} color={j.c} cloth={j.t} />
      ))}
    </group>
  );
}

/** Quesera: campana de cristal con pomo sobre un queso con su plato. */
export function CheeseCloche({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <cylinderGeometry args={[0.17, 0.18, 0.03, 16]} />
        <meshStandardMaterial color={MADERA_MEDIA} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.11, 0.11, 0.07, 14]} />
        <meshStandardMaterial color="#e8c25a" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.1, 0]} castShadow>
        <sphereGeometry args={[0.15, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial color="#eaf6ef" roughness={0.05} transparent opacity={0.3} envMapIntensity={1.1} />
      </mesh>
      <mesh position={[0, 0.27, 0]}>
        <sphereGeometry args={[0.022, 8, 6]} />
        <meshStandardMaterial color={MADERA_OSCURA} roughness={0.6} />
      </mesh>
    </group>
  );
}

/** Ventana redonda de la despensa: marco de obra + aro grueso + cruceta, luz pálida difusa.
 *  (Antes parecía «un cuadro con una vela dentro» — SER, 19-ago.) */
export function Porthole({ position, rotY = 0 }: { position: [number, number, number]; rotY?: number }) {
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      {/* marco exterior de obra, pegado a la pared */}
      <mesh position={[0, 0, -0.03]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.46, 0.46, 0.05, 22]} />
        <meshStandardMaterial color="#d9c39a" roughness={0.95} />
      </mesh>
      {/* aro de madera grueso */}
      <mesh castShadow rotation={[0, 0, 0]}>
        <torusGeometry args={[0.33, 0.085, 10, 22]} />
        <meshStandardMaterial color={MADERA_MEDIA} roughness={0.75} />
      </mesh>
      {/* cristal pálido y difuso: cielo, no llama */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.31, 0.31, 0.03, 20]} />
        <meshStandardMaterial color="#fff6dd" emissive="#ffedbe" emissiveIntensity={1.2} />
      </mesh>
      {/* cruceta de 4 radios a ras del cristal */}
      <mesh position={[0, 0, 0.028]}>
        <boxGeometry args={[0.05, 0.62, 0.03]} />
        <meshStandardMaterial color={MADERA_OSCURA} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0, 0.028]}>
        <boxGeometry args={[0.62, 0.05, 0.03]} />
        <meshStandardMaterial color={MADERA_OSCURA} roughness={0.7} />
      </mesh>
      {/* alfeizarcito */}
      <mesh position={[0, -0.44, 0.09]} castShadow>
        <boxGeometry args={[0.7, 0.06, 0.16]} />
        <meshStandardMaterial color={MADERA_MEDIA} roughness={0.8} />
      </mesh>
    </group>
  );
}

/* ══════ DESPENSA v2 (encargo SER 19-ago: «la sala es básica») ══════ */

/** Pernil colgado: pata de jamón con cuerda, junto a las ristras. */
export function HangingHam({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* cuerda al gancho */}
      <mesh position={[0, -0.09, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 0.18, 4]} />
        <meshStandardMaterial color="#c8a165" roughness={1} />
      </mesh>
      {/* caña de la pata */}
      <mesh position={[0, -0.26, 0]} rotation={[0, 0, 0.06]} castShadow>
        <cylinderGeometry args={[0.028, 0.045, 0.22, 8]} />
        <meshStandardMaterial color="#a06a45" roughness={0.85} />
      </mesh>
      {/* maza del jamón */}
      <mesh position={[0.01, -0.52, 0]} rotation={[0, 0, 0.08]} castShadow>
        <capsuleGeometry args={[0.095, 0.28, 6, 10]} />
        <meshStandardMaterial color="#8a4a35" roughness={0.7} />
      </mesh>
      {/* corte claro inferior */}
      <mesh position={[0.035, -0.69, 0.01]} rotation={[0.2, 0, 0.5]}>
        <cylinderGeometry args={[0.055, 0.055, 0.012, 10]} />
        <meshStandardMaterial color="#d98a6a" roughness={0.8} />
      </mesh>
    </group>
  );
}

/** Banqueta baja con cesto de manzanas rojas encima. */
export function AppleBasketStool({ position, rotY = 0 }: { position: [number, number, number]; rotY?: number }) {
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      {/* banqueta: asiento a y=0.32 sobre 3 patas */}
      <mesh position={[0, 0.32, 0]} castShadow>
        <cylinderGeometry args={[0.24, 0.26, 0.05, 10]} />
        <meshStandardMaterial color={MADERA} roughness={0.85} />
      </mesh>
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.16, 0.15, Math.sin(a) * 0.16]} rotation={[Math.sin(a) * 0.16, 0, -Math.cos(a) * 0.16]} castShadow>
            <cylinderGeometry args={[0.022, 0.028, 0.31, 6]} />
            <meshStandardMaterial color={MADERA_OSCURA} roughness={0.9} />
          </mesh>
        );
      })}
      {/* cesto apoyado en el asiento (base y=0.345) */}
      <group position={[0, 0.345, 0]}>
        <mesh position={[0, 0.05, 0]} castShadow>
          <cylinderGeometry args={[0.2, 0.16, 0.1, 12, 1, true]} />
          <meshStandardMaterial color="#a8763d" roughness={0.95} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0.005, 0]}>
          <cylinderGeometry args={[0.16, 0.16, 0.02, 12]} />
          <meshStandardMaterial color="#96703f" roughness={0.95} />
        </mesh>
        <mesh position={[0, 0.105, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.2, 0.018, 6, 16]} />
          <meshStandardMaterial color="#8a5f38" roughness={0.9} />
        </mesh>
        {/* manzanas asomando */}
        {[[-0.08, 0.02], [0.07, 0.06], [0, -0.08], [0.11, -0.04]].map(([mx, mz], i) => (
          <group key={i} position={[mx, 0.12, mz]}>
            <mesh castShadow>
              <sphereGeometry args={[0.055, 9, 7]} />
              <meshStandardMaterial color={i % 2 ? "#b83a2a" : "#c74d33"} roughness={0.55} />
            </mesh>
            <mesh position={[0, 0.05, 0]}>
              <cylinderGeometry args={[0.006, 0.006, 0.03, 4]} />
              <meshStandardMaterial color={MADERA_OSCURA} roughness={1} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

/** Tinaja grande de barro con boca ancha y asas. */
export function ClayTinaja({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.42, 0]} castShadow scale={[1, 1.05, 1]}>
        <sphereGeometry args={[0.4, 14, 12]} />
        <meshStandardMaterial color="#b06a3d" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.24, 0.28, 0.08, 12]} />
        <meshStandardMaterial color="#96552e" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.85, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.24, 0.12, 12]} />
        <meshStandardMaterial color="#96552e" roughness={0.9} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.38, 0.62, 0]} rotation={[0, 0, s * 0.5]}>
          <torusGeometry args={[0.07, 0.02, 6, 10, Math.PI]} />
          <meshStandardMaterial color="#96552e" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

/** Estantito de pared con tres botes de mermelada etiquetados. */
export function JamShelf({ position, rotY = 0 }: { position: [number, number, number]; rotY?: number }) {
  const jams = ["#c74d33", "#e08a2e", "#8a4049"];
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <mesh castShadow>
        <boxGeometry args={[0.9, 0.05, 0.26]} />
        <meshStandardMaterial color={MADERA_MEDIA} roughness={0.8} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.36, -0.08, -0.05]}>
          <boxGeometry args={[0.05, 0.12, 0.12]} />
          <meshStandardMaterial color={MADERA_OSCURA} roughness={0.8} />
        </mesh>
      ))}
      {jams.map((c, i) => (
        <group key={i} position={[-0.28 + i * 0.28, 0.025, 0.02]}>
          <mesh position={[0, 0.09, 0]} castShadow>
            <cylinderGeometry args={[0.065, 0.06, 0.18, 10]} />
            <meshStandardMaterial color={c} roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.195, 0]}>
            <cylinderGeometry args={[0.055, 0.055, 0.03, 10]} />
            <meshStandardMaterial color="#e9cf9e" roughness={1} />
          </mesh>
          {/* etiqueta de papel */}
          <mesh position={[0, 0.09, 0.062]}>
            <boxGeometry args={[0.07, 0.06, 0.006]} />
            <meshStandardMaterial color="#fdf6e0" roughness={1} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Charco de luz cálida proyectada en el suelo (aditivo, barato, sin luces nuevas). */
export function FloorGlow({
  position, color = "#ffe6ab", opacity = 0.1, r = 0.9, scaleX = 1.6, rotZ = 0, flicker = false,
}: {
  position: [number, number, number]; color?: string; opacity?: number; r?: number; scaleX?: number; rotZ?: number; flicker?: boolean;
}) {
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(({ clock }) => {
    if (!mat.current) return;
    mat.current.opacity = flicker
      ? opacity * (1 + Math.sin(clock.elapsedTime * 8) * 0.22 + Math.sin(clock.elapsedTime * 19) * 0.1)
      : opacity * (1 + Math.sin(clock.elapsedTime * 0.5) * 0.15);
  });
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, rotZ]} scale={[scaleX, 1, 1]}>
      <circleGeometry args={[r, 24]} />
      <meshBasicMaterial
        ref={mat}
        color={color}
        transparent
        opacity={opacity}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

/* ══════ DENSIDAD v3 (encargo SER 19-ago: «no un juego básico») ══════
   Piezas 1-7 salón, 8-12 despensa. Todas apoyan en superficies REALES
   (mostrador 1.17 · asiento de banqueta 0.345 · tops de balda declarados en cada pieza). */

/** (1) Librería baja de dos baldas con libros, libros tumbados y un tarro pequeño.
 *  Tops útiles: balda inferior y=0.12 · balda media y=0.52 · tapa y=1.04. */
export function LowBookcase({
  position, rotY = 0, w = 1.6,
}: { position: [number, number, number]; rotY?: number; w?: number }) {
  const d = 0.34;
  const h = 0.98;
  const tumbados: { y: number; c: string; r: number }[] = [
    { y: 0.145, c: "#8a4049", r: 0.02 },
    { y: 0.195, c: "#54654a", r: -0.03 },
    { y: 0.243, c: "#b06a3d", r: 0.015 },
  ];
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      {/* costados */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (w / 2 - 0.03), h / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.06, h, d]} />
          <meshStandardMaterial color={MADERA_MEDIA} roughness={0.8} />
        </mesh>
      ))}
      {/* trasera fina */}
      <mesh position={[0, h / 2, -d / 2 + 0.015]}>
        <boxGeometry args={[w - 0.06, h - 0.08, 0.03]} />
        <meshStandardMaterial color={MADERA_OSCURA} roughness={0.95} />
      </mesh>
      {/* balda inferior (top 0.12) y balda media (top 0.52) */}
      <mesh position={[0, 0.095, 0]} castShadow receiveShadow>
        <boxGeometry args={[w - 0.06, 0.05, d]} />
        <meshStandardMaterial color={MADERA} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.4975, 0]} castShadow receiveShadow>
        <boxGeometry args={[w - 0.06, 0.045, d]} />
        <meshStandardMaterial color={MADERA} roughness={0.85} />
      </mesh>
      {/* tapa (top 1.04) */}
      <mesh position={[0, h + 0.03, 0]} castShadow receiveShadow>
        <boxGeometry args={[w + 0.06, 0.06, d + 0.05]} />
        <meshStandardMaterial color={WOODTOP} roughness={0.65} />
      </mesh>
      {/* pies */}
      {[-1, 1].map((s) => (
        <mesh key={`p${s}`} position={[s * (w / 2 - 0.12), 0.035, 0.02]}>
          <boxGeometry args={[0.12, 0.07, d - 0.08]} />
          <meshStandardMaterial color={MADERA_OSCURA} roughness={0.9} />
        </mesh>
      ))}
      {/* libros de pie en las dos baldas */}
      <BookRow position={[-0.24, 0.12, 0.02]} n={9} />
      <BookRow position={[-0.3, 0.52, 0.02]} n={7} />
      {/* pila de libros tumbados a la derecha de la balda inferior */}
      {tumbados.map((t, i) => (
        <mesh key={i} position={[0.44, t.y, 0.01]} rotation={[0, t.r, 0]} castShadow>
          <boxGeometry args={[0.3, 0.048, 0.21]} />
          <meshStandardMaterial color={t.c} roughness={0.85} />
        </mesh>
      ))}
      {/* tarro de la fábrica Blender en la balda media (base y=0.52) */}
      <GLB
        url="/modelos/tarro.glb"
        position={[0.42, 0.531, 0.02]}
        scale={0.42}
        fallback={
          <mesh position={[0.42, 0.61, 0.02]}>
            <cylinderGeometry args={[0.07, 0.07, 0.17, 12]} />
            <meshStandardMaterial color="#c9a83c" roughness={0.6} />
          </mesh>
        }
      />
      {/* platito de cortesía sobre la tapa */}
      <mesh position={[0.46, 1.055, 0.02]}>
        <cylinderGeometry args={[0.11, 0.1, 0.028, 14]} />
        <meshStandardMaterial color="#e2d3ae" roughness={0.75} />
      </mesh>
    </group>
  );
}

/** (2) Mesita auxiliar redonda con bandeja y dos tazas.
 *  Top de la tapa y=0.525 · top de la bandeja y=0.55. */
export function SideTable({ position, rotY = 0 }: { position: [number, number, number]; rotY?: number }) {
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      {/* tapa */}
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.33, 0.33, 0.05, 20]} />
        <meshStandardMaterial color={WOODTOP} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.465, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.31, 0.016, 6, 20]} />
        <meshStandardMaterial color={MADERA_MEDIA} roughness={0.8} />
      </mesh>
      {/* columna */}
      <mesh position={[0, 0.25, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.07, 0.48, 10]} />
        <meshStandardMaterial color={MADERA_MEDIA} roughness={0.8} />
      </mesh>
      {/* trípode */}
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2 + 0.4;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * 0.15, 0.085, Math.sin(a) * 0.15]}
            rotation={[0, -a, 0.35]}
            castShadow
          >
            <boxGeometry args={[0.34, 0.05, 0.07]} />
            <meshStandardMaterial color={MADERA_OSCURA} roughness={0.85} />
          </mesh>
        );
      })}
      {/* bandeja (top 0.55) */}
      <mesh position={[0, 0.538, 0]}>
        <cylinderGeometry args={[0.22, 0.21, 0.025, 18]} />
        <meshStandardMaterial color="#b08d57" metalness={0.35} roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.556, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.215, 0.012, 6, 20]} />
        <meshStandardMaterial color="#c8a165" metalness={0.4} roughness={0.5} />
      </mesh>
      {/* dos tazas de la fábrica Blender sobre la bandeja */}
      {([[-0.1, -0.03, 0.35], [0.09, 0.05, -1.9]] as const).map(([tx, tz, rot], i) => (
        <GLB
          key={i}
          url="/modelos/taza.glb"
          position={[tx, 0.555, tz]}
          rotation={[0, rot, 0]}
          scale={0.85}
          fallback={
            <mesh position={[tx, 0.605, tz]}>
              <cylinderGeometry args={[0.055, 0.048, 0.1, 12]} />
              <meshStandardMaterial color="#f1e6cd" roughness={0.5} />
            </mesh>
          }
        />
      ))}
      {/* azucarero minúsculo */}
      <mesh position={[0.02, 0.585, 0.13]}>
        <sphereGeometry args={[0.05, 10, 8]} />
        <meshStandardMaterial color="#e2d3ae" roughness={0.6} />
      </mesh>
    </group>
  );
}

/** (3) Cortinas y cenefa a los lados de una puerta (viste la pared).
 *  `position` = pie de la pared, en el eje de la puerta. */
export function DoorDrapes({
  position, rotY = 0, w = 2.1, top = 2.82,
}: { position: [number, number, number]; rotY?: number; w?: number; top?: number }) {
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      {/* barra (más corta que la cenefa: al lado hay reloj de pie) */}
      <mesh position={[0, top + 0.08, 0.16]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.022, 0.022, w - 0.06, 6]} />
        <meshStandardMaterial color={MADERA_OSCURA} roughness={0.7} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={`rem${s}`} position={[s * (w / 2 - 0.03), top + 0.08, 0.16]}>
          <sphereGeometry args={[0.045, 10, 8]} />
          <meshStandardMaterial color="#b08d57" metalness={0.5} roughness={0.4} />
        </mesh>
      ))}
      {/* cenefa: paño corto con festón de picos */}
      <mesh position={[0, top - 0.09, 0.16]} castShadow>
        <boxGeometry args={[w, 0.3, 0.05]} />
        <meshStandardMaterial color="#d9b98a" roughness={1} />
      </mesh>
      {Array.from({ length: 7 }).map((_, i) => (
        <mesh
          key={i}
          position={[-w / 2 + 0.14 + i * ((w - 0.28) / 6), top - 0.3, 0.16]}
          rotation={[Math.PI, 0, 0]}
        >
          <coneGeometry args={[0.075, 0.14, 4]} />
          <meshStandardMaterial color="#d9b98a" roughness={1} flatShading />
        </mesh>
      ))}
      {/* dos cortinas laterales recogidas */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * (w / 2 - 0.1), 1.5, 0.15]}>
          <mesh castShadow scale={[0.5, 1, 0.42]}>
            <cylinderGeometry args={[0.15, 0.23, 2.5, 8]} />
            <meshStandardMaterial color="#f3e4c4" roughness={1} />
          </mesh>
          <mesh position={[0, -0.3, 0]} scale={[0.56, 1, 0.46]}>
            <torusGeometry args={[0.14, 0.032, 6, 12]} />
            <meshStandardMaterial color="#c9a26a" roughness={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** (4) Cesto de labores: ovillos de tres colores y dos agujas. */
export function SewingBasket({ position, rotY = 0 }: { position: [number, number, number]; rotY?: number }) {
  const ovillos: { p: [number, number, number]; c: string; r: number }[] = [
    { p: [-0.07, 0.19, 0.03], c: "#8a4049", r: 0.075 },
    { p: [0.08, 0.18, -0.04], c: "#7c8a5a", r: 0.07 },
    { p: [0.01, 0.26, 0.06], c: "#c9a83c", r: 0.062 },
  ];
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      {/* cesta de mimbre */}
      <mesh position={[0, 0.13, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.17, 0.26, 14, 1, true]} />
        <meshStandardMaterial color="#a8763d" roughness={0.95} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.015, 0]}>
        <cylinderGeometry args={[0.17, 0.17, 0.03, 14]} />
        <meshStandardMaterial color="#96703f" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.26, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.22, 0.018, 6, 18]} />
        <meshStandardMaterial color="#8a5f38" roughness={0.9} />
      </mesh>
      {/* ovillos */}
      {ovillos.map((o, i) => (
        <group key={i} position={o.p}>
          <mesh>
            <sphereGeometry args={[o.r, 10, 8]} />
            <meshStandardMaterial color={o.c} roughness={1} />
          </mesh>
          {/* hebra enrollada */}
          <mesh rotation={[0.5, 0, 0.3]}>
            <torusGeometry args={[o.r * 0.98, 0.008, 5, 14]} />
            <meshStandardMaterial color={o.c} roughness={1} />
          </mesh>
        </group>
      ))}
      {/* hebra caída por el borde */}
      <mesh position={[0.19, 0.16, 0.1]} rotation={[0.3, 0, 0.6]}>
        <cylinderGeometry args={[0.006, 0.006, 0.28, 4]} />
        <meshStandardMaterial color="#c9a83c" roughness={1} />
      </mesh>
      {/* dos agujas cruzadas */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0.02 + s * 0.03, 0.33, -0.02]} rotation={[0.2 * s, 0, 0.35 * s]}>
          <cylinderGeometry args={[0.008, 0.004, 0.34, 5]} />
          <meshStandardMaterial color="#cbb083" roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

/** (5) Planta colgante: `position` es el punto de anclaje ARRIBA (techo). */
export function HangingPlant({ position }: { position: [number, number, number] }) {
  const tallos = Array.from({ length: 6 }, (_, i) => ({
    a: (i / 6) * Math.PI * 2 + 0.35,
    len: 0.42 + ((i * 37) % 5) * 0.055,
    tilt: 0.24 + ((i * 53) % 4) * 0.05,
  }));
  return (
    <group position={position}>
      {/* soporte y cadena corta */}
      <mesh position={[0, -0.02, 0]}>
        <boxGeometry args={[0.16, 0.04, 0.16]} />
        <meshStandardMaterial color={MADERA_OSCURA} roughness={0.8} />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[0, -0.1 - i * 0.075, 0]} rotation={[i % 2 ? 0 : Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.035, 0.009, 5, 10]} />
          <meshStandardMaterial color="#8a7350" metalness={0.55} roughness={0.45} />
        </mesh>
      ))}
      {/* tirantes hasta la maceta */}
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2;
        return (
          <mesh
            key={`t${i}`}
            position={[Math.cos(a) * 0.09, -0.53, Math.sin(a) * 0.09]}
            rotation={[Math.sin(a) * 0.18, 0, -Math.cos(a) * 0.18]}
          >
            <cylinderGeometry args={[0.007, 0.007, 0.42, 4]} />
            <meshStandardMaterial color="#c8a165" roughness={1} />
          </mesh>
        );
      })}
      {/* maceta */}
      <group position={[0, -0.86, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.21, 0.16, 0.26, 14]} />
          <meshStandardMaterial color="#b06a3d" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.14, 0]}>
          <cylinderGeometry args={[0.225, 0.225, 0.04, 14]} />
          <meshStandardMaterial color="#96552e" roughness={0.9} />
        </mesh>
        {/* tierra */}
        <mesh position={[0, 0.135, 0]}>
          <cylinderGeometry args={[0.19, 0.19, 0.03, 12]} />
          <meshStandardMaterial color="#3a2a1a" roughness={1} />
        </mesh>
        {/* 6 tallos cayendo, cada uno con tres hojas */}
        {tallos.map((t, i) => (
          <group key={i} rotation={[0, t.a, 0]}>
            <mesh position={[0.15, 0.05 - t.len / 2, 0]} rotation={[0, 0, t.tilt]}>
              <cylinderGeometry args={[0.008, 0.011, t.len, 5]} />
              <meshStandardMaterial color="#6f8f4a" roughness={1} />
            </mesh>
            {[0.3, 0.6, 0.92].map((f, k) => (
              <mesh
                key={k}
                position={[0.17 + f * t.len * 0.22, 0.05 - t.len * f, k % 2 ? 0.045 : -0.045]}
                rotation={[0, k * 1.1, 0.5]}
                scale={[1, 0.32, 0.62]}
              >
                <sphereGeometry args={[0.055, 7, 6]} />
                <meshStandardMaterial color={k % 2 ? "#7c8a5a" : "#9db76a"} roughness={1} />
              </mesh>
            ))}
          </group>
        ))}
      </group>
    </group>
  );
}

/** (6) Revistero de madera con periódicos y revistas enrolladas. */
export function MagazineRack({ position, rotY = 0 }: { position: [number, number, number]; rotY?: number }) {
  const papeles: { x: number; r: number; c: string; h: number }[] = [
    { x: -0.07, r: -0.16, c: "#efe3c6", h: 0.34 },
    { x: -0.01, r: -0.05, c: "#e6d8b4", h: 0.36 },
    { x: 0.05, r: 0.07, c: "#f2e9d2", h: 0.32 },
    { x: 0.1, r: 0.18, c: "#dfd0aa", h: 0.3 },
  ];
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      {/* dos costados en V */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.17, 0.22, 0]} rotation={[0, 0, s * 0.19]} castShadow>
          <boxGeometry args={[0.035, 0.44, 0.42]} />
          <meshStandardMaterial color={MADERA_MEDIA} roughness={0.8} />
        </mesh>
      ))}
      {/* fondo y travesaños */}
      <mesh position={[0, 0.06, 0]} castShadow>
        <boxGeometry args={[0.34, 0.04, 0.4]} />
        <meshStandardMaterial color={MADERA_OSCURA} roughness={0.85} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={`tr${s}`} position={[0, 0.4, s * 0.2]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.014, 0.014, 0.44, 6]} />
          <meshStandardMaterial color={MADERA_OSCURA} roughness={0.85} />
        </mesh>
      ))}
      {/* asa */}
      <mesh position={[0, 0.47, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.016, 0.016, 0.22, 6]} />
        <meshStandardMaterial color={MADERA} roughness={0.8} />
      </mesh>
      {/* periódicos dentro */}
      {papeles.map((p, i) => (
        <mesh key={i} position={[p.x, 0.08 + p.h / 2, 0.01]} rotation={[0, 0.1 * i, p.r]}>
          <boxGeometry args={[0.03, p.h, 0.32]} />
          <meshStandardMaterial color={p.c} roughness={1} />
        </mesh>
      ))}
      {/* uno enrollado asomando */}
      <mesh position={[0.02, 0.44, 0.14]} rotation={[0.9, 0.2, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 0.3, 10]} />
        <meshStandardMaterial color="#efe3c6" roughness={1} />
      </mesh>
    </group>
  );
}

/** (7) Marco de fotos de sobremesa: los dos fundadores en silueta.
 *  `position` = la superficie donde apoya (el marco crece hacia arriba). */
export function PhotoFrame({ position, rotY = 0 }: { position: [number, number, number]; rotY?: number }) {
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      {/* marco ligeramente inclinado */}
      <group position={[0, 0.13, 0]} rotation={[-0.14, 0, 0]}>
        <mesh>
          <boxGeometry args={[0.24, 0.28, 0.02]} />
          <meshStandardMaterial color="#b08d57" metalness={0.4} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0, 0.014]}>
          <boxGeometry args={[0.19, 0.23, 0.006]} />
          <meshStandardMaterial color="#f6ecd4" roughness={1} />
        </mesh>
        {/* fondo del retrato */}
        <mesh position={[0, 0, 0.018]}>
          <boxGeometry args={[0.165, 0.2, 0.004]} />
          <meshStandardMaterial color="#e0d0ae" roughness={1} />
        </mesh>
        {/* dos siluetas: hombro + cabeza */}
        {([[-0.04, "#7d3a44"], [0.04, "#54654a"]] as const).map(([sx, c], i) => (
          <group key={i} position={[sx, 0, 0.021]}>
            <mesh position={[0, -0.055, 0]} scale={[1, 0.7, 0.2]}>
              <sphereGeometry args={[0.045, 8, 6]} />
              <meshStandardMaterial color={c} roughness={1} />
            </mesh>
            <mesh position={[0, 0.02, 0]} scale={[1, 1.1, 0.2]}>
              <sphereGeometry args={[0.026, 8, 7]} />
              <meshStandardMaterial color="#c9a083" roughness={1} />
            </mesh>
          </group>
        ))}
      </group>
      {/* caballete trasero */}
      <mesh position={[0, 0.1, -0.06]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[0.05, 0.2, 0.012]} />
        <meshStandardMaterial color={MADERA_OSCURA} roughness={0.85} />
      </mesh>
    </group>
  );
}

/* ── despensa ── */

/** (8) Estantería estrecha de tres baldas: seis conservas y dos quesos.
 *  Tops: 0.62 · 1.22 · 1.82. */
export function NarrowPantryShelf({
  position, rotY = 0, w = 1.9,
}: { position: [number, number, number]; rotY?: number; w?: number }) {
  const d = 0.36;
  const baldas = [0.6, 1.2, 1.8];
  const abajo = ["#b83a2a", "#6f8f4a", "#e08a2e"];
  const medio = ["#8a4049", "#c9a83c", "#a65a2e"];
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      {/* costados */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (w / 2 - 0.04), 1.05, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.08, 2.1, d]} />
          <meshStandardMaterial color={MADERA_OSCURA} roughness={0.85} />
        </mesh>
      ))}
      {/* baldas (top = valor + 0.02) */}
      {baldas.map((y, i) => (
        <mesh key={i} position={[0, y, 0]} castShadow receiveShadow>
          <boxGeometry args={[w - 0.08, 0.04, d]} />
          <meshStandardMaterial color={MADERA_MEDIA} roughness={0.85} />
        </mesh>
      ))}
      {/* travesaño superior */}
      <mesh position={[0, 2.08, -d / 2 + 0.04]}>
        <boxGeometry args={[w - 0.08, 0.1, 0.05]} />
        <meshStandardMaterial color={MADERA_MEDIA} roughness={0.9} />
      </mesh>
      {/* 6 conservas: tres abajo, tres en medio */}
      {abajo.map((c, i) => (
        <ConserveJar key={`a${i}`} position={[-0.52 + i * 0.32, 0.62, i % 2 ? -0.04 : 0.04]} color={c} />
      ))}
      {medio.map((c, i) => (
        <ConserveJar key={`m${i}`} position={[0.52 - i * 0.32, 1.22, i % 2 ? 0.04 : -0.04]} color={c} cloth="#d9b48a" />
      ))}
      {/* 2 quesos arriba (centro del cilindro = top + r*0.275) */}
      <CheeseWheel position={[-0.42, 1.82 + 0.045, 0.01]} r={0.165} />
      <CheeseWheel position={[0.24, 1.82 + 0.036, -0.02]} r={0.13} />
      {/* paño colgando de la balda de en medio */}
      <mesh position={[0.66, 1.11, d / 2 - 0.03]} rotation={[0, 0, 0.06]}>
        <boxGeometry args={[0.2, 0.2, 0.012]} />
        <meshStandardMaterial color="#c9d6b0" roughness={1} />
      </mesh>
    </group>
  );
}

/** (9) Taburete con cesta de panes: cuatro hogazas de corteza. */
export function BreadStool({ position, rotY = 0 }: { position: [number, number, number]; rotY?: number }) {
  const hogazas: { p: [number, number]; r: number; c: string; g: number }[] = [
    { p: [-0.09, -0.04], r: 0.135, c: "#c98a3b", g: 0.25 },
    { p: [0.1, 0.02], r: 0.125, c: "#b8762f", g: -0.5 },
    { p: [-0.02, 0.12], r: 0.115, c: "#d9a55a", g: 0.9 },
    { p: [0.03, -0.11], r: 0.105, c: "#c07f33", g: 1.6 },
  ];
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      {/* taburete: asiento a y=0.32 (top 0.345) */}
      <mesh position={[0, 0.32, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.26, 0.27, 0.05, 12]} />
        <meshStandardMaterial color={MADERA} roughness={0.88} />
      </mesh>
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2 + 0.5;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * 0.18, 0.155, Math.sin(a) * 0.18]}
            rotation={[Math.sin(a) * 0.14, 0, -Math.cos(a) * 0.14]}
            castShadow
          >
            <cylinderGeometry args={[0.02, 0.026, 0.3, 6]} />
            <meshStandardMaterial color={MADERA_OSCURA} roughness={0.9} />
          </mesh>
        );
      })}
      {/* cesta ancha y baja sobre el asiento */}
      <group position={[0, 0.345, 0]}>
        <mesh position={[0, 0.06, 0]} castShadow>
          <cylinderGeometry args={[0.28, 0.22, 0.12, 16, 1, true]} />
          <meshStandardMaterial color="#a8763d" roughness={0.95} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0.01, 0]}>
          <cylinderGeometry args={[0.22, 0.22, 0.02, 16]} />
          <meshStandardMaterial color="#96703f" roughness={0.95} />
        </mesh>
        <mesh position={[0, 0.12, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.28, 0.02, 6, 20]} />
          <meshStandardMaterial color="#8a5f38" roughness={0.9} />
        </mesh>
        {/* paño de lino asomando */}
        <mesh position={[0.18, 0.1, 0.13]} rotation={[0.4, 0.6, 0.2]} scale={[1, 0.25, 1]}>
          <sphereGeometry args={[0.13, 8, 6]} />
          <meshStandardMaterial color="#f3e4c4" roughness={1} />
        </mesh>
        {/* hogazas: esferas achatadas con greña */}
        {hogazas.map((h, i) => (
          <group key={i} position={[h.p[0], 0.12, h.p[1]]}>
            <mesh castShadow scale={[1, 0.55, 0.8]}>
              <sphereGeometry args={[h.r, 10, 8]} />
              <meshStandardMaterial color={h.c} roughness={0.95} />
            </mesh>
            <mesh position={[0, h.r * 0.5, 0]} rotation={[0, h.g, 0]} scale={[1, 0.35, 0.16]}>
              <sphereGeometry args={[h.r * 0.72, 8, 6]} />
              <meshStandardMaterial color="#e9cf9e" roughness={1} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

/** (10) Manojo de hierbas secas colgado de un clavo en la pared. */
export function HerbBunch({
  position, rotY = 0, color = "#8a9b6e",
}: { position: [number, number, number]; rotY?: number; color?: string }) {
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      {/* clavo */}
      <mesh position={[0, 0, 0.04]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.08, 6]} />
        <meshStandardMaterial color="#4a4038" metalness={0.5} roughness={0.6} />
      </mesh>
      {/* cordel */}
      <mesh position={[0, -0.08, 0.05]}>
        <cylinderGeometry args={[0.008, 0.008, 0.16, 4]} />
        <meshStandardMaterial color="#c8a165" roughness={1} />
      </mesh>
      {/* atado y manojo cabeza abajo */}
      <mesh position={[0, -0.18, 0.05]}>
        <cylinderGeometry args={[0.035, 0.035, 0.05, 8]} />
        <meshStandardMaterial color="#b99a6b" roughness={1} />
      </mesh>
      <mesh position={[0, -0.42, 0.05]} rotation={[0, 0, 0.05]} castShadow>
        <coneGeometry args={[0.13, 0.46, 8]} />
        <meshStandardMaterial color={color} roughness={1} flatShading />
      </mesh>
      {/* ramitas sueltas */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.09, -0.5, 0.05 + s * 0.03]} rotation={[0, 0, s * 0.22]}>
          <coneGeometry args={[0.045, 0.3, 6]} />
          <meshStandardMaterial color={s > 0 ? "#9db76a" : "#6f8f5a"} roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

/** (11) Balda pequeña de pared con tres tarros pequeños (GLB). Top de la balda = y del grupo + 0.025. */
export function SmallJarShelf({
  position, rotY = 0, w = 0.95,
}: { position: [number, number, number]; rotY?: number; w?: number }) {
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <mesh castShadow>
        <boxGeometry args={[w, 0.05, 0.24]} />
        <meshStandardMaterial color={MADERA_MEDIA} roughness={0.8} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (w / 2 - 0.12), -0.09, -0.05]}>
          <boxGeometry args={[0.045, 0.13, 0.12]} />
          <meshStandardMaterial color={MADERA_OSCURA} roughness={0.85} />
        </mesh>
      ))}
      {[-1, 0, 1].map((i) => (
        <GLB
          key={i}
          url="/modelos/tarro.glb"
          position={[i * 0.29, 0.034, 0.01]}
          rotation={[0, i * 0.9, 0]}
          scale={0.4}
          fallback={
            <mesh position={[i * 0.29, 0.12, 0.01]}>
              <cylinderGeometry args={[0.065, 0.065, 0.16, 12]} />
              <meshStandardMaterial color="#c9a83c" roughness={0.6} />
            </mesh>
          }
        />
      ))}
    </group>
  );
}

/** (12) Cuenco de leche en el suelo — el guiño al gato de la entrada. */
export function MilkBowl({ position, rotY = 0 }: { position: [number, number, number]; rotY?: number }) {
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      {/* cuenco */}
      <mesh position={[0, 0.045, 0]}>
        <cylinderGeometry args={[0.115, 0.075, 0.09, 16]} />
        <meshStandardMaterial color="#cbb083" roughness={0.65} />
      </mesh>
      <mesh position={[0, 0.09, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.113, 0.012, 6, 18]} />
        <meshStandardMaterial color="#b9976a" roughness={0.7} />
      </mesh>
      {/* leche */}
      <mesh position={[0, 0.078, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.012, 16]} />
        <meshStandardMaterial color="#fbf5e6" roughness={0.35} />
      </mesh>
      {/* dos gotas en el suelo */}
      {([[0.17, 0.06, 0.028], [0.13, -0.11, 0.02]] as const).map(([gx, gz, gr], i) => (
        <mesh key={i} position={[gx, 0.006, gz]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[gr, 10]} />
          <meshStandardMaterial color="#f6efdd" roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}
