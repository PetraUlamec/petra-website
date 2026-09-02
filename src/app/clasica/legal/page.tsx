import PaginaLegal from "@/components/clasica/PaginaLegal";
import { metaClasica } from "../_meta";
export const metadata = metaClasica("/clasica/legal", "Aviso legal", "Quién está detrás de la tienda de Petra y Erik, qué es esta web, precios con IVA, pagos con Stripe y PayPal y la ley aplicable (Eslovenia y UE).");
export default function Page() { return <PaginaLegal clave="legal" />; }
