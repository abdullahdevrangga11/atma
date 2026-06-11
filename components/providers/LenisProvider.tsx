"use client";

import { useEffect, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Mounts Lenis once and wires it into GSAP's ticker so every
 * ScrollTrigger-driven section (split cards, hero showcase, future
 * scroll-pinned diagrams) gets the same buttery cadence with no
 * desync between native scroll and the smooth-scroll engine.
 */
export function LenisProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    let cleanup: (() => void) | null = null;

    (async () => {
      const { default: Lenis } = await import("lenis");
      const instance = new Lenis({
        duration: 1.1,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
      });

      const onScroll = () => ScrollTrigger.update();
      instance.on("scroll", onScroll);

      const raf = (time: number) => instance.raf(time * 1000);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);

      cleanup = () => {
        gsap.ticker.remove(raf);
        instance.off("scroll", onScroll);
        instance.destroy();
      };
    })();

    return () => {
      cleanup?.();
    };
  }, []);

  return <>{children}</>;
}
