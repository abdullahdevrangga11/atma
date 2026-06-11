"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type MouseEvent,
} from "react";
import { useRouter } from "next/navigation";
import Link, { type LinkProps } from "next/link";

/**
 * KVS Studio-style dissolve page transition.
 *
 * Ported from CodeGrid's image-reveal demo and adapted to Next.js App Router
 * page transitions:
 *   - A grid of ~16px cells is rendered as a fixed overlay.
 *   - On navigation start, a horizontal band sweeps top→bottom across the
 *     viewport. Cells inside the band turn opaque ATMA-violet with a random
 *     glyph; cells outside fade out. This produces a digital "static dissolve"
 *     transition feel.
 *   - When the new route mounts, the band sweeps bottom→top to reveal.
 *
 * Trigger surface: <TransitionLink href="..."> intercepts the click,
 * plays the dissolve-out, then router.push()-es. The new route then runs
 * a dissolve-in on mount (via a path-change effect inside the provider).
 */

const CELL = 18;
const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#@+*<>/?{}[]";
const DISSOLVE_COLOR = "#5b3df0";
const VISIBILITY_THRESHOLD = 0.65;
const SPREAD = 0.28;
const SCATTER = 0.18;
const CORE = 0.04;
const MIN_SCATTER_AT_CENTER = 0.32;

type CellData = { row: number; col: number; ny: number };

type Ctx = {
  /** Imperatively run the dissolve-out → navigate → dissolve-in sequence. */
  navigate: (href: string) => void;
};
const Ctx = createContext<Ctx | null>(null);

export function useDissolveTransition() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useDissolveTransition must be used inside DissolveTransitionProvider");
  return c;
}

function rand(row: number, col: number, seed: number): number {
  const r = Math.sin(row * seed + col * (seed * 2.45)) * 43758.5453;
  return r - Math.floor(r);
}
function pickChar(): string {
  return CHARS[(Math.random() * CHARS.length) | 0];
}

