"use client";

import { useEffect, useRef } from "react";

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Skip on touch devices
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    let dotX = 0,
      dotY = 0,
      ringX = 0,
      ringY = 0,
      targetX = 0,
      targetY = 0;

    const onMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
    };

    const onOverInteractive = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("a, button, [data-cursor-hover]")) {
        document.body.classList.add("cursor-hovered");
      } else {
        document.body.classList.remove("cursor-hovered");
      }
    };

    const raf = () => {
      // Dot — instant follow
      dotX += (targetX - dotX) * 0.55;
      dotY += (targetY - dotY) * 0.55;
      dot.style.transform = `translate(${dotX}px, ${dotY}px) translate(-50%, -50%)`;

      // Ring — lagged follow
      ringX += (targetX - ringX) * 0.16;
      ringY += (targetY - ringY) * 0.16;
      ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;

      rafId = requestAnimationFrame(raf);
    };

    let rafId = requestAnimationFrame(raf);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseover", onOverInteractive);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOverInteractive);
      document.body.classList.remove("cursor-hovered");
    };
  }, []);

  return (
    <>
      <div ref={ringRef} className="cursor-ring hidden md:block" />
      <div ref={dotRef} className="cursor-dot hidden md:block" />
    </>
  );
}
