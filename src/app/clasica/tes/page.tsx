import CatalogoTes from "./CatalogoTes";
import { metaClasica } from "../_meta";

export const metadata = metaClasica("/clasica/tes", "Los tés",
  "Las mezclas de la casa: cada té con sus plantas y el porqué de cada una. Tés de diario y reservas premium con cucharita sorpresa.");

export default function Page() {
  return <CatalogoTes />;
}