export function DissolveTransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const gridRef = useRef<HTMLDivElement>(null);
  const cellsRef = useRef<HTMLSpanElement[]>([]);
  const cellsData = useRef<CellData[]>([]);
  const visibilityRand = useRef<number[]>([]);
  const scatterOffset = useRef<number[]>([]);
  const rafRef = useRef<number | null>(null);
  const [active, setActive] = useState(false);

  // Build the cell grid once (and rebuild on resize)
  useEffect(() => {
    if (typeof window === "undefined") return;

    let timer: ReturnType<typeof setTimeout> | null = null;

    const build = () => {
      const grid = gridRef.current;
      if (!grid) return;
      grid.innerHTML = "";
      cellsRef.current = [];
      cellsData.current = [];
      visibilityRand.current = [];
      scatterOffset.current = [];

      const cols = Math.ceil(window.innerWidth / CELL);
      const rows = Math.ceil(window.innerHeight / CELL);
      const frag = document.createDocumentFragment();
      const fontSize = Math.round(CELL * 0.7);

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const el = document.createElement("span");
          el.className = "dissolve-cell";
          el.style.cssText = `position:absolute;left:${c * CELL}px;top:${r * CELL}px;width:${CELL}px;height:${CELL}px;font-size:${fontSize}px;display:flex;align-items:center;justify-content:center;color:#0a0a0a;background:${DISSOLVE_COLOR};font-family:ui-monospace,SF Mono,monospace;line-height:1;visibility:hidden;will-change:visibility;`;
          el.textContent = pickChar();
          frag.appendChild(el);
          cellsRef.current.push(el);
          const ny = (r + 0.5) / rows;
          cellsData.current.push({ row: r, col: c, ny });
          visibilityRand.current.push(rand(r, c, 127.1));
          scatterOffset.current.push((rand(r, c, 269.3) - 0.5) * SCATTER);
        }
      }
      grid.appendChild(frag);
    };

    build();
    const onResize = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(build, 180);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      if (timer) clearTimeout(timer);
    };
  }, []);

  /** Sweep a horizontal dissolve band from `from` to `to` (in normalised Y) over `durationMs`. */
  const sweep = useCallback((from: number, to: number, durationMs: number) =>
    new Promise<void>((resolve) => {
      const start = performance.now();
      const ease = (t: number) => 1 - Math.pow(1 - t, 3); // power3.out

      const step = (now: number) => {
        const p = Math.min(1, (now - start) / durationMs);
        const eased = ease(p);
        const bandY = from + (to - from) * eased;

        const cells = cellsData.current;
        const els = cellsRef.current;
        const vrand = visibilityRand.current;
        const off = scatterOffset.current;

        for (let i = 0; i < cells.length; i++) {
          const cell = cells[i];
          const raw = Math.abs(cell.ny - bandY);
          const scatterStrength = Math.max(MIN_SCATTER_AT_CENTER, Math.min(1, raw / CORE));
          const scattered = cell.ny - bandY + off[i] * scatterStrength;
          const norm =
            scattered >= 0 ? scattered / SPREAD : Math.abs(scattered) / SPREAD;

          if (norm >= 1) {
            els[i].style.visibility = "hidden";
          } else {
            const density = (1 - norm) * (1 - norm);
            const visible = density > vrand[i] * VISIBILITY_THRESHOLD;
            els[i].style.visibility = visible ? "visible" : "hidden";
          }
        }

        if (p < 1) {
          rafRef.current = requestAnimationFrame(step);
        } else {
          resolve();
        }
      };
      rafRef.current = requestAnimationFrame(step);
    }), []);

  const hideAll = useCallback(() => {
    const els = cellsRef.current;
    for (let i = 0; i < els.length; i++) els[i].style.visibility = "hidden";
  }, []);

  const navigate = useCallback(
    async (href: string) => {
      // Refresh random glyphs each transition so it doesn't look identical twice
      cellsRef.current.forEach((el) => (el.textContent = pickChar()));

      setActive(true);
      // Dissolve-out — band sweeps top → bottom
      await sweep(-SPREAD, 1 + SPREAD, 480);
      hideAll();
      router.push(href);

      // Wait a tick for the new route to mount, then dissolve-in
      await new Promise<void>((r) => setTimeout(r, 60));
      cellsRef.current.forEach((el) => (el.textContent = pickChar()));
      await sweep(1 + SPREAD, -SPREAD, 480);
      hideAll();
      setActive(false);
    },
    [hideAll, router, sweep],
  );

  // Cancel any pending rAF on unmount
  useEffect(
    () => () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  return (
    <Ctx.Provider value={{ navigate }}>
      {children}
      <div
        ref={gridRef}
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 9999,
          pointerEvents: active ? "auto" : "none",
        }}
      />
    </Ctx.Provider>
  );
}

// ───────────────────────────────────────────────────────────
//  Drop-in replacement for next/link that uses the dissolve.
// ───────────────────────────────────────────────────────────

type TransitionLinkProps = Omit<LinkProps, "href"> & {
  href: string;
  className?: string;
  children: ReactNode;
  /** Skip the transition (external / same-origin anchor / target=_blank). */
  skipTransition?: boolean;
  target?: string;
  rel?: string;
};

export function TransitionLink({
  href,
  className,
  children,
  skipTransition,
  target,
  ...rest
}: TransitionLinkProps) {
  const { navigate } = useDissolveTransition();

  const isExternal =
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("mailto:");
  const isHash = href.startsWith("#");
  const shouldSkip = skipTransition || target === "_blank" || isExternal || isHash;

  function onClick(e: MouseEvent<HTMLAnchorElement>) {
    if (shouldSkip) return;
    // Respect modifier-click + middle click
    if (
      e.defaultPrevented ||
      e.button !== 0 ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey
    ) {
      return;
    }
    e.preventDefault();
    navigate(href);
  }

  return (
    <Link href={href} className={className} onClick={onClick} target={target} {...rest}>
      {children}
    </Link>
  );
}
