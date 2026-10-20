// Siluetas botánicas de lámina de herbario — dibujadas a trazo, una por forma real del catálogo.
// El realismo no es foto: es el lenguaje de las láminas botánicas (trazo, latín, anotación).
import type { FormaPlanta } from "@/lib/types";
import { botanicalArt } from "@/data/botanicalArt";

function Tallo({ h = 60 }: { h?: number }) {
  return <path d={`M50 ${95} C ${48} ${95 - h * 0.4}, ${52} ${95 - h * 0.7}, 50 ${95 - h}`} fill="none" strokeWidth="1.6" />;
}

const FORMAS: Record<FormaPlanta, (c: string, c2?: string) => React.ReactNode> = {
  'te-seco': (color) => <>
    {[[29,28,-45],[61,25,30],[42,51,10],[72,60,-40],[25,74,50],[56,81,70]].map(([horizontal, vertical, angle], index) => <g key={index} transform={`translate(${horizontal} ${vertical}) rotate(${angle})`}>
      <path d="M0 -17 Q12 -8 4 4 Q-5 13 0 18 Q-13 7 -5 -5 Q0 -11 0 -17Z" fill={color} fillOpacity=".65" strokeWidth="1" />
      <path d="M0 -12 Q5 -2 -2 10" fill="none" strokeWidth=".7" />
    </g>)}
  </>,
  'te-bola': (color) => <>
    {[[29,30],[58,24],[45,53],[73,55],[24,75],[60,81]].map(([horizontal, vertical], index) => <g key={index}>
      <circle cx={horizontal} cy={vertical} r="10" fill={color} fillOpacity=".65" strokeWidth="1.2" />
      <path d={`M${horizontal-6} ${vertical+3} Q${horizontal+9} ${vertical+1} ${horizontal+1} ${vertical-6}`} fill="none" strokeWidth=".7" />
    </g>)}
  </>,
  polvo: (color) => <>
    <path d="M13 73 Q25 66 35 47 Q48 30 59 50 Q69 66 87 73 Q53 91 13 73Z" fill={color} fillOpacity=".7" strokeWidth="1.2" />
    {Array.from({ length: 18 }, (_, index) => <circle key={index} cx={22+index*17%56} cy={64+index*7%14} r=".8" fill={color} stroke="none" />)}
    <path d="M34 65 Q46 41 54 53" fill="none" stroke="#fff5da" strokeWidth="1" />
  </>,
  trozos: (color, edge) => <>
    {[[10,15,-14],[49,17,12],[25,54,25]].map(([horizontal, vertical, angle], index) => <g key={index} transform={`translate(${horizontal} ${vertical}) rotate(${angle} 15 14)`}>
      <path d="M3 7 L24 2 L31 23 L12 32 L0 24Z" fill={color} fillOpacity=".65" strokeWidth="1.1" />
      <path d="M3 7 L12 15 L24 2 M12 15 L12 32 M12 15 L31 23" fill="none" stroke={edge || color} strokeWidth=".8" />
    </g>)}
  </>,
  citrico: (color, rind) => <>
    <circle cx="50" cy="49" r="33" fill={color} fillOpacity=".5" stroke={rind || color} strokeWidth="5" />
    <circle cx="50" cy="49" r="28" fill="none" stroke="#fff8df" strokeWidth="2" />
    {Array.from({ length: 9 }, (_, index) => <path key={index} d="M50 45 L50 22" transform={`rotate(${index*40} 50 49)`} stroke="#fff8df" strokeWidth="2" />)}
    <circle cx="50" cy="49" r="4" fill="#fff8df" stroke="none" />
  </>,
  frambuesa: (color) => <>
    {[[40,24],[53,24],[33,35],[46,35],[59,35],[29,47],[42,47],[55,47],[66,47],[33,59],[46,59],[59,59],[40,70],[52,70]].map(([horizontal, vertical], index) => <circle key={index} cx={horizontal} cy={vertical} r="7" fill={color} fillOpacity=".65" strokeWidth=".9" />)}
    <path d="M37 18 L45 12 L54 18" fill="none" strokeWidth="1.1" />
  </>,
  estrella: (color) => <>
    {Array.from({ length: 8 }, (_, index) => <g key={index} transform={`rotate(${index*45} 50 50)`}>
      <path d="M50 50 Q35 31 50 12 Q65 31 50 50Z" fill={color} fillOpacity=".65" strokeWidth="1.1" />
      <path d="M50 45 L50 19" strokeWidth=".8" /><ellipse cx="50" cy="31" rx="3" ry="6" fill="#6f452e" stroke="none" />
    </g>)}
  </>,
  clavo: (color) => <>
    {[[-15,0,-20],[14,13,25]].map(([horizontal, vertical, angle], index) => <g key={index} transform={`translate(${horizontal} ${vertical}) rotate(${angle} 50 50)`}>
      <path d="M44 37 L47 78 Q50 84 53 78 L56 37Z" fill={color} fillOpacity=".65" strokeWidth="1.1" />
      <path d="M42 36 L40 28 L48 29 L50 22 L55 29 L62 28 L58 37Z" fill={color} fillOpacity=".7" strokeWidth="1.1" />
      <circle cx="50" cy="27" r="7" fill={color} strokeWidth="1" />
    </g>)}
  </>,
  coco: (color, rind) => <>
    {[[0,0,-12],[17,34,24]].map(([horizontal, vertical, angle], index) => <g key={index} transform={`translate(${horizontal} ${vertical}) rotate(${angle} 40 35)`}>
      <path d="M18 23 Q47 33 70 19 L64 40 Q42 54 13 37Z" fill={color} strokeWidth="1.1" />
      <path d="M13 37 Q42 54 64 40 L63 44 Q40 58 12 41Z" fill={rind || '#aa845d'} strokeWidth=".7" />
    </g>)}
  </>,
  grano: (color) => <>
    {[[25,29,30],[52,24,-20],[72,47,50],[41,51,10],[25,76,-40],[59,78,55]].map(([horizontal, vertical, angle], index) => <g key={index} transform={`translate(${horizontal} ${vertical}) rotate(${angle})`}>
      <ellipse rx="5" ry="13" fill={color} fillOpacity=".65" strokeWidth="1" /><path d="M0 -9 L0 9" fill="none" strokeWidth=".6" />
    </g>)}
  </>,
  nuez: (color) => <>
    {[[0,0,-18],[23,27,25]].map(([horizontal, vertical, angle], index) => <g key={index} transform={`translate(${horizontal} ${vertical}) rotate(${angle} 40 40)`}>
      <path d="M40 15 Q69 42 40 65 Q11 42 40 15Z" fill={color} fillOpacity=".6" strokeWidth="1.2" />
      <path d="M40 23 Q30 43 40 57 M45 26 Q52 41 45 53" fill="none" strokeWidth=".7" />
    </g>)}
  </>,
  hebras: (color) => <>
    {Array.from({ length: 9 }, (_, index) => <path key={index} d={`M${18+index*7} ${78-index%3*8} Q${30+index*5} 49 ${21+index*7} ${18+index%4*5}`} fill="none" stroke={color} strokeWidth="2.6" />)}
  </>,
  rizoma: (color) => <>
    <path d="M18 57 Q11 45 25 40 L34 41 L31 27 Q34 18 43 25 L48 42 L57 38 L61 23 Q70 16 73 28 L69 46 Q88 43 87 55 Q87 66 71 65 L59 61 L57 78 Q49 88 43 77 L42 61 L29 66 Q19 68 18 57Z" fill={color} fillOpacity=".5" strokeWidth="1.4" />
    <path d="M24 43 L26 60 M34 43 L36 60 M47 47 L49 62 M60 44 L63 60 M34 31 L42 29 M62 32 L70 34" fill="none" strokeWidth=".8" opacity=".7" />
    <ellipse cx="80" cy="77" rx="10" ry="7" fill="#f1d9a2" strokeWidth="1.5" />
  </>,
  piel: (color) => <>
    <path d="M16 39 Q29 12 54 17 L65 31 Q39 23 30 49 Z" fill={color} fillOpacity=".72" strokeWidth="1.2" />
    <path d="M30 49 Q39 23 65 31 L62 36 Q43 29 34 54 Z" fill="#fff5d1" strokeWidth=".8" />
    <path d="M37 64 Q59 38 80 48 L88 62 Q68 52 49 79 Z" fill={color} fillOpacity=".75" strokeWidth="1.2" />
    <path d="M49 79 Q68 52 88 62 L84 68 Q69 60 53 83Z" fill="#fff5d1" strokeWidth=".8" />
    {[[26,34],[31,26],[40,23],[48,26],[44,62],[52,55],[61,51],[70,54]].map(([horizontal, vertical], index) => <circle key={index} cx={horizontal} cy={vertical} r=".8" fill="currentColor" stroke="none" opacity=".5" />)}
  </>,
  fresa: (color) => <>
    <path d="M24 31 Q32 15 50 25 Q67 16 77 31 C83 48 62 73 51 85 C37 77 17 49 24 31Z" fill={color} fillOpacity=".65" strokeWidth="1.5" />
    <path d="M50 29 Q39 49 51 73 Q61 48 50 29Z" fill="#f4c1ac" strokeWidth=".7" />
    {[[32,34],[65,33],[28,45],[71,45],[34,56],[65,57],[42,68],[57,70]].map(([horizontal, vertical], index) => <ellipse key={index} cx={horizontal} cy={vertical} rx="1.2" ry="2.3" fill="#f1cc7b" strokeWidth=".5" />)}
  </>,
  caliz: (color) => <>
    <path d="M48 76 Q22 69 27 49 L17 27 L39 42 L44 16 L54 40 L77 22 L69 49 L85 54 L64 66 Q57 79 48 76Z" fill={color} fillOpacity=".65" strokeWidth="1.3" />
    <path d="M49 73 L44 25 M49 73 L23 35 M49 73 L72 30 M49 73 L76 55" fill="none" strokeWidth="1.1" />
  </>,
  petalos: (color) => <>
    {[[0,0,-20],[-19,20,-65],[20,27,30]].map(([horizontal, vertical, angle], index) => <g key={index} transform={`translate(${horizontal} ${vertical}) rotate(${angle} 50 40)`}>
      <path d="M50 62 C44 53 27 49 32 32 Q35 21 49 27 Q64 17 69 32 C74 46 57 57 50 62Z" fill={color} fillOpacity=".45" strokeWidth="1.1" />
      <path d="M50 59 Q44 41 37 33 M50 59 Q55 39 64 30" fill="none" strokeWidth=".6" opacity=".7" />
    </g>)}
  </>,
  "fruta-seca": (color, rind) => <>
    {[[-12, -9, -20], [13, 17, 18]].map(([horizontal, vertical, angle], index) => <g key={index} transform={`translate(${horizontal} ${vertical}) rotate(${angle} 50 50)`}>
      <ellipse cx="50" cy="48" rx="24" ry="29" fill={color} fillOpacity=".55" stroke={rind || color} strokeWidth="3" />
      <ellipse cx="50" cy="48" rx="5" ry="7" fill="#fbf3e4" strokeWidth="1" />
      {[0, 60, 120, 180, 240, 300].map(angle => <path key={angle} d="M50 38 L50 23" transform={`rotate(${angle} 50 48)`} fill="none" strokeWidth=".8" opacity=".6" />)}
    </g>)}
  </>,
  fruta: (color, leaf) => <>
    <path d="M50 32 C26 17 12 43 23 66 C37 93 69 88 80 63 C91 37 70 18 50 32Z" fill={color} fillOpacity=".55" strokeWidth="1.5" />
    <path d="M49 34 Q49 22 56 13 M52 24 Q70 8 76 19 Q67 33 52 24" fill={leaf || color} strokeWidth="1.4" />
    <path d="M30 42 Q24 55 34 68" fill="none" stroke="#fffdf3" strokeWidth="3" />
  </>,
  semilla: (color) => <>
    {[[-18, -14, -30], [10, -8, 25], [-8, 14, -10], [23, 21, 45]].map(([horizontal, vertical, angle], index) => <g key={index} transform={`translate(${horizontal} ${vertical}) rotate(${angle} 50 50)`}>
      <path d="M50 30 Q68 52 50 69 Q32 52 50 30Z" fill={color} fillOpacity=".65" strokeWidth="1.3" />
      <path d="M50 35 L50 64" fill="none" strokeWidth="1" />
    </g>)}
  </>,
  margarita: (c, c2) => (
    <>
      <Tallo h={52} />
      <path d="M42 32 q-8 -3 -9 -11 q8 0 11 7 z M50 28 q-2 -9 4 -15 q4 7 -1 14 z M58 33 q8 -4 10 -12 q-9 0 -12 8 z M45 40 q-9 2 -14 -3 q6 -6 13 -2 z M56 40 q9 2 14 -4 q-7 -5 -13 -1 z" fill="none" strokeWidth="1.3" />
      <circle cx="50" cy="35" r="4.5" fill={c2 || c} stroke="none" opacity="0.9" />
      <path d="M38 70 q10 4 16 -2" fill="none" strokeWidth="1.2" />
    </>
  ),
  espiga: (c) => (
    <>
      <Tallo h={58} />
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i}>
          <ellipse cx={46 - i * 0.6} cy={52 - i * 6} rx="3.1" ry="1.9" fill={c} opacity={0.75 - i * 0.06} stroke="none" transform={`rotate(-24 ${46 - i * 0.6} ${52 - i * 6})`} />
          <ellipse cx={54 + i * 0.6} cy={49 - i * 6} rx="3.1" ry="1.9" fill={c} opacity={0.75 - i * 0.06} stroke="none" transform={`rotate(24 ${54 + i * 0.6} ${49 - i * 6})`} />
        </g>
      ))}
      <path d="M40 78 q6 5 12 0 M48 86 q5 4 10 -1" fill="none" strokeWidth="1.1" />
    </>
  ),
  hoja: (c) => (
    <>
      <Tallo h={55} />
      <path d="M50 40 C 34 36, 30 22, 38 12 C 50 16, 56 28, 50 40 Z" fill={c} opacity="0.22" strokeWidth="1.4" />
      <path d="M50 40 C 34 36, 30 22, 38 12 C 50 16, 56 28, 50 40 Z M46 34 L 40 20" fill="none" strokeWidth="1.4" />
      <path d="M50 62 C 64 60, 70 48, 64 38 C 53 41, 47 52, 50 62 Z M55 56 L 62 44" fill="none" strokeWidth="1.3" />
      <path d="M50 62 C 64 60, 70 48, 64 38 C 53 41, 47 52, 50 62 Z" fill={c} opacity="0.16" stroke="none" />
    </>
  ),
  baya: (c, c2) => (
    <>
      <Tallo h={50} />
      <path d="M50 45 q-12 -2 -16 -12 q10 -3 16 5 z" fill={c} opacity="0.2" strokeWidth="1.3" />
      <path d="M50 45 q-12 -2 -16 -12 q10 -3 16 5 z" fill="none" strokeWidth="1.3" />
      <circle cx="57" cy="34" r="5" fill={c2 || c} stroke="none" opacity="0.85" />
      <circle cx="64" cy="42" r="4.2" fill={c2 || c} stroke="none" opacity="0.7" />
      <circle cx="59" cy="47" r="3.6" fill={c2 || c} stroke="none" opacity="0.8" />
      <circle cx="57" cy="34" r="5" fill="none" strokeWidth="1" />
    </>
  ),
  umbela: (c, c2) => (
    <>
      <Tallo h={55} />
      {[-14, -7, 0, 7, 14].map((dx, i) => (
        <g key={i}>
          <path d={`M50 40 L ${50 + dx} 26`} fill="none" strokeWidth="1" />
          <circle cx={50 + dx} cy={24} r="2.6" fill={c2 || c} stroke="none" opacity="0.8" />
          <circle cx={50 + dx * 1.15} cy={20} r="1.7" fill={c2 || c} stroke="none" opacity="0.6" />
        </g>
      ))}
    </>
  ),
  aguja: (c) => (
    <>
      <Tallo h={60} />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <path key={i} d={`M50 ${78 - i * 7} L ${38 - i} ${70 - i * 7} M50 ${78 - i * 7} L ${62 + i} ${69 - i * 7}`} fill="none" strokeWidth="1.1" opacity={0.85 - i * 0.07} />
      ))}
    </>
  ),
  raiz: (c) => (
    <>
      <path d="M44 19 Q40 37 45 49 L38 64 L42 80 L49 62 L52 49 Q61 37 58 20Z" fill={c} fillOpacity=".5" strokeWidth="1.4" />
      <path d="M44 39 Q23 42 27 59 L18 70 M53 50 Q74 52 70 71 L79 82 M42 66 L31 83 M48 60 L54 91 M28 57 L36 67 M70 69 L63 83" fill="none" strokeWidth="1.5" />
      <path d="M43 28 L57 30 M43 34 L55 36 M45 43 L53 45 M43 53 L49 55" fill="none" strokeWidth=".7" />
      <ellipse cx="51" cy="20" rx="7" ry="3" fill="#ebd9b0" strokeWidth="1" />
    </>
  ),
  corteza: (c) => (
    <>
      <path d="M40 18 C 36 40, 44 60, 38 88 L 46 88 C 52 60, 44 40, 48 18 Z" fill={c} opacity="0.2" strokeWidth="1.4" />
      <path d="M40 18 C 36 40, 44 60, 38 88 L 46 88 C 52 60, 44 40, 48 18 Z" fill="none" strokeWidth="1.4" />
      <path d="M56 24 C 60 44, 54 64, 60 84" fill="none" strokeWidth="1.6" />
      <path d="M42 34 q3 2 5 0 M40 52 q3 2 5 0 M41 70 q3 2 5 0" fill="none" strokeWidth="1" />
    </>
  ),
  vaina: (c, c2) => (
    <>
      <Tallo h={48} />
      <path d="M50 46 C 40 38, 38 24, 46 14 C 56 20, 58 36, 50 46 Z" fill={c} opacity="0.18" strokeWidth="1.4" />
      <path d="M50 46 C 40 38, 38 24, 46 14 C 56 20, 58 36, 50 46 Z" fill="none" strokeWidth="1.4" />
      {[0, 1, 2].map((i) => <circle key={i} cx={47.5 + i * 1.5} cy={38 - i * 8} r="1.8" fill={c2 || c} stroke="none" opacity="0.8" />)}
    </>
  ),
  flor5: (c, c2) => (
    <>
      <Tallo h={50} />
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx={50 + Math.cos(((a - 90) * Math.PI) / 180) * 8} cy={38 + Math.sin(((a - 90) * Math.PI) / 180) * 8}
          rx="5" ry="3.4" fill={c2 || c} opacity="0.55" stroke="currentColor" strokeWidth="0.9"
          transform={`rotate(${a} ${50 + Math.cos(((a - 90) * Math.PI) / 180) * 8} ${38 + Math.sin(((a - 90) * Math.PI) / 180) * 8})`} />
      ))}
      <circle cx="50" cy="38" r="3" fill={c} stroke="none" opacity="0.9" />
    </>
  ),
  tallo: (c) => (
    <>
      <Tallo h={62} />
      <path d="M50 70 q-10 -2 -13 -10 M50 55 q10 -3 12 -11 M50 42 q-9 -2 -11 -9" fill="none" strokeWidth="1.3" />
      <ellipse cx="37" cy="59" rx="4.5" ry="2" fill={c} opacity="0.3" stroke="none" transform="rotate(-28 37 59)" />
      <ellipse cx="62" cy="43" rx="4.5" ry="2" fill={c} opacity="0.3" stroke="none" transform="rotate(24 62 43)" />
      <ellipse cx="39" cy="32" rx="4" ry="1.8" fill={c} opacity="0.3" stroke="none" transform="rotate(-24 39 32)" />
    </>
  ),
};

export default function PlantaSVG({ plantId, forma, color, color2, size = 84, dibuja = false }: {
  plantId?: string; forma: FormaPlanta; color: string; color2?: string; size?: number; dibuja?: boolean;
}) {
  const marks = plantId ? botanicalArt(plantId, color, color2 || color) : null;
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden data-ingredient={plantId}
      className={dibuja ? "lamina-dibuja" : undefined}
      style={{ color: "var(--tinta-suave, #4a3826)" }} stroke="currentColor" strokeLinecap="round">
      {marks ? marks.map((mark, index) => <path key={index} d={mark.d} fill={mark.fill} stroke={mark.stroke} strokeWidth={mark.width} transform={mark.transform} />) : (FORMAS[forma] || FORMAS.hoja)(color, color2)}
    </svg>
  );
}
