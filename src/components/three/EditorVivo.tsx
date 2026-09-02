"use client";
// EDITOR VISUAL DE LA TIENDA (v2, 23-ago — encargo de SER: «algo fácil y manejable para cualquiera:
// seleccionar más de una cosa, agrandarla, moverla y muchas cosas más»). Se monta con ?editor=1.
//   · Clic = seleccionar · Shift+clic = añadir/quitar · arrastrar en vacío = recuadro de selección
//   · Mandos de colores (flechas/anillos/cubos) para MOVER, GIRAR y ESCALAR con el ratón, una o varias piezas
//   · Barra: modo · Duplicar · Borrar · Deshacer/Rehacer · Añadir pieza (paleta) · Marcar mal/bien · Salir
//   · Teclado sigue: flechas, RePág/AvPág, Q/E, +/-, Supr, Ctrl+Z/Y, Esc
//   · TODO SE GUARDA SOLO: /api/overrides (piezas del código) y /api/catalogo (piezas añadidas).
import { useEffect, useRef, useState, useCallback } from "react";
import { useThree } from "@react-three/fiber";
import { TransformControls } from "@react-three/drei";
import * as THREE from "three";
import { piezaDe, listarPiezas, idPieza, esAuxiliar } from "@/lib/piezas";
import { BIBLIOTECA, ETIQUETA_PIEZA, CATEGORIAS, porCategoria, alturaDe, esDePared } from "./DecoVivo";
import { recargarVivo } from "@/lib/vivoStore";
import { cabecerasTaller } from "@/lib/editor";

type Modo = "translate" | "rotate" | "scale";
type Estado = { p: [number, number, number]; rotY: number; s: number; visible: boolean };
type Paso = { id: string; obj: THREE.Object3D; antes: Estado; despues: Estado }[];

const SALA: Record<string, string> = { "/": "intro", "/salon": "salon", "/te": "te", "/te-premium": "te-premium",
  "/nosotros": "nosotros", "/contacto": "contacto", "/carrito": "carrito" };
const PASO = 0.05, PASO_GRANDE = 0.25, GRADO = Math.PI / 36;

const estadoDe = (o: THREE.Object3D): Estado => ({ p: [o.position.x, o.position.y, o.position.z], rotY: o.rotation.y, s: o.scale.x, visible: o.visible });
const aplica = (o: THREE.Object3D, e: Estado) => { o.position.set(...e.p); o.rotation.y = e.rotY; o.scale.setScalar(e.s); o.visible = e.visible; };
const r3 = (v: number) => +v.toFixed(3);

