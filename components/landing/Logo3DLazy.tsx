"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

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
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(false);
  const [enabled, setEnabled] = useState(false);

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

  if (!enabled) return null;

  return (
    <div
      ref={wrapRef}
      className="pointer-events-none absolute inset-0 z-0 select-none"
      aria-hidden
    >
      {mounted ? <Logo3D scrollRef={scrollRef} active={active} /> : null}
    </div>
  );
}
