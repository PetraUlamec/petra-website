import type { NextConfig } from "next";

// CABECERAS DE SEGURIDAD (2-sep-2026, auditoría).
// Antes este fichero estaba vacío: la web no mandaba NINGUNA defensa al navegador (ni CSP, ni
// protección contra que te metan en un iframe, ni nada) y además anunciaba con qué está hecha.
//
// La CSP es la red que atrapa cualquier intento de inyectar código en la página. Se permite
// 'unsafe-inline' porque Next y el 3D insertan estilos y scripts en línea, y blob:/data:
// porque three.js genera texturas y trabajadores en memoria.
const CSP = [
  "default-src 'self'",
  // blob: es imprescindible: three.js/drei cargan sus «workers» (los que descomprimen los
  // modelos 3D) desde blob:. Sin esto la escena se queda sin modelos — comprobado con navegador.
  "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' blob:",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "worker-src 'self' blob: data:",
  "child-src 'self' blob:",
  "media-src 'self' data: blob:",
  "frame-src 'self' https://checkout.stripe.com https://js.stripe.com",
  "form-action 'self' https://checkout.stripe.com",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const CABECERAS = [
  { key: "Content-Security-Policy", value: CSP },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },             // el navegador no adivina tipos
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self)" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  // Solo tiene efecto sobre HTTPS (en producción, detrás del túnel/dominio).
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false, // no anunciar "hecho con Next.js"
  async headers() {
    return [{ source: "/:path*", headers: CABECERAS }];
  },
};

export default nextConfig;
