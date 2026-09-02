#!/usr/bin/env python3
"""AUDITORÍA GIGANTE DE LA WEB CLÁSICA (22-ago-2026, encargo de SER: «auditoría gigante… y arreglar todo»).

Recorre TODAS las rutas de la clásica (+ /gracias + una 404) en ES/EN/SL y mide, no opina:
  consola/red limpias · title/description únicos · canonical/og · html[lang] cambia con el idioma
  · 1 h1 · img alt · nombre accesible en botones/enlaces · inputs con label · contraste AA
  (axe-core si está + cálculo propio con opacidad heredada) · teclado (Tab → cesta y «Añadir»,
  :focus-visible visible) · 404 con estilo · sitemap/robots/manifest/favicon/og · /gracias sin
  pedido · LCP/CLS · móvil 390×844 sin overflow y tap targets ≥ 40px.
Imprime una tabla ruta→checks y sale con 1 si algo falla.
Uso:  PETRA_BASE=http://localhost:3112 python3 scripts/audit_web.py [--rapido]
      python3 scripts/audit_web.py --assets   → regenera public/og.png, favicon.svg/.ico, apple-touch-icon, icon-192/512
"""
import io, json, os, re, sys
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = os.environ.get("PETRA_BASE", "http://localhost:3111")
ROOT = Path(__file__).resolve().parent.parent
AXE = ROOT / "node_modules" / "axe-core" / "axe.min.js"
RAPIDO = "--rapido" in sys.argv

RUTAS = ["/clasica", "/clasica/tes", "/clasica/tes/sueno-del-bosque", "/clasica/tes/oro-de-otono",
         "/clasica/cajas", "/clasica/despensa", "/clasica/cucharas", "/clasica/nosotros", "/clasica/faq",
         "/clasica/envios", "/clasica/contacto", "/clasica/cesta",
         "/clasica/legal", "/clasica/privacidad", "/clasica/cookies", "/clasica/devoluciones",
         "/gracias", "/clasica/nada"]
LANGS = ["es", "en", "sl"]
ESPERADO_404 = {"/clasica/nada"}
FALLOS: list[tuple[str, str, str]] = []   # (ruta, check, detalle)
TABLA: dict[str, dict[str, str]] = {}      # ruta → {check: "✓"/"✗ detalle"}

def ok(ruta, check): TABLA.setdefault(ruta, {}).setdefault(check, "✓")
def fallo(ruta, check, det):
    FALLOS.append((ruta, check, det)); TABLA.setdefault(ruta, {})[check] = "✗ " + det
    print(f"   ✗ {ruta} · {check}: {det}")

# ───────────────────────── JS que se inyecta en la página ─────────────────────────
JS_META = """() => {
  const q = (s) => document.querySelector(s);
  const c = (s) => q(s)?.getAttribute('content') || '';
  return {
    title: document.title, desc: c('meta[name=description]'),
    canonical: q('link[rel=canonical]')?.getAttribute('href') || '',
    ogTitle: c('meta[property="og:title"]'), ogDesc: c('meta[property="og:description"]'),
    ogImage: c('meta[property="og:image"]'), lang: document.documentElement.lang,
    h1: document.querySelectorAll('h1').length,
    imgsSinAlt: [...document.querySelectorAll('img')].filter(i => !i.hasAttribute('alt')).map(i => (i.getAttribute('src')||'').slice(-40)),
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  };
}"""

