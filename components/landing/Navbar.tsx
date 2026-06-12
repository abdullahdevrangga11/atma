"use client";

import Link from "next/link";
import { TransitionLink } from "@/components/transitions/DissolveTransition";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";

type DropdownItem = {
  name: string;
  desc: string;
  href: string;
  Icon: () => React.ReactElement;
};

type NavItem = {
  label: string;
  items: DropdownItem[];
};

// Compact inline icons with hover animation classes.
// All icons inherit color from their container via `currentColor` so the
// dropdown can tone them with one className change.
function IconVault() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="2" y="3" width="14" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.4" className="origin-center transition-transform duration-500 group-hover/item:rotate-[180deg]" />
      <circle cx="9" cy="9" r="0.8" fill="currentColor" />
    </svg>
  );
}
function IconReport() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M3 15V3M15 15H3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <rect x="5" y="9" width="2" height="4" fill="currentColor" className="origin-bottom transition-transform duration-500 group-hover/item:scale-y-150" />
      <rect x="8" y="6" width="2" height="7" fill="currentColor" className="origin-bottom transition-transform duration-500 delay-75 group-hover/item:scale-y-125" />
      <rect x="11" y="4" width="2" height="9" fill="currentColor" className="origin-bottom transition-transform duration-500 delay-150 group-hover/item:scale-y-110" />
    </svg>
  );
}
function IconSkills() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M4 2h7l3 3v11H4V2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M11 2v3h3" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <line x1="6" y1="9" x2="12" y2="9" stroke="currentColor" strokeWidth="1.2" className="origin-left transition-transform duration-500 group-hover/item:scale-x-110" />
      <line x1="6" y1="11.5" x2="11" y2="11.5" stroke="currentColor" strokeWidth="1.2" className="origin-left transition-transform duration-500 delay-75 group-hover/item:scale-x-110" />
      <line x1="6" y1="14" x2="9" y2="14" stroke="currentColor" strokeWidth="1.2" className="origin-left transition-transform duration-500 delay-150 group-hover/item:scale-x-110" />
    </svg>
  );
}
function IconGitHub() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" className="transition-transform duration-500 group-hover/item:rotate-[12deg]">
      <path d="M9 0a9 9 0 0 0-2.85 17.54c.45.08.62-.2.62-.43v-1.5c-2.5.55-3.03-1.21-3.03-1.21-.41-1.04-1-1.32-1-1.32-.82-.56.06-.55.06-.55.9.06 1.38.93 1.38.93.8 1.38 2.1.98 2.62.75.08-.58.31-.98.57-1.21-2-.23-4.1-1-4.1-4.46 0-.98.35-1.79.92-2.42-.09-.23-.4-1.15.09-2.4 0 0 .75-.24 2.46.92.71-.2 1.48-.3 2.24-.3.76 0 1.53.1 2.24.3 1.71-1.16 2.46-.92 2.46-.92.49 1.25.18 2.17.09 2.4.57.63.92 1.44.92 2.42 0 3.47-2.11 4.23-4.12 4.45.32.28.61.83.61 1.68v2.5c0 .24.17.52.63.43A9 9 0 0 0 9 0z" />
    </svg>
  );
}
function IconBook() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M2 3.5C2 2.67 2.67 2 3.5 2H9v13H3.5C2.67 15 2 14.33 2 13.5v-10z" stroke="currentColor" strokeWidth="1.4" />
      <path d="M16 3.5c0-.83-.67-1.5-1.5-1.5H9v13h5.5c.83 0 1.5-.67 1.5-1.5v-10z" stroke="currentColor" strokeWidth="1.4" />
      <path d="M9 5h4M9 8h3" stroke="currentColor" strokeWidth="1.2" className="transition-opacity duration-500 group-hover/item:opacity-50" />
    </svg>
  );
}
function IconShield() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M9 1l7 3v5c0 4-3 7-7 8-4-1-7-4-7-8V4l7-3z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M6 9l2 2 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="origin-left transition-transform duration-500 group-hover/item:scale-110" />
    </svg>
  );
}
function IconBlock() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="2" y="2" width="6" height="6" stroke="currentColor" strokeWidth="1.4" className="origin-center transition-transform duration-500 group-hover/item:rotate-45" />
      <rect x="10" y="2" width="6" height="6" stroke="currentColor" strokeWidth="1.4" />
      <rect x="2" y="10" width="6" height="6" stroke="currentColor" strokeWidth="1.4" />
      <rect x="10" y="10" width="6" height="6" stroke="currentColor" strokeWidth="1.4" fill="currentColor" />
    </svg>
  );
}
function IconAgent() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="6.5" r="3.2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3 17c0-3.31 2.69-6 6-6s6 2.69 6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" className="origin-bottom transition-transform duration-500 group-hover/item:scale-x-110" />
      <circle cx="13.5" cy="3.5" r="1.2" fill="currentColor" className="transition-transform duration-500 group-hover/item:scale-150" />
    </svg>
  );
}
function IconBalance() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M9 2v14M3 6h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M3 10l3-4 3 4M9 10l3-4 3 4" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" className="transition-transform duration-500 group-hover/item:translate-y-[-1px]" />
    </svg>
  );
}
function IconBeaker() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M7 2v5l-4 7a2 2 0 0 0 1.74 3h8.52A2 2 0 0 0 15 14L11 7V2" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M6 2h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="7" cy="13" r="0.8" fill="currentColor" className="transition-transform duration-500 group-hover/item:translate-y-[-2px]" />
      <circle cx="10" cy="11" r="0.8" fill="currentColor" className="transition-transform duration-500 delay-75 group-hover/item:translate-y-[-2px]" />
      <circle cx="11.5" cy="14" r="0.8" fill="currentColor" className="transition-transform duration-500 delay-150 group-hover/item:translate-y-[-2px]" />
    </svg>
  );
}
function IconNetwork() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="3.5" cy="4.5" r="1.4" fill="currentColor" className="transition-transform duration-500 group-hover/item:scale-125" />
      <circle cx="14.5" cy="4.5" r="1.4" fill="currentColor" className="transition-transform duration-500 delay-75 group-hover/item:scale-125" />
      <circle cx="9" cy="15.5" r="1.4" fill="currentColor" className="transition-transform duration-500 delay-150 group-hover/item:scale-125" />
      <path d="M3.5 4.5L9 15.5L14.5 4.5Z" stroke="currentColor" strokeWidth="1" strokeOpacity="0.4" />
    </svg>
  );
}
function IconChartUp() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M2 15h14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M2 13l4-5 3 3 5-7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-500 group-hover/item:translate-y-[-1px]" />
      <path d="M11 4h3v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconCoin() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.4" />
      <path d="M9 5v8M6 7l3-2 3 2M6 11l3 2 3-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-500 group-hover/item:translate-y-[-1px]" />
    </svg>
  );
}
function IconBank() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M9 1l8 4v2H1V5l8-4z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M3 9v5M7 9v5M11 9v5M15 9v5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" className="transition-transform duration-500 group-hover/item:translate-y-[1px]" />
      <path d="M1 16h16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
