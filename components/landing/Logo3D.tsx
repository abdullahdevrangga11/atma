"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";

/**
 * Premium extruded AMANA logo, scroll-reactive — two instances bleeding into
 * the top-right and bottom-left corners as ambient decoration.
 *
 * Premium look comes from image-based lighting: a baked Lightformer studio
 * environment (no external HDR file) gives the metal long specular streaks,
 * and meshPhysicalMaterial adds clearcoat + a hint of iridescence. The logos
 * spin on scroll so the reflections sweep across the surface.
 *
 * One Canvas, two meshes (shared geometry) = a single WebGL context.
 */

export type DragState = { rotX: number; rotY: number; posX: number; posY: number };

const LOGO_SVG = `<svg width="648" height="972" viewBox="0 0 648 972" xmlns="http://www.w3.org/2000/svg">
<path d="M298 0V243C287.566 313.258 232.258 368.566 162 379V431C232.258 441.434 287.566 496.742 298 567V972H0V162C0 72.5312 72.5312 0 162 0H298Z"/>
<path d="M350 567V810H486C575.469 810 648 737.469 648 648V0H350V243C360.434 313.258 415.742 368.566 486 379V431C415.742 441.434 360.434 496.742 350 567Z"/>
</svg>`;

function useLogoGeometry() {
  return useMemo(() => {
    const data = new SVGLoader().parse(LOGO_SVG);
    const shapes: THREE.Shape[] = [];
    for (const path of data.paths) {
      for (const shape of SVGLoader.createShapes(path)) shapes.push(shape);
    }
    const geom = new THREE.ExtrudeGeometry(shapes, {
      depth: 150,
      bevelEnabled: true,
      bevelThickness: 22,
      bevelSize: 12,
      bevelSegments: 5,
      curveSegments: 14,
    });
    geom.center();
    geom.computeBoundingBox();
    const size = new THREE.Vector3();
    geom.boundingBox!.getSize(size);
    const s = 2.2 / size.y;
    geom.scale(s, -s, s); // normalize height + flip SVG y-down
    geom.center();
    geom.computeVertexNormals();
    return geom;
  }, []);
}

function LogoInstance({
  geometry,
  scrollRef,
  position,
  baseRotation,
  spin,
  phase,
  scale,
  pointerRef,
  dragRef,
  anchor,
}: {
  geometry: THREE.BufferGeometry;
  scrollRef: MutableRefObject<number>;
  position: [number, number, number];
  baseRotation: number;
  spin: number;
  phase: number;
  scale: number;
  pointerRef: MutableRefObject<{ x: number; y: number }>;
  dragRef: MutableRefObject<DragState>;
  anchor: [number, number];
}) {
  const group = useRef<THREE.Group>(null);
  const material = useRef<THREE.MeshPhysicalMaterial>(null);
  const hover = useRef(0);
  const sp = useRef({ x: 0, y: 0 }); // smoothed pointer

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime + phase;
    const scroll = scrollRef.current ?? 0;

    // Ease the pointer so fast mouse moves glide instead of snapping.
    sp.current.x = THREE.MathUtils.lerp(sp.current.x, pointerRef.current.x, 0.08);
    sp.current.y = THREE.MathUtils.lerp(sp.current.y, pointerRef.current.y, 0.08);
    const px = sp.current.x;
    const py = sp.current.y;

    // Proximity to this logo's corner → hover factor (1 near, 0 far), eased.
    const dist = Math.hypot(px - anchor[0], py - anchor[1]);
    const target = 1 - Math.min(1, Math.max(0, (dist - 0.25) / (0.95 - 0.25)));
    hover.current = THREE.MathUtils.lerp(hover.current, target * target * (3 - 2 * target), 0.1);
    const h = hover.current;

    // Spin a touch faster + lean toward the cursor when hovered.
    // dragRef is the throwable offset (driven directly while dragging, then by
    // a GSAP inertia tween that decays everything back to 0 on release):
    // rotX/rotY tumble it, posX/posY physically shove it.
    const drag = dragRef.current;
    group.current.rotation.y =
      baseRotation + scroll * Math.PI * spin + Math.sin(t * 0.4) * 0.16 + px * (0.22 + h * 0.32) + drag.rotY;
    group.current.rotation.x = -0.05 + Math.sin(t * 0.3) * 0.08 - py * (0.16 + h * 0.24) + drag.rotX;
    group.current.position.x = position[0] + drag.posX;
    group.current.position.y = position[1] + Math.sin(t * 0.7) * 0.12 + h * 0.18 + drag.posY;
    group.current.scale.setScalar(scale * (1 + h * 0.14));

    // Glow harder when hovered (bloom amplifies this into a real flare).
    if (material.current) material.current.emissiveIntensity = 0.32 + h * 0.9;
  });

  return (
    <group ref={group} position={position} scale={scale}>
      <mesh geometry={geometry}>
        <meshPhysicalMaterial
          ref={material}
          color="#6b46ff"
          metalness={0.9}
          roughness={0.18}
          clearcoat={1}
          clearcoatRoughness={0.08}
          iridescence={0.45}
          iridescenceIOR={1.4}
          emissive="#3a1d9e"
          emissiveIntensity={0.32}
          envMapIntensity={2.1}
          reflectivity={0.85}
        />
      </mesh>
    </group>
  );
}