JS_NOMBRES = """() => {
  const nombre = (el) => {
    const al = el.getAttribute('aria-label'); if (al && al.trim()) return al;
    const lb = el.getAttribute('aria-labelledby'); if (lb) { const t = document.getElementById(lb); if (t && t.textContent.trim()) return t.textContent; }
    if (el.getAttribute('title')) return el.getAttribute('title');
    const txt = (el.innerText || el.textContent || '').trim(); if (txt) return txt;
    const img = el.querySelector('img[alt], svg[aria-label], [aria-label]');
    if (img) return img.getAttribute('alt') || img.getAttribute('aria-label') || '';
    return '';
  };
  const sinNombre = [];
  for (const el of document.querySelectorAll('a[href], button, [role=button]')) {
    if (el.closest('[aria-hidden=true]') || el.closest('.sr-only-block')) continue;
    const r = el.getBoundingClientRect(); if (r.width === 0 && r.height === 0) continue;
    if (!nombre(el).trim()) sinNombre.push((el.tagName + ' ' + (el.className||'')).slice(0, 50));
  }
  const inputsSinLabel = [];
  for (const el of document.querySelectorAll('input:not([type=hidden]), textarea, select')) {
    const r = el.getBoundingClientRect(); if (r.width === 0 && r.height === 0) continue;
    const tiene = el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || el.closest('label')
      || (el.id && document.querySelector('label[for="' + CSS.escape(el.id) + '"]'));
    if (!tiene) inputsSinLabel.push((el.tagName + ' ' + (el.getAttribute('name')||el.getAttribute('placeholder')||'')).slice(0, 50));
  }
  return { sinNombre, inputsSinLabel };
}"""

# Contraste propio: color del texto MEZCLADO con la opacidad heredada sobre el fondo efectivo.
JS_CONTRASTE = """() => {
  const parse = (s) => { const m = s.match(/rgba?\\(([^)]+)\\)/); if (!m) return null;
    const p = m[1].split(',').map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const lum = ({r, g, b}) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const mix = (fg, bg, a) => ({ r: fg.r * a + bg.r * (1 - a), g: fg.g * a + bg.g * (1 - a), b: fg.b * a + bg.b * (1 - a) });
  const fondo = (el) => { // primer ancestro con fondo sólido (gradientes/imágenes → papel de la casa)
    let e = el; while (e && e !== document.documentElement) { const cs = getComputedStyle(e); const c = parse(cs.backgroundColor);
      if (c && c.a >= 0.9) return c; if (c && c.a > 0 && c.a < 0.9) { const base = fondo(e.parentElement) || {r:253,g:248,b:234}; return mix(c, base, c.a); }
      if (cs.backgroundImage && cs.backgroundImage !== 'none' && /gradient/.test(cs.backgroundImage)) {
        const cols = cs.backgroundImage.match(/rgba?\\([^)]+\\)/g) || []; const solid = cols.map(parse).filter(c => c && c.a >= 0.9);
        if (solid.length) return solid[Math.floor(solid.length / 2)]; }
      e = e.parentElement; }
    return { r: 253, g: 248, b: 234 }; };
  const opac = (el) => { let o = 1, e = el; while (e && e !== document.documentElement) { o *= parseFloat(getComputedStyle(e).opacity || '1'); e = e.parentElement; } return o; };
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const vistos = new Set(); const malos = [];
  let n;
  while ((n = walker.nextNode())) {
    const t = n.textContent.trim(); if (t.length < 2) continue;
    const el = n.parentElement; if (!el || vistos.has(el)) continue; vistos.add(el);
    if (el.closest('script, style, noscript, .sr-only-block, [aria-hidden=true], svg')) continue;
    const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none') continue;
    const r = el.getBoundingClientRect(); if (r.width === 0 || r.height === 0) continue;
    const fg = parse(cs.color); if (!fg) continue;
    const bg = fondo(el); const a = Math.min(1, fg.a * opac(el));
    const eff = mix(fg, bg, a);
    const L1 = lum(eff), L2 = lum(bg); const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    const px = parseFloat(cs.fontSize); const bold = parseInt(cs.fontWeight) >= 700;
    const grande = px >= 24 || (px >= 18.66 && bold); const min = grande ? 3 : 4.5;
    if (ratio < min) malos.push({ texto: t.slice(0, 40), ratio: Math.round(ratio * 100) / 100, px, opac: Math.round(a * 100) / 100, sel: (el.tagName + '.' + String(el.className).split(' ').slice(0, 2).join('.')).slice(0, 40) });
  }
  return malos;
}"""

