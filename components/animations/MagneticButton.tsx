"use client";

import { useRef, useEffect, type ReactNode, type MouseEvent } from "react";
import { cn } from "@/lib/utils/cn";

type MagneticButtonProps = {
  children: ReactNode;
  className?: string;
  href?: string;
  onClick?: () => void;
  strength?: number;
  as?: "button" | "a";
  target?: string;
  rel?: string;
};

export function MagneticButton({
  children,
  className,
  href,
  onClick,
  strength = 0.35,
  as = "button",
  target,
  rel,
}: MagneticButtonProps) {
  const ref = useRef<HTMLElement | null>(null);
  const inner = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleMove = (e: MouseEvent | globalThis.MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = (e as MouseEvent).clientX - rect.left - rect.width / 2;
      const y = (e as MouseEvent).clientY - rect.top - rect.height / 2;
      el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
      if (inner.current) {
        inner.current.style.transform = `translate(${x * strength * 0.5}px, ${y * strength * 0.5}px)`;
      }
    };

    const handleLeave = () => {
      el.style.transform = "translate(0, 0)";
      if (inner.current) {
        inner.current.style.transform = "translate(0, 0)";
      }
    };

    el.addEventListener("mousemove", handleMove as unknown as EventListener);
    el.addEventListener("mouseleave", handleLeave);
    return () => {
      el.removeEventListener("mousemove", handleMove as unknown as EventListener);
      el.removeEventListener("mouseleave", handleLeave);
    };
  }, [strength]);

  const sharedClass = cn(
    "inline-block transition-transform duration-300 ease-out will-change-transform",
    className,
  );

  if (as === "a" && href) {
    return (
      <a
        ref={ref as React.RefObject<HTMLAnchorElement>}
        href={href}
        target={target}
        rel={rel}
        className={sharedClass}
        onClick={onClick}
      >
        <span ref={inner} className="inline-block transition-transform duration-300 ease-out will-change-transform">
          {children}
        </span>
      </a>
    );
  }

  return (
    <button
      ref={ref as React.RefObject<HTMLButtonElement>}
      className={sharedClass}
      onClick={onClick}
      type="button"
    >
      <span ref={inner} className="inline-block transition-transform duration-300 ease-out will-change-transform">
        {children}
      </span>
    </button>
  );
}
