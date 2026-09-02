# INFORME — Fuego creíble para la chimenea empotrada (tienda de té isométrica)

**Stack objetivo:** three.js 0.185 · @react-three/fiber 9.7 · @react-three/drei 10.7 · Next.js
**Restricciones:** todo autocontenido (sin descargas en runtime) · GPU integrada Radeon 610M (~28 FPS) → nada de bloom global.
**Método:** búsqueda web + verificación directa de repos/archivos en GitHub. Todo lo citado fue visitado salvo lo marcado como ⚠️ NO VERIFICADO.

---

## 1. Fuego en three.js: shaders de llama, sprites y partículas

### 1.1 · Llama procedural por capas de ruido (estilo Karim Maaloul / "The Fireplace") ★ recomendado base
- **Qué es:** ShaderMaterial sobre una geometría de **media-cilindro abierto** (`CylinderGeometry` semi-corte). El vertex shader desplaza vértices con una textura de ruido (scroll vertical); el fragment compone 3 muestras de ruido a distintas escalas para crear capas rojo→amarillo→blanco, con "agujeros" de llama (`smoothstep`) y modo estilizado (`step`). Incluye brasas con `MultiplyBlending` y parpadeo de luz horneado (ver §3.3). Funciona con three moderno porque es GLSL puro sin APIs obsoletas (el gist usa `three@0.156.1`; portable a 0.185 tal cual).
- **Cómo se usa en R3F:** copiar los shaders del gist a strings, crear el material con `shaderMaterial` de drei + `extend`, `useFrame` para animar `time`. El `.glb` de la chimenea es suyo; solo se reutiliza el shader (la textura de ruido debe descargarse **una vez** y bundlearse en `/public`).
- **Coste:** MUY BAJO — 1 mesh, 1 textura, 0 postproceso. Ideal para iGPU.
- **URLs:**
  - Pen original: https://codepen.io/Yakudoo/pen/ZEZWKJy
  - Fuente completa espejada (shaders + JS íntegros): https://gist.github.com/ChrisPluto/8935d46f1fbd7d31d3e56d74e7701859
- **Licencia:** CodePen (por defecto MIT visible en el Pen); ⚠️ verificar el pie de licencia del Pen antes de producción. El gist no declara licencia propia.

### 1.2 · Fuego volumétrico raymarching — `@wolffo/three-fire`
- **Qué es:** fork modernizado en TypeScript de THREE.Fire (raymarching volumétrico sobre un box, paper ACM "Real-Time Procedural Volumetric Fire"). Componente `<Fire>` listo para R3F + entrada vanilla + entrada TSL/WebGPU. README declara: `three >= 0.168` probado contra **r184**, React 18/R3F v8 **y React 19/R3F v9 verificados en CI** → compatible con nuestro stack 0.185/v9.7.
- **Cómo se usa en R3F:** `npm i @wolffo/three-fire` → `import { Fire } from '@wolffo/three-fire/react'` dentro del `<Canvas>`; props `texture`, `color`, `iterations`, `octaves`, `magnitude`. Requiere textura grayscale de densidad (el repo provee `src/Fire-grayscale.png` para bundlear → autocontenido OK).
- **Coste:** MEDIO-ALTO por defecto (raymarching, 20 iteraciones × 3 octavas); configurable hacia abajo (`iterations={10..15}`, caja pequeña) para la 610M. Usar como acento puntual, no en varias instancias.
- **URLs:**
  - Repo: https://github.com/typeWolffo/THREE.Fire
  - npm: https://www.npmjs.com/package/@wolffo/three-fire
  - Origen clásico (r90s, requiere port): https://github.com/mattatz/THREE.Fire — archivos `Fire.js`, `FireShader.js`, `Fire.png` en raíz; demo https://mattatz.github.io/THREE.Fire/
- **Licencia:** MIT (ambos repos).

### 1.3 · Flame shader de desplazamiento de vértices (clase Three.js Journey)
- **Qué es:** shader de llama "clásico": plano/esfera con vertex displacement por ruido + gradiente por UV + alpha fuerte arriba. Referencia didáctica limpia y corta.
- **Cómo se usa en R3F:** mismo patrón `shaderMaterial` + `useFrame`; los strings GLSL se portan sin cambios.
- **Coste:** BAJO (un quad).
- **URLs:**
  - Repo (material en `src/materials/`): https://github.com/kekkorider/threejs-flame-shader — demo https://threejs-flame-shader.vercel.app/
