import PaginaLegal from "@/components/clasica/PaginaLegal";
import { metaClasica } from "../_meta";
export const metadata = metaClasica("/clasica/privacidad", "Privacidad", "Qué datos tratamos (formulario de contacto, correo del recibo, pago con Stripe o PayPal), con qué base legal, cuánto tiempo y tus derechos RGPD.");
export default function Page() { return <PaginaLegal clave="privacidad" />; }
