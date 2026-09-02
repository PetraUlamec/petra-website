#!/usr/bin/env python3
"""BATERÍA DE INTERACCIÓN de la tienda de Petra & Erik (C2).

Ejercita lo que haría un cliente real, en escritorio Y móvil, y reporta un JSON accionable.

    python3 scripts/interaccion.py            # desktop 1440x900 + móvil 390x844
    python3 scripts/interaccion.py desktop    # solo escritorio
    python3 scripts/interaccion.py movil      # solo móvil

Requiere el servidor en :3111. No construye nada, no toca el servidor.

Cómo pincha objetos 3D (sin hardcodear nada de la escena):
  · los objetos clicables se descubren solos por `obj.__r3f.handlers.onClick` (R3F v9),
  · se proyectan con la OrthographicCamera REAL de la escena (window.__camera no vale),
  · el clic se dispara con pointermove/down/up/click sobre document.elementFromPoint.
Los paneles 2D se localizan por ESTRUCTURA (aside.panel > button.btn-miel…), no por texto,
para que el idioma auto-detectado (EN/ES/SL) sea indiferente; los textos que sí se comprueban
se leen en caliente de src/i18n/*.ts, no van copiados aquí.
"""
import asyncio, json, os, re, sys, unicodedata
from playwright.async_api import async_playwright

BASE = os.environ.get("PETRA_BASE", "http://localhost:3111")
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ESPERA_ESCENA = 3200      # la escena three tarda en montar
ESPERA_ANIM = 1600        # animaciones de panel/plantas
ESPERA_CAM = 1100         # la cámara al enfocar

# ─────────────────────────── i18n leído del código (no copiado) ───────────────────────────

def _i18n(fichero):
    """Extrae 'clave: "valor"' del diccionario; suficiente para las claves únicas que uso."""
    try:
        txt = open(os.path.join(RAIZ, "src/i18n", fichero), encoding="utf-8").read()
    except OSError:
        return {}
    return {m.group(1): m.group(2) for m in re.finditer(r'(\w+):\s*"((?:[^"\\]|\\.)*)"', txt)}

I18N = [_i18n("en.ts"), _i18n("es.ts"), _i18n("sl.ts")]

def textos(clave):
    """Todas las variantes de idioma de una clave (para buscar sin saber el idioma activo)."""
    return [d[clave] for d in I18N if d.get(clave)]

def norm(s):
    s = unicodedata.normalize("NFD", (s or "").lower())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")

# ─────────────────────────── reporte ───────────────────────────

R = {"fallos": [], "observaciones": [], "consola": {}}
_ctx = {"sala": "-", "modo": "desktop"}

def paso(n, txt):
    print(f"[{_ctx['modo']}] {n:<7} {txt}", flush=True)

def ok(n, txt):
    paso(n, f"OK    · {txt}")

def fallo(n, detalle, esperado="", visto=""):
    R["fallos"].append({"paso": n, "modo": _ctx["modo"], "sala": _ctx["sala"],
                        "detalle": detalle, "esperado": esperado, "visto": visto})
    paso(n, f"FALLO · {detalle}" + (f" | esperaba: {esperado} | vi: {visto}" if esperado or visto else ""))

def obs(n, detalle):
    R["observaciones"].append({"paso": n, "modo": _ctx["modo"], "sala": _ctx["sala"], "detalle": detalle})
    paso(n, f"obs   · {detalle}")

# ─────────────────────────── utillería de navegador ───────────────────────────

