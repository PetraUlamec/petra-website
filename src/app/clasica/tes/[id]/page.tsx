import type { Metadata } from "next";
import { catalogoVivo, tesPublicados } from "@/lib/catalogoServidor";
import FichaVivaOEstatica from "./FichaViva";
import { metaClasica } from "../../_meta";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const tea = (await tesPublicados()).find((item) => item.id === id);
  if (!tea) return metaClasica(`/clasica/tes/${id}`, "Té de la casa", "Una mezcla de plantas de Petra, con la composición y la historia de sus ingredientes.");
  return metaClasica(`/clasica/tes/${tea.id}`, tea.nombre,
    `${tea.paraQueSirve} Mezcla de ${tea.plantas.length} plantas, cada una con su porqué.`);
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tea = (await tesPublicados()).find((item) => item.id === id) ?? null;
  return <FichaVivaOEstatica id={id} initialTea={tea} initialPlants={(await catalogoVivo()).plants} />;
}
