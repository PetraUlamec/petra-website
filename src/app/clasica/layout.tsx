import type { ReactNode } from "react";
import Nav from "@/components/clasica/Nav";
import Footer from "@/components/clasica/Footer";
import "./clasica.css";

export default function ClasicaLayout({ children }: { children: ReactNode }) {
  return (
    <div className="papel min-h-screen">
      <Nav />
      {children}
      <Footer />
    </div>
  );
}
