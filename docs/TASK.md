# TASK.md — Bitácora de Petra Website

Proyecto: tienda de té diorama 3D isométrico de Petra & Erik.
La idea completa: `VISION.md` · Herramientas: `SETUP.md` · Cómo verla: `COMO-VERLO.md` · Bugs: `web/BUGS.md`

## EL GIT LOCAL (encargo de SER, 18-ago-2026)
- **Repositorio**: `~/Documentos/PETRA-WEBSITE-TÉ/web/.git` — local, sin remoto (GitHub pendiente
  de `gh auth login`, el token de SER está caducado). Rama: `main` (HEAD suelto inicial de create-next-app).
- **Historia**:
  | hash | qué es |
  |---|---|
  | `4481c79` | esqueleto create-next-app |
  | `6f36d23` | **v2** — tienda completa tras la pasada profesional (herbario botánico, habitaciones únicas) |
  | `80c8482` | **v3** — fan-out de 3 forks: detalle por habitación + puertas/ventanas v2 |
  | `febeb47` | **F0a** — TASK.md + BUGS.md (28 bugs registrados de la caza manual) |
  | `4c133b7` | **F0b** — RENDER PROFESIONAL: N8AO+Bloom+TiltShift2+Vignette+Noise, materiales PBR procedurales offline (madera/encalado/lino/metal, CanvasTexture+Sobel, compartidos con caché), Environment de Lightformers, calidad adaptativa low/mid/high (`?q=` manda, PerformanceMonitor degrada), cámara con maath |
  | `ed2d54f` | **F1** — Sala de Té completa: el tarro SE COGE de la balda (gesto nuevo: adelanta+inclina+enseña etiqueta; resuelve B5/B31), tallos curvados, lámpara/cartel/cesta/derramado (B6-B8,B18,B19,B32) |
- **Volver atrás**: `cd web && git checkout <hash> -- .` (restaura ficheros sin mover HEAD) o
  `git checkout <hash>` para inspeccionar. Antes de experimentos: `git stash`.
- **Regla de trabajo**: un commit por habitación terminada (plan aprobado 18-ago), y su hash se apunta AQUÍ.

## Estado actual (18-ago-2026, noche)
- v3 funcionando en local (`cd web && pnpm build && pnpm start -p 3111`).
- **Plan aprobado**: subir de "juego low-poly" a diorama profesional — postprocesado (N8AO/Bloom/TiltShift),
  materiales PBR procedurales offline, calidad adaptativa 3 niveles, y luego habitación por habitación
  (Té → Premium → Salón → Entrada → Despensa → Taller → Contacto → HUD), cerrando los 28 bugs de `web/BUGS.md`.
  Plan completo: `~/.claude/plans/la-pagina-y-las-swirling-hamming.md`.

## Registro de fases (se rellena al cerrar cada una)
| fase | commit | fecha | notas |
|---|---|---|---|
| 0a TASK+BUGS | febeb47 | 18-ago | registro de 28 bugs |
| 0b render pro | 4c133b7 | 18-ago | deps: @react-three/postprocessing@3.0.5 + postprocessing@6.39.4 + maath@0.10.8. CANDADO: three NO puede subir de 0.185 (rango de postprocessing) |
| 1 Sala de Té | ed2d54f | 18-ago | 8 bugs cerrados (BUGS.md); verificado: cadena tarro→plantas→añadir→carrito+cupón OK, 8 páginas 0 errores consola |
| 1b rendimiento GPU real | bc84c11 | 18-ago | SER: «no está fluido». Navegador FÍSICO abierto en :0 (playwright headed) + ratón real (motor de manos de EIDOS/pyautogui + ojos scrot). GPU identificada: **AMD Radeon 610M @ 3840×2160** — medido EN VIVO 16-23 FPS. Recortes: render cap 1920px, MSAA→SMAA, N8AO half, bloom 4 niveles, transmisión solo high, dpr con tope. **RE-MEDIDO tras el recorte: 19-27 FPS** (antes 16-23; mejora corta — la 610M a 4K no da más con AO+postpro) |

