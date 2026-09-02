"use client";
// FÁBRICA DE MATERIALES PBR PROCEDURALES OFFLINE (plan F0b, diseño del arquitecto).
// Texturas generadas en canvas con ruido determinista (misma semilla = mismo render), en GRIS
// neutro y teñidas por material.color → 4 juegos de texturas sirven para todos los tonos.
// Doble caché a nivel de módulo: cientos de meshes, ~una docena de materiales reales.
import * as THREE from "three";

/* ── ruido determinista ── */
function hash(x: number, y: number, seed: number) {
  let h = (x * 374761393 + y * 668265263 + seed * 144665) | 0;
  h = ((h ^ (h >> 13)) * 1274126177) | 0;
  return ((h ^ (h >> 16)) >>> 0) / 4294967295;
}
function vnoise(x: number, y: number, seed: number) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const s = (t: number) => t * t * (3 - 2 * t);
  const a = hash(xi, yi, seed), b = hash(xi + 1, yi, seed), c = hash(xi, yi + 1, seed), d = hash(xi + 1, yi + 1, seed);
  return a + (b - a) * s(xf) + (c - a) * s(yf) + (a - b - c + d) * s(xf) * s(yf);
}
function fbm(x: number, y: number, oct: number, seed: number) {
  let v = 0, amp = 0.5, f = 1;
  for (let i = 0; i < oct; i++) { v += amp * vnoise(x * f, y * f, seed + i); amp *= 0.5; f *= 2; }
  return v;
}

/* ── altura → normal (Sobel con wrap: tesela igual que el map) ── */
function heightToNormal(h: Float32Array, w: number, hgt: number, strength = 2): Uint8ClampedArray<ArrayBuffer> {
  const out = new Uint8ClampedArray(new ArrayBuffer(w * hgt * 4));
  const at = (x: number, y: number) => h[((y + hgt) % hgt) * w + ((x + w) % w)];
  for (let y = 0; y < hgt; y++) for (let x = 0; x < w; x++) {
    const dx = (at(x - 1, y - 1) + 2 * at(x - 1, y) + at(x - 1, y + 1)
              - at(x + 1, y - 1) - 2 * at(x + 1, y) - at(x + 1, y + 1)) * strength;
    const dy = (at(x - 1, y - 1) + 2 * at(x, y - 1) + at(x + 1, y - 1)
              - at(x - 1, y + 1) - 2 * at(x, y + 1) - at(x + 1, y + 1)) * strength;
    const inv = 1 / Math.hypot(dx, dy, 1), i = (y * w + x) * 4;
    out[i] = (dx * inv * 0.5 + 0.5) * 255; out[i + 1] = (dy * inv * 0.5 + 0.5) * 255;
    out[i + 2] = (inv * 0.5 + 0.5) * 255; out[i + 3] = 255;
  }
  return out;
}

interface TexSet { map: THREE.Texture; roughnessMap: THREE.Texture; normalMap?: THREE.Texture; bumpMap?: THREE.Texture; }
const texCache = new Map<string, TexSet>();
const matCache = new Map<string, THREE.MeshStandardMaterial>();
let maxAniso = 1;
export function initMaterials(gl: THREE.WebGLRenderer) {
  maxAniso = Math.min(8, gl.capabilities.getMaxAnisotropy());
}

function makeTex(data: Uint8ClampedArray<ArrayBuffer>, size: number, srgb: boolean, repeat: [number, number]): THREE.Texture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.putImageData(new ImageData(data, size, size), 0, 0);
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(...repeat);
  t.anisotropy = maxAniso;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.needsUpdate = true;
  return t;
}

/* ── generadores (gris neutro; el tono lo pone material.color) ── */
function genWood(size: number): TexSet {
  const key = `wood${size}`;
  if (texCache.has(key)) return texCache.get(key)!;
  const col = new Uint8ClampedArray(new ArrayBuffer(size * size * 4));
  const rough = new Uint8ClampedArray(new ArrayBuffer(size * size * 4));
  const height = new Float32Array(size * size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = (y * size + x) * 4;
    const t = (x / size) * 7 + fbm(x * 0.012, y * 0.004, 3, 11) * 3.2;
    let band = 0.5 + 0.5 * Math.sin(t * Math.PI * 2);
    band = Math.pow(band, 3);
    const grain = fbm(x * 0.16, y * 0.02, 2, 23);
    const lum = 228 - band * 48 - grain * 24; // gris cálido neutro, luminancia ~0.9
    col[i] = lum; col[i + 1] = lum * 0.94; col[i + 2] = lum * 0.86; col[i + 3] = 255;
    const r = (0.7 + grain * 0.2 - band * 0.1) * 255;
    rough[i] = rough[i + 1] = rough[i + 2] = r; rough[i + 3] = 255;
    height[y * size + x] = band * 0.7 + grain * 0.3;
  }
  const set: TexSet = {
    map: makeTex(col, size, true, [1.6, 1.6]),
    roughnessMap: makeTex(rough, size, false, [1.6, 1.6]),
    normalMap: makeTex(heightToNormal(height, size, size, 1.6), size, false, [1.6, 1.6]),
  };
  texCache.set(key, set);
  return set;
}

