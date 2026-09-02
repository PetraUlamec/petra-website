import type { Metadata } from "next";
import ContactScene from "@/scenes/ContactScene";
export const metadata: Metadata = { title: "Contacto", description: "Deja una carta sobre el escritorio de la casa de té." };
export default function Page() { return <ContactScene />; }
