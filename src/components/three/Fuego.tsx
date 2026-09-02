"use client";
// EL FUEGO (25-ago, encargo de SER; técnica del informe informes/2026-08-25-fuego-threejs-oxalpha.md §1.1):
// llama procedural sobre media caña de cilindro — el vértice se desplaza con ruido que SUBE y el color
// se compone en capas rojo → naranja → amarillo → blanco con recortes (smoothstep), así que nunca
// parece un cono pegado. La textura de ruido se GENERA aquí en un canvas (la web no descarga nada).
// Coste: 1 malla + 1 textura compartida, sin postproceso. Va sobrado en la Radeon 610M.
import * as THREE from "three";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";

// ── textura de ruido (fbm) compartida por todos los fuegos ────────────────────
let ruidoTex: THREE.Texture | null = null;
function getRuido() {
  if (ruidoTex || typeof document === "undefined") return ruidoTex;
  const N = 256;
  const c = document.createElement("canvas"); c.width = c.height = N;
  const g = c.getContext("2d")!;
  const img = g.createImageData(N, N);
  // valor por celda + suavizado bilineal, sumado en 4 octavas (fbm determinista)
  const rnd = (x: number, y: number, s: number) => {
    const n = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453;
    return n - Math.floor(n);
  };
  const suave = (x: number, y: number, esc: number, s: number) => {
    const xi = Math.floor(x / esc), yi = Math.floor(y / esc);
    const fx = (x / esc) - xi, fy = (y / esc) - yi;
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    const a = rnd(xi, yi, s), b = rnd(xi + 1, yi, s), cc = rnd(xi, yi + 1, s), d = rnd(xi + 1, yi + 1, s);
    return a * (1 - u) * (1 - v) + b * u * (1 - v) + cc * (1 - u) * v + d * u * v;
  };
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      let v = 0, amp = 0.5, esc = 64;
      for (let o = 0; o < 4; o++) { v += suave(x, y, esc, o) * amp; amp *= 0.5; esc *= 0.5; }
      const i = (y * N + x) * 4;
      const c8 = Math.max(0, Math.min(255, Math.round(v * 255)));
      img.data[i] = img.data[i + 1] = img.data[i + 2] = c8; img.data[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  ruidoTex = new THREE.CanvasTexture(c);
  ruidoTex.wrapS = ruidoTex.wrapT = THREE.RepeatWrapping;
  return ruidoTex;
}

const VERT = /* glsl */ `
  uniform float uTime;
  uniform sampler2D uRuido;
  uniform float uFuerza;
  varying vec2 vUv;
  varying float vAlto;
  void main() {
    vUv = uv;
    vAlto = uv.y;                         // 0 abajo (la brasa), 1 arriba (la punta)
    vec3 p = position;
    // el ruido sube: la llama ondula más cuanto más arriba
    float n1 = texture2D(uRuido, vec2(uv.x * 1.6, uv.y * 0.9 - uTime * 0.55)).r - 0.5;
    float n2 = texture2D(uRuido, vec2(uv.x * 3.1 + 0.37, uv.y * 1.7 - uTime * 0.95)).r - 0.5;
    float meneo = (n1 * 0.7 + n2 * 0.3) * uFuerza * pow(uv.y, 1.35);
    p.x += meneo;
    p.z += meneo * 0.6;
    p.y += n2 * 0.06 * uv.y;              // la punta respira
    // se estrecha hacia arriba
    float estrecha = mix(1.0, 0.28, pow(uv.y, 1.2));
    p.x *= estrecha; p.z *= estrecha;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }`;

const FRAG = /* glsl */ `
  uniform float uTime;
  uniform sampler2D uRuido;
  uniform vec3 uBase;      // amarillo del corazón
  uniform vec3 uMedio;     // naranja
  uniform vec3 uPunta;     // rojo de las lenguas
  uniform float uCorteSuperior;
  varying vec2 vUv;
  varying float vAlto;
  void main() {
    // dos capas de ruido que suben a distinta velocidad: las lenguas nacen y mueren
    float a = texture2D(uRuido, vec2(vUv.x * 2.0, vUv.y * 1.1 - uTime * 0.7)).r;
    float b = texture2D(uRuido, vec2(vUv.x * 4.3 + 0.21, vUv.y * 2.2 - uTime * 1.25)).r;
    float f = a * 0.65 + b * 0.35;
    // la llama se recorta más arriba (arriba hace falta más ruido para "existir")
    float umbral = mix(0.12, 0.92, pow(vAlto, 0.85));
    float vive = smoothstep(umbral, umbral + 0.22, f);
    if (vive < 0.02) discard;
    // color: corazón claro abajo → rojo en las puntas
    vec3 col = mix(uBase, uMedio, smoothstep(0.02, 0.42, vAlto));
    col = mix(col, uPunta, smoothstep(0.45, 0.95, vAlto));
    col = mix(col, vec3(1.0, 0.9, 0.62), smoothstep(0.62, 0.98, f) * (1.0 - vAlto) * 0.45);  // corazón, sin quemar
    // se apaga en los bordes laterales y en la punta
    float lados = smoothstep(0.0, 0.16, vUv.x) * smoothstep(1.0, 0.84, vUv.x);
    // Desvanece la punta antes del límite para evitar fragmentos aislados
    // que desde lejos parecían una vela flotando sobre el fuego.
    float techo = 1.0 - smoothstep(max(0.0, uCorteSuperior - 0.12), uCorteSuperior, vAlto);
    float alpha = vive * lados * (1.0 - smoothstep(0.72, 1.0, vAlto)) * techo;
    gl_FragColor = vec4(col * 0.72, alpha * 0.6);   // aditivo: al superponerse las lenguas la suma saturaba a blanco
  }`;

/** Una llama viva. `alto`/`ancho` en metros; `fuerza` = cuánto ondula. */
export function Llama({ position = [0, 0, 0] as [number, number, number], alto = 0.5, ancho = 0.3,
  fuerza = 0.06, semilla = 0, rotY = 0, corteSuperior = 1 }) {
  const mat = useMemo(() => {
    const tex = getRuido();
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: semilla * 3.7 }, uRuido: { value: tex }, uFuerza: { value: fuerza },
        uBase: { value: new THREE.Color("#ffcf72") },
        uMedio: { value: new THREE.Color("#ff8c14") },
        uPunta: { value: new THREE.Color("#e8410b") },
        uCorteSuperior: { value: corteSuperior },
      },
      vertexShader: VERT, fragmentShader: FRAG,
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,   // el fuego suma luz; con Normal se veía mate y marrón
    });
  }, [corteSuperior, fuerza, semilla]);
  useFrame((_, dt) => { mat.uniforms.uTime.value += dt; });
  return (
    <mesh position={position} rotation={[0, rotY, 0]} material={mat} raycast={() => null}>
      {/* media caña abierta: dos caras curvas que leen como volumen desde la isométrica */}
      <cylinderGeometry args={[ancho * 0.42, ancho * 0.5, alto, 14, 12, true]} />
    </mesh>
  );
}

