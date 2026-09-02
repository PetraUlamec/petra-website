#!/usr/bin/env python3
"""Batería de verificación de Petra Website (vive en el repo — lección antibiblioteca 19-ago).
Uso:  python3 bateria.py shots [q]     → captura 7 salas en pantalla real + FPS + errores
      python3 bateria.py compra       → flujo entero: cesta→cupón→pago→recibo (clics JS)
      python3 bateria.py geo          → auditor geométrico (flotantes/incrustados)
Requiere: servidor en :3111, DISPLAY :0 para 'shots'. Capturas → /tmp/petra-shots/."""
import asyncio, sys, os, json
from playwright.async_api import async_playwright

BASE = os.environ.get("PETRA_BASE", "http://localhost:3111")
S = "/tmp/petra-shots"; os.makedirs(S, exist_ok=True)
RUTAS = ["/", "/salon", "/te", "/te-premium", "/nosotros", "/contacto", "/carrito"]

async def fps(page, secs=2.5):
    return await page.evaluate("""(s)=>new Promise(r=>{let n=0;const t0=performance.now();
      const l=()=>{n++;if(performance.now()-t0<s*1000)requestAnimationFrame(l);else r((n/s).toFixed(1));};requestAnimationFrame(l);})""", secs)

async def navegador(p, headed=True):
    args = ["--no-sandbox","--force-device-scale-factor=1"]
    if headed:
        _c = {"1":(0,0),"2":(1920,0),"3":(0,1080),"4":(1920,1080)}.get(os.environ.get("PETRA_CUADRANTE","1"),(0,0))
        _pos = (3840,0) if os.environ.get("PETRA_PANTALLA","hdmi")=="hp" else _c
        args += [f"--window-position={_pos[0]},{_pos[1]}","--window-size=1920,1080"]  # panel de la cuadrícula; nunca fullscreen
    else: args += ["--use-gl=swiftshader"]
    b = await p.chromium.launch(executable_path="/usr/bin/chromium", headless=not headed,
        args=args, env={"DISPLAY": ":0"} if headed else None)
    ctx = await b.new_context(no_viewport=True) if headed else await b.new_context(viewport={"width":1440,"height":900})
    return b, await ctx.new_page()

async def shots(q=""):
    async with async_playwright() as p:
        b, page = await navegador(p, headed=True)
        errs = []
        page.on("pageerror", lambda e: errs.append("PAGEERROR:"+str(e)[:120]))
        page.on("console", lambda m: errs.append("CONSOLE:"+m.text[:120]) if m.type == "error" else None)
        page.on("requestfailed", lambda r: errs.append("RED:"+r.url[-60:]))
        suf = f"?q={q}" if q else ""
        for ruta in RUTAS:
            await page.goto(BASE+ruta+suf, wait_until="load"); await page.wait_for_timeout(3200)
            name = ruta.strip("/").replace("/", "_") or "intro"
            f = await fps(page)
            await page.screenshot(path=f"{S}/bat_{name}.png", timeout=90000)
            print(f"{ruta}: FPS {f}", flush=True)
        print("ERRORES:", errs[:8] if errs else "NINGUNO", flush=True)
        await b.close()

async def compra():
    async with async_playwright() as p:
        b, page = await navegador(p, headed=False)
        await page.goto(BASE+"/carrito", wait_until="load")
        await page.evaluate("""() => localStorage.setItem('petra-cart-v1',
          JSON.stringify({state:{lines:[{kind:'tea',id:'oro-de-otono',qty:1},{kind:'caja',id:'caja-verano',qty:1}],cupon:null},version:0}))""")
        await page.reload(wait_until="load"); await page.wait_for_timeout(2500)
        js = "(t) => { const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes(t)); if(b){b.click();return 1} return 0 }"
        for t in ["Aplicar", "Apply", "Pagar con tarjeta", "Pay by card", "DEMO"]:
            try:
                await page.evaluate(js, t)
                await page.wait_for_timeout(400)
            except Exception:
                break  # la navegación a /gracias destruye el contexto: buena señal
        try:
            await page.evaluate(js, "prueba")
        except Exception:
            pass  # la navegación puede destruir el contexto: buena señal
        try: await page.wait_for_url("**/gracias", timeout=12000)
        except Exception: pass
        await page.wait_for_timeout(3000)
        txt = await page.evaluate("() => document.body.innerText")
        ok = ("PE-" in txt) and ("Cucharita" in txt or "secreto" in txt.lower() or "secret" in txt.lower())
        print("COMPRA→RECIBO con entrada y cuchara ?:", "OK" if ok else "FALLO", flush=True)
        await b.close()