PRELUDIO = r"""
window.__pt = {
  esc(){ return window.__scene || null; },
  cam(){ const s=this.esc(); if(!s) return null; let c=null; s.traverse(o=>{ if(!c && o.isOrthographicCamera) c=o; }); return c; },
  jarDe(o){ let p=o; while(p){ if(p.name && p.name.indexOf('jar-')===0) return p.name; p=p.parent; } return null; },
  pantalla(o, lift){
    const c=this.cam(); if(!c) return null;
    c.updateMatrixWorld(true); c.matrixWorldInverse.copy(c.matrixWorld).invert();
    const V=o.position.clone(); o.getWorldPosition(V); V.y += (lift||0);
    const w=[+V.x.toFixed(2), +V.y.toFixed(2), +V.z.toFixed(2)];
    V.project(c);
    return { x:(V.x*0.5+0.5)*innerWidth, y:(-V.y*0.5+0.5)*innerHeight, w:w };
  },
  /* descubre TODOS los objetos con handler de clic de react-three-fiber */
  scan(lift){
    const s=this.esc(); if(!s) return {err:'sin escena (window.__scene)'};
    this.items=[]; const out=[];
    s.traverse(o=>{
      const r=o.__r3f; if(!r) return;
      const h=r.handlers || (r.instance && r.instance.handlers); if(!h || !h.onClick) return;
      const p=this.pantalla(o, lift===undefined?0:lift);
      const i=this.items.length; this.items.push(o);
      out.push({ i:i, uuid:o.uuid, tipo:o.type, jar:this.jarDe(o),
                 x:p?Math.round(p.x):null, y:p?Math.round(p.y):null, w:p?p.w:null,
                 nuevo: this.marcados ? !this.marcados.has(o.uuid) : false,
                 dentro: !!p && p.x>0 && p.y>0 && p.x<innerWidth && p.y<innerHeight });
    });
    return out;
  },
  marcar(){ const l=this.scan(0); this.marcados=new Set((l.map?l:[]).map(o=>o.uuid)); return this.marcados.size; },
  puntero(x, y){
    const el=document.elementFromPoint(x,y);
    const cv=document.querySelector('canvas');
    let t=el;
    if(!t) t=cv;
    else if(t!==cv && !/^(BUTTON|A|INPUT|TEXTAREA|SELECT|LABEL)$/.test(t.tagName) && !t.closest('button,a,input,textarea')) t=cv||t;
    if(!t) return {ok:false, motivo:'ni elemento ni canvas en '+Math.round(x)+','+Math.round(y)};
    const b={bubbles:true,cancelable:true,composed:true,clientX:x,clientY:y,
             pointerId:1,pointerType:'mouse',isPrimary:true,button:0,width:1,height:1};
    t.dispatchEvent(new PointerEvent('pointermove', Object.assign({buttons:0}, b)));
    t.dispatchEvent(new PointerEvent('pointerdown', Object.assign({buttons:1}, b)));
    t.dispatchEvent(new PointerEvent('pointerup',   Object.assign({buttons:0}, b)));
    t.dispatchEvent(new MouseEvent('click',         Object.assign({buttons:0}, b)));
    return {ok:true, sobre:(el?el.tagName:'-')+'→'+t.tagName};
  },
  clic(i, lift){
    const o=this.items && this.items[i]; if(!o) return {ok:false, motivo:'índice '+i+' fuera de rango'};
    const p=this.pantalla(o, lift||0); if(!p) return {ok:false, motivo:'sin cámara ortográfica en la escena'};
    if(!(p.x>0 && p.y>0 && p.x<innerWidth && p.y<innerHeight))
      return {ok:false, motivo:'fuera de pantalla ('+Math.round(p.x)+','+Math.round(p.y)+')'};
    const r=this.puntero(p.x, p.y);
    r.pos=[Math.round(p.x), Math.round(p.y)]; r.mundo=p.w;
    return r;
  },
  clicTexto(txts){
    const els=[...document.querySelectorAll('button,a')];
    for(const t of txts){
      const b=els.find(e=>e.offsetParent!==null && e.textContent && e.textContent.indexOf(t)>=0);
      if(b){ b.click(); return {ok:true, texto:t}; }
    }
    return {ok:false, motivo:'ningún botón visible con: '+txts.join(' | ')};
  },
  rellena(sel, valor){
    const el=document.querySelector(sel); if(!el) return {ok:false, motivo:'sin '+sel};
    const proto=Object.getPrototypeOf(el);
    const d=Object.getOwnPropertyDescriptor(proto,'value');
    d.set.call(el, valor);
    el.dispatchEvent(new Event('input',{bubbles:true}));
    el.dispatchEvent(new Event('change',{bubbles:true}));
    return {ok:true, valor:el.value};
  },
  cesta(){
    try{ const s=JSON.parse(localStorage.getItem('petra-cart-v1')||'{}');
         const l=(s.state&&s.state.lines)||[];
         return { n:l.reduce((a,x)=>a+x.qty,0), lineas:l, cupon:(s.state&&s.state.cupon)?s.state.cupon.codigo:null }; }
    catch(e){ return {n:-1, lineas:[], cupon:null, err:String(e)}; }
  },
  texto(){ return document.body.innerText; }
};
"""

async def abrir(p, viewport):
    nav = await p.chromium.launch(executable_path="/usr/bin/chromium", headless=True,
                                  args=["--no-sandbox", "--use-gl=swiftshader"])
    ctx = await nav.new_context(viewport=viewport)
    await ctx.add_init_script(PRELUDIO)
    page = await ctx.new_page()
    enganchar(page)
    return nav, page

