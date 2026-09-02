// Siluetas botánicas de lámina de herbario — dibujadas a trazo, una por forma real del catálogo.
// El realismo no es foto: es el lenguaje de las láminas botánicas (trazo, latín, anotación).
import type { FormaPlanta } from "@/lib/types";

function Tallo({ h = 60 }: { h?: number }) {
  return <path d={`M50 ${95} C ${48} ${95 - h * 0.4}, ${52} ${95 - h * 0.7}, 50 ${95 - h}`} fill="none" strokeWidth="1.6" />;
}

const FORMAS: Record<FormaPlanta, (c: string, c2?: string) => React.ReactNode> = {
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
      <path d="M50 30 C 46 44, 54 52, 49 66 C 46 76, 52 84, 50 92" fill="none" strokeWidth="2.2" />
      <path d="M49 48 q-8 4 -10 12 M51 60 q8 3 9 11 M49 74 q-6 3 -7 9" fill="none" strokeWidth="1.2" />
      <path d="M44 22 q6 -8 6 -14 M50 24 q3 -8 9 -11 M46 24 q-6 -5 -12 -5" fill="none" strokeWidth="1.2" />
      <ellipse cx="50" cy="28" rx="7" ry="4" fill={c} opacity="0.25" stroke="none" />
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

export default function PlantaSVG({ forma, color, color2, size = 84, dibuja = false }: {
  forma: FormaPlanta; color: string; color2?: string; size?: number; dibuja?: boolean;
}) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden
      className={dibuja ? "lamina-dibuja" : undefined}
      style={{ color: "var(--tinta-suave, #4a3826)" }} stroke="currentColor" strokeLinecap="round">
      {(FORMAS[forma] || FORMAS.hoja)(color, color2)}
    </svg>
  );
}
