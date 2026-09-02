# C-WEB — PAUSA 23-ago-2026 (CONSTRUCTOR web/HUD/i18n, proyecto Petra)
Base de trabajo: commit 061da86 (WIP anterior) + lo de esta sesión SIN commitear (25 ficheros modificados + nuevos,
`pnpm exec tsc --noEmit` LIMPIO). Producción :3111 NO tocada. Dev server :3112 CERRADO, ventana CDP 9335 CERRADA.
NOTA: el arranque falló por un `.next/dev/lock` OBSOLETO (pid 215098 muerto, puerto 3114 libre) → lo borré. Si vuelve a pasar: `kill -0 <pid>` y si está muerto, `rm .next/dev/lock`.

## RESULTADOS MEDIDOS (todo contra http://localhost:3112)
- `scripts/audit_web.py` (completa, con axe-core): **ANTES 229 fallos → DESPUÉS 0: «✓ AUDITORÍA LIMPIA: 781 checks en 76 ruta×idioma, 0 fallos»** (exit 0).
  Mide: consola/red, title/description únicos, canonical, og ×3, html[lang] (cambia con el idioma), 1 h1, img alt, nombre
  accesible, input-label, contraste AA (cálculo propio con opacidad heredada + axe serious/critical), teclado (Tab→cesta,
  Tab→Añadir, :focus-visible), 404 con estilo, /gracias sin pedido, sitemap/robots/manifest/favicon/og.png 1200×630,
  LCP/CLS (/clasica LCP 664 ms CLS 0.000 · /clasica/tes LCP 580 ms CLS 0.000), móvil 390×844 (overflow, tap ≥40px).
  `--rapido` = sin axe · `--assets` = regenera public/og.png, favicon.svg/.ico, apple-touch-icon, icon-192/512.
- `scripts/test_clasica.py` desktop: 0 errores consola/red en 16 rutas · 34/34 enlaces · filtro premium 19→7 · SL ✓ ·
  **sin consentimiento NO se envía (casilla RGPD) ✓** · formulario confirma ✓ · compra con entrada PE- ✓ → `"fallos": []`.
  `movil`: 0 errores en 16 rutas · compra PE- ✓ → `"fallos": []`.
- `scripts/i18n_check.py` (ahora con rutas 3D y panel del tarro abierto vía `window.__petraUi`):
  CLÁSICA EN+SL LIMPIA en las 15 rutas + cesta (pasada i18n_1). En la pasada i18n_2 (checker más estricto: nodos de texto
  unidos con espacio, antes «Sueño del Bosque7,50 €» escondía residuos) salió «[sl] /clasica ✗ 23 residuos» = párrafos
  enteros en ES → es el HTML del servidor leído ANTES de hidratar (dev server cargado tras las páginas 3D); en i18n_1 estaba
  limpio. FIX aplicado sin re-ejecutar: espera a `html[lang]===lang` antes de leer. **PASO 1 AL RETOMAR: re-correr i18n_check.**
  3D (todo FUERA de mi dominio, para el constructor 3D): /te y /te-premium 13/8 residuos **sr-only** (TeaRoom.tsx),
  /carrito 3 visibles (CartScene), / 1 visible (Basket «Cesta»), panel tarro+planta: VISIBLE LIMPIO (Forest Sleep ·
  Chamomile · «60 g jar» · porqué EN). `--sin-3d` = solo clásica.

## A · UNIÓN CLÁSICA↔3D — HECHO
1. Menu.tsx: entrada `✨ Web clásica / Classic shop / Klasična trgovina` (T.nav.clasica) → /clasica. BUG ARREGLADO de paso:
   el `return null` en /clasica iba ANTES de 4 hooks (con navegación cliente clásica→3D React rompería); ahora va tras los hooks.
2. Nav.tsx: enlace `✨ Tienda 3D / 3D shop / 3D trgovina` (T.nav.tienda3d) → / (desktop y nav móvil); Footer: `T.cl.visita3d`.
3. Carrito compartido: VERIFICADO por i18n_check (cesta con té+caja+PETRA10 puesta en localStorage petra-cart-v1 desde la
   clásica aparece en /carrito 3D: «Sueño del Bosque 7,50 € · Caja de la Casa 24,00 € · ✓ PETRA10»). Misma clave, mismo store.
4. Idioma compartido: VERIFICADO (petra-lang puesto en la clásica → / y /te salen en EN/SL; html[lang] lo sigue).
5. HUD traducido: CajaPanel (trCaja+trExtra), ExtraPanel (trExtra + «tallada por/de la despensa de» → T.extra), TeaPanel
   (trTea+trPlanta + «Toca una planta del abanico» → T.sala.tocaPlanta), Guia/Cerrar → T.a11y.cerrar ×3. TeaPanel expone
   `window.__petraUi = useUi` (1 línea) para que las baterías abran el panel sin raycast WebGL.
6. i18n_check.py ampliado (ver arriba).

## B · AUDITORÍA — HECHO (0 fallos). Arreglos: html[lang] dinámico (i18n/index.tsx); `_meta.ts` (title sin marca duplicada
—antes «Los tés — Petra & Erik · Petra & Erik»—, description única, canonical, og/twitter); layout: metadataBase
(NEXT_PUBLIC_SITE_URL, defecto :3111), og por defecto, icons, manifest; not-found.tsx ×3 (papel+lámina+2 puertas);
sitemap (3D+clásica+19 fichas+legales), robots (+/clasica/cesta,/api/), manifest.ts; gracias: sin pedido → mensaje ×3 + 2
puertas, «Pagado con…» ×3, fecha por locale; contraste: opacidades <0.7 subidas (Nav/Footer/Lamina/Ficha/Cesta/Nosotros/
Despensa/FAQ) + `clasica.css` (override scoped `.papel .eyebrow{opacity:.72}` porque globals.css NO es mío); tap ≥40px
(Nav desktop/móvil, lang buttons, logo, cesta, filtros, Añadir, ±/✕ cesta, footer py-2.5); aria-label en inputs cesta;
axe-core instalado como devDependency (pnpm add -D axe-core@4.13.0 — en package.json/lock).

