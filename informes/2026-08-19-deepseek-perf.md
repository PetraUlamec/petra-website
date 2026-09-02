# deepseek-free (opencode Zen) — rendimiento iGPU, 19-ago-2026

[0m
> build · deepseek-v4-flash-free
[0m
[0m◈ [0mParallel Web Search "three.js fake glass material without transmission cubemap fresnel matcap transparent"
[0m◈ [0mParallel Web Search "drei ContactShadows performance cost blob shadows three.js comparison"
[0m◈ [0mParallel Web Search "Blender 5 glTF exporter transmission clearcoat sheen iridescence extensions three.js r185"
[0m◈ [0mParallel Web Search "three.js postprocessing performance integrated GPU iGPU N8AO SSAO Bloom SMAA TAA cost 2024"
[0m◈ [0mParallel Web Search "low-end GPU integrated postprocessing three.js which effects skip performance 2025 mobile"
[0m◈ [0mParallel Web Search "three.js matcap glass material fresnel fake refraction example code MeshMatcapMaterial transparent"
[0m◈ [0mParallel Web Search "three.js r185 GLTFLoader supported extensions KHR_materials transmission clearcoat sheen iridescence anisotropy"
[0m◈ [0mParallel Web Search "drei MeshRefractionMaterial MeshTransmissionMaterial cost cubemap cube camera alternative"
[0m% [0mWebFetch https://docs.blender.org/manual/en/latest/addons/scene_gltf2.html
[0m◈ [0mParallel Web Search "MeshPhysicalMaterial glass without transmission envMap metalness roughness transparent reflection only three.js"
[0m◈ [0mParallel Web Search "blob shadow texture fake shadow plane vs real shadow map performance webgl game cheap"
[0m◈ [0mParallel Web Search "Blender glTF exporter KHR_materials_anisotropy dispersion iridescence supported extensions list 2025"
[0m◈ [0mParallel Web Search "three.js GLTFLoader KHR_materials_sheen support sheenColor sheenRoughness MeshPhysicalMaterial"
[0m◈ [0mParallel Web Search "N8AO SSAO performance comparison benchmark milliseconds aoSamples low end GPU three.js react"
Investigación hecha (solo web, nada local). Resultado:

**1. Qué efectos post valen su coste en iGPU (clase AMD 610M) — N8AO/SSAO/Bloom/SMAA/TAA**
- **N8AO**: SÍ vale, es el AO recomendado para iGPU. Modo `"Performance"` (8 muestras) está pensado explícitamente para "Mobile, Low-end iGPUs y laptops"; `"Low"` también. Con `halfRes = true` ganas 2-4x (coste fijo de ~1ms por el upscaling depth-aware). Evita los modos `Neural-*` (añaden coste GPU). → https://github.com/N8python/n8ao
- **SSAO**: vale la pena solo como alternativa, pero N8AO es mejor coste/calidad; en el foro de three.js se dice que la versión de `pmndrs/postprocessing` de N8AO es "night and day" más rápida que el `SSAOPass` de three/jsm. → https://discourse.threejs.org/t/best-ssao-that-is-on-par-with-sketchfab-quality-performance/54284
- **Bloom**: SÍ vale, es el mayor "bang for buck" visual en iGPU, siempre que se baje a half-res/mips y se use selective bloom (UMB con resolución reducida). → https://www.utsubo.com/blog/threejs-best-practices-100-tips y https://threejsroadmap.com/blog/the-complete-guide-to-threejs-post-processing-in-2026
- **SMAA**: SÍ, "low–medium" cost y buena calidad de bordes; el estándar recomendado junto a AO (la AA por hardware no combina bien con AO). → https://www.mysimulator.uk/content/tutorials/post-processing-threejs.html
- **TAA**: NO merece en iGPU: coste medio (buffer de historial + jitter) y ghosting. En su lugar, consejo de drcmda: `multisampling: 8` + near/far ajustados, o SMAA/FXAA. → https://www.balazsfarago.dev/blog/postprocessing-react-three-fibe y https://discourse.threejs.org/t/how-to-solve-the-anlias-after-n8ao-pass-i-used-smaa-but-not-work-well/60104

**2. Vidrio creíble SIN transmission pass (fresnel/cubemap/matcap)**
- Veredicto: sí es posible y es lo correcto para iGPU. La vía "transmission" de `MeshPhysicalMaterial` re-renderiza la escena por cada objeto (bottleneck documentado). Alternativas:
  - **Cubemap + Fresnel**: `ShaderMaterial` con `refract()` contra una textura de entorno + mezcla Fresnel (`pow(1+dot(E,N),3)`). Ejemplo completo paso a paso con código → https://tympanus.net/codrops/2019/10/29/real-time-multiside-refraction-in-three-steps/
  - **drei `MeshRefractionMaterial`**: refracción por cubemap (sin transmission pass), con `envMap` estático (sin CubeCamera si solo quieres reflejos del HDRI). "Number of ray-cast bounces... can be expensive, 2". → https://drei.docs.pmnd.rs/shaders/mesh-refraction-material
  - **Matcap**: lo más barato (lighting horneado, no responde a luces) — `MeshMatcapMaterial`. → https://threejs.org/docs/pages/MeshMatcapMaterial.html
  - Combinación sin transmission para "cristal pulido": `MeshPhysicalMaterial({ roughness:0.05, metalness:0, envMap:PMREM, transparent:true, opacity:~0.3, clearcoat })` (transmission = 0) — el propio artículo de Codrops lo usa como base. → https://tympanus.net/codrops/2021/10/27/creating-the-effect-of-transparent-glass-and-plastic-in-three-js/

**3. Blob shadow vs ContactShadows (drei): coste real**
- **Blob shadow**: ~gratis — un quad con textura de gradiente radial, `MeshBasicMaterial` + `transparent` + `THREE.MultiplyBlending`, pegado al suelo. Un draw call, sin FBO, sin re-render de escena. Es como lo hacen Mario 64, Animal Crossing, Monument Valley y "la mayoría de juegos real-time". → https://threejs.org/manual/en/shadows.html y https://discourse.threejs.org/t/turn-spotlight-into-a-drop-shadow/90081
- **ContactShadows (drei)**: coste real por frame — renderiza la profundidad de la escena desde abajo + passes de blur. La doc lo dice explícito: *"Since this is a rather expensive effect you can limit the amount of frames it renders... `frames={1}`"*. Aún así es más barato que una luz con shadow map real. → https://drei.docs.pmnd.rs/staging/contact-shadows
- Veredicto: en iGPU usa blob para anclar personajes/suelo (coste ≈ 0); reserva ContactShadows solo con `resolution={256}`, `frames={1}` (objetos estáticos) o con bajo blur. Para sombra dinámica de personajes, blob es la opción estándar.

**4. Extensiones de material glTF que exporta Blender 5 y lee three r185**
- **Blender 5.x exporta** (manual oficial 5.2/5.3): `KHR_materials_transmission`, `KHR_materials_clearcoat`, `KHR_materials_sheen`, `KHR_materials_ior`, `KHR_materials_volume`, `KHR_materials_specular`, `KHR_materials_emissive_strength`, `KHR_materials_anisotropy`, `KHR_materials_dispersion`, `KHR_materials_unlit`, más no-material (instancing, meshopt, draco, variants, animation_pointer). La sección "Iridescence" del manual confirma export vía `KHR_materials_iridescence`. → https://docs.blender.org/manual/en/latest/addons/scene_gltf2.html y https://docs.blender.org/manual/en/dev/addons/scene_gltf2.html
- **three r185 GLTFLoader lee**: `KHR_materials_transmission`, `clearcoat`, `sheen`, `iridescence`, `anisotropy`, `ior`, `specular`, `volume`, `emissive_strength`, `dispersion`, `unlit`, etc. (todas las KHR_materials PBR). Hay ejemplos oficiales para sheen, iridescence, anisotropy y transmission. → https://threejs.org/docs/pages/GLTFLoader.html y https://threejs.org/examples/webgl_loader_gltf_sheen.html
- Veredicto: Blender 5 ↔ r185 tienen cobertura total de las 4 extensiones que preguntas (transmission/clearcoat/sheen/iridescence). Para iGPU, ojo: `transmission` fuerza el render extra de escena por objeto en three, y `sheen`/`iridescence`/`clearcoat`/`anisotropy` encarecen el shader por píxel (el propio MeshPhysicalMaterial lo documenta). Exporta con transmission 0 o acéptalo solo en objetos pequeños.
