import CajasClasica from "./CajasClasica";
import { metaClasica } from "../_meta";
export const metadata = metaClasica("/clasica/cajas", "Cajas de estación", "La caja de la casa según la estación: té, queso de casa y la cucharita sorpresa de Erik. Fuera de temporada, +15% — lo honesto es decirlo.");
export default function Page() { return <CajasClasica />; }
