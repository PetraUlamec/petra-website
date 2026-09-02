# BUGS.md — registro vivo (caza manual de Claude, 18-ago; capturas en /tmp/petra-shots/bh_*.png)

| id | dónde | qué pasa | fase | estado |
|---|---|---|---|---|
| B1 | Entrada | cortinas por FUERA de la fachada (Window compartida las pone siempre) | F4 | CERRADO 19-ago |
| B2 | Entrada | la escuadra del cartel atraviesa el alero del tejado | F4 | CERRADO 19-ago |
| B3 | Entrada | doble repisa bajo el gato (alféizar nuevo + repisa vieja) | F4 | CERRADO 19-ago |
| B5 | Sala Té | al enfocar fila alta las plantas brotan DENTRO del mueble/copete | F1 | CERRADO 18-ago |
| B6 | Sala Té | lámpara colgante flota a media altura, en zoom queda en primer plano | F1 | CERRADO 18-ago |
| B7 | Sala Té | círculo de luz duro y saturado bajo la lámpara | F1 | CERRADO 18-ago |
| B8 | Sala Té | cuerdas del cartel "Mezclas de la casa" flotan sin anclaje visible | F1 | CERRADO 18-ago |
| B18 | Sala Té | mini-tarros de la cesta asoman como tapas levitando sobre el borde | F1 | CERRADO 18-ago |
| B19 | Sala Té | cable de la lámpara larguísimo desde techo inexistente | F1 | CERRADO 18-ago |
| B24 | Premium | la araña cuelga a media altura, no del techo | F2 | CERRADO 19-ago |
| B25 | Premium | la cuerda del cordón cae torcida (postes a alturas dispares) | F2 | CERRADO 19-ago |
| B11 | Salón | estante de tazas solapa el marco derecho de la ventana | F3 | CERRADO 19-ago |
| B13 | Salón | reloj de péndulo pegado/solapando el marco de la puerta | F3 | CERRADO 19-ago |
| B14 | Salón | la caja en hover apenas se distingue (falta lift/brillo claro) | F3 | CERRADO 19-ago |
| B15 | Salón | butaca marrón toca la pata de la mesa | F3 | CERRADO 19-ago |
| B20 | Contacto | la silla parece escalera flotante (sin asiento legible, patas hilo) | F7 | CERRADO 19-ago |
| B21 | Contacto | papelera casi invisible (escala mínima) | F7 | CERRADO 19-ago |
| B23 | Contacto | chal de la percha = triángulo raro | F7 | CERRADO 19-ago |
| B28 | Taller | banco de Erik ilegible a distancia de cámara (todo demasiado pequeño) | F6 | CERRADO 19-ago |
| B17 | Global | felpudos naranja chillón en todas las puertas | F8 | CERRADO 19-ago |
| B29 | Global | etiquetas Html nunca ocluyen (se ven a través de muebles) — decidir occlude | F8 | CERRADO 19-ago |
| B30 | Global | cursor pointer puede quedarse pegado al navegar con hover activo | F8 | CERRADO 19-ago |
| — | Despensa/Recibo | caza hecha (barra anclada, ventana movida, ojo de buey ventana real, panel compacto) | F5/F8 | CERRADO 19-ago |
| B33 | Taller | herramientas de Erik hundidas en la mesa tras escalar ×1.45 | Z | CERRADO 19-ago (asentadas a y=1.13/1.11) |
| B34 | Sala Té | barra de cortina sobresalía de la pared por la esquina | Z | CERRADO 19-ago (barra 1.9) |
| B35 | Carrito | compra no navegaba a /gracias tras cablear checkout (router.push perdido tras await) | Z | CERRADO 19-ago (window.location.assign) |
| nota | intro | tejado y chimenea del salón atraviesan pared POR DISEÑO (alcove/exterior) — exentos documentados del auditor | — | anotado |

| B31 | Sala Té | el copete de la botica tapaba el tarro enfocado de la fila alta | F1 | CERRADO 18-ago (resuelto por el gesto de coger el tarro) |
| B32 | Sala Té | tarro derramado colocado sobre el copete, flotando | F1 | CERRADO 18-ago (a la mesa) |
| nota | test | los clics "estrictos" de Playwright se cuelgan en headless por software render (frames de segundos); las verificaciones usan clics JS. En GPU real no ocurre. | — | anotado |

Regla: un bug se cierra SOLO con captura después (misma vista que la captura antes).


## Día 3 tarde (19-ago) — cazados por geo2 + ojos en vivo, TODOS CERRADOS
- B36 CERRADO — cortina izq. ventana té atravesaba pared (windowX −4.0): ventana a −3.95 SIN cortinas (con cortinas no cabe en el hueco de 1.9 m junto a la botica); cenefa/sol/derrame/chispas realineados.
- B37 CERRADO — cuadro dorado premium solapaba la ventana: movido a x=−0.4.
- B38 CERRADO — «Mezclas de la casa» flotaba (drei Html no rota con la escena) y el cartel quedó sobre la puerta: WallSign con drei Text 3D + tablón ancho (w=1.75) centrado sobre la botica.
- B39 CERRADO — vapor de la tetera parecía una bola blanca sólida: volutas (esferas menores, elongadas, opacidad cuadrática).
- B40 CERRADO — TeaCrateStack ahogada entre botica/ventana/WallSpill: a la pared izquierda (−4.25, 1.65).
- B41 CERRADO — runner premium cruzaba POR DEBAJO del cordón de museo: recolocado para invitar desde la entrada y parar ante el cordón (z 0.42, l 2.6).
- B42 CERRADO — CupShelf salón dentro de la ventana: a x=−3.6 (y bajado a 2.2 para no rozar el cuadro).
- B43 CERRADO — QuillShelf contacto tocaba la cortina: a x=−0.7; DoorMat duplicado (la Door ya trae felpudo): eliminado.
- B44 CERRADO — SmallJarShelf carrito flotando a 39 cm de la pared: a x=−4.76; MilkBowl chocaba con puerta/taburete: al rincón (−4.35, 0.55); SunPatch del ojo de buey como plato amarillo: intensidad 0.18.
- B45 CERRADO — retratos de Petra/Erik hundidos en el muro y pegados al marco: x=−4.62, z=0.15/0.95.
- B46 CERRADO — compra por script no navegaba: el pago son DOS pasos (botón → confirmación DEMO); batería actualizada.
- EXENTOS POR DISEÑO (declarados en bateria.py): tejado⇄chimenea intro, farola en la calle, marquesina de la puerta, chimenea salón empotrada, DoorDrapes de la puerta oeste, peldaños de la escalera inclinada, vapor animado del taller.
