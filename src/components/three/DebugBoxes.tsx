"use client";
// Modo INSPECTOR 3D (?debug=1): dibuja la caja real de cada pieza en la propia escena
// + informe en consola (piezas totales). Me ayuda a VER dónde está cada cosa (encargo de SER).
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";

export default function DebugBoxes() {
  const scene = useThree((s) => s.scene);
  const helpers = useRef<THREE.Box3Helper[]>([]);
  useEffect(() => {
    const t = setTimeout(() => {
      let n = 0;
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (!m.isMesh || !m.geometry) return;
        m.updateWorldMatrix(true, false);
        m.geometry.computeBoundingBox();
        if (!m.geometry.boundingBox) return;
        const bb = m.geometry.boundingBox.clone().applyMatrix4(m.matrixWorld);
        const size = new THREE.Vector3(); bb.getSize(size);
        if (size.x * size.y * size.z < 0.004) return; // micro-piezas fuera
        const h = new THREE.Box3Helper(bb, new THREE.Color(size.y > 2 ? "#4a90d9" : "#c7402e"));
        (h.material as THREE.LineBasicMaterial).transparent = true;
        (h.material as THREE.LineBasicMaterial).opacity = 0.5;
        scene.add(h); helpers.current.push(h); n++;
      });
      console.info(`[INSPECTOR] ${n} cajas dibujadas — rojo=objeto, azul=estructura`);
    }, 2200);
    const hs = helpers.current;
    return () => { clearTimeout(t); hs.forEach((h) => scene.remove(h)); hs.length = 0; };
  }, [scene]);
  return null;
}
