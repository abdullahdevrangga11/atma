import { setRequestLocale } from "next-intl/server";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { FeatureCards } from "@/components/landing/FeatureCards";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { StatCounters } from "@/components/landing/StatCounters";
import { PartnerMarquee } from "@/components/landing/PartnerMarquee";
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
      <Navbar />
      <main>
        <Hero />
        <FeatureCards />
        <HowItWorks />
        <StatCounters />
        <PartnerMarquee />
      </main>
      <Footer />
    </>
  );
}
