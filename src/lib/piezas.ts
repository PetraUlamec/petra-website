// IDENTIDAD DE LAS PIEZAS DEL DIORAMA (23-ago). Una sola regla compartida por el editor de SER
// (EditorVivo), la capa de cambios guardados (Overrides) y el ojo (Auditor), para que TODOS
// hablen de la misma pieza con el mismo nombre.
//   · PIEZA = el ancestro más alto con diagonal < 4.2 m (un mueble entero, no su tornillo).
//   · ID estable = su `name` si lo tiene; si no, «firma de geometrías#índice» en orden de
//     recorrido (Box+Box+2#3 = la 4ª pieza con esa firma). El índice NO depende de la
//     posición, así una pieza movida sigue siendo la misma.
import * as THREE from "three";

export const DIAG_MAX = 4.2;

export function firmaPieza(o: THREE.Object3D): string {
  if (o.name) return o.name;
  const geos: string[] = [];
  o.traverse((m) => { const g = (m as THREE.Mesh).geometry; if (g) geos.push(g.type.replace("Geometry", "")); });
  return geos.slice(0, 3).join("+") + (geos.length > 3 ? `+${geos.length - 3}` : "");
}

/** Sube del mesh tocado al grupo-PIEZA (el ancestro más alto con diagonal < 4.2). */
export function piezaDe(obj: THREE.Object3D, escena: THREE.Object3D): THREE.Object3D {
  const caja = new THREE.Box3();
  let pieza = obj;
  let o: THREE.Object3D | null = obj;
  while (o && o !== escena) {
    caja.setFromObject(o);
    const d = caja.getSize(new THREE.Vector3()).length();
    if (d > 0 && d < DIAG_MAX) pieza = o;
    o = o.parent;
  }
  return pieza;
}

/** Gizmos (TransformControls), Box3Helper y demás ayudas del editor/auditor: nunca son piezas. */
export function esAuxiliar(o: THREE.Object3D): boolean {
  let n: THREE.Object3D | null = o;
  while (n) {
    if (n.type === "Box3Helper" || n.type.startsWith("TransformControls") || n.userData?.__gizmo || n.userData?.__auxiliar) return true;
    n = n.parent;
  }
  return false;
}

/** Enumera TODAS las piezas de la escena (mismo criterio que piezaDe) con su id estable. */
/** ID ESTABLE de una pieza: su posición de ORIGEN (la del código), redondeada al milímetro.
 *  25-ago: antes el id era la «firma» de sus geometrías (Box+Box+2#3) y CAMBIABA cada vez que yo
 *  editaba el componente → los ajustes de SER saltaban a otras piezas (el reloj acabó en (0.85,3.25)
 *  y reapareció un revistero que él había borrado). La posición de origen no cambia salvo que yo
 *  mueva la pieza en el código, que es un acto consciente y raro. */
export function idEstable(o: THREE.Object3D): string {
  const d = o.userData as { __origen?: string };
  if (!d.__origen) {
    const p = `${o.position.x.toFixed(3)},${o.position.y.toFixed(3)},${o.position.z.toFixed(3)}`;
    // muchas piezas nacen en (0,0,0) —grupos envolventes, la propia sala—: ahí el sitio no basta y
    // se desempata con el camino en el árbol (índice de hijo desde la raíz), que no cambia al editar.
    let sufijo = "";
    if (p === "0.000,0.000,0.000") {
      const camino: number[] = [];
      let n: THREE.Object3D | null = o;
      while (n && n.parent) { camino.unshift(n.parent.children.indexOf(n)); n = n.parent; }
      sufijo = `/${camino.join(".")}`;
    }
    d.__origen = `@${p}${sufijo}`;
  }
  return d.__origen;
}

export function listarPiezas(escena: THREE.Object3D): { id: string; obj: THREE.Object3D }[] {
  const out: { id: string; obj: THREE.Object3D }[] = [];
  const cuenta = new Map<string, number>();
  const caja = new THREE.Box3();
  const visita = (o: THREE.Object3D) => {
    if (esAuxiliar(o)) return; // gizmos del editor, cajas de ayuda: no son piezas
    caja.setFromObject(o);
    const d = caja.getSize(new THREE.Vector3()).length();
    if (d > 0 && d < DIAG_MAX) {
      // el nombre explícito manda; si no, la posición de origen (estable ante cambios de código)
      const id = o.name || idEstable(o);
      const n = cuenta.get(id) ?? 0;
      cuenta.set(id, n + 1);
      out.push({ id: n === 0 ? id : `${id}~${n}`, obj: o });   // ~n solo si dos piezas nacen en el mismo punto
      return; // sus hijos son parte de la pieza
    }
    for (const h of o.children) visita(h);
  };
  for (const h of escena.children) visita(h);
  return out;
}

/** Id estable de una pieza concreta (recorriendo la escena con la misma regla). */
export function idPieza(pieza: THREE.Object3D, escena: THREE.Object3D): string {
  const hit = listarPiezas(escena).find((p) => p.obj === pieza);
  return hit ? hit.id : firmaPieza(pieza);
}

export interface Override {
  sala: string; id: string;
  p?: [number, number, number]; rotY?: number; s?: number; hidden?: boolean;
}
