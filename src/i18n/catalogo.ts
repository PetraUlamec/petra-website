// TRADUCCIONES DEL CATÁLOGO (datos) — EN + SL, con fallback a ES.
// Los datos canónicos viven en src/data/*.ts EN ESPAÑOL; aquí solo las traducciones por id.
// REGLA: si un id o un campo no está aquí (p. ej. tés publicados desde el taller),
// se muestra el texto ES original — nunca se rompe, nunca queda vacío.
import type { Lang } from "./index";
import type { Tea, CajaTemporada, Extra, Plant, Cupon, Estacion } from "@/lib/types";

type Tr = { en: string; sl: string };
type TrTea = { nombre?: Tr; paraQueSirve?: Tr; plantas?: Record<string, Tr> };
type TrCaja = { nombre?: Tr; descripcion?: Tr };
type TrExtra = { nombre?: Tr; procedencia?: Tr };

// ── TÉS ──────────────────────────────────────────────────────────────────────
export const TR_TEAS: Record<string, TrTea> = {
  "sueno-del-bosque": {
    nombre: { en: "Forest Sleep", sl: "Gozdni sen" },
    paraQueSirve: {
      en: "For the last hour of the day: it loosens the body and turns down the noise in your head before sleep.",
      sl: "Za zadnjo uro dneva: sprosti telo in utiša misli pred spanjem.",
    },
    plantas: {
      manzanilla: { en: "Here it is the base that settles a nervous bedtime stomach, so the body stops asking for attention.", sl: "Tu je osnova, ki pomiri živčen želodec pred spanjem, da telo neha zahtevati pozornost." },
      tila: { en: "It softens the racing pulse of the day's end; it is what lets sleep arrive without a fight.", sl: "Umiri pospešen utrip ob koncu dneva; prav ona pripelje spanec brez boja." },
      lavanda: { en: "Just a pinch, only for its scent: it tells the mind there is nothing left to solve today.", sl: "Le ščepec, samo zaradi vonja: glavi pove, da danes ni treba rešiti ničesar več." },
      melisa: { en: "It rounds off the flavour and unties the knot in the chest after a long day.", sl: "Zaokroži okus in razveže vozel v prsih, kadar je bil dan dolg." },
    },
  },
  "manana-clara": {
    nombre: { en: "Clear Morning", sl: "Jasno jutro" },
    paraQueSirve: {
      en: "Waking up without coffee: it clears the head and gets you going without a sudden jolt.",
      sl: "Prebujanje brez kave: zbistri glavo in te požene brez sunka.",
    },
    plantas: {
      menta: { en: "The morning's kindest slap: it opens the breath and wakes you from the very first sip.", sl: "Prijazna jutranja zaušnica: odpre dih in prebudi že s prvim požirkom." },
      romero: { en: "In this mix it serves first-hour memory, when the head is still starting cold.", sl: "V tej mešanici skrbi za spomin ob prvi uri, ko glava še vžiga na hladno." },
      hierbaluisa: { en: "It brings the lemon touch that makes the blend fresh instead of bitter.", sl: "Doda limonin pridih, zaradi katerega je mešanica sveža, ne grenka." },
    },
  },
  "estomago-contento": {
    nombre: { en: "Happy Belly", sl: "Zadovoljen želodec" },
    paraQueSirve: {
      en: "After eating too much or too late: it helps digestion and eases the bloat.",
      sl: "Po preobilni ali pozni jedi: pomaga prebavi in odpravi napihnjenost.",
    },
    plantas: {
      hinojo: { en: "The one that truly works against bloating after a big plate; that is why it takes the largest share.", sl: "Tisti, ki po obilnem krožniku zares dela proti napihnjenosti; zato ga je v mešanici največ." },
      anis: { en: "It keeps the fennel company and sweetens the sip without sugar: the after-meal hour turns gentle.", sl: "Dela družbo komarčku in brez sladkorja osladi požirek: ura po kosilu postane prijazna." },
      menta: { en: "Here it does not wake you: it freshens the mouth and settles a heavy stomach.", sl: "Tu ne prebuja: osveži usta in umiri težek želodec." },
      manzanilla: { en: "In this mix it rides escort: it calms the burn when dinner was bigger than prudence.", sl: "V tej mešanici je spremljevalka: pomiri zgago, kadar je bila jed obilnejša od pameti." },
    },
  },
  "garganta-de-invierno": {
    nombre: { en: "Winter Throat", sl: "Zimsko grlo" },
    paraQueSirve: {
      en: "For cold days, a scratchy voice and a blocked nose.",
      sl: "Za mrzle dni, hripav glas in zamašen nos.",
    },
    plantas: {
      tomillo: { en: "The guardian of the chest: it is here for the cough and for that throat that scratches when you speak.", sl: "Varuh prsi: tu je zaradi kašlja in grla, ki praska ob govorjenju." },
      jengibre: { en: "It lights the fire inside; in this mix its heat is the winter coat.", sl: "Prižge ogenj v telesu; v tej mešanici je njegova ostrina topel plašč." },
      escaramujo: { en: "The wild rose's vitamin: it reinforces just when the body is busy defending itself.", sl: "Vitamin divje vrtnice: okrepi ravno takrat, ko se telo brani." },
      regaliz: { en: "It sweetens and soothes an irritated throat; the honey layer of this blend, with no honey in it.", sl: "Osladi in pomiri razdraženo grlo; medena plast te mešanice, čeprav brez medu." },
    },
  },
  "tarde-en-calma": {
    nombre: { en: "Calm Afternoon", sl: "Mirno popoldne" },
    paraQueSirve: {
      en: "For the small anxiety of mid-afternoon: carry on with the day, only lighter.",
      sl: "Za drobno popoldansko tesnobo: dan teče naprej, a lažje.",
    },
    plantas: {
      melisa: { en: "Here she is the lead: she turns down the hum without making you sleepy — there is still day ahead.", sl: "Tu je glavna: utiša notranji šum, ne da bi uspavala — dneva je še nekaj pred nami." },
      azahar: { en: "Orange blossom brings the comfort: it smells like everything will turn out fine.", sl: "Pomarančni cvet doda tolažbo: diši po tem, da bo vse še dobro." },
      salvia: { en: "It keeps the mood even and stops calm from turning into drowsiness.", sl: "Drži razpoloženje v ravnovesju in pazi, da mir ne postane dremavost." },
    },
  },
  "monte-limpio": {
    nombre: { en: "Mountain Sweep", sl: "Gorska metla" },
    paraQueSirve: {
      en: "The seasonal cleanse: for when the body asks for a good sweep.",
      sl: "Sezonsko čiščenje: za takrat, ko telo prosi za temeljito metlo.",
    },
    plantas: {
      ortiga: { en: "The broom of the mix: here for its fame of cleaning from within and remineralising.", sl: "Metla te mešanice: tu je zaradi slovesa, da čisti od znotraj in vrača minerale." },
      colacaballo: { en: "It joins the nettle by pulling out the excess water; together they finish the sweep.", sl: "Koprivi pomaga odvajati odvečno vodo; skupaj pometeta do konca." },
      menta: { en: "In this blend it is pure flavour: without it, the sweep would taste of wet field.", sl: "V tej mešanici je čisti okus: brez nje bi imelo čiščenje okus po mokri travi." },
    },
  },
  "abrazo-de-frutas": {
    nombre: { en: "Fruit Hug", sl: "Sadni objem" },
    paraQueSirve: {
      en: "The tea for people who did not want tea: fruity, reddish, loved by children and guests.",
      sl: "Čaj za tiste, ki čaja niso hoteli: saden, rdečkast, všeč otrokom in gostom.",
    },
    plantas: {
      escaramujo: { en: "Here it brings the body and the reddish colour of the glass; it is the fruit of this cup.", sl: "Tu prispeva polnost in rdečkasto barvo kozarca; on je sadje te skodelice." },
      frambuesa: { en: "The raspberry leaf lays the green base that keeps it from cloying.", sl: "Malinov list da zeleno osnovo, da mešanica ni presladka." },
      rosa: { en: "The petals are the jar's smile: they perfume it and make it beautiful to open.", sl: "Cvetni listi so nasmeh kozarca: odišavijo ga in polepšajo ob odprtju." },
      canela: { en: "Half a turn of cinnamon so the fruit tastes of pie, not of juice.", sl: "Pol obrata cimeta, da ima sadje okus po piti, ne po soku." },
    },
  },
  "respiro-de-sauco": {
    nombre: { en: "Elderflower Breath", sl: "Bezgov predih" },
    paraQueSirve: {
      en: "For springs full of sneezes and dripping noses.",
      sl: "Za pomladi kihanja in smrkavih nosov.",
    },
    plantas: {
      "saúco": { en: "Elderflower is the key here: the old remedy for spring colds.", sl: "Bezgov cvet je tu ključ: od nekdaj prvi pri pomladnih prehladih." },
      escaramujo: { en: "In this mix it backs the defences while the elderflower does its work.", sl: "V tej mešanici podpira odpornost, medtem ko bezeg opravlja svoje delo." },
      hierbaluisa: { en: "Its fresh lemon clears the nose by scent before the sip even lands.", sl: "Njena sveža limona odmaši nos že z vonjem, še pred požirkom." },
    },
  },
  "oro-de-otono": {
    nombre: { en: "Autumn Gold", sl: "Jesensko zlato" },
    paraQueSirve: {
      en: "The house reserve: rooibos and noble spices, the cup for special occasions.",
      sl: "Hišna rezerva: rooibos in žlahtne začimbe, skodelica za posebne priložnosti.",
    },
    plantas: {
      rooibos: { en: "South African rooibos is the silk of this mix: sweet body and not a drop of caffeine.", sl: "Južnoafriški rooibos je svila te mešanice: sladka polnost in niti kaplje teina." },
      cardamomo: { en: "Hand-crushed at packing: here it is the luxury you smell before the water even boils.", sl: "Ročno strt ob pakiranju: tu je razkošje, ki ga zavohaš, še preden zavre voda." },
      canela: { en: "Ceylon cinnamon in sticks, not ground: in this blend elegance rules, not sweetness.", sl: "Cejlonski cimet v palčkah, ne mlet: v tej mešanici vlada eleganca, ne sladkost." },
      calendula: { en: "Its orange petals are the visible gold of the name: they are served right in the cup.", sl: "Njeni oranžni cvetni listi so vidno zlato imena: postrežejo se kar v skodelici." },
    },
  },
  "jardin-de-petra": {
    nombre: { en: "Petra's Garden", sl: "Petrin vrt" },
    paraQueSirve: {
      en: "The mix that started it all: flowers from the home garden, in small numbered harvests.",
      sl: "Mešanica, s katero se je vse začelo: cvetje z domačega vrta, v majhnih oštevilčenih letinah.",
    },
    plantas: {
      rosa: { en: "The roses come from the bush Petra's grandmother planted: every petal dries in the shade, never in the sun.", sl: "Vrtnice so z grma, ki ga je posadila Petrina babica: vsak cvetni list se suši v senci, nikoli na soncu." },
      lavanda: { en: "The lavender by the front door: here it does not help you sleep, it helps you remember.", sl: "Sivka ob domačem vhodu: tu ne pomaga spati, pomaga, da se spominjaš." },
      melisa: { en: "It grows on its own by the well; the freshness that keeps the garden from cloying.", sl: "Sama raste ob vodnjaku; svežina, da vrt ne postane presladek." },
      calendula: { en: "Calendula keeps the colour of summer for the cups of January.", sl: "Ognjič hrani barvo poletja za januarske skodelice." },
    },
  },
  "raiz-y-fuego": {
    nombre: { en: "Root & Fire", sl: "Korenina in ogenj" },
    paraQueSirve: {
      en: "The house chai: roots and spices for those who want a cup with character.",
      sl: "Hišni chai: korenine in začimbe za tiste, ki hočejo skodelico z značajem.",
    },
    plantas: {
      jengibre: { en: "Here the ginger does not warm you: it COMMANDS. Cut thick so the fire lasts the whole cup.", sl: "Tu ingver ne greje: UKAZUJE. Narezan na debelo, da ogenj traja vso skodelico." },
      canela: { en: "In this mix it is firewood for the ginger's flame, not perfume.", sl: "V tej mešanici je kurjava za ingverjev ogenj, ne parfum." },
      cardamomo: { en: "The green counterpoint that keeps the fire from burning: order within character.", sl: "Zelena protiutež, da ogenj ne ožge: red znotraj značaja." },
      regaliz: { en: "The sweet finish of every sip, so the fire says a proper goodbye.", sl: "Sladek zaključek vsakega požirka, da se ogenj lepo poslovi." },
    },
  },
  "niebla-blanca": {
    nombre: { en: "White Mist", sl: "Bela megla" },
    paraQueSirve: {
      en: "The most delicate of the house: pale flowers to drink slowly and in silence.",
      sl: "Najnežnejši v hiši: bledo cvetje za počasno pitje v tišini.",
    },
    plantas: {
      azahar: { en: "Orange blossom is the mist of the name: picked at dawn, before the sun grows heavy.", sl: "Pomarančni cvet je megla iz imena: nabran ob zori, ko sonce še ne teži." },
      "saúco": { en: "Here the elderflower cures no colds: it brings the white-pear note that holds up the orange blossom.", sl: "Tu bezeg ne zdravi prehladov: doda noto bele hruške, ki podpira pomarančni cvet." },
      tila: { en: "Linden lays the silky base; it is the silence of this cup.", sl: "Lipa da svilnato osnovo; ona je tišina te skodelice." },
    },
  },
  "vispera-de-fiesta": {
    nombre: { en: "Festive Eve", sl: "Praznični predvečer" },
    paraQueSirve: {
      en: "Made for gifting: the jar you open at the table and everyone goes ooh.",
      sl: "Za darilo: kozarec, ki ga odpreš na mizi in vsi rečejo ooo.",
    },
    plantas: {
      escaramujo: { en: "The deep red of the brew: on the table it looks like spiced wine.", sl: "Globoka rdečina napitka: na mizi je videti kot kuhano vino." },
      rosa: { en: "Whole petals, never broken: this jar is bought as much for the eyes as for the cup.", sl: "Celi cvetni listi, ne zdrobljeni: ta kozarec se kupuje z očmi prav toliko kot s skodelico." },
      canela: { en: "The festive scent when the lid lifts: the gift's first impression.", sl: "Praznični vonj ob dvigu pokrova: prvi vtis darila." },
      jengibre: { en: "A very light spicy base, the secret that makes people ask “what is in this?”.", sl: "Čisto rahla pikantnost v ozadju, skrivnost, zaradi katere vsi vprašajo: »Kaj je notri?«" },
    },
  },
  "rubi-de-hibisco": {
    nombre: { en: "Hibiscus Ruby", sl: "Hibiskusov rubin" },
    paraQueSirve: {
      en: "Deep red and freshly tart: served cold in summer, it is the jewel of the pitcher.",
      sl: "Živo rdeč in sveže kiselkast: hladen poleti je dragulj vrča.",
    },
    plantas: {
      hibisco: { en: "Hibiscus brings the ruby: colour, tartness and freshness — the whole soul of this pitcher.", sl: "Hibiskus da rubin: barvo, kislino in svežino — on je vsa duša tega vrča." },
      naranjaseca: { en: "Dried orange rounds off the hibiscus tang with its toasted sweetness.", sl: "Posušena pomaranča s svojo praženo sladkobo zaokroži hibiskusovo kislino." },
      menta: { en: "Here the mint is the ice: the cool finish summer asks for.", sl: "Tu je meta led: svež zaključek, ki ga zahteva poletje." },
    },
  },
  "prado-azul": {
    nombre: { en: "Blue Meadow", sl: "Modri travnik" },
    paraQueSirve: {
      en: "For afternoons of reading by the window: little blue flowers and calm.",
      sl: "Za popoldneve branja ob oknu: drobne modre cvetlice in mir.",
    },
    plantas: {
      aciano: { en: "Cornflower paints the meadow blue right in the cup — and soothes eyes tired from reading.", sl: "Plavica v skodelici pobarva travnik na modro — in pomiri od branja utrujene oči." },
      malva: { en: "Mallow is the velvet of this meadow: it softens throat and mood alike.", sl: "Slez je žamet tega travnika: zmehča grlo in razpoloženje." },
      melisa: { en: "Lemon balm brings the breeze: without it the meadow would be merely pretty, not peaceful.", sl: "Melisa prinese sapico: brez nje bi bil travnik le lep, ne miren." },
    },
  },
  "manzana-del-horno": {
    nombre: { en: "Baked Apple", sl: "Pečeno jabolko" },
    paraQueSirve: {
      en: "It tastes of apple pie fresh from the oven: the tea of Sunday teatime.",
      sl: "Ima okus po sveže pečeni jabolčni piti: čaj nedeljskih malic.",
    },
    plantas: {
      manzanaseca: { en: "The dried apple is the pie: baked-fruit sweetness without a pinch of sugar.", sl: "Posušeno jabolko je pita: sladkost pečenega sadja brez ščepca sladkorja." },
      canela: { en: "Here the cinnamon is the home-oven kind: the one that smells of Sunday afternoon.", sl: "Tu je cimet tisti iz domače pečice: ta, ki diši po nedeljskem popoldnevu." },
      escaramujo: { en: "Rosehip adds the tiny tart note that keeps the pie from cloying.", sl: "Šipek doda drobno kislost, da pita ni presladka." },
    },
  },
  "bosque-de-invierno": {
    nombre: { en: "Winter Forest", sl: "Zimski gozd" },
    paraQueSirve: {
      en: "A walk through the snowy forest: resin, freshness and warmth.",
      sl: "Sprehod po zasneženem gozdu: smola, svežina in toplina.",
    },
    plantas: {
      abeto: { en: "The fir tips are the forest itself: fresh resin that opens the chest.", sl: "Jelovi vršički so gozd sam: sveža smola, ki odpre prsi." },
      eucalipto: { en: "Eucalyptus clears the walk's frozen nose — the scarf of this mix.", sl: "Evkaliptus odmaši od mraza zamašen nos — šal te mešanice." },
      jengibre: { en: "Ginger is the fire waiting at home when you come back from the forest.", sl: "Ingver je ogenj, ki te čaka doma po vrnitvi iz gozda." },
    },
  },
  "noche-de-reyes": {
    nombre: { en: "Twelfth Night", sl: "Noč kraljev" },
    paraQueSirve: {
      en: "The rarest reserve of the house: Thai black ginger and spices of legend.",
      sl: "Najredkejša rezerva hiše: tajski črni ingver in legendarne začimbe.",
    },
    plantas: {
      jengibrenegro: { en: "Black ginger is the dark jewel: rare, deep, almost mysterious — it goes in this jar only.", sl: "Črni ingver je temni dragulj: redek, globok, skoraj skrivnosten — samo v tem kozarcu." },
      cardamomo: { en: "Cardamom escorts the dark king with its green perfume.", sl: "Kardamom spremlja temnega kralja s svojim zelenim vonjem." },
      curcuma: { en: "Turmeric gilds the cup: the kings' gold at the bottom.", sl: "Kurkuma pozlati skodelico: zlato kraljev na dnu." },
      canela: { en: "Cinnamon binds the procession: without it every spice would go its own way.", sl: "Cimet poveže sprevod: brez njega bi šla vsaka začimba svojo pot." },
    },
  },
  "colina-de-brezo": {
    nombre: { en: "Heather Hill", sl: "Vresov grič" },
    paraQueSirve: {
      en: "The pink hills of the north in bloom: delicate, wild, to be drunk slowly.",
      sl: "Rožnati griči severa v cvetju: nežen, divji, za počasno pitje.",
    },
    plantas: {
      brezo: { en: "Heather is the whole hill: hand-picked when the moor turns pink.", sl: "Vresa je ves grič: ročno nabrana, ko se pobočja obarvajo rožnato." },
      hiperico: { en: "St John's wort brings the sun that gilds those hills — the joy of the mix.", sl: "Šentjanževka prinese sonce, ki pozlati te griče — veselje te mešanice." },
      verbena: { en: "Vervain brings the dusk: it closes the sip with lilac calm.", sl: "Sporiš doda večerni mrak: požirek zaključi z lila mirom." },
    },
  },
};

