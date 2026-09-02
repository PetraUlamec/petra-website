"use client";
// EL CARRITO (VISION §2): la despensa. La cesta en el centro y la cuenta al lado.
// Pago en MODO DEMO: la interfaz es la real; Stripe/PayPal se conectan cuando haya dominio (VISION §6).
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SceneShell, { type CamFocus } from "@/components/three/SceneShell";
import Room, { THEMES } from "@/components/three/Room";
import { Shelf, Door } from "@/components/three/Furniture";
import { Sack, CheeseWheel, SausageString, HoneyPot } from "@/components/three/Decor";
import {
  TapBarrel, OnionString, ConserveRow, CheeseCloche, Porthole, HangingHam, AppleBasketStool, ClayTinaja, JamShelf,
  NarrowPantryShelf, BreadStool, SmallJarShelf,
} from "@/components/three/deco/salon";
import { SunPatch, WallSpill } from "@/components/three/LightShaft";
import { Chispas } from "@/components/three/Chispa";
import DecoVivo from "@/components/three/DecoVivo";
import Basket from "@/components/three/Basket";
import { useT } from "@/i18n";
import { eur } from "@/lib/format";
import {
  useCart, linePrice, lineName, cartSubtotal, cartDiscount, cartShipping, ENVIO_GRATIS_DESDE,
} from "@/lib/cart";
import { cuponByCodigo } from "@/data/coupons";
import Guia from "@/components/hud/Guia";
import { cucharas } from "@/data/extras";
import { teaById } from "@/data/teas";

