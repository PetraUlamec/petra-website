"use client";
// El salto de render (plan F0b): oclusión ambiental cálida + bloom de velas + miniatura tilt-shift.
// low = EffectComposer solo con SMAA + ToneMapping (sin AO ni bloom). Html labels: DOM overlay, no les afecta.
//
// C-3D-B (pase 2, 23-ago): el TONE MAPPING va DENTRO del composer. Medido en node_modules:
// @react-three/postprocessing 3.0.5 fuerza gl.toneMapping = NoToneMapping mientras el composer está montado
// (y three ≥r182 solo mapea inline al renderizar a pantalla), así que el ACES de SceneShell NUNCA actuaba:
// la imagen salía sin curva de tono y el bloom (umbral 0.96 en HDR) se comía las paredes soleadas.
// Orden: N8AO → Bloom (HDR) → ToneMapping → Vignette → Noise → TiltShift2 → SMAA.
// Depuración por URL (solo para comparar capturas): ?tm=aces|agx|neutral|none · ?bt=<umbral bloom> · ?bi=<intensidad bloom>
import { EffectComposer, N8AO, Bloom, TiltShift2, Vignette, Noise, SMAA, ToneMapping } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import { useMemo } from "react";
import { useQuality } from "@/lib/quality";

export type VisualProfile = "dreamy" | "natural";

const TM_MODES: Record<string, ToneMappingMode> = {
  aces: ToneMappingMode.ACES_FILMIC,
  agx: ToneMappingMode.AGX,
  neutral: ToneMappingMode.NEUTRAL,
  none: ToneMappingMode.LINEAR,
};
/** Modo por defecto (elegido por captura, ver informe C-3D-B) */
export const TM_DEFAULT = "neutral";

function fxParams(profile: VisualProfile) {
  const p = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const natural = profile === "natural";
  const tm = p?.get("tm") ?? (natural ? "neutral" : TM_DEFAULT);
  const num = (k: string, d: number) => { const v = p ? parseFloat(p.get(k) ?? "") : NaN; return Number.isFinite(v) ? v : d; };
  return {
    mode: TM_MODES[tm] ?? TM_MODES[TM_DEFAULT], tmName: tm,
    bloomThreshold: num("bt", natural ? 1.35 : 1.1), bloomIntensity: num("bi", natural ? 0.18 : 0.5),
    // N8AO afinado a interior de 10 m (README n8ao: radio 1-2 órdenes por debajo de la escala; falloff 1 = seguro, menos halo)
    aoRadius: num("aor", natural ? 0.5 : 0.45), aoIntensity: num("aoi", natural ? 2.8 : 2.5), aoFalloff: num("aof", 1.0),
  };
}

export default function Effects({ profile = "dreamy" }: { profile?: VisualProfile }) {
  const q = useQuality();
  const natural = profile === "natural";
  const fx = useMemo(() => fxParams(profile), [profile]);
  if (typeof window !== "undefined") (window as unknown as { __fx?: unknown }).__fx = { ...fx, q };
  if (q === "low") {
    return (
      <EffectComposer multisampling={0} enableNormalPass={false}>
        <ToneMapping mode={fx.mode} />
        <SMAA />
      </EffectComposer>
    );
  }
  const mid = q === "mid";
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <N8AO
        aoRadius={fx.aoRadius}
        distanceFalloff={fx.aoFalloff}
        intensity={fx.aoIntensity}
        color={natural ? "#242a31" : "#3a2513"}
        quality="performance"
        halfRes={mid} // mid: AO a media res · high: AO a res completa
        depthAwareUpsampling
      />
      <Bloom mipmapBlur intensity={fx.bloomIntensity} luminanceThreshold={fx.bloomThreshold} luminanceSmoothing={0.2} levels={mid ? 3 : 4} />
      <ToneMapping mode={fx.mode} />
      <Vignette eskil={false} offset={natural ? 0.4 : 0.32} darkness={natural ? 0.2 : 0.42} />
      <Noise premultiply opacity={natural ? 0.012 : 0.045} />
      <TiltShift2 blur={natural ? 0.025 : 0.09} taper={0.6} start={[0, 0.42]} end={[1, 0.58]} samples={5} direction={[0, 1]} />
      <SMAA />
    </EffectComposer>
  );
}
