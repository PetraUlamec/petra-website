"use client";
import { useMemo, useEffect } from "react";
import * as THREE from "three";
import { SVGLoader, type StrokeStyle } from "three/examples/jsm/loaders/SVGLoader.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { botanicalArt, botanicalSVG, visualProfile } from "@/data/botanicalArt";
import type { Plant } from "@/lib/types";

type Part = { geometry: THREE.BufferGeometry; color: string };
export function buildBotanicalSpecimen(plant: Plant): Part[] {
  const marks = botanicalArt(plant.id, plant.color, plant.color2);
  if (!marks) return [];
  const buckets = new Map<string, THREE.BufferGeometry[]>();
  const { kind, detail } = visualProfile(plant.id);
  const upright = ["flower", "leaf", "spike", "umbel", "twig", "linden", "blade", "rosehip", "root"].includes(kind);
  const transform = new THREE.Matrix4().makeScale(1, -1, 1);
  const tilt = new THREE.Matrix4().makeRotationX(upright ? -0.12 : -Math.PI / 3);
  const add = (geometry: THREE.BufferGeometry, color: string, layer: number) => {
    geometry.translate(0, 0, layer * 0.035);
    geometry.applyMatrix4(transform);
    geometry.applyMatrix4(tilt);
    geometry.deleteAttribute("uv");
    const flat = geometry.index ? geometry.toNonIndexed() : geometry;
    if (flat !== geometry) geometry.dispose();
    for (const attribute of Object.values(flat.attributes)) {
      const values = attribute.array;
      for (let triangle = 0; triangle < attribute.count; triangle += 3) {
        for (let axis = 0; axis < attribute.itemSize; axis++) {
          const first = (triangle + 1) * attribute.itemSize + axis;
          const second = (triangle + 2) * attribute.itemSize + axis;
          const previous = values[first];
          values[first] = values[second];
          values[second] = previous;
        }
      }
    }
    if (!buckets.has(color)) buckets.set(color, []);
    buckets.get(color)!.push(flat);
  };
  const rounded = ["berry", "goji", "pepper", "aggregate", "seed", "grain", "nutmeg", "cardamom", "rosehip"].includes(kind);
  if (rounded) {
    const sphere = (horizontal: number, vertical: number, depth: number, radiusX: number, radiusY: number, radiusZ: number, color: string) => {
      const geometry = new THREE.SphereGeometry(1, 16, 12);
      geometry.scale(radiusX, radiusY, radiusZ);
      geometry.translate(horizontal, vertical, depth);
      add(geometry, color, 0);
    };
    if (kind === "aggregate") {
      const mulberry = detail.includes("morera");
      for (let ring = 0; ring < (mulberry ? 6 : 4); ring++) {
        const radius = mulberry ? 8 : 15 - ring * 2;
        for (let bead = 0; bead < 8; bead++) {
          const angle = bead * Math.PI / 4 + ring * 0.3;
          sphere(50 + Math.cos(angle) * radius, 30 + ring * 7, Math.sin(angle) * radius, 5.5, 5.5, 5.5, plant.color);
        }
      }
    } else {
      const small = ["seed", "grain", "pepper"].includes(kind);
      const currant = detail.includes("grosella");
      const count = small ? 9 : currant ? 7 : kind === "goji" ? 5 : 3;
      for (let index = 0; index < count; index++) {
        const horizontal = currant ? 50 + (index % 2 ? -8 : 8) : 25 + index % 3 * 23;
        const vertical = currant ? 25 + index * 8 : 35 + Math.floor(index / 3) * 26 + index % 2 * 9;
        const radius = small ? kind === "pepper" ? 6 : 4 : kind === "goji" ? 6 : 11;
        const long = ["goji", "rosehip", "cardamom", "nutmeg", "seed", "grain"].includes(kind);
        sphere(horizontal, vertical, 0, radius, long ? radius * 1.7 : radius, radius, plant.color);
        if (small || long || detail === "uva-espina") {
          for (const side of [-0.45, 0.45]) {
            const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(horizontal + side * radius, vertical - radius, radius * .6), new THREE.Vector3(horizontal + side * radius * 1.4, vertical, radius * 1.02), new THREE.Vector3(horizontal + side * radius, vertical + radius, radius * .6));
            add(new THREE.TubeGeometry(curve, 8, .35, 4, false), plant.color2, 0);
          }
        } else sphere(horizontal, vertical - radius * .2, radius * .96, 1.5, 1.5, .6, "#5d4f39");
      }
    }
  } else new SVGLoader().parse(botanicalSVG(marks)).paths.forEach((shapePath, index) => {
    const style = shapePath.userData!.style as StrokeStyle & { fill: string; stroke: string };
    if (style.fill && style.fill !== "none") {
      for (const shape of SVGLoader.createShapes(shapePath)) {
        const outline = new THREE.Box2().setFromPoints(shape.getPoints(6)).getSize(new THREE.Vector2());
        const tiny = outline.x * outline.y < 30;
        const geometry = new THREE.ExtrudeGeometry(shape, {
          depth: tiny ? 0.25 : upright ? 1.1 : 3.5, bevelEnabled: true,
          bevelThickness: 0.4, bevelSize: 0.25, bevelSegments: 1, curveSegments: 6, steps: 1,
        });
        if (tiny) geometry.translate(0, 0, upright ? 1.2 : 3.6);
        add(geometry, style.fill, index);
      }
    }
    if (style.stroke && style.stroke !== "none" && style.strokeWidth > 0) {
      for (const subPath of shapePath.subPaths) {
        const geometry = SVGLoader.pointsToStroke(subPath.getPoints(6), style);
        if (geometry) {
          geometry.translate(0, 0, upright ? 1.51 : 3.91);
          add(geometry, style.stroke, index);
        }
      }
    }
  });
  const parts: Part[] = [];
  for (const [color, geometries] of buckets) {
    const geometry = mergeGeometries(geometries);
    if (geometry) parts.push({ geometry, color });
    for (const source of geometries) source.dispose();
  }
  const bounds = new THREE.Box3();
  for (const part of parts) {
    part.geometry.computeBoundingBox();
    bounds.union(part.geometry.boundingBox!);
  }
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  const factor = Math.min(0.29 / size.x, 0.39 / size.y, 0.26 / size.z);
  for (const part of parts) {
    part.geometry.translate(-center.x, -bounds.min.y, -center.z);
    part.geometry.scale(factor, factor, factor);
    part.geometry.computeBoundingBox();
    part.geometry.computeBoundingSphere();
  }
  return parts;
}

export default function BotanicalSpecimen({ plant, scale = 1 }: { plant: Plant; scale?: number }) {
  const parts = useMemo(() => buildBotanicalSpecimen(plant), [plant.id, plant.color, plant.color2]);
  useEffect(() => () => { for (const part of parts) part.geometry.dispose(); }, [parts]);
  return <group name={`specimen-${plant.id}`} userData={{ botanicalProfile: visualProfile(plant.id).kind }} scale={scale} dispose={null}>
    {parts.map((part, index) => <mesh key={index} geometry={part.geometry} castShadow receiveShadow>
      <meshStandardMaterial color={part.color} roughness={0.85} side={THREE.DoubleSide} />
    </mesh>)}
  </group>;
}
