# REALISMO EN TIEMPO REAL EN NUESTRO STACK — docs verificadas (explorador, 21/22-ago-2026)

**Para qué:** SER dice que al diorama de Petra & Erik le falta la disciplina *isometric environment modeling*. Ya hay dos informes
(`2026-08-20-isometric-env-art.md` = el POR QUÉ artístico y `2026-08-20-env-pipeline-blender.md` = pipeline Blender→GLB). **Este informe es el CÓMO en el navegador**,
con nuestro stack exacto y sin descargar nada en runtime (web autocontenida: texturas en canvas/shader, `three/addons`, drei).

**Stack medido en `node_modules` (no de memoria):** three **0.185.1** · @react-three/fiber **9.7.0** · @react-three/drei **10.7.8** ·
@react-three/postprocessing **3.0.5** · postprocessing **6.39.4** · n8ao **2.0.1** (transitiva) · three-stdlib **2.36.1** · three-mesh-bvh **0.8.3** (transitiva) · maath 0.10.8.

**Método:** (1) leer el código instalado (`.d.ts` y `.js` de drei/postprocessing/three) — es la fuente primaria real de qué props existen;
(2) medir triángulos con un script Node sobre three 0.185 (pegado abajo); (3) docs oficiales (threejs.org/docs, drei.docs.pmnd.rs, pmndrs/postprocessing, n8ao README)
+ issues/PRs de GitHub cuando algo parecía roto; (4) dos consultas a opencode: **`deepseek-v4-flash-free` falló las 4 veces** («Unexpected server error», id listado
como `opencode/opencode/deepseek-v4-flash-free`), así que corrieron con el fallback **`hy3-free`** → lo marco como **[hy3]** y es **NO verificado** salvo que diga lo contrario.

Convención: **CONFIRMADO** = lo leí en código/doc oficial o lo medí · **PROBABLE** = fuente secundaria o deducción · **[hy3]** = opinión del modelo.

---

## 0 · LO QUE YA ESTÁ MAL EN LA ESCENA ACTUAL (encontrado leyendo código — corregir ANTES de los 3 pases)

Estos cuatro puntos valen más que cualquier técnica nueva, porque hoy están anulando trabajo ya hecho:

### 0.1 El ACES que ponemos en `onCreated` NO se aplica: `<EffectComposer>` fuerza `NoToneMapping` — CONFIRMADO
- `SceneShell.tsx` hace `gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.2`.
- `@react-three/postprocessing` 3.0.5, `dist/index.js` (componente `EffectComposer`): al montar hace `je.acquire(g, NoToneMapping), g.toneMapping = NoToneMapping` y lo restaura al desmontar.
  Defaults del composer: `multisampling: 8`, `frameBufferType: HalfFloatType`.
- Y además three **0.185** solo aplica el tone mapping del renderer si `currentRenderTarget === null` (`src/renderers/webgl/WebGLPrograms.js` L178-184); guía de migración r182:
  «The inline tone mapping controlled via WebGLRenderer.toneMapping only works when rendering to screen now» — https://github.com/mrdoob/three.js/wiki/Migration-Guide
- Los materiales de pantalla completa de postprocessing son `toneMapped: false` (`postprocessing/build/index.js`, varias clases).
- `Effects.tsx` NO tiene `<ToneMapping>` en ninguno de los 3 niveles (low/mid/high) → **la imagen sale sin curva de tono: blancos cortados a saco, «look de juego plano»**.
- README de postprocessing: «When using postprocessing, the `toneMapping` setting on the renderer should be set to `NoToneMapping` (default) and high precision frame buffers should be enabled
  ... To enable tone mapping, use a `ToneMappingEffect` at the end of the pipeline.» — https://github.com/pmndrs/postprocessing/blob/main/README.md
- **Arreglo** (ver §2.11): añadir `<ToneMapping mode={ToneMappingMode.AGX} />` (o ACES_FILMIC / NEUTRAL) como penúltimo efecto (antes de SMAA). `toneMappingExposure` SÍ le llega
  (three lo setea en cada `refreshMaterial`, `WebGLRenderer.js` L2709, y el shader del efecto incluye `<tonemapping_pars_fragment>`).

### 0.2 `scene.environmentIntensity = 0.7` queda pisado por `<Environment>` (vuelve a 1) — CONFIRMADO
- `drei/core/Environment.js` `setEnvProps()` aplica defaults `environmentIntensity: 1, environmentRotation: [0,0,0]` en un `useLayoutEffect` (posterior a `onCreated`).
- **Arreglo:** `<Environment resolution={128} frames={1} environmentIntensity={0.7}>` (prop existe en `Environment.d.ts`; doc: «only works with three 0.163 and up»).
  https://drei.docs.pmnd.rs/staging/environment

### 0.3 `<Canvas shadows>` pide `PCFSoftShadowMap`, que three 0.185 DEPRECA y sustituye por `PCFShadowMap` con warning — CONFIRMADO
- R3F 9.7.0 (`dist/events-*.esm.js` L15880-15892): `shadows===true → PCFSoftShadowMap`; `"basic"|"percentage"|"soft"|"variance"` → Basic/PCF/PCFSoft/VSM; objeto → `Object.assign(gl.shadowMap, obj)`.
- three 0.185 `WebGLShadowMap.js` L99-102: `warn('WebGLShadowMap: PCFSoftShadowMap has been deprecated. Using PCFShadowMap instead.')`.
- Migración r182: «PCFSoftShadowMap with WebGLRenderer is now deprecated. Use PCFShadowMap which is now soft as well.» Issue R3F #3749 cerrado; PR #3748 cerrado porque «v10 does this» (R3F 10, no la nuestra).
  https://github.com/pmndrs/react-three-fiber/issues/3749 · https://github.com/mrdoob/three.js/issues/32591 (regresión de pixelado en r182, arreglada en r183 por PR #32593)
- **Arreglo:** `<Canvas shadows="percentage">` (o `shadows="variance"` para VSM, §2.1). Mismo resultado visual que hoy, sin warning, y abre la puerta a `shadow-radius` (que AHORA sí funciona con PCF).

### 0.4 `<SoftShadows>` (PCSS) de drei 10.7.8 está ROTO con three ≥0.182 — CONFIRMADO (no lo uses)
- `drei/core/softShadows.js`: inyecta `return PCSS(shadowMap, shadowCoord);` con `.replace('#if defined( SHADOWMAP_TYPE_PCF )', …)` (PRIMERA aparición) y muestrea con
  `unpackRGBAToDepth(texture2D(shadowMap, …))`.
- En three 0.185 el chunk `shadowmap_pars_fragment.glsl.js` tiene esa línea 6 veces (la 1ª, L18, es la declaración `uniform sampler2DShadow directionalShadowMap[]` → el `return` cae fuera de
  función), el sampler es `sampler2DShadow` (L117) y define su propio `vogelDiskSample` (L104) → redefinición. El shadow map ya es `DepthTexture` con `compareFunction` (L227-263).
- Issue drei #2583 «SoftShadows broken with three.js r182 (unpackRGBAToDepth removed)», cerrado con milestone **«Version 11 (WebGPU)»** = no hay fix en drei 10; el `master` de
  `src/core/softShadows.tsx` sigue igual (comprobado en raw.githubusercontent.com). https://github.com/pmndrs/drei/issues/2583
- Alternativas que SÍ funcionan en 0.185: PCF nuevo con `shadow-radius` (§2.1), VSM (§2.1), `AccumulativeShadows` (§2.2). Lo mismo aplica a **three-good-godrays** (peer `three <= 0.182.0`, §3.2).

---

## PASE 1 · BISEL (bordes que atrapan la luz)

> El por qué perceptivo está en el informe 1 §3 («un borde duro es el cliché del 3D de videojuego»). Aquí: cómo, cuánto cuesta, y qué API usar.

### 1.1 `RoundedBoxGeometry` de `three/addons` — la opción por defecto para TODAS las cajas
- **Qué es:** `new RoundedBoxGeometry(width=1, height=1, depth=1, segments=2, radius=0.1)`; import `three/addons/geometries/RoundedBoxGeometry.js`
  (el alias `three/addons/*` → `examples/jsm/*` está en `three/package.json` `exports`). Doc: https://threejs.org/docs/pages/RoundedBoxGeometry.html
- **Por qué vende realismo:** las normales del bisel giran 90° en `radius` → reciben el highlight de la direccional y el reflejo del `Environment` (Lightformers) en una línea fina
  paralela a la arista: el *edge catch-light*. Sin bisel la arista es un escalón de luminancia sin brillo = cartón.
