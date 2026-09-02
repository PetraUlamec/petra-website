"use client";
// REALISMO CENTRALIZADO (C-3D-B, pase 2 «luz horneada / AO / materiales / post»). Montado desde SceneShell,
// sin tocar ninguna escena ni pieza: trabaja sobre el `scene` vivo.
//
// 1) MICRO-SUPERFICIE GLOBAL: cada ~60 frames recorre la escena y a todo MeshStandard/PhysicalMaterial
//    SIN textura le pone las texturas procedurales compartidas de lib/materials.ts (roughnessMap de ruido
//    ±10 % y bumpMap sutil; pulidos/cristal/metal: solo ruido fino). Conserva color y emissive. Marca
//    `userData.__micro` y vale también para lo que el catálogo vivo añade después (por eso el throttle).
// 2) DEDUP: materiales idénticos (misma clave color+rugosidad+metal+emisivo+…) comparten instancia → menos
//    cambios de estado. SOLO opacos, sin emisivo y cuya malla no cuelgue de un subárbol con handlers R3F
//    (hover/click cambian props del material original: compartirlo rompería la interacción).
// No toca: drei <Text> (troika), Points, Sprites, meshBasicMaterial, geometrías sin UV.
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useRef, useState } from "react";
import { ContactShadows } from "@react-three/drei";
import { microTextures } from "@/lib/materials";
import LightShaft from "./LightShaft";
import { useQuality, CONTACT_RES } from "@/lib/quality";

type Std = THREE.MeshStandardMaterial & { isMeshPhysicalMaterial?: boolean; transmission?: number; clearcoat?: number; sheen?: number; ior?: number; thickness?: number; anisotropy?: number; iridescence?: number };
type R3fInstance = { eventCount?: number };

export interface RealismoStats { mallas: number; unicosAntes: number; unicosDespues: number; micro: number; dedup: number; pasadas: number }

function esInteractivo(o: THREE.Object3D): boolean {
  let p: THREE.Object3D | null = o;
  while (p) {
    const r = (p as unknown as { __r3f?: R3fInstance }).__r3f;
    if (r && (r.eventCount ?? 0) > 0) return true;
    p = p.parent;
  }
  return false;
}

function esMallaApta(o: THREE.Object3D): o is THREE.Mesh {
  const m = o as THREE.Mesh & { isTroikaText?: boolean };
  if (!m.isMesh || !m.geometry) return false;
  if (m.isTroikaText || (m.geometry.type || "").startsWith("Glyphs")) return false; // drei <Text>
  return !!m.geometry.attributes?.uv;
}

function claveDedup(m: Std): string | null {
  if (m.transparent || m.opacity < 1 || m.alphaTest > 0) return null;
  if (m.emissiveIntensity > 0 && m.emissive.getHex() !== 0) return null;
  if (m.onBeforeCompile !== THREE.Material.prototype.onBeforeCompile) return null;
  if (m.map || m.normalMap || m.emissiveMap || m.alphaMap || m.aoMap || m.metalnessMap) return null;
  const phys = m.isMeshPhysicalMaterial
    ? `|P${m.clearcoat ?? 0}|${m.transmission ?? 0}|${m.sheen ?? 0}|${m.ior ?? 0}|${m.thickness ?? 0}|${m.anisotropy ?? 0}|${m.iridescence ?? 0}`
    : "";
  return `${m.type}|${m.color.getHex()}|${m.roughness.toFixed(3)}|${m.metalness}|${m.side}|${m.depthWrite}|${m.depthTest}|${m.envMapIntensity}|${m.flatShading}|${m.vertexColors}|${m.fog}|${m.roughnessMap?.uuid ?? ""}|${m.bumpMap?.uuid ?? ""}|${m.bumpScale}|${m.normalScale.x}${phys}`;
}

