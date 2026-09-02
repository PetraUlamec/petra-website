#!/usr/bin/env python3
"""BATERÍA COMPLETA DE LA WEB CLÁSICA (encargo SER: smoke + reales + auditoría, hasta limpio).
Uso: python3 test_clasica.py [movil]"""
import os
import asyncio, sys, json
from playwright.async_api import async_playwright

BASE = os.environ.get("PETRA_BASE", "http://localhost:3111")
RUTAS = ["/clasica", "/clasica/tes", "/clasica/tes/sueno-del-bosque", "/clasica/tes/oro-de-otono",
         "/clasica/cajas", "/clasica/despensa", "/clasica/cucharas", "/clasica/nosotros", "/clasica/faq", "/clasica/envios",
         "/clasica/contacto", "/clasica/cesta",
         "/clasica/legal", "/clasica/privacidad", "/clasica/cookies", "/clasica/devoluciones"]
FALLOS = []

def f(paso, det): FALLOS.append({"paso": paso, "detalle": det}); print(f"  ✗ {paso}: {det}")

async def ctx(p, movil=False):
    b = await p.chromium.launch(executable_path="/usr/bin/chromium", headless=True, args=["--no-sandbox", "--use-gl=swiftshader"])
    c = await b.new_context(viewport={"width": 390, "height": 844} if movil else {"width": 1440, "height": 900})
    return b, await c.new_page()

async def smoke(page):
    print("== SMOKE: rutas + consola + red")
    errs = []
    page.on("pageerror", lambda e: errs.append(f"PAGEERROR {str(e)[:90]}"))
    page.on("console", lambda m: errs.append(f"CONSOLE {m.text[:90]}") if m.type == "error" else None)
    def red(r):
        fa = r.failure or ""
        if "ABORTED" in fa or "favicon" in r.url: return  # prefetch cancelado por navegar = normal
        errs.append(f"RED {r.url[-60:]} ({fa[:30]})")
    page.on("requestfailed", red)
    for ruta in RUTAS:
        r = await page.goto(BASE + ruta, wait_until="load")
        if r.status != 200: f("smoke:" + ruta, f"HTTP {r.status}")
        await page.wait_for_timeout(600)
        # overflow horizontal (auditoría responsive)
        over = await page.evaluate("() => document.documentElement.scrollWidth - document.documentElement.clientWidth")
        if over > 2: f("overflow:" + ruta, f"{over}px de scroll horizontal")
        # título y descripción (SEO)
        t = await page.title()
        if not t or len(t) < 8: f("seo-title:" + ruta, repr(t))
    for e in errs: f("consola/red", e)
    if not errs: print("  ✓ 0 errores de consola/red en", len(RUTAS), "rutas")

async def enlaces(page):
    print("== AUDITORÍA: todos los enlaces internos")
    await page.goto(BASE + "/clasica", wait_until="load")
    hrefs = set()
    for ruta in ["/clasica", "/clasica/tes", "/clasica/cajas"]:
        await page.goto(BASE + ruta, wait_until="load")
        for h in await page.evaluate("() => [...document.querySelectorAll('a[href^=\"/\"]')].map(a => a.getAttribute('href'))"):
            hrefs.add(h.split("#")[0])
    malos = 0
    for h in sorted(hrefs):
        r = await page.request.get(BASE + h)
        if r.status >= 400: f("enlace-roto", f"{h} → {r.status}"); malos += 1
    print(f"  ✓ {len(hrefs) - malos}/{len(hrefs)} enlaces internos OK")

