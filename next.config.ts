import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/beta",
        destination: "/start-free",
        permanent: true,
      },
      {
        source: "/beta/thanks",
        destination: "/start-free",
        permanent: true,
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: "mylearnacom",
  project: "javascript-nextjs",
  silent: !process.env.CI,
});