def _saco(sala):
    return R["consola"].setdefault(f"{_ctx['modo']}:{sala}",
                                   {"console_error": [], "pageerror": [], "red": []})

def enganchar(page):
    def con(m):
        if m.type == "error":
            _saco(_ctx["sala"])["console_error"].append(m.text[:220])
    page.on("console", con)
    page.on("pageerror", lambda e: _saco(_ctx["sala"])["pageerror"].append(str(e)[:220]))
    page.on("requestfailed", lambda r: _saco(_ctx["sala"])["red"].append(
        f"FALLÓ {r.method} {r.url[-70:]} ({r.failure})"))

    async def resp(r):
        if r.status >= 400:
            _saco(_ctx["sala"])["red"].append(f"HTTP {r.status} {r.url[-70:]}")
    page.on("response", lambda r: asyncio.ensure_future(resp(r)))

async def ir(page, ruta, sala):
    _ctx["sala"] = sala
    await page.goto(BASE + ruta, wait_until="load")
    await page.wait_for_timeout(ESPERA_ESCENA)

async def reintenta(n, accion, recarga=None):
    """Ejecuta accion(); si devuelve None reintenta una vez (animaciones lentas)."""
    r = await accion()
    if r is None:
        paso(n, "…reintento (animación lenta)")
        if recarga:
            await recarga()
        r = await accion()
    return r

# ─────────────────────────── verificadores de DOM ───────────────────────────

PANEL_TE = """() => {
  const a=[...document.querySelectorAll('aside.panel')].find(x=>x.querySelector('h2') && x.querySelector('button.btn-miel'));
  if(!a) return null;
  const por=a.querySelector('.rounded-lg.border-2');
  return { titulo:(a.querySelector('h2').textContent||'').trim(),
           cuerpo:(a.innerText||'').trim(),
           porque: por ? (por.innerText||'').trim() : null,
           listas: a.querySelectorAll('ul li').length };
}"""

CESTA_HUD = """() => {
  const a=[...document.querySelectorAll('nav a')].find(x=>x.querySelector('span.rounded-full'));
  return a ? parseInt(a.querySelector('span.rounded-full').textContent.trim(),10) : 0;
}"""

TOTALES = """() => {
  const dl=document.querySelector('aside.panel dl'); if(!dl) return null;
  const filas=[...dl.querySelectorAll('div')].map(d=>({k:d.querySelector('dt')?d.querySelector('dt').textContent.trim():'',
                                                       v:d.querySelector('dd')?d.querySelector('dd').textContent.trim():''}));
  const num=s=>{const m=(s||'').replace(/[^0-9,.\\-]/g,'').replace(',','.'); const f=parseFloat(m); return isNaN(f)?null:f;};
  const u=filas[filas.length-1];
  return { filas, total: u?num(u.v):null, sub: filas[0]?num(filas[0].v):null,
           descuento: (filas.find(f=>f.v.indexOf('−')>=0)||{}).v || null };
}"""

async def anadir_desde_panel(page, n):
    """Clic en el botón 'añadir a la cesta' del panel abierto; devuelve (antes, después)."""
    antes = (await page.evaluate("()=>window.__pt.cesta()"))["n"]
    r = await page.evaluate("""() => { const a=[...document.querySelectorAll('aside.panel')]
        .find(x=>x.querySelector('button.btn-miel'));
        if(!a) return {ok:false,motivo:'sin panel con botón btn-miel'};
        a.querySelector('button.btn-miel').click(); return {ok:true}; }""")
    if not r["ok"]:
        fallo(n, "no encuentro el botón de añadir", "aside.panel > button.btn-miel", r["motivo"])
        return antes, antes
    await page.wait_for_timeout(900)
    despues = (await page.evaluate("()=>window.__pt.cesta()"))["n"]
    return antes, despues

# ─────────────────────────── PASOS ───────────────────────────

