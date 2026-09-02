#!/usr/bin/env python3
"""VERIFICADOR i18n DEL CATÁLOGO (20-ago-2026, encargo de SER: «traduccion de todos los
textos en la pagina y sus descripciones todo entero, verificalos»).

Qué prueba DE VERDAD (no de palabra):
 1. Extrae del código fuente TODOS los strings ES del catálogo (tés, porqués, cajas,
    extras, procedencias, cupones) — los inequívocos (≥12 chars o nombre propio).
 2. Recorre la clásica ENTERA en EN y en SL (11 rutas + cesta con té+caja+cupón)
    y falla si CUALQUIER string ES aparece en el texto visible.
 3. En ES comprueba la regresión contraria: los originales SIGUEN estando.
Salida: por idioma y ruta; exit 1 si hay residuos.
 4. (22-ago) También el DIORAMA 3D: /, /te, /te-premium, /nosotros, /contacto, /carrito y el panel del
    tarro abierto con su planta. Lo visible (HUD/paneles) y lo sr-only (src/scenes) se informan aparte.
    `--sin-3d` limita la pasada a la clásica.
"""
import re, sys, json, os
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = os.environ.get("PETRA_BASE", "http://localhost:3111")
SRC = Path(__file__).resolve().parent.parent / "src"
SIN_3D = "--sin-3d" in sys.argv  # solo la clásica (el dominio WEB); por defecto también el diorama

def strings_es():
    """Todos los textos ES del catálogo que NO deberían verse en EN/SL."""
    out = set()
    data = (SRC / "data").glob("*.ts")
    for f in data:
        t = f.read_text(encoding="utf8")
        for campo in ("nombre", "paraQueSirve", "porQueEnEsteMix", "procedencia", "descripcion"):
            for m in re.findall(rf'{campo}: "([^"]+)"', t):
                if len(m) >= 12 or campo == "nombre":
                    out.add(m)
    # nombres de estación ES que se pintan sueltos
    out |= {"todo el año", "invierno", "otoño", "primavera"}  # 'verano'≈no, muy corto pero único...
    out.add("verano")
    return sorted(out, key=len, reverse=True)

RUTAS = ["/clasica", "/clasica/tes", "/clasica/tes/sueno-del-bosque", "/clasica/tes/oro-de-otono",
         "/clasica/cajas", "/clasica/despensa", "/clasica/cucharas", "/clasica/nosotros",
         "/clasica/faq", "/clasica/envios", "/clasica/contacto",
         "/clasica/legal", "/clasica/privacidad", "/clasica/cookies", "/clasica/devoluciones"]
# LA TIENDA 3D (22-ago): mismo método sobre el texto visible (HUD, menús, paneles). Los rótulos dentro del canvas
# (drei <Text>) no son DOM y no se pueden leer aquí: los lista el informe para el constructor 3D.
RUTAS_3D = ["/", "/te", "/te-premium", "/nosotros", "/contacto", "/carrito"]

# palabras que EXISTEN igual en otros idiomas o en nombres propios — no son residuo:
# Rooibos (idéntico ×3) y Melisa (el nombre ESLOVENO correcto de la planta es «Melisa»)
PERMITIDOS = {"Rooibos", "rooibos", "Melisa"}

JS_TEXTO = """(quitar) => { const c = document.body.cloneNode(true);
      c.querySelectorAll(quitar).forEach(e => e.remove());
      // nodos de texto unidos con espacio: «Sueño del Bosque7,50 €» (textContent) escondía el residuo al buscar palabra completa
      const w = document.createTreeWalker(c, NodeFilter.SHOW_TEXT); const out = []; let n;
      while ((n = w.nextNode())) out.push(n.textContent); return out.join(' '); }"""

def texto(page, quitar=".latin, script, style, noscript"):
    """Texto visible SIN scripts (JSON-LD no es visible) NI los nodos .latin: el latín botánico se queda en latín a propósito
    (Verbena officinalis, Salvia officinalis… no son castellano)."""
    return page.evaluate(JS_TEXTO, quitar)

