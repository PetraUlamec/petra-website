import CestaClasica from "./CestaClasica";
import { metaClasica } from "../_meta";
export const metadata = { ...metaClasica("/clasica/cesta", "Tu cesta", "Tu cesta de la casa: revisa las mezclas y cajas elegidas, aplica tu cupón y paga con tarjeta o PayPal. Envío gratis desde 50 €."), robots: { index: false } };
export default function Page() { return <CestaClasica />; }
