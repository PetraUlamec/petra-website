# Investigación: realismo/profundidad para diorama isométrico R3F (explorador, 19-ago-2026)
Resumen priorizado (informe completo en el transcript de la sesión):
1. FOG POR ALTURA con extinción/inscattering separados (Íñigo Quílez, iquilezles.org/articles/fog/) — máxima profundidad/calidez por coste ~0.
2. AccumulativeShadows (drei) + contact shadows falsas (plano gradiente, depthWrite:false) — asienta objetos, coste ~0 estático.
3. RIM LIGHT EN ORTOGRÁFICA: viewDir es CONSTANTE vec3(0,0,1) — los fresnel de tutoriales de perspectiva salen mal (three#17662).
4. DITHERING + HalfFloatType contra banding (threejs.org/docs/pages/module-Bayer.html) — ya cubierto parcialmente con <Noise>.
5. THREE-CustomShaderMaterial (FarazzShaikh) — shaders custom SIN perder sombras/fog de MeshStandard.
6. <Outlines screenspace> de drei — mejor que OutlinePass en ortográfica.
7. N8AO halfRes "Ultra" ≈ full "Performance" pero se ve mejor (dato del autor).
8. Referencias: The Sleepers (Codrops 07-2026, fog vertical+outline horneado), Jesse's Ramen (baked + degradación por FPS a matcaps), Codrops eficiencia 02-2025 (canvas antialias:false/stencil:false/depth:false).
9. Madera procedural: anillos+Perlin (shadertoy mdy3R1, wisc.edu 559 wood) · Tela: MeshToon+gradientMap 4px Nearest.
NO verificado: técnicas internas de my-room-in-3d; wood/fabric en LYGIA.
