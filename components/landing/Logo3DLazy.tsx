"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { InertiaPlugin } from "gsap/InertiaPlugin";

gsap.registerPlugin(InertiaPlugin);

/**
 * Lazy, scroll-reactive 3D logo decoration for the "Where treasury meets RWA"
 * section. Renders as an ABSOLUTE layer filling the section (behind content),
 * with two logos bleeding into opposite corners — it never takes layout space.
 *
 * Guardrails:
 *   - three.js is a DYNAMIC chunk (ssr:false) — out of the initial bundle.
 *   - mounts only when the section is within 300px of the viewport.
 *   - desktop only (≥768px) and skipped under prefers-reduced-motion, so it
 *     never collides with stacked mobile content or fights low-power devices.
 *   - render loop pauses (frameloop="demand") when off-screen.
 *   - scroll progress tracked in a ref (no per-frame React re-render).
 */

const Logo3D = dynamic(() => import("./Logo3D").then((m) => m.Logo3D), {
  ssr: false,
});

export function Logo3DLazy() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef(0);
  const pointerRef = useRef({ x: 0, y: 0 });
  const dragA = useRef({ x: 0, y: 0 });
  const dragB = useRef({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(false);
  const [enabled, setEnabled] = useState(false);

  // Grab a logo, throw it — GSAP InertiaPlugin carries the momentum and decays
  // the rotation offset back to 0 (rest) for a springy "physics" return.
  const startDrag = useCallback(
    (dragRef: typeof dragA) => (e: React.PointerEvent) => {
      e.preventDefault();
      gsap.killTweensOf(dragRef.current);
      let lastT = performance.now();
      let velX = 0;
      let velY = 0;

      const move = (ev: PointerEvent) => {
        const now = performance.now();
        const dt = Math.max(16, now - lastT) / 1000;
        lastT = now;
        const dyaw = (ev.movementX || 0) * 0.012;
        const dpitch = (ev.movementY || 0) * 0.012;
        dragRef.current.y += dyaw;
        dragRef.current.x += dpitch;
        velY = dyaw / dt;
        velX = dpitch / dt;
      };
      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        document.body.style.cursor = "";
        gsap.to(dragRef.current, {
          inertia: {
            y: { velocity: velY, end: 0 },
            x: { velocity: velX, end: 0 },
            resistance: 140,
            duration: { min: 0.6, max: 2.4 },
          },
        });
      };

      document.body.style.cursor = "grabbing";
      window.addEventListener("pointermove", move, { passive: true });
      window.addEventListener("pointerup", up);
    },
    [],
  );

  useEffect(() => {
    const ok =
      window.innerWidth >= 768 &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setEnabled(ok);
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || !enabled) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setMounted(true);
        setActive(entry.isIntersecting);
      },
      { rootMargin: "300px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const onScroll = () => {
      const el = wrapRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const p = 1 - (rect.top + rect.height / 2) / vh;
      scrollRef.current = Math.max(-0.5, Math.min(1.5, p));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const clamp = (v: number) => Math.max(-1.6, Math.min(1.6, v));
    const onMove = (e: PointerEvent) => {
      const el = wrapRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      // Normalised to the section: -1..1 inside it, clamped so the cursor being
      // far away on the page can't drive the rotation to wild values.
      pointerRef.current.x = clamp(((e.clientX - rect.left) / rect.width) * 2 - 1);
      pointerRef.current.y = clamp(-(((e.clientY - rect.top) / rect.height) * 2 - 1));
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      <div
        ref={wrapRef}
        className="pointer-events-none absolute inset-0 z-0 select-none"
        aria-hidden
      >
        {mounted ? (
          <Logo3D
            scrollRef={scrollRef}
            pointerRef={pointerRef}
            dragRefs={[dragA, dragB]}
            active={active}
          />
        ) : null}
      </div>

      {/* Invisible drag handles over each logo's corner. Grab → throw → it
          spins with momentum and springs back. Corners have no interactive
          content, so capturing pointer here is harmless. */}
      {mounted && (
        <>
          <div
            onPointerDown={startDrag(dragA)}
            className="absolute right-0 top-0 z-20 h-[clamp(180px,26vw,340px)] w-[clamp(180px,26vw,340px)] cursor-grab touch-none active:cursor-grabbing"
            aria-hidden
          />
          <div
            onPointerDown={startDrag(dragB)}
            className="absolute bottom-0 left-0 z-20 h-[clamp(180px,26vw,340px)] w-[clamp(180px,26vw,340px)] cursor-grab touch-none active:cursor-grabbing"
            aria-hidden
          />
        </>
      )}
    </>
  );
}