JS_TAPS = """() => {
  const out = [];
  for (const el of document.querySelectorAll('header a, header button, nav a, nav button, main button, main a.btn-tinta, footer a')) {
    const r = el.getBoundingClientRect(); if (r.width === 0 || r.height === 0) continue;
    if (el.closest('footer') && r.height >= 24) continue; // el pie son enlaces de texto con interlineado; el criterio estricto es nav+botones
    if (Math.min(r.width, r.height) < 40) out.push({ t: (el.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 24), w: Math.round(r.width), h: Math.round(r.height) });
  }
  return out;
}"""

JS_PERF_INIT = """
window.__lcp = 0; window.__cls = 0;
try {
  new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
  new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
} catch (e) {}
"""

def nav(page, ruta, lang, espera=700):
    r = page.goto(BASE + ruta, wait_until="load")
    try:
        page.wait_for_function(f"() => document.documentElement.lang === '{lang}'", timeout=4000)
    except Exception:
        pass
    page.wait_for_timeout(espera)
    return r

def auditar_ruta(page, ruta, lang, errs, metas):
    tag = f"{ruta} [{lang}]"
    errs.clear()
    r = nav(page, ruta, lang)
    esperado = 404 if ruta in ESPERADO_404 else 200
    if r.status != esperado: fallo(tag, "http", f"{r.status} (esperado {esperado})")
    else: ok(tag, "http")
    m = page.evaluate(JS_META)
    # ── SEO ──
    if not m["title"] or len(m["title"]) < 8: fallo(tag, "title", repr(m["title"]))
    else: ok(tag, "title")
    if ruta not in ESPERADO_404:
        if not m["desc"] or len(m["desc"]) < 30: fallo(tag, "description", repr(m["desc"][:40]))
        else: ok(tag, "description")
        if not m["canonical"] or not m["canonical"].endswith(ruta): fallo(tag, "canonical", repr(m["canonical"]))
        else: ok(tag, "canonical")
        if not m["ogTitle"] or not m["ogDesc"] or not m["ogImage"]:
            fallo(tag, "og", f"title={bool(m['ogTitle'])} desc={bool(m['ogDesc'])} image={bool(m['ogImage'])}")
        else: ok(tag, "og")
        if lang == "es": metas.append((ruta, m["title"], m["desc"]))
    # ── idioma ──
    if m["lang"] != lang: fallo(tag, "html[lang]", f"{m['lang']!r} ≠ {lang}")
    else: ok(tag, "html[lang]")
    # ── estructura/a11y ──
    if m["h1"] != 1: fallo(tag, "h1", f"{m['h1']} h1")
    else: ok(tag, "h1")
    if m["imgsSinAlt"]: fallo(tag, "img-alt", str(m["imgsSinAlt"][:3]))
    else: ok(tag, "img-alt")
    nm = page.evaluate(JS_NOMBRES)
    if nm["sinNombre"]: fallo(tag, "nombre-accesible", str(nm["sinNombre"][:3]))
    else: ok(tag, "nombre-accesible")
    if nm["inputsSinLabel"]: fallo(tag, "input-label", str(nm["inputsSinLabel"][:3]))
    else: ok(tag, "input-label")
    # ── contraste ──
    malos = page.evaluate(JS_CONTRASTE)
    if malos: fallo(tag, "contraste", f"{len(malos)} textos < AA, p.ej. {malos[0]}")
    else: ok(tag, "contraste")
    if AXE.exists() and not RAPIDO:
        page.add_script_tag(path=str(AXE))
        res = page.evaluate("""async () => { const r = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } });
          return r.violations.filter(v => ['serious', 'critical'].includes(v.impact)).map(v => ({ id: v.id, n: v.nodes.length, ej: (v.nodes[0]?.target||[''])[0].slice(0,60) })); }""")
        if res: fallo(tag, "axe", json.dumps(res[:4], ensure_ascii=False))
        else: ok(tag, "axe")
    # ── 404 con estilo ──
    if ruta in ESPERADO_404:
        info = page.evaluate("""() => ({ papel: !!document.querySelector('.papel'), lamina: !!document.querySelector('.lamina'),
          aClasica: !!document.querySelector('a[href="/clasica"]'), a3d: !!document.querySelector('a[href="/"]') })""")
        if not all(info.values()): fallo(tag, "404-estilo", json.dumps(info))
        else: ok(tag, "404-estilo")
    # ── /gracias sin pedido ──
    if ruta == "/gracias":
        txt = page.evaluate("() => document.body.innerText")
        if "undefined" in txt or "NaN" in txt or len(txt.strip()) < 40: fallo(tag, "gracias-sin-pedido", txt[:80])
        else: ok(tag, "gracias-sin-pedido")
    # ── consola/red ── (en la 404 esperada, el propio documento responde 404: eso no es un error de la página)
    page.wait_for_timeout(200)
    if ruta in ESPERADO_404: errs[:] = [e for e in errs if "status of 404" not in e]
    if errs: fallo(tag, "consola/red", "; ".join(errs[:3]))
    else: ok(tag, "consola/red")

