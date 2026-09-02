# INFORME — Materiales, luz y post-proceso por shader para la tienda de té isométrica

**Stack objetivo:** three.js 0.185 · @react-three/fiber 9.7 · @react-three/drei 10.7 · @react-three/postprocessing 3.0.5 (postprocessing 6.39.x) · Next.js 16 · cámara ortográfica fija · 7 salas 10×10 m · Radeon 610M (2 CU RDNA2) ~28 FPS.

**Regla sagrada respetada en todo el informe:** no se mueve, escala ni recoloca nada; no se cambia ninguna geometría. Todo lo propuesto actúa sobre **materiales, shaders, texturas procedurales, luz, sombras y post-proceso**, más overlays *aditivos* de efecto (partículas/vapor) que el encargo pide explícitamente en §6.

**Metodología:** búsqueda web + GitHub; cada afirmación clave lleva URL. Estado de verificación:
- ✅ **Verificado hoy (25-08-2026)**: la URL fue abierta/consultada durante este informe.
- ⚠️ **NO verificado**: URL o licencia no comprobada directamente, o conocimiento general sin fuente abierta en esta sesión.

---

## 0. Resumen ejecutivo (ver detalle y orden en §7)

| # | Acción | Coste GPU | Impacto |
|---|--------|-----------|---------|
| 1 | Rig de luz de 3 puntos + tone mapping ACES | ~0 | Enorme (grada toda la escena) |
| 2 | Presupuesto de sombras: 1 dir light ceñida + `BakeShadows` + `ContactShadows frames={1}` | −(mucho) | Alto (FPS + contacto) |
| 3 | Post base seguro: HalfFloat + viñeta + grano + SMAA/multisampling | bajo | Medio-alto |
| 4 | Madera por shader (CSM triplanar mundo) | +30 ALU/px | Enorme (mayor superficie) |
| 5 | Yeso/encalado por shader | +20 ALU/px | Alto |
| 6 | Entorno PBR offline (`RoomEnvironment` + PMREM) para reflejos | una vez | Alto en cerámica/cristal/metal |
| 7 | Cristal tarros por fresnel (sin `transmission`) + loza con clearcoat | +8 ALU/px | Alto |
| 8 | Tela/lino con sheen + trama de canvas | +1 lóbulo spec | Medio-alto |
| 9 | Vida A: vapor + parpadeo velas + polvo (`Sparkles`) | trivial | Medio (encanto) |
| 10 | Vida B: vaivén plantas por vertex shader + humo chimenea + papel + óxido | trivial-bajo | Medio |

---

## 1. MATERIALES POR SHADER (lo que más se repite)

> Todos los snippets están pensados como **inyección en `MeshStandardMaterial`/`MeshPhysicalMaterial` vía `onBeforeCompile` o CSM** (§2), de modo que **las luces, sombras y fog de three siguen funcionando**. Ninguno toca geometría ni transformaciones.
>
> Convención usada en los fragmentos: `vWPos` = posición en mundo (varying propia, ver §2), `nrm` = normal de superficie en mundo aproximada desde `vNormal`.

### Bloque GLSL común (ruido valor + fbm) — reutilizado por todos los materiales

```glsl
// ~30 ALU por octava; 4-5 octavas bastan a esta distancia de cámara
float hash21(vec2 p){ p = fract(p*vec2(234.34, 435.345)); p += dot(p, p+34.23); return fract(p.x*p.y); }
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f*f*(3.0-2.0*f);
  float a=hash21(i), b=hash21(i+vec2(1,0)), c=hash21(i+vec2(0,1)), d=hash21(i+vec2(1,1));
  return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);
}
float fbm(vec2 p){
  float v=0.0, a=0.5;
  mat2 r = mat2(0.8,0.6,-0.6,0.8);
  for(int i=0;i<5;i++){ v += a*vnoise(p); p = r*p*2.03; a *= 0.5; }
  return v;
}
```
Técnica estándar de fbm documentada en The Book of Shaders cap. 13 ✅ <https://thebookofshaders.com/13> (licencia del libro **no declarada** en las páginas consultadas → usar como referencia conceptual, no copiar literal en un producto ⚠️). La misma familia de funciones existe como ficheros sueltos en LYGIA <https://github.com/patriciogonzalezvivo/lygia> ✅ — **ojo**: LYGIA es dual Prosperity/Patron, uso comercial requiere patrocinio/licencia según su README ✅ <https://github.com/patriciogonzalezvivo/lygia#license>.

### (a) MADERA — veta, poros, barniz (muebles + suelo)

**Qué hace:** anillos de crecimiento perturbados por fbm (la "veta"), fibra fina estirada en Y (poros), y variación de roughness que simula barniz gastado. Todo en espacio-mundo, así **un solo material sirve para suelo y muebles sin UVs coherentes** (triplanar-lite por eje dominante).

```glsl
// --- inyectar tras '#include <map_fragment>' ---
vec3 nw = normalize(vNormal); // aprox.; para paredes/suelo basta el eje dominante
vec2 tuv = (abs(nw.y) > 0.5) ? vWPos.xz : ((abs(nw.x) > 0.5) ? vWPos.zy : vWPos.xy);

float fibra   = fbm(tuv * vec2(3.0, 34.0));              // poros estirados
float centro  = tuv.y*0.35 + tuv.x*0.03 + fbm(tuv*2.2)*0.55; // eje del "tronco" + ondulación
float anillos = fract(centro * 9.0);                     // nº de anillos por metro
float veta    = smoothstep(0.15,0.5,anillos)*smoothstep(0.9,0.55,anillos);

vec3 oscuro = vec3(0.28,0.17,0.09), claro = vec3(0.66,0.47,0.26); // miel/nogal
diffuseColor.rgb *= mix(oscuro, claro, clamp(veta*0.75 + fibra*0.35, 0.0, 1.0));

// barniz: brillo en zonas lisas, mate donde hay fibra
```
```glsl
// --- inyectar tras '#include <roughnessmap_fragment>' ---
roughnessFactor = clamp(0.62 - veta*0.22 + fibra*0.18, 0.28, 0.95);
```

**Cómo se aplica sin tocar geometría:** recorrer la escena una vez (`scene.traverse`) y sustituir `material` en los meshes cuyo nombre/grupo sea madera. Posiciones intactas.
**Coste:** ~35 ALU/frAGMENTO extra, 0 texturas. Despreciable frente al fill-rate de una iGPU a 1080p.
**Fuente/técnica:** patrón "rings + fbm perturbation"; descrito igual en MySimulator, "Procedural Textures in GLSL — wood grain" ✅ <https://www.mysimulator.uk/content/articles/procedural-textures.html> (artículo 2026; sin licencia de código declarada ⚠️). El mismo enfoque aparece en The Book of Shaders §13 ✅.
**Estado:** técnica ✅ verificada como patrón publicado; el snippet exacto es propio → probar en tu pipeline.

### (b) YESO / PARED ENCALADA con micro-relieve

**Qué hace:** color crema con manchas grandes de fbm (cal mal extendida) + micro-relieve simulado perturbando la **normal** con el gradiente del ruido (bump analítico barato, sin textura).

