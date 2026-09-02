# INFORME — Herramientas de diagnóstico visual para three.js / React Three Fiber

**Contexto del proyecto:** diorama 3D isométrico · three.js 0.185 · @react-three/fiber 9.7 · drei 10.7 · postprocessing 6.39 · Next.js 16 (React 19) · cámara ortográfica fija · 7 salas de 10×10 m · iGPU Radeon 610M.
**Objetivo:** dado un defecto señalado en pantalla por el dueño («esto flota», «punto naranja raro»…), identificar **qué objeto lo causa sin recompilar**.

**Método:** búsqueda web + GitHub + registro npm. Todas las URLs fueron accedidas/verificadas durante la investigación salvo las marcadas **[NO VERIFICADO]**. Versiones de paquetes y licencias comprobadas contra `registry.npmjs.org` el día de la redacción.

---

## Resumen ejecutivo

| Tu queja típica | Herramienta/tecnica | Coste |
|---|---|---|
| «¿Qué es esto?» (señala un píxel) | Raycaster desde NDC (§2.2) o GPU picking por ID (§2.3) | 0 deps, código propio |
| «Esto flota» | `Box3.setFromObject` + dump de posición mundial (§3.1, §3.6) | 0 deps |
| «Se ve la pared dentro de la chimenea» | `Raycaster.intersectObjects` con TODOS los impactos ordenados (§3.5) | 0 deps |
| «Punto naranja raro» | Spector.js: captura del frame → qué draw call pinta ese píxel (§5.5) | extensión gratis |
| «El péndulo se sale del reloj» | Intersección de `Box3` entre dos objetos (§3.6) | 0 deps |
| «Todo se ve blanco/lavado» | Checklist tone mapping/bloom/envMapIntensity (§5.1–5.4) | 0 deps |
| Regresiones visuales entre builds | Playwright + pixelmatch/odiff (§4) | dev-only |

**Conclusión corta:** para tu flujo de trabajo (alguien señala un píxel y tú necesitas saber qué malla es), la combinación ganadora es **(1)** un puente de depuración propio en `window` con raycast-por-píxel y volcado de materiales (código en §2.2 y §5.3, ~80 líneas, cero dependencias), **(2)** `useHelper`+`BoxHelper` de drei para ver los bounds del sospechoso, y **(3)** Spector.js como lupa a nivel de draw calls cuando el problema viene de postprocesado o shaders. Las extensiones inspector genéricas (three-devtools, three-inspect) son útiles pero ninguna permite hoy seleccionar haciendo clic en el canvas de forma fiable; el picking hay que implementarlo tú — está resuelto en §2.

---

## 1. Inspectores en vivo para R3F/three.js

### Tabla comparativa

| Herramienta | Qué muestra exactamente | ¿Clic en canvas → ver objeto? | three 0.185 / R3F 9 / React 19 | Instalación | Dev/Prod | URL | Licencia |
|---|---|---|---|---|---|---|---|
| **r3f-perf** 7.2.3 | FPS, tiempos CPU/GPU por frame, draw calls, triángulos, programas/shaders activos, memoria JS, gráficas históricas | No (solo métricas) | ⚠️ Parcial: peer `react>=18`, `fiber>=8`; arrastra `drei ^9` como dependencia → conflicto con drei 10.x (ver nota) | `npm i -D r3f-perf` | Solo dev (UI flotante) | https://github.com/utsuboco/r3f-perf | MIT |
| **leva** 0.10.x | Panel de controles (`useControls`) para cualquier valor: sliders, colores, vectores, selects | No (es un panel de valores, no inspecciona la escena) | ✅ React 19 soportado desde 0.10.0 (peer `^18 \|\| ^19`) | `npm i leva` | Ambos, pero pensado para dev | https://github.com/pmndrs/leva | MIT |
| **three-devtools** (extensión oficial histórica) | Árbol de escena, propiedades de objetos/materiales/texturas, info del renderer | Explora árbol; sin pick en canvas | ❌ Repo **archivado dic-2022**, alpha/experimental; API `__THREE_DEVTOOLS__` sigue existiendo en three moderno | Extensión Chrome/Firefox | Dev | https://github.com/threejs/three-devtools | MIT |
| **DevTools extension del propio repo de three.js** (`devtools/` en rama `dev`) | Jerarquía completa de escena, propiedades básicas (tipo/nombre), detalles del renderer (stats, memoria) | Selección desde el árbol (no clic en canvas) | ✅ Se distribuye dentro del propio repo three actual | Cargar sin comprimir en `chrome://extensions` (carpeta `devtools/`) | Dev | https://github.com/mrdoob/three.js/tree/dev/devtools | MIT |
| **three-inspect** 0.7.2 | Grafo de escena editable (transformaciones, materiales, texturas), helpers de luces/grid/sombra, monitor de rendimiento | Selección desde el árbol; pick en escena solo vía modo raycast integrado (Threlte); **[NO VERIFICADO]** en R3F real | ✅ Peer `three >= 0.140` (sin tope) — compatible en principio con 0.185; UI Svelte autocontenida | `npm i -D three-inspect` | Dev (llamada explícita) | https://github.com/threlte/three-inspect | MIT |
| **@react-three/editor** | Editor de escena embebido en Vite | Sí | ❌ **ARCHIVADO 24-jun-2023** (read-only). Sucesor: Triplex | — | Dev | https://github.com/pmndrs/react-three-editor | MIT |
| **Triplex** (sucesor) | Workspace visual para R3F: selección de elementos JSX, transform controls, guarda cambios en el código | Sí, punto-y-clic sobre la escena | ✅ Diseñado para R3F actual (Next/Vite/Bun…) | Extensión VS Code o standalone | Edición, no runtime prod | https://github.com/pmndrs/triplex · https://triplex.dev | ⚠️ **Sin archivo LICENSE ni campo license en el monorepo al verificarlo — NO VERIFICADO; revisa antes de uso serio** |
| **useHelper** (drei 10.7) | Añade helpers de three (BoxHelper, VertexNormalsHelper, CameraHelper…) a un ref, autolimpieza + autoupdate | No (visualiza el objeto que TÚ eliges) | ✅ Parte de drei 10.x = tu stack exacto | ya incluido en `@react-three/drei` | Dev (condicional) | https://drei.docs.pmnd.rs/gizmos/helper-use-helper · fuente: https://github.com/pmndrs/drei/blob/master/src/core/Helper.tsx | MIT |
| **Stats** (drei) / **stats.js** 0.17 | Gráfica FPS/ms/MB estilo mrdoob | No | ✅ stats.js es agnóstico; drei `<Stats/>` envuelve stats.js | incluido en drei / `npm i stats.js` | Ambos (útil en prod para medir en la máquina del dueño) | https://github.com/pmndrs/drei (Misc→Stats) · https://github.com/mrdoob/stats.js | MIT |