// ── CAJAS ────────────────────────────────────────────────────────────────────
export const TR_CAJAS: Record<string, TrCaja> = {
  "caja-general": {
    nombre: { en: "The House Box", sl: "Domača škatla" },
    descripcion: {
      en: "Available all year: one house tea chosen at random and cheese. No spoon included.",
      sl: "Na voljo vse leto: naključno izbran hišni čaj in sir. Brez žličke.",
    },
  },
  "caja-verano": {
    nombre: { en: "Summer Box", sl: "Poletna škatla" },
    descripcion: {
      en: "One house tea chosen at random, lemonade and one of Erik's spoons chosen at random. No cheese.",
      sl: "Naključno izbran hišni čaj, limonada in naključno izbrana Erikova žlička. Brez sira.",
    },
  },
  "caja-invierno": {
    nombre: { en: "Winter Box", sl: "Zimska škatla" },
    descripcion: {
      en: "One house tea chosen at random, meat, cheese and one of Erik's spoons chosen at random.",
      sl: "Naključno izbran hišni čaj, meso, sir in naključno izbrana Erikova žlička.",
    },
  },
  "caja-primavera": {
    nombre: { en: "Spring Box", sl: "Pomladna škatla" },
    descripcion: {
      en: "One house tea chosen at random, blossom honey and one of Erik's spoons chosen at random. No cheese.",
      sl: "Naključno izbran hišni čaj, cvetlični med in naključno izbrana Erikova žlička. Brez sira.",
    },
  },
  "caja-otono": {
    nombre: { en: "Autumn Box", sl: "Jesenska škatla" },
    descripcion: {
      en: "One house tea chosen at random, chestnut honey and one of Erik's spoons chosen at random. No cheese.",
      sl: "Naključno izbran hišni čaj, kostanjev med in naključno izbrana Erikova žlička. Brez sira.",
    },
  },
};

