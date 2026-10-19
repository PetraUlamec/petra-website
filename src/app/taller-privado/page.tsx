"use client";
// EL TALLER PRIVADO de Petra y Erik: publicar tés (combinando plantas), quesos, carnes,
// mieles, limonadas y cucharas de artesano — SIN tocar código. Guarda en el catálogo vivo.
// Página no enlazada desde el menú y fuera de robots.txt.
import { useEffect, useState } from "react";
import { PLANTS, plantById } from "@/data/plants";
import { TEAS } from "@/data/teas";
import { eur } from "@/lib/format";

interface VTea { id: string; nombre: string; sala: string; precio: number; plantas: { plantaId: string; porQueEnEsteMix: string }[] }
interface VExtra { id: string; nombre: string; tipo: string; hechoPor: string; procedencia: string; foto?: string }

export default function TallerPrivado() {
  const [vivo, setVivo] = useState<{ teas: VTea[]; extras: VExtra[] }>({ teas: [], extras: [] });
  const [clave, setClave] = useState("");
  useEffect(() => { setClave(localStorage.getItem("petra-taller-clave") ?? ""); }, []);
  const guardaClave = (v: string) => { setClave(v); localStorage.setItem("petra-taller-clave", v); };
  const [msg, setMsg] = useState("");
  // té nuevo
  const [tNombre, setTNombre] = useState(""); const [tSala, setTSala] = useState("te");
  const [tPrecio, setTPrecio] = useState("8"); const [tGramos, setTGramos] = useState("60");
  const [tSirve, setTSirve] = useState(""); const [tColor, setTColor] = useState("#C9B36A");
  const [sel, setSel] = useState<Record<string, string>>({});
  // extra nuevo
  const [eNombre, setENombre] = useState(""); const [eTipo, setETipo] = useState("queso");
  const [eQuien, setEQuien] = useState("Petra"); const [eHistoria, setEHistoria] = useState("");
  const [eFoto, setEFoto] = useState<File | null>(null); const [eRecortar, setERecortar] = useState(true);
  // editor de decoración
  const [dSala, setDSala] = useState("salon"); const [dPieza, setDPieza] = useState("cruz");
  const [dX, setDX] = useState(0); const [dZ, setDZ] = useState(2.5);
  const [dRot, setDRot] = useState(0); const [dEsc, setDEsc] = useState(1); const [dY, setDY] = useState(2.4);
  const [avisos, setAvisos] = useState<{ nivel: string; texto: string }[]>([]);
  const [mapa, setMapa] = useState<{ ocupado: Record<string, { x: number; z: number; r: number; que: string }[]>; radios: Record<string, number>; deco: { id: string; sala: string; pieza: string; x: number; z: number; escala: number }[] } | null>(null);
  const [mapaSala, setMapaSala] = useState("salon");

  const cargar = () => fetch("/api/catalogo").then((r) => r.json()).then(setVivo)
    .catch(() => setMsg("⚠ no se pudo leer el catálogo (¿servidor caído?)"));
  useEffect(() => { cargar(); }, []);

  const [tFoto, setTFoto] = useState<File | null>(null);
  const publicarTe = async () => {
    let foto: string | undefined;
    if (tFoto) {
      const fd = new FormData();
      fd.set("file", tFoto); fd.set("nombre", tNombre || "te"); fd.set("recortar", "0");
      const rf = await fetch("/api/foto", { method: "POST", headers: { "x-taller-key": clave }, body: fd }).then((x) => x.json());
      if (rf.error) { setMsg("⚠ foto: " + rf.error); return; }
      foto = rf.foto;
    }
    const plantas = Object.entries(sel).map(([plantaId, porQueEnEsteMix]) => ({ plantaId, porQueEnEsteMix }));
    const r = await fetch("/api/catalogo", { method: "POST", headers: { "Content-Type": "application/json", "x-taller-key": clave },
      body: JSON.stringify({ tipo: "tea", item: { nombre: tNombre, sala: tSala, precio: tPrecio, gramos: tGramos, paraQueSirve: tSirve, colorHoja: tColor, plantas, foto } }) });
    const d = await r.json();
    if (d.error) { setMsg("⚠ " + d.error); return; }
    setMsg(`✓ «${tNombre}» publicado — ya está en su estantería`);
    setTNombre(""); setTSirve(""); setSel({}); setTFoto(null); setVivo(d);
  };
  const publicarExtra = async () => {
    let foto: string | undefined;
    if (eFoto) {
      const fd = new FormData();
      fd.set("file", eFoto); fd.set("nombre", eNombre || "producto"); fd.set("recortar", eRecortar ? "1" : "0");
      const rf = await fetch("/api/foto", { method: "POST", headers: { "x-taller-key": clave }, body: fd }).then((x) => x.json());
      if (rf.error) { setMsg("⚠ foto: " + rf.error); return; }
      foto = rf.foto;
      setMsg(rf.recortada ? "✓ foto recortada (fondo fuera)" : "✓ foto guardada");
    }
    const r = await fetch("/api/catalogo", { method: "POST", headers: { "Content-Type": "application/json", "x-taller-key": clave },
      body: JSON.stringify({ tipo: "extra", item: { nombre: eNombre, tipo: eTipo, hechoPor: eQuien, procedencia: eHistoria, foto } }) });
    const d = await r.json();
    if (d.error) { setMsg("⚠ " + d.error); return; }
    setMsg(`✓ «${eNombre}» publicado en la despensa`);
    setENombre(""); setEHistoria(""); setVivo(d);
  };
  const colocarPieza = async () => {
    const r = await fetch("/api/catalogo", { method: "POST", headers: { "Content-Type": "application/json", "x-taller-key": clave },
      body: JSON.stringify({ tipo: "deco", item: { sala: dSala, pieza: dPieza, x: dX, z: dZ, rotY: dRot, escala: dEsc, y: ["cruz","candelabro"].includes(dPieza) ? dY : undefined } }) });
    const d = await r.json();
    if (d.error) { setMsg("⚠ " + d.error); return; }
    setMsg(`✓ ${dPieza} colocada en ${dSala} — abre la sala y la verás`);
    setVivo(d);
  };
  const pasarDoctor = async () => {
    const d = await fetch("/api/doctor").then((r) => r.json());
    setAvisos(d.avisos ?? []);
    setMapa(d.mapa ?? null);
  };
  const borrar = async (tipo: string, id: string) => {
    const d = await fetch("/api/catalogo", { method: "DELETE", headers: { "Content-Type": "application/json", "x-taller-key": clave }, body: JSON.stringify({ tipo, id }) }).then((r) => r.json());
    if (d.error) { setMsg("⚠ " + d.error); return; }   // sin esto, la respuesta de error tumbaba la página
    setVivo(d); setMsg("✓ retirado");
  };

  const inp = "w-full px-3 py-2 rounded-md border border-[var(--madera)]/40 bg-[var(--crema)] text-sm";
  return (
    <main className="fixed inset-0 overflow-y-auto bg-[var(--madera-oscura)] pt-16 pb-10 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <header className="text-center">
          <div className="inline-flex items-center gap-2 mb-2">
            <input type="password" value={clave} onChange={(e) => guardaClave(e.target.value)}
              placeholder="Clave del taller" className="px-3 py-1.5 rounded-md border border-[var(--madera)]/40 bg-[var(--crema)] text-sm" />
            <span className="text-[10px] text-[var(--crema)]/60">se recuerda en este navegador</span>
          </div>
          <h1 className="font-display text-3xl text-[var(--crema)]">El taller privado</h1>
          <a href="/studio/index.html" className="btn-miel inline-block px-5 py-3 mt-4">Abrir PETRA Studio · editar tés, precios y plantas</a>
          <p className="text-sm text-[var(--crema)]/75 mt-1">Aquí Petra y Erik publican sin tocar código. Lo publicado aparece al momento en la tienda.</p>
          {msg && <p className="mt-2 inline-block panel px-4 py-2 text-sm">{msg}</p>}
        </header>

        {/* ── NUEVO TÉ: el combinador de plantas ── */}
        <section className="panel p-5">
          <h2 className="font-display text-xl">🍃 Publicar un té nuevo</h2>
          <div className="grid sm:grid-cols-2 gap-3 mt-3">
            <input className={inp} placeholder="Nombre del té (p. ej. Abrazo de Otoño)" value={tNombre} onChange={(e) => setTNombre(e.target.value)} />
            <select className={inp} value={tSala} onChange={(e) => setTSala(e.target.value)}>
              <option value="te">Sala de Té</option><option value="te-premium">Té Premium (lleva la 🥄 ?)</option>
            </select>
            <input className={inp} type="number" step="0.5" placeholder="Precio €" value={tPrecio} onChange={(e) => setTPrecio(e.target.value)} />
            <input className={inp} type="number" placeholder="Gramos del tarro" value={tGramos} onChange={(e) => setTGramos(e.target.value)} />
            <textarea className={inp + " sm:col-span-2"} rows={2} placeholder="¿Para qué sirve este mix? (con tus palabras)" value={tSirve} onChange={(e) => setTSirve(e.target.value)} />
            <label className="text-sm text-[var(--tinta)] flex items-center gap-2">Color de la hoja
              <input type="color" value={tColor} onChange={(e) => setTColor(e.target.value)} />
            </label>
          </div>
          <h3 className="font-display text-sm mt-4">Combina las plantas ({Object.keys(sel).length} elegidas) — y cuenta por qué cada una está en ESTE mix:</h3>
          <div className="grid sm:grid-cols-2 gap-2 mt-2 max-h-72 overflow-y-auto pr-1">
            {PLANTS.map((p) => (
              <div key={p.id} className={`rounded-md border p-2 ${p.id in sel ? "border-[var(--miel)] bg-[var(--crema)]" : "border-[var(--madera)]/20"}`}>
                <label className="flex items-center gap-2 text-sm font-bold">
                  <input type="checkbox" checked={p.id in sel}
                    onChange={(e) => setSel((s) => { const n = { ...s }; if (e.target.checked) n[p.id] = ""; else delete n[p.id]; return n; })} />
                  <span style={{ color: p.color2 }}>●</span> {p.nombre}
                </label>
                {p.id in sel && (
                  <textarea className={inp + " mt-1"} rows={2} placeholder={`¿Por qué ${p.nombre.toLowerCase()} en este mix?`}
                    value={sel[p.id]} onChange={(e) => setSel((s) => ({ ...s, [p.id]: e.target.value }))} />
                )}
              </div>
            ))}
          </div>
          <label className="block mt-3 text-xs opacity-80">Foto del tarro (se enseña difuminada y se revela al abrir):
            <input type="file" accept="image/*" onChange={(e) => setTFoto(e.target.files?.[0] ?? null)} className="block text-xs mt-1" />
          </label>
          <button className="btn-miel px-5 py-2.5 mt-4 text-sm" onClick={publicarTe}>Publicar el té</button>
        </section>

        {/* ── NUEVO PRODUCTO DE LA DESPENSA / CUCHARA ── */}
        <section className="panel p-5">
          <h2 className="font-display text-xl">🧀 Publicar queso · carne · miel · limonada · 🥄 cuchara</h2>
          <div className="grid sm:grid-cols-2 gap-3 mt-3">
            <input className={inp} placeholder="Nombre (p. ej. Queso de otoño / Cucharita de tejo)" value={eNombre} onChange={(e) => setENombre(e.target.value)} />
            <select className={inp} value={eTipo} onChange={(e) => setETipo(e.target.value)}>
              <option value="queso">Queso</option><option value="carne">Carne</option>
              <option value="miel">Miel</option><option value="limonada">Limonada</option>
              <option value="cuchara">Cuchara de Erik (entra en el sorteo de la ?)</option>
            </select>
            <select className={inp} value={eQuien} onChange={(e) => setEQuien(e.target.value)}>
              <option>Petra</option><option>Erik</option>
            </select>
            <textarea className={inp + " sm:col-span-2"} rows={3}
              placeholder="Su historia y procedencia (de dónde viene, cómo se hace — cada cosa cuenta LA SUYA)"
              value={eHistoria} onChange={(e) => setEHistoria(e.target.value)} />
            <label className="text-xs sm:col-span-2 flex items-center gap-3 flex-wrap">
              📷 Foto del producto (opcional):
              <input type="file" accept="image/*" onChange={(e) => setEFoto(e.target.files?.[0] ?? null)} className="text-xs" />
              <span className="flex items-center gap-1">
                <input type="checkbox" checked={eRecortar} onChange={(e) => setERecortar(e.target.checked)} />
                recortar el fondo (magia local)
              </span>
            </label>
          </div>
          <button className="btn-miel px-5 py-2.5 mt-4 text-sm" onClick={publicarExtra}>Publicar</button>
        </section>

        {/* ── QUÉ LLEVA CADA TARRO (nombres y cuántas plantas) ── */}
        <section className="panel p-5">
          <h2 className="font-display text-xl">🫙 Qué lleva cada tarro</h2>
          <div className="grid sm:grid-cols-2 gap-2 mt-2 max-h-64 overflow-y-auto pr-1 text-sm">
            {[...TEAS, ...vivo.teas].map((t) => (
              <div key={t.id} className="rounded-md border border-[var(--madera)]/20 p-2">
                <b>{t.nombre}</b> <span className="opacity-60">· {t.plantas.length} plantas</span>
                <div className="text-xs opacity-80 mt-0.5">
                  {t.plantas.map((p) => { try { return plantById(p.plantaId).nombre; } catch { return p.plantaId; } }).join(" · ")}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── DECORAR LAS HABITACIONES ── */}
        <section className="panel p-5">
          <h2 className="font-display text-xl">🪑 Decorar las habitaciones</h2>
          <p className="text-xs opacity-70 mt-1">Elige pieza y sala, colócala con los mandos, y aparece en la tienda. La cruz y el candelabro van en la pared (altura).</p>
          <div className="grid sm:grid-cols-3 gap-3 mt-3">
            <select className={inp} value={dSala} onChange={(e) => setDSala(e.target.value)}>
              <option value="intro">Entrada</option><option value="salon">Salón</option><option value="te">Sala de Té</option>
              <option value="te-premium">Té Premium</option><option value="carrito">Despensa</option>
              <option value="nosotros">Taller</option><option value="contacto">Contacto</option>
            </select>
            <select className={inp} value={dPieza} onChange={(e) => setDPieza(e.target.value)}>
              <option value="cruz">✝ Cruz de madera (pared)</option>
              <option value="vela">🕯 Vela de mesa</option>
              <option value="candelabro">🕯 Candelabro de pared</option>
              <option value="lampara">💡 Lámpara colgante</option>
              <option value="farol">🏮 Farol de pie</option>
              <option value="mesa">Mesa</option><option value="silla">Silla</option>
              <option value="butaca">Butaca</option><option value="taburete">Taburete</option>
              <option value="frutero">🍎 Frutero</option><option value="maceta">🪴 Maceta</option>
              <option value="tinaja">🏺 Tinaja</option><option value="queso">🧀 Queso</option>
              <option value="saco">Saco</option><option value="miel">🍯 Tarro de miel</option>
            </select>
            <label className="text-xs">Escala {dEsc.toFixed(1)}
              <input type="range" min="0.5" max="2" step="0.1" value={dEsc} onChange={(e) => setDEsc(Number(e.target.value))} className="w-full" />
            </label>
            <label className="text-xs">Posición ←→ (x: {dX.toFixed(1)})
              <input type="range" min="-4.4" max="4.4" step="0.1" value={dX} onChange={(e) => setDX(Number(e.target.value))} className="w-full" />
            </label>
            <label className="text-xs">Posición ↖↘ (z: {dZ.toFixed(1)})
              <input type="range" min="-4.4" max="4.4" step="0.1" value={dZ} onChange={(e) => setDZ(Number(e.target.value))} className="w-full" />
            </label>
            <label className="text-xs">Giro {dRot}°
              <input type="range" min="0" max="359" step="5" value={dRot} onChange={(e) => setDRot(Number(e.target.value))} className="w-full" />
            </label>
            {["cruz", "candelabro"].includes(dPieza) && (
              <label className="text-xs">Altura en la pared {dY.toFixed(1)}
                <input type="range" min="1" max="3.6" step="0.1" value={dY} onChange={(e) => setDY(Number(e.target.value))} className="w-full" />
              </label>
            )}
          </div>
          <button className="btn-miel px-5 py-2.5 mt-3 text-sm" onClick={colocarPieza}>Colocar en la sala</button>
          {(vivo as { deco?: { id: string; pieza: string; sala: string }[] }).deco?.length ? (
            <ul className="mt-3 space-y-1 text-sm">
              {(vivo as { deco?: { id: string; pieza: string; sala: string; x: number; z: number }[] }).deco!.map((p) => (
                <li key={p.id} className="flex justify-between border-b border-[var(--madera)]/15 py-1">
                  <span>{p.pieza} en <b>{p.sala}</b> ({p.x.toFixed(1)}, {p.z.toFixed(1)})</span>
                  <button className="text-xs underline opacity-70" onClick={() => borrar("deco", p.id)}>quitar</button>
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        {/* ── EL INSPECTOR: mapa de planta ── */}
        <section className="panel p-5">
          <h2 className="font-display text-xl">🗺 El inspector — mapa de planta</h2>
          <p className="text-xs opacity-70 mt-1">Vista desde arriba de la sala: gris = mueble de fábrica; dorado = pieza tuya; rojo = choque. (Pulsa «Pasar revisión» para cargar.)</p>
          <div className="flex gap-2 mt-2 flex-wrap">
            {["salon","te","te-premium","carrito","nosotros","contacto"].map((sl) => (
              <button key={sl} className={`sign px-2 py-1 text-xs ${mapaSala === sl ? "sign-active" : ""}`} onClick={() => setMapaSala(sl)}>{sl}</button>
            ))}
          </div>
          {mapa && (
            <svg viewBox="-5 -5 10 10" className="w-full max-w-md mx-auto mt-3 border-2 border-[var(--madera)]/40 rounded-lg bg-[#e8d9b8]">
              {/* paredes */}
              <rect x="-5" y="-5" width="10" height="10" fill="none" stroke="#5b3a21" strokeWidth="0.12" />
              {/* huellas de fábrica */}
              {(mapa.ocupado[mapaSala] ?? []).map((o, i) => (
                <g key={i}>
                  <circle cx={o.x} cy={o.z} r={o.r} fill="#8a7350" opacity="0.35" />
                  <text x={o.x} y={o.z} fontSize="0.28" textAnchor="middle" fill="#3a2513">{o.que}</text>
                </g>
              ))}
              {/* piezas vivas */}
              {mapa.deco.filter((p) => p.sala === mapaSala).map((p) => {
                const r = (mapa.radios[p.pieza] ?? 0.3) * p.escala;
                const choca = (mapa.ocupado[mapaSala] ?? []).some((o) => Math.hypot(p.x - o.x, p.z - o.z) < r + o.r * 0.55);
                return (
                  <g key={p.id}>
                    <circle cx={p.x} cy={p.z} r={r} fill={choca ? "#c7402e" : "#d9b45b"} opacity="0.8" />
                    <text x={p.x} y={p.z - r - 0.12} fontSize="0.3" textAnchor="middle" fill="#3a2513">{p.pieza}</text>
                  </g>
                );
              })}
              {/* cámara mira desde esta esquina */}
              <text x="4.4" y="4.6" fontSize="0.35" textAnchor="end" fill="#8a5f38">👁 cámara</text>
            </svg>
          )}
        </section>

        {/* ── EL DOCTOR ── */}
        <section className="panel p-5">
          <h2 className="font-display text-xl">🩺 El doctor de la tienda</h2>
          <p className="text-xs opacity-70 mt-1">Revisa lo publicado: textos que faltan, precios raros, piezas chocando o fuera de sitio.</p>
          <button className="btn-miel px-5 py-2.5 mt-3 text-sm" onClick={pasarDoctor}>Pasar revisión</button>
          {avisos.length > 0 && (
            <ul className="mt-3 space-y-1 text-sm">
              {avisos.map((a, i) => (
                <li key={i} className={a.nivel === "rojo" ? "text-[var(--granate)] font-bold" : a.nivel === "ambar" ? "text-[#8a6a1f]" : "text-[var(--salvia)] font-bold"}>
                  {a.nivel === "rojo" ? "⛔" : a.nivel === "ambar" ? "⚠️" : "✅"} {a.texto}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ── LO PUBLICADO ── */}
        <section className="panel p-5">
          <h2 className="font-display text-xl">Publicado desde el taller</h2>
          {vivo.teas.length === 0 && vivo.extras.length === 0 && <p className="text-sm opacity-70 mt-2">Nada aún — lo que publiques aparecerá aquí y en la tienda.</p>}
          <ul className="mt-2 space-y-1">
            {vivo.teas.map((t) => (
              <li key={t.id} className="flex justify-between items-center text-sm border-b border-[var(--madera)]/15 py-1">
                <span>🍃 <b>{t.nombre}</b> · {t.sala === "te-premium" ? "Premium" : "Té"} · {eur(t.precio)} · {t.plantas.length} plantas</span>
                <button className="text-xs underline opacity-70" onClick={() => borrar("tea", t.id)}>retirar</button>
              </li>
            ))}
            {vivo.extras.map((e) => (
              <li key={e.id} className="flex justify-between items-center text-sm border-b border-[var(--madera)]/15 py-1">
                <span>{e.tipo === "cuchara" ? "🥄" : "🧺"} <b>{e.nombre}</b> · {e.tipo} · {e.hechoPor}</span>
                <button className="text-xs underline opacity-70" onClick={() => borrar("extra", e.id)}>retirar</button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