## DÍA 3 (19-ago) — ULTRAPLAN v2 ejecutado de una pieza
| fase | commit | qué |
|---|---|---|
| R1-REAL | bc5848e | PlantSprig v4 (pétalos/hojas Shape real), cristal clearcoat, estela del vuelo, batería en web/scripts |
| INSPECTOR | e4c0f0e | mapa de planta SVG en el taller + ?debug=1 con cajas de colisión en 3D |
| UX+U3 | 16a34bd | hotspots + guía 1ª visita ×3 idiomas + 40 plantas/19 tés/22 extras/9 cucharas |
| CLÁSICA | a267dc4 | /clasica editorial POR ESTACIONES, carrito/idiomas compartidos |
| U4-U7 | 07337f6 | clave taller + foto→producto (rembg) + checkout Stripe real preconfigurado + recibo Resend + JSON-LD + cloudflared |
| BLENDER | (pendiente commit) | FÁBRICA bpy 5.1.2: cuchara/tetera/taza/tarro .glb + integración GLB con fallback + directo en pantalla |
| Z | (en curso) | 2 pasadas limpias: A ✓ (0 errores, compra OK); B en curso con AO de profundidad en mid |

## DÍA 3 (19-ago, tarde) — ORDEN TOTAL en vivo + ULTRAPLAN v3 aprobado
| hito | commit | qué |
|---|---|---|
| checkpoint orden-total | 31121c8 | geo2 (auditor por PIEZAS: dimensiones/apoyo/solapes/exentos declarados) dejó 7 salas limpias; sala té REORDENADA mirando la pantalla real (rótulo Html→Text 3D sobre botica, ventana -3.95 sin cortinas, vapor voluta, cajas a pared izq); premium (runner al lado bueno del cordón, sconce, cuadro); 8 recolocaciones por coordenadas; vivo_eidos.py = manos+ojos de EIDOS (CDP+ratón físico+proyección con matrixWorldInverse); 3 funciones Blender absorbidas de GitHub (informes deepseek en web/informes/); compra 2 pasos (DEMO) |

**SESIÓN CERRADA AL 99%**: C3 terminó (bandeja_servida.glb + cucharas_variadas.glb verificados,
delta 0.0000, funciones absorbidas encadenadas, 2 bugs bpy 5.1 arreglados); C1 y C2 PARADOS a
mitad (snapshot commit e58f329): sus scripts verif_c1.py e interaccion.py existen SIN pasada final
verificada, y los fixes de C1 en api/catalogo+taller-privado están commiteados SIN verificar.
Al retomar: correr ambos scripts, revisar fixes de C1, borrar té verif-c1-te si quedó, integrar
los 2 GLB, F3 dos pasadas limpias, galería, PRESENTACIÓN.

**SESIÓN CORTADA AL 92% — CÓMO RETOMAR (histórico)**: 3 constructores en background (C1 clásica+taller,
C2 interaccion.py, C3 Blender bandeja+cucharas con funciones absorbidas). Al retomar: leer sus
informes, aplicar fixes de núcleo, rebuild, integrar GLB, F3 dos pasadas limpias (bateria.py geo2 +
shots + compra + interaccion.py), galería de ventana real, PRESENTACIÓN. Sala té/premium/carrito/
taller/contacto/intro ORDENADAS y verificadas en vivo hoy.

**ULTRAPLAN v3 aprobado** (plan file la-pagina-y-las-swirling-hamming.md): F1 fan-out de 3
constructores frescos (C1 clásica+taller privado · C2 interacción total+móvil · C3 Blender con
funciones absorbidas) → F2 integración+EIDOS bridge (/scan, /gui, paseo físico) → F3 DOS pasadas
limpias seguidas (geo2+shots+compra+interacción, desktop y móvil) → F4 commits+galería+PRESENTACIÓN.

