import { readFile } from "fs/promises";
import { join } from "path";
import { setRequestLocale } from "next-intl/server";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { TopBanner } from "@/components/landing/TopBanner";
import { SkillsViewer } from "@/components/skills/SkillsViewer";
import { pageMetadata } from "@/lib/seo/pageMetadata";

export const metadata = pageMetadata({
  title: "Skills — Policy as data",
  description:
    "Edit the agents' Markdown policy live. Diff view, system-prompt inspector, side-by-side run comparison. No redeploy.",
  path: "/skills",
});

async function loadSkill(filename: string): Promise<string> {
  try {
    const path = join(process.cwd(), "skills", filename);
    return await readFile(path, "utf-8");
  } catch {
    return `# ${filename}\n\n_Skill file not found at runtime — placeholder._`;
  }
}

export default async function SkillsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [allocation, risk, reporting] = await Promise.all([
    loadSkill("mantle-rwa-allocation.skill.md"),
    loadSkill("mantle-risk-monitoring.skill.md"),
    loadSkill("treasury-reporting.skill.md"),
  ]);

  return (
    <>
      <TopBanner />
      <Navbar />
      <main className="container-amana py-20 md:py-28">
        <div className="max-w-[1100px] mx-auto">
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--color-text-muted)] mb-5">
            // skills-first architecture
          </p>
          <h1 className="display-2 max-w-[760px] mb-5">
            Policy as data, not code.
          </h1>
          <p className="text-[16px] text-[var(--color-text-secondary)] max-w-[680px] mb-14 leading-relaxed">
            Each AMANA agent reads its Skill markdown at runtime. Policy update = file
            commit. No redeploy. Inspired by CrossBeam — first prize in Anthropic&apos;s
            Built with Opus 4.6 Hackathon.
          </p>

          <SkillsViewer
            skills={[
              { id: "allocator", filename: "mantle-rwa-allocation.skill.md", agent: "AllocatorAgent", content: allocation },
              { id: "risk",      filename: "mantle-risk-monitoring.skill.md", agent: "RiskAgent",      content: risk },
              { id: "reporter",  filename: "treasury-reporting.skill.md",     agent: "ReporterAgent",  content: reporting },
            ]}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