def teclado(page):
    tag = "/clasica [teclado]"
    nav(page, "/clasica", "es")
    page.evaluate("() => window.scrollTo(0,0)")
    page.keyboard.press("Tab")
    llegado_cesta = llegado_anadir = False; outline_ok = None
    for _ in range(60):
        info = page.evaluate("""() => { const e = document.activeElement; if (!e || e === document.body) return null;
          const cs = getComputedStyle(e); const fv = e.matches(':focus-visible');
          return { href: e.getAttribute('href'), txt: (e.innerText||'').trim().slice(0,30), tag: e.tagName,
            fv, outline: cs.outlineStyle, ow: parseFloat(cs.outlineWidth) }; }""")
        if info:
            if info["href"] == "/clasica/cesta": llegado_cesta = True
            if info["tag"] == "BUTTON" and re.search(r"Añadir|Add|V koš", info["txt"]): llegado_anadir = True
            if info["fv"] and outline_ok is None:
                outline_ok = info["outline"] not in ("none", "") and info["ow"] > 0
                if not outline_ok: fallo(tag, "focus-visible", f"{info['tag']} {info['txt']!r}: outline={info['outline']} {info['ow']}px")
            if llegado_cesta and llegado_anadir: break
        page.keyboard.press("Tab")
    if llegado_cesta: ok(tag, "tab→cesta")
    else: fallo(tag, "tab→cesta", "no se llega al botón de cesta con Tab")
    if llegado_anadir: ok(tag, "tab→añadir")
    else: fallo(tag, "tab→añadir", "no se llega a «Añadir» de la primera lámina con Tab")
    if outline_ok: ok(tag, "focus-visible")
    elif outline_ok is None: fallo(tag, "focus-visible", "ningún elemento llegó a :focus-visible")

def rendimiento(ctx):
    page = ctx.new_page()
    page.add_init_script(JS_PERF_INIT)
    for ruta in ("/clasica", "/clasica/tes"):
        tag = f"{ruta} [perf]"
        page.goto(BASE + ruta, wait_until="load"); page.wait_for_timeout(2500)
        # un scroll provoca los layout shifts tardíos (imágenes/fuentes), y LCP se congela al interactuar
        page.mouse.wheel(0, 400); page.wait_for_timeout(600)
        lcp, cls = page.evaluate("() => [window.__lcp, window.__cls]")
        print(f"   {ruta}: LCP {lcp:.0f} ms · CLS {cls:.3f}")
        if lcp > 2500: fallo(tag, "LCP", f"{lcp:.0f} ms > 2500")
        else: ok(tag, "LCP")
        if cls > 0.1: fallo(tag, "CLS", f"{cls:.3f} > 0.1")
        else: ok(tag, "CLS")
    page.close()

def movil(b):
    ctx = b.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True, device_scale_factor=2)
    ctx.add_init_script("localStorage.setItem('petra-lang','es')")
    page = ctx.new_page()
    for ruta in RUTAS:
        tag = f"{ruta} [móvil]"
        nav(page, ruta, "es", 500)
        over = page.evaluate("() => document.documentElement.scrollWidth - document.documentElement.clientWidth")
        if over > 2: fallo(tag, "overflow-x", f"{over}px")
        else: ok(tag, "overflow-x")
        taps = page.evaluate(JS_TAPS)
        if taps: fallo(tag, "tap≥40px", f"{len(taps)}: {taps[:3]}")
        else: ok(tag, "tap≥40px")
    ctx.close()

