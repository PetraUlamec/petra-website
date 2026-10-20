export type BotanicalProfile = { kind: string; detail: string };
export type BotanicalMark = { d: string; fill: string; stroke: string; width: number; transform?: string };
export const VISUAL_PROFILES: Record<string, BotanicalProfile> = {};
function register(kind: string, names: string, prefix = "herbario-") {
  for (const detail of names.split("|")) VISUAL_PROFILES[prefix + detail] = { kind, detail };
}
register("flower", "manzanilla|calendula|azahar|jazmin|amapola|aciano|hiperico|malva", "");
register("leaf", "melisa|menta|salvia|ortiga|hierbaluisa|frambuesa|laurel|eucalipto", "");
register("spike", "lavanda|verbena|brezo", "");
register("umbel", "hinojo|anis|saúco|milenrama", "");
register("twig", "tomillo|romero|abeto|colacaballo", "");
register("linden", "tila", "");
register("root", "regaliz", "");
register("rhizome", "jengibre|curcuma|jengibrenegro", "");
register("rosehip", "escaramujo", "");
register("cinnamon", "canela", "");
register("cardamom", "cardamomo", "");
register("petals", "rosa", "");
register("hibiscus", "hibisco", "");
register("citrus", "naranjaseca", "");
register("apple", "manzanaseca", "");
register("tea", "rooibos", "");
register("tea", "te-negro-assam|te-negro-darjeeling|te-negro-de-ceilan|te-negro-keemun|te-negro-de-yunnan|te-negro-de-kenia|te-negro-de-nepal|lapsang-souchong|te-negro-descafeinado|pu-erh-shou|pu-erh-sheng|sencha|bancha|gyokuro|long-jing|mao-feng-verde|chun-mee|gunpowder-verde|perlas-de-jazmin|hojicha|kukicha|te-blanco-bai-mu-dan|te-blanco-silver-needle|te-blanco-shou-mei|oolong-tie-guan-yin|oolong-dong-ding|oolong-da-hong-pao|oolong-oriental-beauty|te-amarillo|rooibos-verde|honeybush|yerba-mate|yerba-mate-tostada");
register("powder", "matcha|curcuma-en-polvo");
register("fruit", "mango-deshidratado|pina-deshidratada|papaya-deshidratada|melocoton-deshidratado|albaricoque-deshidratado|pera-deshidratada|higo-seco|datil-troceado|ciruela-deshidratada|melon-deshidratado|guayaba-deshidratada|guanabana-deshidratada|maracuya-deshidratado|lichi-deshidratado|gajos-de-manzana");
register("banana", "platano-deshidratado");
register("kiwi", "kiwi-deshidratado");
register("berry", "cereza-deshidratada|guinda-deshidratada|uvas-pasas|arandano-azul|arandano-rojo|grosella-negra|grosella-roja|grosella-blanca|uva-espina|aronia|pimienta-rosa");
register("aggregate", "frambuesa-deshidratada|mora-deshidratada|mora-de-morera-blanca");
register("strawberry", "fresa-en-laminas|fresa-silvestre");
register("goji", "bayas-de-goji");
register("arils", "granada-deshidratada");
register("peel", "piel-de-limon|piel-de-naranja|piel-de-mandarina|piel-de-lima|piel-de-pomelo|piel-de-bergamota|piel-de-yuzu");
register("citrus", "limon-en-rodajas|lima-en-rodajas|mandarina-en-rodajas|pomelo-en-rodajas|kumquat-en-rodajas");
register("rosebud", "capullos-de-rosa");
register("petals", "petalos-de-cartamo|petalos-de-girasol|petalos-de-peonia|petalos-de-melocotonero|petalos-de-violeta");
register("flower", "osmanthus|crisantemo");
register("blade", "hierba-limon|hoja-de-pandan");
register("leaf", "hoja-de-zarzamora|hierbabuena|menta-de-manzana|albahaca|tulsi|hoja-de-limonero|hoja-de-grosellero-negro|hoja-de-fresa");
register("root", "raiz-de-achicoria-tostada|raiz-de-diente-de-leon");
register("rhizome", "galanga");
register("ginger-slice", "jengibre-en-rodajas");
register("star", "anis-estrellado");
register("clove", "clavo-de-olor");
register("pepper", "pimienta-negra|pimienta-blanca|pimienta-de-jamaica|semillas-de-cilantro");
register("vanilla", "vainilla-en-vaina");
register("nutmeg", "nuez-moscada");
register("mace", "macis");
register("seed", "semillas-de-hinojo|semillas-de-anis-verde|alcaravea|semillas-de-cardamomo");
register("shards", "nibs-de-cacao|cascara-de-cacao|coco-en-laminas|algarroba-troceada|almendra-laminada|avellana-troceada|pistacho-troceado");
register("grain", "arroz-tostado|cebada-tostada");
register("buckwheat", "trigo-sarraceno-tostado");

