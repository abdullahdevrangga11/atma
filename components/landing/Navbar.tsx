"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";

const NAV_ITEMS = [
  { label: "Product", items: [
    { name: "Vault", desc: "Deposit + view allocation", href: "/vault" },
    { name: "Reports", desc: "P&L + on-chain attestations", href: "/reports" },
    { name: "Skills", desc: "Markdown policy reference", href: "/skills" },
  ]},
  { label: "Developers", items: [
    { name: "GitHub", desc: "Open-source MIT", href: "https://github.com/abdullahdevrangga11/atma" },
    { name: "Architecture", desc: "Vault state machine", href: "https://github.com/abdullahdevrangga11/atma#architecture" },
    { name: "Risk Model", desc: "Defensive exit thresholds", href: "https://github.com/abdullahdevrangga11/atma/blob/main/RISK_MODEL.md" },
  ]},
  { label: "Ecosystem", items: [
    { name: "Mantle", desc: "Host network · ERC-8004", href: "https://www.mantle.xyz" },
    { name: "USDY", desc: "Ondo tokenized treasuries", href: "https://ondo.finance" },
    { name: "Aave V3", desc: "Boosted supply on Mantle", href: "https://app.aave.com" },
  ]},
  { label: "Resources", items: [
    { name: "Hackathon", desc: "Mantle Turing Test 2026", href: "https://dorahacks.io/hackathon/mantleturingtesthackathon2026" },
    { name: "DoraHacks", desc: "Submission profile", href: "https://dorahacks.io" },
    { name: "Brand", desc: "Logos and colors", href: "/about" },
  ]},
];

export function Navbar() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <header className="relative z-40 bg-[var(--color-bg)]">
      <div className="container-atma flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="block w-6 h-6 rounded-[3px] bg-[var(--color-primary)]" aria-hidden />
          <span className="sr-only">ATMA</span>
        </Link>

        <nav
          className="hidden md:flex items-center gap-1"
          onMouseLeave={() => setOpenIdx(null)}
        >
          {NAV_ITEMS.map((item, i) => (
            <div
              key={item.label}
              className="relative"
              onMouseEnter={() => setOpenIdx(i)}
            >
              <button
                type="button"
                className={cn(
                  "px-4 py-2 text-[14px] font-medium transition-colors flex items-center gap-1.5",
                  openIdx === i
                    ? "text-[var(--color-text)]"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
                )}
              >
                {item.label}
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className={cn("transition-transform", openIdx === i && "rotate-180")}>
                  <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {openIdx === i && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 z-50">
                  <div className="w-[320px] bg-white border border-[var(--color-border)] rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.08)] p-2">
                    {item.items.map((sub) => (
                      <a
                        key={sub.name}
                        href={sub.href}
                        className="flex items-start gap-3 p-3 rounded-xl hover:bg-[var(--color-bg-soft)] transition-colors group"
                      >
                        <span className="block w-9 h-9 rounded-lg bg-[var(--color-bg-soft)] group-hover:bg-[var(--color-primary-soft)] flex items-center justify-center shrink-0 transition-colors">
                          <span className="block w-3 h-3 rounded-[2px] bg-[var(--color-primary)]" aria-hidden />
                        </span>
                        <span className="flex-1">
                          <p className="text-[14px] font-medium text-[var(--color-text)] leading-tight">
                            {sub.name}
                          </p>
                          <p className="text-[12px] text-[var(--color-text-muted)] mt-1 leading-snug">
                            {sub.desc}
                          </p>
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </nav>

        <Link href="/vault" className="btn-primary text-[13px] py-2.5">
          Get Started
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M1 5h8M5 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>
    </header>
  );
}
