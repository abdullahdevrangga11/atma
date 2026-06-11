import { setRequestLocale } from "next-intl/server";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { TopBanner } from "@/components/landing/TopBanner";
import { BacktestRunner } from "@/components/backtest/BacktestRunner";

export default async function BacktestPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <TopBanner />
      <Navbar />
      <main className="container-atma py-20 md:py-28">
        <div className="max-w-[1100px] mx-auto">
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--color-text-muted)] mb-5">
            // backtest sandbox
          </p>
          <h1 className="display-2 max-w-[720px] mb-5">
            Would this have actually worked?
          </h1>
          <p className="text-[16px] text-[var(--color-text-secondary)] max-w-[640px] mb-14 leading-relaxed">
            Pick a number of weeks. ATMA replays each one through the full agent chain
            with that week&apos;s market state, then compounds the realised return. Three
            baselines compound alongside. Each row is a real Claude reasoning trace.
          </p>

          <BacktestRunner />
        </div>
      </main>
      <Footer />
    </>
  );
}