const ALIASES: Record<string, string> = {
  "studio-limon": "herbario-piel-de-limon", "studio-naranja": "herbario-piel-de-naranja",
  "studio-manzana": "manzanaseca", "studio-fresa": "herbario-fresa-en-laminas",
  "studio-arandano": "herbario-arandano-azul", "studio-jengibre": "jengibre",
  "studio-canela": "canela", "studio-menta": "herbario-hierbabuena",
  "studio-hibisco": "hibisco", "studio-hinojo": "herbario-semillas-de-hinojo",
};
export function visualProfile(id: string) { return VISUAL_PROFILES[ALIASES[id] || id]; }
export const VISUAL_ALIASES = ALIASES;

function randomFor(value: string) {
  let seed = 2166136261;
  for (const letter of value) seed = Math.imul(seed ^ letter.charCodeAt(0), 16777619);
  return () => { seed = Math.imul(seed ^ seed >>> 15, 2246822519); return (seed >>> 0) / 4294967296; };
}

export function botanicalArt(id: string, color: string, secondary: string): BotanicalMark[] | null {
  const profile = visualProfile(id);
  if (!profile) return null;
  const { kind, detail } = profile;
  const random = randomFor(detail);
  const marks: BotanicalMark[] = [];
  const ink = "#62523c", green = "#698052", cream = "#f6e8c5";
  const path = (d: string, fill = "none", stroke = ink, width = 0.9, transform?: string) => marks.push({ d, fill, stroke, width, transform });
  const ellipse = (horizontal: number, vertical: number, radiusX: number, radiusY: number, fill: string, angle = 0, stroke = ink, width = 0.9) => path(
    `M${horizontal - radiusX} ${vertical}a${radiusX} ${radiusY} 0 1 0 ${radiusX * 2} 0a${radiusX} ${radiusY} 0 1 0 ${-radiusX * 2} 0Z`,
    fill, stroke, width, angle ? `rotate(${angle} ${horizontal} ${vertical})` : undefined);
  const stem = (d = "M50 89Q53 62 49 27") => path(d, "none", green, 1.8);
  const leaf = (horizontal: number, vertical: number, width: number, length: number, angle: number, serrated: boolean, fill = color) => {
    const outline: string[] = ["M0 0"];
    for (const side of [1, -1]) for (let step = 1; step <= 16; step++) {
      const fraction = side === 1 ? step / 16 : 1 - step / 16;
      const edge = Math.sin(Math.PI * fraction) * width * (serrated && step % 2 ? 0.80 : 1);
      outline.push(`L${side * edge} ${-fraction * length}`);
    }
    const transform = `translate(${horizontal} ${vertical}) rotate(${angle})`;
    path(outline.join(" ") + "Z", fill, ink, 0.75, transform);
    path(`M0 0Q2 ${-length / 2} 0 ${-length}`, "none", cream, 0.8, transform);
    for (let vein = 1; vein < 5; vein++) {
      const height = length * vein / 6;
      const span = Math.sin(Math.PI * vein / 6) * width * 0.78;
      path(`M${-span} ${-height - length / 8}L0 ${-height}L${span} ${-height - length / 8}`, "none", secondary, 0.6, transform);
    }
  };
  const radialFlower = (horizontal: number, vertical: number, petals: number, radius: number, narrow: boolean, fill: string, center = "#d9ad49") => {
    for (let petal = 0; petal < petals; petal++) {
      const angle = petal * 360 / petals;
      const petalWidth = narrow ? radius * 0.21 : radius * 0.58;
      path(`M0 1Q${-petalWidth} ${-radius * 0.35} ${-petalWidth * 0.6} ${-radius * 0.82}Q0 ${-radius * 1.14} ${petalWidth * 0.6} ${-radius * 0.82}Q${petalWidth} ${-radius * 0.35} 0 1Z`, fill, ink, 0.65, `translate(${horizontal} ${vertical}) rotate(${angle})`);
    }
    ellipse(horizontal, vertical, radius * 0.24, radius * 0.21, center, 0, ink, 0.6);
  };
  const seedDots = (horizontal: number, vertical: number, count: number, radiusX: number, radiusY: number, fill = "#4d3f30") => {
    for (let index = 0; index < count; index++) {
      const angle = index * Math.PI * 2 / count;
      ellipse(horizontal + Math.cos(angle) * radiusX, vertical + Math.sin(angle) * radiusY, 1.1, 1.8, fill, angle * 180 / Math.PI, fill, 0);
    }
  };
  if (kind === "leaf") {
    const narrow = /hierbaluisa|laurel|eucalipto/.test(detail);
    const compound = /frambuesa|zarzamora|hoja-de-fresa/.test(detail);
    const smooth = /laurel|eucalipto|limonero|albahaca|salvia/.test(detail);
    stem();
    if (detail === "hoja-de-grosellero-negro") {
      path("M50 79L28 72L32 62L14 50L29 45L24 26L41 34L50 12L60 34L77 26L72 45L88 51L69 63L73 73Z", color);
      path("M50 87V20M50 70L29 34M50 70L74 34M50 73L22 51M50 73L79 51", "none", cream, 1.1);
    } else if (detail === "melisa") {
      path("M49 70C13 57 12 24 31 24Q42 22 49 37Q63 12 77 27C91 49 66 65 49 70Z", color);
      path("M49 74V35M49 59L29 42M49 59L70 40M49 48L35 32M49 48L64 29", "none", cream, 1);
      leaf(50, 84, 10, 28, -70, true);
    } else {
      const width = narrow ? 6 : detail === "albahaca" || detail === "menta-de-manzana" ? 15 : detail === "ortiga" ? 13 : detail === "hoja-de-fresa" ? 12 : detail === "hoja-de-limonero" ? 9 : 11;
      leaf(50, 65, width, compound ? 38 : 46, 0, !smooth);
      leaf(50, compound ? 76 : 80, width * 0.85, compound ? 37 : 29, -54, !smooth, secondary);
      leaf(50, compound ? 76 : 68, width * 0.85, compound ? 37 : 29, 54, !smooth);
      if (detail === "hoja-de-zarzamora") {
        leaf(50, 82, 8, 26, -92, true, secondary);
        leaf(50, 82, 8, 26, 92, true);
      }
      if (detail === "salvia") for (let row = 0; row < 7; row++) path(`M43 ${28 + row * 4}q7 -4 14 0`, "none", secondary, 0.8);
      if (detail === "tulsi") radialFlower(51, 18, 5, 5, false, "#b48eaa");
    }
  } else if (kind === "flower") {
    stem("M49 88Q56 61 48 36");
    leaf(51, 77, 6, 25, 52, detail === "manzanilla", green);
    const petals = detail === "amapola" || detail === "osmanthus" ? 4 : /azahar|jazmin|hiperico|malva/.test(detail) ? 5 : detail === "crisantemo" ? 28 : detail === "calendula" ? 20 : detail === "aciano" ? 12 : 14;
    radialFlower(48, 37, petals, 25, petals > 6 || detail === "jazmin", color, detail === "amapola" ? "#44333b" : detail === "aciano" ? "#5e568d" : "#d9ad49");
    if (detail === "malva") for (let petal = 0; petal < 5; petal++) path("M0 -6L-3 -19M0 -6L3 -19", "none", "#92517d", 0.8, `translate(48 37) rotate(${petal * 72})`);
    if (detail === "aciano") for (let petal = 0; petal < 12; petal++) path("M-3 -20L-5 -27L0 -24L4 -28L3 -20Z", color, ink, 0.6, `translate(48 37) rotate(${petal * 30})`);
    if (detail === "hiperico") seedDots(48, 37, 17, 10, 10, "#b98423");
    if (detail === "osmanthus") { radialFlower(70, 65, 4, 10, false, color); radialFlower(30, 66, 4, 8, false, color); }
  } else if (kind === "linden") {
    stem("M50 89L56 46M56 61L72 75M56 59L67 53");
    path("M44 73C14 61 13 36 29 34Q39 31 44 44Q57 27 66 43Q73 58 44 73Z", "#76915b");
    path("M44 77V43M44 64L28 47M44 63L60 46", "none", cream, 1);
    leaf(57, 60, 5, 46, 25, false, "#bbbe7d");
    radialFlower(73, 76, 5, 7, false, cream); radialFlower(68, 55, 5, 6, false, cream);
  } else if (kind === "spike" || kind === "umbel" || kind === "twig") {
    stem();
    if (kind === "spike") {
      const count = detail === "verbena" ? 7 : 12;
      for (let index = 0; index < count; index++) {
        const vertical = 18 + index * 3.9, side = index % 2 ? 1 : -1;
        if (detail === "brezo") {
          stem(`M50 ${vertical + 8}L${50 + side * 17} ${vertical + 4}`);
          path("M-4 -4Q-8 3 -4 6L4 6Q8 3 4 -4Z", color, ink, 0.7, `translate(${50 + side * 17} ${vertical})`);
        } else ellipse(49 + side * (detail === "verbena" ? 3 : 5), vertical, detail === "verbena" ? 2 : 4, 3, color, side * 35);
      }
      leaf(51, 81, 3, 28, -38, false, green); leaf(51, 73, 3, 26, 38, false, green);
    } else if (kind === "umbel") {
      for (let branch = 0; branch < 7; branch++) {
        const horizontal = 20 + branch * 10, vertical = 25 + Math.abs(branch - 3) * 2;
        stem(`M50 60L${horizontal} ${vertical}`);
        radialFlower(horizontal, vertical, 5, detail === "milenrama" ? 5 : 3.5, false, color);
        if (detail !== "milenrama") for (const side of [-1, 1]) ellipse(horizontal + side * 3, vertical - 4, 1.8, 1.8, color);
      }
      for (let index = 0; index < 6; index++) stem(`M50 ${80 - index * 3}l${index % 2 ? 12 : -12} -9`);
    } else {
      for (let index = 0; index < 8; index++) {
        const vertical = 29 + index * 7;
        if (detail === "colacaballo") {
          path(`M46 ${vertical}h8`, "none", "#446848", 2.8);
          stem(`M50 ${vertical}l-15 -8M50 ${vertical}l15 -8`);
        } else for (const side of [-1, 1]) leaf(50, vertical, detail === "tomillo" ? 3.5 : 1.6, detail === "tomillo" ? 10 : detail === "abeto" ? 16 : 20, side * (detail === "abeto" ? 69 : 42), false, detail === "tomillo" ? green : color);
      }
      if (detail === "tomillo") for (const vertical of [25, 39, 53]) radialFlower(58, vertical, 5, 3, false, color);
    }
  } else if (kind === "tea") {
    const rolled = /gunpowder|perlas|tie-guan|dong-ding/.test(detail);
    const needle = /sencha|gyokuro|kukicha|silver-needle|rooibos|honeybush/.test(detail);
    const chopped = /mate|kenia/.test(detail);
    const count = rolled ? 8 : needle ? 15 : chopped ? 18 : 9;
    for (let index = 0; index < count; index++) {
      const horizontal = 22 + random() * 55, vertical = 23 + random() * 54, angle = random() * 150 - 75;
      const fill = index % 3 ? color : secondary;
      const transform = `translate(${horizontal} ${vertical}) rotate(${angle})`;
      if (rolled) {
        ellipse(horizontal, vertical, 7, 6.5, fill);
        path("M-4 2Q-6 -4 1 -4Q6 -1 2 3L-2 1", "none", cream, 0.6, transform);
      } else if (needle) {
        path("M-1 11Q-3 0 0 -12Q4 -2 2 10Z", fill, ink, 0.5, transform);
        path("M0 8L0 -8", "none", cream, 0.5, transform);
      } else if (chopped) {
        path("M-5 -5L4 -6L6 2L0 5L-5 2Z", fill, ink, 0.6, transform);
      } else {
        const flat = /long-jing|bancha|bai-mu|amarillo/.test(detail);
        path(flat ? "M0 -13Q10 -5 3 11L0 14Q-8 4 0 -13Z" : "M-3 -13Q10 -8 3 1Q-3 7 3 12Q-12 10 -7 0Q-1 -5 -3 -13Z", fill, ink, 0.7, transform);
        path("M0 -9Q4 0 -1 8", "none", cream, 0.6, transform);
      }
    }
  } else if (["citrus", "kiwi", "banana", "apple", "ginger-slice"].includes(kind)) {
    const citrus = kind === "citrus", oval = /kumquat|limon/.test(detail);
    for (const [horizontal, vertical, radius] of [[36, 39, 24], [62, 64, 25]]) {
      ellipse(horizontal, vertical, radius * (oval ? 0.8 : 1), radius, citrus ? secondary : kind === "kiwi" ? "#8c7654" : secondary);
      ellipse(horizontal, vertical, radius * (oval ? 0.72 : 0.9), radius * 0.9, kind === "banana" ? "#efdb9b" : kind === "ginger-slice" ? "#ebd59e" : color, 0, cream, 1.3);
      if (citrus) {
        for (let segment = 0; segment < 9; segment++) {
          const angle = segment * Math.PI * 2 / 9;
          path(`M${horizontal} ${vertical}L${horizontal + Math.cos(angle) * radius * (oval ? 0.70 : 0.85)} ${vertical + Math.sin(angle) * radius * 0.85}`, "none", cream, 1.4);
        }
        ellipse(horizontal, vertical, 3, 3, cream, 0, cream, 0);
      } else if (kind === "kiwi") {
        ellipse(horizontal, vertical, 7, 11, "#f1e5bd", 0, cream, 0);
        seedDots(horizontal, vertical, 18, 12, 16);
      } else if (kind === "banana") {
        for (let ray = 0; ray < 3; ray++) path("M0 0L-3 -7L3 -7Z", "#aa804b", "#aa804b", 0.5, `translate(${horizontal} ${vertical}) rotate(${ray * 120})`);
      } else if (kind === "apple") {
        seedDots(horizontal, vertical, 5, 5, 5, "#865935");
        for (let ray = 0; ray < 5; ray++) path("M0 0L-4 -7L0 -11L4 -7Z", cream, "#bca170", 0.5, `translate(${horizontal} ${vertical}) rotate(${ray * 72})`);
      } else {
        for (let fiber = 0; fiber < 7; fiber++) path(`M${horizontal - 13} ${vertical - 12 + fiber * 4}q12 -4 26 0`, "none", "#c4a778", 0.7);
      }
    }
  } else if (kind === "peel") {
    const thick = /pomelo|yuzu/.test(detail), shift = random() * 6;
    path(`M18 30Q48 ${16 + shift} 80 34L71 55Q42 35 22 48Z`, cream, ink, 1);
    path(`M18 30Q48 ${16 + shift} 80 34L77 ${thick ? 45 : 40}Q44 26 21 39Z`, color);
    path("M26 65Q48 51 77 63L70 86Q47 68 31 80Z", cream);
    path("M26 65Q48 51 77 63L75 71Q47 59 28 72Z", color);
    for (let dot = 0; dot < 28; dot++) ellipse(26 + random() * 43, dot < 14 ? 29 + random() * 5 : 63 + random() * 5, 0.6, 0.6, secondary, 0, secondary, 0);
  } else if (kind === "strawberry") {
    path("M49 83C36 76 12 45 27 28Q39 19 49 29Q65 15 77 31C87 49 63 75 49 83Z", color);
    if (detail === "fresa-en-laminas") path("M49 73Q33 49 37 35Q48 43 62 33Q66 50 49 73Z", "#edb4a2", cream, 0.8);
    else {
      path("M50 31L29 23L42 22L43 12L52 21L64 14L61 25L77 26L58 33Z", green);
      stem("M50 25Q46 15 53 10");
    }
    for (let row = 0; row < 4; row++) for (const side of [-1, 1]) ellipse(49 + side * (17 - row * 3.5), 39 + row * 9, 1.1, 2.2, "#f4d28a", side * 25, "#a96142", 0.4);
  } else if (kind === "berry" || kind === "rosehip" || kind === "goji" || kind === "pepper") {
    const currant = /grosella/.test(detail), dried = /pasas|deshidratada|goji/.test(detail);
    const count = currant ? 8 : kind === "pepper" ? 7 : kind === "goji" ? 5 : 3;
    if (currant) stem("M45 17Q63 41 47 82");
    for (let index = 0; index < count; index++) {
      const horizontal = currant ? 48 + (index % 2 ? 12 : -8) : 29 + (index % 3) * 22;
      const vertical = currant ? 27 + index * 7 : 39 + Math.floor(index / 3) * 23 + (index % 2) * 8;
      const radius = kind === "pepper" ? 8 : currant ? 7 : 12;
      ellipse(horizontal, vertical, kind === "goji" ? 6 : radius, kind === "goji" || kind === "rosehip" ? 17 : radius, color, kind === "goji" ? -25 + index * 11 : 0);
      if (dried || kind === "pepper" || detail === "uva-espina") {
        for (let rib = 0; rib < 3; rib++) path(`M${horizontal - 5 + rib * 4} ${vertical - radius + 3}q-4 7 0 ${radius * 2 - 6}`, "none", secondary, 0.7);
      } else path(`M${horizontal - 4} ${vertical - 6}l2 3l3 -3l1 4l3 0l-4 3l-4 -2Z`, secondary, ink, 0.6);
      if (kind === "rosehip") path(`M${horizontal - 5} ${vertical - 15}l-4 -8l7 5l4 -7l1 9l6 -4l-4 8Z`, "#7a643e");
      if (/cereza|guinda/.test(detail)) stem(`M${horizontal} ${vertical - 10}q2 -14 11 -21`);
      if (!dried) ellipse(horizontal - radius * 0.35, vertical - radius * 0.25, 2, 3, cream, 25, cream, 0);
    }
  } else if (kind === "aggregate") {
    const mulberry = detail.includes("morera"), blackberry = detail.startsWith("mora-") && !mulberry;
    const rows = mulberry ? 7 : blackberry ? 5 : 4;
    for (let row = 0; row < rows; row++) for (let column = 0; column < (mulberry ? 3 : 5 - Math.floor(row / 2)); column++) {
      ellipse(33 + column * 10 + (row % 2) * 4, 27 + row * 8, 6.5, 6, row % 3 ? color : mulberry ? "#b6a376" : blackberry ? "#514056" : "#a74f64", 0, ink, 0.7);
    }
    if (!blackberry && !mulberry) ellipse(52, 23, 13, 5, "#793b4b");
    else stem("M49 26Q54 14 66 17");
  } else if (kind === "arils") {
    for (let index = 0; index < 7; index++) {
      const horizontal = 22 + index % 3 * 24, vertical = 24 + Math.floor(index / 3) * 22;
      path("M-7 -6L4 -8Q12 -4 8 7Q1 13 -7 6Z", color, ink, 0.8, `translate(${horizontal} ${vertical}) rotate(${index * 23})`);
      ellipse(horizontal, vertical, 2.5, 4, "#e7adad", 30, "#e7adad", 0);
    }
  } else if (kind === "root" || kind === "rhizome") {
    if (kind === "root") {
      path("M41 17Q50 13 58 21L53 58L39 86L43 54Z", color);
      for (let branch = 0; branch < 6; branch++) {
        const vertical = 29 + branch * 8, side = branch % 2 ? 1 : -1;
        path(`M49 ${vertical}q${side * 18} 5 ${side * 22} 18`, "none", secondary, 1.8);
        path(`M43 ${vertical}l12 3`, "none", secondary, 0.9);
      }
      ellipse(49, 19, 9, 4, cream);
      if (detail === "raiz-de-achicoria-tostada") path("M65 68L79 62L87 78L73 85Z", "#805337");
    } else {
      path("M18 57Q12 46 27 41L37 41L35 24Q37 14 47 20L51 37L61 34L65 21Q71 15 78 23L75 43Q87 50 78 61L61 60L54 72Q42 79 37 68L33 59Z", color);
      for (let ring = 0; ring < 5; ring++) path(`M${26 + ring * 10} 43q-6 7 0 14`, "none", secondary, 1);
      const flesh = detail === "curcuma" ? "#e39b26" : detail === "jengibrenegro" ? "#796184" : detail === "galanga" ? "#eee0c5" : "#efdaa2";
      ellipse(70, 76, 15, 11, color); ellipse(70, 76, 12, 8, flesh, 0, secondary, 0.8);
      for (let fiber = 0; fiber < 5; fiber++) path(`M${62 + fiber * 4} 71l-2 10`, "none", secondary, 0.5);
    }
  } else if (kind === "blade") {
    for (const angle of [-24, 0, 24]) {
      path("M-3 0Q-12 -31 0 -72Q7 -36 4 0Z", color, ink, 0.8, `translate(50 88) rotate(${angle})`);
      path("M0 0V-61", "none", cream, 0.8, `translate(50 88) rotate(${angle})`);
    }
    if (detail === "hierba-limon") { ellipse(49, 82, 8, 5, cream); ellipse(70, 78, 8, 6, cream); ellipse(70, 78, 4, 3, secondary); }
  } else if (kind === "cinnamon" || kind === "vanilla") {
    for (let index = 0; index < 2; index++) {
      const transform = `translate(${36 + index * 23} 51) rotate(${index ? 22 : -16})`;
      path(kind === "vanilla" ? "M-3 36Q-9 -6 2 -36L5 -39Q1 -9 4 33Z" : "M-8 -30Q0 -36 8 -30L8 30Q0 36 -8 30Z", color, ink, 1, transform);
      path(kind === "vanilla" ? "M0 30Q-4 0 3 -31" : "M-4 -27V28M3 -28V28", "none", secondary, 1, transform);
      if (kind === "cinnamon") path("M-8 -30C-8 -38 9 -38 8 -30C7 -24 -5 -25 -4 -30Q-3 -34 3 -31", "none", "#5e3d2a", 1.5, transform);
    }
  } else if (kind === "cardamom" || kind === "seed" || kind === "grain" || kind === "buckwheat" || kind === "nutmeg") {
    const large = kind === "cardamom" || kind === "nutmeg";
    const count = large ? 3 : 9;
    for (let index = 0; index < count; index++) {
      const horizontal = large ? 29 + index * 21 : 24 + index % 3 * 23 + random() * 4;
      const vertical = large ? 43 + index % 2 * 23 : 27 + Math.floor(index / 3) * 23;
      const transform = `translate(${horizontal} ${vertical}) rotate(${-30 + random() * 60})`;
      if (kind === "buckwheat") path("M0 -9L-9 7L9 5ZM0 -9L1 3L-9 7M1 3L9 5", color, secondary, 1, transform);
      else {
        const radiusX = large ? 10 : kind === "grain" ? 4 : detail === "semillas-de-cardamomo" ? 4 : 3;
        const radiusY = large ? 17 : detail === "alcaravea" ? 10 : detail === "semillas-de-anis-verde" ? 6 : 8;
        path(`M0 ${-radiusY}Q${-radiusX * 2} ${-radiusY / 2} ${-radiusX} ${radiusY / 2}Q0 ${radiusY * 1.4} ${radiusX} ${radiusY / 2}Q${radiusX * 2} ${-radiusY / 2} 0 ${-radiusY}Z`, color, ink, 0.8, transform);
        for (const side of large ? [-1, 0, 1] : [0]) path(`M${side * radiusX / 2} ${-radiusY * 0.8}Q${side * radiusX} 0 ${side * radiusX / 2} ${radiusY * 0.8}`, "none", secondary, 0.8, transform);
        if (kind === "nutmeg") for (let ridge = 0; ridge < 7; ridge++) path(`M-7 ${-11 + ridge * 4}q4 -3 8 0t5 0`, "none", "#77523c", 0.7, transform);
      }
    }
  } else if (kind === "star") {
    for (let point = 0; point < 8; point++) {
      const transform = `translate(50 50) rotate(${point * 45})`;
      path("M0 3Q-13 -7 0 -35Q13 -7 0 3Z", color, ink, 1, transform);
      path("M0 -4Q-5 -13 0 -25Q5 -13 0 -4Z", "#5f3c27", ink, 0.6, transform);
      ellipse(50 + Math.sin(point * Math.PI / 4) * 16, 50 - Math.cos(point * Math.PI / 4) * 16, 2.7, 4, "#b99155", point * 45);
    }
  } else if (kind === "clove") {
    for (let index = 0; index < 3; index++) {
      const transform = `translate(${28 + index * 22} ${50 + index % 2 * 12}) rotate(${-25 + index * 25})`;
      path("M-2 24L-5 -14L-10 -20L10 -20L5 -14L2 24Z", color, ink, 1, transform);
      path("M-7 -20Q-10 -33 0 -34Q10 -33 7 -20Z", secondary, ink, 1, transform);
    }
  } else if (kind === "mace") {
    for (let strip = 0; strip < 7; strip++) {
      const horizontal = 25 + strip * 8;
      path(`M${horizontal} 77Q${horizontal - 14} 50 ${horizontal + 4} 24L${horizontal + 7} 20Q${horizontal - 6} 51 ${horizontal + 6} 75Z`, color);
    }
    path("M23 75Q48 85 80 73M29 52Q51 64 75 48", "none", secondary, 2.8);
  } else if (kind === "rosebud" || kind === "hibiscus" || kind === "petals") {
    if (kind === "rosebud") {
      for (const [horizontal, vertical, angle] of [[35, 42, -17], [64, 65, 22]]) {
        ellipse(horizontal, vertical, 13, 19, color, angle);
        path("M-9 5Q-9 -23 5 -16Q-4 -2 9 7M-3 18Q6 0 10 -9", "none", "#995269", 1.3, `translate(${horizontal} ${vertical}) rotate(${angle})`);
        path("M-12 6L-4 23L0 15L5 23L13 3L4 12L0 4L-4 12Z", green, ink, 0.7, `translate(${horizontal} ${vertical}) rotate(${angle})`);
      }
    } else if (kind === "hibiscus") {
      ellipse(50, 65, 18, 16, color);
      for (const angle of [-60, -30, 0, 30, 60]) leaf(50, 72, 9, 49, angle, false, color);
    } else {
      const thin = /girasol|cartamo/.test(detail), count = thin ? 9 : 4;
      for (let index = 0; index < count; index++) {
        const horizontal = 23 + index % 3 * 25 + random() * 6, vertical = 30 + Math.floor(index / 3) * 20;
        const transform = `translate(${horizontal} ${vertical}) rotate(${-35 + random() * 70})`;
        path(thin ? "M0 15Q-8 -5 -1 -18Q6 -13 3 1Z" : "M0 18Q-24 -1 -12 -12Q-5 -18 0 -9Q9 -20 16 -8Q22 4 0 18Z", color, ink, 0.7, transform);
        path("M0 13Q-3 2 2 -7", "none", secondary, 0.8, transform);
      }
    }
  } else if (kind === "powder") {
    path("M14 76Q29 66 39 42Q49 29 63 51Q74 69 88 76Q50 90 14 76Z", color);
    for (let dot = 0; dot < 55; dot++) {
      const horizontal = 22 + random() * 55, vertical = 65 + random() * 12;
      ellipse(horizontal, vertical, 0.5 + random(), 0.6, secondary, 0, secondary, 0);
    }
  } else if (kind === "shards") {
    for (let index = 0; index < 5; index++) {
      const horizontal = 25 + index % 3 * 24, vertical = 35 + Math.floor(index / 3) * 29;
      const transform = `translate(${horizontal} ${vertical}) rotate(${-30 + index * 21})`;
      if (detail === "almendra-laminada") {
        ellipse(horizontal, vertical, 8, 16, "#edddba", index * 21, "#a78252", 1);
        path("M0 -12Q-4 0 0 12", "none", "#c7b38f", 0.6, transform);
      } else if (detail === "coco-en-laminas" || detail === "cascara-de-cacao") {
        path("M-12 -9Q0 -17 15 -6L8 14Q-3 2 -15 8Z", detail === "coco-en-laminas" ? "#f4ead2" : color, ink, 0.9, transform);
        path("M-15 8Q-3 2 8 14", "none", secondary, 2, transform);
      } else {
        const fill = detail === "pistacho-troceado" ? "#91a14f" : detail === "avellana-troceada" ? "#e6d3aa" : color;
        path("M-12 -6L0 -13L12 -2L6 12L-10 9Z", fill, secondary, 1.7, transform);
        path(detail === "algarroba-troceada" ? "M-7 0Q0 -8 6 0Q0 9 -7 0Z" : "M-9 -4L0 1L7 -1M0 1L4 9", "none", secondary, 1, transform);
      }
    }
  } else if (kind === "fruit") {
    const fig = detail === "higo-seco", pear = detail === "pera-deshidratada";
    if (fig || pear || /guayaba|maracuya|lichi|albaricoque|melocoton/.test(detail)) {
      const outline = pear ? "M48 17Q35 16 37 35C7 62 24 85 50 85C78 85 85 61 63 40Q57 34 58 23Z" : fig ? "M48 15L57 24C85 49 83 82 51 84C18 83 14 56 40 29Z" : "M20 51C18 18 75 13 81 48C91 83 27 92 20 51Z";
      path(outline, color, secondary, 2);
      if (fig || /guayaba|maracuya/.test(detail)) {
        ellipse(50, 54, 21, 25, fig ? "#c2817e" : detail.includes("guayaba") ? "#e6aaa0" : "#e4bb5b", 0, cream, 1.5);
        for (let seed = 0; seed < 26; seed++) ellipse(36 + random() * 29, 35 + random() * 39, 1.3, 1.8, detail.includes("maracuya") ? "#514334" : "#efcf8f", 0, cream, 0.3);
      } else if (!detail.includes("lichi")) ellipse(50, 57, pear ? 4 : 9, pear ? 7 : 13, "#987044", 14, secondary, 0.6);
      else ellipse(52, 54, 8, 14, "#70503d");
    } else if (detail === "pina-deshidratada") {
      ellipse(49, 51, 32, 29, color, 0, secondary, 2);
      ellipse(49, 51, 10, 9, cream);
      for (let ray = 0; ray < 14; ray++) path("M0 -14L2 -26", "none", secondary, 1, `translate(49 51) rotate(${ray * 360 / 14})`);
    } else if (/datil|ciruela/.test(detail)) {
      for (const [horizontal, vertical, angle] of [[35, 43, -22], [64, 64, 25]]) {
        ellipse(horizontal, vertical, 16, 23, color, angle);
        path("M-6 -16Q-12 0 -5 18M2 -19Q-3 0 5 16M8 -15Q12 0 8 11", "none", secondary, 1, `translate(${horizontal} ${vertical}) rotate(${angle})`);
      }
    } else {
      const mango = detail.includes("mango"), apple = detail.includes("manzana"), melon = detail.includes("melon");
      for (let index = 0; index < 3; index++) {
        const transform = `translate(${31 + index * 18} ${32 + index * 17}) rotate(${-30 + index * 20})`;
        path(mango ? "M-23 -9Q-4 -16 23 -2Q18 13 -17 12Q-25 4 -23 -9Z" : apple || melon ? "M-23 -10Q0 1 23 -3Q8 26 -23 -10Z" : "M-19 -10L8 -16L20 -3L13 17L-14 12Z", color, secondary, 1, transform);
        if (apple || melon) path("M-23 -10Q8 26 23 -3", "none", apple ? "#ad6f48" : "#8c9c5a", 2, transform);
        for (let fiber = 0; fiber < 4; fiber++) path(`M${-12 + fiber * 6} -7q-4 7 3 15`, "none", secondary, 0.7, transform);
      }
    }
  }
  return marks;
}

export function botanicalSVG(marks: BotanicalMark[]): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${marks.map(mark => `<path d="${mark.d}" fill="${mark.fill}" stroke="${mark.stroke}" stroke-width="${mark.width}" stroke-linecap="round"${mark.transform ? ` transform="${mark.transform}"` : ""}/>`).join("")}</svg>`;
}