function genPlaster(size: number): TexSet {
  const key = `plaster${size}`;
  if (texCache.has(key)) return texCache.get(key)!;
  const col = new Uint8ClampedArray(new ArrayBuffer(size * size * 4));
  const rough = new Uint8ClampedArray(new ArrayBuffer(size * size * 4));
  const height = new Float32Array(size * size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = (y * size + x) * 4;
    const stain = fbm(x * 0.008, y * 0.008, 2, 41);
    const grain = fbm(x * 0.12, y * 0.12, 2, 57);
    const lum = 240 - stain * 14 - grain * 9;
    col[i] = lum; col[i + 1] = lum; col[i + 2] = lum * 0.985; col[i + 3] = 255;
    const r = (0.9 + grain * 0.08) * 255;
    rough[i] = rough[i + 1] = rough[i + 2] = r; rough[i + 3] = 255;
    height[y * size + x] = grain;
  }
  const set: TexSet = {
    map: makeTex(col, size, true, [2, 1.2]),
    roughnessMap: makeTex(rough, size, false, [2, 1.2]),
  };
  // bump directo con el mapa de altura en gris (hy3 #10)
  const hc = new Uint8ClampedArray(new ArrayBuffer(size * size * 4));
  for (let j = 0; j < size * size; j++) { const v = height[j] * 255; hc[j * 4] = hc[j * 4 + 1] = hc[j * 4 + 2] = v; hc[j * 4 + 3] = 255; }
  set.bumpMap = makeTex(hc, size, false, [2, 1.2]);
  texCache.set(key, set);
  return set;
}

function genLinen(size: number): TexSet {
  const key = `linen${size}`;
  if (texCache.has(key)) return texCache.get(key)!;
  const col = new Uint8ClampedArray(new ArrayBuffer(size * size * 4));
  const rough = new Uint8ClampedArray(new ArrayBuffer(size * size * 4));
  const height = new Float32Array(size * size);
  const f = (Math.PI * 2 * 46) / size;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = (y * size + x) * 4;
    const weave = Math.sin(x * f) * Math.sin(y * f);
    const n = fbm(x * 0.09, y * 0.09, 2, 71);
    const lum = 232 - weave * 13 - n * 12;
    col[i] = lum; col[i + 1] = lum * 0.99; col[i + 2] = lum * 0.95; col[i + 3] = 255;
    const r = (0.92 + n * 0.06) * 255;
    rough[i] = rough[i + 1] = rough[i + 2] = r; rough[i + 3] = 255;
    height[y * size + x] = weave * 0.5 + 0.5;
  }
  const set: TexSet = {
    map: makeTex(col, size, true, [3, 3]),
    roughnessMap: makeTex(rough, size, false, [3, 3]),
    normalMap: makeTex(heightToNormal(height, size, size, 1.1), size, false, [3, 3]),
  };
  texCache.set(key, set);
  return set;
}

function genMetal(size: number): TexSet {
  const key = `metal${size}`;
  if (texCache.has(key)) return texCache.get(key)!;
  const col = new Uint8ClampedArray(new ArrayBuffer(size * size * 4));
  const rough = new Uint8ClampedArray(new ArrayBuffer(size * size * 4));
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = (y * size + x) * 4;
    const mottle = fbm(x * 0.03, y * 0.03, 3, 91);
    const lum = 226 - mottle * 36;
    col[i] = lum; col[i + 1] = lum * 0.97; col[i + 2] = lum * 0.9; col[i + 3] = 255;
    const r = (0.3 + mottle * 0.5) * 255; // el roughness manchado "vende" el metal viejo
    rough[i] = rough[i + 1] = rough[i + 2] = r; rough[i + 3] = 255;
  }
  const set: TexSet = { map: makeTex(col, size, true, [1, 1]), roughnessMap: makeTex(rough, size, false, [1, 1]) };
  texCache.set(key, set);
  return set;
}

/* ── materiales compartidos ── */
type Kind = "wood" | "plaster" | "linen" | "metal";
const GEN: Record<Kind, (s: number) => TexSet> = { wood: genWood, plaster: genPlaster, linen: genLinen, metal: genMetal };

