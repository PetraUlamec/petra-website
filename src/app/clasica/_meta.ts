// Metadatos de la web clásica en UN sitio: title (la plantilla del layout añade « · Petra + Erik»),
// description, canonical y Open Graph/Twitter con la imagen de la casa (public/og.png, 1200×630).
// Los metadatos los sirve el servidor en ES: el idioma elegido (localStorage) no llega al <head>.
import type { Metadata } from "next";

export const OG_IMAGE = { url: "/og.png", width: 1200, height: 630, alt: "Petra + Erik — Casa de té · Ajdovščina" };

export function metaClasica(path: string, title: string | { absolute: string }, description: string): Metadata {
  const t = typeof title === "string" ? title : title.absolute;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title: t, description, url: path, siteName: "Petra + Erik — Casa de Té", locale: "es_ES", type: "website", images: [OG_IMAGE] },
    twitter: { card: "summary_large_image", title: t, description, images: [OG_IMAGE.url] },
  };
}
