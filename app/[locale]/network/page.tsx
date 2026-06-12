import { setRequestLocale } from "next-intl/server";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { TopBanner } from "@/components/landing/TopBanner";
import { NetworkDashboard } from "@/components/network/NetworkDashboard";
import { pageMetadata } from "@/lib/seo/pageMetadata";

export const metadata = pageMetadata({
  title: "Network — Cumulative stats",
  description:
    "Every orchestration this deployment has ever run. Total Claude cost, defensive exit rate, debate retries, agent call distribution.",
  path: "/network",
});

export default async function NetworkPage({
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
      <main className="container-amana py-20 md:py-28">
        <div className="max-w-[1100px] mx-auto">
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--color-text-muted)] mb-5">
            // network
          </p>
          <h1 className="display-2 max-w-[720px] mb-5">
            Everything AMANA has done.
          </h1>
          <p className="text-[16px] text-[var(--color-text-secondary)] max-w-[640px] mb-14 leading-relaxed">
            Cumulative metrics across every orchestration this deployment has run.
            Refreshes every 5 seconds.
          </p>

          <NetworkDashboard />
        </div>
      </main>
      <Footer />
    </>
  );
}