```glsl
// tras '#include <normal_fragment_maps>' (perturbar normal en espacio de vista)
float h1 = fbm(vWPos.xy * 14.0) + fbm(vWPos.zy * 11.0);
vec2 g = vec2(dFdx(h1), dFdy(h1)) * uBumpStrength;      // uBump ~ 0.6
normal = normalize(normal + vec3(g, 0.0) * faceDirection);

// tras '#include <map_fragment>'
float mancha = fbm(vWPos.xz * 0.9);
diffuseColor.rgb *= mix(vec3(1.0), vec3(0.93,0.88,0.80), smoothstep(0.35,0.75,mancha));
// suciedad de rincones (ver receta §3.7): oscurecer cerca de aristas del habitáculo
```
**Coste:** ~25 ALU + derivadas (`dFdx/dFdy`, gratis en HW moderno).
**Nota three:** `faceDirection` existe en el chunk `normal_fragment_begin`; si no quieres depender de él, usa `uBump` pequeño y signo positivo.
**Fuente:** bump por gradiente de ruido es la técnica canónica de `perturbNormalArb` de three (chunk `bumpmap_pars_fragment`); puedes leer el chunk real en tu instalación: `node_modules/three/src/renderers/shaders/ShaderChunk/bumpmap_pars_fragment.glsl.js` ✅ (ruta estable del repo <https://github.com/mrdoob/three.js/tree/dev/src/renderers/shaders/ShaderChunk>). Alternativa aún más barata y robusta: **normal map generado en canvas** (receta §3.2).

### (c) TELA / LINO (cortinas, alfombras) — sheen + hilos

**Qué hace:** `MeshPhysicalMaterial.sheen` (retro-reflexión difusa del borde típica de tejido) + trama de hilos como **normal map de canvas** (§3.3) + jitter de roughness por hilo.

```ts
const tela = new THREE.MeshPhysicalMaterial({
  color: '#d9c7a3', roughness: 0.92, metalness: 0,
  sheen: 1.0, sheenRoughness: 0.55, sheenColor: new THREE.Color('#fff2dd'),
  normalMap: weaveNormalTex,       // canvas §3.3, repeat alto (p.ej. 24×24)
  normalScale: new THREE.Vector2(0.35, 0.35),
})
```
Inyección opcional para desgaste: `roughnessFactor += (fbm(vWPos.xz*40.)-0.5)*0.08;`
**Coste:** sheen añade un lóbulo especular indirecto extra en `meshphysical` (~moderado). Con materiales compartidos el coste de programa es único. Si una alfombra pesa, usa sheen solo en cortinas y liso en alfombras.
**Fuentes:** docs oficiales de `MeshPhysicalMaterial` (sheen/sheenRoughness/sheenColor) ✅ <https://threejs.org/docs/#api/en/materials/MeshPhysicalMaterial>. Ejemplo real de material de follaje con CSM sobre R3F (misma mecánica de extensión): douges.dev ✅ <https://douges.dev/blog/threejs-trees-1>.
**Estado:** props ✅ (docs); valores artísticos = punto de partida.

### (d) CERÁMICA / LOZA ESMALTADA (tazas, teteras)

**Qué hace:** clearcoat (capa de barniz sobre el esmalte) + craquelado del esmalte como mapa de roughness voronoi (§3.4) + entorno PBR offline para los brillos alargados típicos de loza (§4.5).

```ts
const loza = new THREE.MeshPhysicalMaterial({
  color: '#efe6d6', roughness: 0.38, metalness: 0,
  clearcoat: 1.0, clearcoatRoughness: 0.12,
  roughnessMap: crackleRoughTex,   // canvas §3.4: bordes de voronoi = grietas mates
})
```
**Coste:** clearcoat = segundo término especular; ok porque estas piezas ocupan pocos píxeles. El craquelado via textura canvas es gratis en runtime (se genera 1 vez al cargar).
**Fuente:** docs `clearcoat/clearcoatRoughness` ✅ <https://threejs.org/docs/#api/en/materials/MeshPhysicalMaterial>. Voronoi base: BoS cap. 12 ✅ <https://thebookofshaders.com/12/> y artículo original de iq sobre bordes de voronoi (enlazado desde BoS 12) ⚠️ <http://www.iquilezles.org/www/articles/voronoilines/voronoilines.htm>.

### (e) CRISTAL de tarros con contenido — SIN `transmission`

**Por qué no `transmission`:** `MeshPhysicalMaterial.transmission` renderiza la escena a un buffer intermedio adicional (transmission pass) y en iGPU se nota muchísimo. También evita `drei/MeshTransmissionMaterial` (buffer FBO propio; tutorial típico aquí ✅ <https://blog.olivierlarose.com/tutorials/3d-glass-effect> — usa transmission, lo citamos como lo que **NO** hacer).

**Qué hace el sustituto:** alpha baja constante + **fresnel de borde** (el vidrio refleja mucho en ángulos rasantes) + reflejos del entorno (`envMapIntensity`). Es el look "tarro de confitería": ves el contenido porque el cristal apenas suma, y el borde dibuja el contorno.

```js
const cristal = new THREE.MeshPhysicalMaterial({
  color:'#ffffff', roughness:0.06, metalness:0,
  transparent:true, opacity:0.16,
  depthWrite:false,            // deja ver/ordenar el té dentro
  envMapIntensity:1.4, side:THREE.FrontSide,
})
cristal.onBeforeCompile = (s)=>{
  s.uniforms.uRimPow   = { value: 3.0 }
  s.uniforms.uRimAlpha = { value: 0.55 }
  s.fragmentShader = s.fragmentShader
    .replace('#include <common>',
      '#include <common>\nuniform float uRimPow;\nuniform float uRimAlpha;')
    // OJO r154+: opaque_fragment (antes output_fragment). Guard compatible en §2.4.
    .replace('#include <opaque_fragment>',
      `#include <opaque_fragment>
       float fr = pow(1.0 - saturate(dot(normalize(vNormal), normalize(-vViewPosition))), uRimPow);
       gl_FragColor.a = min(gl_FragColor.a + fr*uRimAlpha, 1.0);`)
}
cristal.customProgramCacheKey = ()=>'jar-glass-v1'
```
En el traverse, a esos meshes dales `renderOrder = 2` (orden de pintado, **no** es mover objetos) para que el contenido opaco ya esté pintado.
**Coste:** ~8 ALU/px del tarro. Cero buffers extra.
**Fuente/patrón:** fresnel rim estándar; tutorial con desglose completo ✅ <https://threejsroadmap.com/blog/rim-lighting-shader>; material listo (Apache-2.0 ✅) con fresnel+transparencia para three/R3F: OtanoStudio ✅ <https://github.com/OtanoStudio/Fresnel-Shader-Material>. La mecánica exacta de reinyectar alpha en `opaque_fragment` es la que usa drei `Cloud.tsx` en producción ✅ <https://raw.githubusercontent.com/pmndrs/drei/master/src/core/Cloud.tsx>.
**Estado:** patrón ✅; ajustar `opacity/uRimAlpha` a ojo.

### (f) METAL viejo (balanzas, herramientas)

**Qué hace:** metalness alto con máscara de óxido: donde el fbm-voronoi supera umbral, el color pasa a pardo-anaranjado y la roughness sube (el óxido no es especular).

```glsl
// map_fragment
float oxido = smoothstep(0.52, 0.72, fbm(vWPos.xy*7.0)*0.65 + fbm(vWPos.zy*23.0)*0.45);
vec3 hierro = vec3(0.42,0.42,0.46), herrumbre = vec3(0.44,0.24,0.10);
diffuseColor.rgb = mix(diffuseColor.rgb*hierro, herrumbre*(0.7+0.5*fbm(vWPos.xy*31.0)), oxido);
// roughnessmap_fragment
metalnessFactor  = mix(0.95, 0.05, oxido);
roughnessFactor  = mix(0.32, 0.85, oxido);
```
Necesita **env map** (§4.5) para que el metal "exista"; sin él, el metalness 0.95 se ve negro.
**Coste:** ~30 ALU/px de piezas metálicas (pocas en pantalla).
**Fuente:** máscara por fbm-threshold para óxido es receta estándar; ejemplo visual completo en la librería TexGen ("rusted hull") ✅ <https://tonym128.github.io/texgen/> (repo ISC ✅ <https://github.com/tonym128/texgen>) — úsalo como taller para diseñar la textura y luego hornéala a canvas con §3.

### (g) PAPEL / etiquetas

**Qué hace:** fibras (fbm fino, bajo contraste), amarilleo irregular y **oscurecido de bordes** por distancia al borde del quad (los papeles envejecen por el canto). Requiere UVs (las etiquetas suelen ser planos con UV limpio).

```glsl
// map_fragment (usa vMapUv si el material tiene map; si no, varying propia de uv, §2.3)
vec2 uv = vMapUv;
float fibra = fbm(uv*vec2(120.,140.))*0.06 + fbm(uv*18.)*0.05;
float borde = smoothstep(0.10, 0.02, min(min(uv.x,1.-uv.x), min(uv.y,1.-uv.y)));
float edad  = fbm(uv*6.+13.7);
diffuseColor.rgb *= (1.0 - fibra) * mix(1.0, 0.82, borde) * mix(1.0, 0.94, smoothstep(.55,.85,edad));
// roughnessmap_fragment
roughnessFactor = clamp(roughnessFactor + fibra*2.0, 0.0, 1.0); // el papel es mate
```
**Coste:** ~15 ALU/px de etiqueta.
**Fuente:** envejecido por distancia-a-borde es práctica común de "paper aging" ⚠️ (patrón general, sin única cita); fbm base ✅ BoS 13.

---

## 2. `three-custom-shader-material` (CSM) y el patrón `onBeforeCompile`

### 2.1 Las dos vías, cuándo usar cada una

| | `onBeforeCompile` | CSM (`three-custom-shader-material` 6.4.0) |
|---|---|---|
| Qué es | hook oficial de `Material`: recibes el shader ya ensamblado y haces `.replace()` de chunks | librería (MIT ✅) que envuelve un material base y te da variables de salida limpias (`csm_Position`, `csm_DiffuseColor`, `csm_FragColor`, …) |
| Luces/sombras three | intactas si no tocas los chunks de luz | intactas: compila el material base real |
| Riesgo | los strings de chunk **cambian entre versiones** (§2.4) | mantiene su propio patchMap; sigue dependiendo de nombres internos pero los abstrae |
| React/R3F | manual | `<CustomShaderMaterial baseMaterial={MeshStandardMaterial} .../>` nativo |

- Repo CSM: <https://github.com/FarazzShaikh/THREE-CustomShaderMaterial> ✅ MIT, 1.3k stars. npm 6.4.0 ✅ <https://www.npmjs.com/package/three-custom-shader-material>. Docs del hook oficial: <https://threejs.org/docs/#api/en/materials/Material.onBeforeCompile> ✅.
- Uso R3F:

```tsx
import CustomShaderMaterial from 'three-custom-shader-material'
extend({ CustomShaderMaterial }) // o usar <customShaderMaterial /> vía extend de fiber

const uniforms = useMemo(()=>({ uTime:{value:0}, uAmp:{value:0.02} }),[]) // MEMOIZAR: CSM recompila si cambia la referencia
<mesh geometry={.../* SIN tocar */}>
  <customShaderMaterial baseMaterial={THREE.MeshStandardMaterial}
    vertexShader={vert} fragmentShader={frag} uniforms={uniforms}
    color="#b98a53" roughness={0.7} silenceWarnings />
</mesh>
```
(Notas del README verificadas: memoizar `uniforms`, cache-key por hash de shaders + material base, `patchMap` para sustituir chunks con keywords propios, posibilidad de extender un CSM con otro.) ✅

### 2.2 Inyectar ruido en MeshStandardMaterial SIN reescribirlo (receta canónica)

```ts
export function woodify(mat: THREE.MeshStandardMaterial){
  mat.onBeforeCompile = (shader)=>{
    shader.uniforms.uTime = uTimeRef            // {value:0} compartido
    // 1) varyings propias (NO dependas de vUv: §2.3)
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
        varying vec3 vWPos; varying vec3 vWNor;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vWPos = (modelMatrix * vec4(transformed,1.0)).xyz;
        vWNor = normalize(mat3(modelMatrix) * normal);`)
    // 2) funciones + uniforms al fragmento
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${COMMON_GLSL}\nvarying vec3 vWPos; varying vec3 vWNor;\nuniform float uTime;`)
      .replace('#include <map_fragment>', `#include <map_fragment>\n${WOOD_ALBEDO_GLSL}`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>\n${WOOD_ROUGH_GLSL}`)
  }
  mat.customProgramCacheKey = ()=>'wood-v1'   // ¡obligatorio! evita colisiones de caché de programas (docs oficiales)
}
```
Puntos de inyección útiles (nombres vigentes en r185 — re-verifícalos con el grep de §2.5): `common`, `begin_vertex`, `uv_vertex`, `map_fragment`, `roughnessmap_fragment`, `metalnessmap_fragment`, `normal_fragment_maps`, `opaque_fragment`, `fog_fragment`. Mapa mental de qué hace cada uno: guía clásica de Dusan Bosnjak "Extending three.js materials with GLSL" ⚠️ <https://medium.com/@pailhead011/extending-three-js-materials-with-glsl-78ea7bbb9270> (2019, previo a los renombres) y respuesta de Mugen87 señalando que la composición vive en `src/renderers/shaders/ShaderLib` ✅ <https://stackoverflow.com/questions/77098436/>.

**Trampas de onBeforeCompile (verificadas contra issues/docs):**
1. `onBeforeCompile` **no se copia con `.clone()`** (issue histórico cerrado como wonfix) ✅ <https://github.com/mrdoob/three.js/issues/14009> → aplica materiales DESPUÉS de clonar/cargar GLTF.
2. Si cambias el resultado del callback sin cambiar `customProgramCacheKey`, puede **no recompiilar** por la caché de programas ✅ <https://discourse.threejs.org/t/onbeforecompile-fires-only-once-although-i-set-needsupdate-true/38614>.
3. Uniforms: guárdalos en `shader.uniforms` dentro del callback y muta `.value`; si guardas el objeto `shader` en `material.userData`, ten en cuenta que se crea al primer render.

### 2.3 UVs en r185: NO uses `vUv` a ciegas

Desde el refactor de UVs (r151→r152), cada mapa tiene su propio varying (`vMapUv`, `vNormalMapUv`, `vRoughnessMapUv`, …) y `vUv` solo existe bajo `USE_UV`. Evidencia viva: el wiki oficial de TSL muestra el parche moderno usando `vMapUv` ✅ <https://github.com/mrdoob/three.js/wiki/Three.js-Shading-Language>, e hilos recientes siguen portando código con `vMapUv` ✅ <https://discourse.threejs.org/t/how-to-port-vmapuv-to-tsl/88730>. Reglas prácticas:
- ¿Quieres las UV del `map`? usa `vMapUv` **y asegúrate de que el material tiene `map` asignado**.
- ¿UVs siempre? declara tu propia varying desde el atributo `uv` en `uv_vertex` (`vMyUv = uv;`) — funciona porque el atributo existe en tus mallas.
- Para suelo/paredes lo mejor es ni eso: **posición de mundo** (como en §2.2), coherente en metros.

### 2.4 Renombres de chunks que rompen hacks viejos (three 0.150 → 0.185)

Verificado contra la guía oficial de migración ✅ <https://github.com/mrdoob/three.js/wiki/Migration-Guide>:
- **r154:** `output_fragment` → **`opaque_fragment`**; `encodings_fragment` → `colorspace_fragment` (PR #26278/#26206 listados en la release r154 ✅ <https://newreleases.io/project/github/mrdoob/three.js/release/r154>).
- **r155:** `useLegacyLights=false` por defecto (luces físicas); el tone mapping inline solo actúa al pintar a pantalla (con postpro se usa OutputPass / ToneMappingEffect).
- **r151/152:** `aoMap`/`lightMap` dejan de usar `uv2`; se elige canal con `texture.channel` (0=`uv`, 1=`uv1`). Crítico para lightmaps horneados (§4.5).
- **r152:** `ColorManagement.enabled=true` por defecto (colores sRGB interpretados correctamente; no "doblajes" de gamma).
- **r153:** WebGL1 deprecado (eliminado r163) → asume WebGL2.

Guard compatible (el mismo que usa drei en producción dentro de `Cloud.tsx`) ✅ <https://raw.githubusercontent.com/pmndrs/drei/master/src/core/Cloud.tsx>:

```ts
import { REVISION } from 'three'
const OUT = parseInt(REVISION.replace(/\D+/g,'')) >= 154 ? 'opaque_fragment' : 'output_fragment'
shader.fragmentShader = shader.fragmentShader.replace(`#include <${OUT}>`, `#include <${OUT}>` + '\n// tu código')
```

### 2.5 Prueba de humo para three 0.185 (ejecuta esto antes de fiarte de cualquier tutorial viejo)

```bash
# chunks realmente presentes en TU versión:
grep -o '#include <[a-z_]*>' node_modules/three/src/renderers/shaders/ShaderLib/meshphysical.glsl.js | sort -u
grep -o '#include <[a-z_]*>' node_modules/three/src/renderers/shaders/ShaderLib/meshstandard.glsl.js | sort -u
```
Si `opaque_fragment` aparece, todo este informe aplica tal cual. CSM declara soporte continuo con three moderno (su README/issues están activos), pero no hay tag "probado con r185" explícito ⚠️ → la prueba anterior + una sala de prueba bastan.

---

## 3. TEXTURAS PROCEDURALES (canvas o shader; nada que descargar)

> Principio: lo que es **estático** (tramas, craquelados, óxido) se hornea **una vez** a `CanvasTexture` al arrancar (coste CPU ~ms, cero coste GPU después); lo que depende de posición-mundo o animación va **en el shader** (§1). Librerías autocontenidas de referencia: `texgen.js` de mrdoob, generador puro canvas ✅ <https://github.com/mrdoob/texgen.js> / <https://texgenjs.org/> (MIT según ficha de catálogo ✅ <https://www.cssscript.com/a-texture-generator-with-javascript-and-canvas-texgen-js/>; licencia en repo ⚠️ no abierta directamente) y TexGen GLSL-bakeado a PNG <https://tonym128.github.io/texgen/> ✅ (ISC).

### 3.1 Núcleo JS: value noise + fbm + voronoi en canvas

```ts
function makeTex(size:number, paint:(put:(x:number,y:number,r,g,b,a?:number)=>void, size:number)=>void,
                 opts:{repeat?:number, srgb?:boolean}={}){
  const cv=document.createElement('canvas'); cv.width=cv.height=size;
  const ctx=cv.getContext('2d')!; const img=ctx.createImageData(size,size);
  const put=(x,y,r,g,b,a=255)=>{ const i=((y&size-1)*size+(x&size-1))*4;
    img.data[i]=r; img.data[i+1]=g; img.data[i+2]=b; img.data[i+3]=a; };
  paint(put,size); ctx.putImageData(img,0,0);
  const t=new THREE.CanvasTexture(cv);
  t.wrapS=t.wrapT=THREE.RepeatWrapping; if(opts.repeat)t.repeat.set(opts.repeat,opts.repeat);
  t.colorSpace= opts.srgb===false ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  return t;
}
// hash determinista (misma semilla => misma textura en todas las sesiones)
const H=(x:number,y:number)=>{ let n=Math.sin(x*127.1+y*311.7)*43758.5453; return n-Math.floor(n); }
const sm=(t:number)=>t*t*(3-2*t);
function noise(x:number,y:number){ const xi=Math.floor(x), yi=Math.floor(y), xf=x-xi, yf=y-yi;
  const a=H(xi,yi),b=H(xi+1,yi),c=H(xi,yi+1),d=H(xi+1,yi+1);
  const u=sm(xf),v=sm(yf); return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v; }
