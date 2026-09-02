#!/usr/bin/env python3
"""MIGRACIÓN DE LOS AJUSTES DE SER a ids estables (25-ago).

Los ajustes se guardaban con un id que dependía de la FORMA de la pieza («Box+Box+2#3»). Cada vez
que Claude editaba un componente, esa forma cambiaba y el ajuste saltaba a otra pieza (el reloj acabó
en (0.85,3.25) y reapareció un revistero borrado). Ahora el id es la POSICIÓN DE ORIGEN de la pieza.

Esta migración lee la escena VIVA sala por sala con el sistema VIEJO todavía en marcha, empareja cada
ajuste con la pieza a la que de verdad se está aplicando, y reescribe overrides.json con el id nuevo.
Guarda copia de seguridad. Uso: python3 scripts/migrar_overrides.py  (con el server en :3111)
"""
import json, os, shutil, sys
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = os.environ.get("PETRA_BASE", "http://localhost:3111")
RAIZ = Path(__file__).resolve().parent.parent
OV = RAIZ / "data" / "overrides.json"

# lee la escena y devuelve, por cada pieza: id VIEJO (firma), id NUEVO (origen) y su posición actual
JS = """() => {
  const DIAG = 4.2;
  const firma = (o) => { if (o.name) return o.name; const g = [];
    o.traverse(m => { if (m.geometry) g.push(m.geometry.type.replace('Geometry','')); });
    return g.slice(0,3).join('+') + (g.length > 3 ? '+' + (g.length-3) : ''); };
  const caja = (o) => { const min=[9e9,9e9,9e9], max=[-9e9,-9e9,-9e9]; o.updateWorldMatrix(true,true);
    o.traverse(m => { if(!m.isMesh||!m.geometry?.attributes?.position) return;
      const pos=m.geometry.attributes.position, mm=m.matrixWorld.elements;
      for(let i=0;i<pos.count;i+=7){ const a=[pos.getX(i),pos.getY(i),pos.getZ(i)];
        const x=mm[0]*a[0]+mm[4]*a[1]+mm[8]*a[2]+mm[12], y=mm[1]*a[0]+mm[5]*a[1]+mm[9]*a[2]+mm[13], z=mm[2]*a[0]+mm[6]*a[1]+mm[10]*a[2]+mm[14];
        min[0]=Math.min(min[0],x);min[1]=Math.min(min[1],y);min[2]=Math.min(min[2],z);
        max[0]=Math.max(max[0],x);max[1]=Math.max(max[1],y);max[2]=Math.max(max[2],z);} });
    return {min,max}; };
  const cuenta = new Map(), out = [];
  const visita = (o) => {
    if (o.type === 'Box3Helper' || o.type.startsWith('TransformControls')) return;
    const b = caja(o);
    const d = Math.hypot(b.max[0]-b.min[0], b.max[1]-b.min[1], b.max[2]-b.min[2]);
    if (d > 0 && d < DIAG) {
      const f = firma(o); const n = cuenta.get(f) ?? 0; cuenta.set(f, n+1);
      out.push({ viejo: o.name ? f : f + '#' + n,
                 nuevo: o.name || ('@' + o.position.x.toFixed(3) + ',' + o.position.y.toFixed(3) + ',' + o.position.z.toFixed(3)),
                 pos: [o.position.x, o.position.y, o.position.z] });
      return;
    }
    o.children.forEach(visita);
  };
  window.__scene.children.forEach(visita);
  return out;
}"""

SALAS = {"/": "/", "/salon": "/salon", "/te": "/te", "/te-premium": "/te-premium",
         "/nosotros": "/nosotros", "/contacto": "/contacto", "/carrito": "/carrito"}

def main():
    if not OV.exists():
        print("no hay overrides que migrar"); return
    datos = json.loads(OV.read_text(encoding="utf8"))
    copia = OV.with_suffix(".json.antes-de-migrar")
    shutil.copy(OV, copia); print("copia de seguridad:", copia.name)

    nuevo_total, informe = {}, []
    with sync_playwright() as pl:
        b = pl.chromium.launch(executable_path="/usr/bin/chromium", headless=True,
                               args=["--no-sandbox", "--use-gl=swiftshader"])
        pg = b.new_page(viewport={"width": 1280, "height": 720})
        for sala in SALAS:
            ajustes = datos.get(sala)
            if not ajustes:
                continue
            if all(k.startswith("@") or "#" not in k for k in ajustes):
                print(f"  {sala}: ya estaba migrado ({len(ajustes)})"); nuevo_total[sala] = ajustes; continue
            # IMPORTANTE: cargar la sala SIN aplicar los ajustes, para leer las posiciones de ORIGEN
            pg.goto(f"{BASE}{sala}?sinOverrides=1", wait_until="load")
            pg.wait_for_timeout(9000)
            piezas = pg.evaluate(JS)
            mapa = {p["viejo"]: p["nuevo"] for p in piezas}
            migrados, perdidos, usados = {}, [], set()
            # 1ª pasada: por id exacto
            for viejo, valor in ajustes.items():
                nuevo = mapa.get(viejo)
                if nuevo and nuevo not in usados:
                    migrados[nuevo] = valor; usados.add(nuevo)
                else:
                    perdidos.append(viejo)
            # 2ª pasada: los huérfanos, por POSICIÓN (los ids muy viejos no llevaban índice)
            resto = [x for x in piezas if x["nuevo"] not in usados]
            aun = []
            for viejo in perdidos:
                val = ajustes[viejo]
                pos = val.get("p")
                if not pos or len(pos) != 3:
                    aun.append(viejo); continue
                cand = min(resto, key=lambda x: sum((x["pos"][i] - pos[i]) ** 2 for i in range(3)), default=None)
                d = (sum((cand["pos"][i] - pos[i]) ** 2 for i in range(3)) ** 0.5) if cand else 9e9
                if cand and d < 1.2:
                    migrados[cand["nuevo"]] = val; usados.add(cand["nuevo"]); resto.remove(cand)
                else:
                    aun.append(viejo)
            perdidos = aun
            nuevo_total[sala] = migrados
            informe.append((sala, len(ajustes), len(migrados), perdidos))
            print(f"  {sala}: {len(migrados)}/{len(ajustes)} migrados" + (f" · sin pareja: {perdidos[:3]}" if perdidos else ""))
        b.close()

    for sala, v in datos.items():
        if sala not in nuevo_total:
            nuevo_total[sala] = v
    OV.write_text(json.dumps(nuevo_total, indent=2, ensure_ascii=False), encoding="utf8")
    tot_a = sum(x[1] for x in informe); tot_b = sum(x[2] for x in informe)
    print(f"\n✓ MIGRADOS {tot_b} de {tot_a} ajustes de SER a ids estables")
    if tot_b < tot_a:
        print("  (los que no encontraron pareja se quedaron fuera: eran de piezas que ya no existen)")

if __name__ == "__main__":
    main()
