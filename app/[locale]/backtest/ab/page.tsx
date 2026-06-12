import { readFile } from "fs/promises";
import { join } from "path";
import { setRequestLocale } from "next-intl/server";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { TopBanner } from "@/components/landing/TopBanner";
import { BacktestABRunner } from "@/components/backtest/BacktestABRunner";
import { pageMetadata } from "@/lib/seo/pageMetadata";

export const metadata = pageMetadata({
  title: "Backtest A/B — Compare two skills across N weeks",
  description:
    "Run both skills through the same N-week historical replay. Two NAV curves on the same chart. Win the policy argument with real P&L.",
  path: "/backtest/ab",
});

async function loadSkill(filename: string) {
  try {
    return await readFile(join(process.cwd(), "skills", filename), "utf-8");
  } catch {
    return "# Skill not found";
  }
}

export default async function BacktestABPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const baseline = await loadSkill("mantle-rwa-allocation.skill.md");

  return (
    <>
      <TopBanner />
      <Navbar />
      <main id="main" className="container-atma py-20 md:py-28">
        <div className="max-w-[1200px] mx-auto">
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--color-text-muted)] mb-5">
            // backtest a/b
          </p>
          <h1 className="display-2 max-w-[760px] mb-5">
            Two skills, same weeks, one chart.
          </h1>
          <p className="text-[16px] text-[var(--color-text-secondary)] max-w-[640px] mb-14 leading-relaxed">
            Run Skill A and Skill B through the identical N-week historical replay. Two compounding NAV
            curves overlap on the same chart, with the Aave-only baseline dashed underneath. Win the
            "which policy actually performed" argument with real P&amp;L, not expected APY.
          </p>

          <BacktestABRunner baselineSkill={baseline} />
        </div>
      </main>
      <Footer />
    </>
  );
}