## DÍA 4-5 (19/20-ago) — GIRO: LA WEB CLÁSICA ES LA PÁGINA (el 3D queda en pausa, enlazados entre sí)
| hito | commit | qué |
|---|---|---|
| clásica completa | 1c1a2ce | 8 rutas + lenguaje «lámina de herbario» (PlantaSVG 11 formas) + cesta completa + taller↔clásica (foto velada→plantas brotando) + logo P+E + scroll arreglado + tests test_clasica.py 2 pasadas limpias ×2 modos |
| clásica v2 | a3b38dc | revisión REAL página a página (fallos de SER cerrados: '1 the teas', botones cortados, títulos en columna, fantasmas del menú 3D) + LA DESPENSA nueva (stock por estación) + FAQ + envíos + quick wins de los 3 informes guleva (CEO-benchmark/CRO/Único en web/informes/) |
| i18n total | 295f14a | FAQ/envíos/método/despensa/footer/cesta en ES/EN/SL verificado sin español fijo; despensa auto-fill |
| unión + rumbo | ddc1ade | clásica↔3D enlazadas (✨); rumbo 3D = ISOMETRIC ENVIRONMENT MODELING (informes deepseek en web/informes/2026-08-20-*) |

**EQUIPO GULEVA-GENERAL montado y permanente** (~/.claude: output-style + hook retomador + checkpoints +
antibiblioteca 22 errores + memoria semántica + effort max heredado). La sesión nueva arranca sola del cerebro.

**PENDIENTE PRIORITARIO** (en el cerebro, tareas.tsv): (1) i18n del CATÁLOGO (datos {es,en,sl}), (2) sesión
de ESCALA con SER en vivo, (3) piloto ultrarrealismo en LA ENTRADA 3D (3 pases: bisel+baking+vida) con los
informes de environment modeling, (4) contenido real de Petra (fotos/textos/precios), (5) dominio+Stripe real.

## SIGUIENTE (cerrado por hoy 18-ago; esperando a SER)
- **FLUIDEZ, decisión pendiente** — medido tras recorte: 19-27 FPS en la Radeon 610M a 4K. Para llegar a 40+:
  (a) `?q=mid` por defecto en GPUs flojas (detectar por WEBGL_debug_renderer_info: si "610M|Mendocino|Intel" → mid; mid ya va sin MSAA y AO half… probar), (b) tope de render 1600px, (c) AO solo al enfocar tarro (la vista general es la cara del juego), o (d) aceptar ~25 FPS estables (es un diorama contemplativo, no un shooter). Mi recomendación: (a)+(b) y medir; guardar (c) como as en la manga.
- Lección de test en vivo: la ventana de KDE puede abrir pequeña → usar `new_context(no_viewport=True)` (ya en el script); los clics del ratón físico deben mapearse desde la geometría REAL de la ventana (xdotool getwindowgeometry), verificando con captura (ojos) antes de cada clic.
- **F2 Premium** (B24 araña baja, B25 cuerda torcida) → F3 Salón (B11,B13-B15) → F4 Entrada (B1-B3) →
  F5 Despensa → F6 Taller (B28) → F7 Contacto (B20,B21,B23) → F8 HUD/global (B17,B29,B30) → F9 verificación final.
- El gesto de coger el tarro y el pipeline de render ya afectan a toda la casa; las fases restantes son
  bugs+look+detalle por habitación, con el ciclo de 6 pasos del plan (`~/.claude/plans/la-pagina-y-las-swirling-hamming.md`).
- Ver la web: `http://localhost:3111` (servidor encendido) · forzar calidad: `?q=low|mid|high`.

## NOTA DE IDENTIDAD GIT (19-ago, orden de SER)
Autoría del repo: `SER <[correo personal retirado]>` (reescrita en TODA la historia con filter-branch; los hashes
cambiaron: el HEAD nuevo es el que diga `git log`). El email anterior venía de la cuenta de Claude de SER
(lo inyecta Claude Code como contexto); SER mandó NO usarlo en git. `git config user.email` del repo ya
queda fijado a [correo personal retirado] — los commits futuros salen bien solos.

## REVISIÓN TOTAL + FIXES (19-ago, tarde) — VERIFICADOR del equipo glueva
Evidencia: campaña de auditoría con 5 agentes en paralelo (rutas, salas 3D, monitor en vivo,
datos/i18n, backend+baterías) + limpieza de catálogo vivo hecha (verif-c1-te fuera).

