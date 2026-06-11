import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { LenisProvider } from "@/components/providers/LenisProvider";
import { Toaster } from "sonner";
import "../globals.css";

export const metadata: Metadata = {
  title: "ATMA — Treasury Orchestration for Mantle",
  description:
    "3 AI agents under a verifiable on-chain policy allocate idle stablecoins across Mantle's RWA stack.",
  metadataBase: new URL("https://atma.vercel.app"),
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
          </LenisProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
