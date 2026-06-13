import { setRequestLocale } from "next-intl/server";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { TopBanner } from "@/components/landing/TopBanner";
import { VaultDemo } from "@/components/vault/VaultDemo";
import { OnChainProof } from "@/components/vault/OnChainProof";
import { pageMetadata } from "@/lib/seo/pageMetadata";

export const metadata = pageMetadata({
  title: "Vault — Live multi-agent orchestration",
  description:
    "Watch AllocatorAgent, RiskAgent, and ReporterAgent reason live. Toggle debate mode to force a Risk veto and watch the orchestrator retry.",
  path: "/vault",
});

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
      <main className="container-amana py-20 md:py-32">
        <div className="max-w-[1100px] mx-auto">
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--color-text-muted)] mb-5">
            // vault dashboard
          </p>
          <h1 className="display-2 max-w-[760px] mb-5">
            Watch the agents reason.
          </h1>
          <p className="text-[16px] text-[var(--color-text-secondary)] max-w-[640px] mb-14 leading-relaxed">
            Type a target deposit + policy. The Allocator agent reads the Skill markdown,
            calls Claude, and proposes weights. Every decision returns a reasoning hash
            ready to attest on-chain.
          </p>

          <div className="mb-10">
            <OnChainProof />
          </div>

          <VaultDemo />
        </div>
      </main>
      <Footer />
    </>
  );
}