AUDIT_JS = """() => {
  const scene = window.__scene; if (!scene) return { error: "sin escena" };
  const out = { flotantes: [], enPared: [], total: 0 }; const boxes = [];
  scene.traverse((o) => {
    if (!o.isMesh || !o.geometry) return;
    o.updateWorldMatrix(true, false); o.geometry.computeBoundingBox();
    const bb = o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld);
    if (!isFinite(bb.min.x)) return;
    const size = { x: bb.max.x-bb.min.x, y: bb.max.y-bb.min.y, z: bb.max.z-bb.min.z };
    if (size.x*size.y*size.z < 0.0005) return;
    out.total++;
    const c = { x:(bb.min.x+bb.max.x)/2, y:(bb.min.y+bb.max.y)/2, z:(bb.min.z+bb.max.z)/2 };
    const tag = `${o.geometry.type.replace("Geometry","")}@(${c.x.toFixed(1)},${c.y.toFixed(1)},${c.z.toFixed(1)})`;
    const nearWall = bb.min.z < -4.0 || bb.min.x < -4.0;
    boxes.push({ tag, bb:{min:{...bb.min},max:{...bb.max}}, maybeFloat: bb.min.y > 0.06 && bb.min.y < 1.5 && !nearWall && size.y > 0.05 });
    if (bb.min.y > 0.12 && size.y < 2.5 && size.y > 0.16 && ((bb.min.z<-4.95&&bb.max.z>-4.85&&size.z>0.25)||(bb.min.x<-4.95&&bb.max.x>-4.85&&size.x>0.25))) out.enPared.push(tag);
  });
  for (const b of boxes) {
    if (!b.maybeFloat) continue;
    const under = boxes.some((o)=>o!==b&&o.bb.max.y>b.bb.min.y-0.12&&o.bb.max.y<=b.bb.min.y+0.03&&o.bb.min.x<b.bb.max.x&&o.bb.max.x>b.bb.min.x&&o.bb.min.z<b.bb.max.z&&o.bb.max.z>b.bb.min.z);
    const inside = boxes.some((o)=>o!==b&&o.bb.min.y<=b.bb.min.y&&o.bb.max.y>=b.bb.min.y&&o.bb.min.x<b.bb.max.x&&o.bb.max.x>b.bb.min.x&&o.bb.min.z<b.bb.max.z&&o.bb.max.z>b.bb.min.z);
    if (!under && !inside) out.flotantes.push(b.tag);
  }
  out.flotantes=[...new Set(out.flotantes)].slice(0,12); out.enPared=[...new Set(out.enPared)].slice(0,8);
  return out; }"""

async def geo():
    async with async_playwright() as p:
        b, page = await navegador(p, headed=False)
        for ruta in RUTAS:
            await page.goto(BASE+ruta, wait_until="load"); await page.wait_for_timeout(3500)
            r = await page.evaluate(AUDIT_JS)
            flo, par = r.get("flotantes", []), r.get("enPared", [])
            estado = "limpio" if not flo and not par else f"FLOTANTES {flo} · EN PARED {par}"
            print(f"{ruta} ({r.get('total','?')} piezas): {estado}", flush=True)
        await b.close()

