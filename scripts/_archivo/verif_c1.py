#!/usr/bin/env python3
"""Verificación C1 — WEB CLÁSICA (/clasica) + TALLER PRIVADO (/taller-privado) + APIs.

Uso:   python3 scripts/verif_c1.py            → todo contra http://localhost:3111
       BASE=http://localhost:3112 python3 scripts/verif_c1.py   → contra otro servidor
       python3 scripts/verif_c1.py api        → solo las rutas /api/* (rápido, sin navegador)

Reglas de la casa: clics vía page.evaluate (los clics estrictos de Playwright se cuelgan
con render por software), chromium /usr/bin/chromium headless con swiftshader.
Deja EVIDENCIA impresa de cada comprobación y BORRA el té de prueba al terminar.
"""
import asyncio, json, os, re, sys, datetime
from playwright.async_api import async_playwright

BASE = os.environ.get("BASE", "http://localhost:3111")
CLAVE = os.environ.get("TALLER_KEY", "petra")
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TE_PRUEBA_NOMBRE = "Verif C1 Te"      # slug → verif-c1-te
TE_PRUEBA_ID = "verif-c1-te"

RES = []  # (ok, titulo, evidencia)


def check(ok, titulo, evidencia=""):
    RES.append((bool(ok), titulo, str(evidencia)))
    print(("  OK   " if ok else "  FALLO") + f" · {titulo}")
    if evidencia:
        for linea in str(evidencia).splitlines():
            print("         " + linea[:220])
    sys.stdout.flush()


# ── lo que DEBE haber, leído del código fuente (no hardcodeado a mano) ────────
def tes_esperados():
    src = open(os.path.join(RAIZ, "src/data/teas.ts"), encoding="utf8").read()
    pat = re.compile(r'id:\s*"([^"]+)",\s*nombre:\s*"([^"]+)",\s*sala:\s*"(te|te-premium)"')
    return [{"id": a, "nombre": b, "sala": c} for a, b, c in pat.findall(src)]


def estacion_esperada(hoy=None):
    m = (hoy or datetime.date.today()).month
    if 3 <= m <= 5: return "primavera"
    if 6 <= m <= 8: return "verano"
    if 9 <= m <= 11: return "otono"
    return "invierno"


NOMBRE_ESTACION = {"primavera": "primavera", "verano": "verano", "otono": "otoño", "invierno": "invierno"}
EMOJI_ESTACION = {"primavera": "🌸", "verano": "🌞", "otono": "🍂", "invierno": "❄️"}


def frases_estacion(est):
    """Las tres frases (es/en/sl) de la estación, leídas del propio ClasicaView."""
    src = open(os.path.join(RAIZ, "src/app/clasica/ClasicaView.tsx"), encoding="utf8").read()
    m = re.search(est + r':\s*\{.*?frase:\s*\{\s*es:\s*"(.*?)",\s*en:\s*"(.*?)",\s*sl:\s*"(.*?)"', src, re.S)
    return {"es": m.group(1), "en": m.group(2), "sl": m.group(3)}

IGNORAR_CONSOLA = ("Download the React DevTools", "[Fast Refresh]", "Lighthouse")


def espia(page, bolsa):
    page.on("pageerror", lambda e: bolsa.append("PAGEERROR: " + str(e)[:200]))
    page.on("console", lambda m: (bolsa.append("CONSOLA: " + m.text[:200])
                                  if m.type == "error" and not any(x in m.text for x in IGNORAR_CONSOLA) else None))
    page.on("requestfailed", lambda r: bolsa.append(f"RED: {r.url[-70:]} ({r.failure})"))