async def sala_tarros(page, ruta, sala, npaso, premium=False):
    """Pasos 1 y 2: abrir un tarro, tocar una planta, añadir a la cesta."""
    await ir(page, ruta, sala)
    tarros = await page.evaluate("()=>window.__pt.scan(0.2)")
    if isinstance(tarros, dict):
        fallo(f"{npaso}.1", "la escena no expone window.__scene", "objeto three", tarros.get("err"))
        return
    tarros = [t for t in tarros if t["jar"] and t["dentro"]]
    if not tarros:
        fallo(f"{npaso}.1", "ningún tarro clicable visible", "grupos name=jar-* proyectables", "0")
        return
    cx, cy = page.viewport_size["width"] / 2, page.viewport_size["height"] / 2
    tarros.sort(key=lambda t: (t["x"] - cx) ** 2 + (t["y"] - cy) ** 2)
    paso(f"{npaso}.1", f"{len(tarros)} tarros clicables en pantalla; pruebo por cercanía al centro")

    abierto = None
    for t in tarros[:4]:
        r = await page.evaluate("([i,l])=>window.__pt.clic(i,l)", [t["i"], 0.2])
        await page.wait_for_timeout(ESPERA_CAM)
        panel = await page.evaluate(PANEL_TE)
        if panel:
            abierto = (t, panel)
            break
        paso(f"{npaso}.1", f"…{t['jar']} en ({t['x']},{t['y']}) no abrió ({r.get('motivo') or r.get('sobre')}), sigo")
    if not abierto:
        fallo(f"{npaso}.1", "clicar un tarro no abre su panel",
              "aside.panel con h2 + botón añadir",
              f"probados {[t['jar'] for t in tarros[:4]]} sin panel")
        return
    t, panel = abierto
    esperado = t["jar"][4:]
    if norm(panel["titulo"]) != norm(esperado):
        obs(f"{npaso}.1", f"el panel abrió '{panel['titulo']}' al clicar {t['jar']} (id≠título; puede ser un tarro vecino)")
    ok(f"{npaso}.1", f"tarro {t['jar']} abierto → panel «{panel['titulo']}»")

    # 2) plantas: son los clicables NUEVOS que aparecen con el tarro enfocado
    await page.evaluate("()=>window.__pt.marcar()")   # marca el estado con el tarro ya abierto
    todo = await page.evaluate("()=>window.__pt.scan(0.1)")
    plantas = [o for o in todo if o["dentro"] and not o["jar"]]
    # las plantas brotan alrededor del tarro enfocado: las más cercanas a él en pantalla
    plantas.sort(key=lambda o: (o["x"] - t["x"]) ** 2 + (o["y"] - t["y"]) ** 2)
    cand = [o for o in plantas if abs(o["x"] - t["x"]) < 420 and abs(o["y"] - t["y"]) < 420][:5]
    tocada = None
    for c in cand:
        await page.evaluate("([i,l])=>window.__pt.clic(i,l)", [c["i"], 0.1])
        await page.wait_for_timeout(700)
        p2 = await page.evaluate(PANEL_TE)
        if p2 and p2["porque"] and len(p2["porque"]) > 25:
            tocada = (c, p2)
            break
    if tocada:
        c, p2 = tocada
        ok(f"{npaso}.2", "planta tocada → aparece el porqué: «" + p2["porque"].replace("\n", " · ")[:90] + "…»")
    else:
        fallo(f"{npaso}.2", "tocar una planta no muestra el porqué en el panel",
              "bloque .rounded-lg.border-2 con texto",
              f"{len(cand)} candidatas cerca del tarro, ninguna respondió")

    # premium: la nota de la cuchara sorpresa
    if premium:
        panel_ahora = await page.evaluate(PANEL_TE)
        cuerpo = (panel_ahora or {}).get("cuerpo", "")
        marcas = ["🥄"] + textos("sorpresa")
        if any(m and m[:40] in cuerpo for m in marcas):
            ok(f"{npaso}.3", "el panel premium lleva la nota de cuchara sorpresa (🥄)")
        else:
            fallo(f"{npaso}.3", "el panel premium no muestra la cuchara sorpresa",
                  "🥄 o sala.sorpresa de i18n", cuerpo[:120].replace("\n", " / "))

    # 3) añadir a la cesta
    antes, despues = await anadir_desde_panel(page, f"{npaso}.4")
    badge = await page.evaluate(CESTA_HUD)
    if despues == antes + 1:
        ok(f"{npaso}.4", f"añadido a la cesta: {antes} → {despues} (badge del HUD: {badge})")
        if badge != despues:
            obs(f"{npaso}.4", f"el badge del HUD marca {badge} y la cesta tiene {despues}")
    else:
        fallo(f"{npaso}.4", "añadir a la cesta no incrementa el carrito",
              f"lines={antes+1}", f"lines={despues}")

