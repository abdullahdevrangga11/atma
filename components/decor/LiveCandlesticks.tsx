"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * LiveCandlesticks — base.org-style decor.
 *
 * Each stick has a TARGET height and a TICK CADENCE. Every cadence interval the
 * stick re-picks a target height (like a candle closing and a new one opening),
 * and the rAF loop eases the current height toward the target. No elastic
 * scaleY stretching — heights change discretely, which reads as market activity.
 *
 * Cursor proximity does two things:
 *   1. Speeds up the tick cadence dramatically (a "volatility zone")
 *   2. Widens the target-height range (bigger swings)
 *   3. Brightens the color via filter: brightness + saturate
 *
 * SSR-safe: initial render uses deterministic baseH/alpha/color. All randomness
 * is confined to the rAF loop which only runs post-hydration.
 */

type Stick = {
  /** % from left of container (0..100) */
  x: number;
  /** % from top of container (0..100) */
  y: number;
  /** px width */
  w: number;
  /** baseline height (px) */
  baseH: number;
  /** half-range of natural swing around baseH (px) */
  amp: number;
  color: string;
  alpha: number;
};

const C = {
  purple: "#a78bfa",
  purpleSoft: "#c8b6ff",
  purpleDeep: "#8b5cf6",
  green: "#84cc16",
  greenSoft: "#b5e36a",
  yellow: "#fbbf24",
  blue: "#60a5fa",
  pink: "#f9a8d4",
};

function row(
  startX: number,
  y: number,
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
      x: startX + i * spacing,
      y,
      w,
      baseH: heights[i % heights.length],
      amp,
      color: colors[i % colors.length],
      alpha: 0.62 + ((i * 13) % 8) * 0.035,
    });
  }
  return out;
}

const STICKS: Stick[] = [
  // top-left horizontal row — base.org has a tight row of small sticks here
  ...row(8, 16, 11, 1.3, [12, 18, 14, 20, 16, 10, 22, 14, 18, 12, 16], [C.purple, C.green, C.purpleSoft, C.yellow], 7, 12),
  // top-right scattered
  ...row(76, 20, 9, 1.5, [22, 14, 30, 18, 12, 26, 16, 20, 14], [C.purple, C.green, C.yellow, C.blue, C.purpleSoft], 7, 14),
  // mid-left tall column + tiny cluster underneath
  ...row(5, 44, 2, 1.5, [60, 32], [C.blue, C.purple], 9, 18),
  ...row(2, 60, 5, 1.5, [12, 18, 8, 14, 20], [C.green, C.yellow, C.pink], 6, 10),
  // mid-right descending
  ...row(80, 46, 9, 1.3, [28, 22, 16, 12, 18, 24, 10, 14, 18], [C.purpleDeep, C.green, C.purpleSoft, C.purple], 7, 16),
  // bottom-left
  ...row(6, 76, 7, 1.5, [14, 22, 18, 12, 20, 16, 24], [C.green, C.yellow, C.purple, C.greenSoft], 7, 13),
  // bottom-right
  ...row(80, 78, 8, 1.3, [18, 28, 14, 22, 16, 24, 12, 20], [C.purple, C.green, C.purpleSoft, C.blue], 7, 15),
];

type Props = {
  className?: string;
  /** Detection radius for cursor proximity in px. 0 disables hover. */
  hoverRadius?: number;
};

