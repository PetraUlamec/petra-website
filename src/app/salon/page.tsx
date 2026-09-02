import type { Metadata } from "next";
import SalonScene from "@/scenes/SalonScene";
export const metadata: Metadata = {
  title: "El salón",
  description: "El salón de la casa de té: las cajas de temporada sobre la mesa y las puertas a las salas de té.",
};
export default function Page() { return <SalonScene />; }
