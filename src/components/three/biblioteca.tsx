"use client";
// LA BIBLIOTECA DE PIEZAS (24-ago, encargo de SER: «un juego de construcción donde eliges las cosas
// que añadir —plantas, objetos, cualquier cosa— y lo hago yo en cada habitación»).
// Cada pieza: etiqueta en claro, categoría, altura por defecto y cómo se dibuja.
// El editor (?editor=1) lee este registro para su paleta; DecoVivo lo usa para pintar lo colocado.
import type { PiezaViva } from "@/lib/vivoStore";
import { CLAVES_PIEZAS, type ClavePieza } from "@/lib/biblioteca-claves";
import { Table, PlantPot, Teapot } from "./Furniture";
import { Armchair, Lantern, HoneyPot, CheeseWheel, Sack, Sconce, SausageString, DeskLamp, BookRow,
  WallClock, Scale, Mortar, WoodTools, Pedestal, HangingHerbs } from "./Decor";
import { CruzDePared, VelaDeMesa, Frutero } from "./piezasVivas";
import { FramedPicture, MantelSet, LogBasket, CupShelf, GrandfatherClock, Clogs, TapBarrel, Barrel,
  OnionString, ConserveRow, CheeseCloche, Porthole, HangingHam, AppleBasketStool, ClayTinaja, JamShelf,
  LowBookcase, SideTable, SewingBasket, HangingPlant, MagazineRack, PhotoFrame, MilkBowl } from "./deco/salon";
import { HangingLamp, Curtains, SteamingCups, SpilledJar, HerbGarland, TeaCrateStack, FloorTarro, CupTray,
  PressedHerbFrame, BraidedMat, Chandelier, GoldFramePortrait, VelvetRope, VelvetRunner, CornerVitrine,
  SilverTray, PalmPlant } from "./deco/tearoom";
import { BenchVise, HandSaw, CarvedSpoons, FloorShavings, HerbJarShelf, HangingUtensils, RecipeBook,
  ThreeLegStool, LumberShelf, ToolJar, ShavingSack, TeaCup, Inkwell, SealedEnvelope, EnvelopeStack,
  LetterOrganizer, WallMailbox, DeskChair, WasteBasket, QuillShelf, CoatStand, FilingCabinet, Globe,
  DoorMat, UmbrellaStand } from "./deco/taller";
import { Daisies, RoseVine } from "@/scenes/IntroScene";

export type Categoria = "Plantas y jardín" | "Muebles" | "Mesa y cocina" | "Luz" | "Pared" | "Taller" | "Escritorio" | "Decoración";
export const CATEGORIAS: Categoria[] = ["Plantas y jardín", "Muebles", "Mesa y cocina", "Luz", "Pared", "Taller", "Escritorio", "Decoración"];

interface Entrada {
  etiqueta: string;         // nombre en claro para la paleta
  cat: Categoria;
  y?: number;               // altura por defecto (0 = suelo; >0 = pared/techo)
  pared?: boolean;          // se cuelga en la pared: el editor la sube sola
  render: (p: PiezaViva) => React.ReactNode;
}

const P3 = (p: PiezaViva, y = 0): [number, number, number] => [p.x, p.y ?? y, p.z];
const rad = (p: PiezaViva) => (p.rotY * Math.PI) / 180;
/** envoltorio: escala + posición + giro, para las piezas que solo aceptan `position` */
const env = (p: PiezaViva, hijo: React.ReactNode, y = 0) => (
  <group scale={p.escala} position={P3(p, y)} rotation={[0, rad(p), 0]}>{hijo}</group>
);

