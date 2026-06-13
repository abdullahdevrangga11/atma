"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";

/**
 * A single, centered, premium 3D AMANA mark. Floats on its own clock, leans
 * toward the cursor, glows on hover, and is throwable (drag offset decays back
 * to rest via a spring in the parent). Loaded only via Logo3DMark (dynamic,
 * ssr:false) so three.js stays out of the initial bundle.
 */

const LOGO_SVG = `<svg width="648" height="972" viewBox="0 0 648 972" xmlns="http://www.w3.org/2000/svg">
<path d="M298 0V243C287.566 313.258 232.258 368.566 162 379V431C232.258 441.434 287.566 496.742 298 567V972H0V162C0 72.5312 72.5312 0 162 0H298Z"/>
<path d="M350 567V810H486C575.469 810 648 737.469 648 648V0H350V243C360.434 313.258 415.742 368.566 486 379V431C415.742 441.434 360.434 496.742 350 567Z"/>
</svg>`;

export type MarkDrag = { rotX: number; rotY: number };

function Mark({
  pointerRef,
  dragRef,
}: {
  pointerRef: MutableRefObject<{ x: number; y: number }>;
  dragRef: MutableRefObject<MarkDrag>;
}) {
  const group = useRef<THREE.Group>(null);
  const material = useRef<THREE.MeshPhysicalMaterial>(null);
  const hover = useRef(0);
  const sp = useRef({ x: 0, y: 0 });

  const geometry = useMemo(() => {
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
    const s = 2.4 / size.y;
    geom.scale(s, -s, s);
    geom.center();
    geom.computeVertexNormals();
    return geom;
  }, []);

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    sp.current.x = THREE.MathUtils.lerp(sp.current.x, pointerRef.current.x, 0.08);
    sp.current.y = THREE.MathUtils.lerp(sp.current.y, pointerRef.current.y, 0.08);
    const px = sp.current.x;
    const py = sp.current.y;

    // Hover ramps when cursor is near the canvas center.
    const dist = Math.hypot(px, py);
    const target = 1 - Math.min(1, Math.max(0, (dist - 0.1) / (0.9 - 0.1)));
    hover.current = THREE.MathUtils.lerp(hover.current, target * target * (3 - 2 * target), 0.1);
    const h = hover.current;

    const drag = dragRef.current;
    group.current.rotation.y = Math.sin(t * 0.45) * 0.35 + px * (0.3 + h * 0.4) + drag.rotY;
    group.current.rotation.x = -0.05 + Math.sin(t * 0.35) * 0.12 - py * (0.25 + h * 0.3) + drag.rotX;
    group.current.position.y = Math.sin(t * 0.8) * 0.07;
    group.current.scale.setScalar(1 + h * 0.08);

    if (material.current) material.current.emissiveIntensity = 0.34 + h * 0.85;
  });

  return (
    <group ref={group}>
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
          emissiveIntensity={0.34}
          envMapIntensity={2.1}
          reflectivity={0.85}
        />
      </mesh>
    </group>
  );
}

export function Logo3DMarkScene({
  pointerRef,
  dragRef,
}: {
  pointerRef: MutableRefObject<{ x: number; y: number }>;
  dragRef: MutableRefObject<MarkDrag>;
}) {
  return (
    <Canvas
      camera={{ position: [0, 0, 4.6], fov: 42 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      dpr={[1, 2]}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 8, 6]} intensity={1.5} />
      <Environment resolution={256} frames={1}>
        <color attach="background" args={["#0a0a16"]} />
        <Lightformer form="rect" intensity={0.6} position={[0, 0, -8]} scale={[20, 20, 1]} color="#3a2f6e" />
        <Lightformer form="rect" intensity={5} position={[0, 6, -6]} scale={[16, 8, 1]} color="#ffffff" />
        <Lightformer form="rect" intensity={3.2} position={[-8, 2, 2]} scale={[3, 14, 1]} color="#c4b5fd" />
        <Lightformer form="rect" intensity={3.2} position={[8, -1, 2]} scale={[3, 14, 1]} color="#ffffff" />
        <Lightformer form="ring" intensity={3} position={[5, 6, -4]} scale={6} color="#a78bfa" />
      </Environment>
      <Mark pointerRef={pointerRef} dragRef={dragRef} />
      <EffectComposer>
        <Bloom intensity={0.9} luminanceThreshold={0.55} luminanceSmoothing={0.3} mipmapBlur />
      </EffectComposer>
    </Canvas>
  );
}
