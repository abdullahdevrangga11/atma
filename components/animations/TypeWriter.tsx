"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";

type TypeWriterProps = {
  text: string;
  speed?: number;
  startDelay?: number;
  className?: string;
  cursor?: boolean;
};

export function TypeWriter({
  text,
  speed = 35,
  startDelay = 600,
  className,
  cursor = true,
}: TypeWriterProps) {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const start = setTimeout(() => setStarted(true), startDelay);
    return () => clearTimeout(start);
  }, [startDelay]);

  useEffect(() => {
    if (!started) return;
    if (displayed.length >= text.length) return;
    const timeout = setTimeout(() => {
      setDisplayed(text.slice(0, displayed.length + 1));
    }, speed);
    return () => clearTimeout(timeout);
  }, [displayed, text, speed, started]);

  return (
    <span className={cn("inline-block", className)}>
      {displayed}
      {cursor && started && displayed.length < text.length && (
        <span className="inline-block w-[2px] h-[1em] bg-current ml-1 align-middle animate-pulse" />
      )}
    </span>
  );
}
