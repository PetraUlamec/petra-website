import type { Metadata } from "next";
import AboutScene from "@/scenes/AboutScene";
export const metadata: Metadata = {
  title: "Nosotros",
  description: "Petra hace los tés; Erik talla la madera. Los fundadores de la casa de té.",
};
export default function Page() { return <AboutScene />; }
