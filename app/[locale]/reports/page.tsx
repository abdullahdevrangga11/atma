import { setRequestLocale } from "next-intl/server";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { TopBanner } from "@/components/landing/TopBanner";
import { ReportsDashboard } from "@/components/reports/ReportsDashboard";

export default async function ReportsPage({
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
            // reports
          </p>
          <h1 className="display-2 max-w-[720px] mb-5">
            Outperformance, attested.
          </h1>
          <p className="text-[16px] text-[var(--color-text-secondary)] max-w-[640px] mb-14 leading-relaxed">
            ATMA's actual P&amp;L against three baselines: do-nothing, USDC-Aave only,
            USDY only. Every snapshot signed by ReporterAgent and emitted as an
            ERC-8004 reputation event on Mantle.
          </p>

          <ReportsDashboard />
        </div>
      </main>
      <Footer />
    </>
  );
}