function IconChart() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M2 14l4-5 3 3 5-7 2 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-500 group-hover/item:[stroke-dasharray:30] group-hover/item:[stroke-dashoffset:60]" />
    </svg>
  );
}
function IconTrophy() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M5 2h8v5a4 4 0 0 1-8 0V2z" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5 4H3a2 2 0 0 0 2 4M13 4h2a2 2 0 0 1-2 4" stroke="currentColor" strokeWidth="1.4" />
      <path d="M6 14h6M9 11v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="9" cy="6" r="1.2" fill="currentColor" className="transition-transform duration-500 group-hover/item:scale-150" />
    </svg>
  );
}
function IconBrand() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="3" y="3" width="12" height="12" stroke="currentColor" strokeWidth="1.4" className="origin-center transition-transform duration-500 group-hover/item:rotate-90" />
      <rect x="6" y="6" width="6" height="6" fill="currentColor" />
    </svg>
  );
}

const NAV: NavItem[] = [
  {
    label: "Product",
    items: [
      { name: "Vault", desc: "Live multi-agent orchestration", href: "/vault", Icon: IconVault },
      { name: "Backtest", desc: "Replay N weeks vs 3 baselines", href: "/backtest", Icon: IconChartUp },
      { name: "Backtest A/B", desc: "Two skills, same weeks, one chart", href: "/backtest/ab", Icon: IconChartUp },
      { name: "Compare", desc: "3 policies, parallel reasoning", href: "/compare", Icon: IconBalance },
      { name: "Anomaly", desc: "Stress-test the RiskAgent", href: "/anomaly", Icon: IconShield },
    ],
  },
  {
    label: "Agents",
    items: [
      { name: "AllocatorAgent", desc: "Treasury allocation under policy", href: "/agents/allocator", Icon: IconAgent },
      { name: "RiskAgent", desc: "Veto authority + defensive exit", href: "/agents/risk", Icon: IconShield },
      { name: "ReporterAgent", desc: "P&L attestation, 3 baselines", href: "/agents/reporter", Icon: IconReport },
      { name: "Reports", desc: "Real attestation history", href: "/reports", Icon: IconReport },
    ],
  },
  {
    label: "Policy",
    items: [
      { name: "Skills", desc: "Edit markdown, see diff", href: "/skills", Icon: IconSkills },
      { name: "Marketplace", desc: "Fork community-published skills", href: "/marketplace", Icon: IconBlock },
      { name: "A/B test", desc: "Prove a policy change pays off", href: "/ab-test", Icon: IconBeaker },
      { name: "Network", desc: "Cumulative network stats", href: "/network", Icon: IconNetwork },
    ],
  },
  {
    label: "Developers",
    items: [
      { name: "GitHub", desc: "Open-source MIT", href: "https://github.com/abdullahdevrangga11/amana", Icon: IconGitHub },
      { name: "Architecture", desc: "Vault state machine", href: "https://github.com/abdullahdevrangga11/amana#architecture", Icon: IconBook },
      { name: "Risk Model", desc: "Defensive exit thresholds", href: "https://github.com/abdullahdevrangga11/amana/blob/main/RISK_MODEL.md", Icon: IconShield },
      { name: "Block Explorer", desc: "Mantle Sepolia", href: "https://sepolia.mantlescan.xyz", Icon: IconBlock },
    ],
  },
  {
    label: "Ecosystem",
    items: [
      { name: "Mantle", desc: "Host network · ERC-8004", href: "https://www.mantle.xyz", Icon: IconBlock },
      { name: "Ondo USDY", desc: "Tokenized US treasuries", href: "https://ondo.finance", Icon: IconCoin },
      { name: "Aave V3", desc: "Boosted Mantle supply", href: "https://aave.com", Icon: IconBank },
      { name: "MI4 Index", desc: "BTC · ETH · SOL · stables", href: "https://app.rwa.xyz/assets/MI4", Icon: IconChart },
    ],
  },
  {
    label: "Resources",
    items: [
      { name: "Hackathon", desc: "Mantle Turing Test 2026", href: "https://dorahacks.io/hackathon/mantleturingtesthackathon2026", Icon: IconTrophy },
      { name: "Build Log", desc: "Daily progress notes", href: "https://github.com/abdullahdevrangga11/amana/blob/main/progress.md", Icon: IconBook },
      { name: "Brand", desc: "Logos and colors", href: "/about", Icon: IconBrand },
    ],
  },
];

