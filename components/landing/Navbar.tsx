"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";

export function Navbar() {
  const t = useTranslations("nav");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-[rgba(10,14,39,0.70)] backdrop-blur-xl border-b border-white/[0.06]"
          : "bg-transparent border-b border-transparent",
      )}
    >
      <div className="container-atma flex items-center justify-between h-16 md:h-20">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative w-7 h-7">
            <div className="absolute inset-0 bg-[var(--color-primary)] rounded-md rotate-45 group-hover:rotate-[55deg] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]" />
            <div className="absolute inset-[5px] bg-[var(--color-bg)] rounded-sm rotate-45" />
          </div>
          <span className="font-display font-semibold text-[17px] tracking-tight">
            ATMA
          </span>
        </Link>

        <nav className="hide-mobile flex items-center gap-7">
          <Link
            href="/vault"
            className="underline-reveal text-sm text-[var(--color-text-secondary)] hover:text-white transition-colors"
          >
            {t("vault")}
          </Link>
          <Link
            href="/reports"
            className="underline-reveal text-sm text-[var(--color-text-secondary)] hover:text-white transition-colors"
          >
            {t("reports")}
          </Link>
          <Link
            href="/skills"
            className="underline-reveal text-sm text-[var(--color-text-secondary)] hover:text-white transition-colors"
          >
            {t("skills")}
          </Link>
          <a
            href="https://github.com/abdullahdevrangga11/atma"
            target="_blank"
            rel="noreferrer"
            className="underline-reveal text-sm text-[var(--color-text-secondary)] hover:text-white transition-colors"
          >
            {t("docs")}
          </a>
        </nav>

        <Link href="/vault" className="btn-primary text-[13px] py-2.5 px-5">
          {t("launchApp")}
        </Link>
      </div>
    </header>
  );
}
