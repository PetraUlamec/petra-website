"use client";

import { Table } from "../Furniture";
import { BenchVise, CarvedSpoons, FloorShavings, HandSaw, ToolJar } from "./taller";

type Point = [number, number, number];

function Timber({ position, size, color = "#9b7047" }: { position: Point; size: Point; color?: string }) {
  return <mesh position={position} castShadow receiveShadow>
    <boxGeometry args={size} /><meshStandardMaterial color={color} roughness={0.85} />
  </mesh>;
}

function Chisel({ position, turn = 0, color = "#b48750" }: { position: Point; turn?: number; color?: string }) {
  return <group position={position} rotation={[turn, 0, 0]}>
    <mesh position={[0, 0.1, 0]} castShadow><capsuleGeometry args={[0.035, 0.16, 4, 10]} /><meshStandardMaterial color={color} roughness={0.8} /></mesh>
    <mesh position={[0, -0.025, 0]}><cylinderGeometry args={[0.038, 0.038, 0.045, 10]} /><meshStandardMaterial color="#a49b87" metalness={0.65} roughness={0.4} /></mesh>
    <mesh position={[0, -0.16, 0]} castShadow><boxGeometry args={[0.037, 0.23, 0.012]} /><meshStandardMaterial color="#bcbbae" metalness={0.7} roughness={0.3} /></mesh>
    <mesh position={[0, -0.28, 0.005]} rotation={[-0.25, 0, 0]}><boxGeometry args={[0.047, 0.035, 0.008]} /><meshStandardMaterial color="#e3e2d9" metalness={0.7} roughness={0.25} /></mesh>
  </group>;
}

function HandPlane() {
  return <group name="erik-hand-plane" position={[0.45, 1.065, -0.12]} rotation={[0, -0.2, 0]}>
    <Timber position={[0, 0.03, 0]} size={[0.48, 0.07, 0.18]} color="#8b5532" />
    <mesh position={[0, -0.008, 0]}><boxGeometry args={[0.49, 0.014, 0.185]} /><meshStandardMaterial color="#9a9a91" metalness={0.6} roughness={0.5} /></mesh>
    <mesh position={[0.03, 0.12, 0]} rotation={[0, 0, -0.5]}><boxGeometry args={[0.025, 0.16, 0.1]} /><meshStandardMaterial color="#4b504b" metalness={0.7} roughness={0.4} /></mesh>
    <mesh position={[-0.16, 0.12, 0]} castShadow><sphereGeometry args={[0.06, 12, 10]} /><meshStandardMaterial color="#62412d" roughness={0.7} /></mesh>
    <mesh position={[0.17, 0.14, 0]} rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[0.07, 0.023, 8, 16, Math.PI * 1.6]} /><meshStandardMaterial color="#70442c" roughness={0.8} /></mesh>
    <mesh position={[-0.04, 0.15, 0]} rotation={[0, 0, 0.2]}><torusGeometry args={[0.047, 0.008, 5, 14, Math.PI * 1.6]} /><meshStandardMaterial color="#e8cd96" roughness={1} /></mesh>
  </group>;
}

function SpoonSketch() {
  return <group name="erik-spoon-sketch" position={[-0.85, 1.053, -0.31]} rotation={[0, 0.12, 0]}>
    <Timber position={[0, 0, 0]} size={[0.5, 0.006, 0.36]} color="#eadcb9" />
    {[-0.12, 0.12].map((offset) => <group key={offset} position={[offset, 0.005, 0]}>
      <mesh position={[0, 0, -0.09]} rotation={[-Math.PI / 2, 0, 0]} scale={[0.65, 1, 1]}>
        <ringGeometry args={[0.042, 0.047, 22]} /><meshBasicMaterial color="#6b604c" />
      </mesh>
      <Timber position={[0, 0.001, 0.055]} size={[0.01, 0.002, 0.2]} color="#6b604c" />
    </group>)}
    <mesh position={[0.3, 0.012, 0]} rotation={[Math.PI / 2, 0.25, 0]}><cylinderGeometry args={[0.008, 0.008, 0.32, 6]} /><meshStandardMaterial color="#b2863f" roughness={1} /></mesh>
  </group>;
}

