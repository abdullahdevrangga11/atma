import { setRequestLocale } from "next-intl/server";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { ArchitectureSection } from "@/components/landing/ArchitectureSection";
import { SkillsSection } from "@/components/landing/SkillsSection";
import { DecisionTrace } from "@/components/landing/DecisionTrace";
import { OnChainProof } from "@/components/landing/OnChainProof";
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
        <ArchitectureSection />
        <SkillsSection />
        <DecisionTrace />
        <OnChainProof />
        <PartnerMarquee />
      </main>
      <Footer />
    </>
  );
}
