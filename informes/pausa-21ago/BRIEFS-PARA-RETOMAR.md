# BRIEFS para retomar la sesión «Petra 100% real» (pausada 21/22-ago por orden de SER)

Orquestador: al volver SER, (1) leer `~/.claude/agents/_CEREBRO_GULEVA/pausa_21ago.md`, (2) levantar
producción `cd web && pnpm start -p 3111` si no está, (3) encender la pantalla HP si está apagada
(`xrandr --output eDP --mode 1920x1080 --right-of HDMI-A-0`; verificar audio `pactl get-default-sink`),
(4) relanzar los agentes **en este orden** con los briefs de abajo (o reanudar los pausados con
SendMessage: sus transcripciones siguen vivas). Commits solo el orquestador, autoría `SER <[correo personal retirado]>`.

## Reglas comunes (van en TODOS los briefs)
- Leer `~/.claude/agents/_DOCTRINA.md` + antibiblioteca (incl. #23: navegador SOLO en la HP).
- Navegador SOLO en la pantalla HP: `PETRA_CDP=<puerto> PETRA_BASE=http://localhost:<dev> python3 scripts/hp.py abrir|ir|foto|cerrar`.
  Jamás fullscreen, jamás 0,0, jamás scrot, jamás pgrep/pkill por nombre (matar por puerto con `fuser -k`).
- Cada constructor con su dev server (`nohup pnpm dev -p <dev> >/tmp/dev<dev>.log 2>&1 &`; Next 16 usa .next/dev).
  Producción :3111 NO se toca. Sin commits. Mirar las capturas con Read antes de dar nada por bueno.
- Dominios disjuntos (abajo). Si hace falta tocar un fichero ajeno: NO; apuntarlo en el informe.
- Cierre: evidencia pegada (salidas, FPS, capturas miradas), lista de ficheros tocados, lo no resuelto y por qué.

## 1 · C-3D-P «colocación» (dev :3113 / CDP 9336) — ESTADO: solo había patchado `scripts/ver_escena.py`
  (PETRA_CDP) y abierto la HP; NINGUNA pieza movida aún. Retomar desde «mapa de la entrada /».
Objetivo: SER vio «muchas cosas desordenadas» en el 3D → auditar la COLOCACIÓN de cada pieza de las 7 salas
(/, /salon, /te, /te-premium, /nosotros, /contacto, /carrito) y corregir toda pieza mal puesta con evidencia
antes/después. No es belleza: posición, apoyo, orientación, choques.
Dominio: `src/scenes/**`, `src/components/three/**` (SOLO position/rotation/scale; quitar/sustituir si no hay
arreglo), `scripts/ver_escena.py` (+subcomando `apoyo`), `scripts/bateria.py` (solo tabla EXENTOS de geo2 con
motivo). Prohibido: materials.ts, SceneShell, Effects, quality.ts, hud/**, app/**, i18n/**, data/**.
Método por sala: (1) `ver_escena.py mapa /ruta` (piezas: nombre/centro/tamaño/minY + choques malla-a-malla);
(2) NUEVO `ver_escena.py apoyo /ruta`: cada pieza apoya en suelo (minY≈0 ±0.02) o sobre otra cuya huella XZ
contiene su centro (±0.025); si no → FLOTA o HUNDIDA; exenciones automáticas con motivo: PARED (huella toca
|x|≥4.75 o |z|≥4.75), COLGADA (algo encima la sujeta), ANIM (humo/chispas/polilla/polvo); marcar DENTRO/FUERA
(|x|,|z|≤5 salvo la entrada «/» con jardín: límites reales en IntroScene, suelo 34×22 centrado en (0,-0.03,2.5));
(3) `ver_escena.py zonas /ruta` → MIRAR los 18 recortes (/tmp/petra-zonas/zona_*.png) uno a uno: piezas de
espaldas, contra la pared equivocada, clavadas, escalas absurdas; (4) por anomalía: localizar código, entender
el porqué, corregir CALCULANDO (Y de apoyo con el mapa, rotación hacia el interior), repetir 1-3;
(5) `bateria.py geo2` LIMPIO al final de cada sala (exento solo con motivo); (6) captura general `hp.py foto`.
La entrada «/» tiene piezas aprobadas por SER en vivo (pizarra, enredadera ×7 ramas, margaritas, camino, letrero
y=4.22): no rediseñar; solo resolver el choque conocido `Box+Box+Box+2 (2.6,1.94,-0.67) ⇄ Tube+…+116
(3.22,1.31,-0.69)` (enredadera contra cajas) moviendo lo mínimo.
Cierre: 7 salas con `apoyo` limpio, `mapa` sin choques, `geo2` LIMPIO, tabla de zonas miradas y anomalías
(pieza · antes→después · por qué), tsc limpio. Dos arreglos fallidos seguidos en una pieza = parar, causa, seguir.

## 2 · C-3D-B «materiales+luz+post» (dev :3114 / CDP 9337) — ESTADO: NADA editado; diseño hecho en
  `informes/pausa-21ago/C-3D-B.md` (leerlo entero: tiene el plan y 4 hallazgos medidos).
HALLAZGO CLAVE (medido en node_modules): el tone mapping de SceneShell (ACES, exposure 1.2) NO ACTÚA porque
`@react-three/postprocessing` pone `gl.toneMapping = NoToneMapping` mientras el EffectComposer está montado
(en los 3 niveles) → el render va plano, sin tone mapping ni exposición. Hay que meter `<ToneMapping mode=…>`
DENTRO del composer (postprocessing 6.39: ACES_FILMIC=6, AGX=7, NEUTRAL=8), tras Bloom y antes de Vignette.
Dominio: `src/lib/materials.ts`, `src/components/three/{Mats,SceneShell,Effects,LightShaft}.tsx`,
`src/lib/quality.ts`, nuevo `src/components/three/Realismo.tsx`. Prohibido: scenes/**, deco/**, piezas, hud, app, i18n, data.
Tareas (cada una con captura antes/después de /salon, /te, /nosotros MIRADAS + FPS): (1) micro-superficie
global: recorrido throttled del scene (cada ~60 frames, materiales sin `userData.__micro`) que asigne a cada
MeshStandard/Physical sin maps un roughnessMap de ruido fino (±0.08) + bumpMap sutil (0.008-0.015; menos en
metal; <0.35 roughness solo ruido fino), conservar color/emissive, marcar + needsUpdate; dedup de materiales
idénticos (clave color+rough+metal+emissive+transparent+opacity); no tocar Text/sprites/Points/meshBasic;
(2) `<ContactShadows>` desde SceneShell a ras de suelo (y≈0.012, opacity ~0.45, blur ~2.2, far ~2.5, res 512
mid/1024 high, `frames={1}` + key que cambia con el nº de mallas → re-hornea solo al cambiar la escena;
huella 10×10 en salas, 34×22 en la entrada) vs `<AccumulativeShadows temporal>`+`<RandomizedLight>` (caro:
solo high); elegir por captura sin bajar de 24 FPS en mid; (3) rim frío (directional atrás-izquierda #cfe0ff
0.35-0.6 sin sombra) + revisar key/fill: NADA oscuro (VISION §0); (4) N8AO interior 10 m (aoRadius 0.35-0.5,
intensity 2-3, distanceFalloff ~1, color cálido oscuro; halfRes en mid); (5) `<ToneMapping>` en el composer:
ACES vs AgX vs Neutral por captura (paleta crema/miel/madera); bloom selectivo: threshold ~1.0 + en el
recorrido global `toneMapped=false` a materiales con emissiveIntensity ≥1.5; BrightnessContrast/HueSaturation
solo si mejora claramente (HueSaturation 6.39 solo tiene hue y saturation); (6) god-rays: cablear `LightShaft`
default solo si es genérico desde SceneShell (si exige tocar escenas → apuntar para C-3D-C); (7) presupuesto
por calidad en quality.ts (≥24 FPS en las 7 salas en la HP; condicional high/mid/low).
Cierre: tabla FPS por sala antes/después (`bateria.py shots` contra :3114), 0 errores, nº materiales únicos
antes/después en /te, tsc limpio, geo2 igual, 6 capturas miradas con una frase cada una.

## 3 · C-WEB «unión + auditoría + legal UE» (dev :3112 / CDP 9335) — ESTADO: MUCHO hecho sin informe
  (parado antes de escribirlo). En el WIP hay: `_meta.ts` + metadata por página de la clásica, `layout.tsx`
  (html lang), `robots.ts`, `sitemap.ts`, `manifest.ts`, `not-found.tsx`, Nav/Footer (enlace 3D), HUD
  (CajaPanel/ExtraPanel/Guia/Menu/TeaPanel con trTea/…), i18n ×3 ampliado, `gracias/`, `scripts/audit_web.py`.
  Retomar: leer `git diff` de esos ficheros, correr `audit_web.py` + `test_clasica.py` (desktop y movil) +
  `i18n_check.py` contra :3112 y seguir con lo que falte de la lista.
Objetivo: (A) UNIÓN: Menu 3D→/clasica con texto (era solo «✨»), Nav clásica→3D, carrito compartido verificado
en vivo (petra-cart-v1), idioma compartido (petra-lang) verificado, catálogo traducido en los paneles HUD
(trTea/trCaja/trExtra/trPlanta/trCupon/nombreEstacion), hardcodes ES de hud/** → T; los de scenes/** se
listan para C-3D-C; i18n_check ampliado a rutas 3D (/, /te, /te-premium, /nosotros, /contacto, /carrito).
(B) AUDITORÍA `scripts/audit_web.py` (playwright, /usr/bin/chromium) en todas las rutas clásica + /gracias +
404 × 3 idiomas: 0 errores consola/red (filtrar ERR_ABORTED); title/description únicos; canonical; og
(og:image por defecto 1200×630 estilo papel); html[lang] dinámico; 1 h1; alt en img; nombres accesibles;
labels; contraste AA (axe-core si está); teclado (Tab llega a cesta y «Añadir», focus-visible); 404 propia
×3; sitemap/robots/manifest/favicon; /gracias sin pedido → amable; LCP/CLS medidos; móvil 390×844 sin
overflow, tap targets ≥40px. Exit 1 si falla; arreglar en sus ficheros hasta limpio.
(C) LEGAL UE ×3 idiomas enlazadas del Footer: /clasica/legal (marcadores «[PENDIENTE: dato real de Petra]»,
sin inventar NIF/dirección), /clasica/privacidad (RGPD), /clasica/cookies (solo localStorage), /clasica/
devoluciones (14 días, perecederos excluidos); casilla RGPD obligatoria en contacto ×3.
Dominio: `src/app/clasica/**`, `src/components/clasica/**`, `src/components/hud/**`, `src/i18n/**`,
`src/app/{layout,not-found,sitemap,robots,manifest}`, `src/app/gracias/**`, `src/app/api/contacto/**`,
`public/**`, `scripts/{test_clasica,i18n_check,audit_web}.py`. Prohibido: three/**, scenes/**, materials,
quality, data/**, lib/cart.ts (avisar).
Cierre: audit_web limpio, test_clasica ×2 limpio, i18n_check limpio (con 3D), tsc limpio, 3 capturas HP miradas.

## 4 · Explorador — COMPLETO: `informes/2026-08-21-realismo-threejs-docs.md` (pases 1-3, extras, TOP-10,
  TRAMPAS verificadas contra node_modules). Los constructores B/A/C lo leen antes de codificar.

## 5 · C-3D-A «bisel» (lanzar DESPUÉS de C-3D-P; dev :3115 / CDP 9338) — NO LANZADO
Primitiva común `<Bloque args={[w,h,d]} r?>` = `RoundedBoxGeometry` (three/examples, ya instalado; `extend`
+ tipos) con radio = min(r ?? 0.018, minDim·0.25), segments 2; codemod Python con conteo de corchetes que
sustituya los 228 `<boxGeometry args={[...]} />` (deco/taller 57, tearoom 56, salon 42, IntroScene 25,
Furniture/Decor/Room 11/11/10, SalonScene/SeasonBoxes 5/5, resto 1-2) y añada el import. Room (paredes/
suelo): probar radio 0.006 o sin bisel por captura (evitar fugas de luz en esquinas). Verificar: tsc, build,
geo2 IGUAL (AABB no cambia), FPS ≥24 (tris ×~6 por caja; ~18k→ quizá 100k en /te: medir), capturas HP de
cantos cogiendo luz (antes/después) miradas. Dominio: todos los ficheros con boxGeometry + nuevo Bloque.tsx.

## 6 · C-3D-C «vida + i18n 3D + cables fantasma» (DESPUÉS de A; dev :3116 / CDP 9339) — NO LANZADO
i18n: cablear trTea/trCaja/trExtra/trPlanta/nombreEstacion en three/Jar 141-147, SeasonBoxes 74, SpoonRack 75,
PlantChips 69, scenes/TeaRoom 218-219, SalonScene 163/175-176, CartScene 79/82/189 (+`lineName` cart.ts:54,
pedir permiso al orquestador); hardcodes ES → T: SalonScene 163/170/171, IntroScene 573/628 (pizarra «Té del
día», frase de la entrada), TeaRoom 155 («Mezclas de la casa»), CartScene 193-292. Unificar NOMBRE_ESTACION
(season.ts) con nombreEstacion. Vida: cablear `LightShaft` (god-rays) en salas con ventana, decidir
FloorGlow/WindowGlow/Curtains (cablear o archivar; DryingLine y DoorMat NO: SER los quitó), `<DecoVivo
sala="intro">` en IntroScene, taller sin Chispas/Polilla/SunPatch/WallSpill → añadir coherente, desgaste con
drei `<Decal>` (umbral de puertas, mostrador), vaivén sutil en colgantes, set de cucharillas desigual
(cucharilla_c 7.929 v vs 355: regenerar con /tmp/gen_cucharillas_te.py o la fábrica). Todo con geo2 limpio
(lo animado exento con motivo) y capturas HP miradas. Después: verificador (geo2 + shots HP + compra +
interaccion.py + test_clasica ×2 + i18n_check + audit_web), crítico (examen sorpresa), escriba, PRESENTACIÓN.
