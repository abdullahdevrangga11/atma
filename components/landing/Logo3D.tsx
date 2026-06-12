"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
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
}: {
  geometry: THREE.BufferGeometry;
  scrollRef: MutableRefObject<number>;
  position: [number, number, number];
  baseRotation: number;
  spin: number;
  phase: number;
  scale: number;
}) {
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime + phase;
    const scroll = scrollRef.current ?? 0;
    group.current.rotation.y = baseRotation + scroll * Math.PI * spin + Math.sin(t * 0.4) * 0.16;
    group.current.rotation.x = -0.05 + Math.sin(t * 0.3) * 0.08;
    group.current.position.y = position[1] + Math.sin(t * 0.7) * 0.12;
  });

  return (
    <group ref={group} position={position} scale={scale}>
      <mesh geometry={geometry}>
        <meshPhysicalMaterial
          color="#5b34f0"
          metalness={1}
          roughness={0.16}
          clearcoat={1}
          clearcoatRoughness={0.1}
          iridescence={0.35}
          iridescenceIOR={1.35}
          envMapIntensity={1.5}
          reflectivity={0.7}
        />
      </mesh>
    </group>
  );
}

function StudioEnv() {
  // Baked once (frames={1}) — static studio softboxes for streaky metal highlights.
  return (
    <Environment resolution={256} frames={1}>
      <Lightformer form="rect" intensity={4} position={[0, 5, -6]} scale={[14, 7, 1]} />
      <Lightformer form="rect" intensity={2.4} position={[-7, 2, 1]} scale={[3, 12, 1]} color="#c4b5fd" />
      <Lightformer form="rect" intensity={2.4} position={[7, -1, 1]} scale={[3, 12, 1]} color="#ffffff" />
      <Lightformer form="ring" intensity={2} position={[4, 5, -4]} scale={5} color="#a78bfa" />
      <Lightformer form="circle" intensity={1.6} position={[-5, -4, -2]} scale={4} />
    </Environment>
  );
}

export function Logo3D({
  scrollRef,
  active,
}: {
  scrollRef: MutableRefObject<number>;
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
      <ambientLight intensity={0.35} />
      <directionalLight position={[5, 8, 6]} intensity={1.3} />
      <StudioEnv />

      {/* top-right, bleeding off the corner */}
      <LogoInstance
        geometry={geometry}
        scrollRef={scrollRef}
        position={[5, 2.4, 0]}
        baseRotation={-0.5}
        spin={1.0}
        phase={0}
        scale={1.05}
      />
      {/* bottom-left, counter-rotating */}
      <LogoInstance
        geometry={geometry}
        scrollRef={scrollRef}
        position={[-5, -2.5, -0.5]}
        baseRotation={0.6}
        spin={-1.0}
        phase={2.5}
        scale={0.92}
      />
    </Canvas>
  );
}