### Notas críticas de compatibilidad (verificadas)

- **r3f-perf vs drei 10/R3F 9:** r3f-perf declara `@react-three/drei ^9.103` como *dependencia* (no peer), lo que genera conflictos ERESOLVE con drei v10. Issue abierta: https://github.com/utsuboco/r3f-perf/issues/62 . Solución reportada por usuarios, `package.json`:
  ```json
  "overrides": {
    "r3f-perf": { "@react-three/drei": "$@react-three/drei", "@react-spring/three": "$@react-spring/three" }
  }
  ```
  El paquete no recibe mantenimiento activo (última publicación nov-2024). Alternativa headless si la UI molesta: `<PerfHeadless />` + `usePerf()`.
- **leva + React 19:** la versión 0.9 rompía con `ReactDOM.render is not a function`; corregido en **0.10.0** con `createRoot` (PR #511, release notes). Con 0.10.x funciona en React 19; los warnings de peer-deps de Radix se arreglaron en 0.10.1 (PR #537).
- **three-devtools histórico** está archivado y en estado alpha declarado por sus autores; la API `window.__THREE_DEVTOOLS__` que usaba sigue viva en el core de three (three despacha eventos ahí automáticamente si detecta el hook). La vía moderna recomendada es la extensión incluida en el propio repo (`devtools/`, cargar descomprimida): detecta escenas/renderers sin tocar tu código.
- **Ninguna herramienta de esta tabla hace «clic en el píxel → nombre del objeto» out-of-the-box en R3F 9.** Lo más cercano: Triplex (edición) y three-inspect (árbol + raycast interno en Threlte). Por eso la sección 2 es la clave del informe.

---

## 2. PICKING POR ID — «el usuario señala un píxel → qué objeto es»

### 2.0 Concepto

Tres vías, de simple a potente:

1. **Raycaster CPU** (§2.2): lanza un rayo matemático desde la cámara a través del píxel. Perfecto con <5.000 triángulos por test; es lo que R3F usa internamente para `onClick`. **Empieza aquí**: con un diorama de 7 salas te sobra.
2. **GPU picking por ID entero** (§2.3): renderiza la escena a un target offscreen donde cada malla escribe su ID numérico en un píxel; lees 1 píxel. Exacto, escala a millones de triángulos e instancing.
3. **GPU picking por color RGB** (§2.4): variante clásica con colores únicos; ojo con conversiones de espacio de color en three ≥ r152.

### 2.2 Raycaster desde coordenadas de pantalla (recomendado como base)

Conversión píxel→NDC y lista de impactos:

```ts
import * as THREE from 'three'

const ndcFromClient = (clientX: number, clientY: number, canvas: HTMLCanvasElement) =>
  new THREE.Vector2(
    ((clientX - canvas.getBoundingClientRect().left) / canvas.clientWidth) * 2 - 1,
    -((clientY - canvas.getBoundingClientRect().top) / canvas.clientHeight) * 2 + 1,
  )

export function pickAt(clientX: number, clientY: number, camera: THREE.Camera, scene: THREE.Scene, canvas: HTMLCanvasElement) {
  const raycaster = new THREE.Raycaster()
  raycaster.setFromCamera(ndcFromClient(clientX, clientY, canvas), camera) // funciona con OrthographicCamera
  const hits = raycaster.intersectObjects(scene.children, true) // ordenados por distancia
  return hits.map(h => ({
    name: h.object.name || h.object.uuid,
    type: h.object.type,
    distance: h.distance,
    point: h.point,                                    // posición mundial exacta del impacto
    worldPos: h.object.getWorldPosition(new THREE.Vector3()),
    material: Array.isArray(h.object.material) ? h.object.material.map(m => m.name || m.type) : [h.object.material?.name ?? '—'],
    instanceId: (h as any).instanceId,                 // si es InstancedMesh
  }))
}
```

En R3F esto ya viene integrado: `onClick`/`onPointerMove` sobre cualquier mesh entrega `e.object`, `e.point`, `e.distance` — pero requiere recompilar si quieres añadir el handler. Para **no recompilar nunca**, monta una vez este puente (gated por query param, seguro para producción):

```tsx
// DebugBridge.tsx — <DebugBridge /> dentro del <Canvas>, activo solo con ?debug=1
import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'

export function DebugBridge() {
  const state = useThree()
  useEffect(() => {
    if (!new URLSearchParams(location.search).has('debug')) return
    ;(window as any).__scene = state // { scene, camera, gl, size, ... }
    return () => { delete (window as any).__scene }
  }, [state])
  return null
}
```

Desde la consola del navegador (sin recompilar, también contra la build de producción si dejas el flag):

```js
// ¿Qué hay bajo el cursor en x=842, y=310?
const { scene, camera, gl } = window.__scene
pickAt(842, 310, camera, scene, gl.domElement)
```

Fuentes: Raycaster docs https://threejs.org/docs/pages/Raycaster.html · ejemplo oficial interactivo https://github.com/mrdoob/three.js/blob/dev/examples/webgl_raycaster.html **[URL del ejemplo verificada a nivel de repo; el archivo concreto NO VERIFICADO]**.

### 2.3 GPU picking con IDs enteros (método moderno, exacto)

Es el enfoque del ejemplo oficial `webgl_interactive_cubes_gpu.html` (verificado, código extraído del repo): cada geometría lleva un atributo entero `id`; un `ShaderMaterial` GLSL3 lo escribe tal cual en un render target `RGBA32I`; se renderiza **solo el píxel bajo el cursor** usando `camera.setViewOffset(w, h, x*dpr, y*dpr, 1, 1)` y se lee con `readRenderTargetPixelsAsync`. Ventaja: enteros exactos, sin problemas de espacio de color, y solo cuesta renderizar 1 píxel.

```ts
import * as THREE from 'three'

// --- 1) Preparar escena de picking paralela ---
const pickingScene = new THREE.Scene()
const pickingTexture = new THREE.WebGLRenderTarget(1, 1, {
  type: THREE.IntType,
  format: THREE.RGBAIntegerFormat,
  internalFormat: 'RGBA32I',
})
const idToObject = new Map<number, THREE.Object3D>()

const pickingMaterial = new THREE.ShaderMaterial({
  glslVersion: THREE.GLSL3,
  vertexShader: /* glsl */`
    attribute int id;
    flat varying int vid;
    void main() {
      vid = id;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: /* glsl */`
    layout(location = 0) out int out_id;
    flat varying int vid;
    void main() { out_id = vid; }`,
})