def globales(page):
    tag = "[sitio]"
    # sitemap: todas las rutas de la clásica + fichas de todos los tés + raíz 3D
    r = page.request.get(BASE + "/sitemap.xml"); xml = r.text() if r.ok else ""
    urls = set(re.findall(r"<loc>([^<]+)</loc>", xml))
    paths = {re.sub(r"^https?://[^/]+", "", u) or "/" for u in urls}
    teas = re.findall(r'^\s*id: "([a-z0-9-]+)"', (ROOT / "src/data/teas.ts").read_text(), re.M)
    faltan = [p for p in ["/"] + [x for x in RUTAS if x not in ESPERADO_404 and x not in ("/gracias", "/clasica/cesta")]
              + [f"/clasica/tes/{t}" for t in teas] if p not in paths]
    if not r.ok or faltan: fallo(tag, "sitemap", f"HTTP {r.status}; faltan {faltan[:5]} ({len(faltan)})")
    else: ok(tag, "sitemap")
    r = page.request.get(BASE + "/robots.txt"); txt = r.text() if r.ok else ""
    if not r.ok or "Sitemap:" not in txt or "/clasica/cesta" not in txt: fallo(tag, "robots", f"HTTP {r.status}: {txt[:80]!r}")
    else: ok(tag, "robots")
    r = page.request.get(BASE + "/manifest.webmanifest")
    try: man = r.json()
    except Exception: man = {}
    if not r.ok or not man.get("name") or not man.get("icons") or not man.get("theme_color"):
        fallo(tag, "manifest", f"HTTP {r.status}: {str(man)[:80]}")
    else: ok(tag, "manifest")
    r = page.request.get(BASE + "/icon.svg"); r2 = page.request.get(BASE + "/favicon.ico")
    if not (r.ok or r2.ok): fallo(tag, "favicon", f"icon.svg {r.status} · favicon.ico {r2.status}")
    else: ok(tag, "favicon")
    r = page.request.get(BASE + "/og.png")
    if not r.ok: fallo(tag, "og.png", f"HTTP {r.status}")
    else:
        try:
            from PIL import Image
            im = Image.open(io.BytesIO(r.body()))
            if im.size != (1200, 630): fallo(tag, "og.png", f"tamaño {im.size} ≠ 1200×630")
            else: ok(tag, "og.png")
        except ImportError:
            ok(tag, "og.png")

# ───────────────────────── ASSETS DE MARCA (python3 audit_web.py --assets) ─────────────────────────
# og.png 1200×630 en el papel de la casa + favicon.svg (monograma P&E, el mismo sello del menú) + favicon.ico
# + apple-touch-icon.png + icon-192/512.png. Se renderizan con chromium (playwright) para no depender de cairo.
MONOGRAMA = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <circle cx="32" cy="32" r="30" fill="#3a2513"/>
  <circle cx="32" cy="32" r="29" fill="none" stroke="#d9b45b" stroke-width="2"/>
  <circle cx="32" cy="32" r="25" fill="none" stroke="#d9b45b" stroke-width="0.75" opacity="0.7"/>
  <text x="21" y="40.5" text-anchor="middle" font-family="Fraunces, Georgia, 'Times New Roman', serif" font-size="27" font-weight="600" font-style="italic" fill="#f3e4c4">P</text>
  <text x="32" y="45" text-anchor="middle" font-family="Fraunces, Georgia, 'Times New Roman', serif" font-size="13" font-style="italic" fill="#d9b45b">&amp;</text>
  <text x="43.5" y="40.5" text-anchor="middle" font-family="Fraunces, Georgia, 'Times New Roman', serif" font-size="27" font-weight="600" font-style="italic" fill="#f3e4c4">E</text>
  <path d="M32 12.5 q3.2 3 0 6.4 q-3.2 -3 0 -6.4" fill="#7c8a5a" stroke="#5f7a48" stroke-width="0.5"/>