export function Navbar() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const railRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [highlight, setHighlight] = useState<{ left: number; width: number; opacity: number }>({
    left: 0,
    width: 0,
    opacity: 0,
  });

  const moveHighlight = useCallback((idx: number | null) => {
    if (idx === null) {
      setHighlight((h) => ({ ...h, opacity: 0 }));
      return;
    }
    const rail = railRef.current;
    const target = itemRefs.current[idx];
    if (!rail || !target) return;
    const r = rail.getBoundingClientRect();
    const t = target.getBoundingClientRect();
    setHighlight({ left: t.left - r.left, width: t.width, opacity: 1 });
  }, []);

  useEffect(() => {
    moveHighlight(openIdx);
  }, [openIdx, moveHighlight]);

  // Recompute pill position when scrolled state flips (sizes change → bounding rects change)
  useEffect(() => {
    moveHighlight(openIdx);
  }, [scrolled, openIdx, moveHighlight]);

  // Scroll listener — shrink past 60px
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        setScrolled(window.scrollY > 60);
        raf = 0;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
        scrolled
          ? "bg-white/85 backdrop-blur-xl backdrop-saturate-150 border-b border-[var(--color-border)] shadow-[0_4px_24px_-12px_rgba(0,0,0,0.08)]"
          : "bg-white/70 backdrop-blur-xl backdrop-saturate-150 border-b border-[var(--color-border)]/60",
      )}
    >
      <div
        className={cn(
          "container-amana flex items-center justify-between transition-[height] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          scrolled ? "h-12" : "h-16",
        )}
      >
        <Link href="/" className="flex items-center gap-2 shrink-0 group">
          <svg
            viewBox="0 0 648 972"
            fill="currentColor"
            preserveAspectRatio="xMidYMid meet"
            aria-hidden
            className={cn(
              "shrink-0 text-[var(--color-primary)] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
              scrolled ? "h-5 w-[13px]" : "h-6 w-4",
            )}
          >
            <path fillRule="evenodd" clipRule="evenodd" d="M298 243V0H162C72.5312 0 0 72.5312 0 162V674L298 972V567C287.566 496.742 232.258 441.434 162 431V379C232.258 368.566 287.566 313.258 298 243Z" />
            <path fillRule="evenodd" clipRule="evenodd" d="M350 810V567C360.434 496.742 415.742 441.434 486 431V379C415.742 368.566 360.434 313.258 350 243V0L648 298V648C648 737.469 575.469 810 486 810H350Z" />
          </svg>
          <span
            className={cn(
              "font-semibold tracking-tight text-[color:var(--color-foreground)] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hidden sm:inline",
              scrolled ? "text-[13px]" : "text-[15px]",
            )}
          >
            AMANA
          </span>
          <span className="sr-only">AMANA</span>
        </Link>

        <div
          ref={railRef}
          className="nav-rail hidden md:flex items-center relative"
          onMouseLeave={() => setOpenIdx(null)}
        >
          <div
            className="nav-highlight"
            style={{
              left: highlight.left,
              width: highlight.width,
              opacity: highlight.opacity,
            }}
          />
          {NAV.map((item, i) => (
            <div
              key={item.label}
              className="relative"
              onMouseEnter={() => setOpenIdx(i)}
            >
              <button
                ref={(el) => { itemRefs.current[i] = el; }}
                type="button"
                className={cn(
                  "relative px-5 py-2 text-[14px] font-medium transition-colors duration-200 flex items-center gap-1.5",
                  openIdx === i
                    ? "text-[var(--color-primary)]"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]",
                )}
              >
                {item.label}
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className={cn("transition-transform duration-300", openIdx === i && "rotate-180")}>
                  <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {openIdx === i && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 z-50 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="w-[360px] bg-white border border-[var(--color-border)] rounded-2xl shadow-[0_18px_56px_rgba(97, 59, 249,0.10),0_4px_16px_rgba(0,0,0,0.04)] p-1.5">
                    {item.items.map((sub) => (
                      <TransitionLink
                        key={sub.name}
                        href={sub.href}
                        target={sub.href.startsWith("http") ? "_blank" : undefined}
                        rel={sub.href.startsWith("http") ? "noreferrer" : undefined}
                        className="group/item flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-[var(--color-primary-tint)] transition-colors duration-200"
                      >
                        <span
                          className={cn(
                            "block w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                            // Default: neutral gray container, ink icon.
                            "bg-[var(--color-bg-soft)] text-[var(--color-text)]",
                            // Hover: white card with violet icon + soft violet shadow.
                            "group-hover/item:bg-white group-hover/item:text-[var(--color-primary)] group-hover/item:shadow-[0_2px_8px_rgba(97, 59, 249,0.12)]",
                            "transition-all duration-300",
                          )}
                        >
                          <sub.Icon />
                        </span>
                        <span className="flex-1 min-w-0">
                          <p className="text-[14px] font-medium leading-tight text-[var(--color-text)] group-hover/item:text-[var(--color-primary)] transition-colors duration-200">
                            {sub.name}
                          </p>
                          <p className="text-[12px] text-[var(--color-text-muted)] mt-1 leading-snug group-hover/item:text-[var(--color-text-secondary)] transition-colors duration-200">
                            {sub.desc}
                          </p>
                        </span>
                      </TransitionLink>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <Link
          href="/vault"
          className={cn(
            "btn-primary transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
            scrolled ? "text-[12px] py-2 px-4" : "text-[13px] py-2.5 px-5",
          )}
        >
          Get Started
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M1 5h8M5 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>
    </header>
  );
}
