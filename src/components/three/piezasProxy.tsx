"use client";
// Reexporta piezas existentes con firma uniforme para el editor (posición/rotY/escala).
import { Sconce as SconceBase, Armchair as ArmchairBase, Lantern as LanternBase, HoneyPot as HoneyPotBase, CheeseWheel as CheeseWheelBase, Sack as SackBase } from "./Decor";
import { ThreeLegStool } from "./deco/taller";
export const Sconce = SconceBase;
export const Armchair = ArmchairBase;
export const Lantern = LanternBase;
export const HoneyPot = HoneyPotBase;
export const CheeseWheel = CheeseWheelBase;
export const Sack = SackBase;
export const ThreeLegStoolProxy = ThreeLegStool;