- **Licencia:** MIT.

### 1.4 · Hoguera completa fuego+humo en R3F/Next.js
- **Qué es:** escena demo de hoguera estilizada con dos ShaderMaterials (llama con displacement Perlin + humo independiente), R3F + Next.js App Router, cargada desde `shaderMaterial`.
- **Cómo se usa en R3F:** repo entero es R3F+Next → copy-paste directo de los componentes de material.
- **Coste:** BAJO-MEDIO. Repo joven (0 stars, 3 commits) → tratar como referencia de código, no librería mantenida.
- **URL:** https://github.com/cpl121/fire-shader
- **Licencia:** MIT.

### 1.5 · Sprites animados por atlas (alternativa "cero shader")
- **Qué es:** hoja de sprites única animada moviendo `texture.repeat/offset` (ventana UV de 1 frame) con acumulador de tiempo; billboards `THREE.Sprite` o quads instanciados. Es la opción más barata y robusta en GPUs débiles; evita overdraw masivo si se limita a ~4–8 quads.
- **Cómo se usa en R3F:** drei trae **`<SpriteAnimator>`** que hace exactamente esto (atlas + fps + loop): https://github.com/pmndrs/drei/blob/master/src/core/SpriteAnimator.tsx · La técnica UV window explicada paso a paso: https://ilovesprites.com/blog/threejs-sprite-sheet-animation
- **Coste:** MÍNIMO. Genera el atlas offline y sérvelo local (autocontenido).
- **Licencia:** SpriteAnimator es parte de drei (MIT). El artículo no es código con licencia.

> Lectura de apoyo sobre por qué evitar partículas-quad masivas para fuego (overdraw en móvil/iGPU) y preferir 1 mesh con shader: https://www.cyanilux.com/tutorials/fire-shader-breakdown

⚠️ NO VERIFICADO / evitar: https://github.com/hilmerx/fire-shader (solo visto el nombre) y el Particle Engine de stemkoski https://stemkoski.github.io/Three.js/Particle-Engine.html — el foro confirma que **no funciona con three moderno** sin portarlo.

---

## 2. Humo y chispas ligeras

### 2.1 · Humo con sprites + curvas alfa/escala/color (técnica foro three.js)
- **Qué es:** sprites/quads que suben, escalan y desvanecen siguiendo curvas de vida; `depthWrite: false` obligatorio para evitar bordes recortados entre capas. Con randomización + tinte gris cálido es muy creíble y cuesta casi nada (~10–20 partículas para una chimenea doméstica).
- **Cómo se usa en R3F:** pool de `<sprite>` o `InstancedMesh` de quads + `useFrame` que integra vida/muerte; blending normal (humo oscuro) o aditivo suave (vapor de té).
- **Coste:** MUY BAJO.
- **URLs:**
  - Hilo con curvas concretas (respuesta de Usnul, con imagen de curvas color/escala): https://discourse.threejs.org/t/how-to-make-3d-smoke/34520
  - Aplicación moderna del mismo patrón: https://discourse.threejs.org/t/creating-3d-smoke-particles-in-three-js/57408
  - Tutorial shader de humo en plano (mask por ruido + smoothstep + depthWrite:false): https://garden.bradwoods.io/notes/javascript/three-js/shaders/shaders-103-smoke
- **Licencia:** hilos del foro (técnica libre); tutorial Brad Woods sin licencia de código explícita.

### 2.2 · Motor de partículas `three-nebula` (compatible three 0.185)
- **Qué es:** motor de partículas WebGL para three.js; el badge del repo declara **construido y testeado contra `three@0.185.1`** (coincidencia exacta con nuestro stack). Renderizadores CPU `SpriteRenderer`/`MeshRenderer` y `GPURenderer` opcional (WebGPU, entry `three-nebula/webgpu`). Sistemas definibles por JSON; semillas deterministas; `tick(dt)` correcto respecto al refresh rate. Nota importante del README: con canvas transparente, el blending aditivo exige texturas con canal alfa.
- **Cómo se usa en R3F:** no hay componente oficial R3F, pero se instancia en `useEffect`/`useMemo` y se llama `system.tick(delta)` desde `useFrame`. Para chispas de chimenea: emitter cónico + `Alpha(1,0)` + color ember.
- **Coste:** BAJO en CPU para decenas de partículas; sobredimensionado si solo necesitas humo simple.
- **URL:** https://github.com/creativelifeform/three-nebula · Docs https://three-nebula.org/
- **Licencia:** MIT.

