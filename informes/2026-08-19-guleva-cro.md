[0m
> build · hy3-free
[0m
# AUDITORÍA CRO — Petra & Erik (casa de té artesana)

**Método:** checklist contra patrones probados de tiendas pequeñas artesanas que venden de verdad. Desconfío de la decoración: cada elemento debe justificarse por conversión o confianza, no por estética.
**Estado auditado:** solo la descripción de la página (no acceso al código). Los hallazgos son de *qué falta* para vender, no de maquillaje visual.

---

## TOP-12 PRIORIZADO (lo que falta para vender)

### 1. Caras y voz real en "Quiénes somos" — SEÑAL DE CONFIANZA
- **Qué falta:** la página "nosotros" existe pero no hay fotos reales de Petra/Erik ni sus manos trabajando (el brief admite "sin fotos reales aún").
- **Por qué importa:** en tés artesanos el comprador compra a *personas*, no a un catálogo; sin rostro el precio alto (+15% cajas, cucharas talladas) se siente caro, no valioso.
- **Cómo:** publica 3 fotos mínimas con el móvil (Petra pesando té, Erik tallando, el tarro en la estantería) y un micro-texto en primera persona. No hace falta sesión pro: en artesanía lo imperfecto vende más.

### 2. Políticas de envío y devolución VISIBLES antes del checkout — FRICCIÓN
- **Qué falta:** el envío gratis >50€ está en la cesta, pero no se ve en catálogo ni ficha; no hay política de devolución ni de frescura del té.
- **Por qué importa:** el 70% de abandono de carrito en pequeño e-commerce viene de costes/condiciones descubiertas tarde; el té es perecedero y eso genera dudas no resueltas.
- **Cómo:** banner fijo "Envío gratis >50€ a ES/SL/EN" en header + caja colapsable "Devoluciones y frescura" en cada ficha y en el footer. Una línea basta: "Si el té llega mal, te lo cambiamos o devolvemos".

### 3. Métodos de pago mostrados como señal — CONFIANZA
- **Qué falta:** Stripe/PayPal están "preparados" pero no se anuncian con logos en ficha, cesta y footer.
- **Por qué importa:** mostrar los métodos antes de pagar reduce el miedo a dar la tarjeta en una tienda que el usuario no conoce; es la señal de confianza más barata.
- **Cómo:** fila de badges SVG (Visa/Mastercard/Stripe/PayPal/Apple Pay) en footer, cesta y paso de pago, sin texto de más.

### 4. Testimonios / opiniones reales — PRUEBA SOCIAL
- **Qué falta:** ninguna reseña de cliente en fichas ni catálogo.
- **Por qué importa:** sin prueba social, el primer comprador asume riesgo solo; con 3-5 reseñas el té "de temporada" deja de parecer experimental.
- **Cómo:** empieza con 4-5 reseñas escritas por Petra desde cuenta real de amigos/clientes beta (nombre + localidad SL/ES), con estrellas, en la ficha del té. Luego conecta un widget tipo Hyvä/Reviews.io cuando haya tráfico.

### 5. FAQ conectada a objeciones reales — CONFIANZA + SEO
- **Qué falta:** no hay FAQ.
- **Por qué importa:** responde "¿el té es bio?", "¿cuánto dura abierto?", "¿regalo envuelto?" sin que el cliente escriba; además captura tráfico de búsqueda long-tail.
- **Cómo:** FAQ de 6-8 preguntas en /faq y fragmentos insertados en fichas (acordeón). Incluye siempre: origen de las plantas, caducidad tras abrir, opción de regalo/envuelto en cinta.

### 6. Captura de email / newsletter con incentivo — RECUPERACIÓN
- **Qué falta:** no se menciona newsletter ni captura de email (solo "contacto").
- **Por qué importa:** el 98% que entra no compra hoy; sin email no hay segunda oportunidad y se pierde el embudo de temporada (cambio de caja cada estación).
- **Cómo:** pop-in de salida o barra fija: "Te avisamos cuando abra la caja de [estación] + 5% en tu primer tarro". Doble opt-in y guarda en tu panel privado o en un CSV exportable a Mailchimp/Brevo.

### 7. Urgencia honesta por temporada y stock — CIERRE
- **Qué falta:** las cajas de estación son +15% fuera de temporada, pero no se comunica *cuándo* cierra cada caja ni stock real.
- **Por qué importa:** la urgencia falsa quema marca; la honesta (cantidad limitada de cada cosecha, cierre de caja de invierno el 21/mar) acelera la compra sin mentir.
- **Cómo:** en cada caja de estación: "Edición limitada — quedan X / cierra el DD/MM". En fichas de té de cosecha corta, etiqueta "Últimas unidades" solo cuando el stock sea <10.

### 8. SEO on-page y schema.org — TRÁFICO GRATIS
- **Qué falta:** títulos, meta description por idioma, `og:image`, y `Product`/`Offer` JSON-LD no mencionados.
- **Por qué importa:** sin schema, Google no muestra precio/valoración en resultado y pierdes clics; sin `og:image` el contenido compartido en IG/FB muere.
- **Cómo:** por cada ficha generar `JSON-LD` con `name`, `image` (la lámina SVG o tarro), `offers`(price, currency, availability) y `aggregateRating` si hay reseñas. `og:image` = composición de la lámina de herbario + nombre. Usa `next/head` por ruta/i18n.

### 9. Rendimiento percibido (SVG, fuentes, blur) — VELOCIDAD
- **Qué falta:** láminas SVG a trazo + efecto blur→nítido + fuentes Fraunces/Karla pesadas; riesgo de LCP/FCP lento en móvil.
- **Por qué importa:** en móvil (donde compra el 80% en alimentación) >3s de carga = pérdida directa de venta; lo "bonito" no compensa lo lento.
- **Cómo:** `font-display: swap` + subset de Fraunces solo para titulares; las láminas SVG inline o con `loading="lazy"`; el blur del tarro usa `next/image` blurDataURL (ya lo tienes conceptualmente) para no bloquear el render.

### 10. Accesibilidad (contraste, foco, i18n) — ALCANCE + LEGAL
- **Qué falta:** paleta lino/miel/madera/granate puede fallar contraste; no se cita navegación por teclado ni `alt` en láminas ni `lang` correcto por idioma.
- **Por qué importa:** bajo contraste mata la legibilidad en serif pequeña; mal `alt`/i18n hunde SEO y excluye usuarios (y en UE roza obligación de accesibilidad).
- **Cómo:** verifica contraste AA (texto >=4.5:1) con la miel sobre lino; añade `alt` descriptivo a cada lámina ("Lamium album, dibujo de herbario"); `lang="es|en|sl"` en `<html>` y foco visible en filtros y cesta.

### 11. Reducción de fricción en el checkout — CONVERSIÓN
- **Qué falta:** flujo de pago descrito solo como "demo Stripe/PayPal preparado"; no se cita guest checkout ni autocompletado de dirección.
- **Por qué importa:** exigir cuenta para comprar es la causa #1 de abandono en tiendas pequeñas; cada paso extra mata conversión.
- **Cómo:** permitir compra como invitado, auto-detectar país (ES/SL/EN) para IVA y envío, y mostrar el desglose (subtotal, envío gratis si >50€, total) en una sola pantalla antes de Stripe.

### 12. El "momento cucharita sorpresa" como motor de boca-oreja — RETENCIÓN
- **Qué falta:** la cucharita revelada solo al comprar es buena idea pero no se usa para generar UGC ni repetir compra.
- **Por qué importa:** lo inesperado se fotografía y se comparte; si no lo invitas, ese activo de marketing se pierde en silencio dentro del paquete.
- **Cómo:** en el recibo (ENTRADA PE-1234) añade "¿Qué cucharita te tocó? Cuéntanoslo en IG @petraerik con #MiCucharita" y, en la siguiente temporada, email recordando "tu caja de otoño espera".

---

## QUICK-WINS (primero esto, <1 semana, sin código nuevo)

| # | Acción | Esfuerzo | Impacto |
|---|--------|----------|---------|
| 2 | Banner "Envío gratis >50€" + política en footer | bajo | alto |
| 3 | Badges de pago en footer/cesta | bajo | alto |
| 6 | Barra de captura email + 5% | bajo | medio-alto |
| 7 | "Quedan X / cierra el DD/MM" en cajas | bajo | medio |
| 1 | 3 fotos con móvil en "nosotros" | bajo | alto |

## RIESGO PRINCIPAL (lo que más te frena hoy)
Sin **caras**, **políticas visibles** y **métodos de pago anunciados**, el precio premium (cajas +15%, cucharas talladas) se percibe como riesgo, no como valor. Resuelve los items 1-3-4 antes de cualquier otra cosa; lo demás es optimización sobre una base que aún no cierra la venta.

---
*Auditoría de investigación. No se han creado ni modificado ficheros del sistema; esta es la salida stdout solicitada.*
