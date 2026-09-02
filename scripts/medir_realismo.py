#!/usr/bin/env python3
"""Métricas de render para el pase 2 (C-3D-B): se conecta a la ventana ya abierta por hp.py (PETRA_CDP)
y mide en la escena viva: nº de materiales únicos, cuántos llevan textura, mallas, draw calls/triángulos
(gl.info) y FPS. Uso: PETRA_CDP=9337 python3 scripts/medir_realismo.py [etiqueta]"""
import os, sys, json
from playwright.sync_api import sync_playwright

CDP = f"http://localhost:{os.environ.get('PETRA_CDP', '9337')}"
JS = """async (secs) => {
  const scene = window.__scene; if (!scene) return { error: 'sin escena' };
  const mats = new Set(), withMap = new Set(), micro = new Set(); let meshes = 0, pts = 0, sprites = 0;
  const kinds = {};
  scene.traverse((o) => {
    if (o.isPoints) pts++; if (o.isSprite) sprites++;
    if (!o.isMesh || !o.material) return; meshes++;
    const ms = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of ms) { mats.add(m); kinds[m.type] = (kinds[m.type] || 0) + 1;
      if (m.map || m.roughnessMap || m.bumpMap || m.normalMap) withMap.add(m);
      if (m.userData && m.userData.__micro) micro.add(m); }
  });
  const fps = await new Promise((r) => { let n = 0; const t0 = performance.now();
    const l = () => { n++; if (performance.now() - t0 < secs * 1000) requestAnimationFrame(l); else r(+(n / secs).toFixed(1)); };
    requestAnimationFrame(l); });
  const gl = window.__gl; const info = gl ? { calls: gl.info.render.calls, tris: gl.info.render.triangles, programs: gl.info.programs.length, textures: gl.info.memory.textures, geometries: gl.info.memory.geometries } : null;
  const rm = window.__realismo || null;
  return { meshes, points: pts, sprites, materialesUnicos: mats.size, conTextura: withMap.size, micro: micro.size, porTipo: kinds, fps, info, realismo: rm, ruta: location.pathname + location.search };
}"""

def main():
    etiqueta = sys.argv[1] if len(sys.argv) > 1 else ""
    with sync_playwright() as pl:
        b = pl.chromium.connect_over_cdp(CDP)
        page = b.contexts[0].pages[0]
        r = page.evaluate(JS, 2.5)
        print(etiqueta, json.dumps(r, ensure_ascii=False))

if __name__ == "__main__":
    main()