# ═════════════════════════ (a) y (d) LA WEB CLÁSICA ═══════════════════════════
async def clasica(ctx, etiqueta):
    page = await ctx.new_page()
    errs = []
    espia(page, errs)
    await page.goto(BASE + "/clasica", wait_until="load")
    await page.evaluate("""() => { localStorage.removeItem('petra-cart-v1'); localStorage.setItem('petra-lang', 'es'); }""")
    await page.reload(wait_until="load")
    await page.wait_for_timeout(1500)

    check(not errs, f"[{etiqueta}] /clasica carga sin errores de consola/red", errs[:6] or "sin errores")

    est = estacion_esperada()
    txt = await page.evaluate("() => document.body.innerText")
    hero = await page.evaluate("() => document.querySelector('main header').innerText")
    tiene_est = NOMBRE_ESTACION[est].lower() in txt.lower() and EMOJI_ESTACION[est] in hero
    check(tiene_est, f"[{etiqueta}] muestra la estación actual ({NOMBRE_ESTACION[est]})",
          "hero: " + " | ".join(hero.split("\n")[:6]))

    # el idioma del hero debe seguir al menú (antes se leía de localStorage en el render:
    # menú en inglés + frase en español, y riesgo de desajuste de hidratación)
    fr = frases_estacion(est)
    coherente = fr["es"][:40] in hero
    errs_en = []
    p_en = await ctx.new_page()
    espia(p_en, errs_en)
    await p_en.goto(BASE + "/clasica", wait_until="load")
    await p_en.evaluate("() => localStorage.setItem('petra-lang', 'en')")
    await p_en.reload(wait_until="load")
    await p_en.wait_for_timeout(1500)
    hero_en = await p_en.evaluate("() => document.querySelector('main header').innerText")
    check(coherente and fr["en"][:40] in hero_en and not errs_en,
          f"[{etiqueta}] la frase de la estación va en el idioma del menú (es/en) y sin error de hidratación",
          f"es → {fr['es'][:60]!r} en el hero: {coherente}\n"
          f"en → {[l for l in hero_en.splitlines() if fr['en'][:20] in l] or hero_en.splitlines()[:4]}\n"
          f"errores: {errs_en[:3] or 'ninguno'}")
    await p_en.close()

    esperados = tes_esperados()
    n_art = await page.evaluate("() => document.querySelectorAll('#tes article').length")
    faltan = [t["nombre"] for t in esperados if t["nombre"] not in txt]
    check(n_art >= len(esperados) and not faltan,
          f"[{etiqueta}] tarjetas de té ({n_art} tarjetas; {len(esperados)} tés del catálogo base)",
          f"faltan en la página: {faltan or 'ninguno'}")

    antes = await page.evaluate("() => document.querySelectorAll('#tes article')[0].querySelectorAll('li').length")
    await page.evaluate("""() => { const a = document.querySelectorAll('#tes article')[0];
      const b = [...a.querySelectorAll('button')].find(x => x.textContent.includes('plantas')); b.click(); }""")
    await page.wait_for_timeout(400)
    despues = await page.evaluate("""() => { const a = document.querySelectorAll('#tes article')[0];
      return [a.querySelectorAll('li').length, a.innerText.slice(0, 400)]; }""")
    check(antes == 0 and despues[0] > 0, f"[{etiqueta}] el «porqué» se despliega al clic ({antes} → {despues[0]} plantas)",
          despues[1].replace("\n", " | ")[:300])

    nombre0 = await page.evaluate("() => document.querySelectorAll('#tes article')[0].querySelector('h3').innerText")
    id0 = next((t["id"] for t in esperados if t["nombre"] == nombre0), None)
    await page.evaluate("""() => { const a = document.querySelectorAll('#tes article')[0];
      a.querySelector('button.btn-miel').click(); }""")
    await page.wait_for_timeout(500)
    crudo = await page.evaluate("() => localStorage.getItem('petra-cart-v1')")
    lineas = json.loads(crudo)["state"]["lines"] if crudo else []
    ok_cart = any(l["kind"] == "tea" and l["id"] == id0 and l["qty"] >= 1 for l in lineas)
    check(ok_cart, f"[{etiqueta}] añadir al carrito escribe en petra-cart-v1 («{nombre0}» → {id0})", crudo or "vacío")

    # el MISMO almacén que el diorama: /carrito (escena 3D) lee la línea añadida aquí
    if etiqueta == "escritorio":
        errs2 = []
        p2 = await ctx.new_page()
        espia(p2, errs2)
        await p2.goto(BASE + "/carrito", wait_until="load")
        await p2.wait_for_timeout(4000)
        t2 = await p2.evaluate("() => document.body.innerText")
        check(nombre0 in t2, "carrito compartido: el diorama /carrito ve el té añadido desde /clasica",
              "panel: " + " | ".join([x for x in t2.split("\n") if x.strip()][:8]))
        await p2.close()
    await page.close()
    return True


