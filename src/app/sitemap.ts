import type { MetadataRoute } from "next";
import { TEAS } from "@/data/teas";
// El dominio real se pondrá en NEXT_PUBLIC_SITE_URL cuando SER lo tenga; en local sirve para validar la estructura.
const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3111";

export default function sitemap(): MetadataRoute.Sitemap {
  const hoy = new Date();
  const u = (p: string, priority: number, changeFrequency: "weekly" | "monthly" | "yearly" = "weekly"): MetadataRoute.Sitemap[number] =>
    ({ url: `${BASE}${p}`, lastModified: hoy, changeFrequency, priority });
  return [
    // la tienda en 3D (el diorama)
    u("/", 1), u("/salon", 0.6), u("/te", 0.8), u("/te-premium", 0.8), u("/nosotros", 0.5), u("/contacto", 0.4),
    // la web clásica
    u("/clasica", 0.9), u("/clasica/tes", 0.9), u("/clasica/cajas", 0.8), u("/clasica/despensa", 0.6),
    u("/clasica/cucharas", 0.6), u("/clasica/nosotros", 0.5), u("/clasica/faq", 0.4, "monthly"),
    u("/clasica/envios", 0.4, "monthly"), u("/clasica/contacto", 0.4, "monthly"),
    // fichas de todos los tés del catálogo canónico (src/data/teas.ts)
    ...TEAS.map((t) => u(`/clasica/tes/${t.id}`, 0.7)),
    // lo legal
    u("/clasica/legal", 0.2, "yearly"), u("/clasica/privacidad", 0.2, "yearly"),
    u("/clasica/cookies", 0.2, "yearly"), u("/clasica/devoluciones", 0.3, "yearly"),
  ];
}
