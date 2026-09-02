#!/usr/bin/env python3
"""EL OJO REAL (skill ver-escena-3d, 19-ago).
Extrae la GEOMETRÍA VIVA de la escena (triángulos world por pieza, vía CDP),
la analiza con trimesh (penetraciones malla-a-malla reales, flotantes, medidas)
y recorta la pantalla AMPLIADA por zonas. Regla: nada se enseña sin pasar por aquí.

Uso:  python3 ver_escena.py mapa [ruta]      → mapa completo: piezas + choques reales + flotantes
      python3 ver_escena.py zonas [ruta]     → captura de ventana + recortes ampliados 3x3 → /tmp/petra-zonas/
      python3 ver_escena.py pieza <nombre>   → recorte ampliado centrado en esa pieza
      python3 ver_escena.py apoyo [ruta]     → APOYO de cada pieza: OK/FLOTA/HUNDIDA + exenciones (PARED/COLGADA/ANIM) + DENTRO/FUERA
      python3 ver_escena.py punto x y z [r]  → recorte ampliado centrado en un punto del mundo (piezas sin name)
Requiere: chromium con CDP (PETRA_CDP, defecto 9333) y server (PETRA_BASE, defecto :3111).
"""
import sys, os, json, subprocess
import numpy as np
import trimesh

CDP_PORT = os.environ.get("PETRA_CDP", "9333")  # cada agente su CDP (igual que hp.py)
CDP = f"http://localhost:{CDP_PORT}"
BASE = os.environ.get("PETRA_BASE", "http://localhost:3111")
# salida por agente: con el CDP por defecto sigue siendo /tmp/petra-zonas; con otro CDP, /tmp/petra-zonas-<puerto>
Z = os.environ.get("PETRA_ZONAS", "/tmp/petra-zonas" + ("" if CDP_PORT == "9333" else f"-{CDP_PORT}")); os.makedirs(Z, exist_ok=True)

EXTRACT_JS = """() => {
  const s = window.__scene; if (!s) return null;
  const box = new (Object.getPrototypeOf(s.position).constructor)();
  // agrupar por PIEZA (grupo mas alto con diagonal < 4.2) — mismo criterio que geo2
  const piezas = []; const asignado = new Set();
  const boxOf = (o) => { const b = { min: [1e9,1e9,1e9], max: [-1e9,-1e9,-1e9] };
    o.traverse((m) => { if (!m.isMesh || !m.geometry) return; m.updateWorldMatrix(true, false);
      m.geometry.computeBoundingBox(); const bb = m.geometry.boundingBox;
      for (const cx of [bb.min.x, bb.max.x]) for (const cy of [bb.min.y, bb.max.y]) for (const cz of [bb.min.z, bb.max.z]) {
        const v = new (Object.getPrototypeOf(m.position).constructor)(cx, cy, cz); m.localToWorld(v);
        b.min = [Math.min(b.min[0],v.x), Math.min(b.min[1],v.y), Math.min(b.min[2],v.z)];
        b.max = [Math.max(b.max[0],v.x), Math.max(b.max[1],v.y), Math.max(b.max[2],v.z)]; } });
    return b.min[0] > b.max[0] ? null : b; };
  const diag = (b) => Math.hypot(b.max[0]-b.min[0], b.max[1]-b.min[1], b.max[2]-b.min[2]);
  const walk = (o) => {
    const b = boxOf(o);
    if (b && diag(b) < 4.2 && o.children.length > 0 && (o.isGroup || o.type === "Object3D")) {
      let n = 0; o.traverse((m) => { if (m.isMesh) n++; });
      if (n > 0) { piezas.push(o); o.traverse((m) => asignado.add(m.uuid)); return; } }
    for (const c of o.children) walk(c); };
  for (const c of s.children) walk(c);
  s.traverse((m) => { if (m.isMesh && m.geometry && !asignado.has(m.uuid)) piezas.push(m); });
  // extraer triangulos world DECIMADOS por pieza
  const out = [];
  for (const pz of piezas) {
    const tris = [];
    pz.traverse((m) => { if (!m.isMesh || !m.geometry || tris.length > 2500) return;
      m.updateWorldMatrix(true, false);
      const pos = m.geometry.attributes.position; if (!pos) return;
      const idx = m.geometry.index;
      const N = idx ? idx.count : pos.count;
      const paso = Math.max(3, Math.floor(N / 900) * 3); // decimar a ~300 tris/mesh
      const V = (k) => { const i = idx ? idx.array[k] : k;
        const v = new (Object.getPrototypeOf(m.position).constructor)(pos.getX(i), pos.getY(i), pos.getZ(i));
        m.localToWorld(v); return [+v.x.toFixed(4), +v.y.toFixed(4), +v.z.toFixed(4)]; };
      for (let k = 0; k + 2 < N; k += paso) tris.push([V(k), V(k+1), V(k+2)]); });
    if (!tris.length) continue;
    const b = boxOf(pz);
    const nom = pz.name || (() => { const g = []; pz.traverse((m) => { if (m.isMesh) g.push(m.geometry.type.replace("Geometry","")); });
      return g.slice(0,3).join("+") + (g.length > 3 ? "+" + (g.length-3) : ""); })();
    out.push({ nom, box: b, tris, parent: pz.parent ? pz.parent.uuid : "", esMalla: !!pz.isMesh });
  }
  return out; }"""

