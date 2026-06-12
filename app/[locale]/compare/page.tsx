import { setRequestLocale } from "next-intl/server";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { TopBanner } from "@/components/landing/TopBanner";
import { PolicyShowdown } from "@/components/compare/PolicyShowdown";
import { pageMetadata } from "@/lib/seo/pageMetadata";

export const metadata = pageMetadata({
  title: "Compare — Three policies, parallel reasoning",
  description:
    "Conservative, balanced, and aggressive run AllocatorAgent against identical feeds. Trophy lands on the policy that won expected APY.",
  path: "/compare",
});

export default async function ComparePage({
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
      <main className="container-atma py-20 md:py-28">
        <div className="max-w-[1100px] mx-auto">
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--color-text-muted)] mb-5">
            // policy showdown
          </p>
          <h1 className="display-2 max-w-[760px] mb-5">
            Pick the policy. Live.
          </h1>
          <p className="text-[16px] text-[var(--color-text-secondary)] max-w-[640px] mb-14 leading-relaxed">
            Three tolerance profiles, identical live feeds. AllocatorAgent reasons from scratch under each policy.
            The trophy lands on whichever one Claude believes yields the highest expected APY for that minute&apos;s market.
          </p>

          <PolicyShowdown />
        </div>
      </main>
      <Footer />
    </>
  );
}
