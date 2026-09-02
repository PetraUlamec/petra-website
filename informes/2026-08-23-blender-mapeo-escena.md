# SEGUNDO AUDITOR DE COLOCACIÓN CON BLENDER — mapear la escena three.js en bpy (explorador, 23-ago-2026)

**Objetivo real de SER:** «si hace falta mapear dónde está cada cosa, cada objeto, encuentra algo de GitHub/GitLab o docs de Blender y cómo usarlo AL COMPLETO sin fallas».
Queremos un auditor de colocación **independiente** del de trimesh (`scripts/ver_escena.py`, que lee triángulos vía CDP) para **cruzar resultados**: misma escena, dos motores distintos
(trimesh en Python vs. BVH de Blender), y si discrepan, alguien miente.

**Qué hay instalado (medido, no de memoria):**
- `/usr/local/bin/blender` → symlink a `/opt/blender-4.4.3-linux-x64/blender` = **Blender 4.4.3** (ve todo el disco).
- `flatpak run org.blender.Blender` = **Blender 5.1.1** (hash b70da489d7f4, 14-abr-2026), importador glTF `io_scene_gltf2 5.1.19`, permisos `filesystems=host`.
  **No es 5.1.2** (lo que decía el encargo): es 5.1.1. Y el sandbox **NO comparte `/tmp` ni `/var/tmp` con el host** (medido: un script en `/tmp/claude-…` da «could not be opened»;
  su `/var/tmp` está vacío). Todo fichero de intercambio con el Flatpak va bajo `/home` (p.ej. `web/.audit/`) o se genera dentro con `--python-expr`.
- Todo lo de abajo se probó en **las dos versiones** con el mismo script y dio **resultados idénticos** (BVH, ray_cast, import glTF).

**Convención:** CONFIRMADO = leído en código/doc oficial o medido aquí · PROBABLE = fuente secundaria o deducción · PROPUESTA = diseño mío, sin ejecutar.

---

## 0 · LA VÍA RECOMENDADA (resumen de 8 pasos; el detalle está en §1-§5)

1. **Etiquetar en three** cada pieza con `userData = { pieza: "jar-7", sala: "salon", audit: true|false }` (se exporta como `extras` y Blender lo importa como custom properties — medido).
2. **Exportar la escena viva a GLB desde la app** (componente `ExportGltf` montado con `?gltf=1` que expone `window.__exportGLB()`), disparado desde Playwright por CDP igual que hace `ver_escena.py`.
   Guardar en `web/.audit/escena-<ruta>.glb` (bajo `/home`, visible para el Flatpak).
3. **Importar headless**: `blender -b --factory-startup --python scripts/auditar_en_blender.py -- --glb … --out …` (4.4.3) y/o `flatpak run org.blender.Blender -b …` (5.1.1).
   `bpy.ops.import_scene.gltf(filepath, import_shading='NORMALS', merge_vertices=False, import_scene_extras=True)`.
4. **Recordar el cambio de ejes**: glTF/three son Y-up y Blender Z-up → **Blender (x, y, z) = (three.x, −three.z, three.y)** (medido con un nodo en `[1,2,3]` → `(1, −3, 2)`). `minY` de three = `min z` en Blender.
5. **Árboles BVH en ESPACIO MUNDO** por objeto (`bmesh.from_mesh` + `bm.transform(matrix_world)` + `BVHTree.FromBMesh`). **Nunca `BVHTree.FromObject` a secas**: es espacio local (medido: dos cubos a 5 m «chocan»).
6. **Apoyo**: desde los vértices más bajos de la pieza, rayo −Z contra los árboles de TODOS los demás objetos (no contra el propio) → `gap` (flotando si > 5 mm) y `sobre` (qué lo sostiene). Es lo que hace `apoyar_en_suelo`/`_posar` de `fabrica_blender.py` y el add-on Drop It, pero sin `hide_set` ni mover nada.
7. **Choques**: prefiltro AABB → `tree_a.overlap(tree_b)` (cruce de superficies) **+ paridad de rayos** para contención (medido: `overlap` da 0 pares con un cubo dentro de otro) → profundidad con `find_nearest`.
8. **Salida JSON** por pieza: `pieza · centro · minY · apoyo · veredicto · choques` (+ fuera de límites, inclinación, escala anómala), en coordenadas de three para cruzar 1:1 con `ver_escena.py mapa`.

---

## 1 · EXPORTAR LA ESCENA VIVA A glTF (three 0.185.1, `GLTFExporter` de `three/addons`)