function registerForPicking(mesh: THREE.Mesh) {
  const id = idToObject.size + 1
  idToObject.set(id, mesh)
  const g = mesh.geometry.clone() // o comparte geometría: solo se añade el atributo
  const arr = new Int16Array(g.attributes.position.count).fill(id)
  const attr = new THREE.Int16BufferAttribute(arr, 1, false)
  attr.gpuType = THREE.IntType
  g.setAttribute('id', attr)
  pickingScene.add(new THREE.Mesh(g, pickingMaterial))
}

// --- 2) Preguntar "¿qué hay en este píxel?" ---
const clearColor = new THREE.Color()
const pixelBuffer = new Int32Array(4)

export async function gpuPick(clientX: number, clientY: number, camera: THREE.Camera, renderer: THREE.WebGLRenderer) {
  const dpr = renderer.getPixelRatio()
  camera.setViewOffset(renderer.domElement.width, renderer.domElement.height,
                       Math.floor(clientX * dpr), Math.floor(clientY * dpr), 1, 1)

  renderer.setRenderTarget(pickingTexture)
  clearColor.setRGB(-1, -1, -1)            // fondo = -1 ⇒ “nada”
  renderer.setClearColor(clearColor)
  renderer.render(pickingScene, camera)
  renderer.setRenderTarget(null)
  camera.clearViewOffset()

  await renderer.readRenderTargetPixelsAsync(pickingTexture, 0, 0, 1, 1, pixelBuffer)
  const id = pixelBuffer[0]
  return id !== -1 ? idToObject.get(id) : null
}
```

Fuente verificada (ejemplo oficial, adaptación mínima):
https://github.com/mrdoob/three.js/blob/dev/examples/webgl_interactive_cubes_gpu.html
Manual relacionado (misma técnica paso a paso): https://threejs.org/manual/en/picking.html **[capítulo GPU picking; URL raíz del manual verificada]** y variante con texturas índice: https://threejs.org/manual/en/indexed-textures.html

Notas:
- `setViewOffset` funciona igual con `OrthographicCamera`: ajusta la matriz de proyección, así que tu cámara fija isométrica no se toca.
- Al usar un render target de 1×1 el coste por consulta es mínimo (importante en tu Radeon 610M).
- Si usas `InstancedMesh`, el raycaster CPU ya devuelve `instanceId`; para GPU picking con instancing añade el id por instancia (`instanceMatrix` + atributo).

### 2.4 Variante clásica: color único por objeto (con advertencia r152+)

Idea: material plano `MeshBasicMaterial` con `color.setHex(id)`; lees `(r<<16)|(g<<8)|b`. **Advertencia importante en three ≥ r152:** con `ColorManagement` activo, `setHex` convierte sRGB→linear y el valor escrito al buffer ya no coincide byte a byte con tu hex (salvo 0x000000 y 0xFFFFFF). Dos soluciones:

```ts
// Opción A: construir el color SIN conversión de espacio
new THREE.Color().setHex(hexId, THREE.NoColorSpace)

