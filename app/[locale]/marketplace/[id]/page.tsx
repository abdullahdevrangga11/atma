import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { TopBanner } from "@/components/landing/TopBanner";
import { SkillDetail } from "@/components/marketplace/SkillDetail";
import { marketplaceStore } from "@/lib/store/marketplaceStore";
import { pageMetadata } from "@/lib/seo/pageMetadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const entry = marketplaceStore.get(id);
  if (!entry) {
    return pageMetadata({
      title: "Skill not found",
      description: "This marketplace skill could not be located.",
      path: `/marketplace/${id}`,
    });
  }
  return pageMetadata({
    title: `${entry.title} — by @${entry.author}`,
    description: entry.tagline,
    path: `/marketplace/${id}`,
  });
}

export default async function MarketplaceSkillPage({
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
      <main className="container-atma py-20 md:py-28">
        <div className="max-w-[1000px] mx-auto">
          <SkillDetail skillId={id} />
        </div>
      </main>
      <Footer />
    </>
  );
}