- **Coste MEDIDO (three 0.185, Node, caja 1×1×1, r=0.05):**

  | geometría | tris | verts |
  |---|---|---|
  | `BoxGeometry` | 12 | 24 |
  | `RoundedBoxGeometry segments=1` | **108** | 324 |
  | `segments=2` (default) | 300 | 900 |
  | `segments=3` | 588 | 1764 |
  | `segments=4` | 972 | 2916 |
  | `segments=6` | 2028 | 6084 |

  → **`segments=1` ya da el catch-light** (una banda de normales a 45°); `segments=2` es el punto dulce para tazas/latas cercanas. 300 cajas × 108 tris = 32k tris: nada para una iGPU.
  Script de medición: `node --input-type=module -e "import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'; …"` desde `web/` (está en la sesión del explorador).
- **Radio relativo (regla práctica):** **[hy3]** 0,5–2 % de la dimensión mayor del objeto (mostrador 1,2 m → 6-24 mm; taza 8 cm → 0,4-1,6 mm); nunca menor que ~1 px en pantalla o parpadea.
  Con nuestro zoom orto, un radio de 1 cm en una pieza de 1 m sale a ~1-3 px: visible, no «hinchado».
- **Snippet R3F 9 (geometría compartida, una por tamaño):**
  ```tsx
  import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
  const geoCache = new Map<string, RoundedBoxGeometry>();
  export function roundedBox(w: number, h: number, d: number, r = Math.min(w, h, d) * 0.04, seg = 1) {
    const k = `${w}|${h}|${d}|${r}|${seg}`;
    if (!geoCache.has(k)) geoCache.set(k, new RoundedBoxGeometry(w, h, d, seg, r));
    return geoCache.get(k)!;
  }
  // uso: <mesh geometry={roundedBox(1.2, 0.9, 0.6)} material={woodMat} castShadow receiveShadow />
  ```
- **UVs:** `RoundedBoxGeometry` genera UV por cara (cada cara 0-1, como `BoxGeometry`) → nuestras texturas de canvas con `repeat` siguen funcionando igual que hoy. CONFIRMADO leyendo el addon.
- **Trampa:** `radius` debe ser < min(w,h,d)/2 o la geometría se cruza (PROBABLE: lo dice el hilo del foro de la técnica vertex-shader y es geometría básica).

### 1.2 `<RoundedBox>` de drei 10.7.8 — NO es lo mismo: es un `ExtrudeGeometry` biselado — CONFIRMADO leyendo `drei/core/RoundedBox.js`
- Props reales (`RoundedBox.d.ts`): `args=[w,h,d]`, `radius=0.05`, `smoothness=4`, `bevelSegments=4`, `steps=1`, `creaseAngle=0.4`. Construye un `THREE.Shape` con 4 `absarc`,
  lo extruye con `bevelEnabled`, `bevelSegments: bevelSegments*2`, `curveSegments: smoothness`, centra y aplica `toCreasedNormals(geom, creaseAngle)` (three-stdlib).
- **Coste MEDIDO:** `smoothness=4,bevelSegments=4` (defaults) = **1292 tris**; `2,2` = 396; `1,1` = 140; `2,1` = 236. → con defaults es **12× más caro** que `RoundedBoxGeometry segments=1`.
- **UVs:** las de `ExtrudeGeometry` (generador por coordenadas del shape, no 0-1 por cara) → la veta de madera procedural sale con otra escala/orientación que en las cajas normales.
  PROBABLE (comportamiento documentado de ExtrudeGeometry; no lo he renderizado).
- **Veredicto:** `<RoundedBox>` para piezas de color plano/sin textura y pocas unidades; **`RoundedBoxGeometry` para todo lo demás**. Doc: https://drei.docs.pmnd.rs/shapes/rounded-box

### 1.3 Cilindros, tazas, tarros y latas con bisel: `LatheGeometry` con perfil redondeado — CONFIRMADO (medido)
- `CylinderGeometry(0.5,0.5,1,24)` = 96 tris. Perfil torneado con bisel de 3 segmentos arriba y abajo, 24 segmentos radiales = **432 tris**. Cuarto del coste de un `<RoundedBox>` default.
- Snippet (perfil → `LatheGeometry`; sirve para tazas con pared y fondo si añades puntos interiores):
  ```tsx
  import * as THREE from "three";
  export function bevelCylinder(r: number, h: number, bevel = r * 0.08, radial = 24, bevelSegs = 3) {
    const pts: THREE.Vector2[] = [new THREE.Vector2(0, 0), new THREE.Vector2(r - bevel, 0)];
    for (let i = 1; i <= bevelSegs; i++) { const a = (i / bevelSegs) * Math.PI / 2; pts.push(new THREE.Vector2(r - bevel + Math.sin(a) * bevel, bevel - Math.cos(a) * bevel)); }
    pts.push(new THREE.Vector2(r, h - bevel));
    for (let i = 1; i <= bevelSegs; i++) { const a = (i / bevelSegs) * Math.PI / 2; pts.push(new THREE.Vector2(r - bevel + Math.cos(a) * bevel, h - bevel + Math.sin(a) * bevel)); }
    pts.push(new THREE.Vector2(0, h));
    return new THREE.LatheGeometry(pts, radial);
  }
  ```
  Doc LatheGeometry: https://threejs.org/docs/pages/LatheGeometry.html (perfil en el plano XY, revolución sobre Y).

### 1.4 Bisel por vertex shader (sin geometría nueva) — alternativa PROBABLE, no la recomiendo como base
- Técnica de prisoner849/Fyrestar (jun-2019): `transformed = signs * subBox + normalize(position) * radius` sobre un `BoxGeometry` con segmentos; con `MeshStandardMaterial` las normales se
  evalúan por fragmento y el envmap no se deforma. https://discourse.threejs.org/t/cheap-round-edged-box-vertex-shader/8066
- Ventaja: misma geometría para cajas de tamaño dinámico. Desventaja: necesita `onBeforeCompile` en cada material + segmentos en el box (al final no ahorra nada frente a 108 tris) y distorsiona en caras oblicuas.
  Para un diorama estático, `RoundedBoxGeometry` es más simple y más barato en mantenimiento.

### 1.5 Qué hace que el bisel «se vea» (sin esto biselar no sirve) — CONFIRMADO en docs
- Necesita **algo que reflejar**: el `Environment` con Lightformers que ya tenemos (§2.8) y `roughness` ≤ 0,6 en el material. Con `roughness 0.9` (yeso) el bisel solo se nota por AO/sombra.
- **Normales suaves solo en el bisel**: `RoundedBoxGeometry` ya las trae; si generas geometría propia usa `toCreasedNormals(geometry, creaseAngle)` de `three-stdlib` (lo usa drei) para
  suavizar el bisel sin redondear las caras planas.
- **Prioridad de piezas** **[hy3]**: latón/cristal primero (especulares revelan el borde), cerámica después, yeso/madera al final. Y 2-3 segmentos en lo cercano (tazas) y 1 en lo lejano.

---

## PASE 2 · BAKING Y LUZ

