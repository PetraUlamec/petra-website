import type { Metadata } from "next";
import TeaRoom from "@/scenes/TeaRoom";
import { TeasJsonLd } from "@/components/JsonLd";
export const metadata: Metadata = {
  title: "Té Premium",
  description: "La sala del té premium: las reservas de la casa en cosechas pequeñas.",
};
export default function Page() { return (<><TeasJsonLd sala="te-premium" /><TeaRoom sala="te-premium" /></>); }
