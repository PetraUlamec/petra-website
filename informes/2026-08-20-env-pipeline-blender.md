[0m
> build · deepseek-v4-flash-free
[0m
[0m◈ [0mParallel Web Search "Blender baking addon GitHub free AO normal curvature ORM texture"
[0m◈ [0mParallel Web Search "GLTF EXT_mesh_gpu_instancing three.js InstancedMesh workflow Blender"
[0m◈ [0mParallel Web Search "Blender glTF exporter KHR_texture_basisu KTX2 export support 2026"
[0m◈ [0mParallel Web Search "gltf-transform GitHub repository license KTX2 meshopt"
[0m◈ [0mParallel Web Search "UVPackmaster community edition GitHub free license"
[0m◈ [0mParallel Web Search "Blender glTF exporter KTX2 "Basis Universal" texture export option 5.1 manual basisu"
[0m◈ [0mParallel Web Search "three.js texture memory budget 60fps mobile integrated GPU draw calls best practices environment"
[0m◈ [0mParallel Web Search "Blender trim sheet workflow bake atlas tiles UDIM web three.js"
[0m◈ [0mParallel Web Search ""Bake Wrangler" Blender addon GitHub license normal AO curvature cavity"
[0m◈ [0mParallel Web Search "google/draco GitHub license Apache 2.0 glTF KHR_draco_mesh_compression"
Investigación hecha y verificada (documentación Blender 5.1, Khronos, repos oficiales, benchmarks iGPU/móvil 2026). Informe:

---

# WORKFLOW DE ENVIRONMENT MODELING — Diorama tienda de té (Blender 5.1 → three.js)

## 0. Encaje con tu fábrica bpy

Tu fábrica ya hace colocación sin solapes + raycast al suelo. Ese es el **pase de instancing** del final. Lo que falta para "ultrarrealista en web" es todo lo que ocurre **antes** (modelado por pases) y **después** (bake, atlas, export optimizado). Regla de oro: **la fábrica bpy no debe crear mallas finales, solo instancias** de un kit ya bakeado.

---

## 1. Pases: bloqueo → refinado → detalle

Trabajar en **3 pases separados** (jamás modelar directo el resultado final) congelando cada uno:

| Pase | Nombre | Qué se hace | Salida |
|---|---|---|---|
| 0 | **Bloqueo / whitebox** | Cajas y primitivas sobre una **rejilla modular** (p. ej. 1 m), escala real (1u=1m en Blender), cámara isométrica fija (orto, e.g. 30°/45°), composición (regla de tercios), solo siluetas masas. | `_BLOCK` collection |
| 1 | **Refinado / graybox** | Formas reales con **bevels** (orgánico de 0,5–2 mm en una tienda), proporciones, despieces (qué es muro, mostrador, estantería), **seams de UV decididos aquí** (las UV se hacen en graybox, no al final). | `_LOW` collection |
| 2 | **Detalle / highpoly + bake** | Subdivisión/MultiRes para detalle (maderas, grietas), **props héroes** (tetera, tazas, cerámica), luego se bakea todo al `_LOW`. | `_HP` + `_LOW` |

**Consejos para diorama isométrico:**
- El 90% del realismo lo da el **bake de AO/curvature + trim sheet**, no el polycount.
- Los props repetidos (tazas, latas, señales) se modelan **una vez** y se instancian en el pase 0.
- Mantén `_HP` en una colección separada y exclúyela del export (viewport render disable).

---

## 2. Trim sheets y atlas para web

### Tamaños recomendados (móvil/iGPU)

| Superficie | Tipo | Tamaño | Por qué |
|---|---|---|---|
| Arquitectura (muros, suelos, madera, yeso) | Trim sheet | **2048×2048** | Una sola textura para todas las paredes/techos |
| Props de set (estanterías, mostradores, latas) | Atlas 1024–2048 | **1024×1024** | Comparten material |
| Props héroes (tetera) | Atlas propio | **1024×1024** | Cerca de cámara en iso |
| Escurridizos minúsculos (tazas, monedas, granos) | Atlas compartido | **512×1024** | Instanced, a penas se ven |

**NO uses UDIM para web**: three.js no lo maneja bien y en móvil es gasto de VRAM puro. Una sola textura 4K = 64 MB en VRAM; un trim de 2K = 16 MB. El trim sheet de 2048 es el punto dulce.

**Trim sheet**: una imagen 2048 con **densidad texel constante** (p. ej. 1024 px por metro) que recubres con UV repetidas. Los elementos (madera, yeso, listón, azulejo, esquinas) se pintan/bakean una vez y se reutilizan.

### Canales ORM (la clave para glTF)

**ORM = R=AO, G=Roughness, B=Metallic**, una sola textura `Non-Color` de 8 bits. Es literalmente el estándar glTF: el slot `occlusionTexture` comparte la imagen de `metallicRoughnessTexture` (R=occlusión no usado por el material base). El exporter de Blender **ya lo fusiona así** si conectas las imágenes según la convención.

**Regla de empaquetado para ahorrar muestras de textura (bandwidth):**
- `baseColor` → sRGB, PNG/ETC1S.
- `ORM` (R=AO+curvature, G=rough, B=metal) → 1 textura, Non-Color, UASTC.
- `normal` → 1 textura, Non-Color, UASTC.
- Total por material: **3 texturas** (o 4 si hay emisivo para luces de neón/ventanas).

> Tip ultrarrealista: multiplica AO × curvature en el canal R del ORM. Sustituye la textura AO separada y ganas micro-detalle gratis (ver §3).

---

## 3. Baking en Blender (AO / normal / curvature → texturas para three)

Todo bake con **Cycles**, GPU Compute, y un cage/`Max Ray Distance` correcto (High→Low).

### Recetas concretas

**AO**
1. Bake type `Ambient Occlusion`, samples 256 (iteración: 16 + denoiser).
2. Salida `Non-Color`, 8-bit PNG o 16-bit EXR si piensas retocarla.

**Normal**
1. Bake type `Normal`, Selected to Active.
2. **three.js usa OpenGL Y+** (Blender coincide): no voltear el canal verde. Solo voltéalo si un test visual en three lo pide (nunca asumas DirectX).

**Curvature** (Blender no tiene bake de curvature nativo → truco):
```
Geometry node → Pointiness → ColorRamp → Emission → Bake type Emit
```
Dos pases (cóncavo/claro y convexo/oscuro) para control fino, o uno solo si usas rampa. 8-bit Non-Color.

**Roughness / Metallic** desde highpoly procedural:
1. Bake each channel por separado (tipo `Emit` con la salida del shader o via "reroute" — los addons de §6 lo automatizan).
2. **Empaquetar ORM**: crear imagen ORM 8-bit y en nodos `Combine RGB` (R=AO, G=Rough, B=Metal) → `Emission` → bake `Emit` sobre ella.

**BaseColor**: bake `Diffuse`/`Combined` desde el HP al UV del LP (incluye texturas de madera, papel, cerámica).

### Checklist de bake
- [ ] Apply scale/rotation en LP y HP.
- [ ] Cage o Extrude (2–3 cm) — no rayo infinito.
- [ ] `Bake Margin` 8–16 px (evita bleeding de mips).
- [ ] Color spaces correctos: baseColor=sRGB; normal/ORM/AO/curvature=Non-Color.
- [ ] Mips: genera la pirámide (three la necesita; sin ella aliasing a distancia).
- [ ] Todos los UV en tile 0–1 único (solo un set UV por material; el exporter glTF exige el mismo UV map).

---

## 4. Instancing y modularidad (kit de piezas)

**Modularidad**: define un **kit** con convención de nombres, todo en origen global para que encaje en la rejilla:

```
kit_wall_plaster_A   kit_shelf_wood_B   kit_counter_stone_C
kit_floor_plank_D    kit_prop_teacup_E  kit_prop_lamp_F
```
Prefijo + material + variante. Cada pieza del kit comparte el **mismo material** (trim sheet/atlas) → así puedes instanciar sin multiplicar draw calls.

**Dos niveles de instancing:**

1. **En Blender (export directo)**: activa **"GPU Instances"** en el exporter → emite `EXT_mesh_gpu_instancing`. Todo lo que tu fábrica coloca como instancias de un collection sale como `InstancedMesh` en three.js. Verifícalo con `gltf-transform inspect scene.glb` (debe aparecer en `extensionsUsed`).
2. **En post-proceso (plan B)**: si exportas mallas duplicadas, `gltf-transform optimize in.glb out.glb --instance --instance-min 5` convierte duplicados en instancias automáticamente.

Para tu diorama: tazas/latas/señales = instancias; muros y estanterías = estáticos que puedes **fusionar** (merge) porque comparten atlas → 1 draw call por pieza-mergida.

---

## 5. Presupuesto para 60fps en iGPU

Frame = 16,7 ms. En iGPU el cuello de botella es **draw calls + fill rate + VRAM compartida**, no el vertex count. Objetivos concretos para este diorama:

| Recurso | Presupuesto | Notas |
|---|---|---|
| Triángulos totales | **< 150–250k** | El 90% en props instanced; el kit bajo 2k tris/pieza |
| Draw calls | **< 60** (ideal < 30) | Instancing + merge de estáticos + 1 material por atlas |
| VRAM texturas | **< 200 MB** (ideal < 100) | 2–3 atlas de 2048 + normales; con KTX2 el consumo en GPU baja ~4–6× |
| Luces realtime | **≤ 2** (1 directional + fill) | >3 luces cuesta más que todo lo demás; el resto se bakea |
| Shadow maps | 1024–2048, máx 2 casters | Un PointLight con sombra = 6 renders extra |
| Postproceso | FXAA/MSAA4 o nada | Nada de bloom full-res en iGPU |
| Polígonos por pieza kit | 500–2.000 | Los héroes (tetera) 5–8k, pero 1–2 copias |

**Reglas dureas** (verificado en benchmarks 2026): una textura 4K descomprimida = 64 MB (móvil típico 2–4 GB compartidos; no caben varias). KTX2 **permanece comprimida en GPU**; PNG/JPEG se descomprimen enteras en VRAM. Mide con `renderer.info.render.calls` y `renderer.info.memory.textures` en cada frame durante desarrollo; la memoria debe ser estable, no crecer (usa `.dispose()`).

---

## 6. Herramientas bpy/addons GRATIS (repos exactos + licencia)

| Herramienta | Repo | Licencia | Para qué |
|---|---|---|---|
| **glTF-Blender-IO** (built-in) | `KhronosGroup/glTF-Blender-IO` | Apache-2.0 | Export glTF/GLB, Draco, GPU instances, AO, UDIM |
| **TexTools** | `SavMartin/TexTools-Blender` | GPL | Igualar texel density, bake panel, UV toolset |
| **Ucupaint** | `ucupumar/ucupaint` | GPL-3.0 | Texturizado por capas + **bake de curvature/thickness/wireframe** (desde v2.4.9) + empaquetar ORM a un solo canal pack |
| **PAWS: Bakery** | `pawsgineer/b3d_paws_bakery` (también en extensions.blender.org) | GPL | Bake game-ready one-click: Color/Rough/Metal/Normal/AO/**AORM**/MaterialID, batch a atlas y por-objeto |
| **SimpleBake** | `HaughtyGrayAlien/SimpleBake` (extensions.blender.org) | GPL | Panel de bake PBR con tus materiales actuales, sin rework de nodos |
| **Auto Bake** | `tsybe/AutoBake` (extensions.blender.org) | GPL | Bake masivo, incluye soporte UDIM |
| **Atlas Bake** | `JohnDelta/atlas_bake` + docs `JohnDelta/atlas_bake_documentation` | GPL-3.0-or-later | Bake a atlas multi-objeto + **presets de canal pack ORM/MS/HDRP** en subproceso headless (compatible con tu fábrica bpy) |
| **Bake Wrangler** | no es repo; GPL, gratis vía Gumroad/Superhive (docs: `netherby/bakewrangler-doc`) | GPL | Baking por nodos reutilizables, batch, empaquetado RGB |
| **glTF-KTX-texture** | `tonis2/glTF-KTX-texture` | Apache-2.0 | Export KTX2 **directo desde Blender** (ETC1S/UASTC/ASTC nativo) vía KTX-Software |
| **EXT-mesh-gpu-instancing fork** | `takahirox/glTF-Blender-IO-EXT-mesh-gpu-instancing` | Apache-2.0 (fork) | Prototipo experimental GN→instancing (solo si necesitas algo que el exporter 5.1 no hace) |
| **UVPackmaster Community** | `uvpackmaster.com` (addon GPL, motor EULA, edición comunidad gratis) | GPL/EULA | Empaquetado UV eficientísimo (alternativa: Pack Islands nativo + TexTools, 100% libres) |

**Bake Wrangler y SimpleBake no están en GitHub** (Gumroad/extensiones), ojo con citarlos como repo.

---

## 7. Integración: export GLB → compresión → three.js

### Paso A — Export desde Blender 5.1
```
Archivo → Export → glTF 2.0 (.glb)
Format: glTF Binary (.glb)
✓ Export Selected/Visible (solo el diorama)
✓ +Y Up, Apply transform (Apply Modifiers: on)
✓ GPU Instances
Mesh Compression: Draco (Opcional — mejor luego con gltf-transform)
Texturas: PNG
```
Blender 5.1 exporta nativamente: `KHR_draco_mesh_compression`, `EXT_mesh_gpu_instancing`, AO vía node group `glTF Material Output`→input `Occlusion`, UDIM (no para web), y extensiones de material de realismo (`KHR_materials_transmission`, `clearcoat`, `ior`, `specular`) ideales para cristal/cerámica del té.

### Paso B — Optimización con gltf-transform (MIT)
```bash
npm i -g @gltf-transform/cli
gltf-transform inspect diorama.glb

# Texturas de color → KTX2 ETC1S (sRGB)
gltf-transform etc1s diorama.glb t1.glb --quality 255

# No-color (normal + ORM) → KTX2 UASTC (calidad)
gltf-transform uastc t1.glb t2.glb \
  --slots "{normalTexture,occlusionTexture,metallicRoughnessTexture}" \
  --level 4 --rdo --rdo-lambda 4 --zstd 18

# Geometría (si no usaste Draco en Blender)
gltf-transform meshopt t2.glb final.glb --level medium
# o alternativo: gltf-transform draco final_pre.glb final.glb --method edgebreaker
```
Alternativa todo-en-uno con **gltfpack** (`zeux/meshoptimizer`, MIT):
```bash
gltfpack -i diorama.glb -o diorama_web.glb -cc -tc   # meshopt + KTX2/basisu
```
**Nota KTX2**: dimensiones múltiplos de 4 y potencia de 2; `ETC1S` para color (sRGB), `UASTC` para normal/ORM (lineal) — es lo que exige `KHR_texture_basisu`. glTF-Transform no escribe fallback PNG cuando convierte a KTX2, así que el loader debe soportarlo (three.js sí).

### Paso C — three.js
```js
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const renderer = new THREE.WebGLRenderer({ antialias: true });

const draco = new DRACOLoader()
  .setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
const ktx2 = new KTX2Loader()
  .setTranscoderPath('https://www.gstatic.com/basisu/')
  .detectSupport(renderer);

new GLTFLoader()
  .setDRACOLoader(draco)
  .setKTX2Loader(ktx2)
  .setMeshoptDecoder(MeshoptDecoder)
  .load('/diorama_web.glb', (gltf) => {
    const root = gltf.scene;        // las instancias llegan como InstancedMesh
    scene.add(root);
    // raycast/placing: guárdate el mapa nombre→mesh si tu fábrica necesita hit-testing
  });
```

### Flujo final recomendado (idempotente y automatizable con tu fábrica bpy)
```
bpy fábrica (bloqueo/raycast/instancias)
  → Blender headless: bake HP→LP (AO/normal/curvature/ORM)
  → export GLB (GPU Instances, PNG, AO node group)
  → gltf-transform: etc1s(baseColor) + uastc(ORM,normal) + meshopt
  → three.js: GLTFLoader + DRACO/KTX2/Meshopt decoders
```

---

## Repos citados (resumen con licencias)

- `donmccurdy/glTF-Transform` — **MIT**
- `zeux/meshoptimizer` (gltfpack) — **MIT**
- `google/draco` — **Apache-2.0**
- `BinomialLLC/basis_universal` — **Apache-2.0**
- `KhronosGroup/glTF-Blender-IO` — **Apache-2.0**
- `KhronosGroup/KTX-Software` (toktx) — **Apache-2.0**
- `tonis2/glTF-KTX-texture` — **Apache-2.0**
- `SavMartin/TexTools-Blender` — **GPL**
- `ucupumar/ucupaint` — **GPL-3.0**
- `pawsgineer/b3d_paws_bakery` — **GPL**
- `JohnDelta/atlas_bake` — **GPL-3.0-or-later**
- `tsybe/AutoBake` — **GPL**
- `HaughtyGrayAlien/SimpleBake` — **GPL** (no en GitHub, en extensions.blender.org)
- `takahirox/glTF-Blender-IO-EXT-mesh-gpu-instancing` — fork Apache-2.0 (experimental)
- `mrdoob/three.js` — **MIT**

La pila 100% libre y sin fricción para tu caso: **Blender 5.1 export + gltf-transform + three.js**; añade **PAWS Bakery o Atlas Bake** para el bake y **Ucupaint** para empaquetar el ORM. No necesitas UDIM, ni 4K, ni herramientas de pago para este diorama.
