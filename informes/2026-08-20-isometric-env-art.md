[0m
> build · deepseek-v4-flash-free
[0m
[0m$ [0mls -la /tmp/gv-isome 2>/dev/null | head -50
total 4
drwxrwxr-x   2 ser  ser    60 ago 19 23:51 .
drwxrwxrwt 117 root root 3420 ago 19 23:52 ..
-rw-rw-r--   1 ser  ser    44 ago 19 23:52 informe.md
[0m
[0m◈ [0mExa Web Search "trim sheet texturing tutorial game art texel density Blender"
[0m◈ [0mExa Web Search "why bevel every edge 3D model realism low poly shading"
[0m◈ [0mExa Web Search "professional isometric diorama environment art techniques tutorials ArtStation"
[0m→ [0mRead informe.md
[0m◈ [0mExa Web Search "decals grime environmental storytelling environment art Substance Designer wear tear"
[0m◈ [0mExa Web Search "stylized low poly vegetation believable diorama blender trees grass tips"
[0m◈ [0mExa Web Search "three point lighting orthographic isometric render still life diorama warm cool fill light"
[0m◈ [0mExa Web Search "react-three-fiber drei postprocessing bloom ambient occlusion vignette LUT color grading"
[0m◈ [0mExa Web Search "volumetric fog dust god rays three.js atmosphere environment"
[0m◈ [0mExa Web Search "modular kitbashing environment art workflow game ready kit pieces"
[0m◈ [0mExa Web Search ""big medium small" silhouette readability environment art composition hero silhouette focal point"
# Informe: 12 técnicas de ISOMETRIC ENVIRONMENT MODELING para llevar tu diorama de té de "juego" a "diorama profesional"

Contexto de aplicación: Blender 5.1 → GLB → three.js (React Three Fiber + cámara ortográfica + materiales PBR). Cada técnica incluye: **qué es · por qué eleva el realismo · cómo aplicarla** y **referencias con nombre**.

---

## 1. Composición de masas y siluetas (Big-Medium-Small + blockout)

**Qué es:** La escena se diseña primero como masas: 1–2 formas GRANDES (techo/toldos/edificio), varias MEDIANAS (mostrador, estanterías, árbol) y muchas PEQUEÑAS (teteras, tazas, hojas). El blockout se hace con cubos/grises planos, sin texturas, validando la silueta contra la cámara orto.

**Por qué:** Es lo primero que percibe el ojo. Un diorama amateur tiene todo el mismo tamaño de masa → nada focaliza. El profesional gobierna el peso visual con la regla 70/30 y la jerarquía de valores: el 90% del detalle va a una zona, el resto es descanso visual. En orto (sin perspectiva) la composición es plana por definición, así que **la silueta lo es todo**.

**Cómo aplicarlo en Blender → GLB → three.js:**
- En Blender: blockout con cubos en la escena orto (RotX 60°, RotY 0°, RotZ 45°, cámara Orthographic). Haz el *squint test*: entrecierra los ojos en la vista de cámara; si no distingues qué es qué, falla la composición.
- Test de notan (2 valores) y de 5 valores en gris: si la imagen no lee en blanco y negro, no lee en color. Haz el screenshot del viewport con sombreado flat y conviértelo a B/N en el Compositor.
- En three.js: no hay nada que programar — el blockout decide la cámara orto (position, fov/zoom) y el encuadre final.

**Referencias:** Romans Busels (ZugZug Art) *Handpaint Diorama Course* (ArtStation) — blockout en semana 1; Jasmin Habezai-Fekri *Creating a Hand-painted Diorama in Blender* (ArtStation Learning); Lino Drieghe *Design Principles* (ArtStation, Big/Medium/Small); Geraud Soulié *Creativity in Concept Art* (Lunar Academy).

---

## 2. Trim sheets + texel density

**Qué es:** Un solo atlas (2K) dividido en tiras horizontales (trims): cada tira es un perfil texturizado (zócalo, moldura, tablón, borde de teja, viga). Decenas de meshes del kit mapean sus UVs a las tiras (deslizando en U, bloqueando en V). La **texel density** es la resolución de textura por unidad de mundo (px/m) — todo el kit comparte la misma (p.ej. 512 px/m).

**Por qué:** Te da consistencia material perfecta (una textura, un lenguaje visual), detalles tipo "arquitectura real" sin modelarlos (molduras, juntas, tornillos), y elimina el error #1 del amateur: densidad de texel dispar entre piezas vecinas, que "delata" la costura de UV en cada junta.

**Cómo aplicarlo en Blender → GLB → three.js:**
- En Blender: modela cada trim como tira en escala real, hornea high→low sobre un plano UV 0–1 (normal, AO, roughness). UVea las piezas del kit alineando islas a las bandas (V) y haciendo tilear en U.
- **GLB:** las UVs que exceden 0–1 en U se mantienen; en three.js marca la textura como `THREE.RepeatWrapping` (R3F: `<texture wrapS={THREE.RepeatWrapping} wrapT={THREE.ClampToEdgeWrapping} />`).
- *No multipliques materiales:* un solo MeshStandardMaterial por trim = un draw call. GLB conserva la referencia a la misma imagen → un solo upload de GPU.
- Fija la texel density antes de UVear (usa el addon *UV Texel Density* o cálcula px por mundo en las tiras).

**Referencias:** Tim Simpson (Pixelmasher) *Trim Sheet Tutorial — Environment Art 101* y *Creating Trim Textures 4-Part* (gratis); FlippedNormals *Trim Sheet Techniques for Video Games*; GDC *The Ultimate Trim Texturing Techniques* (Sunset Overdrive, Insomniac); PropGon Academy *Trim Sheets in Blender*; Beyond Extent *Trimsheets deep dive*.

---

## 3. Bevel/chamfer en TODOS los bordes

**Qué es:** Añadir chaflán real (geometry bevel, 1–3 segmentos) a todo borde que exista en el mundo real — casi ninguno es de 90° perfecto. En low-poly se combina con *weighted/custom normals* (Blender: Normal Edit) para suavizar el matizado sin geometría extra.

**Por qué:** Un borde duro es el cliché del "3D de videojuego": no atrapa el highlight especular y da el aspecto de plastilina/plastic. El bevel hace que cada arista **capte luz** (specular edge highlight) y que la pieza lea como madera, piedra o cerámica real. En orto con luces direccionales, el bevel es lo que separa "caja" de "objeto".

**Cómo aplicarlo en Blender → GLB → three.js:**
- Regla práctica: bevel de geometría en todo borde visible en la silueta y en aristas ≥ 1–2 px en pantalla; en los pequeños del micro-detalle basta el normal map. El fondo/inferior oculto puede quedarse duro.
- Bevel modifier → *Amount* ~1–3% de la pieza, *Segments* 1–2, *Harden Normals* ON; después *Custom Split Normals* (selecciona todo → Mesh → Faces → *Set from Face* → *Smooth*) para exportar normales suavizadas.
- **GLB:** las custom normals se exportan y three.js las respeta (no las recalcula en `MeshStandardMaterial`). Verifica que no haya *shading seams* entre piezas beveladas y sin bevelar.
- Si escribe PBR: `roughness` global + bevel = la clave del "catching light".

**Referencias:** robg3d.com *Beveling* (por qué el coste en vertices es el mismo que un hard edge); hilos polycount *When should I bevel?* y *Bevel vs normal map* (Alien: Isolation usa bevel + weighted normals); Blender StackExchange *How can I make sharp geometric models look more realistic*; David Lesperance (técnicas de edges en scifi).

---

## 4. Decals y grime

**Qué es:** Texturas superpuestas con máscara (alpha) que ensucian superficies "limpias": manchas de té en el mostrador, marca de vapor en el cristal, rastro de ruedas, grietas, costra de barro en el umbral, sellos/etiquetas desgastados. *Grime* = acumulación dirigida por gravedad/AO (lo bajo de las paredes, esquinas, juntas).

**Por qué:** El ojo humano detecta al instante una superficie "virgen". Los decals son la forma más barata de romper la uniformidad del material tileable y de anclar cada objeto a su entorno (el objeto toca el suelo → sombra de contacto + suciedad = integración). Un render con decals se lee "vivido"; sin ellos, "render de catálogo".

**Cómo aplicarlo en Blender → GLB → three.js:**
- En Blender: pinta decals en el propio albedo con *Texture Paint* (máscaras de color por AO/curvatura/gravedad) **o** exporta un atlas de decals separado.
- En three.js: la vía R3F es el componente `<Decal>` de drei (plano proyectado sobre la geometría) para manchas/grietas puntuales; para lo general, ya va horneado en la textura (menos draw calls).
- Usa `alphaTest` (~0.5) en vez de `transparent` para decals, evita ordenado de transparencia y fallos de sorting en orto.
- Aplica *contact shadow* + decal de "polvo de suelo" bajo cada pieza apoyada (ver técnica 12).

**Referencias:** Íñigo Cebollero *Aged Phone Booth* (80.lv, técnica de mesh decals + texture decals); Mudra Roy *Rusty Stop* (80.lv, Decal Atlas en Substance Designer); Emiel Sleegers *Decals* (FastTrackTutorials, 30+ técnicas incl. POM); *The Passenger* (80.lv, decals y grime dirigido por world-space normals).

---

## 5. Storytelling ambiental (desgaste, uso, vida)

**Qué es:** Narrar la historia del lugar con el estado de los materiales y la disposición de los objetos: el mostrador desgastado donde se apoyan los codos, el suelo del pasillo más pulido que el rincón, la taza a medio usar, el plátano con marca de dedos, el periódico del día, la escoba apoyada.

**Por qué:** Es lo que hace que el diorama se *habite*. La técnica nº1 que separa nivel de portfolio: un entorno que cuenta *quién vive ahí y qué ha pasado* se recuerda; el "bonito pero vacío" se olvida. El desgaste (wear) guiado por física (contacto humano, gravedad, viento, agua) dice cuánto tiempo lleva el lugar existiendo.

**Cómo aplicarlo en Blender → GLB → three.js:**
- En Blender: pinta wear con *Texture Paint* usando como máscara la curvatura (edges) y el AO; el varnish del barniz se va en las zonas de roce (ver madera: brillo en zonas de contacto, mate en el resto). Añade la taza con vapor, el gato durmiendo, la hoja caída.
- **Regla del timeline de capas** (de Cebollero): los daños se apilan como capas — pintura vieja, después suciedad, después marca de vandalismo. No apliques todo uniforme.
- En three.js: los *vertex colors* de Blender (COLOR_0 del GLB) permiten variar el material por instancia: `MeshStandardMaterial` con `vertexColors` y mezcla de "limpio" vs "sucio" por vertex paint (las dos paredes idénticas del kit leen distinto).
- Drei `<Sparkles>` o partículas pequeñas (polvo flotante, vapor de la tetera) venden "vida" sin fricción.

**Referencias:** GDC *Aged by Adventure: Crafting the Time-Worn World of Indiana Jones and the Great Circle* (MachineGames/Adobe, weathering y geo-decals); Thiago Klafke *Weathering & Grime in 3D Environments* (Environment Art Substack, estudio con fotos reales); Daniil (GamesArtist) *Wooden Floor* (el varnish como storytelling); Paul Fish *How Isometric Environments Are Made* (80.lv, narrative-driven set dressing en isométricos).

---

## 6. Vegetación creíble

**Qué es:** Foliage que no parece papel: planos (cards) con alpha que reciben luz correcta, variación de escala/tono por instancia, y jerarquía de "bultos" (masa) + "detalle" (hojas finas). Para un diorama: 2–4 tipos de card (arbusto, hierba alta, helecho, ramita) + una tiling de musgo/hojas en el suelo.

**Por qué:** La vegetación es donde más se nota el low-poly barato: cards planos con normales hacia un solo lado se ven "cartón" bajo luz orto. El truco profesional es **reescribir las normales** (apuntarlas hacia la luz / unificar dirección) y dar variación tonal por instancia, que es lo que hace que un arbusto lea como bulto denso y no como sábana.

**Cómo aplicarlo en Blender → GLB → three.js:**
- En Blender: recorta cards de un atlas de foliage (pintado con alpha), subdivídelos y dóblalos ligeramente con Proportional Editing, y aplica *Normal Edit* para unificar/dirigir las normales (técnica clave de Pete Dimitrov).
- Distribución: particle system Hair→Render as Object sobre un ground con weight paint (grass clumps cerca del camino, nada en el camino).
- **GLB → three.js:** dos-side + `alphaTest` (~0.5) en el material de cards; exporta UN card e instancia: drei `<Instances>`/`<InstancedMesh>` con `useGLTF` para cientos de instancias en un draw call. Variación de tono vía `instanceColor` (vertex colors de la instancia) o `map` con color random.
- Sombra: cards `castShadow` moderado — demasiadas sombras de cards ensucian el orto. Deja que la "masa" del arbusto proyecte, no cada hoja.

**Referencias:** Ryan King Art *Low Poly Forest in Blender* (particles + weight paint + variación de color por Object Info); Pietro Chiovaro *Discover how to create stylised grass in Blender* (Creative Bloq); Pete Dimitrov *Scarlet Diorama devlogs* (foliage atlases + Normal Edit); Charles Boury *3Dioramas* (transferir normales de conos a cards); Omar Faruq Tawsif (assets painterly en Blender).

---

## 7. Iluminación de 3 puntos en orto

**Qué es:** Aunque la cámara sea ortográfica, la luz no lo es: **key light** (direccional cálida, define sombras), **fill light** (fría, suave, contra-rellena las sombras) y **rim/back light** (recorta siluetas). En diorama, todo direccional/sun (sin decay de distancia — crítico en orto).

**Por qué:** Con orto el ojo no tiene profundidad por perspectiva, así que la única profundidad es la del **contraste de valor + dirección de sombra**. Una sola luz = plano y aburrido; tres luces con matiz cálido/frío dan lectura volumétrica, separan planos (fondo vs medio vs frente) y crean el "efecto maqueta iluminada".

**Cómo aplicarlo en Blender → GLB → three.js:**
- En Blender (para referencia): Sun key (~60° de elevación), Sun fill frío, rim trasero cálido. Exporta la dirección de la key para replicarla en three.js.
- En three.js/R3F:
  - `<directionalLight>` como key (castShadow, shadow-mapSize 2048, radius grande para sombras suaves).
  - `<directionalLight>` frío de fill (intensidad 0.3–0.5, sin sombras).
  - rim directional o `<spotLight>` desde atrás para el recorte.
  - `<Environment>` de drei con HDRI muy suave (studio) da reflejos de material (madera/cerámica) sin matar el contraste.
- Contraste: baja la intensidad hasta que "lea en B/N" (comprueba con un post de desaturación en el EffectComposer).
- Sombras: `PCFSoftShadowMap`, `shadow.radius` y bias pequeño; en orto vigila el *camera frustum* de la luz para cubrir todo el diorama.

**Referencias:** *How to prepare isometric assets for your games* (GameDeveloper — pipeline orto, key/fill constantes por asset); Mira Karouta *Creating a Still Life Composition with Toolbag 4* (Marmoset — light planes + rim, black-box env); The Rookies *Master Shading and Lighting for a Still Life* (key cálida + rim, ACES); Clint Bellanger *Isometric Tiles in Blender* (sun lamps, no point lights); *The Passenger* (80.lv — luces de color para mood).

---

## 8. Color grading (ACES/LUT)

**Qué es:** El paso final de color: tone mapping (filmic) + LUT de look (curvas de contraste/saturación/hue) que unifica toda la imagen como un "look" de película, en vez de dejar los colores del render crudo.

**Por qué:** El render "sin grade" tiene color plano y highlights quemados; el diorama profesional tiene una *paleta coherente* (warm interior de té + frescor exterior) y rangos tonales controlados. El tone mapping filmic (ACES/AgX) comprime los brillos con suavidad — es lo que hace que la luz del sol o una bombilla "brillen" en vez de cortarse a blanco.

**Cómo aplicarlo en Blender → GLB → three.js:**
- En Blender: gradúa con el Compositor (curvas + coloreado) para fijar el look de referencia.
- En three.js:
  - Activa color management de three (por defecto desde r152) y `ACESFilmicToneMapping` en el renderer (R3F: `<Canvas gl={{ toneMapping: THREE.ACESFilmicToneMapping }} />`).
  - En react-postprocessing: `<EffectComposer><ToneMapping mode={ToneMappingMode.ACES_FILMIC} /></EffectComposer>` y después `<LUT lut={lutTexture} tetrahedralInterpolation />` con un `.cube` exportado (crea el LUT desde Photoshop/Blender con la técnica estándar de 33³).
- Orden del composer: AO → Bloom → Grade (LUT/curvas) → ToneMapping → Vignette/Noise al final.

**Referencias:** Three.js Journey *Post-processing with R3F* (ToneMapping ACES_FILMIC, AgX); docs *React Postprocessing — LUT* (pmndrs); The Rookies still-life breakdown (ACES color space); *How to prepare isometric assets* (contraste cálido-frío como herramienta 2D).

---

## 9. Atmósfera (niebla, polvo, god rays)

**Qué es:** Capas de profundidad atmosférica: **fog** (niebla por distancia), **partículas en suspensión** (polvo, vapor) y **luz volumétrica** (god rays que atraviesan ventanas/toldos). En orto, el fog es lo que separa fondo de medio de frente cuando no hay perspectiva que lo haga.

**Por qué:** Es el sellador de la ilusión de diorama: el fondo se desvanece → la escena parece más grande y más "fotografiada". El polvo flotante y los rayos de luz dan la impresión de volumen de aire real (partículas que se iluminan), algo que ningún material puede dar. Es el "polvo de hadas" que un amateur nunca aplica.

**Cómo aplicarlo en Blender → GLB → three.js:**
- Fog: R3F `<fog attach="fog" args={[color, near, far]} />` o `FogExp2` — con cámara orto el fog se calcula por profundidad de vista, funciona igual.
- Polvo/vapor: drei `<Sparkles>` (polvo dorado a contraluz, tamaño ~0.01–0.05, count 50–150) + un plano con vapor de la tetera (`transparent`, alphaTexture).
- God rays: **falso volumétrico** (barato y perfecto en orto): un cono/cilindro con `MeshBasicMaterial` additive (`blending: AdditiveBlending`, `depthWrite: false`, opacidad ~0.1–0.2) delante de la ventana — técnica HL2. O el paquete `three-good-godrays` (raymarch en screen-space desde la shadow map, efecto real).
- Niebla de "polvo en aire": pinta 1–2 "bolsas" de niebla con planos + noise alpha, flotando en el plano medio.

**Referencias:** Ameobea *three-good-godrays* (pmndrs postprocessing); TrentSterling *threejs-volumetric-beam* (port del fake volumetric de HL2 — Passivestar); Kenny Mitchell *Volumetric Light Scattering as a Post-Process* (NVIDIA GPU Gems 3, cap. 13); *Strata Sky & Volumetrics* (sky atmosférico R3F); Matteo Maravalle *TheBench* (80.lv — polvo y planos de luz).

---

## 10. Micro-detalle vs lectura (jerarquía de detalle)

**Qué es:** El arte de **no detallar todo por igual**. El micro-detalle (grano, vetas, arañazos, posillos, texturas a mm) vive en la zona focal; las zonas secundarias se simplifican (valores cercanos, menos contraste). El ojo necesita "áreas de descanso".

**Por qué:** Si cada mm tiene el mismo contraste, el ojo se fatiga y nada destaca: es la diferencia entre "ruido" y "realismo". El profesional concentra: 1) gran detalle en el punto focal (la tetera hero), 2) detalle medio en lo que toca, 3) masa limpia en el fondo. Además, la lectura en cámara orto exige que la silueta y los valores sobrevivan al *squint test*.

**Cómo aplicarlo en Blender → GLB → three.js:**
- En Blender: cuando termines una zona, haz *zoom out* al 25% y entornar los ojos — si no distingues jerarquía, simplifica. Usa normal maps para micro-detalle (no geometría) y reserva la geometría para el medio-detalle.
- En three.js: controla el ruido de normal maps con `normalScale`; no subas `roughness`/metalness sin plan; usa *LOD mental*: lo lejano en el fondo puede ser geometría simple + fog.
- Punto focal por contraste: más luz, más AO, más decals, bloom sutil en la tetera humeante.

**Referencias:** Lino Drieghe *Design Principles* (70/30, áreas de descanso); Geraud Soulié (Big-Medium-Small); Elbert Gu *Character Line-Up* (jerarquía y contraste focal); Grid Maker Pro *Concept art composition* (squint test, notan, 5 valores); hilos polycount (cuándo bevel vs normal map según tamaño en pantalla).

---

## 11. Kitbashing modular

**Qué es:** Construir el entorno a partir de un **kit reutilizable** (paredes, esquinas, columnas, ventanas, zócalos, piezas de techo) sobre una **malla base** (grid + pivots + texel density estándar), y "kitbash": combinar esas piezas para hacer composiciones nuevas (un soporte hecho de cajas + tablones del kit). El diorama de té se monta como un set de maqueta.

**Por qué:** Es el pipeline de la industria (Fallout 4, Frozenbyte/Trine, todo UE5): velocidad + consistencia + iteración. Para realismo: te permite iterar la composición (técnica nº1) sin remodelar, y romper la repetición con piezas hero + vertex paint + decals. Un kit modular bien medido produce entornos coherentes; hacerlo a mano produce costuras torcidas.

**Cómo aplicarlo en Blender → GLB → three.js:**
- Fija antes de modelar: **grid base** (p.ej. 50 cm — todo es múltiplo), **pivots** en esquina inferior (siempre igual), **texel density** única, y un ligero *overlap* (1–2 cm) para ocultar juntas.
- Piezas: pared 2×1m, esquina, pilar, ventana, zócalo, techo, + 3–5 piezas *hero* únicas (la tetera gigante, el mostrador, el cartel).
- En three.js: un solo material trim para todo el kit (draw call único); `<Instances>` para piezas repetidas; usa `useGLTF` + *mergeGeometry* para el static kit y deja props sueltos con `castShadow`.
- Variación anti-repetición: vertex paint por instancia, decals, rotación de instancias, 3–5 piezas únicas que anclen el recuerdo del espacio.

**Referencias:** Nataska Statham *Game environment art with modular architecture* (paper — grid, pivots, kit families); StraySpark *Modular Kit Workflow* (proxies→swap, texel density, hero pieces, vertex paint); *3D Asset Workflow: Blocksets* (wiki Frozenbyte/Trine — trims, piezas de transición); Beyond Skyrim *Modularity in Creating 3D Game Environments* (PDF — grid snapping, kit bashing); Hugo Parussini *Modular Viking House* (The Rookies — trimsheet + RGBa mask para variación).

---

## 12. Post-procesado (AO, bloom, LUT, noise, vignette)

**Qué es:** La capa final de react-postprocessing sobre el render: **SSAO/N8AO** (ambient occlusion en screen-space), **Contact Shadows** (sombras de contacto entre piezas), **Bloom** (emisivos), **Vignette + Noise** (grano de cámara) y **SMAA** (anti-alias para orto).

**Por qué:** El AO es lo que "pega" las piezas entre sí (rincón del mostrador con el suelo, junta de la tetera con la mesa): sin él, en orto los objetos parecen *flotando encima*. El bloom convierte las luces cálidas de la tienda en fuentes de luz. El grano + vignette quitan el aspecto "render 3D limpio" y dan fotografía. Es literalmente el filtro final entre "simple, como un juego" y "diorama de ArtStation".

**Cómo aplicarlo en Blender → GLB → three.js:**
```jsx
<EffectComposer multisampling={4}>
  <SMAA />                      // o N8AO para AO de calidad
  <N8AO intensity={1} distanceFalloff={1} aoRadius={0.05} />
  <Bloom luminanceThreshold={1} mipmapBlur intensity={0.4} />
  <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
  <LUT lut={lutTexture} tetrahedralInterpolation />
  <Noise opacity={0.02} />
  <Vignette eskil={false} offset={0.2} darkness={0.7} />
</EffectComposer>
```
- **Bloom selectivo:** en las lámparas/ventanas emisivas usa `emissive` + `emissiveIntensity={2}` con `toneMapped={false}` y `luminanceThreshold={1}` para que SOLO ellas brillen.
- **Contact shadows** (drei): `<ContactShadows>` bajo los props grandes — en orto es el arma secreta de integración, más barato y controlable que SSAO en ciertos casos. Combínalo con N8AO.
- En Blender: bakea AO en las texturas (para lo estático) y deja el AO dinámico solo para lo que se mueve.
- Orto + MSAA: usa `multisampling` del composer o SMAA (el hardware AA no funciona con post AO).

**Referencias:** docs *React Postprocessing* (pmndrs: Bloom, LUT, N8AO, SMAA, Vignette); Balázs Faragó *Postprocessing Settings in React Three Fiber* (N8AO vs SSAO, SMAA); Three.js Journey *Post-processing with R3F* (ToneMapping, multisampling); drei `<ContactShadows>` y `<Environment>`.

---

## Orden de implementación recomendado (checklist de 1ª a 12)

1. **Blockout + silueta** (nº1) → composición y cámara orto fijas.
2. **Kit modular** (nº11) → grid, pivots, texel density.
3. **Bevel** (nº3) en todo el kit.
4. **Trim sheet** (nº2) y materiales base.
5. **Iluminación 3 puntos** (nº7) y sombras.
6. **Decals + grime + storytelling** (nº4, nº5) — wear dirigido, decals, props narrativos.
7. **Vegetación** (nº6) instanciada.
8. **Atmósfera** (nº9) — fog, polvo, god rays.
9. **Post** (nº12) — AO, bloom, ACES/LUT, vignette/grano.
10. **Color grading** (nº8) — LUT final y check en B/N (nº10).

*Nota:* el nº10 (micro-detalle vs lectura) es un *criterio transversal* que revisas en cada paso.

---

**Referencias maestras para estudiar en orden:** Romans Busels *Handpaint Diorama Course* → Jasmin Habezai-Fekri *Blender Diorama* (ArtStation Learning) → FlippedNormals *Trim Sheet Techniques* → hilos polycount *bevel* → Thiago Klafke *Weathering & Grime* → Pete Dimitrov *Scarlet Diorama* (vegetación) → Mira Karouta *Still Life Toolbag* (luz) → docs react-postprocessing + drei.

Los 3 cambios de mayor impacto para tu diorama concreto de té: **bevel + weighted normals** (adiós al plástico), **SSAO/ContactShadows + AO bakeado** (piezas pegadas al suelo) y **ACES + LUT cálido** (adiós al render plano).