// ── EXTRAS (cucharas, quesos, carnes, limonada, mieles) ──────────────────────
export const TR_EXTRAS: Record<string, TrExtra> = {
  "cuchara-nogal": {
    nombre: { en: "Walnut teaspoon", sl: "Orehova žlička" },
    procedencia: { en: "Carved from a fallen branch of the walnut tree behind the house; the dark grain belongs to that tree and no other.", sl: "Izrezljana iz odpadle veje oreha za hišo; temne letnice so od tistega drevesa in nobenega drugega." },
  },
  "cuchara-cerezo": {
    nombre: { en: "Cherry teaspoon", sl: "Češnjeva žlička" },
    procedencia: { en: "From the pruning of the orchard cherry; with use it will keep turning redder, like the fruit.", sl: "Iz obrezane češnje v sadovnjaku; z uporabo bo vse bolj rdela, kakor sad." },
  },
  "cuchara-arce": {
    nombre: { en: "Maple teaspoon", sl: "Javorova žlička" },
    procedencia: { en: "Pale maple from the nearby forest; Erik carved it so thin the light almost passes through.", sl: "Svetel javor iz bližnjega gozda; Erik jo je izrezljal tako tanko, da svetloba skoraj posije skoznjo." },
  },
  "cuchara-olivo": {
    nombre: { en: "Olive-wood teaspoon", sl: "Oljčna žlička" },
    procedencia: { en: "From an old olive tree a friend brought up from the south; its swirling grain repeats in no other spoon.", sl: "Iz stare oljke, ki jo je prijatelj pripeljal z juga; vzorca letnic ne ponovi nobena druga žlička." },
  },
  "cuchara-manzano": {
    nombre: { en: "Apple-wood teaspoon", sl: "Jablanova žlička" },
    procedencia: { en: "From the apple tree that had to be felled last winter: the tree lives on at the table, every morning.", sl: "Iz jablane, ki jo je bilo treba lani pozimi podreti: drevo je še vedno pri mizi, vsako jutro." },
  },
  "cuchara-tejo": {
    nombre: { en: "Yew teaspoon", sl: "Tisova žlička" },
    procedencia: { en: "From the hundred-year yew of the old cemetery — wood hard as few others; it took Erik three evenings to tame it.", sl: "Iz stoletne tise pri starem pokopališču — les, trd kot le malokateri; Erik ga je krotil tri večere." },
  },
  "cuchara-fresno": {
    nombre: { en: "Ash teaspoon", sl: "Jesenova žlička" },
    procedencia: { en: "Ash from the river path, straight and honest grain: the spoon Erik gives to his carpenter friends.", sl: "Jesen s poti ob reki, ravne in poštene letnice: žlička, ki jo Erik podarja prijateljem mizarjem." },
  },
  "cuchara-abedul": {
    nombre: { en: "Birch teaspoon", sl: "Brezova žlička" },
    procedencia: { en: "Pale northern birch; so light it seems about to fly — Petra's favourite for honey.", sl: "Svetla breza s severa; tako lahka, da bi kmalu poletela — Petrina najljubša za med." },
  },
  "cuchara-ciruelo": {
    nombre: { en: "Plum-wood teaspoon", sl: "Slivova žlička" },
    procedencia: { en: "From the plum tree that gave three summers of jam; its reddish heart shows in the handle.", sl: "Iz slive, ki je dala marmelade treh poletij; njeno rdečkasto jedro se pokaže v ročaju." },
  },
  "queso-casa": {
    nombre: { en: "Homemade cheese", sl: "Domači sir" },
    procedencia: { en: "Raw milk from the neighbour's cows, curdled in the home kitchen and aged six weeks in the cellar.", sl: "Surovo mleko sosedovih krav, usirjeno v domači kuhinji in šest tednov zorjeno v kleti." },
  },
  "chorizo-valle": {
    nombre: { en: "Valley chorizo", sl: "Klobasa iz doline" },
    procedencia: { en: "From the village butcher, smoked over beech wood; made only in the cold months.", sl: "Od vaškega mesarja, prekajena na bukovih drveh; dela se samo v mrzlih mesecih." },
  },
  "lomo-curado": {
    nombre: { en: "Air-cured loin", sl: "Sušen svinjski file" },
    procedencia: { en: "Cured in mountain air through the whole autumn, with no more hurry than the weather's.", sl: "Sušen v gorskem zraku vso jesen, brez druge naglice kot vremenske." },
  },
  "limonada-frambuesa": {
    nombre: { en: "Raspberry lemonade", sl: "Malinova limonada" },
    procedencia: { en: "The lemons come from Petra's aunt's orchard by the sea; the raspberries from the forest edge at home, picked that same morning.", sl: "Limone so iz sadovnjaka Petrine tete ob morju; maline z domačega gozdnega roba, nabrane isto jutro." },
  },
  "miel-flores": {
    nombre: { en: "Wildflower honey", sl: "Cvetlični med" },
    procedencia: { en: "From the hives of the high meadow, spring harvest: a thousand flowers and no two alike.", sl: "Iz panjev na visokem travniku, pomladno točenje: tisoč cvetov in nobeden enak." },
  },
  "miel-castano": {
    nombre: { en: "Chestnut honey", sl: "Kostanjev med" },
    procedencia: { en: "Dark and serious, from the October chestnut grove; bitter exactly the right amount.", sl: "Temen in resen, iz oktobrskega kostanjevega gozda; grenak ravno prav, da je lep." },
  },
  "queso-fresco-hierbas": {
    nombre: { en: "Fresh herb cheese", sl: "Svež sir z zelišči" },
    procedencia: { en: "Fresh that day, rolled in garden thyme and rosemary — made every market morning.", sl: "Svež še isti dan, povaljan v vrtnem timijanu in rožmarinu — nastane vsako tržno jutro." },
  },
  "queso-curado-6m": {
    nombre: { en: "Six-month aged cheese", sl: "Sir, zorjen šest mesecev" },
    procedencia: { en: "Six months in the cellar, turned every week; the rind tastes of cave and patience.", sl: "Šest mesecev v kleti, obrnjen vsak teden; skorja ima okus po jami in potrpljenju." },
  },
  "queso-azul-cueva": {
    nombre: { en: "Cave blue cheese", sl: "Jamski modri sir" },
    procedencia: { en: "It ripens in the stream grotto, where the blue is added by the mountain itself.", sl: "Zori v votlini ob potoku, kjer modrino doda kar gora sama." },
  },
  "cecina-sierra": {
    nombre: { en: "Mountain cured beef", sl: "Goveji pršut" },
    procedencia: { en: "Cured in the dry mountain wind for a whole winter; sliced thin as paper.", sl: "Sušen v suhem gorskem vetru celo zimo; reže se tanko kot papir." },
  },
  "salchichon-caza": {
    nombre: { en: "Wild game salami", sl: "Divjačinska salama" },
    procedencia: { en: "From the valley's autumn hunt, with peppercorns ground in the home mortar.", sl: "Iz jesenskega lova v dolini, s poprom v zrnu, zmletim v domačem možnarju." },
  },
  "miel-brezo": {
    nombre: { en: "Heather honey", sl: "Vresov med" },
    procedencia: { en: "From the hives that climb the moor when heather pinks the hills: dark and full of character.", sl: "Iz panjev, ki se povzpnejo na pobočja, ko vresa griče obarva rožnato: temen in značajen." },
  },
  "miel-bosque": {
    nombre: { en: "Forest honey", sl: "Gozdni med" },
    procedencia: { en: "Oak and fir honeydew, nearly black: the honey bees make from the forest itself.", sl: "Mana hrasta in jelke, skoraj črna: med, ki ga čebele naredijo iz samega gozda." },
  },
};

