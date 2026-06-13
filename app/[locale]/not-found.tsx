import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { TopBanner } from "@/components/landing/TopBanner";

/**
 * Locale-scoped 404. Matches the rest of the page chrome (TopBanner +
 * Navbar + Footer) so the user doesn't feel dropped into a different
 * surface mid-navigation.
 */
export default function NotFound() {
  return (
    <>
      <TopBanner />
      <Navbar />
      <main className="container-amana py-32 md:py-44">
        <div className="max-w-[720px] mx-auto text-center">
          <svg
            viewBox="0 0 648 972"
            fill="currentColor"
            preserveAspectRatio="xMidYMid meet"
            aria-hidden
            className="h-10 w-[27px] mx-auto mb-8 text-[var(--color-primary)]"
          >
            <path fillRule="evenodd" clipRule="evenodd" d="M298 0V243C287.566 313.258 232.258 368.566 162 379V431C232.258 441.434 287.566 496.742 298 567V972H0V162C0 72.5312 72.5312 0 162 0H298Z" />
            <path fillRule="evenodd" clipRule="evenodd" d="M350 567V810H486C575.469 810 648 737.469 648 648V0H350V243C360.434 313.258 415.742 368.566 486 379V431C415.742 441.434 360.434 496.742 350 567Z" />
          </svg>
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--color-text-muted)] mb-5">
            // 404 · route not found
          </p>
          <h1 className="display-2 mb-6 leading-[1.05]">
            This route was never allocated.
          </h1>
          <p className="text-[16px] text-[var(--color-text-secondary)] max-w-[520px] mx-auto mb-12 leading-relaxed">
            The URL is mistyped, or this run permalink is not in the store. No agent
            ever signed it. The vault, agents, and reports below are always live.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mb-16">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 h-11 rounded-full bg-[var(--color-text)] text-white hover:bg-[var(--color-text-secondary)] transition-colors text-[14px] font-medium"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M5 9L2 6m0 0l3-3M2 6h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back to landing
            </Link>
            <Link
              href="/vault"
              className="inline-flex items-center gap-2 px-5 h-11 rounded-full bg-white border border-[var(--color-border-strong)] hover:border-[var(--color-text)] hover:bg-[var(--color-bg-soft)] transition-colors text-[14px] font-medium"
            >
              Run an orchestration
            </Link>
          </div>

          {/* Quick links — saves the user a trip back to nav */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-[680px] mx-auto">
            {[
              { name: "Vault",     href: "/vault",     desc: "Live orchestration" },
              { name: "Backtest",  href: "/backtest",  desc: "Replay N weeks" },
              { name: "Skills",    href: "/skills",    desc: "Policy as data" },
              { name: "Reports",   href: "/reports",   desc: "Attestations" },
            ].map((q) => (
              <Link
                key={q.href}
                href={q.href}
                className="rounded-xl border border-[var(--color-border)] bg-white hover:bg-[var(--color-primary-tint)] hover:border-[var(--color-primary-edge)] transition-colors p-4 text-left group"
              >
                <p className="text-[13px] font-medium text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors mb-1">
                  {q.name}
                </p>
                <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--color-text-muted)]">
                  {q.desc}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
