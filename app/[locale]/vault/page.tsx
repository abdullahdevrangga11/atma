import { setRequestLocale } from "next-intl/server";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { TopBanner } from "@/components/landing/TopBanner";

export default async function VaultPage({
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
      <main className="container-atma py-24 md:py-32">
        <p className="text-[12px] font-mono uppercase tracking-[0.08em] text-[var(--color-text-muted)] mb-6">
          // Vault dashboard
        </p>
        <h1 className="display-2 max-w-[640px] mb-6">
          Deposit, watch agents reason, audit every decision.
        </h1>
        <p className="text-[16px] text-[var(--color-text-secondary)] max-w-[560px] mb-10">
          This page will host deposit/withdraw, allocation visualization, and the risk
          dashboard. Frontend subagent (prompts/agent-c-frontend.md) populates it on
          Day 2.
        </p>
        <div className="card-feature inline-block">
          <p className="font-mono text-[12px] text-[var(--color-text-muted)] mb-2">
            // status
          </p>
          <p className="text-[14px] text-[var(--color-text)]">
            <span className="inline-block w-2 h-2 rounded-full bg-[var(--color-warning)] mr-2" />
            Awaiting Day 2 — vault wiring + Privy embedded wallet
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
