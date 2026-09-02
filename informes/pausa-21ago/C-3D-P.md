# C-3D-P («colocación») — estado al cierre 23-ago 10:10 (orden de pausa del orquestador)

## Encargo
Auditar la COLOCACIÓN (posición/apoyo/orientación/choques) de TODAS las piezas de las 7 salas 3D
(/ → /salon → /te → /te-premium → /nosotros → /contacto → /carrito) y corregir con evidencia antes→después.
Dominio: src/scenes/**, src/components/three/** (solo position/rotation/scale), scripts/ver_escena.py (subcomandos),
scripts/bateria.py (solo tabla EXENTOS de geo2 con motivo). Sin commits.

## Infra que usé (reproducible)
- Next 16 NO deja dos `next dev` en el mismo directorio (`.next/dev/lock`, sin bypass por env; leído en
  node_modules/next/dist/build/lockfile.js). El :3112 es de otro constructor → mi :3113 corre en un ESPEJO:
  `/tmp/claude-1000/-home-ser/01c81c96-3b82-459f-b66c-5e6218cf582a/scratchpad/web-c3dp/` (rsync del repo sin
  node_modules/.next/.git, `node_modules` enlazado al repo real, y su PROPIO next.config.ts con `turbopack.root: "/"`
  porque Turbopack rechaza un symlink fuera del root). Sync tras cada edición: `.../scratchpad/sync.sh`
  (rsync src/ public/ data/ del repo real → espejo). El scratchpad es de sesión: al retomar, rehacerlo
  (rsync + ln -s + ese next.config.ts) o pedir al orquestador que deje libre un dev server.
  Arranque que sobrevive al shell: `cd <espejo> && setsid nohup pnpm dev -p 3113 >/tmp/dev3113.log 2>&1 </dev/null & disown`
- Panel: `PETRA_CUADRANTE=2 PETRA_CDP=9336 PETRA_BASE=http://localhost:3113 python3 scripts/hp.py abrir /`
  (verificado «✓ en su panel»: ventana en 1916,29). ver_escena.py y bateria.py con esas mismas env.
- `rtree` 1.4.1 instalado en ~/.local (pip --user --break-system-packages, wheel manylinux): lo necesita
  trimesh `contains`/`signed_distance`. Sin él el test malla-a-malla no puede correr.

## Hallazgos de herramienta (importantes para el cerebro)
1. **El test malla-a-malla de `ver_escena.py mapa` NUNCA había funcionado**: los triángulos se construían sin
   vértices compartidos (process=False) → `is_watertight` era False en 0/65 piezas → el bloque de `contains`
   no se ejecutaba → «choques: (ninguno)» de por vida. Arreglado: `merge_vertices()`, cierre por CUERPO
   (componente conexo; un plano transparente dentro de una pieza no la deja «abierta» entera), muestreo de
   SUPERFICIE (400 puntos: caza piezas que ATRAVIESAN un muro sin meter vértices, p.ej. el letrero),
   profundidad de penetración (roces <5 mm no cuentan), se saltan partes hermanas de un compuesto partido
   (tablero+patas, muros+zócalos) y estructura⇄estructura, exención genérica «anclaje en muro/zócalo ≤10 cm»
   y tabla EXENTOS_CHOQUE con motivo escrito por sala. Resumen final «N reales · M exentos · K sin veredicto».
2. `bateria.py geo2` imprime «(0 piezas) LIMPIO» cuando la escena no ha cargado (headless+dev, 1ª compilación):
   falso LIMPIO. PROPUESTA (no toqué esa parte por brief): con 0 piezas imprimir «SIN ESCENA» y reintentar.
   Mientras, runner sobre MI ventana con la misma JS y tabla: scratchpad/geo2_aqui.py (se pierde con el
   scratchpad; son 20 líneas: importa AUDIT2_JS/exento de bateria.py y las aplica a la página del CDP).
3. Subcomando NUEVO `ver_escena.py apoyo [ruta]` (geometría real): rayos desde la base de cada pieza (centro +
   4 puntos de su huella) contra las mallas de las OTRAS piezas: abajo → apoyo (hueco ≤2.5 cm OK); arriba →
   si el rayo SALE de un cuerpo cerrado de otra pieza, la base está DENTRO (HUNDIDA; >30 cm = EMPOTRADA,
   anclaje). Exenciones automáticas con motivo: PARED (toca un muro, solo si FLOTA), COLGADA (techo / sujeta a
   una pieza que empieza en su tope, solo si FLOTA y a >30 cm del suelo), ANIM (se mueve entre 2 muestras o
   es toda transparente), piezas hermanas de un compuesto partido. DENTRO/FUERA por los muros reales (cara
   interior; la entrada usa la calle). Tabla EXENTOS_APOYO con motivo. Resumen «N piezas mal de M».
4. Subcomando NUEVO `ver_escena.py punto x y z [r]`: recorte ampliado ×2.5 centrado en un punto del MUNDO
   (para mirar piezas sin name). Salida de zonas por agente: /tmp/petra-zonas-<CDP> (con 9333 sigue /tmp/petra-zonas).
5. `ver_escena.py` lee PETRA_CDP (como hp.py) y ya no parte la URL por «3111» (usa urlparse).

## SALA «/» (entrada) — CERRADA con evidencia
Antes: apoyo 14 mal (todo «3 cm de aire»), choques reales (una vez vivo el test): gato 3.1 cm en el alféizar y
8.6 cm en la fachada, enredadera 5 cm dentro del cristal/cruceta, gorrión 4.7 cm bajo el suelo, margaritas 19.9 cm
DENTRO de la fachada (el aleatorio da z negativas).
Después: `apoyo` → 0 mal de 62 · `mapa` → 0 choques reales (18 exentos con motivo, 2 sin veredicto = margaritas⇄maceta/
enredadera, mallas abiertas que se entremezclan) · geo2 → LIMPIO (solo exentos) · zonas 9 + recortes `punto`
mirados: gato curvado sobre el banco (bien), enredadera delante del cristal y por detrás del alféizar (bien),
margaritas fuera del muro, gorrión en el suelo. Foto: /tmp/petra-hp/c3dp_sala_intro_despues.png.
Cambios en src/scenes/IntroScene.tsx (backup IntroScene.tsx.pre-c3dp.bak):
- calle: position [0,-0.03,2.5] → [0,0,2.5] — la calle estaba 3 cm bajo TODO lo que se apoya en y=0 (en las salas
  la cara superior de las tablas está en 0; aquí era un plano en −0.03).
- Sparrow y 0.03 → 0.08 — minY −0.047 → +0.003.
- SleepingCat (grupo scale 1.35): [1.96,0.83,-0.5] rotY −0.5 → [-1.852,0.483,-0.222] rotY 0.2 — del alféizar (30 cm
  de fondo; el gato mide 46, quedaba hundido/cortado) al banco de la calle (asiento top 0.49; base = centro − 0.162).
- RoseVine: z −0.76 → −0.67 (+9 cm) — ramas fuera del cristal (z≤−0.70) y de la cruceta (z≤−0.67); siguen por
  detrás del alféizar (exento con motivo: saliente de 29 cm modelado macizo; SER aprobó la enredadera).
- Daisies: z −0.35 → −0.12 — ninguna dentro de la fachada (z<−0.8).
NO tocado (aprobado por SER en vivo, «letrero en y=4.22»): el letrero cruza la fachada 20 cm (rotY π/2 lo pone
perpendicular al muro: mitad del texto dentro del muro y además bajo el alero: solo se lee «Petr»). Si SER
quiere verlo entero: rotY 0 (plano sobre la fachada, encima del escaparate izq.) o bajarlo a y<3.59 para
salir de debajo del alero (cálculo hecho con la pendiente del tejado). Exento en EXENTOS_CHOQUE con ese texto.
scripts/bateria.py: +1 exento geo2 con motivo (enredadera aprobada: AABB lámina delante del cristal).

## SALA /salon — MEDIDA, NO CORREGIDA (paso siguiente exacto)
`apoyo` 8 mal de 44 · `mapa` 12 choques reales (13 exentos genéricos). Lista y arreglo calculado:
1. Cylinder+Sphere+Sphere+3 c(-1.90,0.08,-2.20) HUNDIDA 4.8 cm en el suelo — no está en SalonScene: es un ítem de
   `DecoVivo sala="salon"` (catálogo vivo data/catalogo-vivo.json + src/components/three/DecoVivo.tsx /
   piezasVivas.tsx). Mirar DecoVivo.tsx: probablemente la pieza se coloca con y del catálogo sin su offset de base.
   Arreglar en el COMPONENTE (dominio mío), no en data.
2. MantelSet (-4.25,1.94,1.6) HUNDIDA 5.2 cm en la repisa de la chimenea (repisa 1.78..1.92; su base está en 1.871)
   → y 1.94 → 1.99.
3. SideTable (-2.85,0,1.75) HUNDIDA 3.5 cm en el suelo (minY −0.032) → mirar deco/salon.tsx SideTable (patas
   bajo 0) → y 0 → +0.035 o corregir el offset en el componente.
4. HangingPlant (4.15,3.5,-0.9) FLOTA 206 cm: su cuerda acaba en y=3.5, el techo está en 4.6 → cuelga de nada.
   → subir a y=4.6 (tope en el techo) o alargar la cuerda en el componente (solo si es position/scale).
5. SeasonBoxes (0.5,1.19,0.5) FLOTA 2.6 cm ×3 cajas en reposo (base 1.02, tablero top 1.00) → y 1.19 → 1.17.
   (la de temporada levita por diseño: ANIM; el hover sube 0.22: ANIM).
6. Scale (-4.1,1.2,-3.4) ⇄ bandeja GLB (-4.0,1.17,-3.35): SE SOLAPAN 2.5 cm (mismo sitio del mostrador)
   → Scale x −4.1 → −4.55 y bandeja x −4.0 → −3.85 (mostrador irá de −4.9 a −1.7).
7. Counter (-3.4,0,-3.4): tablero 3.2 ancho → entra 9 cm en el muro lateral (x<−4.91) y 6 cm en el zócalo
   → x −3.4 → −3.3 (queda a ras de la cara interior).
8. PhotoFrame (-2.35,1.17,-3.5) 1 cm dentro del tablero del mostrador → y 1.17 → 1.18.
9. GrandfatherClock (-4.68,0,0.05): 4 cm dentro del zócalo (zócalo x −4.92..−4.84) → x −4.68 → −4.62.
10. Door (Furniture.tsx): las jambas (boxGeometry 0.14×2.75×0.2 en y=0 del grupo a 1.3) bajan 7.5 cm bajo el
    suelo en TODAS las puertas de TODAS las salas → position y 0 → 0.075 (el dintel a 1.42 las cubre). Es un
    cambio de position dentro del componente (dominio). Afecta a 7 salas: re-medir todas después.
11. Fireplace (-4.7,0.85,1.6) 14 cm dentro del muro lateral: exento existente de geo2 «chimenea empotrada en muro»;
    añadir a EXENTOS_CHOQUE de ver_escena con ese motivo (lo que queda tras el muro no se ve desde la cámara).
12. Window del salón (-1.2,2.3,-4.94) EMPOTRADA en el muro trasero: anclaje (ya exento genérico ≤10 cm).
Después de aplicar: sync.sh → `hp.py ir /salon` → `apoyo` (0 mal) → `mapa` (0 reales) → `zonas` (mirar 9) →
`hp.py foto c3dp_sala_salon_despues` → geo2 (runner geo2_aqui.py o bateria.py geo2 una vez compiladas las rutas).

## Salas pendientes (no medidas aún): /te, /te-premium, /nosotros, /contacto, /carrito
Mismo ciclo por sala: ir → apoyo → mapa → zonas (Read de las 9) → corregir por números → re-medir → foto → geo2.
Ojo: geo2 en headless+dev necesita que la ruta esté compilada (si no, «0 piezas LIMPIO» falso).

## Ficheros tocados (todos sin commit)
- scripts/ver_escena.py — PETRA_CDP; test de choques VIVO (merge_vertices, cierre por cuerpo, superficie,
  profundidad, hermanas, estructura, anclaje ≤10 cm, EXENTOS_CHOQUE con motivo, resumen); subcomandos `apoyo` y
  `punto`; zonas por agente. Backup: scripts/ver_escena.py.pre-c3dp.bak
- scripts/bateria.py — +1 exento geo2 con motivo (enredadera aprobada). Backup: scripts/bateria.py.pre-c3dp.bak
- src/scenes/IntroScene.tsx — 5 cambios de position (calle, gorrión, gato, enredadera, margaritas) + comentario.
  Backup: src/scenes/IntroScene.tsx.pre-c3dp.bak
- (instalado) ~/.local python: rtree 1.4.1
- tsc --noEmit: exit 0 al cierre.

## Evidencia guardada
/tmp/c3dp_apoyo_intro_antes.txt · /tmp/c3dp_mapa_intro_antes.txt · /tmp/c3dp_apoyo_salon_antes.txt ·
/tmp/c3dp_mapa_salon_antes.txt · /tmp/c3dp_geo2_1.txt · /tmp/petra-zonas-9336/*.png (zonas y recortes `punto`) ·
/tmp/petra-hp/c3dp_sala_intro_despues.png