function fbm(x:number,y:number,o=4){ let v=0,a=.5,f=1; for(let i=0;i<o;i++){v+=a*noise(x*f,y*f);f*=2;a*=.5;} return v; }
function voronoiF1F2(x:number,y:number){ // F2-F1 = aristas de celdas (grietas)
  const xi=Math.floor(x), yi=Math.floor(y); let f1=9,f2=9;
  for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){
    const px=xi+i+H(xi+i,yi+j), py=yi+j+H(xi+i+57.3,yi+j+91.7);
    const d=Math.hypot(px-x,py-y); if(d<f1){f2=f1;f1=d;} else if(d<f2)f2=d; }
  return {f1,f2,edge:f2-f1};
}
```
(Equivalente GPU de voronoi con vecindad 3×3: BoS cap. 12 ✅.)

### 3.2 YESO → normal map desde heightfield (canvas)

```ts
const plasterNormal = (()=>{ const S=256, h=new Float32Array(S*S);
  for(let y=0;y<S;y++)for(let x=0;x<S;x++) h[y*S+x]=fbm(x*.06,y*.06,4)+fbm(x*.25+40,y*.25,2)*0.35;
  return makeTex(S,(put)=>{ for(let y=0;y<S;y++)for(let x=0;x<S;x++){
    const dx=h[y*S+((x+1)&(S-1))]-h[y*S+x], dy=h[((y+1)&(S-1))*S+x]-h[y*S+x];
    const k=2.2, nx=-dx*k, ny=-dy*k, nz=1, l=Math.hypot(nx,ny,nz);
    put(x,y, (nx/l*.5+.5)*255, (ny/l*.5+.5)*255, (nz/l*.5+.5)*255); } },
  {repeat:6, srgb:false}); })();
