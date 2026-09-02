import type { MetadataRoute } from "next";
// Manifest de la casa: nombre, iconos y los colores de la madera y el papel.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Petra + Erik — Casa de Té",
    short_name: "Petra + Erik",
    description: "Mezclas de plantas hechas en casa y cucharas talladas a mano, desde Ajdovščina.",
    start_url: "/clasica",
    display: "standalone",
    background_color: "#fdf8ea",
    theme_color: "#3a2513",
    lang: "es",
    icons: [
      { src: "/favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
