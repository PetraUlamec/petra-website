"use client";
// EXPORTADOR DE LA ESCENA VIVA A GLB (23-ago): el segundo auditor de colocación (Blender headless,
// scripts/auditar_en_blender.py) necesita la escena TAL CUAL se renderiza. Se monta solo con ?gltf=1
// (como DebugBoxes/EditorVivo) y expone window.__exportGLB() → base64 del GLB, que Playwright recoge
// por CDP (scripts/exportar_escena.py). Misma copia de three que la app → instanceof correcto, texturas
// de canvas accesibles. Lo que NO exporta (informe 2026-08-23-blender-mapeo-escena.md): ShaderMaterial
// (Sparkles, Text) sale sin material pero con geometría; parches onBeforeCompile no deforman.
import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

export default function ExportGltf() {
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    const w = window as unknown as { __exportGLB?: () => Promise<string>; __gltfReady?: boolean };
    w.__exportGLB = async () => {
      const { GLTFExporter } = await import("three/examples/jsm/exporters/GLTFExporter.js");
      const exporter = new GLTFExporter();
      const result = await exporter.parseAsync(scene, { binary: true, onlyVisible: true, trs: true, embedImages: true });
      const buf = result instanceof ArrayBuffer ? result : new TextEncoder().encode(JSON.stringify(result)).buffer;
      // base64 por trozos (las escenas grandes superan el límite de apply)
      const bytes = new Uint8Array(buf);
      let s = "";
      for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      return btoa(s);
    };
    w.__gltfReady = true;
    // eslint-disable-next-line no-console
    console.info(`[ExportGltf] listo: ${scene.children.length} hijos raíz, three r${THREE.REVISION}`);
    return () => { delete w.__exportGLB; w.__gltfReady = false; };
  }, [scene]);
  return null;
}