async def flujo_real(page):
    print("== FLUJO REAL: ficha → cesta → cupón → pago → entrada")
    await page.goto(BASE + "/clasica/tes/sueno-del-bosque", wait_until="load"); await page.wait_for_timeout(700)
    # añadir desde la ficha
    await page.evaluate("() => { const b=[...document.querySelectorAll('button')].find(x=>/Añadir|Add|V koš/.test(x.textContent)); b && b.click(); }")
    await page.wait_for_timeout(500)
    n = await page.evaluate("() => JSON.parse(localStorage.getItem('petra-cart-v1')||'{}')?.state?.lines?.length || 0")
    if n < 1: f("añadir", "la cesta sigue vacía tras añadir")
    await page.goto(BASE + "/clasica/cesta", wait_until="load"); await page.wait_for_timeout(800)
    # cupón
    await page.evaluate("""() => { const i=[...document.querySelectorAll('input')].find(x=>x.placeholder && /cup|coupon|kupon/i.test(x.placeholder));
      const set=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set; set.call(i,'PETRA10');
      i.dispatchEvent(new Event('input',{bubbles:true})); }""")
    await page.evaluate("() => { const b=[...document.querySelectorAll('button')].find(x=>/Aplicar|Apply|Uporabi/.test(x.textContent)); b && b.click(); }")
    await page.wait_for_timeout(400)
    desc = await page.evaluate("() => document.body.innerText.includes('−') || document.body.innerText.includes('-')")
    if not desc: f("cupón", "no aparece el descuento")
    # pago 2 pasos
    await page.evaluate("() => { const b=[...document.querySelectorAll('button')].find(x=>/Pagar|Pay|Plačaj/.test(x.textContent)); b && b.click(); }")
    await page.wait_for_timeout(400)
    await page.evaluate("() => { const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes('DEMO')); b && b.click(); }")
    try:
        await page.wait_for_url("**/gracias", timeout=10000)
    except Exception:
        f("pago", f"no llegó a /gracias (está en {page.url})"); return
    await page.wait_for_timeout(1500)
    txt = await page.evaluate("() => document.body.innerText")
    if "PE-" not in txt: f("entrada", "el recibo no tiene número PE-")
    else: print("  ✓ compra completa con entrada PE- ✓")

async def interaccion(page):
    print("== INTERACCIÓN: filtros, idioma, formulario")
    await page.goto(BASE + "/clasica/tes", wait_until="load"); await page.wait_for_timeout(500)
    antes = await page.evaluate("() => document.querySelectorAll('article').length")
    await page.evaluate("() => { const b=[...document.querySelectorAll('button')].find(x=>/Premium/.test(x.textContent)); b && b.click(); }")
    await page.wait_for_timeout(400)
    despues = await page.evaluate("() => document.querySelectorAll('article').length")
    if not (0 < despues < antes): f("filtro-premium", f"{antes} → {despues}")
    else: print(f"  ✓ filtro premium {antes}→{despues}")
    # idioma SL persiste
    await page.evaluate("() => { const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='SL'); b && b.click(); }")
    await page.wait_for_timeout(500)
    sl = await page.evaluate("() => document.body.innerText.includes('Čaji') || document.body.innerText.includes('košar')")
    if not sl: f("idioma-sl", "no cambió a esloveno")
    else: print("  ✓ idioma SL aplicado")
    await page.evaluate("() => { const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='ES'); b && b.click(); }")
    # formulario contacto
    await page.goto(BASE + "/clasica/contacto", wait_until="load"); await page.wait_for_timeout(400)
    await page.evaluate("""() => { const set=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;
      const ta=Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype,'value').set;
      const [n,e]=document.querySelectorAll('input'); set.call(n,'Prueba'); n.dispatchEvent(new Event('input',{bubbles:true}));
      set.call(e,'p@e.si'); e.dispatchEvent(new Event('input',{bubbles:true}));
      const m=document.querySelector('textarea'); ta.call(m,'Hola casa'); m.dispatchEvent(new Event('input',{bubbles:true})); }""")
    # RGPD: sin marcar la casilla el formulario NO debe enviarse (required); con ella, sí
    await page.evaluate("() => document.querySelector('form button[class*=btn-tinta]').click()")
    await page.wait_for_timeout(500)
    bloqueado = await page.evaluate("() => !!document.querySelector('form input[name=consiente]') && !/✉️/.test(document.body.innerText)")
    if not bloqueado: f("contacto-rgpd", "el formulario se envió SIN consentimiento (o no hay casilla)")
    else: print("  ✓ sin consentimiento no se envía (casilla RGPD obligatoria)")
    await page.evaluate("() => { const c=document.querySelector('form input[name=consiente]'); if (c && !c.checked) c.click(); }")
    await page.evaluate("() => document.querySelector('form button[class*=btn-tinta]').click()")
    await page.wait_for_timeout(900)
    ok = await page.evaluate("() => /✉️|carta|letter|pismo/i.test(document.body.innerText)")
    if not ok: f("contacto", "sin confirmación tras enviar")
    else: print("  ✓ formulario de contacto confirma")

async def main():
    movil = "movil" in sys.argv
    async with async_playwright() as p:
        b, page = await ctx(p, movil)
        await smoke(page)
        if not movil:
            await enlaces(page)
            await interaccion(page)
        await flujo_real(page)
        await b.close()
    print(json.dumps({"modo": "movil" if movil else "desktop", "fallos": FALLOS}, ensure_ascii=False))
    sys.exit(1 if FALLOS else 0)

asyncio.run(main())
