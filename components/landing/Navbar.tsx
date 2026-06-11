"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";

export function Navbar() {
  const t = useTranslations("nav");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-[var(--color-border)] bg-[rgba(11,11,12,0.75)] backdrop-blur-xl"
          : "border-b border-transparent",
      )}
    >
      <div className="container-atma flex items-center justify-between h-14">
        <Link href="/" className="flex items-center gap-3 group">
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-[var(--color-text)]" fill="none">
            <rect x="0.5" y="0.5" width="19" height="19" stroke="currentColor" opacity="0.4" />
            <rect x="4.5" y="4.5" width="11" height="11" stroke="currentColor" />
            <line x1="0" y1="0" x2="20" y2="20" stroke="currentColor" opacity="0.2" />
            <line x1="20" y1="0" x2="0" y2="20" stroke="currentColor" opacity="0.2" />
          </svg>
          <span className="font-mono text-[12px] uppercase tracking-[0.10em]">
            atma<span className="text-[var(--color-text-muted)]">.protocol</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 border border-[var(--color-border)] rounded-full px-2 py-1 bg-[rgba(0,0,0,0.30)] backdrop-blur-md">
          <NavLink href="/vault" label={t("vault")} />
          <NavLink href="/reports" label={t("reports")} />
          <NavLink href="/skills" label={t("skills")} />
          <a
            href="https://github.com/abdullahdevrangga11/atma"
            target="_blank"
            rel="noreferrer"
            className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] px-3 py-1.5 rounded-full transition-colors"
          >
            {t("docs")}
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <span className="hidden md:inline-flex tag tag-accent">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] pulse-soft" />
            mantle sepolia · 5003
          </span>
          <Link href="/vault" className="btn-solid text-[12px] py-2 px-4">
            {t("launchApp")}
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M1 5h8M5 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] px-3 py-1.5 rounded-full transition-colors"
    >
      {label}
    </Link>
  );
}