### 1.1 Qué exporta y qué NO — CONFIRMADO leyendo `node_modules/three/examples/jsm/exporters/GLTFExporter.js` (0.185.1)
| Cosa de la escena | ¿Llega al GLB? | Evidencia |
|---|---|---|
| **Nombres** de nodos/meshes/materiales | SÍ (`nodeDef.name = String(object.name)` L2501; materiales L1812) | código |
| **Jerarquía** (Group → nodo con children) | SÍ; Blender la importa como Empties con parent (medido `grupo` → `hijo`) | código + prueba |
| **`userData`** | SÍ → `extras` (`serializeUserData`, L763-798; solo JSON serializable, avisa si no) → **custom properties** en Blender con `import_scene_extras=True` (medido: `{'pieza':'jar-7','sala':'salon'}`) | código + prueba |
| **Texturas de canvas** (madera/yeso/lino procedurales) | SÍ: `HTMLCanvasElement`/`OffscreenCanvas`/`ImageBitmap` → `canvas.toBlob` PNG embebido (L547-574, L1496-1505) | código |
| `MeshStandardMaterial` / `MeshPhysicalMaterial` (incl. `MeshTransmissionMaterial` de drei, que extiende Physical) | SÍ (PBR + KHR_materials_clearcoat/sheen/transmission/ior/volume/specular/iridescence/dispersion/emissive_strength, EXT_materials_bump) | cabecera L60-90 |
| **`ShaderMaterial`** (drei `Sparkles`, `Text` de troika, `shaderMaterial`, `MeshPortalMaterial`…) | **NO**: `console.warn('GLTFExporter: THREE.ShaderMaterial not supported.'); return null` (L1644-1648) → la malla sale **sin material** (la geometría sí) | código |
| Parches `onBeforeCompile` (sway) | NO (es shader; la geometría sí, sin deformar) | por diseño |
| **`InstancedMesh`** (drei `<Instances>`) | SÍ → `EXT_mesh_gpu_instancing` (`GLTFMeshGpuInstancing.writeNode`, L3542) → Blender 5.1 crea **un objeto por instancia** (`manage_gpu_instancing` en `blender/imp/vnode.py` L200-239, `VNode.Inst`, `name=None`) | código three + código importador 5.1.1 |
| `Points` (polvo) / `Line` | SÍ (modo POINTS/LINES, L1863-1881); PROBABLE: Blender los importa como malla de vértices/aristas sueltas | código three |
| Luces | direccional/puntual/spot SÍ (KHR_lights_punctual); **ambient/hemisphere NO** | cabecera |
| `Decal` de drei (DecalGeometry) | SÍ, como malla fina pegada al host → **registrará choque con su host**: etiquetar `audit:false` | por diseño |
| Objetos con `visible=false` (DebugBoxes apagadas, etc.) | NO con `onlyVisible: true` (default, L651) | código |
| `Html` de drei, fog, Environment, post-proceso, sombras | NO (no son geometría) | por diseño |
| El `input` debe ser `instanceof Scene` de **la misma copia de three** (L2758); si no, lo envuelve en `AuxScene` (L2725) y exporta igual | código |

Doc oficial (firma y opciones): https://threejs.org/docs/pages/GLTFExporter.html — `parseAsync(input, options): Promise<ArrayBuffer|string>`; opciones `trs` (default false), `onlyVisible` (true), `binary` (false), `maxTextureSize` (Infinity), `animations` ([]), `includeCustomExtensions` (false). Import: `three/addons/exporters/GLTFExporter.js`.

### 1.2 Vía A (recomendada): exportar DESDE la app, disparado por CDP — PROPUESTA (30 líneas para el constructor)
La página ya expone `window.__scene` y `window.__camera` (`SceneShell.tsx`, `onCreated`). `ver_escena.py` ya se conecta con Playwright por CDP (`connect_over_cdp`, `PETRA_CDP`, default 9333).
Lo que falta es que la app tenga el exportador (misma copia de three → `instanceof Scene` correcto, texturas de canvas accesibles, nada de CDN):
```tsx
// src/components/three/ExportGltf.tsx — montar en SceneShell solo si la URL lleva ?gltf=1 (como DebugBoxes/EditorVivo)
"use client";
import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
export default function ExportGltf() {
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    (window as unknown as { __exportGLB?: () => Promise<string> }).__exportGLB = async () => {
      const { GLTFExporter } = await import("three/addons/exporters/GLTFExporter.js"); // chunk aparte, solo con ?gltf=1
      const ocultos: THREE.Object3D[] = [];
      scene.traverse((o) => { if (o.userData?.audit === false && o.visible) { o.visible = false; ocultos.push(o); } }); // decals, texto, polvo…
      try {
        const buf = (await new GLTFExporter().parseAsync(scene, { binary: true, onlyVisible: true, trs: true })) as ArrayBuffer;
        const bytes = new Uint8Array(buf); let s = "";
        for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
        return btoa(s); // base64 → Playwright lo recoge con page.evaluate
      } finally { ocultos.forEach((o) => (o.visible = true)); }
    };
  }, [scene]);
  return null;
}
```
Y en Python (mismo patrón que `ver_escena.py conecta()`):
```python
b64 = page.evaluate("() => window.__exportGLB()")
open(f"/home/ser/Documentos/PETRA-WEBSITE-TÉ/web/.audit/escena-{ruta}.glb", "wb").write(base64.b64decode(b64))
```
`trs: true` conserva translation/rotation/scale por nodo (Blender lee ambas formas; con TRS la escala anómala se lee directa de `obj.scale`). Un GLB de primitivas con 4 texturas de canvas pesa pocos MB: `page.evaluate` lo devuelve sin problema (PROBABLE; si creciera, partir en trozos o pasar por `/api`).

### 1.3 Vía B (sin tocar la app): inyectar un bundle del exportador por CDP — PROBABLE
Empaquetar `GLTFExporter` + three en un IIFE (esbuild/rollup; **esbuild no está como binario en `node_modules/.bin`**, Next lo lleva embebido) que exponga `window.__GLTFExporter`, e inyectarlo con `page.add_script_tag(path=…)`.
Funciona porque el exportador duck-typea (`isMesh`, `isBufferGeometry`, `isMeshStandardMaterial`…) y sus `instanceof` son solo de tipos del navegador/TypedArrays/`CompressedTexture`/`Scene` (L547-2758): con otra copia de three el `instanceof Scene` falla y envuelve en `AuxScene` (exporta igual, un nivel más de jerarquía). Más frágil y más trabajo que la vía A; solo si no se puede tocar la app.