export function pasadaRealismo(scene: THREE.Scene, canon: Map<string, Std>, stats: RealismoStats) {
  const micro = microTextures();
  if (!micro) return;
  const antes = new Set<THREE.Material>(), despues = new Set<THREE.Material>();
  let mallas = 0, nMicro = 0, nDedup = 0;
  scene.traverse((o) => {
    if (!esMallaApta(o)) return;
    mallas++;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    const interactivo = esInteractivo(o);
    mats.forEach((mat, idx) => {
      antes.add(mat);
      const m = mat as Std;
      if (!m.isMeshStandardMaterial || (m as unknown as { isDerivedMaterial?: boolean }).isDerivedMaterial) { despues.add(mat); return; }
      // 1) micro-superficie
      if (!m.userData.__micro) {
        m.userData.__micro = true;
        if (!m.map && !m.roughnessMap && !m.bumpMap && !m.normalMap) {
          const pulido = m.roughness < 0.35 || (m.transmission ?? 0) > 0;
          const metal = m.metalness > 0.5;
          if (pulido) {
            m.roughnessMap = micro.roughFine;
            m.roughness = m.roughness / (1 - micro.ampFine);
          } else {
            m.roughnessMap = micro.rough;
            m.roughness = m.roughness / (1 - micro.ampRough); // la media queda donde estaba; el shader recorta a 1
            m.bumpMap = micro.bump;
            m.bumpScale = metal ? 0.004 : 0.012;
          }
          m.needsUpdate = true;
          nMicro++;
        }
      }
      // 2) dedup (solo fuera de subárboles interactivos)
      if (interactivo) { despues.add(m); return; }
      const k = claveDedup(m);
      if (!k) { despues.add(m); return; }
      const c = canon.get(k);
      if (!c) { canon.set(k, m); despues.add(m); return; }
      if (c !== m) {
        if (Array.isArray(o.material)) o.material[idx] = c; else o.material = c;
        nDedup++;
      }
      despues.add(c);
    });
  });
  stats.mallas = mallas; stats.unicosAntes = antes.size; stats.unicosDespues = despues.size;
  stats.micro += nMicro; stats.dedup += nDedup; stats.pasadas++;
}

/** Recorrido throttled (frames 2, 12, 30 y luego cada 60): el catálogo vivo y los GLB llegan tarde. */
export function MicroSuperficie() {
  const scene = useThree((s) => s.scene);
  const frame = useRef(0);
  const canon = useRef(new Map<string, Std>());
  const stats = useRef<RealismoStats>({ mallas: 0, unicosAntes: 0, unicosDespues: 0, micro: 0, dedup: 0, pasadas: 0 });
  useFrame(() => {
    const f = ++frame.current;
    if (f === 2 || f === 12 || f === 30 || f % 60 === 0) {
      pasadaRealismo(scene, canon.current, stats.current);
      (window as unknown as { __realismo?: RealismoStats }).__realismo = { ...stats.current };
    }
  });
  return null;
}

/* ── 3) SOMBRAS DE CONTACTO a ras de suelo (drei ContactShadows) ──
   Huella calculada de la escena (unión de las mallas bajas y planas con receiveShadow: tablas, alfombra,
   calle de la entrada) → vale para las salas 10×10 y para el jardín 34×22 de «/». `frames={1}` (una pasada
   de profundidad + 2 blurs) y `key` que cambia con el nº de mallas: re-hornea solo cuando llega algo nuevo
   (GLB, catálogo vivo), nunca cada frame. Depuración: ?cs=0 la apaga para comparar capturas. */
interface Huella { cx: number; cz: number; w: number; d: number }
const _bb = new THREE.Box3();
function huellaSuelo(scene: THREE.Scene): Huella | null {
  const u = new THREE.Box3();
  scene.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || !m.receiveShadow || !m.geometry) return;
    if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
    if (!m.geometry.boundingBox) return;
    _bb.copy(m.geometry.boundingBox).applyMatrix4(m.matrixWorld);
    if (!isFinite(_bb.min.x) || _bb.max.y - _bb.min.y > 0.12 || _bb.max.y > 0.1) return; // solo suelo
    if ((_bb.max.x - _bb.min.x) * (_bb.max.z - _bb.min.z) < 1) return;
    u.union(_bb);
  });
  if (u.isEmpty()) return null;
  const w = Math.min(40, u.max.x - u.min.x), d = Math.min(40, u.max.z - u.min.z);
  return { cx: (u.min.x + u.max.x) / 2, cz: (u.min.z + u.max.z) / 2, w: +w.toFixed(2), d: +d.toFixed(2) };
}

