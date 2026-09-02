# PETRA WEBSITE — La visión de SER

> Documento clave del proyecto. Dictado por SER el 17-ago-2026.
> Todo lo que sigue viene de él; lo mío va marcado como **[apuesta de Claude]** o **[pregunta abierta]**.
> Nombre del proyecto: **Petra Website**.

---

## 0 · Qué es esto

Una tienda de té **de Petra y Erik**, hecha como un **diorama 3D isométrico** por el que el visitante
se mueve de habitación en habitación. No es un catálogo con fotos: es **entrar en la tienda**.

**Estilo, con las palabras de SER:**
> «Modelado 3D Isométrico de Dioramas, como una tienda de té vieja, cómoda, acogedora, **iluminada y
> no oscura**, como si fuese un sueño, e interactiva.»

Reglas de estilo que se derivan de ahí y no se negocian:
- Isométrico (cámara ortográfica, ángulo fijo por habitación).
- **Luz cálida, día, acogedor.** Nada de tienda oscura, nada de terror ni de "misterio".
- Tienda **vieja**: madera, tarros de cristal, estanterías, textura, no minimalismo frío.
- Onírico: la luz, el polvo en el aire, el vapor del té — que parezca un sueño agradable.
- Todo el sitio, **incluidas todas las subpáginas**, en ese mismo estilo. No hay una sola página "plana".

---

## 1 · Los fundadores (son el alma del sitio, no un "About us" de relleno)

| Quién | Qué hace |
|---|---|
| **PETRA** (ella) | Hace los tés y **prepara todo**. Los mixes son suyos. |
| **ERIK** (él) | **Trabaja la madera.** Hace **cucharas diminutas**, cada una a mano. |

### Las cucharas de Erik (releído a fondo, 3ª pasada — lo que pidió SER que quedara bien claro)

- Erik tiene **varias cucharas diminutas, hechas a mano por él**. Cada una es única.
- SER **sacará el 3D de ellas** — «**cada una o algunas de ellas**» — y me pasa los ficheros; o por la vía
  foto→3D (igual que tarros y otras cosas; ver §4 con mi nota honesta sobre esa vía).
- **«PARA QUE SE VEAN ALLÍ»**: las cucharas se **exponen dentro de las habitaciones del diorama** — son
  parte de la tienda, la obra de Erik a la vista, no solo un regalo escondido en la caja.
  **[apuesta de Claude]** un expositor/soporte de madera en la(s) habitación(es) donde cuelgan las cucharas
  reales; hover/clic en cada cuchara → su historia (regla de procedencia §3b: hecha a mano por Erik, su
  madera, su forma — **cada cuchara la suya**, como cada planta la suya).
- **Y además** van **dentro de las cajas de temporada: una al azar por caja** (§5.2). La «cuchara al azar»
  sale de esta colección real — lo que ves colgado en la tienda es lo que te puede tocar.

---

## 2 · Recorrido del sitio (cómo se navega)

```
INTRO  ──(tocas algo de la habitación)──►  HABITACIÓN TÉ NORMAL  ──►  HABITACIÓN TÉ PREMIUM
  │                                              │                          │
  └──────────────► HOME · ABOUT US · CONTACTO · CARRITO ◄────────────────────┘
```

- **INTRO** — lo primero al entrar. Es la puerta de la tienda / el primer cuarto.
- El paso de una habitación a otra se hace **tocando un objeto del diorama**, no con un menú clásico.
  **CONFIRMADO por SER:** habrá **además un menú discreto siempre visible** como red de seguridad —
  el objeto es el camino bonito, el menú evita que alguien se pierda y se vaya (y hace falta para que
  Google rastree las páginas y para accesibilidad).
- **HABITACIÓN DE TÉ NORMAL** — la venta de los tés normales.
- **HABITACIÓN DE TÉ PREMIUM** — subpágina propia, otra habitación, otros tarros.
- **HOME**, **ABOUT US** (Petra y Erik), **CONTACTO**, **CARRITO** — cada una su propia escena del diorama.
- El **CARRITO** es una página con su habitación/rincón propio: «el carrito de la compra que tienes dentro».
  **[apuesta de Claude sobre "que tienes DENTRO"]** — lo leo como que el carrito **vive dentro de la tienda**:
  una **cesta visible en cada habitación** (la llevas contigo). La animación de añadir al carrito **aterriza en
  esa cesta**, y clicar la cesta te lleva a la página/habitación del carrito. Así el carrito no es un icono
  flotante de web normal, sino un objeto más del diorama. **[pregunta abierta]** ¿era eso lo que querías decir?