### 2.3 · Chispas/brasas ascendentes con drei `<Sparkles>`
- **Qué es:** puntos brillantes animados con ruido, ya incluidos en drei 10.7 (fuente verificada). Con `size` pequeño, color naranja, `speed` bajo y `count` ~30–60 simula brasas flotando encima del fuego.
- **Cómo se usa en R3F:** `<Sparkles count={40} scale={[0.4,0.8,0.4]} size={2} color="#ff9a3c" speed={0.4} position={...} />` dentro del hogar.
- **Coste:** BAJO (THREE.Points internamente).
- **URL:** fuente https://github.com/pmndrs/drei/blob/master/src/core/Sparkles.tsx · Ejemplo de chispas/efectos pmndrs (índice de ejemplos): https://r3f.docs.pmnd.rs/getting-started/examples
- **Licencia:** MIT (drei).

### 2.4 · Texturas de partículas autocontenidas (CC0)
- **Qué es:** pack de 80 texturas/sprites de partículas (humo, chispa, resplandor) con licencia CC0 → se descargan una vez al proyecto y se bundlean: cero peticiones externas en runtime.
- **URL:** https://www.kenney.nl/assets/particle-pack
- **Licencia:** CC0 (dominio público creativo).

---

## 3. Glow del fuego SIN bloom global

El bloom global (UnrealBloomPass / `Bloom` de postprocessing) procesa toda la escena y en una Radeon 610M puede costar 30–50% del frametime además de "quemar" los claros. Alternativas verificadas:

### 3.1 · Fake Glow Material (fresnel sin postproceso)
- **Qué es:** ShaderMaterial que crea halo/glow alrededor de una malla lisa (esfera envolviendo la fuente) calculando fresnel por normal; sin EffectComposer. Existe versión vanilla three y versión R3F.
- **Cómo se usa en R3F:** descargar el material (gists enlazados en el README, incluida variante TS de nirtamir2) y usarlo como material de una esfera BackSide delante del fuego; ajustar `falloff`, `glowInternalRadius`, `glowColor`.
- **Coste:** BAJO (una malla más).
- **URLs:** https://github.com/ektogamat/fake-glow-material-threejs · R3F: https://github.com/ektogamat/fake-glow-material-r3f — demo https://r3f-fake-glow-material.vercel.app/
- **Licencia:** MIT (ambos).

