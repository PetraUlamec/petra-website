import CucharasClasica from "./CucharasClasica";
import { metaClasica } from "../_meta";
export const metadata = metaClasica("/clasica/cucharas", "Las cucharas de Erik", "Talladas una a una, no hay dos iguales. Cada caja lleva una escondida, revelada solo en tu entrada.");
export default function Page() { return <CucharasClasica />; }
