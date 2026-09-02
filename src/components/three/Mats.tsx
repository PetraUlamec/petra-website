"use client";
// Sustitutos 1:1 de <meshStandardMaterial color=X/> con PBR procedural compartido (plan F0b).
import { sharedMaterial } from "@/lib/materials";

export const WoodMat = ({ tone, roughness }: { tone: string; roughness?: number }) => (
  <primitive object={sharedMaterial("wood", tone, { roughness })} attach="material" />
);
export const PlasterMat = ({ tone }: { tone: string }) => (
  <primitive object={sharedMaterial("plaster", tone)} attach="material" />
);
export const LinenMat = ({ tone }: { tone: string }) => (
  <primitive object={sharedMaterial("linen", tone)} attach="material" />
);
export const MetalMat = ({ tone, roughness, metalness }: { tone: string; roughness?: number; metalness?: number }) => (
  <primitive object={sharedMaterial("metal", tone, { roughness, metalness })} attach="material" />
);
