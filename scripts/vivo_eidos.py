#!/usr/bin/env python3
"""RECORRIDO EN VIVO con el cuerpo de EIDOS (S3 19-ago).
Chromium REAL fullscreen en :0 con CDP + ratón/teclado FÍSICOS (DesktopController
de EIDOS/pyautogui) + ojos (scrot + OCR de EIDOS). El DOM y la proyección 3D→píxel
salen por CDP (playwright connect_over_cdp), las ACCIONES van por el ratón físico.

Uso:  python3 vivo_eidos.py abrir            → lanza chromium real con CDP :9333
      python3 vivo_eidos.py sala /te         → navega y percibe (captura+OCR+DOM)
      python3 vivo_eidos.py tarro <idx>      → hover FÍSICO sobre el tarro idx y captura
      python3 vivo_eidos.py click x y        → clic físico
      python3 vivo_eidos.py compra           → flujo de compra con ratón físico
      python3 vivo_eidos.py github <query>   → busca en GitHub con el navegador real
Capturas → /tmp/petra-vivo/
"""
import sys, os, time, subprocess, json

sys.path.insert(0, "/home/ser/EIDOS")
os.environ.setdefault("DISPLAY", ":1" if os.environ.get("EIDOS_D1") else ":0")
BASE = os.environ.get("PETRA_BASE", "http://localhost:3111")
CDP = "http://localhost:9333"
S = "/tmp/petra-vivo"; os.makedirs(S, exist_ok=True)

def manos():
    from core.computer_use_v2 import get_desktop_controller
    return get_desktop_controller()

def shot(nombre):
    p = f"{S}/{nombre}.png"
    subprocess.run(["scrot", "-o", p], env={**os.environ, "DISPLAY": ":0"})
    return p

def cdp_page():
    from playwright.sync_api import sync_playwright
    pl = sync_playwright().start()
    b = pl.chromium.connect_over_cdp(CDP)
    page = b.contexts[0].pages[0]
    return pl, b, page

