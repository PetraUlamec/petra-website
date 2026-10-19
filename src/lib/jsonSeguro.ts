// GUARDADO SEGURO DE LOS FICHEROS DE DATOS (2-sep-2026, auditoría de seguridad).
// Antes se hacía fs.writeFile directo sobre el fichero bueno: si el servidor se apagaba a
// media escritura, el catálogo quedaba a medias y la tienda se veía VACÍA sin avisar.
// Ahora se escribe en un temporal y se cambia el nombre (rename = operación atómica del
// sistema de ficheros: o está el fichero viejo entero, o el nuevo entero, nunca a medias).
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

export async function leerJSON<T>(fichero: string, porDefecto: T, estricto = false): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(fichero, "utf8")) as T;
  } catch (error) {
    if (estricto && (error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    return porDefecto;
  }
}

export async function escribirJSON(fichero: string, datos: unknown): Promise<void> {
  await fs.mkdir(path.dirname(fichero), { recursive: true });
  const tmp = `${fichero}.tmp-${randomUUID()}`;
  await fs.writeFile(tmp, JSON.stringify(datos, null, 2), "utf8");
  await fs.rename(tmp, fichero); // atómico dentro del mismo disco
}

/**
 * ¿Es segura esta clave para usarla como nombre de propiedad de un objeto?
 * "__proto__", "constructor" y "prototype" permiten CONTAMINAR el prototipo de todos los
 * objetos del programa (prototype pollution) y alterar su comportamiento desde fuera.
 */
export function claveSegura(k: unknown): k is string {
  return typeof k === "string" && k.length > 0 && k !== "__proto__" && k !== "constructor" && k !== "prototype";
}
