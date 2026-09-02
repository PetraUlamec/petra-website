import DespensaClasica from "./DespensaClasica";
import { metaClasica } from "../_meta";
export const metadata = metaClasica("/clasica/despensa", "La despensa", "Lo que hay ahora mismo en las baldas de la casa, estación a estación: quesos, mieles, limonada, y cuánto queda de cada cosa.");
export default function Page() { return <DespensaClasica />; }
