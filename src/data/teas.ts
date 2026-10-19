// ⚠️ CONTENIDO PROVISIONAL inventado por Claude (18-ago-2026) — sustituir por los mixes reales de Petra.
// REGLA (VISION §3): cada planta lleva su porqué EN ESTE MIX — nunca la misma frase en dos tarros.
import type { Tea } from "@/lib/types";
import { getVivo } from "@/lib/vivoStore";

export const TEAS: Tea[] = [
  // ── SALA DE TÉ NORMAL (8 tarros) ─────────────────────────────
  {
    id: "sueno-del-bosque", nombre: "Sueño del Bosque", sala: "te",
    precio: 7.5, gramos: 60, colorHoja: "#C9B36A",
    paraQueSirve: "Para la última hora del día: afloja el cuerpo y apaga el ruido de la cabeza antes de dormir.",
    plantas: [
      { plantaId: "manzanilla", porQueEnEsteMix: "Aquí es la base que calma el estómago nervioso de antes de acostarse, para que el cuerpo deje de pedir atención." },
      { plantaId: "tila",       porQueEnEsteMix: "Suaviza el pulso acelerado del final del día; es la que hace que el sueño llegue sin pelear." },
      { plantaId: "lavanda",    porQueEnEsteMix: "Una pizca solo por su aroma: le dice a la cabeza que ya no hay nada más que resolver hoy." },
      { plantaId: "melisa",     porQueEnEsteMix: "Redondea el sabor y desata el nudo del pecho cuando el día ha sido largo." },
    ],
  },
  {
    id: "manana-clara", nombre: "Mañana Clara", sala: "te",
    precio: 7, gramos: 60, colorHoja: "#9DB56B",
    paraQueSirve: "El despertar sin café: despeja y pone en marcha sin acelerar de golpe.",
    plantas: [
      { plantaId: "menta",       porQueEnEsteMix: "Es la bofetada amable de la mañana: abre la respiración y espabila desde el primer sorbo." },
      { plantaId: "romero",      porQueEnEsteMix: "En este mix está para la memoria de primera hora, cuando la cabeza aún arranca en frío." },
      { plantaId: "hierbaluisa", porQueEnEsteMix: "Pone el toque de limón que hace la mezcla fresca en vez de amarga." },
    ],
  },
  {
    id: "estomago-contento", nombre: "Estómago Contento", sala: "te",
    precio: 7.5, gramos: 60, colorHoja: "#C4B54F",
    paraQueSirve: "Después de comer mucho o comer tarde: ayuda a digerir y deshincha.",
    plantas: [
      { plantaId: "hinojo",     porQueEnEsteMix: "El que trabaja de verdad contra la hinchazón después del plato grande; por eso lleva la mayor parte." },
      { plantaId: "anis",       porQueEnEsteMix: "Acompaña al hinojo y endulza el trago sin azúcar: la sobremesa se hace amable." },
      { plantaId: "menta",      porQueEnEsteMix: "Aquí no despierta: refresca la boca y asienta el estómago pesado." },
      { plantaId: "manzanilla", porQueEnEsteMix: "En este mix va de escolta: calma el ardor cuando la comida fue más abundante que la prudencia." },
    ],
  },
  {
    id: "garganta-de-invierno", nombre: "Garganta de Invierno", sala: "te",
    precio: 8, gramos: 60, colorHoja: "#B4713C",
    paraQueSirve: "Para los días de frío, voz rasposa y nariz cerrada.",
    plantas: [
      { plantaId: "tomillo",    porQueEnEsteMix: "El guardián del pecho: aquí está por la tos y por esa garganta que raspa al hablar." },
      { plantaId: "jengibre",   porQueEnEsteMix: "Enciende el fuego por dentro; en este mix su picor es el abrigo." },
      { plantaId: "escaramujo", porQueEnEsteMix: "La vitamina del rosal silvestre: refuerza justo cuando el cuerpo anda defendiéndose." },
      { plantaId: "regaliz",    porQueEnEsteMix: "Endulza y suaviza la garganta irritada; es la capa de miel de esta mezcla, sin miel." },
    ],
  },
  {
    id: "tarde-en-calma", nombre: "Tarde en Calma", sala: "te",
    precio: 7, gramos: 60, colorHoja: "#A8BF86",
    paraQueSirve: "Para la ansiedad pequeña de media tarde: seguir con el día, pero más ligero.",
    plantas: [
      { plantaId: "melisa",  porQueEnEsteMix: "Aquí es la protagonista: baja el runrún sin dar sueño, que aún queda día por delante." },
      { plantaId: "azahar",  porQueEnEsteMix: "El azahar pone la parte de consuelo: huele a que todo va a salir bien." },
      { plantaId: "salvia",  porQueEnEsteMix: "Sostiene el ánimo parejo y evita que la calma se vuelva modorra." },
    ],
  },
  {
    id: "monte-limpio", nombre: "Monte Limpio", sala: "te",
    precio: 7.5, gramos: 60, colorHoja: "#6F8F5A",
    paraQueSirve: "Depurativo de temporada: para cuando el cuerpo pide un barrido.",
    plantas: [
      { plantaId: "ortiga",      porQueEnEsteMix: "La escoba del mix: aquí va por su fama de limpiar por dentro y remineralizar." },
      { plantaId: "colacaballo", porQueEnEsteMix: "Acompaña a la ortiga tirando del agua que sobra; juntas hacen el barrido completo." },
      { plantaId: "menta",       porQueEnEsteMix: "En esta mezcla es puro sabor: sin ella, el barrido sabría a campo mojado." },
    ],
  },
  {
    id: "abrazo-de-frutas", nombre: "Abrazo de Frutas", sala: "te",
    precio: 8, gramos: 70, colorHoja: "#B5533C",
    paraQueSirve: "El té de los que no querían té: afrutado, rojizo, gusta a los niños y a las visitas.",
    plantas: [
      { plantaId: "escaramujo", porQueEnEsteMix: "Aquí pone el cuerpo y el color rojizo del vaso; es la fruta de esta taza." },
      { plantaId: "frambuesa",  porQueEnEsteMix: "La hoja del frambueso da el fondo verde que evita el empalago." },
      { plantaId: "rosa",       porQueEnEsteMix: "Los pétalos son la sonrisa del tarro: perfuman y lo hacen bonito al abrirlo." },
      { plantaId: "canela",     porQueEnEsteMix: "Media vuelta de canela para que la fruta sepa a tarta y no a zumo." },
    ],
  },
  {
    id: "respiro-de-sauco", nombre: "Respiro de Saúco", sala: "te",
    precio: 7.5, gramos: 60, colorHoja: "#D8CFA8",
    paraQueSirve: "Para primaveras de estornudos y narices que gotean.",
    plantas: [
      { plantaId: "saúco",      porQueEnEsteMix: "La flor de saúco es aquí la llave: la de siempre para los resfriados de primavera." },
      { plantaId: "escaramujo", porQueEnEsteMix: "En este mix apoya las defensas mientras el saúco hace su trabajo." },
      { plantaId: "hierbaluisa",porQueEnEsteMix: "Su limón fresco despeja la nariz por el aroma antes que el trago." },
    ],
  },

  // ── SALA DE TÉ PREMIUM (5 tarros) ─────────────────────────────
  {
    id: "oro-de-otono", nombre: "Oro de Otoño", sala: "te-premium",
    precio: 14, gramos: 80, colorHoja: "#C0862F",
    paraQueSirve: "La reserva de la casa: rooibos y especias nobles, la taza de las ocasiones.",
    plantas: [
      { plantaId: "rooibos",   porQueEnEsteMix: "El rooibos sudafricano es la seda de este mix: cuerpo dulce y ni gota de teína." },
      { plantaId: "cardamomo", porQueEnEsteMix: "Machacado a mano al envasar: aquí es el lujo que se huele antes de abrir el agua." },
      { plantaId: "canela",    porQueEnEsteMix: "Canela de Ceilán en rama, no molida: en esta mezcla manda la elegancia, no el dulzor." },
      { plantaId: "calendula", porQueEnEsteMix: "Sus pétalos naranjas son el oro visible del nombre: se sirven en la taza." },
    ],
  },
  {
    id: "jardin-de-petra", nombre: "El Jardín de Petra", sala: "te-premium",
    precio: 15, gramos: 70, colorHoja: "#C97C8E",
    paraQueSirve: "El mix con el que empezó todo: flores del jardín de casa, en pequeñas cosechas numeradas.",
    plantas: [
      { plantaId: "rosa",     porQueEnEsteMix: "Las rosas son del rosal que plantó la abuela de Petra: cada pétalo se seca a la sombra, nunca al sol." },
      { plantaId: "lavanda",  porQueEnEsteMix: "La lavanda de la entrada de casa: aquí no ayuda a dormir, ayuda a recordar." },
      { plantaId: "melisa",   porQueEnEsteMix: "Crece sola junto al pozo; es la frescura que evita que el jardín empalague." },
      { plantaId: "calendula",porQueEnEsteMix: "La caléndula guarda el color del verano para las tazas de enero." },
    ],
  },
  {
    id: "raiz-y-fuego", nombre: "Raíz y Fuego", sala: "te-premium",
    precio: 13.5, gramos: 80, colorHoja: "#A65A2E",
    paraQueSirve: "El chai de la casa: raíces y especias para los que quieren una taza con carácter.",
    plantas: [
      { plantaId: "jengibre",  porQueEnEsteMix: "Aquí el jengibre no abriga: MANDA. Cortado grueso para que el fuego dure toda la taza." },
      { plantaId: "canela",    porQueEnEsteMix: "En este mix es leña del fuego del jengibre, no perfume." },
      { plantaId: "cardamomo", porQueEnEsteMix: "El contrapunto verde que impide que el fuego queme: orden dentro del carácter." },
      { plantaId: "regaliz",   porQueEnEsteMix: "El final dulce de cada sorbo, para que el fuego despida bien." },
    ],
  },
  {
    id: "niebla-blanca", nombre: "Niebla Blanca", sala: "te-premium",
    precio: 16, gramos: 50, colorHoja: "#E4DDC4",
    paraQueSirve: "El más delicado de la casa: flores pálidas para beber despacio y en silencio.",
    plantas: [
      { plantaId: "azahar", porQueEnEsteMix: "El azahar es la niebla del nombre: se recoge al amanecer, cuando aún no pesa el sol." },
      { plantaId: "saúco",  porQueEnEsteMix: "Aquí el saúco no cura resfriados: pone la nota de pera blanca que sostiene al azahar." },
      { plantaId: "tila",   porQueEnEsteMix: "La tila da el fondo sedoso; es el silencio de esta taza." },
    ],
  },
  {
    id: "vispera-de-fiesta", nombre: "Víspera de Fiesta", sala: "te-premium",
    precio: 14.5, gramos: 70, colorHoja: "#B04A56",
    paraQueSirve: "Para regalar: el tarro que se abre en la mesa y hace ooh.",
    plantas: [
      { plantaId: "escaramujo", porQueEnEsteMix: "El rojo profundo de la infusión: en la mesa parece vino especiado." },
      { plantaId: "rosa",       porQueEnEsteMix: "Pétalos enteros, no rotos: este tarro se compra tanto por los ojos como por la taza." },
      { plantaId: "canela",     porQueEnEsteMix: "El aroma de fiesta al levantar la tapa: es la primera impresión del regalo." },
      { plantaId: "jengibre",   porQueEnEsteMix: "Un fondo picante muy leve, el secreto que hace preguntar «¿qué lleva?»." },
    ],
  },
  {
    id: "rubi-de-hibisco", nombre: "Rubí de Hibisco", sala: "te",
    precio: 7.5, gramos: 60, colorHoja: "#a8283c",
    paraQueSirve: "Rojo intenso y ácido fresquito: frío en verano es la joya de la jarra.",
    plantas: [
      { plantaId: "hibisco", porQueEnEsteMix: "El hibisco pone el rubí: color, acidez y frescura — es el alma entera de esta jarra." },
      { plantaId: "naranjaseca", porQueEnEsteMix: "La naranja seca redondea el ácido del hibisco con su dulzor tostado." },
      { plantaId: "menta", porQueEnEsteMix: "Aquí la menta es el hielo: el final fresco que pide el verano." },
    ],
  },
  {
    id: "prado-azul", nombre: "Prado Azul", sala: "te",
    precio: 8, gramos: 60, colorHoja: "#7c94b8",
    paraQueSirve: "Para las tardes de leer junto a la ventana: florecillas azules y calma.",
    plantas: [
      { plantaId: "aciano", porQueEnEsteMix: "El aciano pinta el prado de azul en la taza — y suaviza los ojos cansados de leer." },
      { plantaId: "malva", porQueEnEsteMix: "La malva es el terciopelo de este prado: suaviza garganta y ánimo." },
      { plantaId: "melisa", porQueEnEsteMix: "La melisa pone la brisa: sin ella el prado sería solo bonito, no tranquilo." },
    ],
  },
  {
    id: "manzana-del-horno", nombre: "Manzana del Horno", sala: "te",
    precio: 7.5, gramos: 70, colorHoja: "#b98a4e",
    paraQueSirve: "Sabe a tarta de manzana recién hecha: el té de las meriendas de domingo.",
    plantas: [
      { plantaId: "manzanaseca", porQueEnEsteMix: "La manzana seca es la tarta: dulzor de fruta asada sin una pizca de azúcar." },
      { plantaId: "canela", porQueEnEsteMix: "Aquí la canela es la del horno de casa: la que huele a domingo por la tarde." },
      { plantaId: "escaramujo", porQueEnEsteMix: "El escaramujo pone el puntito ácido que evita el empalago de la tarta." },
    ],
  },
  {
    id: "bosque-de-invierno", nombre: "Bosque de Invierno", sala: "te",
    precio: 8, gramos: 60, colorHoja: "#4a6a55",
    paraQueSirve: "Un paseo por el bosque nevado: resina, frescor y abrigo.",
    plantas: [
      { plantaId: "abeto", porQueEnEsteMix: "Los brotes de abeto son el bosque mismo: resina fresca que abre el pecho." },
      { plantaId: "eucalipto", porQueEnEsteMix: "El eucalipto despeja la nariz helada del paseo — es la bufanda de este mix." },
      { plantaId: "jengibre", porQueEnEsteMix: "El jengibre es la lumbre esperando en casa al volver del bosque." },
    ],
  },
  {
    id: "noche-de-reyes", nombre: "Noche de Reyes", sala: "te-premium",
    precio: 15.5, gramos: 70, colorHoja: "#4a3a5f",
    paraQueSirve: "La reserva más rara de la casa: jengibre negro tailandés y especias de leyenda.",
    plantas: [
      { plantaId: "jengibrenegro", porQueEnEsteMix: "El jengibre negro es la joya oscura: raro, profundo, casi misterioso — solo va en este tarro." },
      { plantaId: "cardamomo", porQueEnEsteMix: "El cardamomo escolta al rey oscuro con su perfume verde." },
      { plantaId: "curcuma", porQueEnEsteMix: "La cúrcuma dora la taza: el oro de los reyes en el fondo." },
      { plantaId: "canela", porQueEnEsteMix: "La canela une la comitiva: sin ella cada especia iría por su lado." },
    ],
  },
  {
    id: "colina-de-brezo", nombre: "Colina de Brezo", sala: "te-premium",
    precio: 14, gramos: 60, colorHoja: "#b87f9e",
    paraQueSirve: "Las colinas rosadas del norte en flor: delicado, silvestre, para beber despacio.",
    plantas: [
      { plantaId: "brezo", porQueEnEsteMix: "El brezo es la colina entera: se cosecha a mano cuando rosa el monte." },
      { plantaId: "hiperico", porQueEnEsteMix: "El hipérico trae el sol que dora esas colinas — la alegría del mix." },
      { plantaId: "verbena", porQueEnEsteMix: "La verbena pone el atardecer: cierra el sorbo con calma lila." },
    ],
  },
];

export const teaById = (id: string): Tea => {
  const t = getVivo().teas.find((x) => x.id === id) ?? TEAS.find((x) => x.id === id);
  if (!t) throw new Error(`Té desconocido: ${id}`);
  return t;
};
export const todasLasTeas = () => Array.from(new Map([...TEAS, ...getVivo().teas].map((tea) => [tea.id, tea])).values());
export const teasBySala = (sala: Tea["sala"]) => todasLasTeas().filter((tea) => tea.sala === sala);