- «**…y así y más cosas, ¿entiendes?**» — SER deja claro que la lista no es cerrada: el estilo es una
  **licencia para más microinteracciones** en ese espíritu (vapor de las tazas, polvo en la luz, objetos que
  reaccionan al ratón). Se proponen sobre la marcha, él decide.

---

## 3 · Los tarros: el corazón de la interacción

En cada habitación (Té y Té Premium) hay **varios tarros**. Cada tarro = un mix de té = un producto.

**Cadena de interacción, tal como la quiere SER:**

1. Cada tarro lleva **el nombre de su té**.
2. **Ratón encima del tarro → el tarro SE ABRE** y salen **las plantas de las que está hecho ese mix**,
   más **para qué sirve el mix**.
3. **Ratón encima (o clic) de cada planta → aparece EN QUÉ y POR QUÉ ayuda ESA planta EN ESTE MIX.**
   > Regla explícita de SER: *«si ponemos la misma descripción de las plantas en los mismos botes es
   > inútil»*. La descripción de una planta es **por mix**, no global. La manzanilla en el mix de dormir
   > no se explica igual que la manzanilla en el mix digestivo.
   [nota de Claude] Esto obliga a un modelo de datos concreto: la relación *(mix × planta)* tiene su
   propio texto. Está recogido en el borrador de datos, más abajo.
3b. **REGLA DE PROCEDENCIA (añadida por SER, 17-ago, 2ª pasada)** — la interacción de "acercar + abrir +
   contar la historia" **no es solo de los tés: es de TODOS los productos**:
   - **Tés**: al seleccionar el tarro → zoom + **se abre la tapa** → salen las plantas del mix → hover/clic
     en cada planta → **la frase de para qué ayuda EN ESTE MIX**.
   - **Queso**: de dónde es / cómo está hecho en casa.
   - **Carne/chorizo**: de dónde viene.
   - **Limonada**: **de dónde son los limones y de dónde son las frambuesas** (palabras literales de SER).
   - **Mieles**: de dónde son (la normal y la de castañas).
   Es la misma filosofía que la regla de las plantas: **cada cosa cuenta SU historia concreta**, nada de
   descripciones genéricas repetidas. → En el modelo de datos: los EXTRAS también llevan sus campos de
   procedencia/historia, no solo nombre y foto.

4. **Añadir al carrito → animación**: el producto sale del tarro y **vuela al carrito**.
5. **Y la cámara devuelve al usuario a donde estaba**: antes de clicar, la cámara se había acercado al
   tarro; después de añadir, **vuelve a la vista general de la habitación con todos los tarros**.
   El usuario nunca se queda "atrapado" en un primer plano.

---

## 4 · Los modelos 3D (quién hace qué)

**SER los saca él mismo en 3D** y me pasa el fichero: los **tarros**, las **cucharas de Erik**, y otras cosas.

Dos vías que SER ha planteado:
- **Vía A (la buena):** él modela y exporta → yo lo integro en la escena.
- **Vía B:** él **sube una foto** y quiere que la convierta en 3D y la mejore para el diseño de la habitación.

⚠️ **Honestidad sobre la Vía B (importante, no lo maquillo):** yo **no puedo generar mallas 3D ni imágenes**
a partir de una foto. Lo que sí puedo hacer, y funciona muy bien en un diorama isométrico:
1. **Recorte + billboard**: la foto se recorta, se limpia y se coloca como plano con sombra e iluminación
   integradas. En isométrico con cámara fija **es indistinguible de un modelo** en objetos pequeños
   (una cuchara, un queso, un chorizo, un tarro de miel).
2. **Servicio externo de foto→3D** (Meshy, Tripo, Rodin y similares): SER sube la foto allí, baja el `.glb`
   y me lo pasa. Yo lo optimizo, lo ilumino y lo coloco.
3. Él lo modela en **Blender** como los tarros.
Mi recomendación: **billboard para lo pequeño y perecedero** (comida), **3D real para tarros y cucharas**
(que son los que se giran, se abren y se miran de cerca).

**Formato que pido: `.glb` (glTF 2.0 binario).** Es el estándar de la web, lleva materiales y texturas dentro
en un solo fichero, y se comprime bien. Escala en **metros**, origen en la base del objeto, eje **Y arriba**.
[pregunta abierta] ¿Con qué programa los estás sacando? (Blender, otro) — para darte el ajuste de exportación exacto.

---

## 5 · Catálogo