export function LiveCandlesticks({ className, hoverRadius = 200 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stickRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Per-stick mutable state — lives outside React.
    const state = STICKS.map((s, i) => ({
      currentH: s.baseH,
      targetH: s.baseH,
      // Stagger the first tick so they don't all change at once
      nextTickAt: performance.now() + 100 + (i % 13) * 80,
      // Soft proximity that decays when cursor leaves — gives sticks "afterglow"
      prox: 0,
    }));

    const cursor = { x: -9999, y: -9999, active: false };

    function onMove(e: PointerEvent) {
      const rect = container!.getBoundingClientRect();
      cursor.x = e.clientX - rect.left;
      cursor.y = e.clientY - rect.top;
      cursor.active = true;
    }
    function onLeave() {
      cursor.active = false;
    }
    container.addEventListener("pointermove", onMove);
    container.addEventListener("pointerleave", onLeave);

    function tick(now: number) {
      const rect = container!.getBoundingClientRect();
      const W = rect.width;
      const H = rect.height;

      for (let i = 0; i < STICKS.length; i++) {
        const el = stickRefs.current[i];
        if (!el) continue;
        const s = STICKS[i];
        const st = state[i];

        // Compute instantaneous cursor proximity (0..1) and ease toward it.
        let target = 0;
        if (cursor.active && hoverRadius > 0) {
          const sx = (s.x / 100) * W + s.w / 2;
          const sy = (s.y / 100) * H + st.currentH / 2;
          const d = Math.hypot(cursor.x - sx, cursor.y - sy);
          if (d < hoverRadius) {
            const k = 1 - d / hoverRadius;
            target = k * k; // ease-in: only sticks very close get full intensity
          }
        }
        // ease proximity toward instantaneous target (smooth in/out)
        st.prox += (target - st.prox) * 0.18;
        const prox = st.prox;

        // Re-tick: pick a new target height.
        if (now >= st.nextTickAt) {
          if (reduceMotion) {
            st.targetH = s.baseH;
            st.nextTickAt = now + 999_999; // effectively never re-tick
          } else {
            // Interval shrinks with proximity: 900..1600ms at rest, 110..220ms near cursor.
            const restInterval = 900 + (i % 17) * 40;
            const hotInterval = 110 + (i % 9) * 14;
            const interval = restInterval - (restInterval - hotInterval) * prox;
            st.nextTickAt = now + interval;

            // Target range widens with proximity.
            const range = s.amp * (1 + prox * 1.4);
            const noise = (Math.random() * 2 - 1) * range;
            st.targetH = Math.max(4, s.baseH + noise);
          }
        }

        // Ease currentH toward target. Faster easing near cursor so the
        // discrete ticks feel snappy in the volatility zone.
        const ease = 0.12 + prox * 0.18;
        st.currentH += (st.targetH - st.currentH) * ease;

        // Apply.
        el.style.height = `${st.currentH.toFixed(1)}px`;
        el.style.opacity = Math.min(1, s.alpha + prox * 0.3).toFixed(2);
        // Brightness + saturation lift near cursor — color pops without
        // shifting hue, so the palette stays calm.
        if (prox > 0.02) {
          el.style.filter = `brightness(${1 + prox * 0.18}) saturate(${1 + prox * 0.55})`;
        } else if (el.style.filter) {
          el.style.filter = "";
        }
      }

      raf = requestAnimationFrame(tick);
    }

    let raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      container.removeEventListener("pointermove", onMove);
      container.removeEventListener("pointerleave", onLeave);
    };
  }, [hoverRadius]);

  return (
    <div
      ref={containerRef}
      aria-hidden
      className={cn(
        // When hoverRadius > 0, capture pointer events for proximity boost.
        // When 0, behave as pure decor so any overlay above (e.g. FiddleHover)
        // owns cursor interaction.
        hoverRadius > 0 ? "pointer-events-auto" : "pointer-events-none",
        "absolute inset-0 overflow-hidden",
        className,
      )}
    >
      {STICKS.map((s, i) => (
        <span
          key={i}
          ref={(el) => {
            stickRefs.current[i] = el;
          }}
          className="absolute block rounded-[1px]"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.w,
            height: s.baseH,
            background: s.color,
            opacity: s.alpha,
            // height changes via rAF, but a tiny CSS transition smooths out
            // sub-pixel jitter when prox is near 0
            transition: "filter 180ms ease-out",
            willChange: "height, opacity",
          }}
        />
      ))}
    </div>
  );
}
