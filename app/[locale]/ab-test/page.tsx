import { readFile } from "fs/promises";
import { join } from "path";
import { setRequestLocale } from "next-intl/server";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { TopBanner } from "@/components/landing/TopBanner";
import { AbTestRunner } from "@/components/abtest/AbTestRunner";
import { pageMetadata } from "@/lib/seo/pageMetadata";

export const metadata = pageMetadata({
  title: "A/B Test — Prove a policy change pays off",
  description:
    "Run N rounds of Skill A vs Skill B. Same input, different policy. Win rate + average APY decides the merge.",
  path: "/ab-test",
});

async function loadSkill(filename: string): Promise<string> {
  try {
    return await readFile(join(process.cwd(), "skills", filename), "utf-8");
  } catch {
    return `# ${filename}\n\n_not found_`;
  }
}

export default async function AbTestPage({
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
      <main className="container-atma py-20 md:py-28">
        <div className="max-w-[1200px] mx-auto">
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--color-text-muted)] mb-5">
            // a/b test
          </p>
          <h1 className="display-2 max-w-[820px] mb-5">
            Two policies enter, one wins.
          </h1>
          <p className="text-[16px] text-[var(--color-text-secondary)] max-w-[700px] mb-14 leading-relaxed">
            Run AllocatorAgent under two competing skill markdowns. Same inputs, different
            policies, N independent rounds. The agent reasons from scratch each round; the
            scoreboard tracks win rate and average expected APY across the sample. This is
            how you prove a policy change pays off — empirically, before merging it.
          </p>

          <AbTestRunner baselineSkill={baseline} />
        </div>
      </main>
      <Footer />
    </>
  );
}
