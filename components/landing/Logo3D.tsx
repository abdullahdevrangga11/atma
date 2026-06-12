"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";

/**
 * Extruded 3D AMANA logo, scroll-reactive.
 *
 * The logo is two clean SVG paths → ideal for ExtrudeGeometry: it becomes a
 * solid chunky object, not a noisy mesh. Floats gently on its own clock and
 * rotates on Y driven by the section's scroll progress (passed in via a ref so
 * no React re-render happens per frame).
 *
 * Loaded only via Logo3DLazy (dynamic, ssr:false, IntersectionObserver) so
 * three.js never touches the initial bundle.
 */

const LOGO_SVG = `<svg width="648" height="972" viewBox="0 0 648 972" xmlns="http://www.w3.org/2000/svg">
<path d="M298 0V243C287.566 313.258 232.258 368.566 162 379V431C232.258 441.434 287.566 496.742 298 567V972H0V162C0 72.5312 72.5312 0 162 0H298Z"/>
<path d="M350 567V810H486C575.469 810 648 737.469 648 648V0H350V243C360.434 313.258 415.742 368.566 486 379V431C415.742 441.434 360.434 496.742 350 567Z"/>
</svg>`;

function LogoMesh({ scrollRef }: { scrollRef: MutableRefObject<number> }) {
  const group = useRef<THREE.Group>(null);

  const geometry = useMemo(() => {
    const data = new SVGLoader().parse(LOGO_SVG);
    const shapes: THREE.Shape[] = [];
    for (const path of data.paths) {
      for (const shape of SVGLoader.createShapes(path)) shapes.push(shape);
    }

    const geom = new THREE.ExtrudeGeometry(shapes, {
      depth: 130,
      bevelEnabled: true,
      bevelThickness: 16,
      bevelSize: 9,
      bevelSegments: 3,
      curveSegments: 10,
    });

    // Center, then normalize to ~2.2 world units tall and flip Y (SVG is y-down).
    geom.center();
    geom.computeBoundingBox();
    const size = new THREE.Vector3();
    geom.boundingBox!.getSize(size);
    const s = 2.2 / size.y;
    geom.scale(s, -s, s);
    geom.center();
    geom.computeVertexNormals();
    return geom;
  }, []);

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    const scroll = scrollRef.current ?? 0;
    // Scroll drives the bulk of the Y spin; sine adds life so it never looks frozen.
    group.current.rotation.y = scroll * Math.PI * 1.15 + Math.sin(t * 0.4) * 0.18;
    group.current.rotation.x = -0.06 + Math.sin(t * 0.32) * 0.09;
    group.current.position.y = Math.sin(t * 0.8) * 0.08;
  });

  return (
    <group ref={group}>
      <mesh geometry={geometry}>
        <meshStandardMaterial
          color="#613BF9"
          metalness={0.4}
          roughness={0.22}
          side={THREE.DoubleSide}
          envMapIntensity={0.9}
        />
      </mesh>
    </group>
  );
}

export function Logo3D({
  scrollRef,
  active,
}: {
  scrollRef: MutableRefObject<number>;
  active: boolean;
}) {
  return (
    <Canvas
      camera={{ position: [0, 0, 4.3], fov: 42 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      dpr={[1, 1.75]}
      frameloop={active ? "always" : "demand"}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.65} />
      <directionalLight position={[3, 5, 6]} intensity={2.1} />
      <pointLight position={[-5, -2, 3]} intensity={1.1} color="#a78bfa" />
      <pointLight position={[4, 3, -4]} intensity={0.6} color="#ffffff" />
      <LogoMesh scrollRef={scrollRef} />
    </Canvas>
  );
}