async def paso_salon(page):
    await ir(page, "/salon", "/salon")
    todos = await page.evaluate("()=>window.__pt.scan(0)")
    if isinstance(todos, dict):
        fallo("3.1", "la escena del salón no expone window.__scene", "objeto three", todos.get("err"))
        return
    # las cajas están SOBRE la mesa: elevadas y lejos de las paredes (las puertas van pegadas al muro)
    cajas = [o for o in todos if o["dentro"] and o["w"] and o["w"][1] > 0.9
             and abs(o["w"][0]) < 3.5 and abs(o["w"][2]) < 3.5]
    cajas.sort(key=lambda o: -o["w"][1])
    paso("3.1", f"{len(cajas)} candidatos a caja sobre la mesa (de {len(todos)} clicables en la sala)")
    abierta = None
    for c in cajas[:6]:
        await page.evaluate("([i,l])=>window.__pt.clic(i,l)", [c["i"], 0])
        await page.wait_for_timeout(ESPERA_ANIM)
        if "/salon" not in page.url:      # he tocado una puerta: vuelvo
            obs("3.1", f"el candidato en {c['w']} era una puerta ({page.url}); vuelvo al salón")
            await ir(page, "/salon", "/salon")
            continue
        p = await page.evaluate("""() => {
            const a=[...document.querySelectorAll('aside.panel')].find(x=>x.querySelector('h3') && x.querySelector('ul li'));
            return a ? { titulo:a.querySelector('h2')?a.querySelector('h2').textContent.trim():'',
                         items:[...a.querySelectorAll('ul li')].map(li=>li.innerText.trim().slice(0,80)),
                         cuerpo:a.innerText } : null; }""")
        if p:
            abierta = (c, p)
            break
    if not abierta:
        fallo("3.1", "clicar una caja de temporada no abre su panel",
              "aside.panel con h3 (Contiene) + ul", f"{len(cajas[:6])} candidatos probados sin panel")
        return
    c, p = abierta
    ok("3.1", f"caja abierta → «{p['titulo']}» con {len(p['items'])} líneas de contenido")
    proc = [i for i in p["items"] if "\n" in i]     # extra + su procedencia en 2ª línea
    if proc:
        ok("3.2", f"procedencias visibles ({len(proc)} de {len(p['items'])}): «{proc[0].replace(chr(10),' — ')[:80]}…»")
    else:
        obs("3.2", "la caja no muestra procedencias en 2ª línea (solo contenido genérico): "
                   + " | ".join(p["items"])[:120])
    antes, despues = await anadir_desde_panel(page, "3.3")
    if despues == antes + 1:
        cesta = await page.evaluate("()=>window.__pt.cesta()")
        kinds = [l["kind"] for l in cesta["lineas"]]
        ok("3.3", f"caja añadida: {antes} → {despues} (líneas: {kinds})")
        if "caja" not in kinds:
            fallo("3.3", "lo añadido no es de tipo 'caja'", "kind=caja en localStorage", str(kinds))
    else:
        fallo("3.3", "añadir la caja no incrementa el carrito", f"lines={antes+1}", f"lines={despues}")

async def paso_nosotros(page):
    await ir(page, "/nosotros", "/nosotros")
    cuerpo = await page.evaluate("()=>window.__pt.texto()")
    for quien in ("petra", "erik"):
        vs = textos(quien)
        if any(v[:45] in cuerpo for v in vs):
            ok("4.1", f"texto de {quien.capitalize()} presente")
        else:
            fallo("4.1", f"no aparece el texto de {quien}", f"i18n nosotros.{quien}", "no encontrado en el body")
    # el cucharero SÍ es interactivo (SpoonRack → useUi.setExtra) ⇒ si no responde, es fallo
    todos = await page.evaluate("()=>window.__pt.scan(0)")
    pared = [o for o in todos if o["dentro"] and o["w"] and o["w"][0] < -4.0 and o["w"][1] > 1.3]
    paso("4.2", f"{len(pared)} clicables en la pared oeste (el cucharero de Erik)")
    tocada = None
    for c in pared[:6]:
        for lift in (-0.45, -0.2, 0.0):
            await page.evaluate("([i,l])=>window.__pt.clic(i,l)", [c["i"], lift])
            await page.wait_for_timeout(600)
            p = await page.evaluate("""() => {
                const a=[...document.querySelectorAll('aside.panel')].find(x=>x.querySelector('h2')&&x.querySelector('p.uppercase'));
                return a ? {titulo:a.querySelector('h2').textContent.trim(), texto:a.innerText.slice(0,200)} : null; }""")
            if p:
                tocada = (c, lift, p)
                break
        if tocada:
            break
    if tocada:
        c, lift, p = tocada
        ok("4.2", f"cuchara tocada (mundo {c['w']}, lift {lift}) → panel «{p['titulo']}» con su historia")
    elif pared:
        fallo("4.2", "las cucharas del cucharero no abren su panel de procedencia",
              "aside.panel con h2 + p.uppercase (ExtraPanel)",
              f"{len(pared[:6])} clicables de la pared probados con 3 alturas")
    else:
        obs("4.2", "no hay clicables en la pared oeste: el cucharero no llegó a montarse en esta carga")