import re as _re
def hay(s, t):
    """Palabra/frase COMPLETA (límites de palabra): «Brezo» no debe saltar dentro de «Brezova»."""
    return _re.search(r"(?<![\wáéíóúñčšž])" + _re.escape(s) + r"(?![\wáéíóúñčšž])", t) is not None

def revisar(page, lang, es_strings):
    fallos = []
    for ruta in RUTAS:
        page.goto(BASE + ruta, wait_until="networkidle")
        # esperar a que el idioma esté APLICADO (html[lang] lo sigue desde el 22-ago): con el dev server cargado,
        # leer antes de hidratar daba el HTML del servidor (ES) y un falso «23 residuos» en SL
        try: page.wait_for_function(f"() => document.documentElement.lang === '{lang}'", timeout=8000)
        except Exception: pass
        page.wait_for_timeout(400)
        t = texto(page)
        residuos = [s for s in es_strings if s not in PERMITIDOS and hay(s, t)]
        if residuos:
            fallos.append((ruta, residuos[:4]))
        print(f"  [{lang}] {ruta:38s} {'✗ ' + str(len(residuos)) + ' residuos ES' if residuos else '✓ limpio'}")
    # LA CESTA con té + caja + cupón (nombres de línea + aviso del cupón + recibo)
    page.goto(BASE + "/clasica", wait_until="networkidle")
    page.evaluate("""() => localStorage.setItem('petra-cart-v1', JSON.stringify({
        state:{lines:[{kind:'tea',id:'sueno-del-bosque',qty:1},{kind:'caja',id:'caja-general',qty:1}],cupon:null},version:0}))""")
    page.goto(BASE + "/clasica/cesta", wait_until="networkidle")
    page.wait_for_timeout(600)
    page.fill("input:not([type=email])", "PETRA10")
    page.click("aside button.btn-tinta")
    page.wait_for_timeout(500)
    t = texto(page)
    residuos = [s for s in es_strings if s not in PERMITIDOS and hay(s, t)]
    if residuos:
        fallos.append(("/clasica/cesta+cupon", residuos[:4]))
    print(f"  [{lang}] {'/clasica/cesta (té+caja+PETRA10)':38s} {'✗ ' + str(len(residuos)) + ' residuos' if residuos else '✓ limpio'}")
    if SIN_3D:
        return fallos
    # ── EL 3D: HUD + menú + paneles (el canvas no es DOM). Dos cubos: lo VISIBLE (HUD, paneles, cesta) y lo
    # que solo leen los lectores de pantalla (.sr-only-block, escrito en src/scenes/*) — se informan por separado.
    def residuos_3d(etiqueta):
        vis = texto(page, ".latin, script, style, noscript, .sr-only-block")
        sr = page.evaluate("() => [...document.querySelectorAll('.sr-only-block')].map(e => e.textContent).join(' ')")
        rv = [s for s in es_strings if s not in PERMITIDOS and hay(s, vis)]
        rs = [s for s in es_strings if s not in PERMITIDOS and hay(s, sr)]
        if rv: fallos.append((etiqueta + " (3D visible)", rv[:4]))
        if rs: fallos.append((etiqueta + " (3D sr-only, src/scenes)", rs[:4]))
        estado = "✓ limpio" if not (rv or rs) else "✗ " + " · ".join(x for x in [f"{len(rv)} visibles" if rv else "", f"{len(rs)} sr-only" if rs else ""] if x)
        print(f"  [{lang}] {etiqueta:38s} {estado}")
    for ruta in RUTAS_3D:
        page.goto(BASE + ruta, wait_until="load")
        page.wait_for_timeout(2500)  # el diorama tarda más en hidratar que el papel
        residuos_3d(ruta + " (3D)")
    # el panel del tarro (TeaPanel) con su planta: se abre por el store de UI que expone TeaPanel en window.__petraUi
    page.goto(BASE + "/te", wait_until="load"); page.wait_for_timeout(3000)
    ok_panel = page.evaluate("""() => { const ui = window.__petraUi; if (!ui) return false;
      ui.getState().focusTea('sueno-del-bosque'); ui.getState().setPlant('manzanilla'); return true; }""")
    if ok_panel:
        page.wait_for_timeout(900)
        abierto = page.evaluate("() => [...document.querySelectorAll('aside')].some(a => /Sleep|sen|Bosque/.test(a.innerText))")
        if not abierto: fallos.append(("/te panel tarro (3D)", ["el panel del tarro NO se abrió"]))
        residuos_3d("/te panel tarro+planta (3D)")
    else:
        fallos.append(("/te panel tarro (3D)", ["sin window.__petraUi: el panel no se pudo abrir"]))
        print(f"  [{lang}] {'/te panel del tarro (3D)':38s} ✗ sin window.__petraUi")
    return fallos