plasterNormal.colorSpace = THREE.NoColorSpace; // los normales SIEMPRE lineales
```
Asignar como `normalMap` con `normalScale≈0.4`. Coste runtime: 1 lectura de textura.

### 3.3 TELA → trama de hilos (canvas)

```ts
// warp/weft: senos cruzados de alta frecuencia con jitter de fase por hilo
const weaveNormal = makeTex(128,(put,S)=>{
  for(let y=0;y<S;y++)for(let x=0;x<S;x++){
    const jx=H(Math.floor(y/4),7.7)*6.28, jy=H(Math.floor(x/4),3.3)*6.28;
    const w=Math.sin((x+jx)*S*0.35)*Math.sin((y+jy)*S*0.35);        // relieve
    const th=Math.abs(Math.sin(x*1.7))-Math.abs(Math.sin(y*1.7));   // dirección hilo
    const n=[w*.8+th*.2, w*.8-th*.2, 1], l=Math.hypot(...n);
    put(x,y,(n[0]/l*.5+.5)*255,(n[1]/l*.5+.5)*255,(n[2]/l*.5+.5)*255); }
},{repeat:24,srgb:false});
```
Úsalo como `normalMap` de la tela (§1c) y como `roughnessMap` suave si quieres brillo por hilo.

### 3.4 CRAQUELADO DE ESMALTE → roughness map (canvas)

```ts
const crackleRough = makeTex(256,(put,S)=>{
  for(let y=0;y<S;y++)for(let x=0;x<S;x++){
    const {edge}=voronoiF1F2(x*.055,y*.055);
    const crack=smoothstepJS(0.0,0.06,edge);          // 0=grieta
    const base=90+fbm(x*.2,y*.2,3)*50;                // esmalte semi-mate
    const v=crack*base + (1-crack)*235;               // grietas MUY rugosas
    put(x,y,v,v,v); } },{repeat:1,srgb:false});