def abrir():
    subprocess.Popen(["/usr/bin/chromium", "--no-sandbox", "--force-device-scale-factor=1",
                      "--user-data-dir=/tmp/petra-chrome-profile",  # perfil limpio: sin zoom recordado ni Restore
                      "--remote-debugging-port=9333",
                      "--window-position=" + os.environ.get("PETRA_POS", "0,0"), "--window-size=1920,1080", BASE],  # panel (PETRA_POS=x,y), nunca fullscreen
                     env={**os.environ, "DISPLAY": ":0"},
                     stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(6); print("chromium real abierto con CDP :9333"); print(shot("abierto"))

def sala(ruta):
    pl, b, page = cdp_page()
    page.goto(BASE + ruta, wait_until="load"); page.wait_for_timeout(3500)
    errs = page.evaluate("() => (window.__errs||[]).slice(0,5)")
    n = page.evaluate("""() => { let n=0; if(window.__scene) window.__scene.traverse(o=>{if(o.isMesh)n++;}); return n; }""")
    f = f"{S}/sala{ruta.replace('/', '_')}.png"
    page.screenshot(path=f)  # framebuffer del chromium real (no molesta a las ventanas de SER)
    print(f"{ruta}: {n} meshes; captura:", f)
    pl.stop()

def proyectar(page, x, y, z):
    """3D→píxel FÍSICO de pantalla (matrixWorldInverse al día + escala CSS→física)."""
    r = page.evaluate("""([x,y,z]) => { let cam=null;
      window.__scene.traverse(o=>{ if(!cam && o.isOrthographicCamera) cam=o; });
      cam = cam || window.__camera; if(!cam) return null;
      cam.updateMatrixWorld(true);
      cam.matrixWorldInverse.copy(cam.matrixWorld).invert();
      const V=new (Object.getPrototypeOf(cam.position).constructor)(x,y,z); V.project(cam);
      return { x: (V.x*0.5+0.5)*window.innerWidth, y: (-V.y*0.5+0.5)*window.innerHeight,
               iw: window.innerWidth, sx: window.screenX|0, sy: window.screenY|0,
               chrome: (window.outerHeight - window.innerHeight), dpr: window.devicePixelRatio || 1 }; }""", [x, y, z])
    if not r: return None
    # genérico: (origen de la ventana + borde superior + punto CSS) × dpr → píxel físico de :0
    return {"x": round((r["sx"] + r["x"]) * r["dpr"]), "y": round((r["sy"] + r["chrome"] + r["y"]) * r["dpr"])}

def tarro(idx):
    pl, b, page = cdp_page()
    pos = page.evaluate("""(i) => { const s=window.__scene; const jars=[];
      s.traverse(o=>{ if(o.name && o.name.startsWith("jar-")) jars.push(o); });
      if (!jars.length) return null; const j=jars[i%jars.length];
      const w=j.getWorldPosition(j.position.clone()); return [w.x,w.y+0.3,w.z]; }""", int(idx))
    if not pos:
        # sin names: usa las posiciones conocidas de la balda
        print("sin jar-names; pásame coords con 'click'"); pl.stop(); return
    pt = proyectar(page, *pos)
    m = manos()
    print(f"tarro {idx} mundo={pos} pantalla={pt}")
    if not pt or not (0 <= pt["x"] < 5760 and 0 <= pt["y"] < 2160):  # dentro de alguna pantalla de :0
        print("proyección fuera de pantalla — no muevo el ratón"); pl.stop(); return
    import pyautogui  # las manos de EIDOS
    pyautogui.moveTo(pt["x"], pt["y"], duration=0.8)
    time.sleep(2.2); print(shot(f"tarro{idx}_hover"))
    m.click(pt["x"], pt["y"]); time.sleep(2.0); print(shot(f"tarro{idx}_click"))
    pl.stop()

def click(x, y):
    m = manos(); print(m.click(int(x), int(y))); print(shot("click"))

def compra():
    pl, b, page = cdp_page()
    m = manos()
    def clic_texto(t):
        el = page.locator(f"button:has-text('{t}')").first
        bb = el.bounding_box()
        if not bb: print("no encontrado:", t); return False
        m.click(int(bb["x"] + bb["width"] / 2), int(bb["y"] + bb["height"] / 2))
        time.sleep(1.5); return True
    page.goto(BASE + "/te", wait_until="load"); page.wait_for_timeout(3000)
    print(shot("c1_sala"))
    # añadir desde el panel del primer tarro: clic físico en el tarro por proyección
    pos = page.evaluate("""() => { const s=window.__scene; let j=null;
      s.traverse(o=>{ if(!j && o.name && o.name.startsWith('jar-')) j=o; });
      if(!j) return null; const w=j.getWorldPosition(j.position.clone()); return [w.x,w.y+0.2,w.z]; }""")
    if pos:
        pt = proyectar(page, *pos)
        m.click(pt["x"], pt["y"]); time.sleep(2.5); print(shot("c2_tarro"))
    for t in ["Añadir", "Add", "En la cesta"]:
        try:
            if clic_texto(t): break
        except Exception: pass
    time.sleep(2); print(shot("c3_vuelo"))
    page.goto(BASE + "/carrito", wait_until="load"); page.wait_for_timeout(2500)
    print(shot("c4_carrito"))
    pl.stop()

def github(q):
    pl, b, page = cdp_page()
    page.goto(f"https://github.com/search?q={q.replace(' ', '+')}&type=repositories",
              wait_until="load")
    page.wait_for_timeout(4000)
    print(shot("gh_" + q.split()[0]))
    res = page.evaluate("""() => [...document.querySelectorAll('[data-testid="results-list"] .search-title a')]
        .slice(0,8).map(a => a.href + ' — ' + (a.closest('[data-testid]')?.innerText||'').split('\\n').slice(1,3).join(' '))""")
    print(json.dumps(res, indent=1, ensure_ascii=False)[:2400])
    pl.stop()

if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "abrir"
    args = sys.argv[2:]
    {"abrir": abrir, "sala": lambda: sala(args[0]), "tarro": lambda: tarro(args[0]),
     "click": lambda: click(*args), "compra": compra,
     "github": lambda: github(" ".join(args))}[cmd]()