def main():
    es_strings = strings_es()
    print(f"strings ES del catálogo vigilados: {len(es_strings)}")
    total = {}
    with sync_playwright() as pl:
        b = pl.chromium.launch(executable_path="/usr/bin/chromium", headless=True, args=["--no-sandbox", "--use-gl=swiftshader"])
        for lang in ("en", "sl"):
            ctx = b.new_context(viewport={"width": 1600, "height": 1000}, locale=lang)
            page = ctx.new_page()
            page.goto(BASE + "/clasica", wait_until="domcontentloaded")
            page.evaluate(f"() => localStorage.setItem('petra-lang', '{lang}')")
            fallos = revisar(page, lang, es_strings)
            if fallos: total[lang] = fallos
            ctx.close()
        # REGRESIÓN ES: los originales siguen
        ctx = b.new_context(viewport={"width": 1600, "height": 1000})
        page = ctx.new_page()
        page.goto(BASE + "/clasica", wait_until="domcontentloaded")
        page.evaluate("() => localStorage.setItem('petra-lang', 'es')")
        page.goto(BASE + "/clasica/tes/sueno-del-bosque", wait_until="networkidle")
        t = texto(page)
        muestras = ["Sueño del Bosque", "afloja el cuerpo", "estómago nervioso"]
        ok = all(m in t for m in muestras)
        print(f"  [es] regresión ficha (3 muestras)      {'✓ intactas' if ok else '✗ FALTAN: ' + str([m for m in muestras if m not in t])}")
        if not ok: total["es"] = [("regresion", muestras)]
        ctx.close()
        # FALLBACK DEL TALLER: un té vivo SIN traducción debe verse (en ES) bajo EN, sin romper
        import urllib.request, os
        def api(metodo, data):
            r = urllib.request.Request(BASE + "/api/catalogo", method=metodo,
                data=json.dumps(data).encode(), headers={"Content-Type": "application/json", "x-taller-key": os.environ.get("TALLER_KEY", "")})
            return urllib.request.urlopen(r).status
        api("POST", {"tipo": "tea", "item": {"nombre": "Prueba Fallback Taller", "precio": 5,
            "paraQueSirve": "Té de prueba del verificador: si lees esto en la web es un fallo mío, no de Petra.",
            "plantas": [{"plantaId": "menta", "porQueEnEsteMix": "porqué de prueba en castellano"}]}})
        try:
            ctx = b.new_context(viewport={"width": 1600, "height": 1000})
            page = ctx.new_page()
            page.goto(BASE + "/clasica", wait_until="domcontentloaded")
            page.evaluate("() => localStorage.setItem('petra-lang', 'en')")
            page.goto(BASE + "/clasica/tes/prueba-fallback-taller", wait_until="networkidle")
            page.wait_for_timeout(600)
            tv = texto(page)
            fb_ok = "Prueba Fallback Taller" in tv and "porqué de prueba en castellano" in tv
            print(f"  [en] fallback taller (té vivo → ES)    {'✓ se ve en ES sin romper' if fb_ok else '✗ NO aparece el té vivo'}")
            if not fb_ok: total["fallback"] = [("/clasica/tes/prueba-fallback-taller", ["no visible"])]
            ctx.close()
        finally:
            api("DELETE", {"tipo": "tea", "id": "prueba-fallback-taller"})
        b.close()
    if total:
        print("\n✗ RESIDUOS/FALLOS:")
        print(json.dumps(total, ensure_ascii=False, indent=1)[:2000])
        sys.exit(1)
    print("\n✓ i18n del catálogo LIMPIO: EN y SL sin una sola frase ES; ES intacto.")

if __name__ == "__main__":
    main()