# ═════════════════════════ (b) EL TALLER PRIVADO ══════════════════════════════
async def apis(api):
    r = await api.get("/api/catalogo")
    base_cat = await r.json()
    check(r.status == 200 and "teas" in base_cat, "GET /api/catalogo responde", f"{r.status} · {json.dumps(base_cat)[:180]}")

    cuerpo = {"tipo": "tea", "item": {"nombre": TE_PRUEBA_NOMBRE, "precio": 9, "plantas": [{"plantaId": "menta"}]}}
    r = await api.post("/api/catalogo", data=cuerpo)
    check(r.status in (401, 403), "POST /api/catalogo SIN cabecera → rechazo", f"{r.status} · {(await r.text())[:120]}")
    r = await api.post("/api/catalogo", headers={"x-taller-key": "clave-mala"}, data=cuerpo)
    check(r.status in (401, 403), "POST /api/catalogo con clave MALA → rechazo", f"{r.status} · {(await r.text())[:120]}")
    r = await api.fetch("/api/catalogo", method="DELETE", data={"tipo": "tea", "id": TE_PRUEBA_ID})
    check(r.status in (401, 403), "DELETE /api/catalogo SIN cabecera → rechazo", f"{r.status} · {(await r.text())[:120]}")

    r = await api.post("/api/foto", multipart={"nombre": "prueba"})
    check(r.status in (401, 403), "POST /api/foto SIN clave → rechazo", f"{r.status} · {(await r.text())[:120]}")
    r = await api.post("/api/foto", headers={"x-taller-key": CLAVE}, multipart={"nombre": "prueba-c1"})
    check(r.status == 400, "POST /api/foto CON clave y sin fichero → 400 (no escribe nada)",
          f"{r.status} · {(await r.text())[:120]}")

    r = await api.post("/api/catalogo", headers={"x-taller-key": CLAVE},
                       data={"tipo": "tea", "item": {"nombre": "Sin Plantas C1", "precio": 5, "plantas": []}})
    check(r.status == 400, "POST té sin plantas → 400 (valida)", f"{r.status} · {(await r.text())[:120]}")
    r = await api.post("/api/catalogo", headers={"x-taller-key": CLAVE}, data={"tipo": "loquesea", "item": {}})
    check(r.status == 400, "POST tipo desconocido → 400", f"{r.status} · {(await r.text())[:120]}")

    r = await api.post("/api/catalogo", headers={"x-taller-key": CLAVE, "content-type": "application/json"}, data="esto-no-es-json")
    check(r.status == 400, "POST /api/catalogo con cuerpo roto → 400 (antes: 500)", f"{r.status} · {(await r.text())[:120]}")
    r = await api.fetch("/api/catalogo", method="DELETE", headers={"x-taller-key": CLAVE})
    check(r.status == 400, "DELETE /api/catalogo sin cuerpo → 400 (antes: 500)", f"{r.status} · {(await r.text())[:120]}")

    r = await api.get("/api/doctor")
    doc = await r.json()
    check(r.status == 200 and isinstance(doc.get("avisos"), list) and "mapa" in doc,
          "GET /api/doctor responde con avisos y mapa",
          f"{r.status} · {len(doc.get('avisos', []))} avisos · salas del mapa: {list(doc.get('mapa', {}).get('ocupado', {}).keys())}")
    return base_cat


async def doctor_valida(api):
    """Publica un té COJO (sin para-qué-sirve y sin porqué) y comprueba que el doctor lo caza."""
    cojo = {"tipo": "tea", "item": {"nombre": TE_PRUEBA_NOMBRE, "precio": 9, "paraQueSirve": "",
                                    "plantas": [{"plantaId": "menta", "porQueEnEsteMix": ""}]}}
    await api.post("/api/catalogo", headers={"x-taller-key": CLAVE}, data=cojo)
    doc = await (await api.get("/api/doctor")).json()
    mios = [a for a in doc["avisos"] if TE_PRUEBA_NOMBRE in a["texto"]]
    check(len(mios) >= 2, "el doctor caza el té cojo (sin para-qué-sirve y sin porqué)",
          "\n".join(f"{a['nivel']}: {a['texto']}" for a in mios) or "no avisó de nada")

    sano = {"tipo": "tea", "item": {"nombre": TE_PRUEBA_NOMBRE, "precio": 9, "gramos": 60, "sala": "te",
                                    "paraQueSirve": "Prueba automática de C1: se borra al terminar.",
                                    "plantas": [{"plantaId": "menta", "porQueEnEsteMix": "Prueba C1: la menta abre el trago."},
                                                {"plantaId": "tila", "porQueEnEsteMix": "Prueba C1: la tila lo cierra suave."}]}}
    await api.post("/api/catalogo", headers={"x-taller-key": CLAVE}, data=sano)
    doc = await (await api.get("/api/doctor")).json()
    mios = [a for a in doc["avisos"] if TE_PRUEBA_NOMBRE in a["texto"]]
    check(not mios, "arreglado el té, el doctor ya no se queja de él", mios or "sin avisos sobre el té de prueba")
    # se retira: las pruebas del navegador empiezan con el catálogo limpio
    await api.fetch("/api/catalogo", method="DELETE", headers={"x-taller-key": CLAVE},
                    data={"tipo": "tea", "id": TE_PRUEBA_ID})


