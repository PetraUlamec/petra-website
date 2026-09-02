import Receipt from "./receipt";
import { metaClasica } from "../clasica/_meta";
export const metadata = { ...metaClasica("/gracias", "Gracias", "Tu entrada numerada a la casa de té: la vista previa del recibo que llegará por correo cuando la tienda esté conectada."), robots: { index: false } };
export default function Page() { return <Receipt />; }
