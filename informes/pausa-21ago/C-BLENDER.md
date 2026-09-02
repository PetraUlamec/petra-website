# C-BLENDER — estado al cierre (23-ago-2026 10:12) · segundo auditor de colocación (Blender)

## Encargo (íntegro, para retomar sin el brief)
Objetivo real de SER: «mapear dónde está cada cosa con Blender, usarlo AL COMPLETO sin fallas y documentarlo» →
segundo auditor INDEPENDIENTE del de trimesh (`scripts/ver_escena.py mapa/apoyo`) para CRUZAR resultados.
Dominio: `scripts/exportar_escena.py` (NUEVO), `scripts/auditar_en_blender.py` (NUEVO), `scripts/cruzar_auditores.py` (NUEVO),
`web/.audit/**`, y como mucho `src/components/three/ExportGltf.tsx`. PROHIBIDO todo lo demás de src/, ver_escena.py, bateria.py. Sin commits.
Máquina: ventana al CUADRANTE 1 (`PETRA_CUADRANTE=1 PETRA_CDP=9338 PETRA_BASE=http://localhost:3115 python3 scripts/hp.py abrir "/?gltf=1"`),
dev server propio :3115. Nunca fullscreen/pkill/scrot. No tocar :3111-3114 ni 9333-9337.
Tareas: 1 exportar_escena.py · 2 auditar_en_blender.py · 3 EXAMEN SORPRESA 5 cubos en 4.4.3 y 5.1.1 · 4 las 7 salas ·
5 cruzar_auditores.py · 6 sección «USO REAL» al final de `informes/2026-08-23-blender-mapeo-escena.md`.

## Estado de las tareas
| # | Tarea | Estado |
|---|---|---|
| 0 | Leer doctrina, antibiblioteca (1-40 + 21-ago), manual del explorador ENTERO (352 líneas), ver_escena.py, hp.py, ExportGltf.tsx | HECHO |
| 0b | Dev server :3115 | A MEDIAS (ver «Bloqueo») — ya CERRADO (fuser -k 3115/tcp) |
| 1 | exportar_escena.py | NO EMPEZADO (diseño abajo) |
| 2 | auditar_en_blender.py | NO EMPEZADO (diseño abajo) |
| 3 | Examen sorpresa 5 cubos | NO HECHO |
| 4 | 7 salas | NO HECHO |
| 5 | cruzar_auditores.py | NO HECHO |
| 6 | Sección USO REAL en el informe | NO HECHO |
Ficheros creados en el repo: NINGUNO. `web/.audit/` no existe aún. Ventana hp nunca abierta (9338 libre).

## Bloqueo encontrado (medido) y cómo se sale
- `pnpm dev -p 3115` en el repo FALLA: Next 16.3.1 tiene CANDADO de un solo `next dev` por directorio
  («Another next dev server is already running… PID 271409 :3112», lock en `.next/dev/lock`).
- C-3D-P lo esquiva con un ESPEJO en el scratchpad (`scratchpad/web-c3dp`): COPIA de src/public/scripts, `node_modules` ENLAZADO,
  y `next.config.ts` con `turbopack: { root: "/" }`.
- Yo monté `scratchpad/web-blender` con `src`, `public`, `data`, `node_modules` como SYMLINKS (para auditar siempre el repo vivo) +
  mismo next.config. El server arranca (Ready 1.6 s) pero `GET /?gltf=1` → **404** (compila `/_not-found`): con `src` enlazado
  Turbopack no ve las rutas de `src/app`. PROBABLE: hay que COPIAR `src` (como C-3D-P) y re-sincronizar antes de cada export
  (`rsync -a --delete $W/src/ $M/src/`), o symlink solo dentro (`src/app` real y resto enlazado) — no probado.
  Scratchpad de esta sesión: `/tmp/claude-1000/-home-ser/01c81c96-3b82-459f-b66c-5e6218cf582a/scratchpad/` (muere con /tmp: rehacer si no está).