async def taller(ctx, api):
    page = await ctx.new_page()
    errs = []
    espia(page, errs)
    await page.goto(BASE + "/taller-privado", wait_until="load")
    await page.evaluate("() => localStorage.removeItem('petra-taller-clave')")
    await page.reload(wait_until="load")
    await page.wait_for_timeout(1200)
    check(not errs, "/taller-privado carga sin errores de consola/red", errs[:6] or "sin errores")

    # SIN clave: el taller rechaza (mensaje de la propia página)
    await page.fill("input[placeholder='Nombre del té (p. ej. Abrazo de Otoño)']", TE_PRUEBA_NOMBRE)
    await page.evaluate("""() => [...document.querySelectorAll('button')].find(b => b.textContent.includes('Publicar el té')).click()""")
    await page.wait_for_timeout(900)
    msg = await page.evaluate("() => document.querySelector('header p.panel')?.innerText ?? ''")
    cat = await (await api.get("/api/catalogo")).json()
    check("clave" in msg.lower() and not any(t["id"] == TE_PRUEBA_ID for t in cat["teas"]),
          "sin clave, el taller RECHAZA y no publica nada", f"mensaje: {msg!r}")

    # CON clave "petra": publicar por el FORMULARIO, 2 plantas con su porqué
    await page.fill("input[placeholder='Clave del taller']", CLAVE)
    await page.fill("textarea[placeholder='¿Para qué sirve este mix? (con tus palabras)']",
                    "Prueba automática de C1: se borra al terminar.")
    plantas = await page.evaluate("""() => {
      const cajas = [...document.querySelectorAll('input[type=checkbox]')].filter(c => c.closest('label')?.innerText.trim());
      const elegidas = cajas.slice(0, 2);
      elegidas.forEach(c => c.click());
      return elegidas.map(c => c.closest('label').innerText.trim()); }""")
    await page.wait_for_timeout(400)
    puestos = await page.evaluate("""() => { const t = [...document.querySelectorAll('textarea')].filter(x => x.placeholder.startsWith('¿Por qué'));
      const set = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
      t.forEach((x, i) => { set.call(x, 'Prueba C1 · porqué ' + (i + 1) + ': aquí está por esto.');
        x.dispatchEvent(new Event('input', { bubbles: true })); });
      return t.length; }""")
    await page.wait_for_timeout(300)
    await page.evaluate("""() => [...document.querySelectorAll('button')].find(b => b.textContent.includes('Publicar el té')).click()""")
    await page.wait_for_timeout(1200)
    msg = await page.evaluate("() => document.querySelector('header p.panel')?.innerText ?? ''")
    cat = await (await api.get("/api/catalogo")).json()
    mio = next((t for t in cat["teas"] if t["id"] == TE_PRUEBA_ID), None)
    check(mio is not None and len(mio["plantas"]) == 2 and all(p.get("porQueEnEsteMix") for p in mio["plantas"]),
          f"con clave «{CLAVE}» publica por el formulario ({plantas}, {puestos} porqués)",
          f"mensaje: {msg!r}\nGET /api/catalogo → {json.dumps(mio, ensure_ascii=False)[:300]}")

    listado = await page.evaluate("() => document.body.innerText")
    check(TE_PRUEBA_NOMBRE in listado, "el té publicado aparece en «Publicado desde el taller»",
          [l for l in listado.split("\n") if TE_PRUEBA_NOMBRE in l][:3])

    # el doctor desde la propia página (botón «Pasar revisión») + el inspector con mapa
    await page.evaluate("""() => [...document.querySelectorAll('button')].find(b => b.textContent.includes('Pasar revisión')).click()""")
    await page.wait_for_timeout(1200)
    doctor_ui = await page.evaluate("""() => { const s = [...document.querySelectorAll('section')].find(x => x.innerText.includes('El doctor de la tienda'));
      return [...s.querySelectorAll('li')].map(li => li.innerText).slice(0, 6); }""")
    check(len(doctor_ui) > 0, "el botón «Pasar revisión» pinta los avisos del doctor", doctor_ui)
    mapa = await page.evaluate("""() => { const s = [...document.querySelectorAll('section')].find(x => x.innerText.includes('El inspector'));
      const svg = s.querySelector('svg'); return svg ? [svg.querySelectorAll('circle').length, svg.querySelectorAll('text').length] : null; }""")
    check(mapa and mapa[0] > 0, "el inspector dibuja el mapa de planta", f"círculos={mapa[0] if mapa else 0} textos={mapa[1] if mapa else 0}")

    # «retirar» con la clave equivocada: debe avisar, NO tumbar la página (era un TypeError)
    errs.clear()
    await page.fill("input[placeholder='Clave del taller']", "clave-mala")
    await page.evaluate("""() => { const li = [...document.querySelectorAll('li')].find(x => x.innerText.includes('%s'));
      [...li.querySelectorAll('button')].find(b => b.textContent.includes('retirar')).click(); }""" % TE_PRUEBA_NOMBRE)
    await page.wait_for_timeout(900)
    msg = await page.evaluate("() => document.querySelector('header p.panel')?.innerText ?? ''")
    vivo = await page.evaluate("() => document.body.innerText.includes('%s')" % TE_PRUEBA_NOMBRE)
    # el 401 en la consola del navegador es ESPERADO (es la respuesta de la API); lo grave sería un PAGEERROR
    graves = [e for e in errs if e.startswith("PAGEERROR")]
    check(not graves and "clave" in msg.lower() and vivo,
          "«retirar» con clave equivocada avisa y NO tumba la página",
          f"mensaje: {msg!r} · el té sigue listado: {vivo}\nconsola: {errs[:2] or 'nada'} · errores graves: {graves or 'ninguno'}")
    await page.close()