```
(srgb:false ⇒ tratarla como dato; `smoothstepJS` = helper análogo al de GLSL.)

### 3.5 ÓXIDO → albedo+roughness (canvas) — alternativa a §1f por shader

Máscara: `m = smoothstep(.45,.75, fbm(x*.03,y*.03,5)) * smoothstep(.3,.6, voronoi.edge+fbm(x*.15,y*.15))`.
Color rampa: hierro `(107,107,117)` → pardo `(112,61,26)` → claro `(168,110,60)` según `fbm` fino. Roughness: `mix(80,230,m)`. Hornéalo 512² y repite 2×2; el detalle fino lo da el fbm del shader si hace falta.

### 3.6 HOLLÍN (chimenea, sobre chimeneas)

En shader sobre la pared trasera (mejor que textura: sigue siendo "esa" geometría):
```glsl
// coordenada local de la pared: x horizontal, y altura sobre el hogar (uFireY)
float pluma = smoothstep(uFireW, 0.0, abs(vWPos.x-uFireX));     // estrecha arriba
float subida= smoothstep(uFireTop, uFireY, vWPos.y);            // sube y se difumina
float hollin= pluma*subida*(0.55+0.45*fbm(vWPos.xy*vec2(6.,3.)+vec2(0.,uTime*0.)));
diffuseColor.rgb *= mix(1.0, 0.32, clamp(hollin,0.,1.));
roughnessFactor = mix(roughnessFactor, 0.95, hollin);
```
Referencia visual/turbulencia: fbm con desplazamiento temporal (BoS 13 ✅).

### 3.7 SUCIEDAD DE RINCONES / AO barato de esquinas

Para una sala caja `[0,W]×[0,H]×[0,D]`, distancia normalizada a las dos paredes más cercanas:
```glsl
vec2 ex = min(vWPos.xz - uRoomMin.xz, uRoomMax.xz - vWPos.xz); // distancias a paredes X/Z
float esquina = 1.0 - smoothstep(0.0, 0.9, min(ex.x, ex.y));   // 1 en el rincón, 0 a 90cm
float zocalo  = 1.0 - smoothstep(0.0, 0.35, vWPos.y);          // franja baja de pared
float grime   = max(esquina*(0.35+0.3*fbm(vWPos.xz*3.)), zocalo*(0.25+0.2*fbm(vWPos.xz*8.)));
diffuseColor.rgb *= 1.0 - 0.35*grime*uGrimeAmount;             // uGrime ~0.6 interior acogedor
```
Esto **sustituye SSAO caro en paredes/suelo** (§4/§5) con ~12 ALU.

---
## 4. LUZ Y SOMBRA para isométrico en iGPU (Radeon 610M)

### 4.1 El rig: 3 puntos con presupuesto de sombras = 1

```tsx
// key: la ÚNICA luz con sombras, direccional "ventana" (iso => dirección diagonal alta)
<directionalLight castShadow position={[6,9,4]} intensity={2.6} color="#ffe8c4"
  shadow-mapSize={[1024,1024]} shadow-bias={-0.0005} shadow-normalBias={0.02}>
  <orthographicCamera attach="shadow-camera" args={[-7,7,7,-7,1,24]} /> {/* ceñido a la sala 10×10 */}
</directionalLight>
// fill frío muy suave desde el lado opuesto (sin sombras)
<directionalLight position={[-5,4,-6]} intensity={0.55} color="#cfd8e8" />
// rim cálido bajo-trasero para separar siluetas
<directionalLight position={[-3,2,7]} intensity={0.35} color="#ffd9a8" />
<hemisphereLight intensity={0.25} color="#fff4e0" groundColor="#6b5136" />
```
Con `useLegacyLights` eliminado (r155+) las intensidades son físicas; una direccional ~2.5 + fills es el punto de partida típico. Fuente del cambio: guía de migración ✅ y el hilo oficial r155 ⚠️ <https://discourse.threejs.org/t/updates-to-lighting-in-three-js-r155/53733>.

**Regla iGPU:** solo UNA luz proyecta sombras; el resto son baratas. Cada luz extra con sombras duplica el coste del pase de sombras.

### 4.2 Sombras suaves baratas — qué usar y qué cuesta

| Herramienta drei | Qué hace | Coste por frame | Cuándo |
|---|---|---|---|
| **`BakeShadows`** ✅ <https://drei.docs.pmnd.rs/performances/bake-shadows> | congela TODAS las shadow maps (`autoUpdate=false` + 1 `needsUpdate`) | **0 tras el primer frame** | escena estática (¡la tuya!) → siempre |
| **`ContactShadows frames={1}`** ✅ <https://drei.docs.pmnd.rs/staging/contact-shadows> | renderiza la sala desde abajo a un RT y lo difumina en un plano | **0 tras 1 frame** (`frames=1`) | contacto mueble-suelo, ancla por zona (p.ej. 1 por estantería grande) |
| **`AccumulativeShadows` + `RandomizedLight`** ✅ <https://drei.docs.pmnd.rs/staging/accumulative-shadows> | acumula N frames jitterados tipo raycast en un plano receptor; **coste cero al terminar** (`frames≈40-100`) | N frames UNA vez (o temporal) | hero-shots / sala principal; recalcula si cambias materiales |
| **`SoftShadows`** (PCSS) ✅ <https://drei.docs.pmnd.rs/shaders/soft-shadows> | inyecta PCSS en el chunk de sombras global (`size/samples/focus`, def. 25/10/0) | +N taps/px SIEMPRE que hay sombra | solo si sobra margen; empieza con `PCFSoftShadowMap` normal |

Recomendación Radeon 610M: `BakeShadows` (obligatorio) + `ContactShadows frames={1}` en 2-3 focos + PCFSoft básico. `SoftShadows samples≥10` solo si vas sobrado. Nota real de compatibilidad: `BakeShadows` no afecta a WebGPURenderer (issue abierto) ✅ <https://github.com/pmndrs/drei/issues/2436> — irrelevante para ti (WebGL), pero documentado.

### 4.3 Luz «horneada» — lightmap generado en canvas

three soporta `material.lightMap`. Desde r151/152 se elige el UV con **`texture.channel`** (no `uv2`) ✅ (guía de migración). Receta autocontenida:

```ts
function bakeRoomLightmap(W:number,D:number){ // 10×10 m → 512²
  return makeTex(512,(put,S)=>{
    // base ambiente cálida
    for(let y=0;y<S;y++)for(let x=0;x<S;x++){
      const u=x/S*W, v=(1-y/S)*D;
      let l=0.42;                                        // ambiente
      l+=0.85*Math.max(0,1-Math.hypot(u-7.5,v-2)/5);     // charco de la "ventana"
      l+=0.30*Math.max(0,1-Math.hypot(u-2,v-8)/3);       // lámpara colgante
      const g=fbm(x*.05,y*.05,3)*0.08;                   // grano sutil
      const c=Math.min(255,(l+g)*255)|0;
      put(x,y,c,c,c);
    }
  },{srgb:false});
}
const lm=bakeRoomLightmap(10,10); lm.channel=1;
mesh.material.lightMap=lm; mesh.material.lightMapIntensity=1.0;
// el mesh necesita un segundo set de UVs:
if(!g.attributes.uv1) g.setAttribute('uv1', g.attributes.uv); // ¡solo atributo de shading!
```
⚠️ Nota de cumplimiento estricto: copiar `uv→uv1` añade un atributo a la geometría (dato de shading, no cambia forma ni posición). Si el dueño lo considera "tocar geometría", alternativa 100% limpia: hornear la misma información **en vertex colors** (`geometry.attributes.color`, mismo argumento) o directamente multiplicar en tu shader CSM por la función analítica de charcos de luz (sin textura): `l = 0.45 + Σ ki·smoothstep(r_i,0,dist(vWPos.xz, p_i))`.
Herramienta externa para hornear AO+puntos de luz a lightmap (offline, luego sirves el PNG desde `/public`): WebGL Lightmap Baker ✅ <https://github.com/GoalieSave25/webgl-lightmap-baker> (licencia ⚠️ sin verificar).

### 4.4 AO barato — jerarquía recomendada

1. **Grime/esquinas por shader** (§3.7) — 12 ALU, cubre paredes/suelo.
2. **ContactShadows estáticos** (§4.2) — contacto de muebles.
3. **Vertex colors horneados offline** si algún rincón lo pide.
4. SSAO realtime: **NO por defecto en 610M**. Si algún día hay margen, `n8ao` (CC0 ✅ repo <https://github.com/N8python/n8ao>; su npm declara ISC ✅ <https://www.npmjs.com/package/n8ao> — discrepancia de metadatos, revisar LICENSE del paquete instalado) integrado con postprocessing vía `N8AOPostPass`; el propio autor recomienda SMAA porque el MSAA no aplica al AO ✅. En R3F no hay página oficial de N8AO en docs de react-postprocessing (comprobado: 404 hoy ✅) → intégralo como pass aparte o usa `SSAOEffect` de postprocessing a media resolución.

### 4.5 Entorno PBR offline (para cerámica/cristal/metal)

Prohibido `<Environment preset>` (descarga HDRIs de CDN). Autocontenido:

```ts
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
const pmrem = new THREE.PMREMGenerator(gl)
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
pmrem.dispose()
```
Fuente verificada (constructor sin argumentos, uso con PMREMGenerator) ✅ <https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/jsm/environments/RoomEnvironment.js>. Alternativa drei totalmente local: `<Environment resolution={256}>` **con hijos `Lightformer`** (renderiza su propia mini-escena, sin descargas) — docs ✅ <https://drei.docs.pmnd.rs/staging/environment>.
Para look "lámina de herbario": baja `scene.environmentIntensity` (~0.5) y deja mandar a las luces directas.

---

## 5. POST-PROCESO SEGURO EN iGPU (postprocessing 6.39.x / @react-three/postprocessing 3.0.5)

### 5.1 Qué SÍ y qué NO

| SÍ (orden aproximado) | Motivo/coste |
|---|---|
| Render base lineal + buffers **HalfFloatType** | HDR real; recomendación oficial del README ✅ <https://www.npmjs.com/package/postprocessing> |
| **AO** ligera (si acaso) — primero | necesita depth recién renderizado |
| **Bloom** moderado, umbral ≥ 1.0 | ver §5.3 |
| Color grade (BrightnessContrast/HueSaturation sutiles) | casi gratis, fusiona en el mismo EffectPass |
| **Vignette** | 1 pasada trivial; vende mucho el "herbario" |
| **Noise/grain** (`premultiply`, SOFT_LIGHT) | grano de película; tapetea banding de HalfFloat en iGPU |
| **ToneMapping ACES_FILMIC** — último efecto de color | instrucción oficial: renderer `NoToneMapping` + `ToneMappingEffect` al final ✅ <https://pmndrs.github.io/postprocessing/public/docs/> |
| **SMAA** después del tone mapping | SMAA espera LDR/sRGB; wiki de postprocessing lo sitúa al final ⚠️ <https://github.com/pmndrs/postprocessing/wiki> |

| NO en 610M | Por qué |
|---|---|
| `transmission` físico / `MeshTransmissionMaterial` | buffer de escena extra + blur; el tutorial típico que lo usa ✅ <https://blog.olivierlarose.com/tutorials/3d-glass-effect> queda fuera de tu presupuesto |
| SSR / `MeshReflectorMaterial` con blur alto | render extra de escena + blur encadenado |
| DOF bokeh, GodRays, Motion blur | varios passes grandes |
| Bloom "levels" altos o resolución completa | mipmapBlur a resolución reducida basta |
| ChromaticAberration + Noise + Scanline juntos | fill-rate tonto; elige grano y ya |

### 5.2 Pipeline recomendado (JSX completo)

```tsx
import { EffectComposer, Bloom, Vignette, Noise, ToneMapping, SMAA } from '@react-three/postprocessing'
import { ToneMappingMode, BlendFunction } from 'postprocessing'
import { HalfFloatType } from 'three'