// Opción B: decodificar con tolerancia ±2 por canal y buscar el id más cercano
```

Lectura del píxel (si renderizas el target completo en vez del truco 1×1):

```ts
renderer.setRenderTarget(pickingTexture)
renderer.render(pickingScene, camera)
renderer.readRenderTargetPixels(pickingTexture, px, height - py - 1, 1, 1, buffer) // ¡ojo! origen abajo-izquierda
```

Referencias verificadas: https://riptutorial.com/three-js/example/17089/object-picking---gpu (variante color) · https://stackoverflow.com/questions/29673879/gpu-picking-in-three-js (explicación del decode) · https://stackoverflow.com/questions/59667779/ (problema devicePixelRatio en retina — aplica igual aquí).

### 2.5 `gl.readPixels` directo

Alternativa sin render targets: si creas el contexto con `{ preserveDrawingBuffer: true }` puedes leer el framebuffer tras `gl.render()` con `renderer.getContext().readPixels(...)`. En general es peor opción: obliga a `preserveDrawingBuffer` (coste), y leerías el frame final post-procesado (bloom/tone mapping alteran los colores-ID). Úsalo solo para debug puntual. Doc: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/readPixels

### ¿Cuál usar? (tu caso)

| Situación | Técnica |
|---|---|
| Diagnóstico interactivo ocasional (<200k tris visibles) | §2.2 Raycaster — suficiente y trivial |
| Escena con instancing masivo o lag de raycast | §2.3 RGBA32I |
| Necesitas el id de UN píxel concreto que el dueño marcó en una captura | §2.3 (el truco setViewOffset 1×1 es perfecto para esto) |

---

## 3. Visualizadores de depuración

### 3.1 Caja contenedora: `BoxHelper` / `Box3Helper`

Docs: https://threejs.org/docs/pages/Box3Helper.html · https://threejs.org/docs/pages/BoxHelper.html

```js
// Vanilla
const helper = new THREE.BoxHelper(objetoSospechoso, 0xffff00)
scene.add(helper)
// helper.update() cada frame si el objeto se mueve
```

### 3.2 Con R3F: `useHelper` (drei 10.x — tu versión exacta)

Fuente verificada: https://github.com/pmndrs/drei/blob/master/src/core/Helper.tsx · Docs: http://drei.docs.pmnd.rs/gizmos/helper-use-helper

```jsx
const ref = useRef()
useHelper(ref, BoxHelper, 'cyan')          // caja alrededor del mesh
// useHelper(ref, VertexNormalsHelper, 1, 'red') // normales de vértices
<mesh ref={ref}>…</mesh>
```

Detalles verificados del código fuente: el helper se añade a la escena en un layout-effect, se actualiza cada frame (`helper.update?.()`) y —importante para ti— **desactiva su propio raycast** para no ensuciar tus picks (`child.raycast = () => null`). Acepta `false` en lugar del ref para ocultarlo condicionalmente.

### 3.3 Modo normales / wireframe / x-ray global (un toggle, sin tocar materiales)

`scene.overrideMaterial` sustituye TODOS los materiales en un pase — ideal para ver geometría pura:

```js
// Normales (diagnóstico de shading raro, caras invertidas)
scene.overrideMaterial = new THREE.MeshNormalMaterial({ flatShading: true })
// Wireframe
scene.overrideMaterial = new THREE.MeshBasicMaterial({ wireframe: true })
// X-ray (todo transparente, sin depth): revela lo que está DENTRO de la chimenea
scene.overrideMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.15, depthWrite: false })
scene.overrideMaterial = null // restaurar
```

X-ray selectivo por objeto (sin override): clona el material del objeto y ponle `transparent: true, opacity: 0.2, depthWrite: false`.

Wireframe fino por objeto con drei: componente `<Wireframe>` (drei Misc) y `<Edges>` para resaltar aristas — https://drei.docs.pmnd.rs/misc/wireframe **[NO VERIFICADO: página concreta]** · listado de exports verificado: https://www.npmjs.com/package/@react-three/drei

### 3.4 Resaltar un objeto con outline

| Opción | Cómo | Cuándo |
|---|---|---|
| **drei `<Outlines>`** | inverted-hull; se pone como hijo del mesh. Props verificadas: `color`, `screenspace`, `opacity`, `transparent`, `thickness` (def 0.05), `angle` | Highlight barato, sin postprocesado |
| **postprocessing `OutlineEffect`** (tu lib 6.39) | `effect.selection.add(obj)`; opciones `edgeStrength`, `kernelSize`, `blur: true`, `xRay: true` (¡ve a través de paredes!) | Ya tienes EffectComposer |
| **three `OutlinePass`** addon | `new OutlinePass(res, scene, cam, [objs])` | Si no usas pmndrs/postprocessing |

Verificado: props de Outlines https://drei.docs.pmnd.rs/abstractions/outlines · OutlineEffect API https://pmndrs.github.io/postprocessing/public/docs/class/src/effects/OutlineEffect.js~OutlineEffect.html · consejo de `blur:true` para grosor https://github.com/pmndrs/postprocessing/issues/235 · OutlinePass https://threejs.org/docs/pages/OutlinePass.html

```jsx
// drei
<mesh><boxGeometry /><meshStandardMaterial /><Outlines thickness={0.05} color="hotpink" screenspace /></mesh>
```
```js
// postprocessing 6.x (dentro de un EffectPass)
const outline = new OutlineEffect(scene, camera, { edgeStrength: 3, blur: true, xRay: false })
outline.selection.add(sospechoso)
```

### 3.5 «¿Qué hay ENTRE la cámara y este punto?» (raycast con todos los impactos)

Para «se ve la pared dentro de la chimenea»: lista TODO lo que atraviesa el rayo, ordenado por distancia — el primer impacto tapa al segundo, etc.

```js
function whatsBetween(clientX, clientY, camera, scene, canvas) {
  const rc = new THREE.Raycaster()
  rc.setFromCamera(ndcFromClient(clientX, clientY, canvas), camera)
  return rc.intersectObjects(scene.children, true).map((h, i) => ({
    orden: i,
    dist: +h.distance.toFixed(2),
    nombre: h.object.name || h.object.type,
    punto: h.point.toArray().map(v => +v.toFixed(2)),
    cara: h.faceIndex,
  }))
}
console.table(whatsBetween(x, y, window.__scene.camera, window.__scene.scene, window.__scene.gl.domElement))
```

Interpretación típica: dos impactos casi solapados (`dist` difiere <0.05) con materiales distintos = z-fighting o pared metida donde no debe. Si el segundo impacto es algo que debería estar oculto pero se ve, revisa `depthWrite`/`transparent` del primero.

### 3.6 Chequeos geométricos automáticos («flota», «se sale»)

```js
// “ESTO FLOTA”: distancia vertical del objeto al suelo (y=0)
const box = new THREE.Box3().setFromObject(objeto)
console.log('min.y =', box.min.y.toFixed(3), '(si > 0.001 y no debe, flota)')
console.log('centro mundial =', objeto.getWorldPosition(new THREE.Vector3()).toArray())

