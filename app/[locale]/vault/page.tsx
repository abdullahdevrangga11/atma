import { setRequestLocale } from "next-intl/server";
import { Navbar } from "@/components/landing/Navbar";

export default async function VaultPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Navbar />
      <main className="pt-32 pb-24">
        <div className="container-atma">
          <div className="chip mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-warning)] pulse-glow" />
            VAULT · COMING IN AGENT C BUILD
          </div>
          <h1 className="display-1 gradient-text mb-6">Vault dashboard placeholder</h1>
          <p className="text-[17px] text-[var(--color-text-secondary)] max-w-[600px]">
            This page will host deposit/withdraw, allocation visualization,
            and the risk dashboard. Frontend subagent (prompts/agent-c-frontend.md)
            will populate it on Day 2.
          </p>
        </div>
      </main>
    </>
  );
}