<Canvas flat gl={{ antialias:false, stencil:false, depth:true }}>  {/* flat ⇒ NoToneMapping */}
  ...
  <EffectComposer frameBufferType={HalfFloatType} multisampling={0}>
    {/* AO solo si sobra GPU: N8AO vía pass aparte (§4.4, no hay wrapper oficial en R3F) */}
    <Bloom mipmapBlur intensity={0.4} luminanceThreshold={1.0} luminanceSmoothing={0.15}/>
    <Vignette offset={0.28} darkness={0.55} eskil={false}/>
    <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.35}/>
    <ToneMapping mode={ToneMappingMode.ACES_FILMIC}/>
    <SMAA/>
  </EffectComposer>
</Canvas>
```
Notas verificadas: los efectos consecutivos se **fusionan dentro de un único EffectPass** (menos draws) ✅ README npm; `frameBufferType`/`NoToneMapping`/tonemapping-final ✅ docs pmndrs; `antialias:false` recomendado por la librería cuando usas composer ✅ README.
AA en iGPU: prueba primero `multisampling={4}` (MSAA hardware suele ser eficiente en RDNA2 y sustituye a SMAA); si no mejora FPS, vuelve a `multisampling={0}` + `<SMAA/>`.

### 5.3 Evitar que el bloom queme los emisivos (velas, llama, lámparas)

Receta canónica del autor de postprocessing (issue #496) ✅ <https://github.com/pmndrs/postprocessing/issues/496>:
1. Buffers **HalfFloat** (valores >1 posibles).
2. `luminanceThreshold = 1.0`: **nada** brilla salvo lo que tú empujes por encima de 1.
3. En SOLO los materiales emisivos deseados: `emissiveIntensity = 2…4` (+ `toneMapped:false` en materiales basic/unlit).
   - Matiz importante: la prop `toneMapped` de three **se ignora** al renderizar a target (pipeline postpro) según hilo mantenido por drcmda/LR17 ✅ <https://discourse.threejs.org/t/pmndrs-post-processing-tone-mapping-guidance/59374>; lo que decide el glow es el valor HDR > umbral. La página oficial de Bloom de react-postprocessing resume exactamente esta mecánica ("luminanceThreshold de 1 asegura que nada brilla out-of-the-box; sube los colores fuera de 0-1") ✅ <https://react-postprocessing.docs.pmnd.rs/effects/bloom>.
4. `intensity` 0.3–0.5 y `mipmapBlur` para halo suave sin quemar.
Con esto la llama de la chimenea respira (parpadeo §6.4) y las paredes crema jamás emiten.

---
## 6. VIDA sin mover objetos de sitio

> Todos los sistemas son **objetos nuevos aditivos** (Points/planos de efecto) o **desplazamientos solo-vertex-shader** sobre mallas existentes: la posición base, transform y geometría del catálogo del dueño quedan intactos (la deformación vive en el render, como la llama que ya tenéis).

### 6.1 Vapor de teteras/tazas — Points con fbm (autocontenido)

Un `THREE.Points` pequeño (16-24 partículas) por emisor; shader propio:

```ts
const steamMat = new THREE.ShaderMaterial({
  transparent:true, depthWrite:false,
  uniforms:{ uTime:{value:0}, uHeight:{value:0.55}, uTint:{value:new THREE.Color('#fff7ea')} },
  vertexShader:`
    attribute float aSeed;
    uniform float uTime, uHeight;
    varying float vLife; varying float vSeed;
    void main(){
      vSeed=aSeed; vLife=fract(uTime*0.22 + aSeed);          // ciclo por partícula
      vec3 p=position;
      p.y += vLife*uHeight;                                   // sube
      p.x += sin(uTime*0.8+aSeed*40.0)*0.02*(1.0+vLife*2.0);  // serpenteo
      p.z += cos(uTime*0.7+aSeed*29.0)*0.02*(1.0+vLife*2.0);
      vec4 mv = modelViewMatrix*vec4(p,1.0);
      gl_PointSize = (2.0+vLife*10.0) * (140.0/-mv.z);        // crece al subir
      gl_Position = projectionMatrix*mv;
    }`,
  fragmentShader:`
    uniform vec3 uTint; varying float vLife; varying float vSeed;
    ${COMMON_GLSL} /* hash21/vnoise/fbm de §1 */
    void main(){
      float d=length(gl_PointCoord-0.5);
      float disco=smoothstep(0.5,0.12,d);
      float remolino=vnoise(gl_PointCoord*3.0+vSeed*17.0+vec2(0.,uTimeGlobal*0.35));
      float a=disco * smoothstep(0.0,0.15,vLife) * smoothstep(1.0,0.55,vLife)
              * (0.25+0.45*remolino);
      if(a<0.01) discard;
      gl_FragColor=vec4(uTint,a);
    }`})