// ── PLANTAS (nombre común; el latín no se traduce) ───────────────────────────
export const TR_PLANTS: Record<string, Tr> = {
  manzanilla: { en: "Chamomile", sl: "Kamilica" },
  melisa: { en: "Lemon balm", sl: "Melisa" },
  tila: { en: "Linden blossom", sl: "Lipovo cvetje" },
  lavanda: { en: "Lavender", sl: "Sivka" },
  menta: { en: "Peppermint", sl: "Poprova meta" },
  hinojo: { en: "Fennel", sl: "Komarček" },
  anis: { en: "Anise", sl: "Janež" },
  jengibre: { en: "Ginger", sl: "Ingver" },
  escaramujo: { en: "Rosehip", sl: "Šipek" },
  "saúco": { en: "Elderflower", sl: "Bezgov cvet" },
  tomillo: { en: "Thyme", sl: "Timijan" },
  salvia: { en: "Sage", sl: "Žajbelj" },
  ortiga: { en: "Nettle", sl: "Kopriva" },
  colacaballo: { en: "Horsetail", sl: "Njivska preslica" },
  romero: { en: "Rosemary", sl: "Rožmarin" },
  hierbaluisa: { en: "Lemon verbena", sl: "Limonska verbena" },
  calendula: { en: "Calendula", sl: "Ognjič" },
  rooibos: { en: "Rooibos", sl: "Rooibos" },
  canela: { en: "Ceylon cinnamon", sl: "Cejlonski cimet" },
  cardamomo: { en: "Cardamom", sl: "Kardamom" },
  rosa: { en: "Rose petals", sl: "Cvetni listi vrtnice" },
  azahar: { en: "Orange blossom", sl: "Pomarančni cvet" },
  regaliz: { en: "Licorice root", sl: "Sladki koren" },
  frambuesa: { en: "Raspberry leaf", sl: "Malinov list" },
  hibisco: { en: "Hibiscus", sl: "Hibiskus" },
  jazmin: { en: "Jasmine", sl: "Jasmin" },
  verbena: { en: "Vervain", sl: "Sporiš" },
  amapola: { en: "Poppy", sl: "Poljski mak" },
  aciano: { en: "Cornflower", sl: "Plavica" },
  naranjaseca: { en: "Dried orange", sl: "Posušena pomaranča" },
  manzanaseca: { en: "Dried apple", sl: "Posušeno jabolko" },
  curcuma: { en: "Turmeric", sl: "Kurkuma" },
  jengibrenegro: { en: "Black ginger", sl: "Črni ingver" },
  hiperico: { en: "St John's wort", sl: "Šentjanževka" },
  milenrama: { en: "Yarrow", sl: "Rman" },
  malva: { en: "Mallow", sl: "Slez" },
  brezo: { en: "Heather", sl: "Vresa" },
  abeto: { en: "Fir tips", sl: "Jelovi vršički" },
  laurel: { en: "Bay leaf", sl: "Lovor" },
  eucalipto: { en: "Eucalyptus", sl: "Evkaliptus" },
};