/** El hogar completo: dos llamas cruzadas, brasas y chispas subiendo. */
export function Hoguera({ position = [0, 0, 0] as [number, number, number], escala = 1,
  chispas = true, mostrarBrasas = true, corteSuperior = 1 }: {
    position?: [number, number, number]; escala?: number; chispas?: boolean;
    mostrarBrasas?: boolean; corteSuperior?: number;
  }) {
  const brasas = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (brasas.current) {
      const m = brasas.current.material as THREE.MeshBasicMaterial;
      m.opacity = 0.42 + Math.sin(clock.elapsedTime * 3.1) * 0.08 + Math.sin(clock.elapsedTime * 7.3) * 0.05;
    }
  });
  return (
    <group position={position} scale={escala}>
      {/* brasas: la base incandescente sobre la que nace todo */}
      {mostrarBrasas && (
        <mesh ref={brasas} position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
          <planeGeometry args={[0.62, 0.34]} />
          <meshBasicMaterial color="#e8460c" transparent opacity={0.42} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      )}
      <Llama position={[-0.07, 0.24, 0]} alto={0.48} ancho={0.34} fuerza={0.055} semilla={0.3} corteSuperior={corteSuperior} />
      <Llama position={[0.09, 0.19, 0.04]} alto={0.38} ancho={0.26} fuerza={0.075} semilla={1.7} rotY={0.8} corteSuperior={corteSuperior} />
      <Llama position={[0.01, 0.14, -0.05]} alto={0.26} ancho={0.2} fuerza={0.09} semilla={2.9} rotY={-0.6} corteSuperior={corteSuperior} />
      {chispas && (
        <Sparkles count={14} scale={[0.44, 0.7, 0.26]} position={[0, 0.62, 0]} size={0.55}
          speed={0.45} opacity={0.42} color="#ffbb72" noise={1.4} />
      )}
    </group>
  );
}
