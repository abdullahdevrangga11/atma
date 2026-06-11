"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * FiddleHover — React port of CodeGrid's fiddle-digital hover effect.
 *
 * Overlays a grid of small blocks on top of the wrapped content. On mousemove
 * over the element, the closest block within `detectionRadius` activates,
 * plus a random cluster of neighbors (1..clusterSize). Active blocks paint with
 * brand colour for `blockLifetime` ms, then fade. Optional symbol scramble cycles
 * each tick.
 *
 * Tuned for compact UI nav buttons by default — block size 14, cluster up to 4,
 * brand-blue palette using ATMA tokens.
 */

const DEFAULT_SYMBOLS = ["0", "1", "+", "*", ">", "▲", "$", "/"];

type FiddleHoverConfig = {
  symbols?: string[];
  blockSize?: number;
  detectionRadius?: number;
  clusterSize?: number;
  blockLifetime?: number;
  emptyRatio?: number;
  scrambleRatio?: number;
  scrambleInterval?: number;
};

type Block = {
  el: HTMLSpanElement;
  cx: number;
  cy: number;
  gx: number;
  gy: number;
  endAt: number;
  empty: boolean;
  scramble: boolean;
  scrambleTimer: ReturnType<typeof setInterval> | null;
};

function pickSymbol(symbols: string[]): string {
  return symbols[Math.floor(Math.random() * symbols.length)];
}

export function FiddleHover({
  children,
  className,
  as = "span",
  symbols = DEFAULT_SYMBOLS,
  blockSize = 14,
  detectionRadius = 40,
  clusterSize = 4,
  blockLifetime = 380,
  emptyRatio = 0.25,
  scrambleRatio = 0.30,
  scrambleInterval = 140,
}: FiddleHoverConfig & {
  children: ReactNode;
  className?: string;
  /** Wrapper element. Use "div" for section-wide containers, "span" for inline. */
  as?: "span" | "div";
}) {
  const wrapperRef = useRef<HTMLDivElement | HTMLSpanElement | null>(null);
  const overlayRef = useRef<HTMLSpanElement | null>(null);
  const blocksRef = useRef<Block[]>([]);
  const rafRef = useRef<number | null>(null);
  const [ready, setReady] = useState(false);

  // Build the grid on mount + on size changes
  useEffect(() => {
    const wrapper = wrapperRef.current;
    const overlay = overlayRef.current;
    if (!wrapper || !overlay) return;

    const cleanupGrid = () => {
      blocksRef.current.forEach((b) => {
        if (b.scrambleTimer) clearInterval(b.scrambleTimer);
      });
      blocksRef.current = [];
      overlay.innerHTML = "";
    };

    const buildGrid = () => {
      cleanupGrid();
      const w = wrapper.offsetWidth;
      const h = wrapper.offsetHeight;
      if (w === 0 || h === 0) return;
      const cols = Math.ceil(w / blockSize);
      const rows = Math.ceil(h / blockSize);

      const out: Block[] = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const el = document.createElement("span");
          el.className = "fiddle-block";
          const empty = Math.random() < emptyRatio;
          el.textContent = empty ? "" : pickSymbol(symbols);
          el.style.width = `${blockSize}px`;
          el.style.height = `${blockSize}px`;
          el.style.left = `${c * blockSize}px`;
          el.style.top = `${r * blockSize}px`;
          el.style.fontSize = `${Math.max(8, Math.floor(blockSize * 0.62))}px`;
          overlay.appendChild(el);
          out.push({
            el,
            cx: c * blockSize + blockSize / 2,
            cy: r * blockSize + blockSize / 2,
            gx: c,
            gy: r,
            endAt: 0,
            empty,
            scramble: !empty && Math.random() < scrambleRatio,
            scrambleTimer: null,
          });
        }
      }
      blocksRef.current = out;
      setReady(true);
    };

    buildGrid();
    const ro = new ResizeObserver(() => buildGrid());
    ro.observe(wrapper);
    return () => {
      ro.disconnect();
      cleanupGrid();
    };
  }, [blockSize, emptyRatio, scrambleRatio, symbols]);

  // Mouse + lifecycle loop
  useEffect(() => {
    if (!ready) return;
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const onMove = (e: MouseEvent) => {
      const rect = wrapper.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const blocks = blocksRef.current;

      // closest block
      let closest: Block | null = null;
      let closestDist = Infinity;
      for (const b of blocks) {
        const dx = mx - b.cx;
        const dy = my - b.cy;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < closestDist) {
          closestDist = d;
          closest = b;
        }
      }
      if (!closest || closestDist > detectionRadius) return;

      const now = Date.now();
      activate(closest, now, 0);

      // grow cluster
      const count = Math.floor(Math.random() * clusterSize) + 1;
      let cur = closest;
      const active: Block[] = [closest];
      for (let i = 0; i < count; i++) {
        const neighbors = blocks.filter((n) => {
          if (active.includes(n)) return false;
          const dx = Math.abs(n.gx - cur.gx);
          const dy = Math.abs(n.gy - cur.gy);
          return dx <= 1 && dy <= 1;
        });
        if (neighbors.length === 0) break;
        const pick = neighbors[Math.floor(Math.random() * neighbors.length)];
        activate(pick, now, i + 1);
        active.push(pick);
        cur = pick;
      }
    };

    function activate(b: Block, now: number, stagger: number) {
      b.el.classList.add("fiddle-active");
      b.endAt = now + blockLifetime + stagger * 12;
      if (b.scramble && !b.scrambleTimer) {
        b.scrambleTimer = setInterval(() => {
          b.el.textContent = pickSymbol(symbols);
        }, scrambleInterval);
      }
    }

    const tick = () => {
      const now = Date.now();
      for (const b of blocksRef.current) {
        if (b.endAt > 0 && now > b.endAt) {
          b.el.classList.remove("fiddle-active");
          b.endAt = 0;
          if (b.scrambleTimer) {
            clearInterval(b.scrambleTimer);
            b.scrambleTimer = null;
            if (!b.empty) b.el.textContent = pickSymbol(symbols);
          }
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    const moveListener = onMove as unknown as EventListener;
    wrapper.addEventListener("mousemove", moveListener);
    return () => {
      wrapper.removeEventListener("mousemove", moveListener);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [ready, detectionRadius, clusterSize, blockLifetime, scrambleInterval, symbols]);

  const baseClass = as === "div"
    ? "relative block overflow-hidden"
    : "relative inline-flex items-center justify-center overflow-hidden";

  if (as === "div") {
    return (
      <div
        ref={wrapperRef as React.RefObject<HTMLDivElement>}
        className={cn(baseClass, className)}
      >
        <span ref={overlayRef} className="fiddle-overlay" aria-hidden />
        <div className="relative z-10">{children}</div>
      </div>
    );
  }
  return (
    <span
      ref={wrapperRef as React.RefObject<HTMLSpanElement>}
      className={cn(baseClass, className)}
    >
      <span ref={overlayRef} className="fiddle-overlay" aria-hidden />
      <span className="relative z-10">{children}</span>
    </span>
  );
}
