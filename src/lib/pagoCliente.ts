export async function iniciarPago(lines: unknown, cupon: string | null, email: string, clasica: boolean) {
  const response = await fetch("/api/checkout", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lines, cupon, email, clasica }),
  });
  const result = await response.json();
  if (!response.ok || typeof result.url !== "string") throw new Error(result.error || "No se pudo abrir el pago. Tu cesta sigue guardada.");
  const destination = new URL(result.url);
  if (destination.protocol !== "https:" || destination.hostname !== "checkout.stripe.com") throw new Error("Dirección de pago no válida.");
  window.location.assign(destination.href);
}