## Hechos medidos en esta sesión (no repetir)
- Blender 4.4.3 = `/usr/local/bin/blender`; 5.1.1 = `flatpak run org.blender.Blender` (no ve /tmp: GLB bajo /home = `web/.audit/`).
- playwright 2.3.5 / numpy / trimesh 5.0.0 disponibles en python3 del sistema.
- Importador glTF (4.4.3, `blender/imp/vnode.py` L108-109 y `node.py` L86-87, `mesh.py` L39): nodo SIN nombre → objeto `Node_<idx glTF>`
  (Empty) o nombre de la malla `Mesh_<idx>`; el importador inserta un DummyRoot que NO crea objeto. Los duplicados llevan `.001`.
- `ver_escena.py` agrupa PIEZAS así (EXTRACT_JS): grupo MÁS ALTO (Group u Object3D, con hijos) cuya caja tenga diagonal < 4.2 y
  contenga ≥1 malla → pieza; mallas no asignadas → pieza suelta. Nombre = `o.name` o, sin nombre, firma de geometrías
  `Box+Box+Box+2` (3 primeras + cuenta del resto, en orden de traverse). Caja = AABB de las 8 ESQUINAS del boundingBox local
  transformadas a mundo (NO AABB de vértices: difiere en piezas giradas). Etiqueta `nom(cx,cy,cz)` a 2 decimales.
  Tolerancias de `apoyo`: hueco OK ≤ 2.5 cm, hundida OK ≤ 2.5 cm, EMPOTRADA > 30 cm; exenciones PARED/COLGADA/ANIM/EXENTO.
  Muros = cajas ≥7 largo, ≥3 alto, <1 grueso; suelo = plano <0.1 alto y área >20. `mapa` usa penetración umbral 5 mm.
- ExportGltf.tsx (bf95956) ya expone `window.__exportGLB()` (base64) y `window.__gltfReady`; `onlyVisible:true, trs:true`.

## DISEÑO decidido (ahorra pensar al retomar)
1. **Retoque ExportGltf.tsx** (único src permitido): antes de `parseAsync`, `scene.traverse` y etiquetar `userData.nid` (orden de
   traverse), en mallas `userData.geo = geometry.type.replace("Geometry","")` y `userData.trans = transparent && opacity<0.6`,
   `userData.vis` (visible con ancestros). Si el userData previo no es JSON-serializable, sustituirlo temporalmente por `{}` y
   RESTAURAR en `finally` (el exporter salta TODO el userData si `JSON.stringify` falla). Exportar con `onlyVisible:false` y
   filtrar por `vis` en Blender (así cruza 1:1 con ver_escena, que cuenta mallas invisibles). Luego `pnpm exec tsc --noEmit`.
2. **exportar_escena.py `<ruta> [--cdp 9338] [--base …]`**: `connect_over_cdp` (como `ver_escena.conecta`), goto `ruta?gltf=1`,
   esperar `window.__gltfReady` y nº de mallas (`__scene.traverse isMesh`) ESTABLE en 2 lecturas (1.5 s) hasta 60 s, `__exportGLB()`,
   guardar `web/.audit/escena_<ruta sin barras>.glb` (`/`→`escena_root.glb`, `/te-premium`→`escena_te-premium.glb`). Leer cabecera
   GLB (magic `glTF`, chunk0 JSON) → imprimir bytes, nodos, mallas.