// “EL PÉNDULO SE SALE DEL RELOJ”: corners fuera del contenedor
const penduloBox = new THREE.Box3().setFromObject(pendulo)
const relojBox  = new THREE.Box3().setFromObject(reloj)
if (!relojBox.containsBox(penduloBox)) {
  const corners = []
  for (let i = 0; i < 8; i++) {
    const c = new THREE.Vector3(
      i & 1 ? penduloBox.max.x : penduloBox.min.x,
      i & 2 ? penduloBox.max.y : penduloBox.min.y,
      i & 4 ? penduloBox.max.z : penduloBox.min.z)
    if (!relojBox.containsPoint(c)) corners.push(c.toArray())
  }
  console.log('corners que sobresalen:', corners)
}
// Solape parcial entre dos objetos (intersección aunque ninguno contenga al otro):
const intersecan = penduloBox.intersectsBox(relojBox)
```

Docs Box3: https://threejs.org/docs/pages/Box3.html

---

## 4. Automatizar la revisión — capturas antes/después

### 4.1 Comparadores de imágenes

| Librería | Versión verificada | Licencia | Fortalezas | Débilidades | URL |
|---|---|---|---|---|---|
| **pixelmatch** | 7.2.0 | ISC | ~150 líneas, 0 dependencias, detección anti-aliasing, métrica perceptual, corre en Node y browser sobre typed arrays | Mismo tamaño exigido; sin ignorar regiones nativo | https://github.com/mapbox/pixelmatch |
| **odiff** (`odiff-bin`) | 4.5.0 | MIT | Binario Zig SIMD: 6× más rápido que pixelmatch en benchmarks del propio repo; compara .png/.jpg/.webp cruzados; **ignorar regiones**; CLI y API Node | Binario por plataforma (postinstall elige binario) | https://github.com/dmtrKovalenko/odiff |
| **resemble.js** | 5.0.0 | MIT | `boundingBoxes` / `ignoredBoxes` / `ignoreAntialiasing` / `ignoreColors`; análisis de brillo/color por zona; umbral temprano | Depende de node-canvas en Node (instalación frágil); mantenimiento «ultra low-maintenance» declarado | https://github.com/rsmbl/Resemble.js |

```bash
npm i -D pixelmatch pngjs   # opción mínima
npm i -D odiff-bin          # opción rápida + ignore-regions
```

```js
// pixelmatch mínimo (Node)
import fs from 'node:fs'
import { PNG } from 'pngjs'
import pixelmatch from 'pixelmatch'

const a = PNG.sync.read(fs.readFileSync('antes.png'))
const b = PNG.sync.read(fs.readFileSync('despues.png'))
const diff = new PNG({ width: a.width, height: a.height })
const n = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: 0.1 })
fs.writeFileSync('diff.png', PNG.sync.write(diff))
console.log(`${n} píxeles distintos (${(100*n/(a.width*a.height)).toFixed(3)}%)`)
```

```js
// odiff con regiones ignoradas (API Node, verificado en README)
const { compare } = require('odiff-bin')
const { match, reason } = await compare('antes.png', 'despues.png', 'diff.png',
  { threshold: 0.1, ignoreRegions: [{ x1: 0, y1: 0, x2: 300, y2: 120 }] }) // ej. HUD
