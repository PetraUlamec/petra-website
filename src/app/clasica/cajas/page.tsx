import CajasClasica from "./CajasClasica";
import { metaClasica } from "../_meta";
export const metadata = metaClasica("/clasica/cajas", "Cajas de estación", "Cajas estacionales de té con limonada, carne y queso o miel, y una cuchara de Erik al azar. Caja general: té y queso, sin cuchara.");
export default function Page() { return <CajasClasica />; }
