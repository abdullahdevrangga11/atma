import { setRequestLocale } from "next-intl/server";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { TopBanner } from "@/components/landing/TopBanner";
import { AnomalyPlayground } from "@/components/anomaly/AnomalyPlayground";

export default async function AnomalyPage({
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
            // anomaly playground
          </p>
          <h1 className="display-2 max-w-[760px] mb-5">
            Break the market, watch the agent panic.
          </h1>
          <p className="text-[16px] text-[var(--color-text-secondary)] max-w-[640px] mb-14 leading-relaxed">
            Drag any slider into a red band and the rule-based predictor flips to{" "}
            <span className="font-mono">trigger</span>. Submit to Claude and the actual RiskAgent
            usually reaches the same verdict via plain-English reasoning. When they disagree, that&apos;s
            a signal the skill markdown needs a clarification.
          </p>

          <AnomalyPlayground />
        </div>
      </main>
      <Footer />
    </>
  );
}