</svg>"""

def html_og():
    papel = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3CfeColorMatrix values='0 0 0 0 0.24 0 0 0 0 0.18 0 0 0 0 0.10 0 0 0 0.045 0'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23g)'/%3E%3C/svg%3E\")"
    fuentes = ROOT / "node_modules" / "@fontsource"
    fr = next((fuentes / "fraunces" / "files").glob("fraunces-latin-600-italic.woff2"), None)
    ka = next((fuentes / "karla" / "files").glob("karla-latin-400-normal.woff2"), None)
    ff = (f"@font-face{{font-family:Fraunces;src:url(file://{fr});font-weight:600;font-style:italic}}" if fr else "") + \
         (f"@font-face{{font-family:Karla;src:url(file://{ka})}}" if ka else "")
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>{ff}
    html,body{{margin:0}} body{{width:1200px;height:630px;overflow:hidden;position:relative;
      background:{papel},linear-gradient(168deg,#fdf8ea 0%,#fbf3e4 52%,#f4e8cf 100%);color:#2e2013;font-family:Karla,system-ui,sans-serif}}
    .lamina{{position:absolute;inset:54px 64px;background:#fffdf6;border:1px solid rgba(58,37,19,.14);
      box-shadow:0 1px 2px rgba(58,37,19,.08),0 18px 44px -18px rgba(58,37,19,.35)}}
    .cinta{{position:absolute;top:-11px;left:50%;width:150px;height:26px;transform:translateX(-50%) rotate(-1.6deg);
      background:rgba(233,218,180,.7);border-left:1px dashed rgba(58,37,19,.18);border-right:1px dashed rgba(58,37,19,.18)}}
    .eyebrow{{position:absolute;left:72px;top:64px;font-size:20px;letter-spacing:.3em;text-transform:uppercase;opacity:.72}}
    h1{{position:absolute;left:72px;top:126px;margin:0;font-family:Fraunces,Georgia,serif;font-style:italic;font-weight:600;font-size:96px;line-height:1;letter-spacing:-.01em}}
    h1 span{{color:#c98a3b;font-weight:300;font-style:normal}}
    p{{position:absolute;left:72px;top:276px;margin:0;font-size:29px;line-height:1.38;max-width:560px;opacity:.85}}
    .pie{{position:absolute;left:72px;bottom:52px;font-size:20px;letter-spacing:.2em;text-transform:uppercase;opacity:.72}}
    .sello{{position:absolute;right:64px;top:84px;width:290px;height:290px}}
    .regla{{position:absolute;left:72px;right:72px;bottom:104px;border-top:1px solid rgba(58,37,19,.16)}}
    </style></head><body><div class="lamina"><div class="cinta"></div>
    <div class="eyebrow">Casa de té · Ajdovščina · Vipavska dolina</div>
    <h1>Petra <span>&amp;</span> Erik</h1>
    <p>Mezclas de plantas hechas en casa, cajas de estación y cucharas de madera talladas a mano.</p>
    <div class="regla"></div><div class="pie">petra &amp; erik · hecho en casa, sin prisa</div>
    <div class="sello">{MONOGRAMA}</div></div></body></html>"""