- **Limpieza ALTA hecha**: `data/catalogo-vivo.json` → `teas:[]` (residuo `verif-c1-te` borrado;
  backup `catalogo-vivo.json.pre-fix.bak`). Verificado: `/api/catalogo` → 0 teas.
- **Monitor en vivo**: 10 rutas HTTP 200, 0 errores de consola, 0 red fallida, 0 pageerrors
  (desktop 1440×900 y móvil 390×844). Carga 3D ~300-700ms.
- **Datos**: 19 tés / 40 plantas / 22 extras / 5 cajas / 3 cupones; 0 referencias rotas;
  i18n 85 claves idénticas en ES/EN/SL.
- **Hallazgos ALTA en código (fix aplicado HOY)**:
  1. Pedestales premium: 7 tés en arco de 5 posiciones → 2 productos solapados e inaccesibles
     (`TeaRoom.tsx:64-69`). Fix: arco de 7 puntos. ✓
  2. Tarros sala normal: 12 tés, 3ª fila entraba en el copete de la botica (`TeaRoom.tsx:72-79`).
     Fix: 2 baldas de 6 con separación 1.0. ✓
  3. checkout no validaba lines/qty/id → 500 (`api/checkout/route.ts:21`). Fix: validación 400. ✓
  4. catálogo aceptaba precio NaN (`api/catalogo/route.ts:54`). Fix: Number.isFinite guard. ✓
  5. doctor no detectaba tés de prueba (`api/doctor/route.ts:34-41`). Fix: heurística verif-/prueba/test. ✓
  6. Build de producción DESACTUALIZADO (`.next` 17:35 vs fuente 18:03) → batería daba 2 FAIL
     (POST/DELETE malformado → 500 que el fuente ya resuelve). Fix: rebuild + restart. (PENDIENTE)
- **Pendientes tras fixes**: integrar GLB huérfanos (bandeja_servida, cucharas_variadas),
  Effects mid/high, TALLER_KEY fuerte (.env.local), i18n modal pago + textos de estación,
  sitemap base URL 3111 + /clasica, README, `.bak` de src → mover a backups/, comentarios teas.ts.
- **Prohibición de SER**: NO tocar ~/EIDOS en absoluto; baterías con venv `~/apify/venv`.
- **Secrets alerta**: `~/.config/opencode/opencode.jsonc` tiene API keys de groq/xai en claro → rotar.

## Día 6 (20-ago) — i18n TOTAL del catálogo (encargo: «traduccion de todos los textos… verificalos y solucionarlos»)
- **64df223** — `src/i18n/catalogo.ts`: 206 pares EN+SL escritos a mano (19 tés con sus porqués,
  5 cajas, 22 extras con procedencias, 39 plantas, 3 cupones, estaciones). Helpers con FALLBACK ES:
  lo del taller de Petra sin traducir se ve en ES, nunca vacío. Cableado en 7 componentes
  (Lamina, FichaTe+JSON-LD, Cajas, Despensa, Cucharas, Home, Cesta+recibo). 2 hardcodes ES fuera
  («todo el año», «Cupón», «email (recibo)»).
- `scripts/i18n_check.py` NUEVO (el verificador de verdad): 206 strings ES vigilados × 12 rutas
  × EN × SL sobre TEXTO VISIBLE (sin latín botánico ni JSON-LD, palabra completa), regresión ES,
  cesta con té+caja+cupón, y fallback del taller EN VIVO (crear té → verlo en ES bajo EN → borrar).
  **DOS pasadas limpias seguidas** + test_clasica desktop ✓ y móvil ✓ (0 consola/red, compra PE- ✓).
- Lecciones del checker (3 falsos positivos entendidos antes de tocar): el latín se queda en latín;
  «Melisa» ES el nombre esloveno correcto; «Brezo» dentro de «Brezova» = matching sin \b.
- Hallazgo: `ClasicaView.tsx` HUÉRFANO (nadie lo importa desde HomeClasica) — candidato a borrar, decide SER.
- Corrector nativo SL lanzado (deepseek-v4-flash-free, prompt de raíz lektor) — correcciones al llegar.
- ClasicaView.tsx BORRADO a orden de SER (0 refs, tsc limpio). Sesión cerrada; el «punto 2» de su lista queda por definir (mi apuesta: escala/composición).