### 1.4 Vía C (ya existe): el JSON de triángulos de `ver_escena.py` → glTF a mano
`extraer()` ya saca triángulos en mundo por pieza; podría escribirse un `.gltf` mínimo (nodos + buffers) sin pasar por GLTFExporter. Pierde materiales y jerarquía real, y deja de ser **independiente** del primer auditor (mismos datos de entrada). Descartada para «cruzar resultados».

---

## 2 · IMPORTAR EN BLENDER HEADLESS Y AUDITAR CON bpy

### 2.1 `bpy.ops.import_scene.gltf` — parámetros REALES del 5.1.1 (introspección RNA del binario instalado; CONFIRMADO)
```
filepath: STRING = ''                 # Filepath used for importing the file
files: COLLECTION · directory · filter_glob='*.glb;*.gltf' · loglevel: INT = 0
import_pack_images: BOOLEAN = True    # Pack all images into .blend file
merge_vertices: BOOLEAN = False       # glTF exige vértices discontinuos; True fusiona (NO para auditar: cambia la malla)
import_shading: ENUM = 'NORMALS' | ['NORMALS','FLAT','SMOOTH']
bone_heuristic: ENUM = 'BLENDER' | ['BLENDER','TEMPERANCE','FORTUNE'] · disable_bone_shape=False · bone_shape_scale_factor=1.0 · guess_original_bind_pose=True
import_webp_texture: BOOLEAN = False
import_unused_materials: BOOLEAN = False          # (solo 5.x)
import_select_created_objects: BOOLEAN = True
import_scene_extras: BOOLEAN = True   # Import scene extras as custom properties
import_scene_as_collection: BOOLEAN = True         # (solo 5.x; en 4.4.3 NO existe)
import_merge_material_slots: BOOLEAN = True        # (solo 5.x)
export_import_convert_lighting_mode: ENUM = 'SPEC' | ['SPEC','COMPAT','RAW']
```
4.4.3 tiene el mismo juego **menos** `import_scene_as_collection`, `import_unused_materials`, `import_merge_material_slots` (medido) → el script NO debe pasar esos tres si corre en 4.4.3 (o pasarlos solo si `bpy.app.version >= (4,2,0)` y existen en `get_rna_type().properties`).
Docs: API https://docs.blender.org/api/current/bpy.ops.import_scene.html · manual (4.4) https://docs.blender.org/manual/en/4.4/addons/import_export/scene_gltf2.html (la ruta `latest/addons/...` da 404 hoy).
El importador es add-on **core** (`addons_core/io_scene_gltf2`): está disponible con `--factory-startup` y en `-b` (medido `hasattr(bpy.ops.import_scene,'gltf') == True`).
Extensiones que el importador 5.1.1 entiende (grep del código): `EXT_mesh_gpu_instancing, EXT_texture_webp, KHR_draco_mesh_compression, KHR_lights_punctual, KHR_materials_{anisotropy,clearcoat,emissive_strength,ior,iridescence,pbrSpecularGlossiness,sheen,specular,transmission,unlit,variants,volume}, KHR_mesh_quantization, KHR_texture_transform, KHR_animation_pointer`.

### 2.2 Ejes, rotación y escala tras importar — MEDIDO en 5.1.1
- Nodo glTF `translation [1,2,3]` → `matrix_world.translation = (1.0, −3.0, 2.0)` ⇒ **`B = (x, −z, y)`** y la inversa **`three = (Bx, Bz, −By)`**.
- Nodo con `rotation` = 30° sobre Y(three) y `scale [1,2,3]` → `obj.scale = (1, 3, 2)`; local +Z de Blender en mundo = `(0,0,2)` (= el «arriba» de three, sin girar); local +Y en mundo = `(−1.5, 2.598, 0)` = giro de +30° sobre Z.
  ⇒ **three «up» (+Y local) = Blender +Z local; three «forward» (−Z local) = Blender +Y local**; un giro sobre el eje vertical conserva el signo.
- **Los objetos importados vienen con `rotation_mode = 'QUATERNION'`**: `rotation_euler` vale `(0,0,0)` aunque estén girados. Leer siempre `matrix_world` (o `rotation_quaternion`). Trampa real, medida.
- `extras` → `obj['pieza']`, `obj['sala']` (medido). Jerarquía → Empties con `parent` (medido).

### 2.3 Las tres funciones de geometría que importan (firmas REALES del 5.1.1; CONFIRMADO por introspección)
- **`Scene.ray_cast(depsgraph, origin, direction, distance)`** → `(result, location, normal, index, object, matrix)` — «Cast a ray onto evaluated geometry in **world-space**».
  Es la que usa `apoyar_en_suelo` (`fabrica_blender.py` L177-187) y Drop It. Pega contra TODO, incluido el propio objeto (por eso `_posar` lo esconde con `hide_viewport=True` + `view_layer.update()`; comentario del fichero: «Medido en bpy 5.1: si no se oculta, el rayo golpea SU PROPIA malla»).