export const REGISTRO: Record<string, Entrada> = {
  // ── PLANTAS Y JARDÍN ──────────────────────────────────────────────────────
  "maceta":            { etiqueta: "Maceta con flores", cat: "Plantas y jardín", render: (p) => env(p, <PlantPot position={[0, 0.15, 0]} />) },
  "margaritas":        { etiqueta: "Macizo de margaritas", cat: "Plantas y jardín", render: (p) => env(p, <Daisies position={[0, 0, 0]} count={9} ancho={0.55} fondo={0.4} semilla={p.x + p.z} />) },
  "rosal":             { etiqueta: "Enredadera de rosas", cat: "Plantas y jardín", render: (p) => env(p, <RoseVine position={[0, 0, 0]} />) },
  "palmera":           { etiqueta: "Palmera de interior", cat: "Plantas y jardín", render: (p) => env(p, <PalmPlant position={[0, 0, 0]} />) },
  "hierbas-colgadas":  { etiqueta: "Manojos de hierbas", cat: "Plantas y jardín", y: 2.3, pared: true, render: (p) => env(p, <HangingHerbs position={[0, 0, 0]} width={2} />, 2.3) },
  "planta-colgante":   { etiqueta: "Planta colgante", cat: "Plantas y jardín", y: 3.2, pared: true, render: (p) => env(p, <HangingPlant position={[0, 0, 0]} />, 3.2) },
  "guirnalda-hierbas": { etiqueta: "Guirnalda de hierbas", cat: "Plantas y jardín", y: 2.6, pared: true, render: (p) => env(p, <HerbGarland position={[0, 0, 0]} />, 2.6) },
  "ramillete":         { etiqueta: "Ramillete en tarro", cat: "Plantas y jardín", render: (p) => env(p, <FloorTarro position={[0, 0, 0]} />) },

  // ── MUEBLES ───────────────────────────────────────────────────────────────
  "mesa":            { etiqueta: "Mesa", cat: "Muebles", render: (p) => env(p, <Table position={[0, 0, 0]} />) },
  "mesita":          { etiqueta: "Mesita", cat: "Muebles", render: (p) => env(p, <SideTable position={[0, 0, 0]} />) },
  "butaca":          { etiqueta: "Butaca", cat: "Muebles", render: (p) => env(p, <Armchair position={[0, 0, 0]} />) },
  "silla":           { etiqueta: "Silla", cat: "Muebles", render: (p) => env(p, <DeskChair position={[0, 0, 0]} />) },
  "taburete":        { etiqueta: "Taburete de tres patas", cat: "Muebles", render: (p) => env(p, <ThreeLegStool position={[0, 0, 0]} />) },
  "banqueta-cesta":  { etiqueta: "Banqueta con cesta", cat: "Muebles", render: (p) => env(p, <AppleBasketStool position={[0, 0, 0]} />) },
  "estanteria":      { etiqueta: "Estantería baja", cat: "Muebles", render: (p) => env(p, <LowBookcase position={[0, 0, 0]} />) },
  "estante-tazas":   { etiqueta: "Estante de tazas", cat: "Muebles", y: 2.2, pared: true, render: (p) => env(p, <CupShelf position={[0, 0, 0]} />, 2.2) },
  "estante-tarros":  { etiqueta: "Estante de tarros", cat: "Muebles", y: 1.9, pared: true, render: (p) => env(p, <HerbJarShelf position={[0, 0, 0]} />, 1.9) },
  "estante-mermeladas": { etiqueta: "Estante de mermeladas", cat: "Muebles", y: 1.8, pared: true, render: (p) => env(p, <JamShelf position={[0, 0, 0]} />, 1.8) },
  "estante-madera":  { etiqueta: "Estante de tablones", cat: "Muebles", y: 1.7, pared: true, render: (p) => env(p, <LumberShelf position={[0, 0, 0]} />, 1.7) },
  "archivador":      { etiqueta: "Archivador", cat: "Muebles", render: (p) => env(p, <FilingCabinet position={[0, 0, 0]} />) },
  "perchero":        { etiqueta: "Perchero", cat: "Muebles", render: (p) => env(p, <CoatStand position={[0, 0, 0]} />) },
  "pedestal":        { etiqueta: "Pedestal", cat: "Muebles", render: (p) => env(p, <Pedestal position={[0, 0, 0]} />) },
  "cajas-te":        { etiqueta: "Cajas de té apiladas", cat: "Muebles", render: (p) => env(p, <TeaCrateStack position={[0, 0, 0]} />) },
  "barril":          { etiqueta: "Barril", cat: "Muebles", render: (p) => env(p, <Barrel position={[0, 0, 0]} />) },
  "barril-grifo":    { etiqueta: "Barril con grifo", cat: "Muebles", render: (p) => env(p, <TapBarrel position={[0, 0, 0]} />) },
  "vitrina-rincon":  { etiqueta: "Vitrina de rincón", cat: "Muebles", render: (p) => env(p, <CornerVitrine position={[0, 0, 0]} />) },
  "revistero":       { etiqueta: "Revistero", cat: "Muebles", render: (p) => env(p, <MagazineRack position={[0, 0, 0]} />) },
  "costurero":       { etiqueta: "Cesto de costura", cat: "Muebles", render: (p) => env(p, <SewingBasket position={[0, 0, 0]} />) },

  // ── MESA Y COCINA ─────────────────────────────────────────────────────────
  "tetera":          { etiqueta: "Tetera", cat: "Mesa y cocina", render: (p) => env(p, <Teapot position={[0, 0, 0]} />) },
  "taza":            { etiqueta: "Taza de té", cat: "Mesa y cocina", render: (p) => env(p, <TeaCup position={[0, 0, 0]} steam />) },
  "tazas-humeantes": { etiqueta: "Dos tazas humeantes", cat: "Mesa y cocina", render: (p) => env(p, <SteamingCups position={[0, 0, 0]} />) },
  "bandeja":         { etiqueta: "Bandeja de tazas", cat: "Mesa y cocina", render: (p) => env(p, <CupTray position={[0, 0, 0]} />) },
  "bandeja-plata":   { etiqueta: "Bandeja de plata", cat: "Mesa y cocina", render: (p) => env(p, <SilverTray position={[0, 0, 0]} />) },
  "balanza":         { etiqueta: "Balanza", cat: "Mesa y cocina", render: (p) => env(p, <Scale position={[0, 0, 0]} />) },
  "mortero":         { etiqueta: "Mortero", cat: "Mesa y cocina", render: (p) => env(p, <Mortar position={[0, 0, 0]} />) },
  "queso":           { etiqueta: "Rueda de queso", cat: "Mesa y cocina", render: (p) => env(p, <CheeseWheel position={[0, 0.12, 0]} />) },
  "quesera":         { etiqueta: "Quesera con campana", cat: "Mesa y cocina", render: (p) => env(p, <CheeseCloche position={[0, 0, 0]} />) },
  "miel":            { etiqueta: "Tarro de miel", cat: "Mesa y cocina", render: (p) => env(p, <HoneyPot position={[0, 0.1, 0]} />) },
  "saco":            { etiqueta: "Saco", cat: "Mesa y cocina", render: (p) => env(p, <Sack position={[0, 0.26, 0]} />) },
  "embutidos":       { etiqueta: "Ristra de embutidos", cat: "Mesa y cocina", y: 2.4, pared: true, render: (p) => env(p, <SausageString position={[0, 0, 0]} />, 2.4) },
  "jamon":           { etiqueta: "Jamón colgado", cat: "Mesa y cocina", y: 2.5, pared: true, render: (p) => env(p, <HangingHam position={[0, 0, 0]} />, 2.5) },
  "cebollas":        { etiqueta: "Ristra de cebollas", cat: "Mesa y cocina", y: 2.4, pared: true, render: (p) => env(p, <OnionString position={[0, 0, 0]} />, 2.4) },
  "conservas":       { etiqueta: "Fila de conservas", cat: "Mesa y cocina", render: (p) => env(p, <ConserveRow position={[0, 0, 0]} />) },
  "frutero":         { etiqueta: "Frutero", cat: "Mesa y cocina", render: (p) => <Frutero position={P3(p)} escala={p.escala} /> },
  "cuenco-leche":    { etiqueta: "Cuenco de leche", cat: "Mesa y cocina", render: (p) => env(p, <MilkBowl position={[0, 0, 0]} />) },
  "tarro-volcado":   { etiqueta: "Tarro volcado", cat: "Mesa y cocina", render: (p) => env(p, <SpilledJar position={[0, 0, 0]} />) },
  "tarro-suelo":     { etiqueta: "Tarro grande de suelo", cat: "Mesa y cocina", render: (p) => env(p, <FloorTarro position={[0, 0, 0]} />) },

  // ── LUZ ───────────────────────────────────────────────────────────────────
  "farol":       { etiqueta: "Farol", cat: "Luz", render: (p) => env(p, <Lantern position={[0, 0, 0]} />) },
  "candelabro":  { etiqueta: "Candelabro de pared", cat: "Luz", y: 2.5, pared: true, render: (p) => env(p, <Sconce position={[0, 0, 0]} withLight={false} />, 2.5) },
  "flexo":       { etiqueta: "Flexo de mesa", cat: "Luz", render: (p) => env(p, <DeskLamp position={[0, 0, 0]} />) },
  "lampara":     { etiqueta: "Lámpara colgante", cat: "Luz", render: (p) => <group position={[p.x, 0, p.z]}><HangingLamp position={[0, 0, 0]} ceiling={3.6} /></group> },
  "arana":       { etiqueta: "Araña de techo", cat: "Luz", render: (p) => <group position={[p.x, 0, p.z]}><Chandelier position={[0, 0, 0]} ceiling={4.4} /></group> },
  "vela":        { etiqueta: "Vela de mesa", cat: "Luz", render: (p) => <VelaDeMesa position={P3(p)} escala={p.escala} /> },

  // ── PARED ─────────────────────────────────────────────────────────────────
  "cuadro":            { etiqueta: "Cuadro", cat: "Pared", y: 2.6, pared: true, render: (p) => env(p, <FramedPicture position={[0, 0, 0]} />, 2.6) },
  "retrato-dorado":    { etiqueta: "Retrato con marco dorado", cat: "Pared", y: 2.7, pared: true, render: (p) => env(p, <GoldFramePortrait position={[0, 0, 0]} />, 2.7) },
  "reloj-pared":       { etiqueta: "Reloj de pared", cat: "Pared", y: 2.7, pared: true, render: (p) => env(p, <WallClock position={[0, 0, 0]} />, 2.7) },
  "cruz":              { etiqueta: "Cruz de pared", cat: "Pared", y: 2.4, pared: true, render: (p) => <CruzDePared position={P3(p, 2.4)} rotY={rad(p)} escala={p.escala} /> },
  "ojo-de-buey":       { etiqueta: "Ojo de buey", cat: "Pared", y: 2.8, pared: true, render: (p) => env(p, <Porthole position={[0, 0, 0]} />, 2.8) },
  "buzon":             { etiqueta: "Buzón", cat: "Pared", y: 1.6, pared: true, render: (p) => env(p, <WallMailbox position={[0, 0, 0]} />, 1.6) },
  "cortinas":          { etiqueta: "Cortinas", cat: "Pared", y: 2.3, pared: true, render: (p) => env(p, <Curtains position={[0, 0, 0]} width={1.7} />, 2.3) },
  "herbario-enmarcado":{ etiqueta: "Lámina de herbario", cat: "Pared", y: 2.5, pared: true, render: (p) => env(p, <PressedHerbFrame position={[0, 0, 0]} />, 2.5) },
  "marco-foto":        { etiqueta: "Marco de fotos", cat: "Pared", y: 1.2, render: (p) => env(p, <PhotoFrame position={[0, 0, 0]} />, 1.2) },

  // ── TALLER ────────────────────────────────────────────────────────────────
  "tornillo-banco":    { etiqueta: "Tornillo de banco", cat: "Taller", render: (p) => env(p, <BenchVise position={[0, 0, 0]} />) },
  "sierra":            { etiqueta: "Sierra", cat: "Taller", render: (p) => env(p, <HandSaw position={[0, 0, 0]} />) },
  "herramientas":      { etiqueta: "Herramientas de madera", cat: "Taller", render: (p) => env(p, <WoodTools position={[0, 0, 0]} />) },
  "cucharas-talladas": { etiqueta: "Cucharas talladas", cat: "Taller", render: (p) => env(p, <CarvedSpoons position={[0, 0, 0]} />) },
  "virutas":           { etiqueta: "Virutas en el suelo", cat: "Taller", render: (p) => env(p, <FloorShavings position={[0, 0, 0]} />) },
  "bote-herramientas": { etiqueta: "Bote de herramientas", cat: "Taller", render: (p) => env(p, <ToolJar position={[0, 0, 0]} />) },
  "saco-virutas":      { etiqueta: "Saco de virutas", cat: "Taller", render: (p) => env(p, <ShavingSack position={[0, 0, 0]} />) },
  "utensilios-colgados": { etiqueta: "Utensilios colgados", cat: "Taller", y: 2.2, pared: true, render: (p) => env(p, <HangingUtensils position={[0, 0, 0]} />, 2.2) },

  // ── ESCRITORIO Y CORREO ───────────────────────────────────────────────────
  "tintero":         { etiqueta: "Tintero", cat: "Escritorio", render: (p) => env(p, <Inkwell position={[0, 0, 0]} />) },
  "carta-lacrada":   { etiqueta: "Carta lacrada", cat: "Escritorio", render: (p) => env(p, <SealedEnvelope position={[0, 0, 0]} />) },
  "cartas":          { etiqueta: "Montón de cartas", cat: "Escritorio", render: (p) => env(p, <EnvelopeStack position={[0, 0, 0]} />) },
  "clasificador":    { etiqueta: "Clasificador de cartas", cat: "Escritorio", render: (p) => env(p, <LetterOrganizer position={[0, 0, 0]} />) },
  "plumas":          { etiqueta: "Estante de plumas", cat: "Escritorio", y: 1.9, pared: true, render: (p) => env(p, <QuillShelf position={[0, 0, 0]} />, 1.9) },
  "papelera":        { etiqueta: "Papelera", cat: "Escritorio", render: (p) => env(p, <WasteBasket position={[0, 0, 0]} />) },
  "globo-terraqueo": { etiqueta: "Globo terráqueo", cat: "Escritorio", render: (p) => env(p, <Globe position={[0, 0, 0]} />) },
  "paraguero":       { etiqueta: "Paragüero", cat: "Escritorio", render: (p) => env(p, <UmbrellaStand position={[0, 0, 0]} />) },
  "recetario":       { etiqueta: "Libro de recetas", cat: "Escritorio", render: (p) => env(p, <RecipeBook position={[0, 0, 0]} />) },

  // ── DECORACIÓN ────────────────────────────────────────────────────────────
  "libros":            { etiqueta: "Fila de libros", cat: "Decoración", render: (p) => env(p, <BookRow position={[0, 0, 0]} />) },
  "zuecos":            { etiqueta: "Zuecos", cat: "Decoración", render: (p) => env(p, <Clogs position={[0, 0, 0]} />) },
  "leña":              { etiqueta: "Cesto de leña", cat: "Decoración", render: (p) => env(p, <LogBasket position={[0, 0, 0]} />) },
  "repisa-chimenea":   { etiqueta: "Repisa de chimenea", cat: "Decoración", y: 1.9, pared: true, render: (p) => env(p, <MantelSet position={[0, 0, 0]} />, 1.9) },
  "reloj-de-pie":      { etiqueta: "Reloj de pie", cat: "Decoración", render: (p) => env(p, <GrandfatherClock position={[0, 0, 0]} />) },
  "tinaja":            { etiqueta: "Tinaja de barro", cat: "Decoración", render: (p) => env(p, <ClayTinaja position={[0, 0, 0]} />) },
  "estera":            { etiqueta: "Estera trenzada", cat: "Decoración", render: (p) => env(p, <BraidedMat position={[0, 0, 0]} />) },
  "felpudo":           { etiqueta: "Felpudo", cat: "Decoración", render: (p) => env(p, <DoorMat position={[0, 0, 0]} />) },
  "alfombra-pasillo":  { etiqueta: "Alfombra de pasillo", cat: "Decoración", render: (p) => env(p, <VelvetRunner position={[0, 0, 0]} />) },
  "cordon-terciopelo": { etiqueta: "Cordón de terciopelo", cat: "Decoración", render: (p) => env(p, <VelvetRope from={[-0.6, 0, 0]} to={[0.6, 0, 0]} />) },
};

/** Compatibilidad con lo ya guardado antes de la biblioteca grande (15 claves viejas). */
export const ALIAS: Record<string, ClavePieza> = {
  mesa: "mesa", silla: "silla", butaca: "butaca", taburete: "taburete", farol: "farol", lampara: "lampara",
  maceta: "maceta", tinaja: "tinaja", queso: "queso", saco: "saco", miel: "miel", candelabro: "candelabro",
  cruz: "cruz", vela: "vela", frutero: "frutero",
};

export const claves = (): string[] => Object.keys(REGISTRO);
export const porCategoria = (c: Categoria) => Object.entries(REGISTRO).filter(([, e]) => e.cat === c);
export const etiquetaDe = (k: string) => REGISTRO[k]?.etiqueta ?? k;
export const alturaDe = (k: string) => REGISTRO[k]?.y ?? 0;
export const esDePared = (k: string) => !!REGISTRO[k]?.pared;
export { CLAVES_PIEZAS };
