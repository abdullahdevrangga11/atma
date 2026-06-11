"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * LiveCandlesticks — a base.org-style decor where every candlestick
 * continuously breathes height like a live market chart, and spikes
 * on cursor proximity. No canvas, no SVG: each stick is a DOM `<span>`
 * whose `transform: scaleY()` and `opacity` are mutated in a rAF loop.
 *
 * Layout is deterministic (SSR-safe). Per-stick phase/period are seeded
 * from the stick index so the initial paint matches across server/client,
 * then the rAF loop introduces visual variety after hydration.
 */

type Stick = {
  /** % from left of container (0..100) */
  x: number;
  /** % from top of container (0..100) */
  y: number;
  /** px width */
  w: number;
  /** px height — the "baseline" height; live height swings ±amp around this */
  baseH: number;
  /** amplitude of height swing (px) */
  amp: number;
  /** seconds for a full sine cycle */
  period: number;
  /** initial phase offset (radians) */
  phase: number;
  color: string;
  /** opacity baseline */
  alpha: number;
};

const C = {
  purple: "#a78bfa",
  purpleSoft: "#c8b6ff",
  green: "#84cc16",
  greenSoft: "#b5e36a",
  yellow: "#fbbf24",
  blue: "#60a5fa",
  pink: "#f9a8d4",
  ink: "#0a0a0b",
};

/**
 * Build a horizontal row cluster: N adjacent sticks in a row at the given Y,
 * spaced by `spacing` % horizontally. Heights cycle through `heights`,
 * colors cycle through `colors`. Phases/periods are deterministic per index.
 */
function row(
  startX: number,
  y: number,
  count: number,
  spacing: number,
  heights: number[],
  colors: string[],
  w = 8,
  amp = 16,
): Stick[] {
  const out: Stick[] = [];
  for (let i = 0; i < count; i++) {
    out.push({
      x: startX + i * spacing,
      y,
      w,
      baseH: heights[i % heights.length],
      amp,
      period: 2.8 + ((i * 17) % 25) * 0.12, // 2.8..5.8s, deterministic
      phase: (i * 0.7) % (Math.PI * 2),
      color: colors[i % colors.length],
      alpha: 0.55 + ((i * 13) % 10) * 0.04, // 0.55..0.91
    });
  }
  return out;
}

/**
 * Build a vertical column cluster.
 */
function col(
  x: number,
  startY: number,
  count: number,
  spacing: number,
  heights: number[],
  colors: string[],
  w = 8,
  amp = 14,
): Stick[] {
  const out: Stick[] = [];
  for (let i = 0; i < count; i++) {
    out.push({
      x,
      y: startY + i * spacing,
      w,
      baseH: heights[i % heights.length],
      amp,
      period: 3.4 + ((i * 11) % 18) * 0.15,
      phase: (i * 1.3) % (Math.PI * 2),
      color: colors[i % colors.length],
      alpha: 0.55 + ((i * 7) % 10) * 0.04,
    });
  }
  return out;
}

// Six scattered clusters mirroring the base.org composition.
// Numbers chosen to leave the centered hero copy room to breathe.
const STICKS: Stick[] = [
  // top-left horizontal row (small, dense)
  ...row(8, 16, 10, 1.4, [12, 18, 14, 20, 16, 10, 22, 14], [C.purple, C.green, C.purpleSoft, C.yellow], 7, 14),
  // top-right scattered cluster
  ...row(78, 20, 8, 1.6, [22, 14, 30, 18, 12, 26, 16, 20], [C.purple, C.green, C.yellow, C.blue], 7, 16),
  // mid-left single tall + a few
  ...col(6, 44, 1, 0, [60], [C.blue], 9, 22),
  ...row(2, 56, 5, 1.6, [12, 18, 8, 14, 20], [C.green, C.yellow, C.pink], 7, 12),
  // mid-right (descending cluster)
  ...row(80, 46, 8, 1.4, [28, 22, 16, 12, 18, 24, 10, 14], [C.purple, C.green, C.purpleSoft], 7, 18),
  // bottom-left small cluster
  ...row(8, 76, 6, 1.6, [14, 22, 18, 12, 20, 16], [C.green, C.yellow, C.purple], 7, 14),
  // bottom-right cluster
  ...row(82, 78, 7, 1.4, [18, 28, 14, 22, 16, 24, 12], [C.purple, C.green, C.purpleSoft, C.blue], 7, 16),
];

type Props = {
  className?: string;
  /** Detection radius for cursor proximity boost (px). 0 disables hover. */
  hoverRadius?: number;
  /** Max extra scaleY applied at cursor center. 1 = doubles the height. */
  hoverBoost?: number;
};

export function LiveCandlesticks({
  className,
  hoverRadius = 180,
  hoverBoost = 1.4,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stickRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const cursor = useRef<{ x: number; y: number; active: boolean }>({
    x: -9999,
    y: -9999,
    active: false,
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function onMove(e: PointerEvent) {
      const rect = container!.getBoundingClientRect();
      cursor.current.x = e.clientX - rect.left;
      cursor.current.y = e.clientY - rect.top;
      cursor.current.active = true;
    }
    function onLeave() {
      cursor.current.active = false;
    }
    container.addEventListener("pointermove", onMove);
    container.addEventListener("pointerleave", onLeave);

    let raf = 0;
    const start = performance.now();

    function tick(now: number) {
      const t = (now - start) / 1000;
      const rect = container!.getBoundingClientRect();
      const W = rect.width;
      const H = rect.height;

      for (let i = 0; i < STICKS.length; i++) {
        const el = stickRefs.current[i];
        if (!el) continue;
        const s = STICKS[i];

        // base sine swing — height grows/shrinks smoothly around baseH
        const swing = reduceMotion ? 0 : Math.sin((t * (Math.PI * 2)) / s.period + s.phase);
        const liveH = Math.max(4, s.baseH + swing * s.amp);

        // cursor-proximity spike
        let boost = 0;
        if (cursor.current.active && hoverRadius > 0) {
          const sx = (s.x / 100) * W + s.w / 2;
          const sy = (s.y / 100) * H + liveH / 2;
          const dx = cursor.current.x - sx;
          const dy = cursor.current.y - sy;
          const dist = Math.hypot(dx, dy);
          if (dist < hoverRadius) {
            const k = 1 - dist / hoverRadius; // 1 near, 0 far
            boost = k * k * hoverBoost; // ease-in for a punchier spike
          }
        }

        const scaleY = (liveH / s.baseH) * (1 + boost);
        // small opacity breath in sync with swing — looks like volume
        const a = s.alpha + swing * 0.12 + boost * 0.2;

        el.style.transform = `scaleY(${scaleY.toFixed(3)})`;
        el.style.opacity = Math.min(1, a).toFixed(3);
      }

      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      container.removeEventListener("pointermove", onMove);
      container.removeEventListener("pointerleave", onLeave);
    };
  }, [hoverRadius, hoverBoost]);

  return (
    <div
      ref={containerRef}
      aria-hidden
      className={cn(
        "pointer-events-auto absolute inset-0 overflow-hidden",
        className,
      )}
    >
      {STICKS.map((s, i) => (
        <span
          key={i}
          ref={(el) => {
            stickRefs.current[i] = el;
          }}
          className="absolute block rounded-[1px] will-change-transform"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.w,
            height: s.baseH,
            background: s.color,
            opacity: s.alpha,
            transformOrigin: "center",
          }}
        />
      ))}
    </div>
  );
}
