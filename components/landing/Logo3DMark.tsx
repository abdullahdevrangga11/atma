"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import type { MarkDrag } from "./Logo3DMarkScene";

/**
 * Centered, draggable 3D AMANA mark for the 404 page. three.js loads lazily
 * (ssr:false). Falls back to a flat SVG before mount and under
 * prefers-reduced-motion, so nothing breaks on weak devices.
 */

const Scene = dynamic(() => import("./Logo3DMarkScene").then((m) => m.Logo3DMarkScene), {
  ssr: false,
  loading: () => <FlatMark />,
});

function FlatMark() {
  return (
    <svg viewBox="0 0 648 972" className="h-[58%] w-auto text-[var(--color-primary)]" fill="currentColor" aria-hidden>
      <path d="M298 0V243C287.566 313.258 232.258 368.566 162 379V431C232.258 441.434 287.566 496.742 298 567V972H0V162C0 72.5312 72.5312 0 162 0H298Z" />
      <path d="M350 567V810H486C575.469 810 648 737.469 648 648V0H350V243C360.434 313.258 415.742 368.566 486 379V431C415.742 441.434 360.434 496.742 350 567Z" />
    </svg>
  );
}

export function Logo3DMark() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const dragRef = useRef<MarkDrag>({ rotX: 0, rotY: 0 });
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(!window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  // Cursor relative to the canvas, normalised to -1..1 and clamped.
  useEffect(() => {
    if (!enabled) return;
    const clamp = (v: number) => Math.max(-1.6, Math.min(1.6, v));
    const onMove = (e: PointerEvent) => {
      const el = wrapRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      pointerRef.current.x = clamp(((e.clientX - r.left) / r.width) * 2 - 1);
      pointerRef.current.y = clamp(-(((e.clientY - r.top) / r.height) * 2 - 1));
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [enabled]);

  // Grab + throw: drag spins it, release springs it home with a bouncy ease.
  const startDrag = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    gsap.killTweensOf(dragRef.current);
    let lastT = performance.now();
    const vel = { rotX: 0, rotY: 0 };
    const move = (ev: PointerEvent) => {
      const now = performance.now();
      const dt = Math.max(16, now - lastT) / 1000;
      lastT = now;
      const dRotY = (ev.movementX || 0) * 0.01;
      const dRotX = (ev.movementY || 0) * 0.01;
      dragRef.current.rotY += dRotY;
      dragRef.current.rotX += dRotX;
      vel.rotY = dRotY / dt;
      vel.rotX = dRotX / dt;
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      document.body.style.cursor = "";
      const d = dragRef.current;
      d.rotY += vel.rotY * 0.1;
      d.rotX += vel.rotX * 0.1;
      const mag = Math.min(1, (Math.abs(d.rotX) + Math.abs(d.rotY)) / 4);
      gsap.to(d, { rotX: 0, rotY: 0, duration: 1.15 + mag * 0.7, ease: "elastic.out(1, 0.4)" });
    };
    document.body.style.cursor = "grabbing";
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerup", up);
  }, []);

  return (
    <div
      ref={wrapRef}
      onPointerDown={enabled ? startDrag : undefined}
      className="relative mx-auto mb-2 flex h-44 w-44 items-center justify-center select-none"
      style={{ cursor: enabled ? "grab" : "default", touchAction: "none" }}
      aria-hidden
    >
      {enabled ? <Scene pointerRef={pointerRef} dragRef={dragRef} /> : <FlatMark />}
    </div>
  );
}