export function SombrasContacto() {
  const q = useQuality();
  const scene = useThree((s) => s.scene);
  const [estado, setEstado] = useState<{ huella: Huella; mallas: number } | null>(null);
  const frame = useRef(0);
  const res = CONTACT_RES[q];
  const apagado = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("cs") === "0";
  useFrame(() => {
    const f = ++frame.current;
    if (f !== 3 && f !== 40 && f % 120 !== 0) return;
    let mallas = 0;
    scene.traverse((o) => { if ((o as THREE.Mesh).isMesh) mallas++; });
    if (estado && estado.mallas === mallas) return;
    const huella = huellaSuelo(scene);
    if (huella) setEstado({ huella, mallas });
  });
  if (!res || apagado || !estado) return null;
  const { huella, mallas } = estado;
  return (
    <ContactShadows
      key={`${mallas}|${huella.w}|${huella.d}`}
      position={[huella.cx, 0.028, huella.cz]}
      scale={[huella.w, huella.d]}
      resolution={res}
      frames={1}
      far={1.2}
      blur={2.2}
      opacity={0.45}
      color="#3a2513"
    />
  );
}

/* ── 4) HAZ DE LUZ de la ventana (god-rays falsos: LightShaft.tsx ya existía, sin cable) ──
   Genérico: busca el cristal emisivo grande de la ventana (emissiveIntensity ≥ 2, área > 1 m²) pegado a la
   pared trasera (z ≈ -4.9) o lateral (x ≈ -4.9) y cuelga el haz ahí. Los escaparates de la entrada (z≈-0.8)
   no cuentan: el sol no entra hacia la calle. Coste: 1 plano aditivo. */
interface Haz { pos: [number, number, number]; rotY: number }
function hazDeVentana(scene: THREE.Scene): Haz | null {
  let haz: Haz | null = null;
  scene.traverse((o) => {
    if (haz) return;
    const m = o as THREE.Mesh;
    const mat = m.material as THREE.MeshStandardMaterial | undefined;
    if (!m.isMesh || !m.geometry || !mat || !mat.isMeshStandardMaterial || (mat.emissiveIntensity ?? 0) < 2) return;
    if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
    if (!m.geometry.boundingBox) return;
    _bb.copy(m.geometry.boundingBox).applyMatrix4(m.matrixWorld);
    const sx = _bb.max.x - _bb.min.x, sy = _bb.max.y - _bb.min.y, sz = _bb.max.z - _bb.min.z;
    const c = _bb.getCenter(new THREE.Vector3());
    if (sy < 1) return;
    if (sz < 0.5 && sx * sy > 1 && Math.abs(c.z + 4.9) < 0.35) haz = { pos: [c.x, 2.2, -4.7], rotY: 0 };
    else if (sx < 0.5 && sz * sy > 1 && Math.abs(c.x + 4.9) < 0.35) haz = { pos: [-4.7, 2.2, c.z], rotY: Math.PI / 2 };
  });
  return haz;
}

export function HazDeLuz() {
  const scene = useThree((s) => s.scene);
  const [haz, setHaz] = useState<Haz | null>(null);
  const frame = useRef(0);
  // APAGADO por defecto hasta que el auditor geo2 salte mallas `userData.intangible` (el plano del haz
  // daba 2 «solapes» falsos en /contacto). ?haz=1 lo enciende para verlo; ?haz=0 lo apaga.
  const HAZ_POR_DEFECTO = false;
  const param = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("haz") : null;
  const apagado = param ? param === "0" : !HAZ_POR_DEFECTO;
  useFrame(() => {
    const f = ++frame.current;
    if (haz || (f !== 4 && f !== 60 && f % 240 !== 0)) return;
    const h = hazDeVentana(scene);
    if (h) setHaz(h);
  });
  if (!haz || apagado) return null;
  return <LightShaft position={haz.pos} rotY={haz.rotY} />;
}

export default function Realismo() {
  return (
    <>
      <MicroSuperficie />
      <SombrasContacto />
      <HazDeLuz />
    </>
  );
}
