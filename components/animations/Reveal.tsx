"use client";

import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils/cn";

type RevealProps = {
  children: ReactNode;
  className?: string;
  threshold?: number;
  delay?: number;
  once?: boolean;
};

/**
 * Wrap any subtree. When the element enters viewport (threshold), it adds the
 * `revealed` class on itself. All descendants using `.word-mask > span`,
 * `.clip-reveal`, `.up-reveal`, `.fade-reveal`, `.scale-reveal` will animate.
 *
 * For staggered effects, descendants can set inline transition-delay.
 */
export function Reveal({
  children,
  className,
  threshold = 0.15,
  delay = 0,
  once = true,
}: RevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (delay > 0) {
              window.setTimeout(() => el.classList.add("revealed"), delay);
            } else {
              el.classList.add("revealed");
            }
            if (once) observer.unobserve(el);
          } else if (!once) {
            el.classList.remove("revealed");
          }
        });
      },
      { threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, delay, once]);

  return (
    <div ref={ref} className={cn("reveal-root", className)}>
      {children}
    </div>
  );
}

type WordMaskProps = {
  text: string;
  className?: string;
  staggerMs?: number;
  baseDelayMs?: number;
};

/**
 * Splits a string into word-mask spans. Use inside <Reveal>.
 */
export function WordMask({
  text,
  className,
  staggerMs = 80,
  baseDelayMs = 0,
}: WordMaskProps) {
  const words = text.split(" ");
  return (
    <span className={cn("inline", className)}>
      {words.map((word, i) => (
        <span key={i} className="word-mask">
          <span
            style={{
              transitionDelay: `${baseDelayMs + i * staggerMs}ms`,
            }}
          >
            {word}
          </span>
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </span>
  );
}

/**
 * Wrap a child element to apply a delayed `.up-reveal` etc., respecting parent
 * <Reveal>'s revealed class.
 */
export function Up({
  children,
  delay = 0,
  className,
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "span";
}) {
  const style: CSSProperties = { transitionDelay: `${delay}ms` };
  if (isValidElement(children) && Children.count(children) === 1) {
    type ElementWithStyle = { props: { className?: string; style?: CSSProperties } };
    const el = children as unknown as ElementWithStyle;
    return cloneElement(children as React.ReactElement<{ className?: string; style?: CSSProperties }>, {
      className: cn("up-reveal", el.props.className, className),
      style: { ...el.props.style, ...style },
    });
  }
  if (as === "span") {
    return (
      <span className={cn("up-reveal inline-block", className)} style={style}>
        {children}
      </span>
    );
  }
  return (
    <div className={cn("up-reveal", className)} style={style}>
      {children}
    </div>
  );
}

export function Fade({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const style: CSSProperties = { transitionDelay: `${delay}ms` };
  return (
    <div className={cn("fade-reveal", className)} style={style}>
      {children}
    </div>
  );
}

export function ScaleIn({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const style: CSSProperties = { transitionDelay: `${delay}ms` };
  return (
    <div className={cn("scale-reveal", className)} style={style}>
      {children}
    </div>
  );
}

export function Clip({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const style: CSSProperties = { transitionDelay: `${delay}ms` };
  return (
    <div className={cn("clip-reveal", className)} style={style}>
      {children}
    </div>
  );
}