export default function EditorVivo() {
  const { scene, camera, gl } = useThree();
  const [sel, setSel] = useState<THREE.Object3D[]>([]);
  const [modo, setModo] = useState<Modo>("translate");
  const selRef = useRef<THREE.Object3D[]>([]);
  const pivot = useRef<THREE.Group>(new THREE.Group());
  const prev = useRef<{ p: THREE.Vector3; rotY: number; s: number }>({ p: new THREE.Vector3(), rotY: 0, s: 1 });
  const antesDrag = useRef<Map<THREE.Object3D, Estado>>(new Map());
  const helpers = useRef<THREE.Box3Helper[]>([]);
  const hist = useRef<Paso[]>([]); const rehacer = useRef<Paso[]>([]);
  const ui = useRef<{ raiz: HTMLDivElement; info: HTMLDivElement; aviso: (t: string) => void } | null>(null);
  const arrastrando = useRef(false);
  const pendiente = useRef<string | null>(null);   // pieza elegida en la paleta, esperando clic

  // ── persistencia ──────────────────────────────────────────────────────────
  const guarda = useCallback(async (items: { id: string; obj: THREE.Object3D }[]) => {
    for (const { id, obj } of items) {
      const e = estadoDe(obj);
      await fetch("/api/overrides", { method: "POST", headers: cabecerasTaller(),
        body: JSON.stringify({ sala: location.pathname, id, p: e.p.map(r3), rotY: r3(e.rotY), s: r3(e.s), hidden: !e.visible }) });
    }
    (window as unknown as { __overridesRecargar?: () => void }).__overridesRecargar?.();
    ui.current?.aviso(`✓ guardado (${items.length})`);
  }, []);

  const commit = useCallback((paso: Paso) => {
    if (!paso.length) return;
    hist.current.push(paso); rehacer.current = [];
    guarda(paso.map(({ id, obj }) => ({ id, obj })));
  }, [guarda]);

  // ── selección ─────────────────────────────────────────────────────────────
  const pintaHelpers = useCallback(() => {
    helpers.current.forEach((h) => { scene.remove(h); h.dispose(); }); helpers.current = [];
    for (const o of selRef.current) {
      const h = new THREE.Box3Helper(new THREE.Box3().setFromObject(o), new THREE.Color("#ffb300"));
      scene.add(h); helpers.current.push(h);
    }
    if (selRef.current.length) {
      const c = new THREE.Vector3();
      for (const o of selRef.current) { const b = new THREE.Box3().setFromObject(o); c.add(b.getCenter(new THREE.Vector3())); }
      c.divideScalar(selRef.current.length);
      pivot.current.position.copy(c); pivot.current.rotation.set(0, 0, 0); pivot.current.scale.setScalar(1);
      prev.current = { p: c.clone(), rotY: 0, s: 1 };
    }
    const info = ui.current?.info;
    if (info) info.textContent = selRef.current.length
      ? `${selRef.current.length} pieza(s): ${selRef.current.map((o) => idPieza(o, scene)).join(" · ").slice(0, 160)}`
      : "Clic en una pieza · Shift+clic para varias · arrastra en el vacío para un recuadro · todo se guarda solo (💾 GUARDAR deja la sala entera como la ves)";
  }, [scene]);

  const selecciona = useCallback((objs: THREE.Object3D[]) => { selRef.current = objs; setSel(objs); pintaHelpers(); }, [pintaHelpers]);

  // ── el pivote de los mandos: cada cambio se reparte a todas las piezas seleccionadas ──
  const onCambio = useCallback(() => {
    const pv = pivot.current, pr = prev.current, objs = selRef.current;
    if (!objs.length) return;
    if (modo === "translate") {
      const d = pv.position.clone().sub(pr.p);
      objs.forEach((o) => o.position.add(d));
    } else if (modo === "rotate") {
      const dth = pv.rotation.y - pr.rotY;
      objs.forEach((o) => {
        const rel = o.position.clone().sub(pr.p); rel.applyAxisAngle(new THREE.Vector3(0, 1, 0), dth);
        o.position.copy(pr.p).add(rel); o.rotation.y += dth;
      });
      pv.rotation.set(0, pv.rotation.y, 0);
    } else {
      const f = pv.scale.x / (pr.s || 1);
      if (f > 0 && isFinite(f)) objs.forEach((o) => {
        o.scale.multiplyScalar(f);
        const rel = o.position.clone().sub(pr.p).multiplyScalar(f); o.position.copy(pr.p).add(rel);
      });
      pv.scale.setScalar(pv.scale.x);
    }
    prev.current = { p: pv.position.clone(), rotY: pv.rotation.y, s: pv.scale.x };
    helpers.current.forEach((h, i) => selRef.current[i] && h.box.setFromObject(selRef.current[i]));
  }, [modo]);

  const onDragCambia = useCallback((ev: { value: boolean } | undefined) => {
    const on = !!ev?.value;
    if (on) { arrastrando.current = true; antesDrag.current = new Map(selRef.current.map((o) => [o, estadoDe(o)])); }
    else if (arrastrando.current) {
      arrastrando.current = false;
      const paso: Paso = selRef.current.map((o) => ({ id: idPieza(o, scene), obj: o, antes: antesDrag.current.get(o)!, despues: estadoDe(o) }))
        .filter((x) => x.antes && JSON.stringify(x.antes) !== JSON.stringify(x.despues));
      commit(paso);
    }
  }, [commit, scene]);

  // ── acciones ──────────────────────────────────────────────────────────────
  const transforma = useCallback((fn: (o: THREE.Object3D) => void) => {
    const objs = selRef.current; if (!objs.length) return;
    const antes = objs.map(estadoDe); objs.forEach(fn);
    commit(objs.map((o, i) => ({ id: idPieza(o, scene), obj: o, antes: antes[i], despues: estadoDe(o) })));
    pintaHelpers();
  }, [commit, pintaHelpers, scene]);

  const borra = useCallback(async () => {
    const objs = selRef.current; if (!objs.length) return;
    const paso: Paso = [];
    for (const o of objs) {
      const vivoId = o.userData?.vivoId as string | undefined;
      const antes = estadoDe(o); o.visible = false;
      if (vivoId) { await fetch("/api/deco", { method: "DELETE", headers: cabecerasTaller(), body: JSON.stringify({ id: vivoId }) }); }
      paso.push({ id: idPieza(o, scene), obj: o, antes, despues: estadoDe(o) });
    }
    commit(paso); selecciona([]); ui.current?.aviso(`🗑 borradas ${objs.length} (Deshacer para recuperar)`);
  }, [commit, scene, selecciona]);

  const anade = useCallback(async (pieza: string, x = 0, z = 1.2) => {
    const sala = SALA[location.pathname] ?? "salon";
    const y = alturaDe(pieza);
    const r = await fetch("/api/deco", { method: "POST", headers: cabecerasTaller(),
      body: JSON.stringify({ pieza, sala, x: +x.toFixed(2), z: +z.toFixed(2), rotY: 0, escala: 1, ...(y ? { y } : {}) }) });
    if (r.ok) { await recargarVivo(); ui.current?.aviso(`＋ ${ETIQUETA_PIEZA[pieza] ?? pieza}${esDePared(pieza) ? " (va en la pared: súbela con RePág)" : ""}`); }
    else ui.current?.aviso("✗ no se pudo añadir");
  }, []);

  const duplica = useCallback(async () => {
    const objs = selRef.current; if (!objs.length) return;
    let hechas = 0;
    for (const o of objs) {
      const vivo = o.userData?.vivo as { pieza: string; sala: string; x: number; z: number; rotY: number; escala: number; y?: number } | undefined;
      if (!vivo) continue;
      await fetch("/api/deco", { method: "POST", headers: cabecerasTaller(),
        body: JSON.stringify({ ...vivo, x: vivo.x + 0.45 }) });
      hechas++;
    }
    await recargarVivo();
    ui.current?.aviso(hechas ? `⧉ duplicadas ${hechas}` : "Solo se duplican piezas AÑADIDAS (las del código no): usa Añadir");
  }, []);

  const deshacer = useCallback((redo = false) => {
    const pila = redo ? rehacer.current : hist.current; const paso = pila.pop(); if (!paso) return;
    paso.forEach(({ obj, antes, despues }) => aplica(obj, redo ? despues : antes));
    (redo ? hist.current : rehacer.current).push(paso);
    guarda(paso.map(({ id, obj }) => ({ id, obj }))); pintaHelpers();
  }, [guarda, pintaHelpers]);

  /** Guarda la posición ACTUAL de todas las piezas de la sala: lo que ves es lo que queda. */
  const guardarTodo = useCallback(async () => {
    const piezas = listarPiezas(scene);
    const cambios = piezas.map(({ id, obj }) => {
      const e = estadoDe(obj);
      return { id, p: e.p.map(r3), rotY: r3(e.rotY), s: r3(e.s), hidden: !e.visible };
    });
    const r = await fetch("/api/overrides", { method: "POST", headers: cabecerasTaller(),
      body: JSON.stringify({ sala: location.pathname, cambios }) });
    ui.current?.aviso(r.ok ? `💾 GUARDADO · ${cambios.length} piezas de esta sala quedan como las ves` : "✗ no se pudo guardar");
  }, [scene]);

  const marca = useCallback((estado: string) => {
    selRef.current.forEach((o) => fetch("/api/editor-log", { method: "POST", headers: cabecerasTaller(),
      body: JSON.stringify({ sala: location.pathname, pieza: idPieza(o, scene), estado, ahora: estadoDe(o) }) }));
    ui.current?.aviso(`✓ marcado ${estado} (${selRef.current.length})`);
  }, [scene]);

  // ── DOM: barra de herramientas + recuadro de selección ─────────────────────
  useEffect(() => {
    scene.add(pivot.current);
    const raiz = document.createElement("div");
    raiz.style.cssText = "position:fixed;left:12px;top:12px;z-index:9999;display:flex;flex-direction:column;gap:6px;font:13px/1.4 system-ui,sans-serif;color:#f3e4c4";
    const barra = document.createElement("div");
    barra.style.cssText = "display:flex;flex-wrap:wrap;gap:6px;background:#2b1c10ee;padding:10px 12px;border-radius:12px;box-shadow:0 8px 24px #0006;max-width:900px";
    const info = document.createElement("div");
    info.style.cssText = "background:#2b1c10cc;padding:8px 12px;border-radius:10px;max-width:900px;white-space:pre-wrap";
    const avisoEl = document.createElement("div");
    avisoEl.style.cssText = "background:#5a7d3aee;padding:6px 12px;border-radius:10px;display:none";
    let t: ReturnType<typeof setTimeout>;
    const aviso = (s: string) => { avisoEl.textContent = s; avisoEl.style.display = "block"; clearTimeout(t); t = setTimeout(() => { avisoEl.style.display = "none"; }, 2600); };
    const boton = (txt: string, fn: () => void, titulo = "") => {
      const b = document.createElement("button"); b.textContent = txt; b.title = titulo;
      b.style.cssText = "background:#f3e4c4;color:#2b1c10;border:0;border-radius:8px;padding:8px 12px;font:600 13px system-ui;cursor:pointer";
      b.onclick = (e) => { e.preventDefault(); fn(); }; barra.appendChild(b); return b;
    };
    const modos: Record<Modo, HTMLButtonElement> = {} as Record<Modo, HTMLButtonElement>;
    const setM = (m: Modo) => { setModo(m); (Object.keys(modos) as Modo[]).forEach((k) => { modos[k].style.background = k === m ? "#ffb300" : "#f3e4c4"; }); };
    modos.translate = boton("✥ Mover", () => setM("translate"), "arrastra las flechas");
    modos.rotate = boton("⟳ Girar", () => setM("rotate"), "arrastra el anillo");
    modos.scale = boton("⤢ Tamaño", () => setM("scale"), "arrastra los cubos");
    boton("⧉ Duplicar", () => duplica());
    boton("🗑 Borrar", () => borra(), "Supr");
    const bg = boton("💾 GUARDAR", () => guardarTodo(), "deja esta sala tal y como la ves ahora");
    bg.style.background = "#5a7d3a"; bg.style.color = "#fdf8ea";
    boton("↶ Deshacer", () => deshacer(false), "Ctrl+Z");
    boton("↷ Rehacer", () => deshacer(true), "Ctrl+Y");
    // ── PALETA: panel con buscador y categorías; se elige una pieza y el siguiente clic la coloca ──
    const paleta = document.createElement("div");
    paleta.style.cssText = "display:none;background:#2b1c10f2;padding:12px;border-radius:12px;max-width:900px;" +
      "max-height:52vh;overflow:auto;box-shadow:0 10px 30px #0007";
    const buscador = document.createElement("input");
    buscador.placeholder = "Buscar pieza… (mesa, planta, tarro…)";
    buscador.style.cssText = "width:100%;padding:9px 12px;border-radius:9px;border:0;font:14px system-ui;margin-bottom:10px";
    paleta.appendChild(buscador);
    const cuerpo = document.createElement("div"); paleta.appendChild(cuerpo);
    const pintaPaleta = (filtro = "") => {
      cuerpo.textContent = "";
      const f = filtro.trim().toLowerCase();
      for (const cat of CATEGORIAS) {
        const items = porCategoria(cat).filter(([k, e]) => !f || e.etiqueta.toLowerCase().includes(f) || k.includes(f));
        if (!items.length) continue;
        const h = document.createElement("div");
        h.textContent = cat;
        h.style.cssText = "font:700 11px/1.6 system-ui;letter-spacing:.12em;text-transform:uppercase;color:#d9b45b;margin:10px 0 6px";
        cuerpo.appendChild(h);
        const rej = document.createElement("div");
        rej.style.cssText = "display:flex;flex-wrap:wrap;gap:6px";
        items.forEach(([k, e]) => {
          const b = document.createElement("button");
          b.textContent = e.etiqueta;
          b.style.cssText = "background:#f3e4c4;color:#2b1c10;border:0;border-radius:8px;padding:8px 11px;font:500 13px system-ui;cursor:pointer";
          b.onclick = (ev) => { ev.preventDefault(); pendiente.current = k; paleta.style.display = "none"; modoAdd.style.background = "#ffb300";
            aviso(`Elegida: ${e.etiqueta} — haz clic donde quieras ponerla (Esc para cancelar)`); };
          rej.appendChild(b);
        });
        cuerpo.appendChild(rej);
      }
      if (!cuerpo.children.length) { const v = document.createElement("div"); v.textContent = "sin resultados"; v.style.cssText = "opacity:.7;padding:8px"; cuerpo.appendChild(v); }
    };
    buscador.oninput = () => pintaPaleta(buscador.value);
    const modoAdd = boton(`＋ Añadir pieza (${BIBLIOTECA.length})`, () => {
      const abierta = paleta.style.display !== "none";
      paleta.style.display = abierta ? "none" : "block";
      if (!abierta) { pintaPaleta(buscador.value); buscador.focus(); }
    }, "elige una pieza y haz clic donde quieras ponerla");
    boton("✗ Mal", () => marca("MAL"), "díselo a Claude");
    boton("✓ Bien", () => marca("BIEN"));
    boton("Salir", () => { location.href = location.pathname; });
    raiz.append(barra, paleta, info, avisoEl); document.body.appendChild(raiz);
    ui.current = { raiz, info, aviso };
    setM("translate"); pintaHelpers();

    // recuadro de selección
    const rect = document.createElement("div");
    rect.style.cssText = "position:fixed;border:1.5px dashed #ffb300;background:#ffb30022;pointer-events:none;display:none;z-index:9998";
    document.body.appendChild(rect);
    let origen: { x: number; y: number } | null = null;
    const ray = new THREE.Raycaster();
    const golpea = (ev: PointerEvent) => {
      const r = gl.domElement.getBoundingClientRect();
      ray.setFromCamera(new THREE.Vector2(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1), camera);
      const hits = ray.intersectObjects(scene.children, true).filter((h) => (h.object as THREE.Mesh).isMesh && h.object.visible && !esAuxiliar(h.object));
      return hits.length ? piezaDe(hits[0].object, scene) : null;
    };
    const onDown = (ev: PointerEvent) => {
      if (ev.button !== 0 || arrastrando.current) return;
      if ((ev.target as HTMLElement).closest("button,select,input")) return;
      // ¿hay una pieza elegida en la paleta? entonces este clic la COLOCA aquí
      if (pendiente.current) {
        const r = gl.domElement.getBoundingClientRect();
        ray.setFromCamera(new THREE.Vector2(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1), camera);
        const suelo = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const punto = new THREE.Vector3();
        if (ray.ray.intersectPlane(suelo, punto)) {
          const k = pendiente.current; pendiente.current = null; modoAdd.style.background = "#f3e4c4";
          anade(k, punto.x, punto.z);
        }
        return;
      }
      const p = golpea(ev);
      if (p) {
        if (p === pivot.current) return;
        if (ev.shiftKey) selecciona(selRef.current.includes(p) ? selRef.current.filter((o) => o !== p) : [...selRef.current, p]);
        else if (!selRef.current.includes(p)) selecciona([p]);
        return;
      }
      origen = { x: ev.clientX, y: ev.clientY };
      rect.style.display = "block"; rect.style.left = `${origen.x}px`; rect.style.top = `${origen.y}px`; rect.style.width = "0px"; rect.style.height = "0px";
    };
    const onMove = (ev: PointerEvent) => {
      if (!origen) return;
      const x = Math.min(origen.x, ev.clientX), y = Math.min(origen.y, ev.clientY);
      rect.style.left = `${x}px`; rect.style.top = `${y}px`;
      rect.style.width = `${Math.abs(ev.clientX - origen.x)}px`; rect.style.height = `${Math.abs(ev.clientY - origen.y)}px`;
    };
    const onUp = (ev: PointerEvent) => {
      if (!origen) return;
      const x0 = Math.min(origen.x, ev.clientX), x1 = Math.max(origen.x, ev.clientX), y0 = Math.min(origen.y, ev.clientY), y1 = Math.max(origen.y, ev.clientY);
      origen = null; rect.style.display = "none";
      if (x1 - x0 < 6 && y1 - y0 < 6) { if (!ev.shiftKey) selecciona([]); return; }
      const r = gl.domElement.getBoundingClientRect();
      const dentro = listarPiezas(scene).filter(({ obj }) => {
        if (!obj.visible || obj === pivot.current) return false;
        const c = new THREE.Box3().setFromObject(obj).getCenter(new THREE.Vector3()).project(camera);
        const sx = r.left + (c.x * 0.5 + 0.5) * r.width, sy = r.top + (-c.y * 0.5 + 0.5) * r.height;
        return sx >= x0 && sx <= x1 && sy >= y0 && sy <= y1;
      }).map((p) => p.obj);
      selecciona(ev.shiftKey ? Array.from(new Set([...selRef.current, ...dentro])) : dentro);
    };
    const onKey = (ev: KeyboardEvent) => {
      if ((ev.target as HTMLElement).tagName === "SELECT") return;
      if (ev.ctrlKey && (ev.key === "z" || ev.key === "Z")) { ev.preventDefault(); deshacer(false); return; }
      if (ev.ctrlKey && (ev.key === "y" || ev.key === "Y")) { ev.preventDefault(); deshacer(true); return; }
      if (ev.key === "Escape") { if (pendiente.current) { pendiente.current = null; aviso("colocación cancelada"); } selecciona([]); return; }
      if (ev.key === "Delete" || ev.key === "Backspace") { if (selRef.current.length) { ev.preventDefault(); borra(); } return; }
      if (ev.key === "1") setM("translate"); if (ev.key === "2") setM("rotate"); if (ev.key === "3") setM("scale");
      if (!selRef.current.length) return;
      const paso = ev.shiftKey ? PASO_GRANDE : PASO; let usado = true;
      const tabla: Record<string, (o: THREE.Object3D) => void> = {
        ArrowLeft: (o: THREE.Object3D) => { o.position.x -= paso; }, ArrowRight: (o: THREE.Object3D) => { o.position.x += paso; },
        ArrowUp: (o: THREE.Object3D) => { o.position.z -= paso; }, ArrowDown: (o: THREE.Object3D) => { o.position.z += paso; },
        PageUp: (o: THREE.Object3D) => { o.position.y += paso; }, PageDown: (o: THREE.Object3D) => { o.position.y -= paso; },
        q: (o: THREE.Object3D) => { o.rotation.y += GRADO; }, e: (o: THREE.Object3D) => { o.rotation.y -= GRADO; },
        "+": (o: THREE.Object3D) => { o.scale.multiplyScalar(1.05); }, "-": (o: THREE.Object3D) => { o.scale.multiplyScalar(1 / 1.05); },
      };
      const f = tabla[ev.key.length === 1 ? ev.key.toLowerCase() : ev.key];
      if (f) transforma(f); else usado = false;
      if (usado) ev.preventDefault();
    };
    gl.domElement.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove); window.addEventListener("pointerup", onUp); window.addEventListener("keydown", onKey);
    return () => {
      gl.domElement.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); window.removeEventListener("keydown", onKey);
      helpers.current.forEach((h) => { scene.remove(h); h.dispose(); }); scene.remove(pivot.current); raiz.remove(); rect.remove(); ui.current = null;
    };
  }, [scene, camera, gl, selecciona, pintaHelpers, borra, deshacer, duplica, anade, marca, transforma, guardarTodo]);

  return sel.length ? (
    <TransformControls object={pivot.current} mode={modo} size={0.9} showX showY showZ
      onObjectChange={onCambio} onMouseDown={() => onDragCambia({ value: true })} onMouseUp={() => onDragCambia({ value: false })} />
  ) : null;
}