AUDIT2_JS = """() => {
  const scene = window.__scene; if (!scene) return { error: "sin escena" };
  const THREEBox = (o) => { const b = new (window.__THREE ? window.__THREE.Box3 : Object)(); return b; };
  // 1) candidatos pieza: el group MAS ALTO cuya diagonal < 4.2 (una pieza, no la sala)
  const piezas = []; const asignado = new Set();
  const boxOf = (o) => { o.updateWorldMatrix(true, true); let min=[1e9,1e9,1e9], max=[-1e9,-1e9,-1e9];
    o.traverse((m)=>{ if(!m.isMesh||!m.geometry) return; m.geometry.computeBoundingBox();
      const bb=m.geometry.boundingBox; if(!isFinite(bb.min.x)) return;
      const cs=[]; for(const xi of [bb.min.x,bb.max.x]) for(const yi of [bb.min.y,bb.max.y]) for(const zi of [bb.min.z,bb.max.z]) cs.push([xi,yi,zi]);
      for(const c of cs){ const v={x:c[0],y:c[1],z:c[2]}; const e=m.localToWorld(new m.position.constructor(v.x,v.y,v.z));
        min=[Math.min(min[0],e.x),Math.min(min[1],e.y),Math.min(min[2],e.z)];
        max=[Math.max(max[0],e.x),Math.max(max[1],e.y),Math.max(max[2],e.z)]; } });
    return min[0]>max[0] ? null : {min,max}; };
  const diag = (b)=>Math.hypot(b.max[0]-b.min[0],b.max[1]-b.min[1],b.max[2]-b.min[2]);
  const walk = (o) => { if (o.isMesh && !o.geometry) return;
    const b = o.isGroup||o.isMesh||o.type==="Object3D" ? boxOf(o) : null;
    if (b && diag(b) < 4.2 && (o.isGroup||o.type==="Object3D") && o.children.length>0) {
      let n=0; o.traverse(m=>{if(m.isMesh)n++;});
      if (n>0) { piezas.push({o,b,n}); o.traverse(m=>asignado.add(m.uuid)); return; } }
    for (const c of o.children) walk(c); };
  for (const c of scene.children) walk(c);
  // meshes sueltos no asignados
  scene.traverse((m)=>{ if(!m.isMesh||!m.geometry||asignado.has(m.uuid)) return;
    const b=boxOf(m); if(!b||diag(b)<0.06) return; piezas.push({o:m,b,n:1}); });
  // etiqueta legible
  const et = (pz) => { const o=pz.o; let g=[]; o.traverse(m=>{ if(m.isMesh&&m.geometry) g.push(m.geometry.type.replace("Geometry","")); });
    const c=[(pz.b.min[0]+pz.b.max[0])/2,(pz.b.min[1]+pz.b.max[1])/2,(pz.b.min[2]+pz.b.max[2])/2].map(v=>+v.toFixed(2));
    const s=[pz.b.max[0]-pz.b.min[0],pz.b.max[1]-pz.b.min[1],pz.b.max[2]-pz.b.min[2]].map(v=>+v.toFixed(2));
    const nom = o.name || (g.slice(0,3).join("+")+(g.length>3?"+"+(g.length-3):""));
    return { nom, c, s, minY:+pz.b.min[1].toFixed(3), n:pz.n }; };
  // suelo: mesh plano mas grande en y~0 → limites de la sala
  let sala={x:4.91,z:4.91};
  const inv = piezas.map(et);
  // checks
  const out={ piezas: inv.length, flotantes:[], fueraSala:[], solapes:[], tapanVentana:[], inventario:[] };
  const B = piezas.map(pz=>pz.b);
  piezas.forEach((pz,i)=>{ const e=et(pz);
    out.inventario.push(`${e.nom} c(${e.c}) s(${e.s})`);
    const sx=e.s[0],sy=e.s[1],sz=e.s[2];
    // flotante: pieza entera despegada sin nada debajo (ignora colgantes: minY>1.9 o toca techo/pared)
    const tocaPared = pz.b.min[2]<-4.55||pz.b.min[0]<-4.55||pz.b.max[0]>4.55||pz.b.max[2]>4.55;
    if (e.minY>0.05 && e.minY<1.9 && !tocaPared && sy>0.04) {
      const apoyo = piezas.some((o,j)=>j!==i && B[j].max[1]>pz.b.min[1]-0.15 && B[j].max[1]<pz.b.min[1]+0.05
        && B[j].min[0]<pz.b.max[0] && B[j].max[0]>pz.b.min[0] && B[j].min[2]<pz.b.max[2] && B[j].max[2]>pz.b.min[2]);
      const dentro = piezas.some((o,j)=>j!==i && B[j].min[1]<pz.b.min[1] && B[j].max[1]>pz.b.min[1]
        && B[j].min[0]<pz.b.max[0] && B[j].max[0]>pz.b.min[0] && B[j].min[2]<pz.b.max[2] && B[j].max[2]>pz.b.min[2]);
      if (!apoyo && !dentro) out.flotantes.push(`${e.nom} c(${e.c}) minY=${e.minY}`);
    }
    // fuera de sala: solo si ATRAVIESA el muro (grosor 0.18, cara ext -5.09) o es suelo
    const esSuelo = e.minY < 0.05 && Math.max(sx,sz) > 7;
    if (!esSuelo && e.c[1]<4.4 && (pz.b.min[0]<-5.12||pz.b.max[0]>5.12||pz.b.min[2]<-5.12))
      out.fueraSala.push(`${e.nom} c(${e.c}) s(${e.s})`);
    // solapes de volumen entre piezas (>35% del menor)
    for (let j=i+1;j<piezas.length;j++){ const a=pz.b,b2=B[j];
      const ox=Math.min(a.max[0],b2.max[0])-Math.max(a.min[0],b2.min[0]);
      const oy=Math.min(a.max[1],b2.max[1])-Math.max(a.min[1],b2.min[1]);
      const oz=Math.min(a.max[2],b2.max[2])-Math.max(a.min[2],b2.min[2]);
      if(ox>0&&oy>0&&oz>0){ const vo=ox*oy*oz;
        const va=(a.max[0]-a.min[0])*(a.max[1]-a.min[1])*(a.max[2]-a.min[2]);
        const vb=(b2.max[0]-b2.min[0])*(b2.max[1]-b2.min[1])*(b2.max[2]-b2.min[2]);
        const ca=[(a.min[0]+a.max[0])/2,(a.min[2]+a.max[2])/2], cb=[(b2.min[0]+b2.max[0])/2,(b2.min[2]+b2.max[2])/2];
        const dc=Math.hypot(ca[0]-cb[0],ca[1]-cb[1]);
        if (dc>0.14 && vo>0.4*Math.min(va,vb) && Math.min(va,vb)>0.004 && vo<0.92*Math.min(va,vb)) {
          const e2=et(piezas[j]); out.solapes.push(`${e.nom}(${e.c}) ⇄ ${e2.nom}(${e2.c})`); } } }
  });
  // ventana: mesh emissive grande → corredor delante
  scene.traverse((m)=>{ if(!m.isMesh||!m.material||!m.material.emissiveIntensity||m.material.emissiveIntensity<1.5) return;
    const b=boxOf(m); if(!b||(b.max[0]-b.min[0])*(b.max[1]-b.min[1])<1) return;
    const esFondo = (b.max[2]-b.min[2])<0.5; if(!esFondo) return;
    piezas.forEach((pz,i)=>{ const e=et(pz);
      if (pz.b.min[2]>b.max[2]+0.1 && pz.b.min[2]<b.max[2]+1.6 && e.s[1]>1.0 && e.c[1]>1.2
        && pz.b.min[0]>-4.5 && pz.b.max[0]<4.5
        && pz.b.min[0]<b.max[0]-0.2 && pz.b.max[0]>b.min[0]+0.2) out.tapanVentana.push(`${e.nom} c(${e.c})`); });
  });
  for (const k of ["flotantes","fueraSala","solapes","tapanVentana"]) out[k]=[...new Set(out[k])].slice(0,14);
  return out; }"""

