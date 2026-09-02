import EnviosClasica from "./EnviosClasica";
import { metaClasica } from "../_meta";
export const metadata = metaClasica("/clasica/envios", "Envíos y devoluciones", "Preparamos pedidos martes y jueves. Eslovenia 2-3 días, resto de la UE 4-7; envío gratis desde 50 €. Devoluciones en 14 días con el producto sin abrir.");
export default function Page() { return <EnviosClasica />; }