async def paso_contacto(page):
    await ir(page, "/contacto", "/contacto")
    campos = await page.evaluate("""() => {
        const f=document.querySelector('form.panel'); if(!f) return null;
        return { inputs:f.querySelectorAll('input').length, areas:f.querySelectorAll('textarea').length,
                 submit:!!f.querySelector('button[type=submit]') }; }""")
    if not campos or not campos["submit"]:
        fallo("5.1", "no encuentro el formulario de contacto", "form.panel con button[type=submit]", str(campos))
        return
    paso("5.1", f"formulario: {campos['inputs']} inputs + {campos['areas']} textarea")
    await page.evaluate("()=>window.__pt.rellena('form.panel input:nth-of-type(1)','Cliente de prueba')")
    await page.evaluate("""() => { const i=document.querySelectorAll('form.panel input');
        const p=Object.getPrototypeOf(i[0]); const d=Object.getOwnPropertyDescriptor(p,'value');
        d.set.call(i[0],'Cliente de prueba'); i[0].dispatchEvent(new Event('input',{bubbles:true}));
        if(i[1]){ d.set.call(i[1],'cliente@ejemplo.com'); i[1].dispatchEvent(new Event('input',{bubbles:true})); }
        const t=document.querySelector('form.panel textarea');
        if(t){ const pt=Object.getPrototypeOf(t); const dt=Object.getOwnPropertyDescriptor(pt,'value');
               dt.set.call(t,'Hola Petra, ¿enviáis a Eslovenia? Gracias.'); t.dispatchEvent(new Event('input',{bubbles:true})); } }""")
    valores = await page.evaluate("""() => ({ i:[...document.querySelectorAll('form.panel input')].map(x=>x.value),
                                              t:document.querySelector('form.panel textarea')?document.querySelector('form.panel textarea').value:'' })""")
    paso("5.2", f"campos rellenados: {valores['i']} / «{valores['t'][:30]}…»")
    if any(not v for v in valores["i"]) or not valores["t"]:
        fallo("5.2", "algún campo no acepta texto (setter nativo + evento input)",
              "los 3 campos con valor", str(valores))
        return
    await page.evaluate("()=>document.querySelector('form.panel button[type=submit]').click()")
    await page.wait_for_timeout(1200)
    r = await page.evaluate("""() => { const f=document.querySelector('form.panel');
        return { restan:f.querySelectorAll('input,textarea').length, texto:f.innerText.trim() }; }""")
    enviado = textos("enviado")
    if r["restan"] == 0 and r["texto"]:
        if any(e[:35] in r["texto"] for e in enviado):
            ok("5.3", f"enviado → «{r['texto'][:80]}»")
        else:
            obs("5.3", f"el formulario responde, pero el texto no cuadra con i18n contacto.enviado: «{r['texto'][:80]}»")
    else:
        fallo("5.3", "enviar el formulario no muestra confirmación",
              "el form se sustituye por el mensaje de recibido",
              f"quedan {r['restan']} campos, texto: {r['texto'][:80]}")