```
(declara `uniform float uTimeGlobal;` y actualízalo junto a `uTime`). Blending normal (el vapor es blanco-lechoso sobre fondo cálido), `depthWrite:false`. Coste: ~24 sprites → trivial. Enfoque idéntico al "Coffee Smoke" de threejs-journey (points + shader + fade) ✅ <https://threejs-journey.com/lessons/coffee-smoke-shader> (lección de pago; patrón citado, código anterior es propio ⚠️).

### 6.2 Humo de chimenea

El mismo material con: `uHeight=2.2`, count 48, tinte gris-cálido `#b9a998`, deriva de viento constante `p.x += vLife*uWindX`, opacidad menor y tamaño inicial mayor. Ancla un emisor encima del hogar (coordenada fija que ya conoces).

### 6.3 Polvo en el aire + partículas de hierbas

**drei `<Sparkles>`** ✅ <https://drei.docs.pmnd.rs/staging/sparkles> — verificado: props `count/speed/opacity/color/size/scale/noise`; sin descargas:

```tsx
<Sparkles count={120} scale={[10,3,10]} size={2} speed={0.3}
          opacity={0.35} color="#e8d9b8" noise={[0.4,0.8,0.4]} />          {/* polvo dorado */}
<Sparkles count={60} position={[…junto a sacos]} scale={[2,1,2]} size={1.5}
          speed={0.15} opacity={0.5} color="#9aa86b" noise={0.2} />        {/* hierbas */}
```
Coste: puntos puros, nada.

### 6.4 Parpadeo de velas (luz + emisivo sincronizados)

```ts
useFrame(({clock})=>{
  const t=clock.elapsedTime
  const f = 0.82 + 0.13*Math.sin(t*11.0) + 0.05*Math.sin(t*23.0+1.7)
          + 0.06*(H(Math.floor(t*47),3.1)-0.5)     // chisporroteo estocástico
  candleLight.intensity = candleLightBase * f       // PointLight existente o nueva pequeña
  flameMaterial.emissiveIntensity = 2.6 * f         // >1 ⇒ SOLO esta cruza el umbral del bloom (§5.3)
})
```
Sin sombras en estas point lights. Si no hay luz por vela (presupuesto), modula solo `emissiveIntensity` + un plano glow fresnel.

### 6.5 Vaivén de plantas por vertex shader (¡sin cambiar su posición base!)

Inyección CSM/onBeforeCompile en el material de follaje; peso por altura local (raíz quieta, punta se mueve). La geometría del disco NO cambia: el desplazamiento existe solo durante el render.

```glsl
// vertex (CSM: escribe en csm_Position; onBeforeCompile: tras '#include <begin_vertex>')
float h   = clamp((position.y - uMinY)/uHeight, 0.0, 1.0);
float w   = h*h;                                   // raíz 0, punta 1
float fase= uPhase + dot(position.xz, vec2(1.7));  // variación dentro de la mata
csm_Position.x += sin(uTime*1.4 + fase)*uAmp*w;    // uAmp ~ 0.012 (1.2 cm)
csm_Position.z += cos(uTime*1.1 + fase)*uAmp*0.6*w;
// opcional: "flameo" de hoja individual si hay uv por hoja:
csm_Position.x += sin(uTime*3.1+fase*7.0)*uAmp*0.25*w*h;
```
Las sombras no seguirán el vaivén salvo que repliques el desplazamiento en `customDepthMaterial` (con amplitudes ~cm no se aprecia; documéntalo).
**Referencias reales:** serie "fluffy trees" con CSM+R3F (usa `csm_PositionRaw` para billboards y dedica su parte 2 al viento) ✅ <https://douges.dev/blog/threejs-trees-1>; técnica clásica industria de pesos por vertex-color para viento (concepto) ✅ <https://salivity.github.io/game-development/article/making-foliage-react-to-wind-using-vertex-colors>; implementación Unity HDRP/URP de referencia del sistema Book of the Dead ✅ <https://github.com/happy-turtle/foliage-wind>.

### 6.6 Advertencia de autocontención: `<Cloud>`/`<Clouds>` de drei

Verificado hoy en fuente ✅ <https://raw.githubusercontent.com/pmndrs/drei/master/src/core/Cloud.tsx>: `CLOUD_URL = 'https://rawcdn.githack.com/pmndrs/drei-assets/.../cloud.png'` → **descarga una textura en runtime** (incumple vuestra regla) a menos que le pases `texture="/public/mi-nube.png"` generada por vosotros (§3). El mismo fichero demuestra además el guard r154 (`opaque_fragment`) en producción (§2.4).

---

## 7. TOP-10 por impacto/coste — orden de aplicación

> Convención de ficheros sugerida: `scene/materials/*.ts` (fábricas CSM), `scene/lighting.tsx`, `scene/post.tsx`, `scene/effects/*.tsx`. **En ninguno se tocan posiciones/rotaciones/escalas/geometrías del dueño**: solo se sustituye `mesh.material` en traverse, se añaden luces/post y overlays aditivos.

| # | Acción | Ficheros que toca | Qué NO toca | Coste |
|---|---|---|---|---|
| 1 | Rig 3-puntos (§4.1) + ACES/viñeta/grano base (§5.2) | `lighting.tsx`, `post.tsx` | nada de escena | ~0 |
| 2 | Sombras: 1 dir ceñida 1024 PCFSoft + `BakeShadows` + `ContactShadows frames={1}` (§4.2) | `lighting.tsx`, raíces de sala | objetos | ahorra ms |
| 3 | Entorno PBR offline RoomEnvironment (§4.5) | `environment.ts` | materiales aún no | una vez |
| 4 | **Madera** CSM triplanar (§1a) a suelo+muebles vía traverse | `materials/wood.ts` | transforms/geometría | +30 ALU |
| 5 | **Yeso** paredes (§1b) + grime rincones (§3.7) | `materials/plaster.ts` | ídem | +25 ALU |
| 6 | **Cristal** fresnel tarros + **loza** clearcoat/craquelado (§1d,e) | `materials/glass.ts`, `ceramic.ts`, canvas §3.4 | ídem | +8 ALU |
| 7 | **Tela** sheen + trama canvas (§1c, §3.3) | `materials/fabric.ts` | ídem | bajo |
| 8 | **Metal** óxido (§1f) + **papel** etiquetas (§1g) | `materials/metal.ts`, `paper.ts` | ídem | bajo |
| 9 | **Vida A**: vapor teteras (§6.1) + parpadeo velas (§6.4) + polvo/hierbas Sparkles (§6.3) | `effects/steam.tsx`, `candles.tsx`, overlays | posiciones existentes | trivial |
| 10 | **Vida B**: vaivén plantas (§6.5) + humo chimenea (§6.2) + hollín (§3.6) | `materials/sway.ts`, `effects/smoke.tsx` | ídem | trivial |

