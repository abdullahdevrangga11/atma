"use client";

import { cn } from "@/lib/utils/cn";

type Stick = {
  x: number;     // % from left of container
  y: number;     // % from top
  w: number;     // px width
  h: number;     // px height
  color: string;
  delay?: number;
};

const PRESET_LEFT: Stick[] = [
  { x: 4,  y: 28, w: 10, h: 38, color: "var(--color-decor-yellow)", delay: 0 },
  { x: 8,  y: 36, w: 10, h: 22, color: "var(--color-decor-purple)", delay: 1 },
  { x: 11, y: 50, w: 10, h: 60, color: "var(--color-decor-blue)",   delay: 2 },
  { x: 5,  y: 68, w: 10, h: 30, color: "var(--color-decor-green)",  delay: 3 },
  { x: 15, y: 75, w: 10, h: 18, color: "var(--color-decor-purple)", delay: 0 },
  { x: 18, y: 22, w: 10, h: 14, color: "var(--color-decor-yellow)", delay: 2 },
  { x: 22, y: 60, w: 10, h: 26, color: "var(--color-decor-pink)",   delay: 1 },
];

const PRESET_RIGHT: Stick[] = [
  { x: 75, y: 14, w: 10, h: 60, color: "var(--color-decor-purple)", delay: 2 },
  { x: 80, y: 22, w: 10, h: 34, color: "var(--color-decor-blue)",   delay: 0 },
  { x: 85, y: 36, w: 10, h: 26, color: "var(--color-decor-yellow)", delay: 3 },
  { x: 88, y: 56, w: 10, h: 42, color: "var(--color-decor-green)",  delay: 1 },
  { x: 92, y: 78, w: 10, h: 22, color: "var(--color-decor-pink)",   delay: 0 },
  { x: 78, y: 70, w: 10, h: 14, color: "var(--color-decor-purple)", delay: 2 },
  { x: 96, y: 30, w: 10, h: 50, color: "var(--color-decor-blue)",   delay: 1 },
];

const PRESET_TOP: Stick[] = [
  { x: 35, y: 8,  w: 8, h: 22, color: "var(--color-decor-blue)",   delay: 0 },
  { x: 39, y: 6,  w: 8, h: 16, color: "var(--color-decor-purple)", delay: 1 },
  { x: 43, y: 10, w: 8, h: 38, color: "var(--color-decor-green)",  delay: 2 },
  { x: 47, y: 4,  w: 8, h: 28, color: "var(--color-decor-yellow)", delay: 3 },
  { x: 51, y: 10, w: 8, h: 20, color: "var(--color-decor-pink)",   delay: 0 },
  { x: 55, y: 6,  w: 8, h: 32, color: "var(--color-decor-blue)",   delay: 2 },
  { x: 59, y: 12, w: 8, h: 14, color: "var(--color-decor-purple)", delay: 1 },
];

type Props = {
  preset?: "left" | "right" | "top" | "all";
  className?: string;
};

export function Candlesticks({ preset = "all", className }: Props) {
  let sticks: Stick[] = [];
  if (preset === "left" || preset === "all") sticks = sticks.concat(PRESET_LEFT);
  if (preset === "right" || preset === "all") sticks = sticks.concat(PRESET_RIGHT);
  if (preset === "top" || preset === "all") sticks = sticks.concat(PRESET_TOP);

  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      {sticks.map((s, i) => (
        <span
          key={i}
          className={cn(
            "absolute block rounded-[1px]",
            s.delay === 0 ? "float-stick" :
            s.delay === 1 ? "float-stick-delay-1" :
            s.delay === 2 ? "float-stick-delay-2" :
            "float-stick-delay-3",
          )}
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.w,
            height: s.h,
            background: s.color,
          }}
        />
      ))}
    </div>
  );
}
