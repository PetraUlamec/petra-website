import type { Metadata } from "next";
import { TEAS } from "@/data/teas";
import FichaVivaOEstatica from "./FichaViva";
import { metaClasica } from "../../_meta";

export function generateStaticParams() {
  return TEAS.map((t) => ({ id: t.id }));
}
export const dynamicParams = true; // los tés publicados desde el taller también tienen ficha

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const tea = TEAS.find((t) => t.id === id); // los tés del taller resuelven en cliente
  if (!tea) return metaClasica(`/clasica/tes/${id}`, "Té de la casa", "Una mezcla de plantas de Petra, con la composición y la historia de sus ingredientes.");
  return metaClasica(`/clasica/tes/${tea.id}`, tea.nombre,
    `${tea.paraQueSirve} Mezcla de ${tea.plantas.length} plantas, cada una con su porqué.`);
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <FichaVivaOEstatica id={id} />;
}