### 3.2 · Billboard con gradiente radial + PointLight parpadeante
- **Qué es:** el patrón estándar del foro para faros/fuegos: plano siempre mirando a cámara (copiar quaternion de cámara o `<Billboard>` de drei) con textura radial aditiva para el halo, más `PointLight` naranja con intensidad modulada por ruido/senos para que la habitación "respire". El emissive del material vende la fuente; la PointLight vende el entorno. Sin postproceso alguno.
- **Cómo se usa en R3F:** `<Billboard>` (https://github.com/pmndrs/drei/blob/master/src/core/Billboard.tsx) + `meshBasicMaterial` con `map` radial generada en canvas (autocontenido) + `useFrame` para `light.intensity = base + noise(t)`.
- **Coste:** MÍNIMO.
- **URL:** hilo "Glow without Bloompass" (patrón paso a paso): https://discourse.threejs.org/t/glow-without-bloompass/88503 · relacionado: https://discourse.threejs.org/t/whats-the-best-way-to-achieve-a-glow-effect/59724
- **Licencia:** técnica de foro (libre).

### 3.3 · Parpadeo horneado: mezcla RGB de 3 lightmaps (el truco de Maaloul)
- **Qué es:** en lugar de luces dinámicas, las superficies cerca del fuego usan un ShaderMaterial que lee **los 3 canales RGB de una sola textura = 3 lightmaps prehorneadas** y las mezcla con pesos animados por senos/ruido (`ratioR/G/B`). Resultado: parpadeo cálido de hoguera con coste de un sample de textura. Es exactamente lo que hace el Pen de §1.1 (`rgbLightmapFrag` + `updateLight()`).
- **Cómo se usa en R3F:** hornear 3 variantes de iluminación en Blender (o generarlas con el baker de abajo), empaquetarlas en RGB, aplicar vía `shaderMaterial` a suelo/paredes del hogar.
- **Coste:** CASI CERO en runtime.
- **URL:** mismo gist de §1.1: https://gist.github.com/ChrisPluto/8935d46f1fbd7d31d3e56d74e7701859
- **Licencia:** ver nota de §1.1.

### 3.4 · Lightmaps/AO horneadas en navegador (soporte)
- **Qué es:** baker de lightmap/AO in-browser de pmndrs; útil para hornear la iluminación estática de la tienda y dejar solo el flicker dinámico del hogar.
- **URL:** https://github.com/pmndrs/react-three-lightmap
- **Licencia:** MIT. (Repo estable pero con mantenimiento lento; API probada.)

> Si aun así se quisiera bloom puntual: selective bloom a media resolución es la vía, pero para 610M la recomendación operativa es NO usar composer en absoluto y quedarse con 3.1–3.3.

---

## 4. Referencias visuales: chimeneas / hogares low-poly isométricos

| Referencia | Qué aporta | URL | Licencia |
|---|---|---|---|
| **Pen "The Fireplace" (Karim Maaloul/Yakudoo)** | LA referencia: chimenea low-poly con llama shader + flicker por lightmaps; estética exactamente del tipo buscado | https://codepen.io/Yakudoo/pen/ZEZWKJy | CodePen/MIT ⚠️ verificar |
| **bryanhuh/cozy-room** | Habitación isométrica cozy construida 100% en código con R3F (React+Vite); buena referencia de composición y paleta cálida | https://github.com/bryanhuh/cozy-room — live: https://cozy-room-phi.vercel.app | ⚠️ SIN LICENCIA declarada → solo inspiración visual |
| **PTthe13/amplifiedlabs diorama** | Diorama isométrico interactivo con control de lámparas/iluminación por temas; footer del propio sitio enlaza fuente y dice MIT | https://ptthe13.github.io/amplifiedlabs/diorama/ — fuente: https://github.com/PTthe13/amplifiedlabs/tree/main/diorama | MIT (declarado en la página) |
| **adrianhensler/three-js-room-demo** | Habitación cozy en un único HTML, primitivas procedurales, ACESFilmic, lámpara encendible; útil para ver iluminación cálida barata | https://github.com/adrianhensler/three-js-room-demo — live: https://adrianhensler.github.io/three-js-room-demo/ | ⚠️ NO VERIFICADA (no vi archivo LICENSE) |
| **jasonsturges/three-low-poly** | Librería low-poly code-first con capa de "ambience" que incluye **flame/flicker**, lluvia, etc.; taxonomía environment/ambience/FX muy aplicable | https://github.com/jasonsturges/three-low-poly — galería: https://jasonsturges.com/three-low-poly/ | ISC |
| **Ejemplos pmndrs (R3F oficiales)** | `sparks-and-effects`, `room-with-soft-shadows`, `instanced-particles-effects`: patrones listos para R3F | índice: https://r3f.docs.pmnd.rs/getting-started/examples | MIT (pmndrs) |

⚠️ Los modelos de Sketchfab/CGTrader "cozy isometric room" que aparecen en búsquedas son assets de descarga, no código reutilizable con licencia clara para este caso; se descartan por la restricción de autocontención/licenciamiento.

---

## 5. Utilidades three/drei ya existentes que sirven

| Utilidad | Uso en este proyecto | URL fuente (verificada) |
|---|---|---|
| `shaderMaterial` (drei) | Envoltorio para todos los shaders de llama/hum/lightmap: uniforms como props declarativos + `extend` | https://github.com/pmndrs/drei/blob/master/src/core/shaderMaterial.tsx · docs: https://drei.docs.pmnd.rs/shaders/shader-material |
| `Sparkles` (drei) | Brasas/chispas del hogar (§2.3) | https://github.com/pmndrs/drei/blob/master/src/core/Sparkles.tsx |
| `SpriteAnimator` (drei) | Fuego/humo por atlas de sprites sin escribir shader (§1.5) | https://github.com/pmndrs/drei/blob/master/src/core/SpriteAnimator.tsx |
| `Billboard` (drei) | Halo de glow mirando a cámara (§3.2) | https://github.com/pmndrs/drei/blob/master/src/core/Billboard.tsx |
| `Cloud` (drei) | Nubes de vapor (p.ej. humo suave del hogar o té); usar con moderación: es carilla en iGPU | https://github.com/pmndrs/drei/blob/master/src/core/Cloud.tsx |
| `useFrame` (R3F) | Animar `time`, flicker de `PointLight`, acumulador de frames del atlas | https://r3f.docs.pmnd.rs/api/hooks |
| `PerformanceMonitor` + `AdaptiveDpr` (drei) | Degradar DPR/calidad automáticamente si los 28 FPS caen — clave en la 610M | https://github.com/pmndrs/drei/blob/master/src/core/PerformanceMonitor.tsx · https://github.com/pmndrs/drei/blob/master/src/core/AdaptiveDpr.tsx |
| `DetectGPU` (drei) | Clasificar la GPU y activar/desactivar el fuego volumétrico según hardware | https://github.com/pmndrs/drei/blob/master/src/core/DetectGPU.tsx |
| `BakeShadows` (drei) | Congelar shadow map (estático en tienda isométrica) y ahorrar ms/frame | https://github.com/pmndrs/drei/blob/master/src/core/BakeShadows.tsx |
| `THREE-CustomShaderMaterial` | Si se quiere inyectar brillo de fuego/emissive animado DENTRO de un `meshStandardMaterial` existente (conserva luces/PBR) | https://github.com/FarazzShaikh/THREE-CustomShaderMaterial — MIT |

**Compatibilidad declarada con nuestro stack:** drei 10.x es MIT y acompaña R3F v9 (requiere React 19). `@wolffo/three-fire` declara R3F v9 + three r184 testeados en CI. `three-nebula` declara tests contra `three@0.185.1`. Los shaders GLSL de §1.1/§1.3 son agnósticos de versión (ShaderMaterial básico; WebGL2 es el default de three desde r163, soportado por la 610M).

---

## No verificado / advertencias

- ⚠️ Licencia exacta del Pen de Yakudoo (CodePen muestra MIT por defecto; confirmar en la página del Pen antes de copiar texto literal).
- ⚠️ `bryanhuh/cozy-room` y `adrianhensler/three-js-room-demo`: sin LICENSE visible → úsalos solo como referencia visual, no copies código.
- ⚠️ No existen benchmarks públicos de estas técnicas específicas sobre Radeon 610M; los "costes" aquí son estimaciones cualitativas basadas en tipo de técnica (overdraw, raymarching, nº de draws).
- ⚠️ `hilmerx/fire-shader`, `andreiongd/steamm-smoke-animation` (usa three 0.118, requeriría port) y stemkoski (roto en three moderno): revisados de nombre/hilo solamente.
- El `.glb` y `noise_1.jpg` del Pen de Maaloul están en el CDN de CodePen: hay que descargarlos una vez y servirlos desde `/public` propio para cumplir la autocontención.

---

## TOP-5 por impacto/coste para la tienda de té (Radeon 610M)

1. **Llama procedural estilo Maaloul sobre media-cilindro + brasas con `MultiplyBlending`** (§1.1). Impacto visual máximo ("parece de verdad"), coste casi nulo, 100% portable a R3F con `shaderMaterial`. Base obligatoria.
2. **Parpadeo por mezcla RGB de 3 lightmaps horneadas** en suelo/paredes del hogar (§3.3) + **`PointLight` naranja modulada por ruido** (§3.2). Vende el fuego en toda la estancia sin una sola pasada de postproceso.
3. **Chispas/brasas con drei `<Sparkles>`** (§2.3). Ya viene instalado con drei 10.7; 40 puntos naranjas ascendentes = vida instantánea.
4. **Humo ligero: 10–20 quads con textura CC0 de Kenney, curvas de escala/alfa y `depthWrite:false`** (§2.1 + §2.4). Barato y creíble; sirve también para vapor de las teteras reutilizando el mismo sistema.
5. **Halo de glow con `<Billboard>` + gradiente radial generado en canvas** (§3.2) o, si se quiere más cuerpo, `fake-glow-material-r3f` (§3.1) — y **solo si el presupuesto de FPS lo permite**, sustituir la llama plana por `@wolffo/three-fire` con `iterations≤15` (§1.2), idealmente tras medir con `PerformanceMonitor`.

*Regla transversal: nada de EffectComposer/bloom global en la 610M; sombras congeladas (`BakeShadows`) y DPR adaptativo como red de seguridad.*
