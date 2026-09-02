import PaginaLegal from "@/components/clasica/PaginaLegal";
import { metaClasica } from "../_meta";
export const metadata = metaClasica("/clasica/cookies", "Cookies", "Esta web no usa cookies de seguimiento: solo guarda tu cesta y tu idioma en el almacenamiento local del navegador. Lo contamos claro.");
export default function Page() { return <PaginaLegal clave="cookies" />; }