async def clasica_ve_el_vivo(ctx):
    """El té publicado en el taller debe verse también en la web clásica (catálogo compartido)."""
    page = await ctx.new_page()
    await page.goto(BASE + "/clasica", wait_until="load")
    await page.wait_for_timeout(2500)
    nombres = await page.evaluate("() => [...document.querySelectorAll('#tes article h3')].map(h => h.innerText)")
    check(TE_PRUEBA_NOMBRE in nombres, "/clasica muestra el té del catálogo vivo publicado en el taller",
          f"tarjetas en /clasica ({len(nombres)}): {nombres}")
    await page.close()


async def limpiar(api, base_cat):
    r = await api.fetch("/api/catalogo", method="DELETE", headers={"x-taller-key": CLAVE},
                        data={"tipo": "tea", "id": TE_PRUEBA_ID})
    fin = await r.json()
    igual = json.dumps(fin, sort_keys=True) == json.dumps(base_cat, sort_keys=True)
    check(r.status == 200 and not any(t["id"] == TE_PRUEBA_ID for t in fin["teas"]) and igual,
          "té de prueba BORRADO y catálogo idéntico al de antes",
          f"catálogo final: {json.dumps(fin, ensure_ascii=False)[:220]}")


async def main():
    solo_api = len(sys.argv) > 1 and sys.argv[1] == "api"
    print(f"══ VERIFICACIÓN C1 · {BASE} · {datetime.datetime.now():%d-%b %H:%M} ══\n")
    async with async_playwright() as p:
        api = await p.request.new_context(base_url=BASE)
        print("── (c) APIs y candados ──")
        base_cat = await apis(api)
        print("\n── (b) doctor: ¿valida de verdad? ──")
        await doctor_valida(api)
        if not solo_api:
            b = await p.chromium.launch(executable_path="/usr/bin/chromium", headless=True,
                                        args=["--no-sandbox", "--use-gl=swiftshader"])
            print("\n── (b) taller privado (navegador) ──")
            ctx = await b.new_context(viewport={"width": 1440, "height": 900})
            ctx.set_default_timeout(90000); ctx.set_default_navigation_timeout(90000)
            await taller(ctx, api)
            print("\n── catálogo vivo visto desde la web clásica ──")
            await clasica_ve_el_vivo(ctx)
            print("\n── (a) web clásica · escritorio 1440x900 ──")
            await clasica(ctx, "escritorio")
            await ctx.close()
            print("\n── (d) web clásica · móvil 390x844 ──")
            ctxm = await b.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
            ctxm.set_default_timeout(90000); ctxm.set_default_navigation_timeout(90000)
            await clasica(ctxm, "móvil")
            await ctxm.close()
            await b.close()
        print("\n── limpieza ──")
        await limpiar(api, base_cat)
        await api.dispose()

    ok = sum(1 for r in RES if r[0])
    print(f"\n══ RESULTADO: {ok}/{len(RES)} ══")
    for r in RES:
        if not r[0]:
            print("  FALLO →", r[1])
    sys.exit(0 if ok == len(RES) else 1)


asyncio.run(main())
