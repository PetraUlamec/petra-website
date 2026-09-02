import type { Metadata, Viewport } from "next";
import { Fraunces, Karla } from "next/font/google";
import "./globals.css";
import { T } from "@/i18n/es";
import Menu from "@/components/hud/Menu";
import { LangProvider } from "@/i18n";
import { OrgJsonLd } from "@/components/JsonLd";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });
const karla = Karla({ subsets: ["latin"], variable: "--font-karla" });

// El dominio real se pone en NEXT_PUBLIC_SITE_URL cuando SER lo tenga; en local resuelve canonical/og contra :3111.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3111";
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${T.marca} — ${T.tienda}`, template: `%s · ${T.marca}` },
  description:
    "Casa de té de Petra + Erik: mezclas de plantas hechas en casa, cucharitas de madera talladas a mano y cajas de temporada. Una tienda pequeña por la que se pasea.",
  openGraph: {
    siteName: `${T.marca} — ${T.tienda}`, locale: "es_ES", type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: `${T.marca} — ${T.tienda} · Ajdovščina` }],
  },
  icons: { icon: [{ url: "/favicon.svg", type: "image/svg+xml" }, { url: "/favicon.ico", sizes: "48x48" }], apple: "/apple-touch-icon.png" },
  manifest: "/manifest.webmanifest",
};
export const viewport: Viewport = { themeColor: "#3a2513" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${fraunces.variable} ${karla.variable}`}>
      <body>
        <OrgJsonLd />
        <LangProvider>
          <Menu />
          {children}
        </LangProvider>
      </body>
    </html>
  );
}