```

### 4.2 Detectar LA REGIÓN que cambió (bounding box del delta)

Con el `diff.data` de pixelmatch puedes calcular el rectángulo envolvente de los píxeles cambiados — te dice en qué sala/cornisa está el cambio sin mirar:

```js
let minX = Infinity, minY = Infinity, maxX = -1, maxY = -1
for (let y = 0; y < a.height; y++) for (let x = 0; x < a.width; x++) {
  const i = (y * a.width + x) * 4
  if (diff.data[i] !== 255 && (diff.data[i] || diff.data[i+1] || diff.data[i+2])) { // rojo = cambio
    minX = Math.min(minX, x); minY = Math.min(minY, y)
    maxX = Math.max(maxX, x); maxY = Math.max(maxY, y)
  }
}
console.log(maxX < 0 ? 'sin cambios' : { minX, minY, maxX, maxY })
```

### 4.3 Integración con Playwright — «pruebas visuales» de la escena 3D

API clave: `expect(page).toHaveScreenshot()` con `mask`, `maxDiffPixelRatio`, `animations: 'disabled'` — https://playwright.dev/docs/screenshots y https://playwright.dev/docs/api/class-pageassertions#page-assertions-to-have-screenshot-1

El problema real con WebGL: el mismo frame varía entre GPU/drivers/Chromium builds. Patrón determinista (prácticas contrastadas en proyectos reales de QA visual three.js):

1. **Modo testing en la app** (query param `?testing=1`): congela animaciones (`useFrame` early-return), fija cámara, semillas de random fijas, espera a que carguen texturas antes del shot (`networkidle` + señal propia tipo `window.__ready = true`).
2. **Renderer software fijo en CI** para que todos los runners pinten idéntico:
   `--use-gl=angle --use-angle=swiftshader-webgl --enable-unsafe-swiftshader` (o Mesa llvmpipe en Linux dedicado).
3. **Contenedor pinneado** de Playwright (`mcr.microsoft.com/playwright:vX.Y.Z-noble`) porque el antialiasing cambia entre builds de Chromium; baselines solo comparables dentro del mismo entorno.
4. **Tolerancia razonable**: `maxDiffPixelRatio: 0.01–0.05` según densidad de la escena; nunca 0.
5. Baselines se regeneran **a mano y a propósito** (`--update-snapshots`), nunca automáticamente.

```ts
// tests/visual.spec.ts
import { test, expect } from '@playwright/test'