function useBaseZoom() {
  const [z, setZ] = useState(44);
  useEffect(() => {
    const f = () => setZ(Math.min(window.innerWidth / 22, window.innerHeight / 13));
    f();
    window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, []);
  return z;
}

type PayMethod = "tarjeta" | "paypal" | null;

export default function CartScene() {
  const T = useT();
  const router = useRouter();
  const baseZoom = useBaseZoom();
  const { lines, cupon, setQty, remove, clear, setCupon } = useCart();
  const [mounted, setMounted] = useState(false);
  const [code, setCode] = useState("");
  const [codeErr, setCodeErr] = useState(false);
  const [paying, setPaying] = useState<PayMethod>(null);
  const [processing, setProcessing] = useState(false);
  const [email, setEmail] = useState("");
  useEffect(() => setMounted(true), []);

  const sub = cartSubtotal(lines);
  const disc = cartDiscount(sub, cupon);
  const ship = cartShipping(sub - disc);
  const total = Math.round((sub - disc + ship) * 100) / 100;
  const focus: CamFocus = { target: [0.5, 1.1, 1], zoom: baseZoom * 1.15 };

  const confirmPay = async (method: Exclude<PayMethod, null>) => {
    setProcessing(true);
    // checkout REAL si el servidor tiene STRIPE_SECRET_KEY (U5); si no, sigue el demo
    try {
      const r = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines, cupon: cupon?.codigo ?? null }) }).then((x) => x.json());
      if (r.url) { window.location.href = r.url; return; }
    } catch { /* sin red o demo */ }
    // DEMO: aquí irá la Checkout Session real de Stripe (tarjeta y PayPal como payment methods)
    // ¿viaja cuchara sorpresa? — con cajas de temporada y con tés premium (la "?" de Erik)
    const llevaSorpresa = lines.some(
      (l) => l.kind === "caja" || (l.kind === "tea" && teaById(l.id).sala === "te-premium")
    );
    const pool = cucharas();
    const cuchara = llevaSorpresa ? pool[Math.floor(Math.random() * pool.length)] : null;
    const receipt = {
      metodo: method,
      fecha: new Date().toISOString(),
      entrada: `PE-${String(Math.floor(1000 + Math.random() * 9000))}`,
      lineas: lines.map((l) => ({ nombre: lineName(l), qty: l.qty, precio: linePrice(l) })),
      sub, disc, ship, total,
      cupon: cupon?.codigo ?? null,
      cuchara: cuchara ? { nombre: cuchara.nombre, historia: cuchara.procedencia } : null,
      fraseIdx: Math.floor(Math.random() * 4),
    };
    sessionStorage.setItem("petra-last-order", JSON.stringify(receipt));
    // recibo por correo si hay RESEND_API_KEY y el cliente dejó email (fire-and-forget)
    if (email.trim()) {
      const frases = T.gracias.bienvenidas;
      fetch("/api/pedido-email", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...receipt, email: email.trim(), frase: frases[receipt.fraseIdx % frases.length] }) }).catch(() => {});
    }
    setTimeout(() => { clear(); window.location.assign("/gracias"); }, 1400);
  };

  return (
    <main>
      <SceneShell focus={focus} ariaLabel={T.a11y.escena}>
        <Room w={9} d={9} theme={THEMES.despensa} windowX={3.5}>
          <Shelf position={[0, 0, -3.9]} width={5} levels={2} />
          {/* provisiones en la estantería de la despensa */}
          {[0, 1, 2, 3, 4].map((i) => (
            <mesh
              key={i}
              position={i === 0 ? [-0.45, 2.34, -3.8] : [-1.8 + i * 0.9, 1.32, -3.8]}
              castShadow
            >
              <cylinderGeometry args={[0.16, 0.16, 0.34, 12]} />
              <meshStandardMaterial color={["#c98a3b", "#8a4049", "#7c8a5a", "#a65a2e", "#c9b36a"][i]} roughness={0.8} />
            </mesh>
          ))}
          <DecoVivo sala="carrito" />
          <Basket position={[0.5, 0, 1]} />
          {/* Los dos recipientes claros se agrupan ordenadamente en el rincón posterior. */}
          <Sack position={[-3.5, 0.26, -3.4]} />
          <Sack position={[-2.85, 0.24, -3.45]} color="#b99a6b" />
          {/* barra de colgar de la despensa */}
          <mesh position={[-3.55, 3.05, -3.8]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.025, 0.025, 1.8, 8]} />
            <meshStandardMaterial color="#4a2f1a" roughness={0.8} />
          </mesh>
          {[-1, 1].map((sx) => (
            <group key={sx} position={[-3.55 + sx * 0.8 + (sx === 1 ? 0.1 : 0), 3.05, -3.8]}>
              {/* escuadra en L anclada a la pared del fondo */}
              <mesh position={[0, 0, -0.3]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.02, 0.02, 0.6, 6]} />
                <meshStandardMaterial color="#4a2f1a" roughness={0.8} />
              </mesh>
              <mesh position={[0, -0.14, -0.58]}>
                <cylinderGeometry args={[0.018, 0.018, 0.3, 6]} />
                <meshStandardMaterial color="#4a2f1a" roughness={0.8} />
              </mesh>
            </group>
          ))}
          <SausageString position={[-4.15, 3.05, -3.8]} />
          <SausageString position={[-3.5, 3.05, -3.8]} />
          <SausageString position={[-2.9, 3.05, -3.8]} />
          <HoneyPot position={[0.9, 1.24, -3.75]} />
          <HoneyPot position={[1.65, 2.28, -3.75]} />
          {/* El barril se conserva; se retira solamente la pequeña jarra del suelo. */}
          <TapBarrel position={[-3.45, 0, -2.45]} rotY={0.9} withMug={false} />
          <OnionString position={[-3.25, 3.05, -3.8]} />
          <ConserveRow position={[-1.9, 2.2, -3.82]} />
          <CheeseCloche position={[1.05, 2.2, -3.78]} />
          <Porthole position={[-3.5, 3.55, -4.4]} />
          <SunPatch position={[-3.4, 0.02, -3.2]} color="#fff2cf" intensity={0.18} size={[0.85, 1.0]} />
          <SunPatch position={[3.5, 0.02, -2.5]} size={[1.6, 2.4]} intensity={0.5} />
          <WallSpill position={[3.5, 0.72, -4.38]} />
          <Chispas position={[3.5, 2.3, -3.8]} />
          {/* despensa v2 */}
          <HangingHam position={[-3.82, 3.05, -3.8]} />
          <AppleBasketStool position={[2.05, 0, 1.15]} rotY={0.5} />
          <ClayTinaja position={[-3.6, 0, 1.9]} />
          <JamShelf position={[-4.27, 2.3, -2.6]} rotY={Math.PI / 2} />
          {/* densidad v3: la despensa llena de verdad */}
          <NarrowPantryShelf position={[4.28, 0, -2.6]} rotY={-Math.PI / 2} />
          <BreadStool position={[2.0, 0, 0.05]} rotY={0.3} />
          <SmallJarShelf position={[-4.76, 1.9, 1.9]} rotY={Math.PI / 2} />
          <Door position={[-4.35, 1.3, -1]} rotY={Math.PI / 2} color="#8a6a3f" label={T.nav.salon} href="/salon" />
        </Room>
      </SceneShell>

      <Guia sala="carrito" />
      <header className="fixed z-20 top-12 left-3 sm:left-4 pointer-events-none">
        <h1 className="font-display text-2xl sm:text-3xl text-[var(--madera-oscura)] drop-shadow-[0_1px_0_var(--crema)]">
          {T.carrito.titulo}
        </h1>
      </header>

      <aside className="fixed z-20 bottom-3 inset-x-3 sm:inset-x-auto sm:bottom-auto sm:right-4 sm:top-14 sm:w-[24rem] panel p-4 float-in overflow-y-auto max-h-[70vh] sm:max-h-[calc(100vh-5rem)]">
        {!mounted ? null : lines.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm">{T.carrito.vacia}</p>
            <button onClick={() => router.push("/te")} className="btn-miel px-4 py-2 mt-4 text-sm">{T.carrito.irATienda}</button>
          </div>
        ) : (
          <>
            <ul className="space-y-2">
              {lines.map((l) => (
                <li key={`${l.kind}-${l.id}`} className="flex items-center gap-2 border-b border-[var(--madera)]/20 pb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{lineName(l)}</p>
                    <p className="text-xs opacity-70">{eur(linePrice(l))}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="sign w-6 h-6 text-xs" onClick={() => setQty(l.kind, l.id, l.qty - 1)} aria-label="Menos">−</button>
                    <span className="w-6 text-center text-sm">{l.qty}</span>
                    <button className="sign w-6 h-6 text-xs" onClick={() => setQty(l.kind, l.id, l.qty + 1)} aria-label="Más">+</button>
                  </div>
                  <button className="text-xs opacity-60 hover:opacity-100 underline" onClick={() => remove(l.kind, l.id)}>
                    {T.carrito.quitar}
                  </button>
                </li>
              ))}
            </ul>

            {/* cupón */}
            <div className="mt-3">
              {cupon ? (
                <p className="text-xs text-[var(--salvia)] font-bold">
                  ✓ {cupon.codigo} — {cupon.descripcion}{" "}
                  <button className="underline opacity-70" onClick={() => setCupon(null)}>{T.carrito.quitar}</button>
                </p>
              ) : (
                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const c = cuponByCodigo(code);
                    if (c) { setCupon(c); setCodeErr(false); setCode(""); } else setCodeErr(true);
                  }}
                >
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder={T.carrito.cupon}
                    className="flex-1 px-3 py-1.5 rounded-md border border-[var(--madera)]/40 bg-[var(--crema)] text-sm min-w-0"
                  />
                  <button type="submit" className="sign px-3 py-1.5 text-xs">{T.carrito.cuponAplicar}</button>
                </form>
              )}
              {codeErr && <p className="text-xs text-[var(--granate)] mt-1">{T.carrito.cuponInvalido}</p>}
            </div>

            {/* totales */}
            <dl className="mt-3 text-sm space-y-1">
              <div className="flex justify-between"><dt>{T.carrito.subtotal}</dt><dd>{eur(sub)}</dd></div>
              {disc > 0 && (
                <div className="flex justify-between text-[var(--salvia)]"><dt>{T.carrito.descuento}</dt><dd>−{eur(disc)}</dd></div>
              )}
              <div className="flex justify-between">
                <dt>{T.carrito.envio}</dt>
                <dd>{ship === 0 ? T.carrito.envioGratis : eur(ship)}</dd>
              </div>
              {ship > 0 && <p className="text-[10px] opacity-60">{T.carrito.envioGratisDesde(eur(ENVIO_GRATIS_DESDE))}</p>}
              <div className="flex justify-between font-display text-lg border-t border-[var(--madera)]/30 pt-1.5">
                <dt>{T.carrito.total}</dt><dd>{eur(total)}</dd>
              </div>
            </dl>

            <div className="mt-4 grid grid-cols-1 gap-2">
              <button className="btn-miel px-4 py-2.5 text-sm" onClick={() => setPaying("tarjeta")}>💳 {T.carrito.pagarTarjeta}</button>
              <button
                className="px-4 py-2.5 text-sm rounded-[10px] font-bold border border-[#003087] text-[#003087] bg-[#ffc439] hover:brightness-105"
                onClick={() => setPaying("paypal")}
              >
                <span className="italic font-black">Pay</span><span className="italic font-black text-[#009cde]">Pal</span>
              </button>
              <p className="text-[10px] opacity-60 leading-tight">{T.carrito.demoAviso}</p>
            </div>
          </>
        )}
      </aside>

      {/* modal de pago DEMO */}
      {paying && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4" role="dialog" aria-modal="true">
          <div className="panel p-5 w-full max-w-sm float-in">
            <h2 className="font-display text-xl">
              {paying === "tarjeta" ? T.carrito.pagarTarjeta : "PayPal"} <span className="text-xs align-middle bg-[var(--granate)] text-[var(--crema)] rounded px-1.5 py-0.5 ml-1">DEMO</span>
            </h2>
            {processing ? (
              <p className="mt-4 text-sm animate-pulse">Procesando pago de prueba…</p>
            ) : (
              <>
                {paying === "tarjeta" ? (
                  <div className="mt-3 space-y-2">
                    <input placeholder="4242 4242 4242 4242" className="w-full px-3 py-2 rounded-md border border-[var(--madera)]/40 bg-[var(--crema)] text-sm font-mono" />
                    <div className="flex gap-2">
                      <input placeholder="MM/AA" className="w-1/2 px-3 py-2 rounded-md border border-[var(--madera)]/40 bg-[var(--crema)] text-sm font-mono" />
                      <input placeholder="CVC" className="w-1/2 px-3 py-2 rounded-md border border-[var(--madera)]/40 bg-[var(--crema)] text-sm font-mono" />
                    </div>
                    <p className="text-[10px] opacity-60">Tarjeta de prueba de Stripe: 4242 4242 4242 4242 — cualquier fecha futura y CVC.</p>
                    <input value={email} onChange={(e) => setEmail(e.target.value)} type="email"
                      placeholder="Tu correo para el recibo (opcional)"
                      className="w-full px-3 py-2 rounded-md border border-[var(--madera)]/40 bg-[var(--crema)] text-sm" />
                  </div>
                ) : (
                  <p className="mt-3 text-sm">Aquí se abrirá la ventana de PayPal cuando la tienda esté conectada.</p>
                )}
                <div className="mt-4 flex gap-2">
                  <button className="btn-miel flex-1 px-4 py-2 text-sm" onClick={() => confirmPay(paying)}>
                    Pagar {eur(total)} (prueba)
                  </button>
                  <button className="sign px-3 py-2 text-xs" onClick={() => setPaying(null)}>Cancelar</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