function StudioEnv() {
  // Baked once (frames={1}) — studio softboxes for streaky metal highlights.
  // A large dim fill keeps the metal body from ever reading as black.
  return (
    <Environment resolution={256} frames={1}>
      <color attach="background" args={["#0a0a16"]} />
      <Lightformer form="rect" intensity={0.6} position={[0, 0, -8]} scale={[20, 20, 1]} color="#3a2f6e" />
      <Lightformer form="rect" intensity={5} position={[0, 6, -6]} scale={[16, 8, 1]} color="#ffffff" />
      <Lightformer form="rect" intensity={3.2} position={[-8, 2, 2]} scale={[3, 14, 1]} color="#c4b5fd" />
      <Lightformer form="rect" intensity={3.2} position={[8, -1, 2]} scale={[3, 14, 1]} color="#ffffff" />
      <Lightformer form="ring" intensity={3} position={[5, 6, -4]} scale={6} color="#a78bfa" />
      <Lightformer form="circle" intensity={2.4} position={[-6, -5, -2]} scale={5} color="#8b6dff" />
    </Environment>
  );
}

export function Logo3D({
  scrollRef,
  pointerRef,
  dragRefs,
  active,
}: {
  scrollRef: MutableRefObject<number>;
  pointerRef: MutableRefObject<{ x: number; y: number }>;
  dragRefs: [MutableRefObject<DragState>, MutableRefObject<DragState>];
  active: boolean;
}) {
  const geometry = useLogoGeometry();

  return (
    <Canvas
      camera={{ position: [0, 0, 10], fov: 35 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      dpr={[1, 2]}
      frameloop={active ? "always" : "demand"}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 8, 6]} intensity={1.5} />
      <StudioEnv />

      {/* top-right, bigger, bleeding well off the corner */}
      <LogoInstance
        geometry={geometry}
        scrollRef={scrollRef}
        pointerRef={pointerRef}
        dragRef={dragRefs[0]}
        anchor={[0.7, 0.62]}
        position={[6.4, 3.0, 0]}
        baseRotation={-0.5}
        spin={1.0}
        phase={0}
        scale={1.7}
      />
      {/* bottom-left, counter-rotating, bigger */}
      <LogoInstance
        geometry={geometry}
        scrollRef={scrollRef}
        pointerRef={pointerRef}
        dragRef={dragRefs[1]}
        anchor={[-0.7, -0.64]}
        position={[-6.4, -3.1, -0.5]}
        baseRotation={0.6}
        spin={-1.0}
        phase={2.5}
        scale={1.5}
      />

      <EffectComposer>
        <Bloom
          intensity={0.9}
          luminanceThreshold={0.55}
          luminanceSmoothing={0.3}
          mipmapBlur
        />
      </EffectComposer>
    </Canvas>
  );
}
