# C-3D-B («materiales+luz+post») — INFORME DE PAUSA 2 (23-ago, cierre de sesión por orden del orquestador)

## Estado en una línea
Pase 2 construido y PROBADO en pantalla (cuadrante 3): tone mapping real, micro-superficie global + dedup,
sombras de contacto genéricas, rim frío + PCF nuevo, N8AO afinado, haz de luz cableado (apagado por defecto).
`tsc` limpio. Sin commits. Queda: batería FPS 7 salas + 6 capturas finales formales + presupuesto low.

## HECHO MEDIDO (dev server: el :3112 de C-WEB — Next 16.3.1 solo permite UN dev por directorio,
## lock nativo `.next/dev/lock`, `experimental.lockDistDir`; el :3114 NUNCA pudo arrancar, no toqué next.config.ts)
| # | Tarea | Estado | Evidencia |
|---|---|---|---|
| 5a | **ToneMapping DENTRO del composer** (bug: el composer fuerza NoToneMapping) | HECHO | 3 capturas /salon: AgX apagado/gris (descartado, VISION §0), ACES quema la esquina de la ventana, **NEUTRAL** conserva crema/miel/madera y el fondo casa con la página → `TM_DEFAULT="neutral"`, exposure 1.2 (llega: WebGLRenderer.js:2709) |
| 5b | Bloom selectivo | HECHO por umbral HDR 1.1 (capturas bt=1.0/1.6/2.4 iguales: el velo de la pared es luz, no bloom). `toneMapped=false` es NO-OP con composer (documentado, no aplicado) |
| 1 | Micro-superficie global + dedup | HECHO | /te: **673 → 399 materiales únicos** (274 dedup), **10 → 356 con textura**; /salon 417 → 226; recorte ampliado: la tapa de la estantería pasa de brillo plano a moteado; 0 errores |
| 2 | Sombras de contacto | HECHO (ContactShadows, huella calculada de la escena, frames=1 + key por nº de mallas) | far 2.5→1.5→**1.2** (la mesa oscurecía toda la alfombra), opacity 0.45, blur 2.2, res 512 mid/1024 high/0 low, y=0.028. AccumulativeShadows NO probado (tiempo) |
| 3 | Rim frío + key/fill | HECHO | rim (-6,5,-6) #cfe0ff 0.5 sin sombra (no en low); key con shadow-radius 3/4, normalBias 0.02, shadow-intensity 0.85; `shadows="percentage"` (PCFSoft deprecado) |
| 4 | N8AO | HECHO | 0.6/0.6/2.6 → **0.45 / falloff 1.0 / 2.5** (captura: contactos más ceñidos, menos halo, misma luz) |
| 6 | God-rays | CABLEADO pero **apagado por defecto** (`?haz=1`): geo2 marcaba 2 solapes falsos en /contacto por el plano del haz. Propuesta a C-3D-P: que AUDIT2_JS salte `userData.intangible` (1 línea) y entonces `HAZ_POR_DEFECTO=true` |
| 7 | Presupuesto | PARCIAL: CONTACT_RES por nivel, rim off en low, haz barato. Falta medir low |

## FPS (tope 30 = refresco del HDMI 4K; todo lo medido con bateria-like por CDP)
ANTES: /salon 30.0 · /te 30.4 · /nosotros 30.4. DESPUÉS (todo activo): /salon 29.2 · /te 30.4. Sin caída medible.
Falta la tabla de 7 salas con `bateria.py shots` (PETRA_CUADRANTE=3 PETRA_BASE=http://localhost:3112).
geo2: LIMPIO en /salon /te /te-premium /nosotros /carrito; «/» solape preexistente (enredadera, de C-3D-P).

## Ficheros tocados (backups .pre-c3db.bak de los 6 de mi dominio creados)
- `src/components/three/Effects.tsx` — ToneMapping (Neutral) en el composer, bloom 1.1, N8AO parametrizado; debug ?tm ?bt ?bi ?aor ?aoi ?aof
- `src/lib/materials.ts` — `microTextures()` (rough/roughFine/bump teselables, 256 px, una vez) + fix aviso «bumpMap undefined» en sharedMaterial
- `src/components/three/Realismo.tsx` (NUEVO) — MicroSuperficie (pasada throttled 2/12/30/cada 60 frames, dedup solo fuera de subárboles con handlers R3F), SombrasContacto, HazDeLuz
- `src/components/three/SceneShell.tsx` — `<Realismo/>`, rim, PCF/radius/intensity, shadows="percentage" (conserva ExportGltf del orquestador; ya en commit bf95956)
- `src/lib/quality.ts` — CONTACT_RES
- `src/components/three/LightShaft.tsx` — raycast null + userData.intangible en el haz
- `scripts/medir_realismo.py` (NUEVO) — métricas por CDP (materiales únicos, con textura, FPS)
Capturas: /tmp/petra-hp/{antes_salon,antes_te,antes_nosotros,tm_*,bt_*,micro_te,cs_*,ao_*,haz_*}.png

## PASO EXACTO SIGUIENTE
1. `PETRA_CUADRANTE=3 PETRA_BASE=http://localhost:3112 python3 scripts/bateria.py shots` → tabla FPS 7 salas + errores.
2. Capturas DESPUÉS formales de /salon /te /nosotros (`hp.py foto despues_*`) y compararlas con antes_*.
3. Probar low (`?q=low`) y high (`?q=high`) en /te: FPS y que nada falte.
4. Pedir a C-3D-P la exención `userData.intangible` en geo2 → encender el haz (`HAZ_POR_DEFECTO=true`).
5. Opcional si hay GPU: AccumulativeShadows solo en high; LUT JS «té de tarde» (manual §2.11) por captura.
