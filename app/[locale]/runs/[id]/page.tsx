import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { TopBanner } from "@/components/landing/TopBanner";
import { RunDetail } from "@/components/runs/RunDetail";
import { runStore } from "@/lib/store/runStore";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const run = await runStore.get(id);
  const title = run
    ? `${run.risk.level === "trigger" ? "Defensive exit" : run.debate ? "Survived a veto" : "Clean allocation"} · +${run.report.outperformanceBps.vsDoNothing} bps`
    : "Run · AMANA";
  return {
    title,
    description:
      "AMANA orchestration run — 3 agents, on-chain attested reasoning, real outperformance numbers.",
    openGraph: {
      title,
      description:
        "AMANA orchestration run — 3 agents, on-chain attested reasoning.",
    },
    twitter: {
      card: "summary_large_image",
      title,
    },
  };
}

export default async function RunDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  return (
    <>
      <TopBanner />
      <Navbar />
      <main className="container-amana py-20 md:py-28">
        <div className="max-w-[1100px] mx-auto">
          <RunDetail runId={id} />
        </div>
      </main>
      <Footer />
    </>
  );
}