APOYO_JS = """() => {
  const s = window.__scene; if (!s) return null;
  const V = Object.getPrototypeOf(s.position).constructor;
  const boxOf = (o) => { const b = { min: [1e9,1e9,1e9], max: [-1e9,-1e9,-1e9] }; let n = 0;
    o.traverse((m) => { if (!m.isMesh || !m.geometry) return; m.updateWorldMatrix(true, false);
      m.geometry.computeBoundingBox(); const bb = m.geometry.boundingBox; if (!isFinite(bb.min.x)) return; n++;
      for (const cx of [bb.min.x, bb.max.x]) for (const cy of [bb.min.y, bb.max.y]) for (const cz of [bb.min.z, bb.max.z]) {
        const v = new V(cx, cy, cz); m.localToWorld(v);
        b.min = [Math.min(b.min[0],v.x), Math.min(b.min[1],v.y), Math.min(b.min[2],v.z)];
        b.max = [Math.max(b.max[0],v.x), Math.max(b.max[1],v.y), Math.max(b.max[2],v.z)]; } });
    return n ? b : null; };
  const diag = (b) => Math.hypot(b.max[0]-b.min[0], b.max[1]-b.min[1], b.max[2]-b.min[2]);
  const piezas = []; const asignado = new Set();
  const walk = (o) => { const b = boxOf(o);
    if (b && diag(b) < 4.2 && o.children.length > 0 && (o.isGroup || o.type === "Object3D")) {
      let n = 0; o.traverse((m) => { if (m.isMesh) n++; });
      if (n > 0) { piezas.push(o); o.traverse((m) => asignado.add(m.uuid)); return; } }
    for (const c of o.children) walk(c); };
  for (const c of s.children) walk(c);
  s.traverse((m) => { if (m.isMesh && m.geometry && !asignado.has(m.uuid)) piezas.push(m); });
  const out = [];
  for (const pz of piezas) {
    const b = boxOf(pz); if (!b) continue;
    const mallas = []; const geos = []; let nTrans = 0, nMesh = 0;
    pz.traverse((m) => { if (!m.isMesh || !m.geometry) return; const mb = boxOf(m); if (!mb) return; nMesh++;
      const mat = Array.isArray(m.material) ? m.material[0] : m.material;
      const trans = !!(mat && mat.transparent && mat.opacity < 0.6); if (trans) nTrans++;
      geos.push(m.geometry.type.replace("Geometry","")); mallas.push({ box: mb, trans }); });
    const nom = pz.name || (geos.slice(0,3).join("+") + (geos.length > 3 ? "+" + (geos.length-3) : ""));
    out.push({ nom, box: b, mallas, todoTrans: nMesh > 0 && nTrans === nMesh, parent: pz.parent ? pz.parent.uuid : "", esMalla: !!pz.isMesh });
  }
  return out; }"""

def _ruta(page):
    from urllib.parse import urlparse
    return urlparse(page.url).path or "/"

def conecta(ruta=None):
    from playwright.sync_api import sync_playwright
    pl = sync_playwright().start()
    b = pl.chromium.connect_over_cdp(CDP)
    page = b.contexts[0].pages[0]
    if ruta:
        page.goto(BASE + ruta, wait_until="load"); page.wait_for_timeout(4000)
    return pl, page

def extraer(page):
    datos = page.evaluate(EXTRACT_JS)
    if not datos: print("sin escena"); sys.exit(1)
    piezas = []
    for d in datos:
        tris = np.array(d["tris"], dtype=float)      # (n,3,3)
        v = tris.reshape(-1, 3)
        f = np.arange(len(v)).reshape(-1, 3)
        m = trimesh.Trimesh(vertices=v, faces=f, process=False)
        # HALLAZGO 22-ago: con triángulos sueltos (sin vértices compartidos) is_watertight era SIEMPRE False
        # y el test malla-a-malla de `mapa` no se ejecutaba nunca ("ninguno" de por vida). Fusionando vértices,
        # cajas/cilindros/esferas vuelven a ser cuerpos cerrados y `contains` funciona (necesita rtree).
        m.merge_vertices()
        piezas.append({"nom": d["nom"], "box": d["box"], "mesh": m, "parent": d.get("parent", ""), "esMalla": d.get("esMalla", False)})
    return piezas

