"use client";
// El marco de todas las habitaciones: cámara ortográfica isométrica, luz cálida de día,
// polvo flotando en la luz (VISION §0: iluminada, acogedora, onírica — nunca oscura).
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrthographicCamera, PerspectiveCamera, Environment, Lightformer, PerformanceMonitor } from "@react-three/drei";
import * as THREE from "three";
import { useMemo, useRef, useState, useEffect, type ReactNode } from "react";
import { easing } from "maath";
import Effects, { type VisualProfile } from "./Effects";
import DebugBoxes from "./DebugBoxes";
import EditorVivo from "./EditorVivo";
import ExportGltf from "./ExportGltf";
import Auditor from "./Auditor";
import Overrides from "./Overrides"; // SIEMPRE: aplica lo que SER guardó con el editor // ?audit=1 → EL OJO: window.__auditar() + cajas rojas en vivo // ?gltf=1 → window.__exportGLB() (auditor Blender)
import { QualityContext, detectQuality, qualityOverride, effectiveDpr, SHADOW_MAP, DUST, type Quality } from "@/lib/quality";
import { initMaterials } from "@/lib/materials";
import Realismo from "./Realismo";

/** Dirección isométrica fija de la cámara */
export const ISO_DIR = new THREE.Vector3(1, 0.82, 1).normalize();
const CAM_DIST = 22;

export interface CamFocus {
  target: [number, number, number];
  zoom: number;
}

function CameraRig({ focus }: { focus: CamFocus }) {
  const cam = useThree((s) => s.camera) as THREE.OrthographicCamera;
  const cur = useRef({ t: new THREE.Vector3(...focus.target), z: focus.zoom });
  useFrame((_, dt) => {
    easing.damp3(cur.current.t, focus.target, 0.3, dt); // acercamiento suave, como en sueños
    cur.current.z = THREE.MathUtils.damp(cur.current.z, focus.zoom, 4.2, dt);
    cam.position.copy(cur.current.t).addScaledVector(ISO_DIR, CAM_DIST);
    cam.lookAt(cur.current.t);
    if (Math.abs(cam.zoom - cur.current.z) > 0.01) {
      cam.zoom = cur.current.z;
      cam.updateProjectionMatrix();
    }
  });
  return null;
}

function PersonRig({ target }: { target: [number, number, number] }) {
  const cam = useThree((s) => s.camera);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    cam.position.y = 1.65 + Math.sin(t * 0.9) * 0.012;         // respiración sutil
    cam.lookAt(target[0] + Math.sin(t * 0.13) * 0.25, target[1], target[2] + Math.cos(t * 0.11) * 0.2);
  });
  return null;
}

/** Motas de polvo suspendidas en la luz */
function Dust({ count = 90 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const a = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      a[i * 3] = (Math.random() - 0.5) * 9;
      a[i * 3 + 1] = Math.random() * 4.2 + 0.2;
      a[i * 3 + 2] = (Math.random() - 0.5) * 9;
    }
    return a;
  }, [count]);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = clock.elapsedTime * 0.012;
    ref.current.position.y = Math.sin(clock.elapsedTime * 0.25) * 0.06;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.035} color="#ffe9bf" transparent opacity={0.55} sizeAttenuation depthWrite={false} />
    </points>
  );
}

function Lights({ q, profile }: { q: Quality; profile: VisualProfile }) {
  const ms = SHADOW_MAP[q];
  const natural = profile === "natural";
  const hemiArgs: [THREE.ColorRepresentation, THREE.ColorRepresentation, number] = natural
    ? ["#f2f6ff", "#6b5139", 0.5]
    : ["#fff3dc", "#8a5f38", 0.55];
  return (
    <>
      <ambientLight
        intensity={natural ? (q === "low" ? 0.68 : 0.4) : (q === "low" ? 0.9 : 0.62)}
        color={natural ? "#fffaf3" : "#ffeed6"}
      />
      {/* hemisférico: cielo cálido arriba, rebote del suelo de madera abajo — da volumen sin aplanar */}
      <hemisphereLight args={hemiArgs} />
      {/* sol de la ventana (KEY cálida). PCF de three ≥r182: shadow-radius ya actúa (penumbra) y
          shadow-intensity <1 deja rebote en la sombra (interior, VISION §0: nada negro) — C-3D-B */}
      <directionalLight
        position={[6, 9, 3]}
        intensity={natural ? 2.15 : 2.5}
        color={natural ? "#fff0d4" : "#ffe0a8"}
        castShadow
        shadow-mapSize={[ms, ms]}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-radius={q === "high" ? 4 : 3}
        shadow-intensity={0.85}
      />
      {/* FILL: rebote crema desde el lado contrario */}
      <directionalLight position={[-5, 4, -4]} intensity={natural ? 0.38 : 0.65} color={natural ? "#edf3ff" : "#fff3dd"} />
      {/* RIM frío desde atrás-izquierda (3 puntos, C-3D-B): recorta tarros, teteras, plantas y las tapas
          con un filo frío frente a la key cálida; sin sombra (coste ≈ 0). low: no. */}
      {q !== "low" && <directionalLight position={[-6, 5, -6]} intensity={natural ? 0.62 : 0.5} color="#cfe0ff" />}
      {/* brasa cálida baja, para el rincón */}
      {!natural && <pointLight position={[-3.9, 1.15, -3.9]} intensity={5} distance={7} color="#ffb46b" />}
    </>
  );
}