// ── CUPONES ──────────────────────────────────────────────────────────────────
export const TR_CUPONES: Record<string, Tr> = {
  PETRA10: { en: "10% welcome discount", sl: "10 % popusta za dobrodošlico" },
  ERIK5: { en: "€5 off", sl: "5 € popusta" },
  TEPREMIUM15: { en: "15% off your first premium order", sl: "15 % popusta pri prvem premium nakupu" },
};

// ── ESTACIONES ───────────────────────────────────────────────────────────────
const ESTACIONES: Record<Estacion, Record<Lang, string>> = {
  primavera: { es: "primavera", en: "spring", sl: "pomlad" },
  verano: { es: "verano", en: "summer", sl: "poletje" },
  otono: { es: "otoño", en: "autumn", sl: "jesen" },
  invierno: { es: "invierno", en: "winter", sl: "zima" },
};
const TODO_EL_ANO: Record<Lang, string> = { es: "todo el año", en: "all year round", sl: "vse leto" };

// ── HELPERS (fallback ES siempre: si falta la traducción, se ve el original) ─
export function trTea(t: Tea, lang: Lang): Tea {
  if (lang === "es") return t;
  const translated = t.traducciones?.[lang];
  const d = t.editado ? undefined : TR_TEAS[t.id];
  return {
    ...t,
    nombre: translated?.nombre?.trim() || d?.nombre?.[lang] || t.nombre,
    paraQueSirve: translated?.paraQueSirve?.trim() || d?.paraQueSirve?.[lang] || t.paraQueSirve,
    plantas: t.plantas.map((p) => ({
      ...p,
      porQueEnEsteMix: translated?.plantas?.[p.plantaId]?.trim() || d?.plantas?.[p.plantaId]?.[lang] || p.porQueEnEsteMix,
    })),
  };
}