test('diorama — vista isométrica estable', async ({ page }) => {
  await page.goto('/?testing=1')
  await page.waitForFunction(() => (window as any).__ready === true)
  await expect(page).toHaveScreenshot('diorama-iso.png', {
    maxDiffPixelRatio: 0.02,
    animations: 'disabled',
    mask: [page.locator('[data-hud]')], // excluye HUD/hora local
  })
})
```

Herramientas puente adicionales encontradas **[NO VERIFICADO en profundidad — evalúa tú]**:
- `@timjen/playwright-three` — matchers tipo `expect(scene.getByType('Point')).toHaveCountInScene(30)` exponiendo la escena en `window`. https://github.com/TimJentzsch/playwright-three
- `@react-three-dom/*` — espejo DOM del grafo R3F para Playwright/Cypress + matchers de color/posición por `userData.vizId`. https://github.com/surendra1151/react-three-dom

---

## 5. Diagnóstico de materiales — «¿por qué se ve blanco/lavado?»

### 5.1 Causas habituales (checklist ordenada por frecuencia)

1. **Tone mapping ACESFilmic**: desatura y colapsa contraste (es una compresión HDR→LDR intencional). Síntoma: colores pastel/grisáceos, hue shift en saturados. Prueba `NoToneMapping` o baja exposición para confirmar. Fuentes: https://discourse.threejs.org/t/acesfilmictonemapping-leading-to-low-contrast-textures/15484 · issue canónica https://github.com/mrdoob/three.js/issues/19169
2. **Exposición**: `renderer.toneMappingExposure` alto, o luz/env demasiado brillante empujando valores >1 que ACES aplana a blanco.
3. **Bloom con umbral HDR mal calibrado**: en pipeline HDR correcto (postprocesado), el tonemapping va AL FINAL (`<ToneMapping />` de react-postprocessing o `OutputPass`); si además queda el tonemapping builtin activo hay doble mapping. Con bloom, sube `luminanceThreshold` (~2) si trabajas en HDR. Fuente verificada (hilo con la receta exacta R3F+drei): https://discourse.threejs.org/t/r3-drei-difference-in-tonemapping-exposure-environment-intensity-from-9-78-2-to-9-88-3/57223 · guía OutputPass: https://discourse.threejs.org/t/tone-mapping-and-postprocessing/9868
4. **`envMapIntensity`**: con `Environment` de drei, cada `MeshStandardMaterial` tiene `envMapIntensity` (default 1). Un HDR luminoso lava todo. Bájalo por material o globalmente al volcar materiales (§5.3).
5. **`material.toneMapped = false` NO FUNCIONA con EffectComposer** (se ignora al renderizar a target): excepciones por material solo valen sin postprocesado. Verificado: https://discourse.threejs.org/t/pmndrs-post-processing-tone-mapping-guidance/59374
6. **colorSpace de texturas**: texturas de color sin `texture.colorSpace = THREE.SRGBColorSpace` se interpretan lineales → lavado/contraste erróneo. Docs color management: https://threejs.org/docs/manual/en/colorManagement.html

### 5.2 Experimento rápido sin recompilar

Con el `DebugBridge` de §2.2 montado, desde consola:

```js
const { scene, gl } = window.__scene
gl.toneMapping = 0 /* NoToneMapping */      // ¿cambia mucho? → el tone mapping era el culpable
gl.toneMappingExposure = 0.7                 // barrer exposición
scene.environmentIntensity = 0.5             // r163+: intensidad global del env map
// revertir: recargar la página
```

### 5.3 Volcar TODOS los materiales de la escena + detectar duplicados

```js
function auditMaterials(scene, renderer) {
  const usage = new Map(), rows = []
  scene.traverse(o => {
    if (!o.isMesh) return
    const mats = Array.isArray(o.material) ? o.material : [o.material]
    let path = []; let p = o
    while (p) { path.unshift(p.name || p.type); p = p.parent }
    for (const m of mats) {
      usage.set(m.uuid, (usage.get(m.uuid) ?? 0) + 1)
      rows.push({
        mesh: path.join('>'),
        mat: m.name || m.uuid.slice(0, 8),
        tipo: m.type,
        color: '#' + (m.color?.getHexString() ?? '——'),
        rough: m.roughness, metal: m.metalness,
        emissive: m.emissive ? '#' + m.emissive.getHexString() : undefined,
        emisInt: m.emissiveIntensity,
        envInt: m.envMapIntensity,
        transp: `${m.transparent}/${m.opacity}`,
        side: ['front','back','double'][m.side],
        toneMapped: m.toneMapped,
        map: !!m.map, normalMap: !!m.normalMap,
        fog: m.fog,
      })
    }
  })
  console.table(rows)
  console.warn('Materiales COMPARTIDOS (mismo uuid en varios meshes):',
    [...usage.entries()].filter(([, n]) => n > 1).map(([uuid, n]) => ({ uuid, n })))
  console.log('Estado renderer:', {
    toneMapping: renderer.toneMapping, exposure: renderer.toneMappingExposure,
    outputColorSpace: renderer.outputColorSpace,
    info: structuredClone(renderer.info),           // draw calls, geometrías, texturas en memoria
  })
}
auditMaterials(window.__scene.scene, window.__scene.gl)
```

Cómo leerlo:
- **Blanco/lavado generalizado** → mira columna `envInt` (¿todos a >=1?) y el estado del renderer (exposición/toneMapping).
- **Un objeto concreto blanco** → su `color` #ffffff + `rough`≈1 + `metal`≈0 bajo una env brillante, o `emisInt` disparado.
- **Duplicados**: muchos meshes con material propio idéntico (uuid distintos, mismos valores) = candidatos a compartir instancia; y `usage` con n grande sobre un uuid que NO esperabas compartido explica «cambié el material de X y cambió Y también».
- `renderer.info.memory.textures` creciendo frame a frame = fuga de texturas (materiales clonados sin dispose).

### 5.4 Aislar un material sospechoso en vivo

```js
const { scene } = window.__scene
const obj = scene.getObjectByName('chimenea')
obj.material.wireframe = true                    // confirmas que ES esa malla
obj.material.envMapIntensity = 0                 // ¿dejó de estar lavada?
obj.material.color.set('#ff0044')                // ping visual inmediato
```

### 5.5 Spector.js — ver QUÉ draw call pinta ese píxel (nivel GPU)

Extensión (Chrome/Firefox, MIT, BabylonJS): captura un frame completo y muestra **lista de comandos WebGL con su imagen resultante**, shaders, texturas y estado por draw call. Es agnóstico al engine/versiones → inmune a tu matrix three 0.185/R3F 9. Caso de uso directo: «punto naranja raro» → capturas el frame, avanzas comando a comando hasta que aparece, y el stack te dice qué shader/geometría lo produjo (además puedes exportar el capture JSON). Incluye servidor MCP para dejar que un agente IA analice capturas.

- Web: https://spector.babylonjs.com · GitHub (MIT): https://github.com/BabylonJS/Spector.js · Chrome: https://chromewebstore.google.com/detail/spectorjs/denbgaamihkadbghdceggmchnflmhpmk · Firefox: https://addons.mozilla.org/en-US/firefox/addon/spector-js/

Complementario, `renderer.info` (drawcalls/triángulos por frame) y `WebGLRenderer.info.reset/autoReset`: https://threejs.org/docs/pages/WebGLRenderer.html

---

## 6. TOP-8 por utilidad práctica para TU caso

Ordenado por relación impacto/esfuerzo para «el dueño señala un defecto → yo localizo la causa sin recompilar»:

| # | Qué | Instalar | Snippet mínimo para empezar |
|---|---|---|---|
| 1 | **DebugBridge + raycast por píxel** (§2.2) — la base de todo | nada, ~40 líneas propias | `<DebugBridge/>` en el Canvas; consola: `pickAt(x,y,camera,scene,canvas)` |
| 2 | **Volcado de materiales + duplicados** (§5.3) | nada, ~30 líneas propias | `auditMaterials(scene, gl)` en consola |
| 3 | **drei `useHelper` + `BoxHelper`/`Box3Helper`** (§3.1–3.2) | ya lo tienes (drei 10.7) | `useHelper(ref, BoxHelper, 'cyan')` |
| 4 | **Toggle overrideMaterial** normales/wireframe/x-ray (§3.3) | nada | `scene.overrideMaterial = new THREE.MeshNormalMaterial()` |
| 5 | **Spector.js** para el nivel draw-call/shader | extensión de navegador (gratis) | botón rojo → capture → avanza comandos |
| 6 | **GPU picking RGBA32I** (§2.3) cuando el raycast tire corto | nada, código propio | `gpuPick(x, y, camera, renderer)` |
| 7 | **leva 0.10** para tunear exposición/envMap/luz en vivo | `npm i leva` | `const v = useControls({ exposure: { value: 1, min: 0, max: 3 } })` → `gl.toneMappingExposure = v.exposure` |
| 8 | **Playwright + pixelmatch/odiff** para regresiones entre builds | `npm i -D playwright pixelmatch pngjs` | patrón completo §4.3 |

*(r3f-perf queda fuera del top-8: tu problema es de identificación espacial, no de rendimiento; además su conflicto con drei 10 lo hace costoso ahora mismo.)*

---

## Anexo — Mapa «queja del dueño» → procedimiento exacto

| Queja textual | Procedimiento (todo desde consola con `?debug=1`, sin recompilar) |
|---|---|
| «Esto flota» | ① `pickAt(x,y)` → objeto. ② `Box3().setFromObject(o).min.y` vs suelo. ③ Si flota: `o.getWorldPosition()` y busca quién debía anclarlo |
| «Se ve la pared dentro de la chimenea» | ① `whatsBetween(x,y)` (§3.5) → impactos ordenados. ② Revisa `transparent/depthWrite/side` de los 2 primeros. ③ Confirma con x-ray (§3.3) |
| «Hay un punto naranja raro» | ① `pickAt(x,y)`. ② Si no da nada → es efecto, no malla: Spector capture y avanza hasta que aparezca. ③ Prueba desactivar bloom en consola (`composer` expuesto) |
| «El péndulo se sale del reloj» | ① Pick péndulo y reloj. ② Test `containsBox`/corners (§3.6). ③ `BoxHelper` en ambos para verlo en pantalla |
| «Todo lavado/blanco» | ① `auditMaterials` (§5.3) + estado renderer. ② `NoToneMapping` / exposure / `environmentIntensity` en vivo (§5.2) |

---

## Fuentes principales (todas visitadas durante la investigación)

**Oficiales three.js**
- Ejemplo GPU picking (IDs enteros): https://github.com/mrdoob/three.js/blob/dev/examples/webgl_interactive_cubes_gpu.html
- Manual picking/indexed textures/rendertargets: https://threejs.org/manual/en/picking.html · https://threejs.org/manual/en/indexed-textures.html · https://threejs.org/manual/en/rendertargets.html
- Docs Raycaster/Box3/Box3Helper/OutlinePass/WebGLRenderer: https://threejs.org/docs/pages/Raycaster.html · https://threejs.org/docs/pages/Box3.html · https://threejs.org/docs/pages/Box3Helper.html · https://threejs.org/docs/pages/OutlinePass.html · https://threejs.org/docs/pages/WebGLRenderer.html
- Extensión DevTools en repo: https://github.com/mrdoob/three.js/tree/dev/devtools

**Ecosistema pmndrs**
- r3f-perf: https://github.com/utsuboco/r3f-perf (+issue overrides: …/issues/62)
- leva: https://github.com/pmndrs/leva (+PR React19 #511, fix radix #537)
- drei (useHelper, Outlines, Stats, Wireframe, Edges): https://github.com/pmndrs/drei · https://drei.docs.pmnd.rs/gizmos/helper-use-helper · https://drei.docs.pmnd.rs/abstractions/outlines
- postprocessing OutlineEffect: https://pmndrs.github.io/postprocessing/public/docs/class/src/effects/OutlineEffect.js~OutlineEffect.html (+issue #235)
- Triplex: https://triplex.dev · https://github.com/pmndrs/triplex — ⚠️ licencia no declarada (verificado ausencia)
- @react-three/editor (archivado): https://github.com/pmndrs/react-three-editor

**Inspectores**
- three-devtools (archivado): https://github.com/threejs/three-devtools
- three-inspect: https://github.com/threlte/three-inspect (npm 0.7.2, MIT)
- Fork moderno WIP **[NO VERIFICADO]**: https://github.com/vimcaw/three-devtools

**Diffing/QA visual**
- pixelmatch: https://github.com/mapbox/pixelmatch (npm 7.2.0, ISC)
- odiff: https://github.com/dmtrKovalenko/odiff (npm odiff-bin 4.5.0, MIT)
- resemble.js: https://github.com/rsmbl/Resemble.js (npm 5.0.0, MIT)
- Playwright screenshots: https://playwright.dev/docs/screenshots
- Patrones QA WebGL: https://github.com/yomero243/threejs-visual-qa · https://github.com/TimJentzsch/playwright-three **[NO VERIFICADO]** · https://github.com/surendra1151/react-three-dom **[NO VERIFICADO]**

**Diagnóstico de color/material**
- Tone mapping wash-out: https://github.com/mrdoob/three.js/issues/19169 · https://discourse.threejs.org/t/acesfilmictonemapping-leading-to-low-contrast-textures/15484 · https://discourse.threejs.org/t/pmndrs-post-processing-tone-mapping-guidance/59374 · https://discourse.threejs.org/t/r3-drei-difference-in-tonemapping-exposure-environment-intensity-from-9-78-2-to-9-88-3/57223 · https://discourse.threejs.org/t/effectcomposer-dulls-lighting-effects/60408
- Color management: https://threejs.org/docs/manual/en/colorManagement.html
- Spector.js: https://spector.babylonjs.com · https://github.com/BabylonJS/Spector.js (MIT)

*Informe generado siguiendo el método del encargo: búsqueda web + GitHub, URLs citadas, compatibilidad three 0.185 / R3F 9.7 / React 19 comprobada caso por caso. Elementos no comprobables en esta sesión quedaron marcados **[NO VERIFICADO]**.*