3. **auditar_en_blender.py** (`blender -b --factory-startup --python … -- --glb X --out Y [--tol-flota 0.005 --tol-pen 0.005]`):
   `read_factory_settings(use_empty=True)`; import con kwargs filtrados por `get_rna_type().properties`
   (`import_scene_as_collection=False` solo si existe); LEER el JSON del GLB en Python para jerarquía/orden/nombres/extras
   (nid→nodo) y enlazar con `obj["nid"]` → reproducir la agrupación de ver_escena EXACTA (diag<4.2 sobre caja de esquinas de
   `bound_box`, Empty con hijos). Por malla: bmesh→`bm.transform(matrix_world)`→`remove_doubles(1e-6)`→`BVHTree.FromBMesh`;
   `cerrada = ningún e.is_boundary`. Saltar mallas sin caras (Points/Line) como hace ver_escena (isMesh).
   APOYO: vértices a <3 mm del min z (máx 64), origen +1 mm, rayo (0,0,-1) contra árboles de OTRAS piezas → gap/sobre;
   HUNDIDO: rayo (0,0,+1) desde v−0.5 mm; si la primera cara tocada tiene normal.z>0 (saliendo de un cuerpo CERRADO) →
   profundidad = d−0.5 mm. Muros/suelo (criterio ver_escena) no se auditan como sujetos pero sí son objetivos.
   CHOQUES: pares de piezas (saltar ancestro/descendiente y animadas por nombre humo/chispa/polilla/polvo/vapor/dust/sparkle o
   `trans`) → prefiltro AABB (tol 5 mm) → `overlap` por par de mallas → si 0 pares, CONTENCIÓN por paridad de rayos (dir
   (0.37,0.21,0.9) y una 2ª dirección; si discrepan, 3ª) sobre centroide + vértices; profundidad = máx `find_nearest` de puntos
   (vértices+centroides de caras, dentro del AABB del otro) que estén dentro del cuerpo cerrado; si ninguno cerrado → `sin_veredicto`.
   FUERA: límites por muros (cara interior) si los hay; si no, bbox del suelo mayor («/»); si nada, ±5. INCLINACIÓN: ángulo de
   `matrix_world.to_3x3()@(0,0,1)` de la raíz vs Z (>2°). ESCALA: familia = prefijo del nombre; diag AABB; mediana/MAD (≥3 miembros,
   >3·MAD y >5 %). Salida JSON en coords THREE `(Bx, Bz, −By)` con `bbox` (vértices) y `bbox_esquinas` (estilo ver_escena) +
   tabla stdout `pieza · minY · apoyo · veredicto · choques`. Modo `--examen <glb>`: genera con bpy suelo + A apoyado, B flotando
   3 cm, C hundido 3 cm, D⇄E cruzados 5 cm, F dentro de G (`export_scene.gltf` con `export_extras=True`), audita y comprueba 5/5.
   Ejecutar en 4.4.3 (`auditoria_<ruta>.json`) y 5.1.1 (`auditoria_<ruta>.51.json`) y diff.
4. **cruzar_auditores.py `<ruta>`**: corre `PETRA_CDP=9338 PETRA_BASE=… ver_escena.py mapa` y `apoyo` (o lee salidas cacheadas
   en `.audit/trimesh_<ruta>.txt`), parsea `nom c(x,y,z) minY ver` y los choques `⚠ a ⇄ b: … cm`, casa por (nom, centro ±3 cm)
   con mi JSON; imprime coincidencias / solo-Blender / solo-trimesh con números de cada uno y explica discrepancias por
   BANDA de tolerancia (5 mm mío vs 2.5 cm trimesh), agrupación (caja esquinas vs vértices), animadas, mallas abiertas.
5. Informe: sección «USO REAL — cómo se ejecuta y qué salió» al final de `informes/2026-08-23-blender-mapeo-escena.md`.

## PASO EXACTO SIGUIENTE
1. Rehacer espejo `scratchpad/web-blender` COPIANDO `src` (rsync) + symlinks public/node_modules/data + next.config turbopack root "/";
   `nohup pnpm dev -p 3115` desde el espejo; `curl /?gltf=1` debe dar 200 (antes de nada: si C-3D-P ha cambiado src, el rsync lo trae).
2. Retoque ExportGltf.tsx (backup `ExportGltf.tsx.pre-cblender.bak`) + `pnpm exec tsc --noEmit`.
3. Escribir auditar_en_blender.py y pasar PRIMERO el examen `--examen` en 4.4.3 y 5.1.1 (pegar salida). Luego exportar+auditar las 7
   salas, cruzar, documentar. Al acabar: `PETRA_CDP=9338 python3 scripts/hp.py cerrar` y `fuser -k 3115/tcp`.