# Choques EXENTOS por DISEÑO (anclajes: lo empotrado en un muro/tejado/marco), cada uno con su motivo escrito:
# (ruta, subcadena de "nomA(cx,cy,cz) ⇄ nomB(cx,cy,cz)", motivo). Nunca se exime para «pasar».
EXENTOS_CHOQUE = [
    # ── salón: chimenea EMPOTRADA en el muro lateral (diseño aprobado; lo que queda tras el muro no se ve desde la cámara)
    ("/salon", ("Box+Box+Cylinder+5(-4.70,0.96,2.52)", "⇄ Box(-5.00,2.30,0.00)"), "chimenea empotrada en el muro lateral (18.9 cm medidos malla-a-malla; anclaje de diseño aprobado, invisible desde la cámara)"),
    # ── entrada «/»: la fachada es UNA caja (0.00,2.30,-1.00) sin vanos; lo que va en ella se empotra unos cm (anclaje)
    ("/", ("Box+Box+Box+2(-2.80,1.94,-0.67) ⇄ Box(0.00,2.30,-1.00)",), "escaparate izq: marco empotrado 4 cm en la fachada (anclaje)"),
    ("/", ("Box+Box+Box+2(2.60,1.94,-0.67) ⇄ Box(0.00,2.30,-1.00)",), "escaparate der: marco empotrado 4 cm en la fachada (anclaje)"),
    ("/", ("Box+Box+Box+2(2.60,1.94,-0.67) ⇄ Tube+Tube+Tube+116",), "enredadera APROBADA por SER: las ramas pasan por DETRÁS del alféizar (saliente de 29 cm modelado macizo hasta el muro); no visible"),
    ("/", ("Box+Sphere(0.00,1.50,-0.74) ⇄ Box(0.00,2.30,-1.00)",), "hoja de la puerta: 6 cm dentro de la fachada sin vano (anclaje)"),
    ("/", ("Box+Sphere(0.00,1.50,-0.74) ⇄ Box(0.00,1.55,-0.85)",), "hoja de la puerta dentro de su marco macizo de 25 cm (el vano es pintado)"),
    ("/", ("Box(0.00,2.30,-1.00) ⇄ Box(0.00,1.55,-0.85)",), "marco de la puerta empotrado en la fachada (anclaje)"),
    ("/", ("Box+Cylinder+Cylinder+4(-3.89,3.8", "⇄ Box(0.00,2.30,-1.00)"), "LETRERO aprobado por SER en vivo (y=4.22): cruza el muro 20 cm (mitad del texto dentro) — PENDIENTE decisión de SER, no se toca"),
    ("/", ("Box+Cylinder+Cylinder+4(-3.89,3.8", "⇄ Box(0.00,4.75,-0.50)"), "LETRERO aprobado por SER: la escuadra toca el alero 5 cm — pendiente con lo anterior"),
    ("/", ("Sphere+Sphere+Sphere(", "⇄ Box(3.40,5.10,-1.20)"), "humo animado: nace dentro del cañón de la chimenea"),
    ("/", ("Box+Box+Box+1(-1.15,1.34,-0.74) ⇄ Box(0.00,2.30,-1.00)",), "buzón anclado 4 cm en la fachada"),
    ("/", ("Cylinder+Box+Box+4(-3.90,1.29,0.60) ⇄ Cylinder+Cylinder+Cylinder+18",), "cuerda de los banderines atada al farol (1.8 cm dentro del poste)"),
    ("/", ("Box(0.00,2.30,-1.00) ⇄ Box(", ",3.72,-0.42)"), "tabla del toldo: nace del muro (16.6 cm empotrada, inclinada 0.62 rad)"),
    ("/", ("Box(0.00,2.30,-1.00) ⇄ Box(3.40,5.10,-1.20)",), "chimenea: atraviesa fachada y tejado (anclaje)"),
    ("/", ("Box(0.00,4.75,-0.50) ⇄ Box(3.40,5.10,-1.20)",), "chimenea: atraviesa el tejado inclinado (anclaje)"),
]

def _es_muro(p):
    """muro o zócalo de la sala (≥7 de largo, no es tabla del suelo)"""
    b = p["box"]; sx, sy, sz = [b["max"][k]-b["min"][k] for k in range(3)]
    return max(sx, sz) >= 7 and sy >= 0.1 and min(sx, sz) < 1.0

def _cierre_por_cara(m):
    """True por cara si su CUERPO (componente conexo) es cerrado: un plano transparente dentro de una pieza
    no debe dejar 'abierta' a la caja que tiene al lado."""
    out = np.zeros(len(m.faces), dtype=bool)
    try:
        comps = trimesh.graph.connected_components(m.face_adjacency, nodes=np.arange(len(m.faces)))
        for c in comps:
            sub = m.submesh([c], append=True, repair=False)
            out[c] = bool(sub.is_watertight)
    except Exception:
        out[:] = m.is_watertight
    return out

def _etq(p):
    b = p["box"]; c = [(b["min"][k]+b["max"][k])/2 for k in range(3)]
    return f"{p['nom']}({c[0]:.2f},{c[1]:.2f},{c[2]:.2f})"

