import type { MetadataRoute } from "next";
const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3111";
export default function robots(): MetadataRoute.Robots {
  return {
    // cestas, recibos, el taller de Petra y la API no son páginas para buscar
    rules: { userAgent: "*", allow: "/", disallow: ["/carrito", "/clasica/cesta", "/gracias", "/taller-privado", "/api/"] },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