### 5.1 Tés
- **Té normal** — los tarros de la habitación 1.
- **Té premium** — los tarros de la habitación 2.
- Cada té: nombre, plantas que lo componen, para qué sirve el mix, y el texto planta-en-este-mix.

### 5.2 Cajas por estación (dictado literal de SER, con mi lectura al lado)

| Caja | Contenido |
|---|---|
| **GENERAL — todas las estaciones** | 1 té de los normales + 1 **cuchara al azar de Erik** + 1 **queso hecho en casa** |
| **VERANO / té normal** | 1 té normal + cuchara al azar + queso + **limonada con frambuesas** |
| **INVIERNO** | 1 té normal + cuchara al azar + queso + **chorizo o algo de carne** (4-5 productos de carne como máximo, SER pasará fotos o el 3D) |
| **PRIMAVERA** | base + **miel** — [apuesta] la **normal** |
| **OTOÑO** | base + **miel** — [apuesta] la **de castañas** (la castaña es de otoño) |

**CONFIRMADO por SER (17-ago):**
- La caja **GENERAL** es la **caja base, disponible todo el año**; las de temporada son esa misma base
  **+ el extra de la estación**.
- **Primavera y otoño son DOS CAJAS DISTINTAS**, no una compartida.
- **[pequeña pregunta que queda]** ¿cuál miel va en cuál? Mi apuesta arriba: primavera = miel normal,
  otoño = miel de castañas. Si es al revés (o si las dos mieles van en las dos cajas), dilo y lo cambio.

### 5.3 Regla del +15% fuera de temporada
> *«Después de todo esto tendría guardado fuera de las estaciones y valdría 15% más de lo que costaba en la estación.»*

**Lectura:** una caja de temporada se puede seguir comprando **fuera de su estación**, pero cuesta
**+15%** sobre su precio de temporada. Es stock guardado, y se paga.
**[apuesta de Claude]** El recargo se aplica **solo** por fecha (la web sabe en qué estación está y ajusta el
precio sola), y en la ficha se ve el precio de temporada tachado y el de fuera de temporada, para que el
+15% se entienda y no parezca un error. **[pregunta abierta]** ¿Correcto?

### 5.4 Cupones
Habrá **sistema de cupones**. [apuesta de Claude] Se implementa con los **cupones nativos de Stripe**
(porcentaje o importe fijo, con caducidad y límite de usos), no con una tabla propia — así el descuento lo
valida Stripe en el pago y nadie lo puede falsear desde el navegador.

---

## 6 · Pagos y recibos

- **Tarjeta → Stripe.** **PayPal → también.** (Se configura cuando toque.)
- **El recibo le llega al cliente desde el correo de SER**, con su dominio.
- **HOY NO SE CONECTA NADA.** Palabras de SER: *«ahora sería para verlo cómo funciona y cómo es»*.
  → Fase local: la web entera funcionando, carrito, cajas, cupones y el flujo de pago **en modo prueba/simulado**.
  Dominio + Cloudflare + Stripe real vienen después.

---

## 7 · Estado y siguiente paso

- Herramientas ya instaladas y verificadas: ver `SETUP.md`.
- **Trabajamos en local.** Nada se publica.
- Pendiente: cerrar las preguntas abiertas de este documento → elegir el stack → plan por fases → primer
  diorama en pantalla.

---

## 8 · Borrador del modelo de datos (lo que obliga la regla «descripción por mix»)

No es el código final, es la forma que **tiene** que tener el dato para que la interacción del §3 funcione:

```
PLANTA        id, nombre, nombre_latín, modelo/ilustración, texto_general (breve)
TÉ (mix)      id, nombre, habitación (normal|premium), precio, tarro.glb,
              para_qué_sirve_el_mix,
              plantas: [ { planta_id, PORQUÉ_ESTÁ_EN_ESTE_MIX ← texto propio, distinto en cada té } ]
EXTRA         id, tipo (cuchara|queso|limonada|carne|miel), nombre, foto/modelo, hecho_por (Petra|Erik),
              historia/procedencia ← de dónde viene y cómo se hace (regla §3b; en la limonada,
              incluso por ingrediente: limones de X, frambuesas de Y)
CAJA          id, estación (general|verano|invierno|primavera-otoño), variante,
              precio_temporada, contenido: [extras + té], recargo_fuera_temporada = 15%
```

La clave está en la línea marcada: **el porqué de una planta vive en la relación té↔planta**, no en la planta.
Es lo que SER pidió y es lo que impide que la web sea «la misma descripción repetida en todos los botes».

---

## 9 · Decisiones ya tomadas (17-ago-2026)

