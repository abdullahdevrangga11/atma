import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { LenisProvider } from "@/components/providers/LenisProvider";
import { DissolveTransitionProvider } from "@/components/transitions/DissolveTransition";
import { CommandPalette } from "@/components/palette/CommandPalette";
import { Toaster } from "sonner";
import "../globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://amana-iota.vercel.app"),
  title: {
    default: "AMANA — Treasury Orchestration for Mantle",
    template: "%s · AMANA",
  },
  description:
    "Three AI agents allocate, monitor, and report a Mantle RWA treasury. Policy as Markdown. Every decision signed on-chain via ERC-8004.",
  applicationName: "AMANA",
  authors: [{ name: "Devrangga Hazza Mahiswara" }],
  keywords: [
    "Mantle",
    "RWA",
    "treasury",
    "AI agents",
    "ERC-8004",
    "USDY",
    "mUSD",
    "Aave",
    "policy as data",
    "Claude",
  ],
  openGraph: {
    type: "website",
    siteName: "AMANA",
    title: "AMANA — Treasury Orchestration for Mantle",
    description:
      "Three AI agents managing your Mantle RWA treasury. Policy as Markdown. Every decision attested.",
    url: "https://amana-iota.vercel.app",
  },
  twitter: {
    card: "summary_large_image",
    title: "AMANA — Treasury Orchestration for Mantle",
    description:
      "Three AI agents. One vault. Policy as data. Every decision attested on ERC-8004.",
    creator: "@abdullahdevrang",
  },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as "en" | "id")) notFound();

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body>
        <NextIntlClientProvider messages={messages}>
          <LenisProvider>
            <DissolveTransitionProvider>
              {/* Skip-to-main link for screen readers + keyboard nav. Hidden
                  off-screen until focused. */}
              <a
                href="#main"
                className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[1100] focus:bg-[var(--color-text)] focus:text-white focus:px-4 focus:py-2 focus:rounded-md focus:text-[13px]"
              >
                Skip to main content
              </a>
              <CommandPalette />
              {children}
              <Toaster
                theme="dark"
                position="bottom-right"
                toastOptions={{
                  style: {
                    background: "rgba(19, 26, 61, 0.90)",
                    backdropFilter: "blur(20px)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    color: "#ffffff",
                  },
                }}
              />
            </DissolveTransitionProvider>
          </LenisProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
