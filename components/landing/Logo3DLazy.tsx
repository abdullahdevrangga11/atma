"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

/**
 * Lazy, scroll-reactive 3D logo for the "Where treasury meets RWA" section.
 *
 * Three.js is heavy (~150KB gz), so this:
 *   1. Renders a flat SVG fallback by default (zero JS).
 *   2. Mounts the R3F <Canvas> only once the section is within 300px of the
 *      viewport (IntersectionObserver) — three.js stays out of the initial
 *      bundle and only downloads when the user is about to see it.
 *   3. Tracks the section's scroll progress in a ref (no re-render) and feeds
 *      it to the scene so rotation follows the scroll.
 *   4. Pauses the render loop (frameloop="demand") when off-screen to save
 *      battery / GPU.
 *
 * Respects prefers-reduced-motion: stays on the flat SVG if the user opted out.
 */

const Logo3D = dynamic(() => import("./Logo3D").then((m) => m.Logo3D), {
  ssr: false,
  loading: () => <FlatLogo />,
});

function FlatLogo() {
  return (
    <svg
      viewBox="0 0 648 972"
      className="h-[44%] w-auto text-[var(--color-primary)] opacity-90"
      fill="currentColor"
      aria-hidden
    >
      <path d="M298 0V243C287.566 313.258 232.258 368.566 162 379V431C232.258 441.434 287.566 496.742 298 567V972H0V162C0 72.5312 72.5312 0 162 0H298Z" />
      <path d="M350 567V810H486C575.469 810 648 737.469 648 648V0H350V243C360.434 313.258 415.742 368.566 486 379V431C415.742 441.434 360.434 496.742 350 567Z" />
    </svg>
  );
}

export function Logo3DLazy() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef(0);
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || reduced) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setMounted(true);
        setActive(entry.isIntersecting);
      },
      { rootMargin: "300px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  useEffect(() => {
    if (reduced) return;
    const onScroll = () => {
      const el = wrapRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // 0 as the block enters from the bottom → 1 as it exits past the top.
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
  }, [reduced]);

  return (
    <div
      ref={wrapRef}
      className="relative mx-auto mb-16 flex items-center justify-center"
      style={{ height: "clamp(220px, 30vw, 360px)", width: "100%" }}
      aria-hidden
    >
      {reduced || !mounted ? <FlatLogo /> : <Logo3D scrollRef={scrollRef} active={active} />}
    </div>
  );
}