export default function ErikWorkbench({ position }: { position: Point }) {
  return <group name="erik-workbench" position={position}>
    <Table position={[0, 0, 0]} w={3.4} d={1.5} />
    <Timber position={[0, 0.89, 0.64]} size={[3.15, 0.22, 0.16]} color="#785035" />
    <Timber position={[0, 0.28, 0]} size={[3.05, 0.08, 1.15]} color="#88613d" />
    {[-0.92, 0, 0.92].map((offset) => <group key={offset} name="erik-drawer">
      <Timber position={[offset, 0.69, 0.61]} size={[0.84, 0.23, 0.12]} color="#a77a4b" />
      <mesh position={[offset, 0.69, 0.7]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.035, 0.035, 0.045, 10]} /><meshStandardMaterial color="#39342a" metalness={0.55} roughness={0.5} /></mesh>
    </group>)}
    {Array.from({ length: 5 }, (_, index) => <Timber key={index} position={[-0.65 + index * 0.32, 0.37, 0.05]} size={[0.25, 0.1, 0.85 - index * 0.06]} color={["#c79e67", "#ad7744", "#7b4b32"][index % 3]} />)}
    {[-1.43, 1.43].map(offset => <group key={offset} name="erik-board-support"><Timber position={[offset, 1.7, -0.7]} size={[0.08, 1.45, 0.1]} color="#785035" /></group>)}
    <group name="erik-tool-board" position={[0, 1.95, -0.68]}>
      <Timber position={[0, 0, 0]} size={[3.12, 0.96, 0.055]} color="#775338" />
      {[-0.36, 0, 0.36].map(height => <Timber key={height} position={[0, height, 0.035]} size={[3.12, 0.016, 0.02]} color="#60432e" />)}
      {Array.from({ length: 5 }, (_, index) => <group key={index} position={[-1.1 + index * 0.28, 0.06, 0.08]}>
        <mesh position={[0, 0.19, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.04, 0.008, 6, 12, Math.PI]} /><meshStandardMaterial color="#3c3b33" metalness={0.5} roughness={0.6} /></mesh>
        <Chisel position={[0, 0, 0.02]} color={index % 2 ? "#c2965a" : "#a36c41"} />
      </group>)}
      <HandSaw position={[0.9, 0.16, 0.08]} />
      <Timber position={[0.44, 0.04, 0.07]} size={[0.035, 0.55, 0.03]} color="#c7a76c" />
      <Timber position={[0.57, -0.22, 0.07]} size={[0.3, 0.035, 0.03]} color="#c7a76c" />
    </group>
    <BenchVise position={[1.25, 1.05, 0.62]} />
    <Timber position={[1.25, 1.18, 0.68]} size={[0.12, 0.07, 0.42]} color="#c9a675" />
    <group name="erik-spoon-process" position={[-0.75, 1.055, 0.3]}>
      <Timber position={[0, 0.005, 0]} size={[0.98, 0.02, 0.45]} color="#8b6742" />
      <group position={[0, 0.015, 0]} scale={1.35}><CarvedSpoons position={[0, 0, 0]} /></group>
    </group>
    <HandPlane />
    <SpoonSketch />
    <ToolJar position={[-1.4, 1.05, -0.37]} />
    <Chisel position={[0.2, 1.085, 0.37]} turn={Math.PI / 2} />
    <group name="erik-mallet" position={[0.77, 1.07, 0.35]} rotation={[0, 0.3, 0]}>
      <Timber position={[0, 0.01, 0.06]} size={[0.045, 0.045, 0.32]} color="#cda875" />
      <Timber position={[0, 0.04, -0.12]} size={[0.24, 0.12, 0.12]} color="#93613c" />
    </group>
    <FloorShavings position={[0.35, 1.038, 0.18]} spread={0.24} count={5} />
    <Timber position={[1.4, 1.075, -0.35]} size={[0.25, 0.05, 0.17]} color="#af9271" />
    <mesh position={[1.04, 1.105, -0.38]}><cylinderGeometry args={[0.095, 0.095, 0.11, 16]} /><meshStandardMaterial color="#697454" roughness={0.85} /></mesh>
    <mesh position={[1.04, 1.1675, -0.38]}><cylinderGeometry args={[0.098, 0.098, 0.015, 16]} /><meshStandardMaterial color="#c2b692" metalness={0.3} roughness={0.6} /></mesh>
  </group>;
}
