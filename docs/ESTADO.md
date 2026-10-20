# PETRA + ERIK — ESTADO REAL DEL PROYECTO
_Última actualización: 25-ago-2026. Este fichero se lee ANTES de tocar nada._

---

## 1. QUÉ ES ESTO

Tienda de té de **Petra + Erik** (Ajdovščina, valle de Vipava, Eslovenia). Dos caras de la MISMA tienda:

| | Ruta | Estado |
|---|---|---|
| **Web clásica** | `/clasica` | ✅ **Terminada**: 15 páginas, herbario editorial, catálogo, cesta, pago demo, legal UE, 3 idiomas completos (interfaz + catálogo), auditoría 229 fallos → 0 |
| **Tienda 3D** | `/` (diorama isométrico, 7 salas) | 🔨 **En curso**: entrada terminada por SER; salón en curso |
| **Taller privado** | `/taller-privado` (clave `petra`) | ✅ Publica tés, extras y decoración → aparecen en LAS DOS webs |

Carrito (`petra-cart-v1`) e idioma (`petra-lang`) son **compartidos** entre las dos caras.

---

## 2. CÓMO SE TRABAJA (acordado con SER)

- **SER coloca, Claude construye.** SER abre cualquier sala con `?editor=1` y mueve, gira, escala, añade,
  duplica o borra piezas con el ratón. Lo que él coloca **manda sobre el código**.
- **Nunca se cambia una posición sin permiso.** Las posiciones son suyas.
- **Documentar antes de nada** y guardar en git tras cada bloque.
- **Verificar midiendo, no adivinando**: leer la escena real (posiciones, qué hay entre la cámara y el punto),
  no sacar conclusiones de una captura.
- **Un solo build por tanda** de correcciones (no uno por retoque).
- Autoría git: `SER <[correo personal retirado]>`. Permisos totales; no preguntar por cada paso.

### Comandos del día a día
```bash
cd ~/Documentos/PETRA-WEBSITE-TÉ/web
pnpm build && pnpm start -p 3111            # producción (lo que ve SER)
PETRA_GRANDE=1 python3 scripts/hp.py abrir "/salon?editor=1"   # abrir en su pantalla, modo edición
python3 scripts/verificar_todo.sh           # la puerta de cierre: todo verde o no hay 100 %
```

---

## 3. EL EDITOR VISUAL (lo que usa SER)

`?editor=1` en cualquier sala. **89 piezas** en la paleta, por categorías (Plantas y jardín · Muebles ·
Mesa y cocina · Luz · Pared · Taller · Escritorio · Decoración), con buscador.

- **Clic** selecciona · **Shift+clic** varias · **arrastrar en vacío** = recuadro de selección.
- Mandos de ratón para **mover / girar / escalar** (también varias piezas a la vez).
- **＋ Añadir pieza** → se elige y **el siguiente clic la coloca** donde se pinche.
- **Duplicar · Borrar · Deshacer/Rehacer · 💾 GUARDAR** (deja la sala tal y como se ve).
- Todo se guarda solo: `data/overrides.json` (piezas del código) y `data/catalogo-vivo.json` (piezas añadidas).
- En modo editor **nada navega**: las puertas no llevan a otra sala y el menú conserva `?editor=1`.

---

## 4. EL PROBLEMA DE FONDO QUE ESTAMOS ARREGLANDO (25-ago)