## C · LEGAL UE — HECHO: PaginaLegal.tsx + /clasica/{legal,privacidad,cookies,devoluciones} ×3 idiomas (T.cl.legal/
privacidad/cookies/devoluciones con bloques {t,p[]}), marcadores «[PENDIENTE: …]» en granate (NIF/dirección/correo NO
inventados), enlazadas en Footer (columna «Lo legal») y entre sí; en sitemap, audit_web y test_clasica. Casilla RGPD
obligatoria en contacto (required + check en cliente) y la API /api/contacto devuelve 400 sin `consiente:true`.

## FICHEROS TOCADOS ESTA SESIÓN (sin commit)
M: src/i18n/{es,en,sl}.ts (legal/404/consentimiento/a11y/extra) · src/app/clasica/{layout.tsx (import clasica.css),
HomeClasica.tsx, tes/CatalogoTes.tsx, tes/[id]/FichaTe.tsx, cesta/CestaClasica.tsx, contacto/ContactoClasica.tsx,
despensa/DespensaClasica.tsx, nosotros/NosotrosClasica.tsx, faq/FaqClasica.tsx} · src/app/api/contacto/route.ts ·
src/app/not-found.tsx · src/components/clasica/{Nav,Footer,Lamina}.tsx · src/components/hud/TeaPanel.tsx ·
scripts/{audit_web,test_clasica,i18n_check}.py · package.json/pnpm-lock (axe-core).
NUEVOS: src/components/clasica/PaginaLegal.tsx · src/app/clasica/clasica.css · src/app/clasica/{legal,privacidad,cookies,
devoluciones}/page.tsx · public/{og.png,favicon.svg,favicon.ico,apple-touch-icon.png,icon-192.png,icon-512.png}.
(Los .pre-c3db/.pre-c3dp .bak, Realismo.tsx, medir_realismo.py e informes/2026-08-23-* son de OTROS constructores.)

## HARDCODES ES EN src/scenes/* y src/components/three/* (NO míos → constructor 3D)
- src/scenes/TeaRoom.tsx:218-219 sr-only `{t.nombre}` / `{t.paraQueSirve}` sin trTea (13+8 residuos EN/SL) · :155 WallSign texto="Mezclas de la casa" (Text 3D)
- src/scenes/SalonScene.tsx:163 «Estamos en {NOMBRE_ESTACION[est]}» (lib/season ES) · :170-171 aria-label/h2 «Cajas de temporada» · :175-176 `{c.nombre}` `{c.descripcion}` sin trCaja
- src/scenes/CartScene.tsx:82 cuchara.nombre/procedencia sin trExtra · :193/:195 aria-label «Menos»/«Más» · :208 `{cupon.descripcion}` sin trCupon (VISIBLE en EN/SL) · :270 «Procesando pago de prueba…» · :277 «MM/AA» · :280 «Tarjeta de prueba de Stripe…» · :282 «Tu correo para el recibo (opcional)» · :286 «Aquí se abrirá la ventana de PayPal…» · :290 «Pagar … (prueba)» · :292 «Cancelar» · líneas con `lineName(l)` (lib/cart.ts, ES) → usar trTea/trCaja como CestaClasica
- src/scenes/IntroScene.tsx:573 ChalkboardEasel texto="Té del día: Sueño del Bosque" · :628 sr-only «Tés de mezcla propia, té premium…»
- src/components/three/Basket.tsx:91 «Cesta{ · n}» (VISIBLE en / EN/SL) · Jar.tsx:141/147 `{tea.nombre}` (Text+Html) · SeasonBoxes.tsx:74 `{caja.nombre}` · PlantChips.tsx:69 `{plant.nombre}` · SpoonRack.tsx:75 `nombre={c.nombre}`
- src/lib/season.ts NOMBRE_ESTACION solo ES (existe `nombreEstacion(e, lang)` en i18n/catalogo.ts: solo falta el cable)

## NO HECHO / PENDIENTE (por orden)
1. Re-correr `PETRA_BASE=http://localhost:3112 python3 scripts/i18n_check.py` (confirmar que el «23 residuos SL /clasica» era hidratación; si persiste, mirar HomeClasica con lang=sl).
2. Las 3 capturas del criterio de cierre (404, una legal, nav con enlace 3D) en el cuadrante 4: abrí la ventana pero la orden de cierre llegó antes de fotografiar → `PETRA_CUADRANTE=4 PETRA_CDP=9335 PETRA_BASE=http://localhost:3112 python3 scripts/hp.py abrir /clasica/nada` + `foto 404`, `ir /clasica/privacidad` + `foto legal`, `ir /clasica` + `foto nav3d`, y mirarlas.
3. Metadata (title/description/og) va en ES siempre: el idioma es cliente (localStorage), el <head> lo sirve el servidor. Para EN/SL reales en SEO haría falta enrutado /en /sl (fuera de alcance; propuesta).
4. src/app/icon.svg (taza) sigue existiendo junto a mi favicon.svg (monograma P&E): Next emite ambos <link rel=icon>; decidir cuál queda (icon.svg no era mío).
5. El 3D: los hardcodes de arriba (constructor 3D) — con ellos i18n_check quedaría limpio también en el diorama.
