# deepseek-free (opencode Zen) — estilo/recursos, 19-ago-2026

[0m◈ [0mExa Web Search "procedural wood texture shader canvas three.js tutorial fabric weave"
[0m◈ [0mExa Web Search "low poly isometric diorama three.js github codrops demo depth lighting"
[0m◈ [0mExa Web Search "fake lighting cheap GPU three.js baked lighting vertex colors emissive gradient hemisphere trick diorama"
[0m◈ [0mExa Web Search "codrops three.js isometric scene experiment tutorial 2024"
[0m◈ [0mExa Web Search "procedural fabric cloth texture GLSL shader weave thread tutorial article"
Investigación hecha (web-only, sin tocar ficheros). Resultado:

## 1) 5 demos top del estilo (técnica de profundidad y calidez)

1. **Amplified Diorama** — Isométrico cutaway procedural (sin texturas/ modelos). Profundidad: cámara ortográfica isométrica + sombras suaves de key caliente; calidez: bloom en pantallas + outline naranja en selección. https://amplifiedcreations.com/lab/diorama
2. **ai-office (Gaurav2693)** — Diorama isométrico R3F. Calidez: ciclo día/noche con transición *golden hour* + modo cyberpunk con underglow emisivo; profundidad: "islas de luz" por foco cuando el agente se mueve. https://github.com/Gaurav2693/ai-office
3. **img2threejs Doraemon House** — Diorama isométrico low-poly (icosaedros flat-shaded). Profundidad: key cálido arriba-izq (`0xfff2d6`) + fill frío + hemisférico, núcleos de sombra oscuros (`shadow.radius` para contacto suave); calidez: gradientes de tono en copas y dusk twinkle. https://github.com/img2threejs/img2threejs-showcase/blob/main/src/demos/doraemon-house/createDoraemonHouseModel.ts
4. **Expeditione.fun** — Diormas low-poly vanilla three.js (~1MB). Profundidad: movimiento de cámara + GLSL a medida; calidez: "soft lighting que hace el geometry cálido", optimizado a 60fps en móvil. https://expeditione.fun
5. **PaulKinlan/3d-io-demo-26** — Habitación isométrica procedural. Profundidad: ortográfica con orbit restringido + PCF soft shadows + *distance fog*; calidez: luz isométrica cálida + glow CRT con pulso emisivo. https://github.com/PaulKinlan/3d-io-demo-26

## 2) Repos mantenidos: toon/outline/soft-shadows para R3F

1. **drei `<Outlines>`** (inverted hull con `toCreasedNormals`) y **`<ContactShadows>`** (blob de sombra suave fake, barato) — https://github.com/pmndrs/drei/blob/master/src/core/Outlines.tsx
2. **r3f-peridot** — Outlines de calidad via post-procesado (depth+normal+surface ID), con IFC/GLTF — https://github.com/christiandimitri/r3f-peridot
3. **@velkina/inkwell** — Toolkit NPR Spider-Verse/Arcane: posterize + ink outline + halftone fusionados en 1 solo EffectPass (~1 draw extra) — https://github.com/VelkinaStudio/inkwell
4. **three-js-toon-shader** — Toon via gradient map + edge detection por depth/normal (no inverted hull), framework-agnostic — https://github.com/buggzeth/three-js-toon-shader
5. **toonlab** — Toon anime shader completo (rim light, outline, shadow map self-shadow) — https://github.com/call-me-sensei/toonlab
6. **enhance-shader-lighting** — Hace que PBR respete lightmaps/AO sin coste real — https://github.com/0beqz/enhance-shader-lighting

## 3) Mejor artículo/recurso de texturas procedurales

1. **Madera: addon oficial de three.js** (procedural wood TSL, port de Blender) — demo y código en https://threejs.org/examples/webgpu_tsl_wood.html (PR: https://github.com/mrdoob/three.js/pull/31640)
2. **Colección TSL de madera + tela (WebGL/WebGPU)** de Petar Boytchev — https://boytchev.github.io/tsl-textures/docs/wood.html (incluye `fabric`/weave)
3. **Madera en canvas (WebGL clásico)**: tutorial CS559 — anillos concéntricos + noise + coordenadas 3D ("tallar el objeto de un bloque") — https://cs559.github.io/559Tutorials/shaders/wood/
4. **Tela en canvas**: `fabricTextures.ts` (weave warp/weft + normal map + roughness) — https://github.com/Hack23/blacktrigram/blob/2995e76f/src/utils/fabricTextures.ts

## 4) Trucos de iluminación fake para GPU débil

1. **Baked lighting en una textura + `MeshBasicMaterial`** (cero luces, 60fps en móvil) — https://freefrontend.com/code/isometric-3d-baked-room-2026-02-16/ y guía R3F en https://tchayen.com/baked-lighting-in-r3f
2. **Bake a vertex colors** (solo positions+colors, shader flat: 3.6M vértices a 60fps en Quest 2) — https://wonderlandengine.com/news/vertex-color-baked-lighting/
3. **Luz dorada "golden hour" minimal**: 1 `DirectionalLight(0xffe4b5)` + `AmbientLight`, sin shadow maps caros — https://gist.github.com/lpenguin/e847a4a46eb1af486aa8e3affb187861
4. **Fake lights con emisivo + bloom** (monitores/lamparas como mesh emisivo en vez de PointLights reales) — https://github.com/PaulKinlan/3d-io-demo-26
5. **ContactShadows en vez de shadow maps** y AO pintado en la textura — https://github.com/pmndrs/drei

No he editado nada.
