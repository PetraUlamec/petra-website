#!/usr/bin/env python3
"""PANTALLA DE TRABAJO. 23-ago: SER está presente y quiere VERLO TODO → HDMI en cuadrícula 2×2
(PETRA_CUADRANTE=1..4). Cuando SER usa el HDMI: PETRA_PANTALLA=hp → portátil (eDP +3840,0).

Reglas pagadas (antibiblioteca): nada de fullscreen (un modeset mío le rompió el audio),
perfil limpio (chromium recuerda zoom por dominio), capturas por CDP (scrot capta lo que hay
DELANTE y podría captar su HDMI), matar por puerto con fuser (pgrep/pkill es suicida).

Env:  PETRA_BASE (server), PETRA_CDP (puerto CDP, defecto 9333; cada agente el suyo), PETRA_PROFILE
Uso:  hp.py abrir [ruta]     → chromium --app en la HP con CDP
      hp.py ir <ruta>        → navega la ventana de la HP
      hp.py foto <nombre>    → captura por CDP a /tmp/petra-hp/<nombre>.png
      hp.py cerrar
"""
import sys, os, time, subprocess, json, urllib.request

BASE = os.environ.get("PETRA_BASE", "http://localhost:3111")
CDP_PORT = os.environ.get("PETRA_CDP", "9333")  # cada agente puede usar el suyo (9334, 9335…)
CDP = f"http://localhost:{CDP_PORT}"
PROFILE = os.environ.get("PETRA_PROFILE", f"/tmp/petra-chrome-hp-{CDP_PORT}")
OUT = "/tmp/petra-hp"; os.makedirs(OUT, exist_ok=True)
# 23-ago (SER presente): TODO se ve en su HDMI (4K) en una cuadrícula 2×2 de paneles 1920×1080 (escala 1),
# un panel por agente: PETRA_CUADRANTE=1 (arriba-izq, orquestador/producción), 2 (arriba-der), 3 (abajo-izq),
# 4 (abajo-der). PETRA_PANTALLA=hp vuelve al modo portátil (eDP +3840,0) de cuando SER usaba el HDMI.
CUAD = {"1": (0, 0), "2": (1920, 0), "3": (0, 1080), "4": (1920, 1080)}
if os.environ.get("PETRA_PANTALLA", "hdmi") == "hp":
    HP = {"x": 3840, "y": 0, "w": 1920, "h": 1080}
else:
    _cx, _cy = CUAD.get(os.environ.get("PETRA_CUADRANTE", "1"), (0, 0))
    HP = {"x": _cx, "y": _cy, "w": 1920, "h": 1080}
# PETRA_GRANDE=1 → ventana de revisión para SER: todo el HDMI (3840×2160) a escala 2 (CSS 1920×1080, legible),
# SIN fullscreen (modeset → audio). Los paneles de los constructores quedan debajo; siguen capturando por CDP.
ESCALA = "1"
if os.environ.get("PETRA_GRANDE") == "1":
    HP = {"x": 0, "y": 0, "w": 3840, "h": 2160}; ESCALA = "2"

def hp_encendida():
    if os.environ.get("PETRA_PANTALLA", "hdmi") != "hp": return True  # el HDMI siempre está
    r = subprocess.run(["xrandr", "--listmonitors"], capture_output=True, text=True, env={**os.environ, "DISPLAY": ":0"})
    return "eDP" in r.stdout

def abrir(ruta="/clasica"):
    if not hp_encendida():
        subprocess.run(["xrandr", "--output", "eDP", "--mode", "1920x1080", "--right-of", "HDMI-A-0"],
                       env={**os.environ, "DISPLAY": ":0"}); time.sleep(3)
    subprocess.run(["fuser", "-k", f"{CDP_PORT}/tcp"], capture_output=True); time.sleep(1)
    subprocess.Popen(["/usr/bin/chromium", "--no-sandbox", f"--force-device-scale-factor={ESCALA}",
                      f"--user-data-dir={PROFILE}", f"--remote-debugging-port={CDP_PORT}",
                      f"--window-position={HP['x']},{HP['y']}", f"--window-size={HP['w']},{HP['h']}",
                      f"--app={BASE}{ruta}"],
                     env={**os.environ, "DISPLAY": ":0"}, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(5)
    print(f"HP: abierto {ruta} en +{HP['x']},{HP['y']} {HP['w']}x{HP['h']} (CDP :{CDP_PORT})")

def _page():
    from playwright.sync_api import sync_playwright
    pl = sync_playwright().start()
    b = pl.chromium.connect_over_cdp(CDP)
    return pl, b.contexts[0].pages[0]

def ir(ruta):
    pl, page = _page()
    page.goto(BASE + ruta, wait_until="load"); page.wait_for_timeout(2500)
    # confirmar que la ventana sigue en la HP
    pos = page.evaluate("() => [window.screenX, window.screenY, window.innerWidth, window.innerHeight]")
    ok = abs(pos[0] - HP["x"]) < 40 and abs(pos[1] - HP["y"]) < 80
    print(f"PANTALLA: {ruta} · ventana en {pos[0]},{pos[1]} ({pos[2]}x{pos[3]}) {'✓ en su panel' if ok else '✗ FUERA de su panel ' + str((HP['x'], HP['y']))}")
    pl.stop()

def foto(nombre):
    pl, page = _page()
    f = f"{OUT}/{nombre}.png"; page.screenshot(path=f); print(f); pl.stop()

def cerrar():
    subprocess.run(["fuser", "-k", f"{CDP_PORT}/tcp"], capture_output=True); print("HP: cerrado")

if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "abrir"; a = sys.argv[2:]
    {"abrir": lambda: abrir(*a), "ir": lambda: ir(a[0]), "foto": lambda: foto(a[0]), "cerrar": cerrar}[cmd]()
