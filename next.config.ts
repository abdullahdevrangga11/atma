import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.mantle.xyz" },
      { protocol: "https", hostname: "**.bybit.com" },
    ],
  },
};

export default withNextIntl(nextConfig);