## Día 7 (21-ago) — APUNTES DE RUMBO (orden de SER) + sesión autónoma «100% real»
**Lo que le faltó al 3D para el ultrarrealismo = la disciplina «3D isometric environment modeling /
environment modeling»** (no más objetos: mejor OFICIO en cada objeto). Rumbo fijado en 3 pases, piloto en
LA ENTRADA y luego todas las salas: (1) **bisel en todo** (ningún borde matemático: RoundedBoxGeometry con
radio relativo al tamaño → el canto coge la luz), (2) **baking de luz/AO** (sombras suaves acumuladas,
sombras de contacto, AO afinado, texturas procedurales de veta/yeso/tela para el micro-detalle, tone
mapping), (3) **capa de vida** (movimiento sutil + imperfección: desgaste, clutter, parpadeos, vaivén).
Manuales: `web/informes/2026-08-20-isometric-env-art.md`, `web/informes/2026-08-20-env-pipeline-blender.md`
y el nuevo `web/informes/2026-08-21-realismo-threejs-docs.md` (técnicas en nuestro stack, con fuentes).

**El TALLER PRIVADO (`/taller-privado`, clave `petra`) es el «programa separado» que alimenta a LAS DOS
webs a la vez**: lo que Petra publica (té con foto, extra, deco) entra en el catálogo vivo
(`src/lib/vivoStore.ts` + `/api/catalogo`) y aparece en la CLÁSICA (lámina con foto velada → nítida con
plantas brotando) y en el 3D (`DecoVivo`, tarros vivos). **La clásica y el 3D van JUNTAS**: una sola
tienda, carrito (`petra-cart-v1`) e idioma (`petra-lang`) compartidos, enlazadas en ambos sentidos.
La decisión de si `/clasica` pasa a ser la raíz `/` sigue siendo de SER.

**Protocolo de hoy**: SER usa el HDMI → todo se abre/verifica SOLO en la pantalla HP (eDP 1920×1080 en
+3840,0) con `scripts/hp.py` (PETRA_CDP por agente); dev servers propios por constructor (:3112, :3113…)
con `PETRA_BASE`; producción en :3111 solo la toca el orquestador; commits solo el orquestador.
- **PAUSA (orden de SER)** con 4 agentes en vuelo → estado en `~/.claude/agents/_CEREBRO_GULEVA/pausa_21ago.md`
  y `/tmp/guleva-pausa/*.md` (copiados a `web/informes/pausa-21ago/`). Commit WIP «PAUSA 21-ago» al confirmar paradas.
- **23-ago**: SER volvió → todo en su HDMI en cuadrícula 2×2 (`PETRA_CUADRANTE`, commit 7bd5615). Explorador:
  `informes/2026-08-23-blender-mapeo-escena.md` (2º auditor de colocación con Blender: GLTFExporter→bpy BVH mundo
  + ray-cast apoyo + paridad; EIDOS bridge sin /browse). `ExportGltf` (?gltf=1) montado (bf95956). 4 constructores
  (P colocación, B materiales/luz, WEB auditoría/legal, BLENDER auditor) → CIERRE por contexto al 92 %: estados en
  `informes/pausa-21ago/`, retomada en `~/.claude/agents/_CEREBRO_GULEVA/pausa_21ago.md`.
- **23-ago tarde**: EDITOR VISUAL v2 (a951f00) en producción — juego simple: seleccionar/mover/girar/escalar/duplicar/borrar/deshacer/añadir con ratón, guardado automático. Paleta grande (C-PALETA, web-wt-PAL) pendiente de integrar.