- **`Object.ray_cast(origin, direction, distance, depsgraph)`** → `(result, location, normal, index)` — «in **object space**». Medido: con origen en coordenadas de mundo devuelve `False`; con `matrix_world.inverted() @ origen` devuelve `True`. **Object.closest_point_on_mesh** también en espacio local.
- **`mathutils.bvhtree.BVHTree`** (docs https://docs.blender.org/api/current/mathutils.bvhtree.html):
  - `FromObject(object, depsgraph, *, deform=True, cage=False, epsilon=0.0)` — en 5.1 **ya no existe el parámetro `render`** que sí tiene 4.4.3 (`FromObject(object, depsgraph, deform=True, render=False, cage=False, epsilon=0.0)`). Y es **espacio LOCAL** (medido: A en (0,0,0) y B en (5,0,0) → `overlap` = 2 pares; con árboles en mundo → 0).
  - `FromBMesh(bmesh, *, epsilon=0.0)` y `FromPolygons(vertices, polygons, *, all_triangles=False, epsilon=0.0)` → la forma correcta: transformar a mundo antes.
  - `overlap(other_tree)` → «list of unique index pairs, the first index referencing this tree, the second referencing the other_tree». **Solo cruces de superficie**: un cubo totalmente dentro de otro da `[]` (medido).
  - `ray_cast(origin, direction, distance)` y `find_nearest(origin, distance)` → `(position, normal, index, distance)` o `None`s. `find_nearest_range` → lista.
- Depsgraph: `bpy.context.evaluated_depsgraph_get()` y `obj.evaluated_get(dg).data` para la malla evaluada (sin modificadores tras importar glTF, pero es lo correcto). https://docs.blender.org/api/current/bpy.types.Depsgraph.html
- `Object.bound_box` (8 esquinas locales; a mundo con `matrix_world @ Vector(c)`, como `_aabb()` de la fábrica) https://docs.blender.org/api/current/bpy.types.Object.html

### 2.4 Los cinco chequeos (diseño; cada uno con su base verificada)
1. **Apoyo / flotando / hundido** — de cada pieza, sus k vértices más bajos (los que están a < 3 mm del `min z`; Drop It usa `get_lowest_verts`), origen = vértice + `(0,0,+1 mm)`, rayo `(0,0,−1)` contra los árboles-mundo de **los demás** objetos (cache por objeto, como `bvh_cache` de BlenderProc) → `gap = min(dist) − 1 mm`; si ningún rayo toca, `sobre = "suelo"` y `gap = min z − z_suelo`.
   Veredicto: `flotando` si `gap > 5 mm`; `hundido` si la pieza tiene vértices bajos DENTRO del objeto de apoyo (paridad) o `min z < top del soporte − 2 mm`; `ok` en otro caso. Umbrales = los mismos que use `ver_escena.py` para poder cruzar (ahí: penetración `umbral=0.005`).
2. **Choques malla-a-malla** — prefiltro AABB (como `check_bb_intersection` de BlenderProc) → `overlap` entre árboles-mundo → si 0 pares, test de **contención** (centro y 4-8 vértices de A con paridad de rayos contra B y viceversa) → profundidad = máx. `find_nearest` de los vértices interiores. Excluir pares padre↔hijo de la misma pieza, pares con `extras.audit==false` (decals, texto), y reportar los «exentos declarados» igual que `bateria.py geo2`.
3. **Fuera de límites** — AABB de la pieza vs. límites de la sala (del suelo: la malla cuya `extras.rol=="suelo"` o nombre `suelo*`/`floor*`; o un JSON sidecar por sala) con tolerancia 1 cm; también `min z < z_suelo − 2 mm`.
4. **Orientación** — `up = matrix_world.to_3x3() @ (0,0,1)`; `inclinación = angle(up, Z)`; `inclinado` si > 2° y la pieza no lleva `extras.tilt_ok`. «Forward» (`matrix_world.to_3x3() @ (0,1,0)` = −Z de three): comparar con la normal de la pared más cercana solo para piezas con `extras.forward=true` (estanterías, cuadros): `mal_orientado` si el ángulo > 20°.
5. **Escala anómala** — familia = prefijo de `extras.pieza` (`jar-`, `cup-`…) o del nombre; tamaño = diagonal del AABB mundo; mediana y MAD por familia; `escala` si `|d − mediana| > 3·MAD` y > 5 %. Además `scale` no uniforme con ratio > 3 entre ejes (con `trs:true` llega tal cual).

---

## 3 · ADD-ONS Y REPOS QUE YA HACEN (PARTE DE) ESTO — con URL, licencia y compatibilidad

| Repo / add-on | Qué hace | Licencia | Blender | Headless | Veredicto |
|---|---|---|---|---|---|
| **Drop It** — https://github.com/hannesdelbeke/drop-it-blender-addon (rehost del original de Andreas Aust: https://andreasaust.gumroad.com/l/drop_it) | Operador `object.drop_it`: baja objetos hasta la superficie con `context.scene.ray_cast(dgraph, origin, (0,0,-1), distance=1000)` desde `get_lowest_verts(obj)` tras `obj.hide_set(True)`; «Align to surface normal»; «Collision in Selection». Exactamente el patrón de `_posar`. | **GPL-3.0** (LICENSE) | `bl_info["blender"] = (2,80,0)`, v1.2, último commit 2023-10-31 → add-on **legacy**; PROBABLE que cargue en 4.x/5.x pero **no verificado** (no instalado) | Es un operador interactivo (usa `window_manager` y selección) → en `-b` hace falta `context.temp_override` | **No instalar**: copiar la idea (ya está copiada en la fábrica). Sirve como referencia de «apoyo por raycast» con 600+ estrellas. |
| **BlenderProc `CollisionUtility`** — https://github.com/DLR-RM/BlenderProc (`blenderproc/python/utility/CollisionUtility.py`, `types/MeshObjectUtility.py`) | `check_bb_intersection` (AABB) → `check_mesh_intersection`: `inter = len(obj1_BVHtree.overlap(obj2_BVHtree)) > 0` y si no, `is_point_inside_object` (punto más cercano y `dot` con la normal: `a >= 0.0`); `create_bvh_tree`: `bm.from_mesh(...); bm.transform(Matrix(local2world)); BVHTree.FromBMesh(bm)`; `create_bvh_tree_multi_objects`; cache de árboles. Diseñado para Blender **headless** (es su modo normal). | **GPL-3.0** | BlenderProc 2.x descarga su propio Blender (4.x); el módulo es bpy puro | Sí | **La referencia de código** para §2.4 (copiar lógica, citar). Su test de «dentro» por normal es más barato que la paridad pero falla con mallas abiertas/no convexas; la paridad es más robusta (medida). |
| **rpopovici/mesh-utils** — https://github.com/rpopovici/mesh-utils | Selección de caras que se cruzan/solapan con BVHTree/KDTree. Limitaciones declaradas: «co-planar intersections are not detected», «face inside face not detected», «false positive with adjacent faces», `epsilon=0.0` obligatorio. | GPL-3.0 | sin `bl_info` visible en la página; PROBABLE 2.8x | UI | Útil solo como confirmación de los límites de `overlap`. |
| **glonorce/Blender_mcp** — https://github.com/glonorce/Blender_mcp | MCP dentro de Blender con «BVH assembly analysis»: «Surface gaps: actual vertex-to-face distance», «Interpenetration: BVH face overlap, not just AABB», `VERIFY_ASSEMBLY` («must_touch, parent_must_be»). | **MIT** (© 2026 Göksel Özkan) | «5.0 or later» | NO («Blender must be installed and running»; servidor TCP en el propio Blender, marshal a main thread) | Hace lo que queremos pero como agente MCP interactivo; demasiado aparato para un auditor por lotes. Leer su análisis de huecos como referencia. |
| **HugoMontanes/Blender_Asset_Validator** — https://github.com/HugoMontanes/Blender_Asset_Validator | Naming (regex), transforms sin aplicar, presupuesto de triángulos, ngons, caras degeneradas, UVs, materiales vacíos | MIT | 4.0+ | UI (panel N) | Valida ASSETS, no colocación. No aplica. |
| Interplanety «Checking for overlapping» — https://b3d.interplanety.org/en/checking-for-overlapping/ | Snippet canónico: «the meshes they are built from must be in the same coordinate system» → `m @ vertex.co` + `FromPolygons` + `overlap` | artículo | — | — | Confirma el pitfall que medí. |
| Issue oficial blender-addons #50721 «BVH overlap() failing to detect intersection due to bmesh rotation not updating…» — https://projects.blender.org/blender/blender-addons/issues/50721 | Mismo pitfall de espacio/actualización | — | — | — | Citado como antecedente (la página devuelve 403 a WebFetch; no pude leer el texto). |
| 3D-Print Toolbox / MeasureIt | Auto-intersecciones de UNA malla / medidas en viewport | GPL | **No vienen bundled en 5.1.1** (medido: `addon_utils.modules()` = bl_pkg, cycles, io_scene_gltf2, fbx, node_wrangler, rigify…); están en extensions.blender.org | — | No resuelven colocación entre objetos. No instalar. |

**No encontré** ningún repo que haga «auditoría de colocación de escena» completa (apoyo + choques + límites + orientación + escala) con salida JSON y headless. Lo más cercano es BlenderProc (colisiones) y Blender_mcp (huecos/penetración, pero interactivo). Por eso el esquema de §5 **compone** lo verificado en vez de instalar nada.

**Instalación headless de un add-on, si algún día hiciera falta** (no lo hice): `blender -b --python-expr "import bpy; bpy.ops.preferences.addon_install(filepath='/ruta/addon.zip'); bpy.ops.preferences.addon_enable(module='nombre'); bpy.ops.wm.save_userpref()"` (legacy) o, para extensiones 4.2+, `bpy.ops.extensions.package_install_files(...)`. PROBABLE (no verificado aquí); en Flatpak las preferencias viven en `~/.var/app/org.blender.Blender/`.

---

## 4 · EL PUENTE DE EIDOS COMO «NAVEGADOR»: qué funciona y qué no — MEDIDO
- `curl -s http://localhost:8003/health` → `{"port":8003,"service":"bridge_to_eidos","status":"ok"}`. Sin `EIDOS_BRIDGE_KEY` en el proceso no pide `X-API-Key` (código L89-103).
- **No existe `/browse`** (grep del fichero: 0 rutas). Rutas reales: `/health /agent /agent/run /plan /memory/* /metrics /validate /answer /orchestrator/* /talk /status /brain /study /proactive /inject /episodes /semantic /chroma_stats /brain/neurons /hunt_phish /sync_chroma /consolidate /ask_brain /scan /investiga /gui /find_docs /self_analyze`.
- `/scan` = inventario de ventanas (+moondream si `vision:true` → **inferencia**, no lo llamé). `/gui` = acciones de escritorio (`core.gui_automator`) → movería el ratón de SER, no lo usé. `/talk` con «abre el navegador…» abre Firefox ESR/Chromium **en pantalla** (fast-path L1170-1254) → tampoco.
- **`/find_docs` SÍ navega sin LLM**: `POST {"topic","url"}` → `colony_studier._fetch_url(url)` (HTTP puro) + DuckDuckGo Instant Answer, e **indexa 2000 caracteres** en `~/.eidos/evolution_brain.db` (`knowledge_nodes`, `concept = "docs:<topic>:official"`). Probado con `https://docs.blender.org/api/current/mathutils.bvhtree.html` (donde WebFetch recibe 403) → `{"nodes_added":1, "urls_found":[…]}` y con `https://github.com/gkjohnson/three-mesh-bvh` → `nodes_added:1`.
  **Pero** el cuerpo devuelto son 300 caracteres y lo indexado son los primeros 2000 = el menú de navegación («Contents Menu Expand Light mode Dark mode…»). `/memory/search?q=bvhtree` no lo encuentra (otro almacén) y `/semantic` responde `ChromaDB no disponible`. Lo leí directamente de `brain.db` en solo lectura para comprobarlo.
  **Veredicto:** el puente sirve para que **EIDOS indexe** una URL (y saltarse el 403 de WebFetch), **no para que yo lea docs**. Para leer usé `curl -A "Mozilla/5.0"` (docs.blender.org responde 200 a curl) y, sobre todo, **introspección del propio Blender** (`get_rna_type().properties`, docstrings de `BVHTree`), que es la fuente más fiable posible: la del binario instalado.
- Efecto colateral declarado: dejé 2 nodos nuevos en el cerebro de EIDOS (`docs:mathutils bvhtree overlap:official`, `docs:three-mesh-bvh github:official`). Sin LLM en ningún paso.
- `vivo_eidos.py` / `hp.py` con Chromium en el HDMI: **no los lancé** (el CDP 9333 lo usa el panel del orquestador; orden explícita de no chocar).

---

## 5 · ESQUEMA `scripts/auditar_en_blender.py` — PROPUESTA (no ejecutado; lo construye el constructor)

Invocación (los dos Blender; el `--` separa los argumentos del script, doc oficial https://docs.blender.org/manual/en/latest/advanced/command_line/arguments.html — «End option processing, following arguments passed unchanged. Access via Python's sys.argv»):
```bash
# 4.4.3 (ve /tmp y todo)
blender -b --factory-startup --python scripts/auditar_en_blender.py -- --glb web/.audit/escena-salon.glb --out web/.audit/auditoria-salon.json --suelo-z 0
# 5.1.1 Flatpak (solo rutas bajo /home)
flatpak run org.blender.Blender -b --factory-startup --python /home/ser/Documentos/PETRA-WEBSITE-TÉ/web/scripts/auditar_en_blender.py -- --glb /home/ser/Documentos/PETRA-WEBSITE-TÉ/web/.audit/escena-salon.glb --out /home/ser/Documentos/PETRA-WEBSITE-TÉ/web/.audit/auditoria-salon-51.json
```
Correr los DOS y hacer `diff` de los JSON es un cruce gratis (mismo script, dos binarios).

```python
# scripts/auditar_en_blender.py — ESQUEMA. Auditor de colocación #2 (Blender/bpy), independiente de ver_escena.py (trimesh).
# Entrada: GLB exportado desde la app (GLTFExporter, trs:true, extras {pieza, sala, audit}). Salida: JSON por pieza en coords de THREE.
# Verificado en 4.4.3 y 5.1.1: BVH en espacio mundo (FromBMesh+transform), overlap + paridad, Scene.ray_cast mundo, ejes (x,-z,y).
import bpy, bmesh, json, sys, math, statistics, mathutils
from mathutils import Vector
from mathutils.bvhtree import BVHTree

# ---------- argumentos tras '--' ----------
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
def arg(k, d=None):
    return argv[argv.index(k) + 1] if k in argv else d
GLB, OUT = arg("--glb"), arg("--out", "/dev/stdout")
SUELO_Z = float(arg("--suelo-z", "0"))
TOL_FLOTA, TOL_PEN, TOL_INCL = 0.005, 0.005, 2.0   # 5 mm, 5 mm, 2° (alinear con ver_escena.py)

# ---------- importar ----------
bpy.ops.wm.read_factory_settings(use_empty=True)
kw = dict(filepath=GLB, import_shading="NORMALS", merge_vertices=False, import_scene_extras=True, import_pack_images=False)
props = {p.identifier for p in bpy.ops.import_scene.gltf.get_rna_type().properties}
if "import_scene_as_collection" in props: kw["import_scene_as_collection"] = False   # solo 5.x
bpy.ops.import_scene.gltf(**kw)
bpy.context.view_layer.update()
DG = bpy.context.evaluated_depsgraph_get()

# ---------- utilidades de espacio ----------
def a_three(v):   # Blender (x,y,z) -> three (x, y_up, z) ; medido: three=(Bx, Bz, -By)
    return [round(v.x, 4), round(v.z, 4), round(-v.y, 4)]
def tree_mundo(ob):
    bm = bmesh.new(); bm.from_mesh(ob.evaluated_get(DG).data); bm.transform(ob.matrix_world)
    t = BVHTree.FromBMesh(bm); bm.free(); return t          # NUNCA FromObject: es espacio local (medido)
def verts_mundo(ob):
    return [ob.matrix_world @ v.co for v in ob.evaluated_get(DG).data.vertices]
def aabb(vs):
    return (Vector((min(v.x for v in vs), min(v.y for v in vs), min(v.z for v in vs))),
            Vector((max(v.x for v in vs), max(v.y for v in vs), max(v.z for v in vs))))
def aabb_solapa(a, b, tol=0.0):
    return all(a[0][i] - tol <= b[1][i] and b[0][i] - tol <= a[1][i] for i in range(3))
def dentro(tree, p, d=Vector((0.37, 0.21, 0.9))):   # paridad de rayos (overlap NO ve contención; medido)
    n, o = 0, p.copy()
    for _ in range(64):
        hit, _n, _i, _d = tree.ray_cast(o, d)
        if hit is None: break
        n += 1; o = hit + d.normalized() * 1e-4
    return n % 2 == 1

# ---------- piezas: raíz con extras.pieza, o Empty raíz con mallas, o malla suelta ----------
def raiz_pieza(ob):
    o = ob
    while o:
        if "pieza" in o.keys(): return o
        o = o.parent
    top = ob
    while top.parent: top = top.parent
    return top
mallas = [o for o in bpy.data.objects if o.type == "MESH" and o.get("audit", True) is not False]
piezas = {}
for m in mallas:
    r = raiz_pieza(m); piezas.setdefault(r.name, {"raiz": r, "mallas": []})["mallas"].append(m)

# ---------- cache de árboles y vértices en mundo ----------
T = {m.name: tree_mundo(m) for m in mallas}
V = {m.name: verts_mundo(m) for m in mallas}
BB = {m.name: aabb(V[m.name]) for m in mallas}

def apoyo(p):
    """gap (m) y objeto de apoyo: rayos -Z desde los vértices más bajos contra los árboles de OTRAS piezas."""
    mis = {m.name for m in p["mallas"]}
    vs = [v for m in p["mallas"] for v in V[m.name]]
    zmin = min(v.z for v in vs)
    bajos = [v for v in vs if v.z - zmin < 0.003][:64]
    mejor = (None, None)
    for v in bajos:
        o = v + Vector((0, 0, 0.001))
        for name, t in T.items():
            if name in mis: continue
            hit, n, i, d = t.ray_cast(o, Vector((0, 0, -1)), 5.0)
            if hit is not None and (mejor[0] is None or d < mejor[0]): mejor = (d, name)
    if mejor[0] is None: return {"sobre": "suelo", "gap": round(zmin - SUELO_Z, 4)}
    return {"sobre": mejor[1], "gap": round(mejor[0] - 0.001, 4)}

def choques(p):
    out, mis = [], {m.name for m in p["mallas"]}
    for m in p["mallas"]:
        for name, t in T.items():
            if name in mis or not aabb_solapa(BB[m.name], BB[name], TOL_PEN): continue
            pares = T[m.name].overlap(t)
            contenido = (not pares) and (dentro(t, sum(V[m.name], Vector()) / len(V[m.name])) or dentro(T[m.name], sum(V[name], Vector()) / len(V[name])))
            if not pares and not contenido: continue
            prof = 0.0
            for v in V[m.name][::max(1, len(V[m.name]) // 48)]:
                if dentro(t, v):
                    q = t.find_nearest(v)
                    if q[0] is not None: prof = max(prof, q[3])
            out.append({"con": raiz_pieza(bpy.data.objects[name]).name, "malla": name, "pares": len(pares),
                        "contenido": contenido, "profundidad_mm": round(prof * 1000, 1)})
    return out

# ---------- familias para escala anómala ----------
def familia(r): return (r.get("pieza") or r.name).split("-")[0].rstrip("0123456789.")
def _diag(p):
    lo, hi = aabb([v for m in p["mallas"] for v in V[m.name]]); return (hi - lo).length
diag = {n: _diag(p) for n, p in piezas.items()}
fam = {}
for n, p in piezas.items(): fam.setdefault(familia(p["raiz"]), []).append(diag[n])

informe = []
for n, p in piezas.items():
    r = p["raiz"]; vs = [v for m in p["mallas"] for v in V[m.name]]; lo, hi = aabb(vs)
    up = (r.matrix_world.to_3x3() @ Vector((0, 0, 1))).normalized()          # = +Y de three (medido)
    incl = math.degrees(up.angle(Vector((0, 0, 1))))
    ap, ch = apoyo(p), choques(p)
    ds = fam[familia(r)]; med = statistics.median(ds); mad = statistics.median([abs(d - med) for d in ds]) or 1e-9
    esc = len(ds) >= 3 and abs(diag[n] - med) > 3 * mad and abs(diag[n] - med) / med > 0.05
    s = r.scale; no_unif = max(s) / max(min(s), 1e-9) > 3
    ver = []
    if ap["gap"] > TOL_FLOTA: ver.append("flotando")
    if any(c["profundidad_mm"] > TOL_PEN * 1000 for c in ch): ver.append("choca")
    if lo.z < SUELO_Z - 0.002: ver.append("hundido")
    if incl > TOL_INCL and not r.get("tilt_ok"): ver.append("inclinado")
    if esc or no_unif: ver.append("escala")
    informe.append({
        "pieza": r.get("pieza") or r.name, "sala": r.get("sala"), "nombre_blender": r.name, "mallas": len(p["mallas"]),
        "centro": a_three((lo + hi) / 2), "tamano": [round(hi.x - lo.x, 4), round(hi.z - lo.z, 4), round(hi.y - lo.y, 4)],  # (ancho, alto, fondo) de three
        "minY": round(lo.z, 4),                      # 'minY' de three = min z de Blender
        "apoyo": ap, "inclinacion_deg": round(incl, 2), "diag": round(diag[n], 4), "scale": [round(x, 3) for x in s],
        "veredicto": ver or ["ok"], "choques": ch,
    })
json.dump({"glb": GLB, "blender": bpy.app.version_string, "piezas": len(informe), "informe": informe}, open(OUT, "w"), ensure_ascii=False, indent=1)
print(f"AUDITORIA {len(informe)} piezas → {OUT}")
```
Notas para el constructor: (1) `find_nearest` mide distancia a la superficie de B desde un vértice de A que está dentro → profundidad de penetración; (2) el prefiltro AABB con `TOL_PEN` evita O(N²) de `overlap` (N≈300 mallas → solo vecinos); (3) `read_factory_settings(use_empty=True)` quita el cubo/luz/cámara por defecto (si no, el «Cube» de fábrica se auditaría); (4) coordenadas de salida en **three** para `diff` directo con `ver_escena.py mapa`; (5) `import_pack_images=False` no evita la decodificación de PNG — si tarda, exportar sin texturas (el exportador no tiene opción; se puede poner `material.map=null` temporalmente en `__exportGLB`); (6) para cruzar con el auditor 1, clave de unión = `extras.pieza` (y `name` como respaldo: Blender añade `.001` a los duplicados).

---

## 6 · TRAMPAS (todas medidas aquí salvo las marcadas)
- `BVHTree.FromObject` = **espacio local** → falsos «choques» entre objetos separados. Usar `FromBMesh` tras `bm.transform(matrix_world)` o `FromPolygons` con vértices transformados.
- `overlap()` **no detecta contención** (cubo dentro de cubo → `[]`): añadir paridad de rayos (o el test de normal de BlenderProc).
- `Object.ray_cast` / `closest_point_on_mesh` son **espacio local**; `Scene.ray_cast` es mundo pero golpea al propio objeto (esconderlo con `hide_viewport` + `view_layer.update()`, como `_posar`, o usar árboles de «los demás»).
- Objetos importados de glTF: `rotation_mode='QUATERNION'` → `rotation_euler` miente; usar `matrix_world`.
- Ejes: three `(x,y,z)` → Blender `(x,−z,y)`; `scale [1,2,3]` → `(1,3,2)`. `minY` ≡ `min z`.
- Flatpak 5.1.1: **ni `/tmp` ni `/var/tmp` del host**; ficheros bajo `/home`. Y es **5.1.1**, no 5.1.2.
- 4.4.3 no tiene `import_scene_as_collection`/`import_unused_materials`/`import_merge_material_slots` → comprobar `get_rna_type().properties` antes de pasarlos. `FromObject` en 4.4.3 aún admite `render=`; en 5.1.1 no.
- GLTFExporter: `ShaderMaterial` → malla sin material (Sparkles, Text de troika); `onlyVisible:true` salta lo oculto; `userData` no serializable → aviso y se omite; decals = choque con su host → `audit:false`.
- `read_factory_settings(use_empty=True)` antes de importar, o auditas el cubo de fábrica.
- docs.blender.org: 403 a WebFetch, 200 a `curl -A Mozilla`; la ruta del manual glTF en `latest/addons/...` es 404 (usar `manual/en/4.4/addons/import_export/scene_gltf2.html` o la API).
- `gh api` aquí da «Bad credentials» (token caducado): listar GitHub con `curl https://api.github.com/repos/<o>/<r>/contents` sin auth funciona.

## 7 · LO QUE NO PUDE VERIFICAR
- El add-on Drop It en 4.x/5.x (no instalado por orden); `@react-three` no interviene aquí. El issue #50721 (403). Cómo nombra Blender las instancias GPU (`name=None` en el importador → PROBABLE nombre de malla + sufijo).
- El script de §5 **no se ha ejecutado**: es un esquema con las primitivas ya probadas una a una (import, ejes, BVH mundo, overlap, paridad, ray_cast). El constructor debe probarlo primero con 3 cubos (uno flotando, uno hundido, uno cruzado) antes de la escena real — examen sorpresa, no solo la escena.
- Tiempo de ejecución con ~300 mallas: PROBABLE < 10 s (árboles BVH en C; el bucle Python de paridad es lo más lento → muestrear vértices como en el esquema).

## 8 · FUENTES
- three: GLTFExporter doc https://threejs.org/docs/pages/GLTFExporter.html · código local `node_modules/three/examples/jsm/exporters/GLTFExporter.js` (0.185.1)
- Blender API: BVHTree https://docs.blender.org/api/current/mathutils.bvhtree.html · Object https://docs.blender.org/api/current/bpy.types.Object.html · Scene https://docs.blender.org/api/current/bpy.types.Scene.html ·
  Depsgraph https://docs.blender.org/api/current/bpy.types.Depsgraph.html · import_scene https://docs.blender.org/api/current/bpy.ops.import_scene.html · CLI https://docs.blender.org/manual/en/latest/advanced/command_line/arguments.html ·
  manual glTF (4.4) https://docs.blender.org/manual/en/4.4/addons/import_export/scene_gltf2.html · introspección RNA/docstrings de los binarios 4.4.3 y 5.1.1 (este informe)
- Repos: Drop It https://github.com/hannesdelbeke/drop-it-blender-addon (GPL-3, `object.drop_it`) · BlenderProc https://github.com/DLR-RM/BlenderProc (GPL-3; `CollisionUtility.py`, `MeshObjectUtility.create_bvh_tree`) ·
  mesh-utils https://github.com/rpopovici/mesh-utils · Blender_mcp https://github.com/glonorce/Blender_mcp (MIT, Blender ≥5.0) · Blender_Asset_Validator https://github.com/HugoMontanes/Blender_Asset_Validator (MIT) ·
  Interplanety https://b3d.interplanety.org/en/checking-for-overlapping/ · issue #50721 https://projects.blender.org/blender/blender-addons/issues/50721
- Proyecto: `scripts/fabrica_blender.py` (`apoyar_en_suelo`, `_posar`, `_aabb`), `scripts/ver_escena.py` (CDP + trimesh), `.claude/skills/ver-escena-3d/SKILL.md`, `/home/ser/EIDOS/core/bridge_to_eidos.py` (+ `core/screen_scanner.py::find_docs`)