async def paso_carrito(page, movil=False):
    await ir(page, "/carrito", "/carrito")
    cesta = await page.evaluate("()=>window.__pt.cesta()")
    if cesta["n"] == 0:
        fallo("6.0", "llego al carrito y está vacío tras añadir en las salas",
              "las líneas añadidas en los pasos anteriores", "lines=[]")
        return False
    paso("6.0", f"carrito con {cesta['n']} artículos: {[l['id'] for l in cesta['lineas']]}")
    t0 = await page.evaluate(TOTALES)
    if not t0:
        fallo("6.1", "no encuentro el bloque de totales", "aside.panel dl", "null")
        return False
    paso("6.1", f"total inicial {t0['total']} € (subtotal {t0['sub']} €)")

    async def cupon(codigo):
        r = await page.evaluate("""(c) => { const f=document.querySelector('aside.panel form');
            if(!f) return {ok:false,motivo:'sin formulario de cupón (¿ya hay uno aplicado?)'};
            const i=f.querySelector('input'); const p=Object.getPrototypeOf(i);
            const d=Object.getOwnPropertyDescriptor(p,'value'); d.set.call(i,c);
            i.dispatchEvent(new Event('input',{bubbles:true}));
            f.querySelector('button[type=submit]').click(); return {ok:true}; }""", codigo)
        await page.wait_for_timeout(900)
        return r

    # PETRA10 → el total debe bajar
    r = await cupon("PETRA10")
    if not r["ok"]:
        fallo("6.2", "no hay campo de cupón", "aside.panel form > input + submit", r["motivo"])
    else:
        t1 = await page.evaluate(TOTALES)
        est = await page.evaluate("()=>window.__pt.cesta()")
        if t1["total"] is not None and t0["total"] is not None and t1["total"] < t0["total"]:
            ok("6.2", f"cupón PETRA10 aplicado: {t0['total']} € → {t1['total']} € (descuento {t1['descuento']}, guardado: {est['cupon']})")
        else:
            fallo("6.2", "el cupón PETRA10 no baja el total", f"total < {t0['total']}", f"total = {t1['total']}")

        # quitar el cupón → el total vuelve
        q = await page.evaluate("""() => { const b=[...document.querySelectorAll('aside.panel button.underline')][0];
            if(!b) return {ok:false,motivo:'sin botón de quitar cupón'}; b.click(); return {ok:true}; }""")
        await page.wait_for_timeout(800)
        if q["ok"]:
            t2 = await page.evaluate(TOTALES)
            if t2["total"] == t0["total"]:
                ok("6.3", f"cupón retirado: total vuelve a {t2['total']} €")
            else:
                fallo("6.3", "quitar el cupón no restaura el total", f"{t0['total']} €", f"{t2['total']} €")
        else:
            obs("6.3", "no encuentro el botón de quitar cupón: " + q["motivo"])

    # BIENVENIDA: no existe en src/data/coupons.ts ⇒ debe rechazarse con aviso
    r = await cupon("BIENVENIDA")
    if r["ok"]:
        aviso = await page.evaluate("""() => { const p=document.querySelector('aside.panel p.text-\\\\[var\\\\(--granate\\\\)\\\\]');
            return p?p.textContent.trim():null; }""")
        if aviso is None:
            aviso = await page.evaluate("""() => { const t=document.querySelector('aside.panel').innerText; return t; }""")
        invalido = textos("cuponInvalido")
        t3 = await page.evaluate(TOTALES)
        if any(i[:25] in (aviso or "") for i in invalido):
            ok("6.4", f"BIENVENIDA rechazado con aviso: «{(aviso or '')[:70]}»")
        elif t3["total"] == t0["total"]:
            obs("6.4", "BIENVENIDA no descuenta (no existe en coupons.ts: hay PETRA10, ERIK5, TEPREMIUM15) "
                       "pero no vi el aviso de cupón inválido")
        else:
            fallo("6.4", "el cupón inexistente BIENVENIDA altera el total",
                  f"total intacto {t0['total']} €", f"{t3['total']} €")

    await cupon("PETRA10")   # dejamos el descuento puesto para el recibo
    total_final = (await page.evaluate(TOTALES))["total"]

    # PAGO: 2 pasos (botón de tarjeta → modal DEMO → confirmar)
    pagar = await page.evaluate("""() => { const a=[...document.querySelectorAll('aside.panel')].pop();
        const bs=[...a.querySelectorAll('button.btn-miel')]; const b=bs[bs.length-1];
        if(!b) return {ok:false,motivo:'sin botón de pago'}; b.click(); return {ok:true, texto:b.textContent.trim()}; }""")
    await page.wait_for_timeout(900)
    if not pagar["ok"]:
        fallo("6.5", "no encuentro el botón de pagar con tarjeta", "aside.panel button.btn-miel", pagar["motivo"])
        return False
    modal = await page.evaluate("""() => { const d=document.querySelector('[role=dialog]');
        return d ? { texto:d.innerText.slice(0,160),
                     botones:[...d.querySelectorAll('button')].map(b=>b.textContent.trim()) } : null; }""")
    if not modal:
        fallo("6.5", "el botón de pago no abre el diálogo DEMO", "[role=dialog]", "no apareció")
        return False
    if "DEMO" not in modal["texto"]:
        obs("6.5", f"el diálogo de pago no rotula DEMO: «{modal['texto'][:60]}»")
    ok("6.5", f"paso 1 de pago «{pagar['texto']}» → diálogo con botones {modal['botones']}")

    try:
        await page.evaluate("""() => { const d=document.querySelector('[role=dialog]');
            d.querySelector('button.btn-miel').click(); }""")
    except Exception:
        pass    # la navegación puede destruir el contexto: buena señal
    try:
        await page.wait_for_url("**/gracias**", timeout=15000)
    except Exception:
        pass
    await page.wait_for_timeout(2500)
    _ctx["sala"] = "/gracias"
    if "/gracias" not in page.url:
        fallo("6.6", "confirmar el pago demo no lleva al recibo", "/gracias", page.url)
        return False
    txt = await page.evaluate("()=>window.__pt.texto()")
    entrada = re.search(r"PE-\d{4}", txt)
    cuchara_t = textos("cucharaTitulo")
    tiene_cuchara = "🥄" in txt or any(c[:12] in txt for c in cuchara_t)
    if entrada:
        ok("6.6", f"recibo en /gracias con entrada {entrada.group(0)} (total pagado {total_final} €)")
    else:
        fallo("6.6", "el recibo no muestra el número de entrada", "PE-####", txt[:120].replace("\n", " / "))
    if tiene_cuchara:
        linea = [l for l in txt.split("\n") if "🥄" in l or any(c[:12] in l for c in cuchara_t)]
        ok("6.7", f"sección de cuchara sorpresa presente: «{(linea or ['-'])[0][:70]}»")
    else:
        fallo("6.7", "el recibo no trae la sección de la cuchara sorpresa",
              "🥄 / gracias.cucharaTitulo", txt[:150].replace("\n", " / "))
    return True