export function trCaja(c: CajaTemporada, lang: Lang): CajaTemporada {
  if (lang === "es") return c;
  const d = TR_CAJAS[c.id];
  if (!d) return c;
  return {
    ...c,
    nombre: d.nombre?.[lang] ?? c.nombre,
    descripcion: d.descripcion?.[lang] ?? c.descripcion,
  };
}

export function trExtra(e: Extra, lang: Lang): Extra {
  if (lang === "es") return e;
  const d = TR_EXTRAS[e.id];
  if (!d) return e; // extras publicados desde el taller → ES
  return {
    ...e,
    nombre: d.nombre?.[lang] ?? e.nombre,
    procedencia: d.procedencia?.[lang] ?? e.procedencia,
  };
}

export function trPlanta(p: Plant, lang: Lang): Plant {
  if (lang === "es") return p;
  if (p.nombres?.[lang]) return { ...p, nombre: p.nombres[lang] };
  const d = TR_PLANTS[p.id];
  if (!d) return p;
  return { ...p, nombre: d[lang] ?? p.nombre };
}

export function trCupon(c: Cupon, lang: Lang): Cupon {
  if (lang === "es") return c;
  const d = TR_CUPONES[c.codigo];
  if (!d) return c;
  return { ...c, descripcion: d[lang] ?? c.descripcion };
}

export const nombreEstacion = (e: Estacion, lang: Lang): string => ESTACIONES[e][lang];
export const todoElAno = (lang: Lang): string => TODO_EL_ANO[lang];