### 2.1 Sombras en three 0.185: el PCF nuevo y VSM — CONFIRMADO leyendo `WebGLShadowMap.js` y `shadowmap_pars_fragment.glsl.js`
- **PCF (r182+)**: shadow map = `DepthTexture` con `compareFunction` → muestreo por hardware `sampler2DShadow` (4 taps bilineales) × **5 muestras en disco de Vogel rotadas por
  ruido IGN por píxel** = «effectively 20 filtered taps». `shadow.radius` ahora **sí** actúa: `radius = shadowRadius * texelSize` (L132 del chunk). Release r182:
  «PCF shadow filtering with Vogel disk sampling and IGN (#32381, #32407)» https://github.com/mrdoob/three.js/releases/tag/r182
- **Props útiles en `LightShadow` (doc https://threejs.org/docs/pages/LightShadow.html):** `radius` (default 1; «High values will cause unwanted banding ... a greater map size will allow for a
  higher value»), `bias`, `normalBias` («reduce shadow acne especially ... at a shallow angle»), `intensity` (default 1, rango [0,1] — **sombras menos negras = interior con rebote**), `mapSize` (potencia de 2).
- **Snippet (nuestra direccional, calidad mid/high):**
  ```tsx
  <Canvas shadows="percentage" …>   {/* = PCFShadowMap; evita el warning de PCFSoft */}
  <directionalLight position={[6, 9, 3]} intensity={2.5} color="#ffe0a8" castShadow
    shadow-mapSize={[2048, 2048]} shadow-radius={4} shadow-normalBias={0.02} shadow-bias={-0.0002} shadow-intensity={0.85}
    shadow-camera-left={-9} shadow-camera-right={9} shadow-camera-top={9} shadow-camera-bottom={-9} />
  ```
  Coste: el mismo de hoy (5 taps fijos; `radius` no añade muestras). El ruido IGN lo limpia el SMAA/`multisampling`.
  Valores de `radius` 3-8 a 2048: PROBABLE (deducido del shader; ajustar mirando).
- **VSM** (`shadows="variance"`): mapa de varianza + blur separable en GPU con `shadow.blurSamples` (default 8) y `shadow.radius` → penumbra ancha y uniforme a coste casi constante.
  Trampas (código L515): con VSM los objetos `receiveShadow` también se renderizan en el shadow pass (coste) y tiene *light bleeding* clásico en contactos. Ejemplo oficial `webgl_shadowmap_vsm`.
- **`PCFSoftShadowMap`**: deprecado (§0.3). **`<SoftShadows>`**: roto (§0.4).
- **Luz puntual con sombras** (la «brasa» del rincón): un `pointLight castShadow` = 6 renders de shadow map (cubo). No activar sombras en las velas; usar `ContactShadows`/AO para asentarlas.

### 2.2 `<AccumulativeShadows>` + `<RandomizedLight>` — sombra de suelo «tipo GI» a coste 0 tras acumular — CONFIRMADO (d.ts + doc)
- Doc: «a planar, Y-up oriented shadow-catcher that can accumulate into soft shadows and has zero performance impact after all frames have accumulated». Props (`AccumulativeShadows.d.ts`):
  `frames=40`, `blend=20` (código; la doc dice 100), `limit=Infinity`, `scale`, `temporal`, `opacity=1`, `alphaTest=0.75` (código; doc 0.65), `color`, `colorBlend=2`, `resolution=1024`, `toneMapped`.
  `RandomizedLight`: `frames=1`, `radius=1`, `amount=8`, `intensity=Math.PI` (three≥155), `ambient=0.5`, `castShadow`, `bias=0.001`, `mapSize=512`, `size=5`, `near=0.5`, `far=500`.
  https://drei.docs.pmnd.rs/staging/accumulative-shadows
- **Qué da:** sombras de contacto del SUELO con penumbra física (muchas direccionales jitter acumuladas) — exactamente la «sombra de maqueta» de los dioramas de ArtStation.
  **Qué NO da:** sombras sobre paredes/estanterías (solo el plano), y no sigue a objetos que se mueven (los `FlyingItem` tendrán que ir fuera o re-acumular con `temporal`).
- Snippet (suelo de cada sala; `RandomizedLight` apuntando como el sol de la ventana):
  ```tsx
  <AccumulativeShadows temporal frames={60} alphaTest={0.8} scale={14} opacity={0.85} color="#4a2f1a" colorBlend={1.5} position={[0, 0.005, 0]}>
    <RandomizedLight amount={8} radius={2.5} ambient={0.5} intensity={Math.PI} position={[6, 9, 3]} bias={0.001} mapSize={1024} size={18} />
  </AccumulativeShadows>
  ```
  Coste: 60 frames × 8 shadow maps al cargar (~1-2 s en iGPU, PROBABLE), luego un plano con textura. Ojo: es un `Mesh` plano con `alphaTest` → N8AO lo ve como opaco si `depthWrite` (lo trata bien; README n8ao §Transparency).

### 2.3 `<ContactShadows>` — la falsa barata para asentar props — CONFIRMADO leyendo `ContactShadows.js`
- Cómo funciona de verdad: renderiza la escena con `MeshDepthMaterial` desde una cámara orto **mirando hacia arriba desde el plano**, y difumina con `HorizontalBlurShader`/`VerticalBlurShader`
  (dos pasadas, `smooth` añade una 3ª al 40 %). **No depende de ninguna luz**: es oscuridad por cercanía al plano. Props: `opacity, width, height, blur, near, far, smooth, resolution, frames, scale, color, depthWrite`.
  Doc: «Since this is a rather expensive effect you can limit the amount of frames it renders when your objects are static» → `frames={1}`. https://drei.docs.pmnd.rs/staging/contact-shadows
- Dónde: bajo mostrador, estanterías, tarros del suelo; NO sirve para sombras en pared. Con `frames={1}` el coste tras el primer frame es un plano.
  Snippet: `<ContactShadows position={[0,0.01,0]} scale={[14,14]} blur={2.2} far={1.2} resolution={512} opacity={0.55} color="#2a1a0e" frames={1} />`
  (`far` ≈ altura máxima que «proyecta»: con 1,2 m solo lo bajo proyecta, que es lo creíble).

### 2.4 `<BakeShadows>` — congelar los shadow maps (escena estática) — CONFIRMADO leyendo `BakeShadows.js`
- Todo el componente: `gl.shadowMap.autoUpdate = false; gl.shadowMap.needsUpdate = true` (y lo revierte al desmontar). Coste por frame de sombras → 0 mientras nada se mueva.
- Trampa: cualquier objeto que se mueva (vela que parpadea NO mueve geometría; los `FlyingItem` sí) necesita `gl.shadowMap.needsUpdate = true` en su `useFrame` mientras vuela.

### 2.5 Lightmaps horneados EN EL NAVEGADOR: qué existe de verdad
1. **`ProgressiveLightMap` de three/addons (oficial, by zalo)** — CONFIRMADO leyendo `examples/jsm/misc/ProgressiveLightMap.js` (0.185) y el ejemplo `webgl_shadowmap_progressive`.
   - API: `new ProgressiveLightMap(renderer, res=1024)`; `plm.addObjectsToLightMap([meshes..., lights...])` («Sets these objects' materials' lightmaps and modifies their uv1's»);
     `plm.update(camera, blendWindow=100, blurEdges=true)` cada frame mientras acumula; `showDebugLightmap(visible)`. Solo `WebGLRenderer` (hay `ProgressiveLightMapGPU.js` para WebGPU).
   - Cómo acumula: en el ejemplo, 8 direccionales cuyo `position` se jitterea cada frame con `Math.random() * params['Light Radius']` alrededor de `lightOrigin` → promedio en espacio de textura =
     sombras suaves + **oclusión** horneadas en `material.lightMap` de cada objeto (el propio objeto, no solo el suelo). https://threejs.org/examples/#webgl_shadowmap_progressive
   - **Requisito que nos afecta:** empaqueta las UV de cada objeto en un atlas (cajas por objeto) y asume UV **sin solapes** dentro de 0-1. `BoxGeometry`/`RoundedBoxGeometry` tienen las 6 caras
     solapadas en 0-1 → las caras se pisarían. Hay que darles una UV «desplegada» (3×2) antes. Sketch (PROPUESTA, no probada):
     ```ts
     // 6 caras → atlas 3x2 según el eje dominante de la normal (vale para Box y RoundedBox)
     function unwrapBox(g: THREE.BufferGeometry) {
       const uv = g.attributes.uv, n = g.attributes.normal, out = new Float32Array(uv.count * 2);
       for (let i = 0; i < uv.count; i++) {
         const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
         const face = ax >= ay && ax >= az ? (n.getX(i) > 0 ? 0 : 1) : ay >= az ? (n.getY(i) > 0 ? 2 : 3) : (n.getZ(i) > 0 ? 4 : 5);
         out[i * 2] = (uv.getX(i) * 0.96 + 0.02 + (face % 3)) / 3; out[i * 2 + 1] = (uv.getY(i) * 0.96 + 0.02 + Math.floor(face / 3)) / 2;
       }
       g.setAttribute("uv", new THREE.BufferAttribute(out, 2)); // ProgressiveLightMap copia 'uv' → 'uv1'
     }
     ```
     Con ese despliegue las texturas de canvas (que usan `uv`) se verían a 1/3 de escala → mejor: dejar `uv` intacta y generar directamente `uv1` desplegada (el addon lee `uv` para crear `uv1`;
     habría que copiar su lógica de empaquetado o pasarle una geometría clon). Es trabajo de constructor, no de explorador.
   - Coste: 1 render del atlas por frame durante la acumulación (p.ej. 100-300 frames al entrar en la sala), luego CERO: es un `lightMap`. En iGPU: PROBABLE 2-5 s de «calentar».
2. **`@react-three/lightmap`** (pmndrs/unframework) — v0.0.8, peer `three >=0.128`, `@react-three/fiber >=8`, dev `react ^18`; README con `boxBufferGeometry` (API de 2021).
   **Sin mantenimiento 4 años; no verificado con R3F 9/React 19: PROBABLE que no funcione.** https://github.com/pmndrs/react-three-lightmap
3. **`three-gpu-pathtracer`** (gkjohnson): path tracer, NO baker. El issue #5 «Add light mapping / AO baking demo» (nov-2021) sigue abierto, `help wanted`. https://github.com/gkjohnson/three-gpu-pathtracer/issues/5
   La demo `lucas-jones/three-lightmap-baker` (xatlas + mesh-bvh) es un experimento sin npm, sin rebote, «High casts can cause the WebGL context to timeout». https://github.com/lucas-jones/three-lightmap-baker
4. **AO por vértice horneado al cargar con `three-mesh-bvh`** (ya está en node_modules como transitiva de drei) — PROPUESTA, no verificada: por cada vértice lanzar N rayos en hemisferio
   (`MeshBVH.raycastFirst`) contra la sala estática, guardar `1 - ocluidos/N` en `color` y poner `vertexColors` en el material (se multiplica con `map`). 50k vértices × 16 rayos con BVH es
   trabajo de cientos de ms; hacerlo en un Worker o por trozos. Es AO «de verdad» (no screen-space) y sobrevive al zoom; N8AO quedaría para el detalle fino. API: https://github.com/gkjohnson/three-mesh-bvh

   **Veredicto:** lo viable y oficial es **`ProgressiveLightMap`** (con el despliegue de UV) — y mientras tanto `AccumulativeShadows` (suelo) + `BakeShadows` + N8AO ya son «baking» a efectos de coste.

### 2.6 N8AO 2.0.1 para interiores en orto — CONFIRMADO (README local en `.pnpm/n8ao@2.0.1…/README.md` y `N8AO.d.ts` del wrapper)
- «It works with logarithmic depth buffers and **orthographic cameras**» (README §N8AOPass).
- Los 4 parámetros que importan: `aoRadius` («one or two magnitudes less than scene scale: if your scene is 10 units across, the radius should be between 0.1 and 1» — la sala mide ~9 → 0,3-0,9;
  el 0.6 actual está bien), `distanceFalloff` («choosing 1.0 is a safe value ... Decreasing it reduces haloing»), `intensity` («2 ... soft ... 5 ... heavily prominent» — el 2.6 actual es sensato),
  `color` (el marrón actual = AO cálido, bien).
- `halfRes: true` = «2x-4x» más rápido; «half-res mode at Ultra quality is slightly slower than full-res Performance, but produces significantly better results» → para **mid** prueba `halfRes quality="high"`.
- **`accumulate`** (solo vía `ref`: `ref.current.configuration.accumulate = true`, con `denoiseRadius 0`, `denoiseSamples 1`): acumula temporalmente cuando la cámara está quieta — **nuestra cámara orto
  está quieta casi siempre** → AO limpia gratis. Se desactiva sola al mover la cámara; objetos que se mueven se emborronan (los FlyingItem). Props del wrapper: `aoRadius, distanceFalloff, intensity,
  quality ('performance'|'low'|'medium'|'high'|'ultra'), aoSamples, denoiseSamples, denoiseRadius, color, halfRes, depthAwareUpsampling, screenSpaceRadius, renderMode, ref`.
  Modos «Neural-Low/Medium/High» (nuevos en 2.0) solo con `ref.current.setQualityMode("Neural-Low")`. Cambiar calidad recompila shaders: hacerlo una vez.
- Transparencias: «all transparent objects will be rendered twice» cuando hay transparencia → el haz de luz, el polvo y el cristal cuentan doble; marcar lo que no deba ocluir con `userData.treatAsOpaque`.

### 2.7 Luz de ventana creíble sin HDR: `RectAreaLight` — CONFIRMADO en doc
- «This class emits light uniformly across the face a rectangular plane ... simulate light sources such as bright windows or strip lighting». «There is no shadow support.» «Only PBR materials are supported.»
  Hay que `RectAreaLightUniformsLib.init()` (`three/addons/lights/RectAreaLightUniformsLib.js`) una vez. https://threejs.org/docs/pages/RectAreaLight.html
- Para qué: el «relleno» de la ventana con caída física y highlights alargados en madera barnizada/latón (una direccional no da ese highlight de área). La sombra la sigue dando la direccional.
  Snippet: `<rectAreaLight args={["#fff1d6", 6, 1.6, 2.2]} position={[1.6, 1.6, -4.6]} rotation={[0, Math.PI, 0]} />` (mirando hacia dentro). Coste: shader algo más caro por píxel iluminado; 1-2 por sala.

### 2.8 `Environment` sin HDR externo: Lightformers + reflejos «de habitación» — CONFIRMADO
- Lo actual (`<Environment resolution={128} frames={1}>` + 3 `Lightformer`) es la vía correcta y autocontenida: «It will render the contents into an off-buffer and film a single frame with a cube camera»;
  `Lightformer` «will act like a real light without the expense, you can have as many as you want» (props `form rect|circle|ring`, `intensity`, `color`, `scale`, `target`).
  https://drei.docs.pmnd.rs/staging/lightformer · https://drei.docs.pmnd.rs/staging/environment
- Mejoras baratas: `resolution={256}` (coste solo al inicio; reflejos de cristal/latón menos «cuadrados»); un `Lightformer form="rect"` CÁLIDO en la posición de la ventana y otro frío-suave
  en el techo; `environmentRotation` para orientar el reflejo de la ventana hacia el mostrador; y **`environmentIntensity` como PROP** (§0.2).
- **`useBoxProjectedEnv(position, size)`** (drei, CONFIRMADO en `useBoxProjectedEnv.d.ts`): corrige la paralaje del envmap a la caja de la habitación → los reflejos en el suelo barnizado y
  en los tarros «son» la pared de enfrente y no un infinito. Devuelve `{ ref, onBeforeCompile, customProgramCacheKey }` para pasar al material:
  `const env = useBoxProjectedEnv([0,1.5,0],[9,3,9]); <meshStandardMaterial {...env} envMapIntensity={1} … />` → para suelo y mostrador (las dos superficies grandes que reflejan).
  Coste: unas operaciones extra por fragmento; PROBABLE despreciable.
- `MeshReflectorMaterial` (reflejo planar real con blur) para el suelo encerado: coste = 1 render extra de la escena por superficie → solo si sobra GPU en «high».

### 2.9 Texturas procedurales: lo que falta en `lib/materials.ts` (madera/yeso/lino ya existen) — CONFIRMADO en docs/código de three
- **Canal de `roughnessMap`: three lee el canal G** («compatible with a combined OcclusionRoughnessMetallic» — `roughnessmap_fragment.glsl.js`); `metalnessMap` lee B y `aoMap` R. Al generar
  un ORM en canvas, puedes usar UNA textura para los tres slots.
- **Latón cepillado (teteras, grifos):** `MeshPhysicalMaterial` `anisotropy` (0-1) + `anisotropyMap` («Red and green channels represent the anisotropy direction in [-1,1] tangent, bitangent
  space ... The blue channel contains strength as [0,1]» — doc MeshPhysicalMaterial) + `metalness 1`, `roughness 0.3-0.45`. Generar en canvas: R=128+dir.x·127, G=128+dir.y·127 (dirección del cepillado,
  p.ej. circular en la tapa), B=255·fuerza; la veta fina del cepillado en `roughnessMap` (rayas de 1-2 px en G). Necesita **reflejo** (Environment) o no se ve.
- **Cerámica esmaltada (tazas, tarros):** `MeshPhysicalMaterial` `clearcoat={1} clearcoatRoughness={0.08}` sobre base `roughness 0.5` con un `bumpMap` de poros suaves (fbm fino) → el esmalte
  «flota» sobre el bizcocho. Coste: MeshPhysicalMaterial «has a higher performance cost, per pixel ... Most effects are disabled by default, and add cost as they are enabled» (doc) → usarlo solo en
  las 10-30 piezas hero, no en paredes.
- **Tela (lino, manteles, sacos de té):** `sheen={0.6} sheenRoughness={0.8} sheenColor="#fff2dc"` + el lino procedural actual como `normalMap`. Misma advertencia de coste.
- **Madera con nudos** (lo que más delata la actual «veta de sinusoide»): añadir 1-3 nudos por tesela (distorsión radial del parámetro `t` alrededor de un centro aleatorio: `t += k / (1 + d*d*40)`) y
  variación de `roughness` por tablón (barniz gastado donde se apoya la gente). Es solo más código en `genWood`.
- **Suciedad/grime dirigida:** multiplicar `map` por un gradiente vertical (oscurecer 10-15 % el tercio inferior) y por un `fbm` de manchas en esquinas → «informe 1 §4 (decals y grime)» sin geometría.
- Ajustes de `CanvasTexture` para ORTO: ya tienen `anisotropy`; añadir `generateMipmaps` (default true) y `minFilter: THREE.LinearMipmapLinearFilter` (default) — ok; y **`colorSpace = SRGBColorSpace` SOLO en
  `map`** (R3F 9 «Automatic sRGB conversion of texture props has been removed» — guía v9). Los mapas de datos en `NoColorSpace`.
  https://threejs.org/docs/pages/MeshPhysicalMaterial.html · https://r3f.docs.pmnd.rs/tutorials/v9-migration-guide

### 2.10 Tone mapping: ACES vs AgX vs Neutral en three 0.185 — CONFIRMADO (constantes medidas: `ACESFilmicToneMapping=4, AgXToneMapping=6, NeutralToneMapping=7`)
- AgX llegó en r160 (+gamut mapping r161); Neutral (Khronos PBR Neutral) en r162. https://github.com/mrdoob/three.js/releases/tag/r160
- **Khronos PBR Neutral**: «the base color will be exactly reproduced ... for a shiny dielectric material facing the camera under unitary-white lighting» (0.08-0.8), «no hue shifts», desatura a altas
  intensidades (K_d=0.15). Pensado para e-commerce/producto: colores de etiqueta fieles. https://github.com/KhronosGroup/ToneMapping/blob/main/PBR_Neutral/README.md
- Guía de uso (Khronos/three): Neutral para «well-exposed scenes, precise sRGB base color reproduction»; filmic (ACES/AgX) «in strongly HDR scenes ... or to achieve specific artistic looks».
  Para un diorama CÁLIDO con velas y bloom, **AgX** es el candidato (hombro suave, no quema los cálidos a amarillo-blanco como ACES); **Neutral** si Petra quiere que el color de las cajas de té sea el del packaging real.
- Dónde se decide: en el `<ToneMapping mode={ToneMappingMode.AGX}>` del composer (§2.11) — el `gl.toneMapping` del renderer NO cuenta con composer (§0.1).

### 2.11 Color grading sin LUT externa — CONFIRMADO (exports medidos en postprocessing 6.39.4)
- `ToneMappingMode` = `{LINEAR:0, REINHARD:1, REINHARD2:2, REINHARD2_ADAPTIVE:3, UNCHARTED2:4, OPTIMIZED_CINEON:5, CINEON:5, ACES_FILMIC:6, AGX:7, NEUTRAL:8}`.
  `ToneMappingEffect({ mode, whitePoint, middleGrey, minLuminance, averageLuminance, adaptationRate })`. `BrightnessContrastEffect({ brightness, contrast })`. `HueSaturationEffect({ hue, saturation })`.
  Wrappers react: `<ToneMapping>`, `<BrightnessContrast>`, `<HueSaturation>`, `<LUT lut tetrahedralInterpolation>` (`LUT.d.ts`: `lut: Texture`).
- **LUT generada en JS**: `LookupTexture.createNeutral(size)` («Creates a neutral 3D LUT», `Float32Array(size³·4)` RGBA, extiende `Data3DTexture`), métodos `applyLUT, convertToUint8, convertToRGBA,
  convertLinearToSRGB, convertSRGBToLinear, scaleUp, toDataTexture`. `LUT3DEffect(lut, { blendFunction, tetrahedralInterpolation=false, inputColorSpace=SRGBColorSpace })`.
  https://pmndrs.github.io/postprocessing/public/docs/class/src/textures/lut/LookupTexture.js~LookupTexture.html
  ```tsx
  import { LookupTexture, ToneMappingMode } from "postprocessing";
  import { LUT, ToneMapping } from "@react-three/postprocessing";
  function makeTeaLUT(size = 32) {           // grading "té de tarde": lift cálido en sombras, gain frío-crema en luces, +saturación suave
    const lut = LookupTexture.createNeutral(size); const d = lut.image.data as Float32Array;
    for (let i = 0; i < d.length; i += 4) {
      let r = d[i], g = d[i + 1], b = d[i + 2];
      const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      const sat = 1.12; r = l + (r - l) * sat; g = l + (g - l) * sat; b = l + (b - l) * sat;   // saturación
      const sh = (1 - l) * 0.035, hi = l * 0.02;                                              // split-toning
      r += sh * 1.0 + hi * 0.6; g += sh * 0.55 + hi * 0.8; b += sh * 0.15 + hi * 1.0;
      const gam = 0.96; d[i] = Math.min(1, Math.max(0, r)) ** gam; d[i + 1] = Math.min(1, Math.max(0, g)) ** gam; d[i + 2] = Math.min(1, Math.max(0, b)) ** gam;
    }
    lut.needsUpdate = true; return lut;
  }
  const lut = useMemo(() => makeTeaLUT(), []);
  // …dentro del EffectComposer, tras N8AO y Bloom:
  <ToneMapping mode={ToneMappingMode.AGX} />
  <LUT lut={lut} tetrahedralInterpolation />
  ```
  Coste: 1 muestra de textura 3D por píxel (32³ float = 0,5 MB); `tetrahedralInterpolation` «highly accurate ... but is slower than hardware interpolation» → en mid sin él.
  Nota: el LUT3DEffect asume entrada sRGB (`inputColorSpace` default) → las curvas se diseñan «como se ven». Verificar a ojo (no lo he renderizado).
- **Orden de efectos recomendado** (postprocessing fusiona efectos contiguos en un solo `EffectPass`; README + informe 1 §8):
  `N8AO → Bloom (HDR, threshold ≥1) → ToneMapping → LUT/BrightnessContrast/HueSaturation → Vignette → Noise → TiltShift2 → SMAA`.
  Bloom antes del tone mapping (trabaja en HDR gracias a `HalfFloatType`); grano y viñeta después (son «de cámara»); SMAA al final sobre la imagen LDR.

---

## PASE 3 · VIDA

### 3.1 Decals de desgaste: `<Decal>` de drei — CONFIRMADO (`Decal.d.ts` + `Decal.js`)
- Envuelve `DecalGeometry` de three-stdlib: «The decal box has to intersect the surface, otherwise it will not be visible»; sin rotación «it will look at the parents center point».
  Props: `mesh?, position, rotation, scale, map, debug, polygonOffsetFactor (=-10), depthTest`. https://drei.docs.pmnd.rs/abstractions/decal
- **Trampa:** en drei 10.7.8 el default es **`depthTest = false`** (código L21) → el decal se ve A TRAVÉS de otros objetos. En orto con solapes: `depthTest` ON y `polygonOffsetFactor={-4}`.
- Texturas de manchas en canvas: círculos de té (anillo con `createRadialGradient` + borde irregular por ruido), roces de madera (trazos oscuros), «donde se apoyan los codos» en el mostrador.
  `meshStandardMaterial transparent` + `alphaTest 0.1`, `roughness` alto en la mancha (el té seca mate; el roce pule → roughness bajo).
  ```tsx
  <mesh geometry={roundedBox(1.2, 0.9, 0.6)} material={woodMat}>
    <Decal position={[0.3, 0.45, 0.1]} rotation={[-Math.PI / 2, 0, 0.4]} scale={[0.12, 0.12, 0.05]} depthTest polygonOffsetFactor={-4}>
      <meshStandardMaterial map={teaRingTex} transparent alphaTest={0.1} roughness={0.9} polygonOffset polygonOffsetFactor={-4} />
    </Decal>
  </mesh>
  ```
  Coste: `DecalGeometry` recorta triángulos en CPU una vez (primitivas = trivial); cada decal es 1 draw call → 20-40 por sala está bien; cientos no (agrupar en un atlas y un `BatchedMesh` si crece).
  Limitación doc: «decal projections can be distorted when used around corners» https://threejs.org/docs/pages/DecalGeometry.html

### 3.2 Polvo en el haz de luz y volumétricos — CONFIRMADO (Sparkles d.ts) / PROBABLE (godrays)
- Ya hay `Dust` (Points) global + `LightShaft` (plano aditivo). Lo que falta es que el polvo **brille solo dentro del haz**: `<Sparkles>` con `scale` = caja del haz, `count 40-80`, `size 1-2`,
  `speed 0.15`, `noise 0.3`, `color "#ffe6b0"`, `opacity 0.8` (props `count, speed, opacity, color, size, scale, noise`; material `transparent`, `depthWrite:false`). https://drei.docs.pmnd.rs/staging/sparkles
  Dentro del haz y nada fuera = la lectura «aire con luz». Coste: 1 draw call de puntos.
- `<SpotLight volumetric>` de drei (props `attenuation, anglePower, radiusTop, radiusBottom, opacity, volumetric, depthBuffer`) = cono volumétrico falso con `depthBuffer` para que las piezas lo corten →
  alternativa al plano actual para la ventana (un cono/rect desde la ventana). Coste: 1 malla con shader; `useDepthBuffer()` añade un render de profundidad.
- **God rays reales** (`three-good-godrays`, screen-space desde el shadow map): v0.12.1, peer **`three >= 0.125.0 <= 0.182.0`** y lee el shadow map «a la antigua» → en 0.185 PROBABLE que
  falle como `<SoftShadows>`. No instalar sin probar en rama. https://github.com/Ameobea/three-good-godrays · `GodRays` de postprocessing (Sun-mesh based) sí existe en 6.39.4 pero es para un
  «sol» visible en pantalla, no para una ventana lateral en orto.

### 3.3 Sway de tela/plantas por vertex shader — CONFIRMADO (doc `Material.onBeforeCompile` + chunk `begin_vertex` de 0.185)
- Doc: `onBeforeCompile(shader, renderer)` «executed immediately before the shader program is compiled ... Useful for the modification of built-in materials»; obligatorio `customProgramCacheKey`
  «so three.js can reuse a cached shader or recompile ... as needed». Solo `WebGLRenderer` (en WebGPU sería TSL). https://threejs.org/docs/pages/Material.html
- El chunk `begin_vertex` en 0.185 es exactamente `vec3 transformed = vec3( position );` → se sustituye:
  ```tsx
  function useSway(amp = 0.03, freq = 1.2) {
    const u = useRef({ value: 0 });
    useFrame((_, dt) => { u.current.value += dt; });
    const onBeforeCompile = useCallback((shader: THREE.WebGLProgramParametersWithUniforms) => {
      shader.uniforms.uTime = u.current;
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nuniform float uTime;")
        .replace("#include <begin_vertex>", `#include <begin_vertex>
          float sway = uv.y * uv.y;                                   // 0 en la base, máximo en la punta
          transformed.x += sin(uTime * ${freq.toFixed(2)} + position.y * 3.0 + position.x) * ${amp.toFixed(3)} * sway;
          transformed.z += cos(uTime * ${(freq * 0.8).toFixed(2)} + position.z * 2.0) * ${(amp * 0.6).toFixed(3)} * sway;`);
    }, [amp, freq]);
    return { onBeforeCompile, customProgramCacheKey: () => `sway-${amp}-${freq}` };
  }
  // <meshStandardMaterial {...useSway(0.03, 1.2)} map={linenTex} side={THREE.DoubleSide} />
  ```
  Coste: 2 senos por vértice = 0. Las sombras NO se mueven (el `MeshDepthMaterial` de sombras no lleva el parche) → amplitud pequeña (≤3 cm) y nadie lo nota; si hace falta, mismo parche en `customDepthMaterial`.
  Ejemplo oficial de la técnica: `webgl_materials_modified`. Las margaritas ya tienen viento por `useFrame` (CPU): para cientos de hojas, el shader es la vía.
- `<Float speed rotationIntensity floatIntensity floatingRange>` (drei) para cosas colgadas (etiquetas, manojos de hierbas): CPU trivial, sin shader.

### 3.4 Parpadeo de velas — PROBABLE (técnica estándar; sin fuente única)
- Ruido 1D suave (suma de 2-3 senos no armónicos + jitter) sobre `pointLight.intensity` y `emissiveIntensity` de la llama, **no** `Math.random()` por frame (estroboscópico).
  ```tsx
  useFrame(({ clock }) => { const t = clock.elapsedTime;
    const n = 0.82 + 0.12 * Math.sin(t * 9.1) * Math.sin(t * 3.7) + 0.06 * Math.sin(t * 23.0 + 1.3);
    light.current.intensity = base * n; flame.current.emissiveIntensity = 2.5 * n; light.current.position.x = x0 + Math.sin(t * 5.3) * 0.004; });
  ```
- Sombras: NO `castShadow` en velas (6 renders por luz). Bloom: la llama con `emissive` + `emissiveIntensity` > `luminanceThreshold` (0.96 actual) y `toneMapped={false}` para que «pase» el umbral.
- Con `BakeShadows` activo no hay conflicto (la luz cambia intensidad, no la sombra).

### 3.5 Cristal: `MeshTransmissionMaterial` vs `meshPhysicalMaterial transmission` — CONFIRMADO (doc drei + doc three)
- three: `transmission` «When transmission is non-zero, opacity should be set to 1»; `thickness` («If the value is 0 the material is thin-walled»); `ior` 1-2.333 (default 1.5); `dispersion`;
  `attenuationColor/Distance` para té ámbar dentro del tarro. El renderer hace **un render extra de la escena opaca** al *transmission render target*; `gl.transmissionResolutionScale`
  («Lowering this value can result in significant performance improvements») — ya está a **0.25** en `SceneShell`. https://threejs.org/docs/pages/WebGLRenderer.html
- drei MTM: «acts like a normal PhysicalMaterial ... but has chromatic aberration, noise-based roughness blur, (primitive) anisotropic blur support» y «can "see" other transmissive or transparent
  objects». Props: `transmission=1, thickness=0, backsideThickness=0, roughness=0, chromaticAberration=0.03, anisotropicBlur=0.1, distortion=0, distortionScale=0.5, temporalDistortion=0,
  backside=false, resolution, backsideResolution, samples=6, buffer, transmissionSampler=false, background`. «it can still be expensive as it causes an additional render pass» (+1 más con `backside`);
  `transmissionSampler` = usar el buffer de three: «can't see other transparent or transmissive objects». https://drei.docs.pmnd.rs/shaders/mesh-transmission-material
- **Regla para 5-20 tarros en iGPU:** `meshPhysicalMaterial transmission` (un solo render extra compartido por todos, a 0.25) para TODOS los tarros; `MeshTransmissionMaterial` con
  `samples={4} resolution={256} transmissionSampler` (comparte el buffer de three) solo en 1-2 piezas hero en «high». Nunca `backside` en iGPU.
- Trampa AO: todo lo transmisivo es «transparente» para N8AO → se renderiza dos veces (§2.6). Y en orto la refracción se nota menos (no hay paralaje): basta `thickness` pequeño + `roughness 0.05-0.15`.

### 3.6 Imperfección y clutter con instancias — CONFIRMADO (Instances.d.ts/js, docs three)
- `<Instances limit range frames>` + `<Instance position rotation scale color>`: «define hundreds of thousands of objects in a single draw call» pero «comes at the cost of CPU overhead ... for
  foliage ... use THREE.InstancedMesh». Default `limit=1000`, `frames=Infinity` (actualiza matrices cada frame) → para clutter estático **`frames={1}`** (código L130: solo itera mientras `iterations < frames`).
  `<InstancedAttribute name defaultValue>` crea un buffer por instancia (p.ej. `aRough`) que luego lees con `onBeforeCompile` (en vertex: `attribute float aRough; varying float vRough;` y en fragment
  `roughnessFactor *= vRough` tras `#include <roughnessmap_fragment>`). https://drei.docs.pmnd.rs/performances/instances
- `InstancedMesh.setColorAt` / `BatchedMesh.setColorAt` (three) para el tinte por instancia sin shader (se multiplica con `material.color`).
- Reglas **[hy3]** (coinciden con informe 1 §5/§11): rotación ±3-8°, tilt ±1-2°, escala ±3 %, tinte ±5-8 % de hue/valor, agrupar en impares (3/5/7), ≥1 prop «fuera de sitio» por sala, nunca dos
  instancias idénticas adyacentes, 8-15 props pequeños por m² de mostrador. Semilla determinista (ya hay `hash()` en `materials.ts`) para que la web no cambie cada carga.

### 3.7 Composición isométrica y color key por sala — PROBABLE (arte, no API) — ver informe 1 §1/§10 para el fondo
- En orto no hay perspectiva: **solape + valor + sombra** son la única profundidad (informe 1 §7; **[hy3]**: «un prop siempre tape parcialmente a otro»; foco por Δ luminancia, no por saturación).
- Kassondra Krahn (80.lv, «Dreamy Room»): «There's no point in fiddling too much with models before the composition is nailed down»; luz = spot fuerte fuera de la ventana + puntos para
  suavizar + direccional baja general; paleta «pastel», pared «pale yellow/pink»; lo que lo hace vivido: «paper debris by the garbage, small succulent plants on the shelves».
  https://80.lv/articles/dreamy-room-stylized-diorama-breakdown
- **Color key por sala en nuestro stack** (lo que SÍ es API): `bg`/`scene.fog` color por sala (ya existe `bg`), color/temperatura de la `directionalLight` key (cálida 2700-3200 K en el salón de té,
  neutra-fría en el taller), `Lightformer color` de la ventana, y un `<HueSaturation hue saturation>` o LUT distinta por sala (§2.11). Regla **[hy3]**: 70 % base / 20 % secundario / 10 % acento, máx. 3 familias de tono.
- Check objetivo: `<ColorAverage>` o desaturar (HueSaturation `saturation={-1}`) en `?debug` para el *squint test* en B/N del informe 1.

---

## EXTRAS · RENDIMIENTO Y API EN three 0.185 / drei 10

### E.1 Agrupar draw calls — CONFIRMADO en docs
- **`BatchedMesh`** (three): «render a large number of objects with the same material but with different geometries or world transformations» en un draw call; `addGeometry, addInstance, setMatrixAt,
  setColorAt, setVisibleAt, deleteInstance, optimize`, `perObjectFrustumCulled`, `sortObjects`. Ideal para el diorama: **todas las cajas biseladas de madera con un solo material en 1 draw call**.
  https://threejs.org/docs/pages/BatchedMesh.html — en R3F se usa imperativo (`<primitive object={batched}>`), drei no tiene wrapper.
- **`InstancedMesh` / `<Instances>`**: misma geometría repetida (tazas, latas, hojas).
- **`mergeGeometries`** (`three/addons/utils/BufferGeometryUtils.js`): estáticos distintos que comparten material → una geometría. **Trampa:** `mergeBufferGeometries` ya NO existe en 0.185
  (solo `mergeGeometries`, comprobado en el addon). Merge = pierde culling por pieza y raycast por pieza (para el `EditorVivo` conviene mantener piezas sueltas en `?editor`).
- Orden de preferencia para nosotros: BatchedMesh (cajas/paredes con el mismo material) > Instances (repetidos) > merge (lo que nunca cambia).

### E.2 Resolución y calidad — CONFIRMADO (código propio + drei)
- `effectiveDpr` ya topa a 1920 px: bien. `EffectComposer multisampling={0}` + SMAA (actual) es lo correcto con N8AO. `<PerformanceMonitor>` ya degrada una vez.
- Lo más caro en iGPU, por orden (PROBABLE, del README n8ao y docs three): transmission (render extra) > N8AO a resolución completa (`halfRes` = 2-4×) > VSM con muchos receptores > sombras de
  `pointLight` (×6) > `MeshTransmissionMaterial backside` (+1 render) > `MeshReflectorMaterial` (+1 render) > MeshPhysicalMaterial con clearcoat/sheen/anisotropy en superficies grandes.
- Para «mid»: N8AO `halfRes quality="high"`, transmission a 0.25 (ya), sin MTM, `AccumulativeShadows frames={40}`, `BakeShadows`. Para «high»: N8AO full-res `accumulate`, `resolution 256` del Environment, 1-2 MTM hero.

### E.3 Verificación (para el verificador, no para mí)
- Tras cada pase medir: `gl.info.render.calls` y `.triangles`, ms por frame con `<StatsGl>` (drei) en la HP, y captura A/B con el mismo `?q=` y la misma semilla. Sin esos números no se canta victoria.

---

## TOP-10 POR IMPACTO / COSTE (ordenado; 1 = primero)

1. **Poner `<ToneMapping mode={ToneMappingMode.AGX}>` en `Effects.tsx`** (§0.1): hoy NO hay tone mapping → curva de tono + bloom con sentido. Coste 0. *Es un bug, no una mejora.*
2. **`shadows="percentage"` + `shadow-radius={4}` + `shadow-intensity={0.85}` + `normalBias`** (§0.3/§2.1): sombras suaves con el PCF nuevo, sin warning, mismo coste.
3. **`RoundedBoxGeometry(…, 1, r)` en todas las cajas y `LatheGeometry` biselado en cilindros** (§1.1/§1.3): el edge catch-light; 108 tris/caja.
4. **`environmentIntensity` como prop + `resolution 256` + Lightformer cálido en la ventana + `useBoxProjectedEnv` en suelo y mostrador** (§0.2/§2.8): reflejos de habitación, no de infinito.
5. **`AccumulativeShadows` (suelo) + `ContactShadows frames={1}` (bajo muebles) + `BakeShadows`** (§2.2-2.4): asentar todo; coste ≈ 0 tras acumular.
6. **Materiales hero en `MeshPhysicalMaterial`**: clearcoat en cerámica, anisotropy+anisotropyMap en latón, sheen en tela (§2.9), 10-30 piezas.
7. **Variación por instancia + `frames={1}` + semilla fija** (§3.6) y nudos/grime en las texturas procedurales (§2.9): mata el «stamp» y el color plano.
8. **LUT generada en JS + split-toning por sala** (§2.11/§3.7): el look de película sin descargar nada.
9. **N8AO `accumulate` con cámara quieta y `halfRes quality="high"` en mid** (§2.6): AO limpia gratis.
10. **Decals de té/roce con `depthTest`** (§3.1) + Sparkles solo dentro del haz (§3.2) + sway por shader (§3.3) + vela con ruido (§3.4): la capa de vida.

Después, si hay tiempo y GPU: `ProgressiveLightMap` con UV desplegadas (§2.5) = el verdadero «baking» in-browser; `RectAreaLight` de ventana (§2.7); 1-2 `MeshTransmissionMaterial` hero (§3.5).

---

## TRAMPAS (APIs cambiadas o rotas en three 0.185 / drei 10.7.8 / R3F 9.7.0 / postprocessing 6.39.4)

| Trampa | Estado | Fuente |
|---|---|---|
| `gl.toneMapping` con `<EffectComposer>` | **No se aplica**: el composer fuerza `NoToneMapping` y three ≥r182 solo mapea al renderizar a pantalla → usar `<ToneMapping>` | código rpp 3.0.5; `WebGLPrograms.js` L178; Migration Guide r182 |
| `<Environment>` sin `environmentIntensity` | Resetea `scene.environmentIntensity` a 1 | `drei/core/Environment.js` `setEnvProps` |
| `<Canvas shadows>` (boolean) | Pide `PCFSoftShadowMap` → deprecado, warning, cae a `PCFShadowMap` | R3F 9.7.0 dist; `WebGLShadowMap.js` L99; R3F #3749 |
| `<SoftShadows>` (PCSS) | **Roto** con three ≥0.182 (unpackRGBAToDepth / sampler2DShadow / replace en sitio equivocado); sin fix en drei 10 (milestone v11) | drei #2583; código local |
| `softShadows({frustrum,size,near,samples,rings})` imperativo | Ya no existe; solo el componente `<SoftShadows size samples focus>` (y ese está roto) | `softShadows.d.ts`; **[hy3]** para el histórico |
| `three-good-godrays` | peer `three <= 0.182.0`; lee el shadow map antiguo → PROBABLE roto en 0.185 | npm `pnpm view` + README |
| `@react-three/lightmap` | v0.0.8 (2021), peer R3F ≥8 / React 18 → PROBABLE incompatible con R3F 9/React 19 | package.json del repo |
| `shadow.radius` «no hace nada» | Era cierto con PCFSoft viejo; **ahora sí** (PCF Vogel: `radius*texelSize`) | chunk 0.185 L132 |
| `mergeBufferGeometries` | Renombrado a `mergeGeometries` (r151+); el viejo no existe en 0.185 | `BufferGeometryUtils.js` local |
| `Texture.encoding` / `outputEncoding` / `sRGBEncoding` | Sustituidos por `colorSpace` / `outputColorSpace` / `SRGBColorSpace` (r152) | Migration Guide |
| `useLegacyLights` / `physicallyCorrectLights` | `useLegacyLights=false` y deprecado desde r155; las intensidades son físicas (por eso `RandomizedLight intensity=Math.PI`) | Migration Guide; drei `AccumulativeShadows.js` L154 |
| R3F 9: conversión sRGB automática de texturas | **Eliminada**: poner `colorSpace = SRGBColorSpace` a mano solo en `map`/`emissiveMap` | guía v9 |
| R3F 9 tipos | `Props`→`CanvasProps`; `MeshProps` etc. → `ThreeElements['mesh']` | guía v9 |
| `<RoundedBox>` de drei | No es `RoundedBoxGeometry`: `ExtrudeGeometry` (1292 tris por defecto, UVs de extrusión) | `RoundedBox.js`; medición |
| `<Decal>` de drei | `depthTest=false` por defecto → se ve a través de objetos; activarlo | `Decal.js` L21 |
| `<Instances>` | `frames=Infinity` actualiza matrices cada frame; para estático `frames={1}` | `Instances.js` L94/130 |
| `roughnessMap` | three lee el canal **G** (ORM); `metalnessMap` B; `aoMap` R | `roughnessmap_fragment.glsl.js` |
| `MultiplyBlending`/`SubtractiveBlending` | Requieren `premultipliedAlpha=true` desde r177 | Migration Guide |
| WebGL 1 | Sin soporte desde r162 (Data3DTexture/LUT 3D requieren WebGL2, que es lo único que hay) | Migration Guide |
| `Environment preset` / `useTexture` de CDN / `MatcapTexture`/`NormalTexture` de drei | Descargan de internet → prohibido por «web autocontenida» («preset ... relies on CDNs») | doc Environment |
| `onBeforeCompile` / `customProgramCacheKey` | Solo `WebGLRenderer`; en WebGPU es TSL (fuera de alcance: seguimos en WebGL) | doc Material |
| N8AO cambio de `quality`/`aoSamples` en caliente | Recompila shaders: fijarlo una vez por nivel de calidad | README n8ao |
| `CapsuleGeometry` | `length` → `height` (r175) | Migration Guide |

---

## LO QUE NO PUDE VERIFICAR (honesto)
- **Nada de esto está renderizado**: no he abierto el navegador; todo es lectura de código/doc + medición de geometría en Node. Los valores numéricos de `radius`, `intensity`, LUT y AO son puntos de partida.
- `ProgressiveLightMap` con primitivas: el despliegue de UV es propuesta mía; no lo he ejecutado.
- `three-good-godrays` y `@react-three/lightmap` en 0.185/R3F 9: no instalados (prohibido instalar); el veredicto es por peer deps y por el mismo patrón de rotura que `<SoftShadows>`.
- Las cifras de coste en iGPU (ms) son cualitativas (README n8ao, docs three); el verificador debe medirlas en la HP.
- Consulta «deepseek»: no hubo deepseek (falló 4/4); lo marcado **[hy3]** es de `hy3-free`, **no verificado**, y tiene al menos un error detectado (cita *The Skillful Huntsman* a Feng Zhu: el libro es de
  Khang Le/Mike Yamada/Felix Yoon/Scott Robertson) y un consejo ya obsoleto («radio PCFSoft 1-3 px»). La salida completa de A (checklist de 8 secciones) y B (cortada en la sección B) está en
  `/tmp/claude-1000/-home-ser/01c81c96-3b82-459f-b66c-5e6218cf582a/scratchpad/deepseek_A.out` y `deepseek_B.out` (B2, acotada a D-H, en `deepseek_B2.out` si terminó).

## FUENTES (todas consultadas 22-ago-2026)
- three docs: RoundedBoxGeometry https://threejs.org/docs/pages/RoundedBoxGeometry.html · LightShadow https://threejs.org/docs/pages/LightShadow.html · WebGLRenderer https://threejs.org/docs/pages/WebGLRenderer.html ·
  MeshPhysicalMaterial https://threejs.org/docs/pages/MeshPhysicalMaterial.html · Scene https://threejs.org/docs/pages/Scene.html · Material https://threejs.org/docs/pages/Material.html ·
  BatchedMesh https://threejs.org/docs/pages/BatchedMesh.html · RectAreaLight https://threejs.org/docs/pages/RectAreaLight.html · DecalGeometry https://threejs.org/docs/pages/DecalGeometry.html
- three releases/migración: r160 https://github.com/mrdoob/three.js/releases/tag/r160 · r182 https://github.com/mrdoob/three.js/releases/tag/r182 · Migration Guide https://github.com/mrdoob/three.js/wiki/Migration-Guide ·
  issue #32591 https://github.com/mrdoob/three.js/issues/32591 · ejemplo progressive https://threejs.org/examples/#webgl_shadowmap_progressive (fuente en `examples/webgl_shadowmap_progressive.html` r185)
- drei docs: soft-shadows https://drei.docs.pmnd.rs/shaders/soft-shadows · accumulative-shadows https://drei.docs.pmnd.rs/staging/accumulative-shadows · contact-shadows https://drei.docs.pmnd.rs/staging/contact-shadows ·
  environment https://drei.docs.pmnd.rs/staging/environment · lightformer https://drei.docs.pmnd.rs/staging/lightformer · decal https://drei.docs.pmnd.rs/abstractions/decal ·
  mesh-transmission-material https://drei.docs.pmnd.rs/shaders/mesh-transmission-material · instances https://drei.docs.pmnd.rs/performances/instances · sparkles https://drei.docs.pmnd.rs/staging/sparkles ·
  rounded-box https://drei.docs.pmnd.rs/shapes/rounded-box · issue SoftShadows #2583 https://github.com/pmndrs/drei/issues/2583 · hilo PCSS https://discourse.threejs.org/t/new-realistic-pcss-soft-shadow-implementation-react-vanilla/48579
- R3F: guía v9 https://r3f.docs.pmnd.rs/tutorials/v9-migration-guide · issue #3749 https://github.com/pmndrs/react-three-fiber/issues/3749 · PR #3748 https://github.com/pmndrs/react-three-fiber/pull/3748
- postprocessing: README https://github.com/pmndrs/postprocessing/blob/main/README.md · LUT3DEffect https://pmndrs.github.io/postprocessing/public/docs/class/src/effects/LUT3DEffect.js~LUT3DEffect.html ·
  LookupTexture https://pmndrs.github.io/postprocessing/public/docs/class/src/textures/lut/LookupTexture.js~LookupTexture.html
- n8ao README (local, 2.0.1) · three-good-godrays https://github.com/Ameobea/three-good-godrays · three-gpu-pathtracer issue #5 https://github.com/gkjohnson/three-gpu-pathtracer/issues/5 ·
  three-lightmap-baker https://github.com/lucas-jones/three-lightmap-baker · react-three-lightmap https://github.com/pmndrs/react-three-lightmap · three-mesh-bvh https://github.com/gkjohnson/three-mesh-bvh
- Khronos PBR Neutral https://github.com/KhronosGroup/ToneMapping/blob/main/PBR_Neutral/README.md · nota de prensa https://www.khronos.org/news/press/khronos-pbr-neutral-tone-mapper-released-for-true-to-life-color-rendering-of-3d-products
- Bisel por shader (foro) https://discourse.threejs.org/t/cheap-round-edged-box-vertex-shader/8066 · 80.lv Dreamy Room https://80.lv/articles/dreamy-room-stylized-diorama-breakdown

---

## APÉNDICE · consulta B2 (`hy3-free`, secciones D-H) contrastada con lo verificado — todo **[hy3]** salvo el veredicto

Lo que coincide con lo verificado (y por tanto refuerza): cerámica `clearcoat=1 clearcoatRoughness≈0.04` sobre base `roughness≈0.55`; tela `sheen=1 sheenColor sheenRoughness≈0.8`;
cristal: `meshPhysicalMaterial transmission` para los 20 tarros (un buffer compartido) y MTM solo en 1-3 hero con `transmissionSampler samples={4} resolution={256}`; orden
`N8AO → Bloom → ToneMapping → LUT → Vignette/Noise → SMAA` y «desactiva `gl.toneMapping` del renderer al usar el effect» (coincide con §0.1); `<Decal depthTest polygonOffsetFactor={-1}>`;
sway con `uv.y` como atenuación; vela con suma de senos; `mid` = N8AO `halfRes`, PCF, sin VSM ni MTM.

Lo que está **mal o contradice el código** (no usar):
- «`anisotropyMap`: R = fuerza, G = rotación» → **falso**; la doc de three dice R,G = dirección en [-1,1] tangente/bitangente y **B = fuerza** (§2.9).
- «`HueSaturationEffect { hue, saturation, lightness }`» → el constructor de 6.39.4 solo tiene `hue` y `saturation` (tipos locales).
- «`transmissionResolutionScale` es prop de MTM» → es del **renderer** (`gl.transmissionResolutionScale`, ya a 0.25), no del material de drei.
- «`BatchedMesh` desde r0.16x … AGX/NEUTRAL solo en postprocessing ≥6.35» → fechas no verificadas; lo que importa es que en 6.39.4 existen (medido).
- «`sheenTint` → `sheenColor`», «`extend` manual ya no para materiales nativos», «`<LUT tetrahedralInterpolation>` reemplaza `interpolate`» → no verificado; irrelevante para código nuevo.
- Snippet de roughness por instancia: reemplaza `roughnessFactor = roughness;` por `vRough` a secas (pierde el `roughnessMap`); mejor multiplicar tras `#include <roughnessmap_fragment>` (§3.6).

Salidas completas: `scratchpad/deepseek_A.out` (checklist 8 secciones, 9,4 KB), `deepseek_B.out` (cortado en B, 4 KB), `deepseek_B2.out` (D-H, 7,9 KB).

**ESTADO: COMPLETO** (pases 1-3, extras, TOP-10, trampas, fuentes). Pendiente que NO es del explorador: verificación en pantalla (HP) de cada técnica, con `gl.info` y capturas A/B.
