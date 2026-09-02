// JSON-LD SEGURO (2-sep-2026, auditoría).
// Los datos estructurados van dentro de un <script>, y JSON.stringify NO escapa "<": si algún
// día un texto del catálogo llega con "</script>", parte la etiqueta. Hoy no es explotable
// (se comprobó con navegador: el contenido queda inerte), pero esto lo cierra de raíz.
export function jsonLdSeguro(datos: unknown): string {
  return JSON.stringify(datos)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/\u2028/g, "\\u2028")   // separadores de línea que rompen el JS
    .replace(/\u2029/g, "\\u2029");
}
