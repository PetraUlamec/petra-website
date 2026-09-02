// ⚠️ CONTENIDO PROVISIONAL — SER sustituirá nombres, procedencias y (más adelante) fotos/modelos reales.
// REGLA DE PROCEDENCIA (VISION §3b): cada cosa cuenta SU historia concreta. Nada genérico.
import type { Extra } from "@/lib/types";
import { getVivo } from "@/lib/vivoStore";

/** Precio provisional por pieza para las cucharitas talladas de Erik. */
export const PRECIO_CUCHARA = 8;

export const EXTRAS: Extra[] = [
  // Cucharas de Erik — cada una única, talladas a mano. Se exponen en las salas y una AL AZAR va en cada caja.
  { id: "cuchara-nogal",   tipo: "cuchara", nombre: "Cucharita de nogal",   hechoPor: "Erik",
    procedencia: "Tallada de una rama caída del nogal de detrás de casa; el veteado oscuro es de ese árbol y de ningún otro." },
  { id: "cuchara-cerezo",  tipo: "cuchara", nombre: "Cucharita de cerezo",  hechoPor: "Erik",
    procedencia: "De la poda del cerezo del huerto; con el uso se irá volviendo más roja, como la fruta." },
  { id: "cuchara-arce",    tipo: "cuchara", nombre: "Cucharita de arce",    hechoPor: "Erik",
    procedencia: "Arce claro del bosque cercano; Erik la talló tan fina que la luz casi la atraviesa." },
  { id: "cuchara-olivo",   tipo: "cuchara", nombre: "Cucharita de olivo",   hechoPor: "Erik",
    procedencia: "De un olivo viejo que un amigo trajo del sur; las aguas del veteado no se repiten en ninguna otra." },
  { id: "cuchara-manzano", tipo: "cuchara", nombre: "Cucharita de manzano", hechoPor: "Erik",
    procedencia: "Del manzano que hubo que talar el invierno pasado: el árbol sigue en la mesa, cada mañana." },

  // Quesos y carnes — de casa y del valle.
  { id: "queso-casa", quedan: 8, tipo: "queso", nombre: "Queso hecho en casa", hechoPor: "Petra",
    procedencia: "Leche cruda de las vacas del vecino, cuajado en la cocina de casa y curado seis semanas en la bodega." },
  { id: "chorizo-valle", quedan: 5, estacion: "invierno", tipo: "carne", nombre: "Chorizo del valle", hechoPor: "Petra",
    procedencia: "Del carnicero del pueblo, ahumado con leña de haya; se hace solo en los meses fríos." },
  { id: "lomo-curado", quedan: 3, estacion: "invierno", tipo: "carne", nombre: "Lomo curado", hechoPor: "Petra",
    procedencia: "Curado al aire de la montaña durante todo el otoño, sin más prisa que la del clima." },

  // Limonada de verano.
  { id: "limonada-frambuesa", quedan: 12, estacion: "verano", tipo: "limonada", nombre: "Limonada con frambuesas", hechoPor: "Petra",
    procedencia: "Los limones vienen del huerto de la tía de Petra, junto al mar; las frambuesas, del borde del bosque de casa, cogidas la misma mañana." },

  // Mieles.
  { id: "miel-flores", quedan: 9, estacion: "primavera", tipo: "miel", nombre: "Miel de flores", hechoPor: "Petra",
    procedencia: "De las colmenas del prado alto, cosecha de primavera: mil flores y ninguna igual." },
  { id: "miel-castano", quedan: 7, estacion: "otono", tipo: "miel", nombre: "Miel de castaño", hechoPor: "Petra",
    procedencia: "Oscura y seria, del castañar de octubre; amarga justo lo bonito." },
  { id: "cuchara-tejo", tipo: "cuchara", nombre: "Cucharita de tejo", hechoPor: "Erik",
    procedencia: "Del tejo centenario del cementerio viejo — madera dura como pocas; Erik tardó tres tardes en domarla." },
  { id: "cuchara-fresno", tipo: "cuchara", nombre: "Cucharita de fresno", hechoPor: "Erik",
    procedencia: "Fresno del camino del río, veta recta y honesta: la cuchara que Erik regala a los amigos carpinteros." },
  { id: "cuchara-abedul", tipo: "cuchara", nombre: "Cucharita de abedul", hechoPor: "Erik",
    procedencia: "Abedul claro del norte; tan ligera que parece que va a volar — la favorita de Petra para la miel." },
  { id: "cuchara-ciruelo", tipo: "cuchara", nombre: "Cucharita de ciruelo", hechoPor: "Erik",
    procedencia: "Del ciruelo que dio las mermeladas de tres veranos; su corazón rojizo asoma en el mango." },
  { id: "queso-fresco-hierbas", tipo: "queso", nombre: "Queso fresco a las hierbas", hechoPor: "Petra",
    procedencia: "Fresco del día, rebozado en tomillo y romero del jardín — se hace cada mañana de mercado." },
  { id: "queso-curado-6m", tipo: "queso", nombre: "Queso curado 6 meses", hechoPor: "Petra",
    procedencia: "Seis meses en la bodega, volteado cada semana; la corteza sabe a cueva y a paciencia." },
  { id: "queso-azul-cueva", tipo: "queso", nombre: "Queso azul de cueva", hechoPor: "Petra",
    procedencia: "Madura en la gruta del arroyo, donde el azul lo pone la propia montaña." },
  { id: "cecina-sierra", tipo: "carne", nombre: "Cecina de la sierra", hechoPor: "Petra",
    procedencia: "Curada al viento seco de la sierra durante todo un invierno; se corta fina como el papel." },
  { id: "salchichon-caza", tipo: "carne", nombre: "Salchichón de caza", hechoPor: "Petra",
    procedencia: "De la caza de otoño del valle, con pimienta en grano molida en el mortero de casa." },
  { id: "miel-brezo", tipo: "miel", nombre: "Miel de brezo", hechoPor: "Petra",
    procedencia: "De las colmenas que suben al monte cuando el brezo rosa las colinas: oscura y con carácter." },
  { id: "miel-bosque", tipo: "miel", nombre: "Miel de bosque", hechoPor: "Petra",
    procedencia: "Mielada de roble y abeto, casi negra: la que las abejas hacen del propio bosque." },
];

export const extraById = (id: string): Extra => {
  const e = EXTRAS.find((x) => x.id === id) ?? getVivo().extras.find((x) => x.id === id);
  if (!e) throw new Error(`Extra desconocido: ${id}`);
  return e;
};
export const cucharas = () => [...EXTRAS, ...getVivo().extras].filter((e) => e.tipo === "cuchara");

/** Todos los extras: los de la casa + los publicados desde el taller. */
export const extrasVivos = (): Extra[] => [...EXTRAS, ...getVivo().extras];
