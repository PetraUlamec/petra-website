import Stripe from "stripe";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { Resend } from "resend";

export interface ReciboConfirmado {
  entrada: string; fecha: string; test: boolean;
  lineas: { nombre: string; qty: number; precio: number }[];
  sub: number; disc: number; ship: number; total: number;
}
interface Pedido {
  recibo: ReciboConfirmado; email: string | null; entrega: unknown;
  clienteEnviado?: boolean; tiendaEnviado?: boolean;
}
const active = new Map<string, Promise<void>>();

export async function leerPago(stripe: Stripe, id: string) {
  if (!/^cs_(?:test|live)_[A-Za-z0-9]{10,200}$/.test(id)) throw new Error("invalid_session");
  const session = await stripe.checkout.sessions.retrieve(id);
  if (session.metadata?.app !== "petra" || session.payment_status !== "paid" || session.currency !== "eur") return null;
  const lineas: ReciboConfirmado["lineas"] = [];
  for await (const item of stripe.checkout.sessions.listLineItems(id, { limit: 100 })) {
    lineas.push({ nombre: item.description || "Petra", qty: item.quantity || 1, precio: item.amount_subtotal / (item.quantity || 1) / 100 });
  }
  return {
    recibo: { entrada: session.id, fecha: new Date(session.created * 1000).toISOString(), test: !session.livemode, lineas,
      sub: (session.amount_subtotal || 0) / 100, disc: (session.total_details?.amount_discount || 0) / 100,
      ship: (session.total_details?.amount_shipping || 0) / 100, total: (session.amount_total || 0) / 100 },
    email: session.customer_details?.email || session.customer_email,
    entrega: session.collected_information?.shipping_details || session.customer_details,
  } satisfies Pedido;
}

async function guardar(file: string, order: Pedido) {
  await fs.mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
  const temporary = `${file}.${randomUUID()}.tmp`;
  await fs.writeFile(temporary, JSON.stringify(order), { mode: 0o600 });
  await fs.rename(temporary, file);
}

async function procesar(stripe: Stripe, id: string) {
  const paid = await leerPago(stripe, id);
  if (!paid) return;
  const file = path.join(process.cwd(), "data", "pedidos", `${id}.json`);
  let order: Pedido;
  try { order = JSON.parse(await fs.readFile(file, "utf8")); }
  catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; order = paid; await guardar(file, order); }
  const key = process.env.RESEND_API_KEY, from = process.env.PEDIDOS_EMAIL_FROM, to = process.env.PEDIDOS_EMAIL_TO;
  if (!key || !from || !to) throw new Error("mail_not_configured");
  const resend = new Resend(key);
  const receipt = order.recibo;
  const total = `${receipt.total.toFixed(2)} EUR`;
  const text = `${receipt.test ? "TEST / PRUEBA / PREIZKUS — NO ENVIAR PRODUCTOS\n\n" : ""}Petra & Erik\n${receipt.entrada}\n${receipt.fecha}\n\n${receipt.lineas.map((item) => `${item.qty} × ${item.nombre} — ${(item.precio * item.qty).toFixed(2)} EUR`).join("\n")}\n\nTotal: ${total}\nDelivery / Dostava / Envío: ${receipt.ship.toFixed(2)} EUR`;
  if (order.email && !order.clienteEnviado) {
    const result = await resend.emails.send({ from, to: order.email, subject: `${receipt.test ? "[TEST] " : ""}Petra & Erik — ${total}`, text }, { idempotencyKey: `petra/customer/${id}` });
    if (result.error) throw new Error("customer_email_failed");
    order.clienteEnviado = true; await guardar(file, order);
  }
  if (!order.tiendaEnviado) {
    const result = await resend.emails.send({ from, to, subject: `${receipt.test ? "[TEST — NO ENVIAR] " : ""}Pedido Petra — ${total}`, text: `${text}\n\nCliente: ${order.email || "—"}\nEntrega:\n${JSON.stringify(order.entrega, null, 2)}` }, { idempotencyKey: `petra/merchant/${id}` });
    if (result.error) throw new Error("merchant_email_failed");
    order.tiendaEnviado = true; await guardar(file, order);
  }
}

export function confirmarPedido(stripe: Stripe, id: string) {
  const existing = active.get(id);
  if (existing) return existing;
  const pending = procesar(stripe, id).finally(() => active.delete(id));
  active.set(id, pending);
  return pending;
}
