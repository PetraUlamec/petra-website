import type { Metadata } from "next";
import TeaRoom from "@/scenes/TeaRoom";
import { TeasJsonLd } from "@/components/JsonLd";
export const metadata: Metadata = {
  title: "Sala de Té",
  description: "Los tés de la casa: mezclas de plantas de Petra, en tarros de cristal. Pasa el ratón por un tarro y se abre.",
};
export default function Page() { return (<><TeasJsonLd sala="te" /><TeaRoom sala="te" /></>); }