def _penetracion(a, b, umbral=0.005):
    """Vértices de una pieza DENTRO del cuerpo cerrado de la otra, con profundidad máxima (m).
    None = ninguna de las dos es cerrada (sin veredicto). Roces < umbral no cuentan."""
    from trimesh.proximity import signed_distance
    mejor = None
    for (cont, otra, quien) in ((a, b, b["nom"]), (b, a, a["nom"])):
        if "cerrado" not in cont:
            # el sub-mesh de cuerpos cerrados de la pieza (las caras abiertas —planos, tubos— no pueden contener nada)
            cc = _cierre_por_cara(cont["mesh"])
            cont["cerrado"] = cont["mesh"].submesh([np.where(cc)[0]], append=True, repair=False) if cc.any() else None
        if cont["cerrado"] is None: continue
        cont_mesh = cont["cerrado"]
        pts = otra["mesh"].vertices[::3]
        try:  # puntos de superficie: cazan piezas que ATRAVIESAN otra sin meter vértices (letrero en el muro)
            pts = np.vstack([pts, otra["mesh"].sample(400)])
        except Exception: pass
        dentro = cont_mesh.contains(pts)
        nd = int(np.sum(dentro))
        if nd == 0:
            mejor = mejor or (0, 0.0, quien); continue
        prof = float(np.max(signed_distance(cont_mesh, pts[dentro])))  # + = dentro
        if prof < umbral:
            mejor = mejor or (0, 0.0, quien); continue
        if mejor is None or prof > mejor[1]: mejor = (nd, prof, quien)
    return mejor

def mapa(ruta=None):
    pl, page = conecta(ruta)
    piezas = extraer(page)
    print(f"== {_ruta(page)} · {len(piezas)} piezas (malla real, decimada)")
    suelo_y = 0.0
    for p in sorted(piezas, key=lambda x: (x["box"]["min"][2], x["box"]["min"][0])):
        b = p["box"]; c = [(b["min"][i]+b["max"][i])/2 for i in range(3)]; s = [b["max"][i]-b["min"][i] for i in range(3)]
        print(f"   {p['nom']:34s} c({c[0]:5.2f},{c[1]:5.2f},{c[2]:5.2f}) s({s[0]:4.2f},{s[1]:4.2f},{s[2]:4.2f}) minY={b['min'][1]:.3f}")
    # CHOQUES REALES: pares con AABB solapado → penetración por muestreo de vértices
    print("-- choques (penetración malla-a-malla, no cajas):")
    algun = False; n_real = 0; n_ex = 0; n_sin = 0; ruta_act = _ruta(page)
    for i in range(len(piezas)):
        for j in range(i+1, len(piezas)):
            a, b = piezas[i], piezas[j]
            A, B = a["box"], b["box"]
            ox = min(A["max"][0],B["max"][0]) - max(A["min"][0],B["min"][0])
            oy = min(A["max"][1],B["max"][1]) - max(A["min"][1],B["min"][1])
            oz = min(A["max"][2],B["max"][2]) - max(A["min"][2],B["min"][2])
            if ox <= 0.005 or oy <= 0.005 or oz <= 0.005: continue
            if a["esMalla"] and b["esMalla"] and a["parent"] and a["parent"] == b["parent"]: continue  # partes de un mismo compuesto (tablero+patas, muros+zócalos)
            if _es_muro(a) and _es_muro(b): continue  # estructura de la sala consigo misma
            try:
                r = _penetracion(a, b)
                par = f"{_etq(a)} ⇄ {_etq(b)}"
                if r is None:
                    if ox > 0.06 and oy > 0.06 and oz > 0.06:
                        print(f"   ? {par}: AABB se cruzan {ox:.2f}×{oy:.2f}×{oz:.2f} (mallas abiertas, sin veredicto)"); algun = True; n_sin += 1
                elif r[0] > 0:
                    nd, prof, quien = r
                    ex = next((m for (rt, sub, m) in EXENTOS_CHOQUE if rt == ruta_act and all(x in par for x in (sub if isinstance(sub, tuple) else (sub,)))), None)
                    if not ex and (_es_muro(a) or _es_muro(b)) and prof <= 0.10: ex = "anclaje en muro/zócalo (≤10 cm: cuadros, baldas, puertas, ventanas encastradas)"
                    if ex: print(f"   (EXENTO {par}: {prof*100:.1f} cm · {ex})"); n_ex += 1
                    else: print(f"   ⚠ {par}: {nd} puntos de {quien} dentro, hasta {prof*100:.1f} cm (solape AABB {ox:.2f}×{oy:.2f}×{oz:.2f})"); n_real += 1
                    algun = True
            except Exception as e:
                print(f"   ? {a['nom']} ⇄ {b['nom']}: error en el test ({type(e).__name__}: {e})"); algun = True
    if not algun: print("   (ninguno)")
    print(f"-- {n_real} choques reales · {n_ex} exentos con motivo · {n_sin} sin veredicto (mallas abiertas)")
    pl.stop()

def _wid():
    return subprocess.run(["bash","-c","DISPLAY=:0 xdotool search --class chromium | while read w; do g=$(DISPLAY=:0 xdotool getwindowgeometry $w 2>/dev/null | grep Geometry); echo \"$w $g\"; done | awk '/3840x2160/ {print $1; exit}'"], capture_output=True, text=True).stdout.strip()

