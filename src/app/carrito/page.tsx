import type { Metadata } from "next";
import CartScene from "@/scenes/CartScene";
export const metadata: Metadata = { title: "Tu cesta", description: "La cesta de la compra de la casa de té." };
export default function Page() { return <CartScene />; }
