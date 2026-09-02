# Presupuesto iGPU (explorador, 19-ago) — lo accionable
1. multisampling=0 SIEMPRE en 610M (el default silencioso de R3F-pp es 8×) — YA aplicado.
2. N8AO halfRes+performance = correcto para iGPU (README N8AO: half-Ultra > full-Performance).
3. ORDEN DE EFECTOS: Bloom+Vignette+Noise JUNTOS se fusionan en 1 pase; TiltShift2 (convolución) y SMAA AL FINAL — aplicado hoy (antes TiltShift partía la fusión).
4. Environment frames=1 resolution=128 ✓ · ContactShadows solo con frames=1 si se usara.
5. gl.transmissionResolutionScale=0.25: el pase de transmission (tarros en high) a 1/16 de píxeles — aplicado hoy.
6. glTF Blender5→three r185: clearcoat/transmission/ior/specular/anisotropy PASAN; SHEEN SE PIERDE (ponerlo por código); iridescence/dispersion solo por código.
7. Viento/plantas: shader compartido uTime + instancing, nunca useFrame por objeto (futuro).
NO existe benchmark publicado de 610M: medir en máquina siempre.
