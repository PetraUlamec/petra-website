import FaqClasica from "./FaqClasica";
import { metaClasica } from "../_meta";
export const metadata = metaClasica("/clasica/faq", "Preguntas de verdad", "Envíos, frescura, la cucharita sorpresa y cómo cuidar tus mezclas: las preguntas que nos hacen de verdad, respondidas desde la casa.");
export default function Page() { return <FaqClasica />; }