# Exentos por DISEÑO (BUGS.md): [ruta, subcadena de coordenada]
EXENTOS = [
    ("/", "(0,4.75,-0.5)"), ("/", "(3.4,5.1,-1.2)"),          # tejado ⇄ chimenea intro
    ("/", "(-3.16,2.8,0.35)"),                                 # farola en la calle, delante de fachada
    ("/", "(0,2.3,-1)"),                                       # marquesina/cartel sobre la puerta
    # enredadera APROBADA por SER trepando por el escaparate derecho: su AABB es una lámina delante del cristal (solape
    # de cajas inevitable); la malla real solo pasa por DETRÁS del alféizar (ver_escena.py mapa, 23-ago, exento con motivo)
    ("/", "⇄ Tube+Tube+Tube+116(3.22,1.31,-0.6)"),
    ("/salon", "(-4.7,0.96,2.52)"),                            # chimenea empotrada en muro
    ("/salon", "(-4.71,1.6,-1.4)"),                            # cortinas de la puerta oeste (DoorDrapes)
    ("/te", "(2.51,0.32,-3.82)"), ("/te", "(2.51,0.72,-3.82)"),# peldaños de la escalera inclinada (misma pieza)
    ("/nosotros", "Buffer+Buffer+Buffer+5(-2.79,"),  # vapor animado (y variable)                               # vapor de la tetera (intangible)
]
def exento(ruta, linea):
    return any(r == ruta and c in linea for r, c in EXENTOS)

async def geo2(detalle=""):
    async with async_playwright() as p:
        b, page = await navegador(p, headed=False)
        for ruta in RUTAS:
            await page.goto(BASE+ruta, wait_until="load"); await page.wait_for_timeout(3500)
            r = await page.evaluate(AUDIT2_JS)
            if "error" in r: print(f"{ruta}: {r['error']}"); continue
            probs = {k: r[k] for k in ["flotantes","fueraSala","solapes","tapanVentana"] if r[k]}
            print(f"== {ruta} ({r['piezas']} piezas) {'LIMPIO' if not probs else ''}", flush=True)
            reales = 0
            for k, v in probs.items():
                for x in v:
                    if exento(ruta, x): print(f"   ({k} EXENTO: {x})", flush=True)
                    else: print(f"   {k}: {x}", flush=True); reales += 1
            if probs and not reales: print("   → LIMPIO (solo exentos)", flush=True)
            if detalle == "inv":
                for x in r["inventario"]: print("   ·", x, flush=True)
        await b.close()

cmd = sys.argv[1] if len(sys.argv) > 1 else "shots"
arg = sys.argv[2] if len(sys.argv) > 2 else ""
asyncio.run({"shots": lambda: shots(arg), "compra": compra, "geo": geo, "geo2": lambda: geo2(arg)}[cmd]())
