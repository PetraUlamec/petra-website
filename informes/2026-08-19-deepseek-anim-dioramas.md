[0m
> build · deepseek-v4-flash-free
[0m
[0m◈ [0mExa Web Search "GitHub three.js isometric room diorama generator scene composition objects grid"
[0m◈ [0mExa Web Search "GitHub Blender bpy animation turntable camera keyframes glTF export script"
[0m◈ [0mExa Web Search "GitHub Blender bpy script animated camera orbit glTF export fcurve easing interpolation"
[0m◈ [0mExa Web Search "GitHub procedural furniture placement algorithm overlap detection grid three.js javascript"
[0m% [0mWebFetch https://github.com/ch-bas/threejs-sims-house-builder
[0m% [0mWebFetch https://github.com/lohith9/Home_View
[0m% [0mWebFetch https://github.com/glenn-de-backer/anglecraft
[0m% [0mWebFetch https://github.com/moppius/contextual-dioramas
[0m% [0mWebFetch https://raw.githubusercontent.com/ch-bas/threejs-sims-house-builder/main/components/room-organizer/lib/geometry.ts
[0m◈ [0mExa Web Search "Abdullah73k/Gemini-design-studio sanitizer "grid snap" overlap license github"
[0m◈ [0mExa Web Search "sbharga/harmony github "reachability" grid scoring harmony score license"
[0m% [0mWebFetch https://api.github.com/repos/Abdullah73k/Gemini-design-studio/git/trees/main?recursive=1
[0m% [0mWebFetch https://api.github.com/repos/sbharga/harmony/git/trees/main?recursive=1
[0m% [0mWebFetch https://raw.githubusercontent.com/sbharga/harmony/main/backend/src/harmony.py
[0m% [0mWebFetch https://raw.githubusercontent.com/Abdullah73k/Gemini-design-studio/main/src/app/api/chat/route.ts
[0m✗ [0mWebFetch https://raw.githubusercontent.com/KhronosGroup/glTF-Blender-IO/main/addons/io_scene_gltf2/blender/exp/animation/fcurves/gltf2_blender_gather_fcurves_keyframes.py failed
[91m[1mError: [0mStatusCode: non 2xx status code (404 GET https://raw.githubusercontent.com/KhronosGroup/glTF-Blender-IO/main/addons/io_scene_gltf2/blender/exp/animation/fcurves/gltf2_blender_gather_fcurves_keyframes.py)
[0m% [0mWebFetch https://api.github.com/repos/KhronosGroup/glTF-Blender-IO/git/trees/main?recursive=1
[0m% [0mWebFetch https://api.github.com/repos/zeffii/BlenderPythonRecipes
[0m% [0mWebFetch https://api.github.com/repos/MechanicalFlower/bpy_wrapper
[0m% [0mWebFetch https://api.github.com/repos/Korchy/blender_carousel
[0m% [0mWebFetch https://raw.githubusercontent.com/KhronosGroup/glTF-Blender-IO/main/addons/io_scene_gltf2/blender/exp/animation/fcurves/keyframes.py
[0m% [0mWebFetch https://api.github.com/repos/repalash/blender_gltf_timeline_markers_addon
[0m% [0mWebFetch https://api.github.com/repos/webrotate360/turntable-animator-for-blender
[0m% [0mWebFetch https://api.github.com/repos/Abdullah73k/Gemini-design-studio
[0m% [0mWebFetch https://api.github.com/repos/MrBlueBlobGuy/becor
[0m% [0mWebFetch https://api.github.com/repos/shujaamarwat/trimension
[0m% [0mWebFetch https://api.github.com/repos/lohith9/Home_View
[0m% [0mWebFetch https://api.github.com/repos/floofskii/Blender_3D_ModelViewer
# Auditoría: repos reales para animación bpy→glTF y generadores de dioramas/habitaciones isométricas

Ordenados por utilidad para tu caso concreto (un auditor three.js que agrupa meshes por pieza con AABB y detecta flotantes/solapes/fuera-de-sala, + pipeline bpy→glTF).

## Bloque A — Funciones absorbibles directamente en el auditor three.js

### 1. ch-bas/threejs-sims-house-builder — ★★★★★ (el más copiable)
- URL: https://github.com/ch-bas/threejs-sims-house-builder — Licencia: **MIT**
- Técnica: `components/room-organizer/lib/geometry.ts`
  - `itemsOverlap(a,b)` → **OBB por Separating-Axis Theorem** en plano XZ con círculo como *broad phase* (`boundingRadius` + `obbOverlap` sobre los 4 ejes normales). Elimina falsos positivos en muebles largos y delgados en diagonal.
  - `rotatedHalfExtents(item)` → AABB rotación-aware de la footprint (usa `|cos|`, `|sin|`).
  - `itemInBounds(...)` y `itemFullyOutside(...)` → tus dos checks "fuera-de-sala" (parcial vs. totalmente fuera), ya con rotación.
  - `hasCollisions(item, allItems, roomW, roomD)` → **reglas por categoría**: `security-camera` exenta de límites, `opening` (puertas/ventanas) solo colisiona con items, `outdoor` debe estar *fully outside*.
  - `snapToWall`, `snapToNeighbors`, `autoOrganize` (estrategias shelf/by-category/by-size), `snapToGrid`.
- *Qué absorber*: casi todo el fichero es directamente tu "auditor" — es la única implementación que combina solape OBB + bounds + categorías especiales en funciones puras sin dependencias.

### 2. sbharga/harmony — ★★★★☆ (penalizaciones por área y alcanzabilidad)
- URL: https://github.com/sbharga/harmony — Licencia: **GPL-3.0**
- Técnica: `backend/src/harmony.py` (puerto Python de su scorer JS)
  - `_rect_intersection_area(a,b)` y `_inside_room(rect,room)` → área de solape y área fuera-de-sala (no solo booleanos: penaliza *cuánto* sobresale).
  - `_build_grid` + `_point_rect_dist(px,pz,rect)` → rejilla de ocupación 2D (paso 0.25/0.30 m) y distancia punto→rectángulo rotado.
  - `_largest_open_region` → **BFS de región abierta conectada** (ratio open/total); `_shortest_path` + `_path_metrics` → alcanzabilidad desde la puerta y ancho mínimo de paso.
  - `_wall_hug_score`, `_facing_score`, `_zone_cohere_score`, `_adjacency_bonus`, `compute_harmony_breakdown` (score 0-100 por métrica), `build_heatmap` (células reachable/occupied), `optimize_layout`.
- *Qué absorber*: si tu auditor quiere ir más allá de "sí/no", aquí está cómo *cuantificar* solapes y bloqueos (área de intersección, puerta bloqueada, región alcanzable) y el heatmap. Cuidado con GPL si copias literalmente.

### 3. Abdullah73k/Gemini-design-studio — ★★★★☆ (sanitizer + heurísticas de composición)
- URL: https://github.com/Abdullah73k/Gemini-design-studio — Licencia: **sin fichero de licencia** (todos los derechos reservados por defecto)
- Técnica: `src/app/api/chat/route.ts`
  - `sanitizeLayout(layout, {snap, roomFallback})` → `snapValue` (round a 0.1 m), `clampWithinRoom(v, halfSize, axis)` (clamp con semiextents del objeto), y floor-rest: si el objeto no tiene `parent` ni `size.h`, fuerza `y = max(h/2, y)` → **esto es exactamente tu check de "flotante"** (el suelo se define como y=h/2).
  - El system prompt (`buildRoomDesignerPrompt`) codifica reglas de composición como reglas: margen de 0.2 m de paso entre objetos, 0.05 m de paredes, beds contra pared con 0.6-0.9 m de acceso, sillas centradas en la normal del escritorio a 0.6-0.7 m.
- *Qué absorber*: la función `clampWithinRoom` y la convención "y = h/2 ⇒ apoyado" para tu detector de flotantes; y las reglas de clearance como defaults configurables.

### 4. lohith9/Home_View — ★★★★☆ (motor de colisiones y arquitectura)
- URL: https://github.com/lohith9/Home_View — Licencia: **sin fichero de licencia**
- Técnica: `frontend/src/engine/`
  - "Collision engine: **AABB overlap detection with push-out resolution**, so furniture never stacks" → además de detectar, *resuelve* desplazando.
  - "Constraint engine: wall-attach beats corner-snap beats edge-align beats grid, each gated by distance thresholds — one resolver instead of a pile of if-statements" → resolución priorizada por umbrales de distancia.
  - "Pure-function engine layer ... outside React in `src/engine/` — testable in isolation".
- *Qué absorber*: la idea de separar el auditor como capa de funciones puras, y el patrón de "resolver único con prioridades" si quieres proponer correcciones, no solo reportarlas.

### 5. MrBlueBlobGuy/becor — ★★★☆☆ (generación de sala + pipeline glTF)
- URL: https://github.com/MrBlueBlobGuy/becor — Licencia: **Apache-2.0**
- Técnica: `src/editor/` (room generation, editor interactions) y `assets/primitives` (GLTF furniture); export/import del estado de sala en JSON portable (`.solo`).
- Destaca: cámara ortográfica isométrica con pan/zoom, click-to-place y drag-and-drop, snap a grid, librería GLTF con manifiesto de assets, "procedural room generation with editable wall height/thickness/finish".
- *Qué absorber*: la convención de manifiesto de assets GLTF con dimensiones por pieza (base para tu agrupado por pieza) y el esquema de JSON de escena.

### 6. moppius/contextual-dioramas — ★★★☆☆ (dioramas procedimentales con contexto)
- URL: https://github.com/moppius/contextual-dioramas — Licencia: **MIT**
- Técnica: `src/` — dioramas 3D generados proceduralmente "using contextual information": los objetos se disponen según el contexto de la sala (no en grid arbitrario).
- *Qué absorber*: siendo MIT, es el candidato más limpio si quieres reglas de composición de dioramas (qué se apoya en qué) sin fricción de licencia; útil para definir jerarquías pieza→suelo/estructura.

## Bloque B — Pipeline bpy→glTF (keyframes, easing, turntables, cámaras orbitales)

### 7. KhronosGroup/glTF-Blender-IO — ★★★★★ (la referencia del puente bpy→glTF)
- URL: https://github.com/KhronosGroup/glTF-Blender-IO — Licencia: **Apache-2.0**
- Técnica: `addons/io_scene_gltf2/blender/exp/animation/fcurves/keyframes.py`
  - `gather_fcurve_keyframes(...)` → extrae frames (`keyframe_points[].co[0]`), filtra por `gltf_negative_frames`/`gltf_frame_range`, evalúa `fcurve.evaluate(frame)` para cada canal, y para interpolación `BEZIER` **calcula tangentes cúbicas** a partir de los handles (`handle_left/handle_right`) — el equivalente glTF de tu easing Blender.
  - `gather_non_keyed_values(...)` → rellena canales no keyframed (location/rotation/scale parciales) para completar el vector.
  - `sampler.py` (mismo dir) decide interpolación; junto con el issue #2137: glTF exige **una sola interpolación por canal** (CONSTANT→STEP), sin `Cycle` modifiers, y unidades en segundos (no frames).
- *Qué absorber*: la lógica de "sampling de fcurves + tangentes BEZIER→cubic" si quieres *bakear* animación bpy a glTF sin depender del addon UI; y las limitaciones de formato (no puedes llevar easing arbitrario tal cual).

### 8. glenn-de-backer/anglecraft — ★★★★☆ (generación de órbitas/cámaras por código)
- URL: https://github.com/glenn-de-backer/anglecraft — Licencia: **GPL-3.0**
- Técnica: `anglecraft/` — **una sola cámara maestra keyframed** (`AngleCraft_Cam`) en vez de N cámaras; distribuciones matemáticas de posiciones sobre esfera: Fibonacci (evita polos), Uniform, Linear, Half-sphere, Weighted, AI Blueprint (cardinals + isométricos); nube de Empties de preview; auto-ocultar floor cuando la cámara baja del horizonte; swap de HDRI por frame.
- *Qué absorber*: las fórmulas de distribución de puntos en esfera (Fibonacci sphere) y el patrón "una cámara + keyframes" — es lo que exporta bien a glTF.

### 9. zeffii/BlenderPythonRecipes — ★★★★☆ (turntable scripteado mínimo)
- URL: https://github.com/zeffii/BlenderPythonRecipes — Licencia: **GPL-2.0**
- Técnica: Wiki "Scripted Keyframes" → Snippet 1:
  - `cam.parent = empty`; `empty.rotation_euler[2] = gamma * i; empty.keyframe_insert(data_path='rotation_euler', frame=i, index=-1)` con `gamma = 2π/num_frames`. Turntable orbital de 8 líneas.
- *Qué absorber*: el patrón "parentear cámara a un Empty y keyframear la rotación del Empty" es el truco estándar para que la órbita exporte limpia a glTF (la cámara solo hereda).

### 10. webrotate360/turntable-animator-for-blender — ★★★☆☆ (turntable multi-fila, MIT)
- URL: https://github.com/webrotate360/turntable-animator-for-blender — Licencia: **MIT**
- Técnica: `wr360_ot_animate.py` (operador de animación) + `wr360_panel.py`: Frames Per Row (20-80), multi-row/hemisférico con Vertical Step, anima el **objeto seleccionado** (no la cámara) para que luces/fondos queden quietos; parentear multi-mesh a un Empty en el centro de rotación.
- *Qué absorber*: la decisión objeto-vs-cámara y los parámetros de filas/step para turntables de producto; MIT ⇒ puedes copiar el operador.

### 11. repalash/blender_gltf_timeline_markers_addon — ★★★☆☆ (markers→glTF→three.js)
- URL: https://github.com/repalash/blender_gltf_timeline_markers_addon — Licencia: **sin fichero de licencia**
- Técnica: `__init__.py` — extensión custom `WEBGI_animation_markers` en la escena glTF que exporta markers del timeline con binding a cámara; en three.js, plugin de `GLTFLoader` que convierte los markers en un `AnimationClip` con track `currentTimelineMarker` (discretos) y dispara eventos `animationTimelineMarker`.
- *Qué absorber*: el puente completo markers-Blenbder→eventos three.js; útil para anclar *key shots* de tu turntable/cámara a momentos concretos de la animación.

### 12. MechanicalFlower/bpy_wrapper — ★★★☆☆ (turntable CLI headless)
- URL: https://github.com/MechanicalFlower/bpy_wrapper — Licencia: **GPL-3.0**
- Técnica: `examples/turntable.py` (CLI: `turntable --model ./x.glb --output render/`) — render 360 de modelos `.3ds/.fbx/.ply/.obj/.stl/.glb` en batch; wrapper de la API bpy para scripting fácil.
- *Qué absorber*: el arranque headless de Blender (`blender empty.blend --python ...`) y la estructura de wrapper que encadena import→framing→cámara→render; útil si quieres generar turntables glTF en CI. (Alternativa del mismo valor: `floofskii/Blender_3D_ModelViewer`, sin licencia, con `adjust_camera_distance()` por bounding-box y `rotate_camera_around_mesh()`.)

---

## Resumen de "qué absorber en el auditor"
| Función | Fuente | Uso en tu auditor |
|---|---|---|
| `itemsOverlap` (OBB-SAT + broad phase) | ch-bas (MIT) | Detección de solapes rotados |
| `itemInBounds` / `itemFullyOutside` | ch-bas (MIT) | Fuera-de-sala parcial/total |
| `hasCollisions` (reglas por categoría) | ch-bas (MIT) | Excepciones por tipo (cámaras, openings, outdoor) |
| `_rect_intersection_area` / `_inside_room` | harmony (GPL) | Cuantificar solape / sangría fuera de sala |
| `_largest_open_region` / `_shortest_path` | harmony (GPL) | Alcanzabilidad y bloqueo de paso |
| `sanitizeLayout` + `y=h/2` | Gemini-design-studio | Detección de **flotantes** y clamp |
| `clampWithinRoom` con semiextents | Gemini-design-studio | Límites rotación-aware |
| Tangentes BEZIER→cubic | glTF-Blender-IO (Apache) | Bakear easing bpy→glTF |
| Esfera Fibonacci + cámara maestra | anglecraft (GPL) | Órbitas/turntables por código |

Advertencia de licencias: **MIT** (ch-bas, webrotate360, moppius) y **Apache-2.0** (glTF-Blender-IO, becor) permiten absorción directa; **GPL** (harmony, anglecraft, zeffii, bpy_wrapper) requiere que tu derivado sea GPL o reimplementar la lógica; **sin licencia** (Gemini-design-studio, Home_View, repalash, floofskii) no da derechos de copia legales — úsalo como referencia de diseño, no como código literal.
