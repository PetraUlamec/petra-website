[0m
> build · deepseek-v4-flash-free
[0m
# Petra & Erik — TOP-10 ideas para una tienda de té irrepetible

**Base de cada idea:** se apoya en al menos una de tus 5 armas (el porqué real de Petra, la estación que manda, la cucharita sorpresa, procedencias con nombre, cucharas con historia) y es 100% construible con trazo SVG + tipografía + Next.js, sin una sola foto profesional.

---

## 1. La lámina se gira (el PORQUÉ como ritual táctil)

- **Qué:** En cada ficha, el porqué de cada planta vive en la "cara B" de la lámina de herbario. El anverso es la planta a trazo con su nombre latino; al girar la hoja (flip 3D), aparece la nota manuscrita de Petra: *"por qué está la melisa aquí"*, en primera persona, nunca repetida entre mezclas.
- **Por qué:** Tu conocimiento es la única ventaja incopiable. Convertirlo en un gesto físico (girar la hoja, no leerla) lo vuelve memorable y demuestra que cada texto lo escribió un humano, no un template.
- **Cómo:** Componente `HerbariumCard` con `transform-style: preserve-3d` y flip al hover/tap; los trazos SVG ya existen, solo añades anverso y reverso. Los textos salen del panel privado de Petra y se traducen ES/EN/SL.

## 2. El Reloj de la Casa (la estación que manda de verdad)

- **Qué:** Panel fijo "Reloj de la casa": estación calculada del calendario real + temperatura de Ajdovščina vía API gratuita + "hoy Petra brebaje X" + cuenta atrás al cambio de estación. Además la estación **reordena** el catálogo y las cajas (lo que está en temporada arriba), no solo cambia una frase.
- **Por qué:** La estación real es tu motor barato de renovación perpetua: cada visita es distinta sin tocar código, y un reloj que cuenta hacia la próxima estación genera anticipación y recompra.
- **Cómo:** Server Component que calcula estación por fecha y consulta Open-Meteo (gratis) para la temperatura; "qué se toma hoy" lo escribe Petra en el panel. Montado en un día.

## 3. La Entrada PE- como ticket de museo (el recibo es un objeto)

- **Qué:** El recibo deja de ser recibo: es una ENTRADA numerada `PE-V26-001` con diseño de ticket de herbario — matasellos animado, talón perforado, "válida para: el ritual de apertura de la casa de té". En la página de gracias el ticket se *estampa* (SVG). Tus compras forman una colección de entradas.
- **Por qué:** Convierte el momento más aburrido del ecommerce en el objeto que quieres conservar. El número PE- ya existe; solo falta darle forma de billete deseable.
- **Cómo:** Genera un SVG del ticket con los datos del pedido en la página de gracias y en el email; secuencia con prefijo de temporada para que coleccionar entradas sea evidente.

## 4. El Sorteo de la Cucharita (la revelación como clímax)

- **Qué:** La cucharita no aparece **nunca** en el catálogo. En la página de gracias, un saquito de lino a trazo se abre y emerge la silueta de la cucharita con: *"tu cucharita viene del [árbol] — su historia se desvela cuando abra el paquete"*. El email solo dice *"una cucharita ya viaja contigo"*.
- **Por qué:** La sorpresa anunciada pero no mostrada convierte la compra en clímax y deja una promesa pendiente que te hace esperar el paquete. Una silueta a trazo es más poderosa que cualquier foto.
- **Cómo:** Al confirmar el pago, el panel asigna la cucharita (aleatoria en demo) y la guarda en el pedido; el front anima el saquito en SVG y muestra el nombre del árbol.

## 5. El Bosque de Erik (coleccionar cucharas = coleccionar árboles)

- **Qué:** Página "Bosque de Erik": cada cuchara es un árbol a trazo con nombre propio, coordenadas reales del valle de Vipava y su historia. Los árboles cuya cuchara posees están "vivos" (hojas animadas); los demás, siluetas con candado: *"se desvela cuando la cucharita te encuentre"*. Colección completa → mezcla única de edición limitada.
- **Por qué:** El coleccionismo es el mejor motor de recompra en web y aquí tiene alma real (los árboles existen). Transforma la sorpresa de una compra en un mapa de progreso visible.
- **Cómo:** Página con bosque SVG + estado de cucharas por email (localStorage o cuenta ligera); el árbol se enciende al marcar la cucharita recibida. Datos de árboles en un JSON de Erik.

## 6. El Atlas de Procedencias (el origen con nombre propio)

- **Qué:** Mapa mundial a trazo (SVG, sin fotos) donde cada procedencia es un personaje: *"el jardín de Shanthi, Dimbula, 1.200 m, cosecha de marzo"*, con nota manuscrita de Petra y enlace a los tés que la usan.
- **Por qué:** "Ceylán" no dice nada; "el jardín de Shanthi a 1.200 m" cuenta una historia y justifica el porqué. Un mapa a trazo es más memorable que una foto de stock.
- **Cómo:** JSON de procedencias + SVG de mapa con pines animados al hover; cada ficha enlaza a su pin. El nombre propio y la cifra se mantienen iguales en los 3 idiomas, los textos se traducen.

## 7. Lo que Petra Descartó (los fracasos como prueba de oficio)

- **Qué:** Sección con mezclas que Petra probó y rechazó: *"¿Por qué no existe la X? Porque el limón la aplasta a los 3 minutos."* La lámina aparece tachada y desvaída, claramente distinta de las buenas, con un sello "DESCARTADA".
- **Por qué:** Solo quien sabe de verdad cuenta sus fracasos. Es la prueba más fuerte del arma 1 y es imposible de copiar sin tener el conocimiento real. Además genera curiosidad y enlaces desde las fichas ("¿y por qué no esto?").
- **Cómo:** Reutiliza el componente de lámina con estado "descartada" (trazo desvaído + sello SVG); un texto por mezcla escrito por Petra, enlazado desde el té similar.

## 8. El Tiempo de la Infusión como moneda (microcopy firma)

- **Qué:** Todos los umbrales y esperas se expresan en tiempo de infusión: envío gratis >50€ → *"gratis desde una infusión y media"*; el spinner → *"mientras el agua llega a 80°C"*; un `SteepTimer` real en cada ficha con el tiempo correcto del té, donde el trazo de la planta se "tiñe" mientras infunde.
- **Por qué:** La infusión es el gesto central de la marca; expresar cada espera así hace que hasta los estados de carga sean voz de marca. Es barato y se graba.
- **Cómo:** Constantes de microcopy en el i18n (ES/EN/SL) + componente `SteepTimer` SVG con animación de tinte; sustituir textos de umbrales y spinners. Solo tipografía y trazo.

## 9. El Diario de Petra (la estación contada en presente)

- **Qué:** Bloque-diario en la homepage publicado desde el panel privado: *"Hoy cosechamos la melisa antes de que bajara la burja"*, con fecha y etiqueta de estación. La web cambia con cada visita real y el contenido lo produce Petra, no un template.
- **Por qué:** Convierte la estación en presencia humana viva: vuelves porque *"¿qué habrá pasado hoy en la casa?"*. Sin fotos, el texto honesto es la foto.
- **Cómo:** Añadir un modelo "diario" al panel privado (título, texto, fecha, estación); la homepage muestra los 3 últimos y se traduce con el i18n existente.

## 10. El Ritual de Apertura en 3 correos (la compra no termina en el pago)

- **Qué:** Tras el pago, secuencia de 3 correos que despliega el ritual: **1)** "tu entrada PE-V26-001" (ticket SVG), **2)** "la cucharita eligió su árbol" (nombre e historia, sin foto), **3)** "así se abre la lámina de [té]" (el porqué en texto + trazo). Todo HTML a trazo y Fraunces/Karla, sin imágenes.
- **Por qué:** El momento memorable no debe agotarse en la página de gracias; los correos extienden la sorpresa días después y son la excusa perfecta para recompra estacional.
- **Cómo:** Un trigger de 3 emails con retraso (2h / 2 días / 4 días) usando los datos del pedido y el i18n del cliente.

---

## Orden de construcción sugerido (quick wins primero)

1. **Fase A (1-2 semanas):** #3 Entrada PE-, #8 microcopy, #1 flip de lámina — solo reutiliza lo que ya tienes.
2. **Fase B (siguiente):** #9 Diario, #2 Reloj de la Casa, #6 Atlas — contenido + una API gratis.
3. **Fase C (recompra):** #4 revelación de cucharita, #5 Bosque, #7 Descartadas, #10 emails.

**Nota de voz:** fija ya un léxico firma que se repita en las 3 lenguas — *la burja, el tiempo de la infusión, la entrada, la lámina, la cucharita* — y no los traduzcas a términos genéricos. Ese vocabulario propio es el pegamento que hace que las 10 ideas suenen a una sola marca.