## Día 9 (25-ago) — LA CHIMENEA, EL FUEGO Y EL SALTO GRANDE
**Hecho hoy** (commits `1be6946` → `91204ea`): chimenea del salón terminada — empotrada, apoyada en el suelo
(levitaba 24 cm), hogar con hollín, puerta de cristal con marco de hierro, y **FUEGO POR SHADER** (llama
procedural: ruido que sube en capas rojo→naranja→amarillo→blanco, textura generada en canvas, sin descargas;
`src/components/three/Fuego.tsx`, componentes `<Llama>` y `<Hoguera>`). SER: «el fuego, la madera y cómo se
quema quedó espectacular». También: `EmberGlow` (el resplandor del fuego usaba la textura del SOL, que dibuja
los 4 cristales de una ventana), mosca fuera, cajas de temporada quietas, cuadro con la lámina dentro del marco,
puerta de nosotros a su proporción, y el «punto naranja» que veía SER = el tirador del cristal visto de punta.

**CAUSAS DE FONDO HALLADAS HOY** (medidas, no supuestas):
1. La pared izquierda tiene **18 cm de grosor** (cara interior en x=−4,91): el fondo del hogar caía dentro y
   por eso «se veía la pared dentro de la chimenea».
2. **Los ajustes guardados de SER pisan el código** y, peor, **su id depende de la FORMA de la pieza**
   (firma de geometrías): al editar yo el reloj, su ajuste saltó al revistero y el reloj se fue a (0.85,3.25).
   → **RAÍZ A ARREGLAR: ids estables por posición de origen + migración de los overrides existentes.**

**INFORMES DE ox-alpha (opencode) — 1.556 líneas, ya en el repo**:
- `informes/2026-08-25-fuego-threejs-oxalpha.md` (176 l.) — la técnica del fuego que ya aplicamos.
- `informes/2026-08-25-shaders-toda-la-tienda.md` (710 l.) — **el salto grande**: materiales por shader para
  madera, yeso, tela, loza, cristal, metal y papel; CSM/`onBeforeCompile`; texturas procedurales; luz y sombra
  baratas para iGPU; post-proceso seguro; vida sin mover nada. Condición de SER: **no se toca ninguna posición**.
- `informes/2026-08-25-piezas-cc0.md` (259 l.) — modelos gratis para uso comercial (Kenney, Quaternius…).
- `informes/2026-08-25-diagnostico-visual.md` (587 l.) — herramientas para saber al instante QUÉ objeto es cada
  defecto que señala SER (GPU picking por color, inspectores, outlines, pruebas visuales).

**ORDEN ACORDADO**: (1) ids estables + migración; (2) el salto grande de materiales/luz por el TOP-10 del
informe de shaders; (3) diagnóstico visual para no volver a ir a ciegas.

### 25-ago, cierre de la jornada (orden de SER: «para y documenta todo»)
- **`ESTADO.md` NUEVO en la raíz del proyecto**: el estado real completo (qué es, cómo se trabaja, el editor,
  el problema de fondo, lo hecho en el 3D, el salto grande pendiente, mapa de ficheros y errores ya pagados).
  Es el fichero que hay que leer ANTES de tocar nada.
- **Ids estables (raíz del problema)**: implementado `idEstable()` en `src/lib/piezas.ts` (el id de una pieza
  pasa a ser la posición donde NACE en el código, no su forma) + `Overrides.tsx` sella el origen antes de
  aplicar nada + `?sinOverrides=1` + `scripts/migrar_overrides.py`.
  **Migración a medias**: salón 36/44 ✓ · entrada 32/73 (los 73 originales están a salvo en el commit
  `e3028f9`; falta afinar el emparejamiento por posición). **NO aplicar más cambios de código a las piezas
  hasta terminar esto**, o los ajustes de SER volverán a saltar.
- **Pendiente señalado por SER y sin resolver**: (1) el punto naranja dentro de la chimenea (él marcó la
  captura; el tirador ya se corrigió pero dice que sigue), (2) el péndulo del reloj apenas se ve.
- **Ids estables, arreglo del desempate** (`e7f8054`): un borrado de SER en el salón no se aplicaba porque su
  id era `@0,0,0` y ahí nacen varias piezas (incluida la sala entera). Ahora se desempata por el camino en el
  árbol. **Verificado en vivo: 7/7 eliminaciones de SER aplicadas · 34/41 ajustes enlazados.**