def zonas(ruta=None):
    pl, page = conecta(ruta)
    full = f"{Z}/full.png"
    page.screenshot(path=full)  # CDP: contenido del navegador aunque esté tapado
    from PIL import Image
    im = Image.open(full)
    W, H = im.size
    for fy in range(3):
        for fx in range(3):
            im.crop((fx*W//3, fy*H//3, (fx+1)*W//3, (fy+1)*H//3)).resize((W//3*2, H//3*2)).save(f"{Z}/zona_{fy}{fx}.png")
    print(f"9 zonas ampliadas ×2 en {Z}/ (zona_00 arriba-izq … zona_22 abajo-dcha)")
    pl.stop()

def pieza(nombre):
    pl, page = conecta(None)
    r = page.evaluate("""(nom) => { const s=window.__scene; let obj=null;
      s.traverse(o=>{ if(!obj && o.name===nom) obj=o; }); if(!obj) return null;
      let cam=null; s.traverse(o=>{ if(!cam&&o.isOrthographicCamera) cam=o; });
      cam.updateMatrixWorld(true); cam.matrixWorldInverse.copy(cam.matrixWorld).invert();
      const w=obj.getWorldPosition(obj.position.clone());
      const V=w.clone().project(cam);
      return { x:(V.x*0.5+0.5)*innerWidth, y:(-V.y*0.5+0.5)*innerHeight, iw:innerWidth }; }""", nombre)
    if not r: print("pieza sin name (usa 'mapa' para ver nombres)"); pl.stop(); return
    f = f"{Z}/pieza_{nombre}.png"
    page.screenshot(path=f"{Z}/_full.png")
    esc = 1.0  # ya en pixeles CSS del screenshot
    cx, cy = int(r["x"]), int(r["y"])
    from PIL import Image
    im = Image.open(f"{Z}/_full.png")
    im.crop((max(0,cx-320), max(0,cy-220), min(im.width,cx+320), min(im.height,cy+220))).resize((1600,1100)).save(f)
    print(f)
    pl.stop()

# Exentos de `apoyo` por DISEÑO, cada uno con su motivo escrito: (ruta, subcadena "nombre c(x,y,z)", motivo)
EXENTOS_APOYO = [
    ("/", "Box c(3.40,5.10,-1.20)", "chimenea: su base atraviesa el tejado inclinado (anclaje de diseño)"),
]

def apoyo(ruta=None):
    """APOYO de cada pieza con la GEOMETRÍA REAL (encargo de SER 22-ago: «todas las que NO tienen la posición correcta»).
    Rayos desde la base de cada pieza (centro + 4 puntos de su huella) contra las mallas de las OTRAS piezas:
      · hacia ABAJO: primer impacto entrando = su apoyo (suelo, mesa, balda…) → hueco = minY − impacto (OK si ≤ 0.025)
      · hacia ARRIBA: si el primer impacto es una cara SALIENDO de otra pieza, la base está DENTRO → HUNDIDA (profundidad)
        (> 30 cm dentro de una caja mayor = EMPOTRADA: anclaje de diseño, p.ej. chimenea en el tejado)
    Exenciones automáticas con motivo: PARED (toca un muro, solo si FLOTA), COLGADA (techo / sujeta o atada a otra
    pieza más alta, solo si FLOTA), ANIM (se mueve entre dos muestras o es toda transparente: humo/vapor).
    DENTRO/FUERA de la sala por los muros reales (cara interior); la entrada sin muros usa la calle."""
    pl, page = conecta(ruta)
    d1 = page.evaluate(APOYO_JS); page.wait_for_timeout(350); d2 = page.evaluate(APOYO_JS)
    if not d1: print("sin escena"); pl.stop(); sys.exit(1)
    geo = extraer(page)   # mismas piezas, mismo orden (mismo recorrido del grafo)
    if len(geo) != len(d1): print(f"aviso: {len(geo)} piezas con malla vs {len(d1)} ligeras (escena cambiando)")
    movido = {}
    for i, (a, b) in enumerate(zip(d1, d2)):
        dc = max(abs((a["box"]["min"][k]+a["box"]["max"][k])/2 - (b["box"]["min"][k]+b["box"]["max"][k])/2) for k in range(3))
        ds = max(abs((a["box"]["max"][k]-a["box"]["min"][k]) - (b["box"]["max"][k]-b["box"]["min"][k])) for k in range(3))
        movido[i] = dc > 0.01 or ds > 0.02
    piezas = d1
    # ── sala: muros reales (cajas ≥7 de largo, ≥3 de alto, <1 de grueso) y suelo (pieza plana grande)
    def dims(b): return [b["max"][k]-b["min"][k] for k in range(3)]
    traseras = [p["box"] for p in piezas if dims(p["box"])[0] >= 7 and dims(p["box"])[1] >= 3 and dims(p["box"])[2] < 1]
    laterales = [p["box"] for p in piezas if dims(p["box"])[2] >= 7 and dims(p["box"])[1] >= 3 and dims(p["box"])[0] < 1]
    suelos = [p["box"] for p in piezas if dims(p["box"])[1] < 0.1 and p["box"]["max"][1] < 0.1 and dims(p["box"])[0]*dims(p["box"])[2] > 20]
    sueloY = max((b["max"][1] for b in suelos), default=0.0)
    es_sala = bool(traseras and laterales)
    lim = {"xmin": -1e9, "xmax": 1e9, "zmin": -1e9, "zmax": 1e9, "techo": None}
    if es_sala:
        lim["zmin"] = max(b["max"][2] for b in traseras); lim["xmin"] = max(b["max"][0] for b in laterales)
        lim["xmax"] = max(b["max"][0] for b in traseras); lim["zmax"] = max(b["max"][2] for b in laterales)
        lim["techo"] = min(b["max"][1] for b in traseras + laterales)
    elif suelos:
        b = max(suelos, key=lambda b: dims(b)[0]*dims(b)[2]); lim.update(xmin=b["min"][0], xmax=b["max"][0], zmin=b["min"][2], zmax=b["max"][2])
    paredes = traseras + laterales
    def toca_pared(b):
        for m in paredes:
            if dims(m)[0] >= 7 and b["min"][2] <= m["max"][2] + 0.25 and b["max"][2] >= m["min"][2] - 0.25 and b["max"][0] >= m["min"][0] and b["min"][0] <= m["max"][0]: return True
            if dims(m)[2] >= 7 and b["min"][0] <= m["max"][0] + 0.25 and b["max"][0] >= m["min"][0] - 0.25 and b["max"][2] >= m["min"][2] and b["min"][2] <= m["max"][2]: return True
        return False
    print(f"== {_ruta(page)} · {len(piezas)} piezas · suelo y={sueloY:.3f} · {'sala' if es_sala else 'exterior'} x[{lim['xmin']:.2f},{lim['xmax']:.2f}] z[{lim['zmin']:.2f},{lim['zmax']:.2f}]" + (f" techo={lim['techo']:.2f}" if lim["techo"] else ""))
    # ── una sola malla del mundo con mapa cara→pieza (rayos con rtree)
    mallas = [g["mesh"] for g in geo]
    mundo = trimesh.util.concatenate(mallas)
    dueño = np.concatenate([np.full(len(m.faces), i) for i, m in enumerate(mallas)])
    cerrada_cara = np.concatenate([_cierre_por_cara(m) for m in mallas])   # solo un CUERPO cerrado puede contener la base de otra pieza
    inter = mundo.ray
    def rayo(origenes, dy, yo):
        """primer impacto de cada rayo (origen, dirección ±y) que NO sea de la pieza yo → (y, pieza, saliendo?)"""
        dirs = np.tile([0.0, dy, 0.0], (len(origenes), 1))
        loc, idx_ray, idx_tri = inter.intersects_location(np.array(origenes), dirs, multiple_hits=True)
        mejor = {}
        for L, r, t in zip(loc, idx_ray, idx_tri):
            q = int(dueño[t])
            if q == yo: continue
            d = (L[1] - origenes[r][1]) * dy
            if d < 0: continue
            if r not in mejor or d < mejor[r][0]:
                n = mundo.face_normals[t]; mejor[r] = (d, q, bool(cerrada_cara[t]) and float(n[1] * dy) > 0.0)
        return mejor
    filas = []; n_mal = 0
    for i, p in enumerate(piezas):
        b = p["box"]; sx, sy, sz = dims(b)
        if max(sx, sz) >= 7 or (sy < 0.1 and sx*sz > 20): continue   # muros, suelo, calle
        cx, cz = (b["min"][0]+b["max"][0])/2, (b["min"][2]+b["max"][2])/2
        minY, maxY = b["min"][1], b["max"][1]
        fuera = (b["min"][0] < lim["xmin"]-0.05 and not toca_pared(b)) or b["max"][0] > lim["xmax"]+0.05 or \
                (b["min"][2] < lim["zmin"]-0.05 and not toca_pared(b)) or b["max"][2] > lim["zmax"]+0.05
        if lim["techo"] and minY > lim["techo"]: fuera = True
        pts = [(cx, cz)] + [(cx + ax*sx*0.25, cz + az*sz*0.25) for ax, az in ((-1,-1),(1,-1),(-1,1),(1,1))]
        abajo = rayo([[x, minY + 0.006, z] for x, z in pts], -1.0, i)
        arriba = rayo([[x, minY - 0.003, z] for x, z in pts], +1.0, i)
        # apoyo: el impacto ENTRANDO más cercano hacia abajo (cualquiera de los 5 puntos)
        ap = [(d, q) for d, q, sal in abajo.values() if not sal]
        hueco, apoyo_en = (min(ap)[0], piezas[min(ap)[1]]["nom"]) if ap else (minY - sueloY, "el suelo")
        if hueco < 0.002 and ap: hueco = 0.0
        # hundida: el rayo hacia arriba desde justo bajo la base SALE de otra pieza (estamos dentro de ella)
        hund = [(d, q) for d, q, sal in arriba.values() if sal]
        ver = None; det = ""
        hermana = p.get("esMalla") and any(j != i and q.get("esMalla") and q.get("parent") == p.get("parent") and q["box"]["min"][1] < minY and q["box"]["max"][1] >= minY - 0.025 for j, q in enumerate(piezas))
        if hermana: ver, det = "OK", "sobre una parte hermana del mismo compuesto (tablero sobre sus patas)"
        elif hund and max(hund)[0] <= 0.025: ver, det = "OK", f"sobre {piezas[max(hund)[1]]['nom']} ({max(hund)[0]*100:.1f} cm dentro, tolerancia)"
        elif hund:
            d, q = max(hund)  # la profundidad mayor entre los 5 puntos
            ver, det = ("EMPOTRADA" if d > 0.3 else "HUNDIDA"), f"{d*100:.1f} cm dentro de {piezas[q]['nom']}"
        elif abs(minY - sueloY) <= 0.02: ver, det = "OK", "suelo"
        elif hueco <= 0.025: ver, det = "OK", f"sobre {apoyo_en}" + (f" ({hueco*100:.1f} cm)" if hueco > 0.005 else "")
        elif minY < sueloY - 0.01: ver, det = "HUNDIDA", f"{(sueloY-minY)*100:.1f} cm bajo el suelo"
        else: ver, det = "FLOTA", f"{hueco*100:.1f} cm de aire sobre {apoyo_en}"
        if ver in ("FLOTA", "HUNDIDA"):
            if movido.get(i) or p["todoTrans"]: ver, det = "ANIM", ("se mueve" if movido.get(i) else "transparente (humo/vapor)") + " · " + det
            elif ver == "FLOTA":
                if lim["techo"] and maxY >= lim["techo"] - 0.15 and minY > 0.3: ver, det = "COLGADA", "del techo · " + det
                else:
                    # atada/sujeta: otra pieza que EMPIEZA cerca de mi tope (o por encima) y toca mi caja (cuerda al toldo, percha)
                    sujeta = [q["nom"] for j, q in enumerate(piezas) if j != i and minY > sueloY + 0.3 and q["box"]["min"][1] >= maxY - 0.1 and
                              all(q["box"]["min"][k] - 0.03 <= b["max"][k] and q["box"]["max"][k] + 0.03 >= b["min"][k] for k in range(3))]
                    if sujeta: ver, det = "COLGADA", f"sujeta a {sujeta[0]} · " + det
                    elif toca_pared(b) and minY > sueloY + 0.02: ver, det = "PARED", "toca un muro · " + det
        etiqueta = f"{p['nom']} c({cx:.2f},{(minY+maxY)/2:.2f},{cz:.2f})"
        ruta_act = _ruta(page)
        for r_, sub, motivo in EXENTOS_APOYO:
            if r_ == ruta_act and sub in etiqueta and (ver in ("FLOTA", "HUNDIDA") or fuera):
                ver, det, fuera = "EXENTO", f"{motivo} · era {ver}: {det}", False; break
        if ver in ("FLOTA", "HUNDIDA") or fuera: n_mal += 1
        filas.append((p["nom"], cx, (minY+maxY)/2, cz, minY, ver, det, "FUERA" if fuera else ""))
    for nom, cx, cy, cz, minY, ver, det, f in sorted(filas, key=lambda r: ({"HUNDIDA":0,"FLOTA":1,"EMPOTRADA":2}.get(r[5], 3), r[3], r[1])):
        marca = "⚠" if ver in ("FLOTA", "HUNDIDA") or f else " "
        print(f" {marca} {nom:30s} c({cx:5.2f},{cy:5.2f},{cz:5.2f}) minY={minY:6.3f}  {ver:9s} {det}{('  ⚠ ' + f) if f else ''}")
    print(f"-- {n_mal} piezas mal (FLOTA/HUNDIDA/FUERA sin exención) de {len(filas)}")
    pl.stop()

def punto(x, y, z, radio=260):
    """Recorte AMPLIADO ×2.5 centrado en un punto del MUNDO (para mirar una pieza sin name)."""
    pl, page = conecta(None)
    r = page.evaluate("""([x,y,z]) => { let cam=null; window.__scene.traverse(o=>{ if(!cam&&o.isOrthographicCamera) cam=o; });
      cam.updateMatrixWorld(true); cam.matrixWorldInverse.copy(cam.matrixWorld).invert();
      const V=new (Object.getPrototypeOf(cam.position).constructor)(x,y,z); V.project(cam);
      return { x:(V.x*0.5+0.5)*innerWidth, y:(-V.y*0.5+0.5)*innerHeight }; }""", [float(x), float(y), float(z)])
    page.screenshot(path=f"{Z}/_full.png")
    from PIL import Image
    im = Image.open(f"{Z}/_full.png"); cx, cy = int(r["x"]), int(r["y"]); rr = int(radio)
    f = f"{Z}/punto_{float(x):.2f}_{float(y):.2f}_{float(z):.2f}.png"
    im.crop((max(0,cx-rr), max(0,cy-int(rr*0.7)), min(im.width,cx+rr), min(im.height,cy+int(rr*0.7)))).resize((int(rr*5), int(rr*3.5))).save(f)
    print(f); pl.stop()

def composicion(ruta=None):
    """LA GRAMÁTICA VISUAL (encargo de SER 19-ago): a dónde se dirige todo,
    proporciones humanas, equilibrio de masas, vacíos y paleta. Veredictos accionables."""
    pl, page = conecta(ruta)
    piezas = extraer(page)
    url = _ruta(page)
    print(f"══ COMPOSICIÓN {url} · {len(piezas)} piezas")

    # ── 1. PROPORCIONES contra referencias humanas (una puerta = 2.5-2.9 aquí) ──
    print("— proporciones (alto real de cada familia):")
    import collections
    alturas = collections.defaultdict(list)
    for pz in piezas:
        b = pz["box"]; h = b["max"][1] - b["min"][1]
        if h > 0.02: alturas[pz["nom"].split("+")[0]].append(h)
    puertas = [pz for pz in piezas if 2.4 < (pz["box"]["max"][1]-pz["box"]["min"][1]) < 3.4 and pz["box"]["min"][1] < 0.2]
    ref = max((pz["box"]["max"][1]-pz["box"]["min"][1]) for pz in puertas) if puertas else 2.75
    print(f"   referencia puerta≈{ref:.2f} → persona≈{ref*0.68:.2f}")
    for pz in piezas:
        b = pz["box"]; h = b["max"][1]-b["min"][1]; w = max(b["max"][0]-b["min"][0], b["max"][2]-b["min"][2])
        if h < 0.03 or w < 0.03: continue
        # sospechas: mesa fuera de 0.7-1.2, silla fuera de 0.75-1.1, pieza de suelo más alta que la puerta
        if b["min"][1] < 0.25 and h > ref * 1.05:
            print(f"   ⚠ {pz['nom']:30s} h={h:.2f} MÁS ALTA que la puerta (¿escala?)")
        if 0.02 < h < 0.12 and w > 1.5 and b["min"][1] > 0.3:
            print(f"   ⚠ {pz['nom']:30s} losa fina y grande a {b['min'][1]:.2f} de alto (¿flotante?)")

    # ── 2. EQUILIBRIO DE MASAS por cuadrante de pantalla + VACÍOS ──
    r = page.evaluate("""() => { let cam=null; window.__scene.traverse(o=>{if(!cam&&o.isOrthographicCamera)cam=o;});
      cam.updateMatrixWorld(true); cam.matrixWorldInverse.copy(cam.matrixWorld).invert();
      return { iw: innerWidth, ih: innerHeight, cam: true }; }""")
    def proy(pt):
        return page.evaluate("""([x,y,z]) => { let cam=null; window.__scene.traverse(o=>{if(!cam&&o.isOrthographicCamera)cam=o;});
          cam.updateMatrixWorld(true); cam.matrixWorldInverse.copy(cam.matrixWorld).invert();
          const V=new (Object.getPrototypeOf(cam.position).constructor)(x,y,z); V.project(cam);
          return [(V.x*0.5+0.5), (-V.y*0.5+0.5)]; }""", pt)
    reja = np.zeros((3, 3))
    for pz in piezas:
        b = pz["box"]
        c = [(b["min"][i]+b["max"][i])/2 for i in range(3)]
        vol = max(1e-4, (b["max"][0]-b["min"][0])*(b["max"][1]-b["min"][1])*(b["max"][2]-b["min"][2]))
        u, v = proy(c)
        if 0 <= u < 1 and 0 <= v < 1: reja[int(v*3)][int(u*3)] += vol ** 0.5
    tot = reja.sum() or 1
    print("— masa visual por novenos de pantalla (arriba→abajo, %):")
    for f in range(3): print("   " + "  ".join(f"{reja[f][c]/tot*100:5.1f}" for c in range(3)))
    vacios = [(f, c) for f in range(3) for c in range(3) if reja[f][c]/tot < 0.02 and f >= 1]
    if vacios: print(f"   ⚠ novenos casi VACÍOS (fila,col): {vacios} — el diorama no llena su encuadre ahí")

    # ── 3. DIRECCIÓN: ¿los caminos/piezas apuntan al focal (la puerta)? ──
    if puertas:
        pb = puertas[0]["box"]; foco = [(pb["min"][0]+pb["max"][0])/2, (pb["min"][2]+pb["max"][2])/2]
        u, v = proy([foco[0], 1.2, foco[1]])
        print(f"— focal (puerta) en pantalla: ({u*100:.0f}%, {v*100:.0f}%)" +
              ("  ⚠ fuera del tercio central" if not (0.3 < u < 0.7) else "  ✓ bien situado"))

    # ── 4. PALETA: colores dominantes del render ──
    page.screenshot(path=f"{Z}/_comp.png")
    from PIL import Image
    im = Image.open(f"{Z}/_comp.png").convert("RGB").resize((160, 90))
    px = np.array(im).reshape(-1, 3)
    cuant = (px // 32 * 32)
    unicos, cuenta = np.unique(cuant, axis=0, return_counts=True)
    orden = np.argsort(-cuenta)[:6]
    print("— paleta dominante:", ", ".join(f"#{r:02x}{g:02x}{b:02x} {c*100//len(px)}%" for (r, g, b), c in
          [(unicos[i], cuenta[i]) for i in orden]))
    ncol = int((cuenta / len(px) > 0.005).sum())
    print(f"   {ncol} colores relevantes" + (" ⚠ paleta pobre (<6): añade acentos" if ncol < 6 else
          " ⚠ paleta dispersa (>14): unifica" if ncol > 14 else " ✓ rango sano"))
    pl.stop()

if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "mapa"
    arg = sys.argv[2] if len(sys.argv) > 2 else None
    {"mapa": lambda: mapa(arg), "zonas": lambda: zonas(arg), "pieza": lambda: pieza(arg),
     "apoyo": lambda: apoyo(arg), "punto": lambda: punto(*sys.argv[2:6]),
     "composicion": lambda: composicion(arg)}[cmd]()