**Los ajustes de SER se identificaban por la FORMA de la pieza** («Box+Box+2#3»). Cuando Claude editaba un
componente, esa forma cambiaba y **el ajuste saltaba a otra pieza**. Consecuencias reales de hoy:
- El reloj de pie apareció en (0.85, 3.25), al otro lado de la sala.
- Reapareció un revistero que SER había borrado.
- La chimenea volvía sola a una posición vieja pese a arreglarla en el código.

**Solución en marcha**: el id pasa a ser **la posición donde nace la pieza en el código** (`@x,y,z`),
sellada la primera vez que se ve la escena y por tanto inmune a los cambios de Claude.
- `src/lib/piezas.ts` → `idEstable()`; `listarPiezas()` ya lo usa.
- `src/components/three/Overrides.tsx` sella el origen antes de aplicar nada; `?sinOverrides=1` muestra la
  escena tal cual sale del código.
- `scripts/migrar_overrides.py` migra los ajustes viejos (por id y, si no casa, **por posición**).

**Desempate**: cuando varias piezas nacen en el mismo punto (típico: `(0,0,0)`, grupos envolventes y la
propia sala), el id añade el camino en el árbol. Esto se descubrió porque un borrado de SER con id
`@0,0,0` no se aplicaba — y de haberse aplicado a la pieza equivocada **habría ocultado el salón entero**.

**Estado de la migración**:
- Salón: 36/44 migrados ✅ · **verificado en la escena: 7 de 7 eliminaciones de SER aplicadas**, 34/41
  ajustes encuentran su pieza (los 7 sueltos son enlaces viejos de piezas movidas; se limpian al re-migrar).
- Entrada: 32/73 ⚠️ — **los 73 originales están a salvo en el commit `e3028f9`**. Falta afinar el
  emparejamiento por posición (los ids de la entrada son de un formato aún más viejo, sin índice).

**Siguiente paso**: terminar la migración de la entrada ANTES de aplicar más cambios de código a las piezas.

---

## 5. LO QUE ESTÁ HECHO EN EL 3D

**Entrada (`/`)** — cerrada por SER: cartel «Petra + Erik» anclado al muro, logo P + E, pizarra eliminada,
suelo sin corte, margaritas quietas y macizos de margaritas junto al camino, catálogo vivo también aquí.

**Salón (`/salon`)** — en curso:
- Chimenea empotrada, apoyada en el suelo, con hollín, puerta de cristal y marco de hierro.
- **Fuego por shader** (`src/components/three/Fuego.tsx`): llama procedural con ruido que sube en capas
  rojo→naranja→amarillo→blanco, textura generada en canvas (sin descargas), brasas y chispas. SER: «espectacular».
- `EmberGlow`: resplandor de lumbre propio (el anterior usaba la textura del SOL, que dibuja los cuatro
  cristales de una ventana en el suelo).
- Cajas de temporada quietas · cuadro con la lámina dentro del marco · puerta de «Nosotros» a su proporción ·
  mosca eliminada · reloj restaurado desde git.

**PENDIENTE SEÑALADO POR SER (sin resolver)**
1. Un **punto naranja** dentro de la chimenea (marcado por él en una captura). Identificado como el tirador
   del cristal visto de punta y corregido, pero **SER dice que sigue viéndose**: hay que volver a mirarlo.
2. **El péndulo del reloj apenas se ve.** El cuerpo del reloj es madera maciza, así que el péndulo o queda
   por delante (se ve «fuera») o enterrado. Intentos de rediseño empeoraron y se revirtió a la versión de git.
   Falta una solución buena (hueco real bien hecho, o péndulo delante con marco que lo enmarque).

---

## 6. EL SALTO GRANDE (investigado, sin aplicar)

Cuatro informes de **ox-alpha** (opencode) en `web/informes/`, 1.556 líneas, con URLs y licencias:

| Informe | Qué trae |
|---|---|
| `2026-08-25-shaders-toda-la-tienda.md` (710 l.) | **El salto**: materiales por shader para madera, yeso, tela, loza, cristal, metal y papel; `onBeforeCompile`/CSM; texturas procedurales; luz y sombra baratas para iGPU; post-proceso seguro; vida sin mover objetos. **Condición de SER: no se toca ninguna posición.** |
| `2026-08-25-diagnostico-visual.md` (587 l.) | Herramientas para saber **al instante qué objeto es cada defecto** que señala SER (GPU picking por color, inspectores, outlines, pruebas visuales con Playwright). |
| `2026-08-25-piezas-cc0.md` (259 l.) | Modelos 3D gratis **para uso comercial** (Kenney, Quaternius, Poly Pizza, KayKit…) y cómo optimizarlos (gltf-transform, meshopt, KTX2). |
| `2026-08-25-fuego-threejs-oxalpha.md` (176 l.) | La técnica del fuego, ya aplicada con éxito. |

**Orden acordado**: (1) ids estables + migración → (2) salto grande de materiales por el TOP-10 →
(3) herramientas de diagnóstico.

---

## 7. MAPA DE FICHEROS

```
web/src/
  app/            clasica/**  ·  taller-privado/  ·  api/{catalogo,deco,overrides,editor-log,checkout,contacto}
  scenes/         IntroScene · SalonScene · TeaRoom · PremiumScene · AboutScene · ContactScene · CartScene
  components/three/
      SceneShell.tsx      marco de todas las salas (cámara, luces, Environment, Effects, Overrides, editor)
      Fuego.tsx           llama por shader + hoguera            ← NUEVO 25-ago
      EditorVivo.tsx      el editor visual de SER
      Overrides.tsx       aplica lo que SER guarda
      biblioteca.tsx      las 89 piezas de la paleta
      DecoVivo.tsx        pinta lo que se añade desde el editor/taller
      deco/{salon,tearoom,taller}.tsx   las piezas de cada sala
  lib/            piezas.ts (ids) · materials.ts (PBR procedural) · quality.ts · cart.ts · vivoStore.ts
  i18n/           es/en/sl + catalogo.ts (206 pares de traducción del catálogo)
web/scripts/      hp.py (pantalla) · ver_escena.py (el ojo) · bateria.py · test_clasica.py · i18n_check.py
                  audit_web.py · verificar_todo.sh · migrar_overrides.py
web/informes/     los 4 informes de ox-alpha + los de días anteriores
web/data/         overrides.json (ajustes de SER) · catalogo-vivo.json (lo publicado)
```

---

## 8. ERRORES YA PAGADOS (no repetir)

En `~/.claude/agents/_CEREBRO_GULEVA/antibiblioteca.md` están todos con detalle. Los que más han costado:

1. **Adivinar por captura en vez de medir la escena.** Cuatro intentos a ciegas con la chimenea; al medir, la
   causa (el fondo caía 3 cm dentro de un muro de 18 cm) apareció en 10 segundos.
2. **Los ajustes de SER pisan el código.** Si un cambio no se refleja: mirar `overrides.json` ANTES de tocar.
3. **Compilar en cada retoque.** Agrupar la tanda; iterar en dev.
4. **Tocar lo que ya funcionaba** (el reloj) y romperlo dos veces. Si no sale a la segunda:
   `git checkout HEAD -- fichero` y preguntar.
5. **Reutilizar algo por su nombre sin mirar qué dibuja** (el resplandor del fuego era una ventana).
6. **Imponer movimiento**: cartel meciéndose, margaritas al viento, cajas flotando — SER los quitó todos.
7. **Abrir ventanas en su monitor sin permiso** mientras trabaja.