# ─────────────────────────── ronda completa ───────────────────────────

async def ronda(p, modo, viewport, completa=True):
    _ctx["modo"] = modo
    print(f"\n{'='*78}\n  RONDA {modo.upper()}  {viewport['width']}x{viewport['height']}\n{'='*78}", flush=True)
    nav, page = await abrir(p, viewport)
    try:
        await sala_tarros(page, "/te", "/te", 1, premium=False)
        if completa:
            await sala_tarros(page, "/te-premium", "/te-premium", 2, premium=True)
            await paso_salon(page)
            await paso_nosotros(page)
            await paso_contacto(page)
        else:
            await sala_tarros(page, "/te-premium", "/te-premium", 2, premium=True)
        await paso_carrito(page, movil=(modo == "movil"))
    finally:
        await nav.close()

async def main(que):
    async with async_playwright() as p:
        if que in ("todo", "desktop"):
            await ronda(p, "desktop", {"width": 1440, "height": 900}, completa=True)
        if que in ("todo", "movil"):
            await ronda(p, "movil", {"width": 390, "height": 844}, completa=False)

    # ── resumen ──
    print(f"\n{'='*78}\n  RESUMEN\n{'='*78}", flush=True)
    ruido = 0
    for sala, s in R["consola"].items():
        if s["pageerror"]:
            for e in s["pageerror"]:
                R["fallos"].append({"paso": "8", "modo": sala.split(":")[0], "sala": sala.split(":")[1],
                                    "detalle": "excepción de página (pageerror)", "esperado": "sin excepciones", "visto": e})
        for e in s["red"]:
            if " 404 " in e or "HTTP 5" in e or "FALLÓ" in e:
                R["observaciones"].append({"paso": "8", "modo": sala.split(":")[0], "sala": sala.split(":")[1],
                                           "detalle": "petición con problema: " + e})
        n = len(s["console_error"]) + len(s["pageerror"]) + len(s["red"])
        ruido += n
        if n:
            print(f"  {sala}: {len(s['console_error'])} console.error · {len(s['pageerror'])} pageerror · {len(s['red'])} red", flush=True)
            for e in (s["console_error"] + s["pageerror"] + s["red"])[:4]:
                print(f"      - {e}", flush=True)
    if not ruido:
        print("  consola y red: limpias en todas las salas", flush=True)
    print(f"\n  FALLOS: {len(R['fallos'])} · OBSERVACIONES: {len(R['observaciones'])}\n", flush=True)
    print(json.dumps({"fallos": R["fallos"], "observaciones": R["observaciones"], "consola": R["consola"]},
                     ensure_ascii=False, indent=1), flush=True)
    return 1 if R["fallos"] else 0

sys.exit(asyncio.run(main(sys.argv[1] if len(sys.argv) > 1 else "todo")))