| Tema | Decisión de SER | Consecuencia técnica |
|---|---|---|
| **Idiomas** | **Uno solo por ahora**, cuál se decide luego | Se construye con **estructura multi-idioma desde el día 1** (textos en ficheros de idioma, nunca escritos dentro del código) para que añadir el segundo no obligue a rehacer nada |
| **Móvil** | **El diorama completo también en móvil** | Obliga a presupuesto de rendimiento estricto: modelos ligeros, texturas comprimidas (KTX2), calidad que baja sola según el aparato, y controles táctiles. Se mide con Lighthouse desde el principio |
| **Cajas** | General = base todo el año; primavera y otoño **cajas distintas** | Ver §5.2 |
| **Navegación** | **Objetos + menú discreto siempre visible** | El menú es también lo que permite a Google rastrear el sitio |

## 10 · Preguntas abiertas que quedan → **TODAS RESUELTAS EN §11** (SER: «esto te lo puedes responder tú mismo»)

1. **Moneda y envío**: ¿€? ¿se envía solo a Eslovenia, a la UE, a España también?
2. **Cuántos tarros** por habitación, aproximadamente (¿6? ¿12? ¿20?) — cambia el diseño de la escena.
3. **Qué miel en qué caja** (primavera vs otoño) — ver §5.2.
4. **Programa 3D** que usas, para darte los ajustes de exportación a `.glb`.
5. **El +15% fuera de temporada** (§5.3): ¿automático por fecha, con el precio de temporada tachado al lado?
6. **Nombres reales de los tés** y sus plantas — cuando los tengas, aunque sea en borrador.

---

## 11 · Decisiones que tomo yo (17-ago-2026, por encargo de SER)

SER: *«esto te lo puedes responder tú mismo creo»*. Las tomo, con el porqué. **Todas revocables con una frase.**

### 1. Stack → **Next.js 15 (App Router) + React Three Fiber**
Con `drei` (ayudas de escena), `zustand` (carrito), Tailwind (el 2D: menú, fichas, checkout).
**Por qué:** es el único de los tres candidatos que sirve las páginas ya montadas desde el servidor —
un 3D puro es **invisible para Google**, y tú quieres estar indexado. Además trae rutas de servidor
para Stripe/PayPal y sus webhooks: un solo proyecto en vez de dos.
**Datos en ficheros tipados** (tés, plantas, cajas, extras). **Sin base de datos** hasta que haga falta de verdad.

### 2. Mieles → **primavera = miel normal · otoño = miel de castañas**
La miel de flores es de la floración (primavera); la castaña es el fruto del otoño. Cada caja huele a su estación.

### 3. Tarros → **8 en Té normal · 5 en Té premium**
8 llenan una estantería isométrica sin saturar la escena y dan catálogo de sobra para empezar.
5 en premium hacen que se sienta **escaso y especial**, que es lo que significa premium.
Es **dato, no código**: añadir o quitar un té es una línea en el fichero.

### 4. Programa 3D → doy por hecho **Blender**, pero el contrato de formato vale para cualquiera
| Requisito | Valor |
|---|---|
| Formato | **`.glb`** (glTF 2.0 binario, todo en un fichero) |
| Escala | **metros** (un tarro ≈ 0,12 m de alto) |
| Origen | **en la base** del objeto (para que se apoye solo en la estantería) |
| Eje | **Y arriba** (es lo que exporta glTF por defecto) |
| Triángulos | **< 25.000 por tarro** (por el móvil) |
| Texturas | **≤ 2048 px**, empaquetadas dentro del `.glb` |

**Y si te lía el formato: pásamelo en `.obj`, `.fbx`, `.stl` o `.blend` y lo convierto yo.**
No te bloquees por esto — el modelo lo haces tú, la fontanería la hago yo.

### 5. Moneda y envíos → **EUR**, dos zonas
- **Zona 1 — Eslovenia** · **Zona 2 — resto de la UE**. Tarifa plana por zona, **envío gratis desde 50 €**.
- Es el estándar de una tienda pequeña y lo cambias en un minuto cuando sepas lo que te cobra correos de verdad.
- Fuera de la UE: cerrado por ahora (aduanas y comida = problemas que no necesitas el primer día).

### 6. Carrito → **confirmo mi lectura: la cesta vive dentro de la tienda**
Una **cesta de mimbre visible en cada habitación**. La animación de añadir **aterriza en ella**.
Clic en la cesta → la página/habitación del carrito. Nada de icono flotante de web genérica:
es «el carrito de la compra que tienes **dentro**».
