import type { Metadata } from "next";
import { readFile } from "fs/promises";
import { join } from "path";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { TopBanner } from "@/components/landing/TopBanner";
import { AgentProfile } from "@/components/agents/AgentProfile";
import { AGENT_BY_SLUG, AGENT_IDENTITIES } from "@/lib/agents/identity";
import { pageMetadata } from "@/lib/seo/pageMetadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const identity = AGENT_BY_SLUG[slug];
  if (!identity) return { title: "Agent not found" };
  return pageMetadata({
    title: `${identity.name} — Agent #${identity.displayNumber}`,
    description: `${identity.name} on ATMA. ${identity.capabilities[0]} Reads ${identity.skillFile} at runtime.`,
    path: `/agents/${slug}`,
  });
}

export function generateStaticParams() {
  // Cross-product across locales — built at request time anyway since the
  // run store is read live, but next-intl wants the params declared.
  const slugs = AGENT_IDENTITIES.map((a) => a.slug);
  return ["en", "id"].flatMap((locale) =>
    slugs.map((slug) => ({ locale, slug })),
  );
}

async function loadSkill(filename: string): Promise<string> {
  try {
    return await readFile(join(process.cwd(), "skills", filename), "utf-8");
  } catch {
    return `# ${filename}\n\n_Not found at runtime._`;
  }
}

export default async function AgentProfilePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const identity = AGENT_BY_SLUG[slug];
  if (!identity) notFound();

  const skillContent = await loadSkill(identity.skillFile);

  return (
    <>
      <TopBanner />
      <Navbar />
      <main className="container-atma py-20 md:py-28">
        <div className="max-w-[1100px] mx-auto">
          <AgentProfile identity={identity} skillContent={skillContent} />
        </div>
      </main>
      <Footer />
    </>
  );
}
