import { setRequestLocale } from "next-intl/server";
import { TopBanner } from "@/components/landing/TopBanner";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { LogoStrip } from "@/components/landing/LogoStrip";
import { FeatureCards } from "@/components/landing/FeatureCards";
import { StatCounters } from "@/components/landing/StatCounters";
import { ProductSection } from "@/components/landing/ProductSection";
import { LatestReleases } from "@/components/landing/LatestReleases";
import { ArchitectureFlow } from "@/components/landing/ArchitectureFlow";
import { BlueCTA } from "@/components/landing/BlueCTA";
import { Footer } from "@/components/landing/Footer";

export default async function LandingPage({
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
      <main>
        <Hero />
        <LogoStrip />
        <FeatureCards />
        <section className="container-atma py-20 md:py-28">
          <div className="max-w-[1100px] mx-auto">
            <ArchitectureFlow />
          </div>
        </section>
        <StatCounters />
        <ProductSection />
        <LatestReleases />
        <BlueCTA />
      </main>
      <Footer />
    </>
  );
}
