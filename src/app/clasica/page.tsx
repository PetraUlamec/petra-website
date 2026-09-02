import HomeClasica from "./HomeClasica";
import { metaClasica } from "./_meta";

export const metadata = metaClasica("/clasica", { absolute: "Petra + Erik — Casa de té · Ajdovščina" },
  "Mezclas de plantas hechas en casa y cucharas talladas a mano, desde el valle de Vipava. Cajas de estación con una cucharita sorpresa.");

export default function Page() {
  return <HomeClasica />;
}
