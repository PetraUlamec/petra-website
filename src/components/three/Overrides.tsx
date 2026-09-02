"use client";
// LA CAPA DE CAMBIOS DE SER (23-ago): aplica en cada sala lo guardado desde el editor (?editor=1 → G/Supr)
// sin tocar código: posición, giro, escala y piezas ocultas. Se monta SIEMPRE (coste: un fetch y un
// recorrido de la escena cada pocos segundos hasta que todo está aplicado; las piezas que llegan tarde
// —GLB, catálogo vivo— se cogen en las pasadas siguientes).
import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { listarPiezas, idEstable } from "@/lib/piezas";

type Ov = { p?: number[]; rotY?: number; s?: number; hidden?: boolean };

export default function Overrides() {
  const scene = useThree((s) => s.scene);
  const datos = useRef<Record<string, Ov> | null>(null);
  const version = useRef(0);
  const frame = useRef(0);

  useEffect(() => {
    const sala = location.pathname;
    // ?sinOverrides=1 → la escena tal y como sale del código (lo usa scripts/migrar_overrides.py)
    if (new URLSearchParams(location.search).has("sinOverrides")) { datos.current = {}; return; }
    const cargar = async () => {
      try {
        const r = await fetch(`/api/overrides?sala=${encodeURIComponent(sala)}`, { cache: "no-store" });
        datos.current = r.ok ? await r.json() : {};
      } catch { datos.current = {}; }
      version.current++;
    };
    cargar();
    (window as unknown as { __overridesRecargar?: () => Promise<void> }).__overridesRecargar = cargar;
    return () => { delete (window as unknown as { __overridesRecargar?: () => void }).__overridesRecargar; };
  }, []);

  useFrame(() => {
    frame.current++;
    const d = datos.current;
    if (!d) return;
    const ids = Object.keys(d);
    if (!ids.length) return;
    // pasadas frecuentes al principio (piezas que llegan tarde), luego cada ~2 s
    if (frame.current > 600 ? frame.current % 120 !== 0 : frame.current % 20 !== 0) return;
    // 1) sellar el origen de TODAS las piezas antes de tocar ninguna (el id nace de ahí)
    const piezas = listarPiezas(scene);
    for (const { obj } of piezas) idEstable(obj);
    // 2) aplicar lo que SER guardó
    for (const { id, obj } of piezas) {
      const ov = d[id];
      if (!ov || obj.userData.__ov === version.current) continue;
      if (ov.p && ov.p.length === 3) obj.position.set(ov.p[0], ov.p[1], ov.p[2]);
      if (typeof ov.rotY === "number") obj.rotation.y = ov.rotY;
      if (typeof ov.s === "number" && ov.s > 0) obj.scale.setScalar(ov.s);
      if (ov.hidden !== undefined) { obj.visible = !ov.hidden; obj.userData.__ovHidden = ov.hidden; }
      obj.userData.__ov = version.current;
    }
  });
  return null;
}
