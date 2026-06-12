import { setRequestLocale } from "next-intl/server";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { TopBanner } from "@/components/landing/TopBanner";
import { MarketplaceBrowser } from "@/components/marketplace/MarketplaceBrowser";
import { pageMetadata } from "@/lib/seo/pageMetadata";

export const metadata = pageMetadata({
  title: "Skill Marketplace — Fork and ship policy",
  description:
    "Community-published agent skills. Browse Allocator, Risk, and Reporter policies. Fork what works, star what doesn't.",
  path: "/marketplace",
});

export default async function MarketplacePage({
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
            // skill marketplace
          </p>
          <h1 className="display-2 max-w-[760px] mb-5">
            Policy is forkable. Like a repo.
          </h1>
          <p className="text-[16px] text-[var(--color-text-secondary)] max-w-[640px] mb-14 leading-relaxed">
            Skills are Markdown. Markdown is forkable. Publish a skill, others fork it,
            their forks get reused, the stars stack up. The ones that survive get pulled
            into mainline policy by treasurers who trust the community vote.
          </p>

          <MarketplaceBrowser />
        </div>
      </main>
      <Footer />
    </>
  );
}
