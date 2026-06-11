"use client";

import { cn } from "@/lib/utils/cn";

type GradientOrbProps = {
  variant?: "primary" | "accent";
  size?: number;
  className?: string;
  delay?: string;
};

export function GradientOrb({
  variant = "primary",
  size = 600,
  className,
  delay = "0s",
}: GradientOrbProps) {
  const color =
    variant === "primary"
      ? "rgba(0, 82, 255, 0.40)"
      : "rgba(0, 255, 148, 0.25)";

  return (
    <div
      aria-hidden
      className={cn("absolute pointer-events-none float-orb", className)}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        filter: "blur(80px)",
        animationDelay: delay,
        zIndex: 0,
      }}
    />
  );
}