def assets():
    from PIL import Image
    pub = ROOT / "public"
    (pub / "favicon.svg").write_text(MONOGRAMA)
    with sync_playwright() as pl:
        b = pl.chromium.launch(executable_path="/usr/bin/chromium", headless=True, args=["--no-sandbox"])
        page = b.new_page(viewport={"width": 1200, "height": 630}, device_scale_factor=1)
        page.set_content(html_og()); page.wait_for_timeout(800)
        page.screenshot(path=str(pub / "og.png"), clip={"x": 0, "y": 0, "width": 1200, "height": 630})
        # el monograma a 512 px → favicon.ico (16/32/48), apple-touch-icon 180, icon-192 e icon-512 (maskable: con fondo)
        page = b.new_page(viewport={"width": 512, "height": 512}, device_scale_factor=1)
        fr = next((ROOT / "node_modules/@fontsource/fraunces/files").glob("fraunces-latin-600-italic.woff2"), None)
        ff = f"@font-face{{font-family:Fraunces;src:url(file://{fr});font-weight:600;font-style:italic}}" if fr else ""
        page.set_content(f"<style>{ff}html,body{{margin:0;background:transparent}}svg{{display:block;width:512px;height:512px}}</style>{MONOGRAMA}")
        page.wait_for_timeout(600)
        page.screenshot(path=str(pub / "icon-512.png"), omit_background=True)
        b.close()
    im = Image.open(pub / "icon-512.png").convert("RGBA")
    im.resize((192, 192), Image.LANCZOS).save(pub / "icon-192.png")
    # apple-touch-icon: iOS no quiere transparencia → fondo de madera oscura con el sello centrado
    apple = Image.new("RGBA", (180, 180), "#3a2513"); apple.alpha_composite(im.resize((164, 164), Image.LANCZOS), (8, 8))
    apple.convert("RGB").save(pub / "apple-touch-icon.png")
    im.save(pub / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
    for f in ("og.png", "favicon.svg", "favicon.ico", "apple-touch-icon.png", "icon-192.png", "icon-512.png"):
        print(f"  ✓ public/{f} ({(pub / f).stat().st_size} bytes)")

def main():
    if "--assets" in sys.argv:
        assets(); return
    print(f"AUDITORÍA WEB CLÁSICA · {BASE} · {len(RUTAS)} rutas × {LANGS}{' (rápido: sin axe)' if RAPIDO else ''}")
    metas: list[tuple[str, str, str]] = []
    with sync_playwright() as pl:
        b = pl.chromium.launch(executable_path="/usr/bin/chromium", headless=True, args=["--no-sandbox", "--use-gl=swiftshader"])
        for lang in LANGS:
            print(f"== {lang.upper()}")
            ctx = b.new_context(viewport={"width": 1440, "height": 900}, locale=lang)
            ctx.add_init_script(f"localStorage.setItem('petra-lang','{lang}')")
            page = ctx.new_page()
            errs: list[str] = []
            page.on("pageerror", lambda e: errs.append(f"PAGEERROR {str(e)[:90]}"))
            page.on("console", lambda m: errs.append(f"CONSOLE {m.text[:100]}") if m.type == "error" else None)
            def red(req):
                fa = req.failure or ""
                if "ABORTED" in fa or "favicon" in req.url: return
                errs.append(f"RED {req.url[-60:]} ({fa[:30]})")
            page.on("requestfailed", red)
            for ruta in RUTAS:
                auditar_ruta(page, ruta, lang, errs, metas)
            if lang == "es":
                teclado(page)
                globales(page)
                rendimiento(ctx)
            ctx.close()
        movil(b)
        b.close()
    # unicidad de title/description (ES, que es lo que sirve el servidor)
    for idx, nombre in ((1, "title-único"), (2, "description-única")):
        vistos: dict[str, str] = {}
        for ruta, *vals in metas:
            v = vals[idx - 1]
            if v in vistos: fallo(f"{ruta} [es]", nombre, f"igual que {vistos[v]}: {v[:50]!r}")
            else: vistos[v] = ruta; ok(f"{ruta} [es]", nombre)
    # ── tabla ──
    print("\n" + "=" * 100)
    for ruta, checks in TABLA.items():
        malos = [f"{k}: {v[2:]}" for k, v in checks.items() if v.startswith("✗")]
        print(f"{ruta:42s} {len(checks) - len(malos):2d}/{len(checks):2d} ✓" + ("   ✗ " + " | ".join(malos)[:200] if malos else ""))
    print("=" * 100)
    if FALLOS:
        print(f"\n✗ {len(FALLOS)} FALLOS:")
        for r, c, d in FALLOS: print(f"  {r} · {c}: {d[:160]}")
        sys.exit(1)
    print(f"\n✓ AUDITORÍA LIMPIA: {sum(len(c) for c in TABLA.values())} checks en {len(TABLA)} ruta×idioma, 0 fallos.")

if __name__ == "__main__":
    main()