Criterio: 1-2 cambian la percepción global casi gratis y liberan margen; 4-5 atacan la mayor superficie de píxeles; 6-8 cierran los materiales del encargo; 9-10 aportan el "salto chimenea" al resto. Mide FPS tras cada paso (R3F: `performance.monitor` o `Stats`) antes de añadir el siguiente.

---

## Anexo A — Tabla de fuentes (verificación y licencias)

| Fuente | URL | Estado | Licencia |
|---|---|---|---|
| CSM (Custom Shader Material) | github.com/FarazzShaikh/THREE-CustomShaderMaterial | ✅ repo+npm abiertos | MIT ✅ |
| npm CSM 6.4.0 | npmjs.com/package/three-custom-shader-material | ✅ | MIT |
| Guía migración three (r151-r155 renombres, channel, legacy lights) | github.com/mrdoob/three.js/wiki/Migration-Guide | ✅ | — |
| Release r154 (renames output/opaque) | newreleases.io/project/github/mrdoob/three.js/release/r154 | ✅ | — |
| Wiki TSL (ejemplo moderno con vMapUv) | github.com/mrdoob/three.js/wiki/Three.js-Shading-Language | ✅ | — |
| Hilo port vMapUv (2025) | discourse.threejs.org/t/how-to-port-vmapuv-to-tsl/88730 | ✅ | — |
| Issue clone()+onBeforeCompile #14009 | github.com/mrdoob/three.js/issues/14009 | ✅ | — |
| Recache customProgramCacheKey | discourse.threejs.org/t/onbeforecompile-fires-only-once…/38614 | ✅ | — |
| postprocessing npm 6.39.4 (HalfFloat, NoToneMapping, EffectPass merge) | npmjs.com/package/postprocessing | ✅ | Zlib ✅ |
| Docs postprocessing (tone mapping al final) | pmndrs.github.io/postprocessing/public/docs/ | ✅ | Zlib |
| Bloom react-postprocessing (threshold=1 + HDR) | react-postprocessing.docs.pmnd.rs/effects/bloom | ✅ | MIT |
| Issue #496 receta bloom-emisivo (autor vanruesc) | github.com/pmndrs/postprocessing/issues/496 | ✅ | — |
| toneMapped ignorado en postpro | discourse.threejs.org/t/pmndrs-post-processing-tone-mapping-guidance/59374 | ✅ | — |
| drei SoftShadows (PCSS, defaults) | drei.docs.pmnd.rs/shaders/soft-shadows | ✅ | MIT |
| drei AccumulativeShadows (frames/temporal, coste 0 luego) | drei.docs.pmnd.rs/staging/accumulative-shadows | ✅ | MIT |
| drei ContactShadows (frames={1}) | drei.docs.pmnd.rs/staging/contact-shadows | ✅ | MIT |
| drei BakeShadows (autoUpdate=false) | drei.docs.pmnd.rs/performances/bake-shadows | ✅ | MIT |
| BakeShadows×WebGPU issue #2436 | github.com/pmndrs/drei/issues/2436 | ✅ | — |
| drei Sparkles (props) | drei.docs.pmnd.rs/staging/sparkles | ✅ | MIT |
| drei Cloud.tsx (textura CDN + guard r154) | raw.githubusercontent.com/pmndrs/drei/master/src/core/Cloud.tsx | ✅ | MIT |
| N8AO (SSAO estable, uso postprocessing, SMAA) | github.com/N8python/n8ao | ✅ | CC0-1.0 ✅ (npm dice ISC ⚠️) |
| docs N8AO en react-postprocessing | react-postprocessing.docs.pmnd.rs/effects/n8ao | ✅ comprobado: **no existe (404)** | — |
| RoomEnvironment.js (constructor, PMREM) | raw.githubusercontent.com/mrdoob/three.js/dev/examples/jsm/environments/RoomEnvironment.js | ✅ | MIT (dentro de three) |
| BoS cap.13 fbm / cap.12 voronoi | thebookofshaders.com/13 · /12/ | ✅ | © autor; licencia no declarada en página ⚠️ |
| LYGIA shader lib | github.com/patriciogonzalezvivo/lygia | ✅ | Prosperity/Patron dual → comercial requiere licencia ✅ |
| TexGen GLSL→PNG | tonym128.github.io/texgen · github.com/tonym128/texgen | ✅ | ISC ✅ |
| texgen.js canvas (mrdoob) | github.com/mrdoob/texgen.js · texgenjs.org | ✅ existen | MIT según catálogo ⚠️ |
| Fresnel OtanoStudio (three/R3F) | github.com/OtanoStudio/Fresnel-Shader-Material | ✅ | Apache-2.0 ✅ |
| Rim lighting tutorial (desglose) | threejsroadmap.com/blog/rim-lighting-shader | ✅ | sin licencia declarada ⚠️ |
| Glass transmission (lo que NO hacer) | blog.olivierlarose.com/tutorials/3d-glass-effect | ✅ | tutorial ⚠️ |
| Fluffy trees CSM/R3F (+viento pt.2) | douges.dev/blog/threejs-trees-1 | ✅ | blog ⚠️ |
| Vertex-color wind (concepto industria) | salivity.github.io/game-development/article/making-foliage-react-to-wind-using-vertex-colors | ✅ | artículo ⚠️ |
| foliage-wind (Book of the Dead, Unity) | github.com/happy-turtle/foliage-wind | ✅ | sin LICENSE visible ⚠️ |
| Coffee Smoke lesson (patrón points) | threejs-journey.com/lessons/coffee-smoke-shader | ✅ existe | contenido de pago ⚠️ |
| Procedural textures GLSL (marble/wood/worley) | mysimulator.uk/content/articles/procedural-textures.html | ✅ | sin licencia declarada ⚠️ |
| WebGL Lightmap Baker | github.com/GoalieSave25/webgl-lightmap-baker | ✅ existe | ⚠️ sin verificar |

## Anexo B — Riesgos de compatibilidad three 0.185 / R3F 9 (checklist final)

1. Ejecuta el grep de §2.5 sobre `node_modules/three`: valida `opaque_fragment`, `map_fragment`, `roughnessmap_fragment`, `begin_vertex`.
2. Nunca referencies `vUv` sin definir tu propia varying (§2.3); usa `vMapUv` solo si `map` está asignado.
3. Lightmaps: `lightMap.channel=1` + atributo `uv1` (nada de `uv2`, eliminado r152).
4. Intensidades de luz físicas (r155+): recalibra fills/key.
5. Con postprocessing: `Canvas flat` (NoToneMapping) + HalfFloat + ToneMappingEffect final.
6. `onBeforeCompile` tras cualquier `.clone()`; siempre `customProgramCacheKey` distinto por variante.
7. CSM: memoiza `uniforms`; espera recomprobación manual con r185 (no hay tag oficial) ⚠️.
8. Next 16: carga el Canvas con `dynamic(...,{ssr:false})` (patrón estándar R3F+Next, verificado en tutorial ✅ olivierlarose §anexo).
9. Todo `<Environment preset>` y `drei Cloud` por defecto **descargan assets** → usa RoomEnvironment/Lightformer y textura local (§4.5, §6.6).
10. Marca como deuda: medir en la 610M real cada paso del TOP-10; si el frame sobra, sube `SoftShadows samples` o añade N8AO half-res.

*Fin del informe. Generado 25-08-2026; verificaciones de URL realizadas hoy contra las fuentes listadas.*