export function sharedMaterial(kind: Kind, tone: string, opts: { size?: number; roughness?: number; metalness?: number } = {}): THREE.MeshStandardMaterial {
  if (typeof document === "undefined") return new THREE.MeshStandardMaterial({ color: tone }); // SSR guard
  const size = opts.size ?? 512;
  const key = `${kind}|${tone}|${size}|${opts.roughness ?? ""}|${opts.metalness ?? ""}`;
  const hit = matCache.get(key);
  if (hit) return hit;
  const tex = GEN[kind](size);
  const m = new THREE.MeshStandardMaterial({
    color: new THREE.Color(tone).multiplyScalar(1.06), // tinte casi fiel (hy3 #9)
    map: tex.map,
    roughnessMap: tex.roughnessMap,
    // solo los mapas que existen: pasar `undefined` dispara el aviso «parameter has value of undefined» (C-3D-B)
    ...(tex.normalMap ? { normalMap: tex.normalMap } : {}),
    ...(tex.bumpMap ? { bumpMap: tex.bumpMap, bumpScale: 0.04 } : {}),
    roughness: opts.roughness ?? 1,
    metalness: opts.metalness ?? (kind === "metal" ? 0.85 : 0),
  });
  if (tex.normalMap) m.normalScale.set(0.9, 0.9);
  // la cal y el lino NO reflejan el entorno (mataba la pared con una mancha clara en el rincón)
  if (kind === "plaster") m.envMapIntensity = 0.12;
  if (kind === "linen") m.envMapIntensity = 0.25;
  matCache.set(key, m);
  return m;
}

/* ── MICRO-SUPERFICIE GLOBAL (C-3D-B, pase 2) ─────────────────────────────────────────────
   Tres texturas compartidas, generadas UNA vez, para los cientos de <meshStandardMaterial color=…>
   planos del catálogo: `rough` (ruido de rugosidad ±10 % alrededor de la rugosidad del material),
   `roughFine` (±5 %, más fino: cristal, cerámica pulida, metal) y `bump` (altura fbm para un bump
   sutil). Teselables (mezcla 4-vías) para que los cilindros no muestren costura.
   El material conserva su color/emissive; quien las aplica es components/three/Realismo.tsx. */
export interface MicroSet { rough: THREE.Texture; roughFine: THREE.Texture; bump: THREE.Texture; ampRough: number; ampFine: number }
let microSet: MicroSet | null = null;

/** fbm teselable en [0,1] (mezcla de 4 copias desplazadas) */
function fbmTile(x: number, y: number, size: number, freq: number, oct: number, seed: number) {
  const norm = 1 - Math.pow(0.5, oct); // suma de amplitudes 0.5+0.25+…
  const f = (px: number, py: number) => fbm(px * freq, py * freq, oct, seed) / norm;
  const u = x / size, v = y / size;
  const a = f(x, y), b = f(x - size, y), c = f(x, y - size), d = f(x - size, y - size);
  return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v;
}

export function microTextures(size = 256): MicroSet | null {
  if (microSet) return microSet;
  if (typeof document === "undefined") return null;
  const ampRough = 0.10, ampFine = 0.05;
  const rough = new Uint8ClampedArray(new ArrayBuffer(size * size * 4));
  const fine = new Uint8ClampedArray(new ArrayBuffer(size * size * 4));
  const bump = new Uint8ClampedArray(new ArrayBuffer(size * size * 4));
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = (y * size + x) * 4;
    const n = fbmTile(x, y, size, 0.045, 4, 131);   // manchas medias (desgaste, roce)
    const nf = fbmTile(x, y, size, 0.13, 3, 151);   // grano fino
    const h = fbmTile(x, y, size, 0.035, 4, 171) * 0.7 + nf * 0.3; // altura para el bump
    const r = (1 - 2 * ampRough * n) * 255, rf = (1 - 2 * ampFine * nf) * 255, hb = h * 255;
    rough[i] = rough[i + 1] = rough[i + 2] = r; rough[i + 3] = 255;
    fine[i] = fine[i + 1] = fine[i + 2] = rf; fine[i + 3] = 255;
    bump[i] = bump[i + 1] = bump[i + 2] = hb; bump[i + 3] = 255;
  }
  microSet = {
    rough: makeTex(rough, size, false, [1, 1]),
    roughFine: makeTex(fine, size, false, [1, 1]),
    bump: makeTex(bump, size, false, [1, 1]),
    ampRough, ampFine,
  };
  return microSet;
}