export default function SceneShell({
  children,
  focus,
  ariaLabel,
  onMiss,
  bg = "#eee9df",
  visualProfile = "natural",
}: {
  children: ReactNode;
  focus: CamFocus;
  ariaLabel: string;
  onMiss?: () => void;
  bg?: string;
  visualProfile?: VisualProfile;
}) {
  const [q, setQ] = useState<Quality>("mid");
  const declined = useRef(false);
  useEffect(() => setQ(detectQuality()), []);
  useEffect(() => () => { document.body.style.cursor = "auto"; }, []);

  return (
    <div className="fixed inset-0" aria-label={ariaLabel} role="img">
      <QualityContext.Provider value={q}>
      <Canvas
        shadows="percentage" /* = PCFShadowMap (three 0.185 deprecó PCFSoft y lo sustituye por este, ya suave) */
        onPointerMissed={onMiss}
        dpr={effectiveDpr(q)}
        gl={{ antialias: false }}
        onCreated={({ gl, scene, camera }) => {
          initMaterials(gl);
          gl.transmissionResolutionScale = 0.25;
          (window as unknown as { __scene?: THREE.Scene }).__scene = scene;
          (window as unknown as { __camera?: THREE.Camera }).__camera = camera;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = visualProfile === "natural" ? 1.05 : 1.2;
          scene.background = new THREE.Color(bg);
          scene.fog = new THREE.Fog(bg, visualProfile === "natural" ? 32 : 21, visualProfile === "natural" ? 65 : 40);
          scene.environmentIntensity = visualProfile === "natural" ? 0.82 : 0.7;
        }}
      >
        <PerformanceMonitor
          ms={400}
          iterations={8}
          onDecline={() => {
            if (qualityOverride() || declined.current) return;
            declined.current = true; // una sola degradación, sin ciclos de parpadeo
            setQ((p) => (p === "high" ? "mid" : "low"));
          }}
        >
        {typeof window !== "undefined" && new URLSearchParams(window.location.search).get("vista") === "persona" ? (
          <>
            {/* VISTA PERSONA (encargo de SER): dentro de la sala, a 1,65 m, como un visitante */}
            <PerspectiveCamera makeDefault fov={56} position={[3.9, 1.65, 4.1]} near={0.1} far={60} />
            <PersonRig target={[focus.target[0] - 0.6, 1.35, focus.target[2] - 0.9]} />
          </>
        ) : (
          <>
            <OrthographicCamera makeDefault zoom={focus.zoom} position={[22, 18, 22]} near={-60} far={120} />
            <CameraRig focus={focus} />
          </>
        )}
        <Lights q={q} profile={visualProfile} />
        {visualProfile === "dreamy" && <Dust count={DUST[q]} />}
        {/* reflejos de cristal y metal sin descargar nada: entorno de Lightformers horneado una vez */}
        <Environment resolution={128} frames={1}>
          <Lightformer intensity={visualProfile === "natural" ? 2.4 : 3} color={visualProfile === "natural" ? "#f8fbff" : "#fff3dd"} position={[0, 3, -8]} scale={[8, 4, 1]} />
          <Lightformer intensity={visualProfile === "natural" ? 0.9 : 1.2} color={visualProfile === "natural" ? "#fff4e5" : "#ffe9c8"} position={[-7, 2, 2]} rotation-y={Math.PI / 2} scale={[6, 3, 1]} />
          <Lightformer intensity={0.8} color="#ffffff" position={[0, 6, 0]} rotation-x={-Math.PI / 2} scale={[9, 9, 1]} />
        </Environment>
        {children}
        {/* pase 2 (C-3D-B): micro-superficie global + sombras de contacto, centralizado y sin tocar escenas */}
        <Realismo />
        {typeof window !== "undefined" && new URLSearchParams(window.location.search).has("debug") && <DebugBoxes />}
        {typeof window !== "undefined" && new URLSearchParams(window.location.search).has("editor") && <EditorVivo />}
        {typeof window !== "undefined" && new URLSearchParams(window.location.search).has("gltf") && <ExportGltf />}
        {typeof window !== "undefined" && new URLSearchParams(window.location.search).has("audit") && <Auditor />}
        <Overrides />
        <Effects profile={visualProfile} />
        </PerformanceMonitor>
      </Canvas>
      {/* viñeta de sueño: oscurece apenas las esquinas y dora el centro */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: visualProfile === "natural"
            ? "radial-gradient(ellipse 75% 70% at 50% 42%, rgba(255,255,255,0.035) 0%, rgba(0,0,0,0) 58%)"
            : "radial-gradient(ellipse 75% 70% at 50% 42%, rgba(255,220,150,0.10) 0%, rgba(0,0,0,0) 55%)",
        }}
      />
      </QualityContext.Provider>
    </div>
  );
}
