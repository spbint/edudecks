import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@hyzyla/pdfium", "sharp"],
  outputFileTracingIncludes: {
    "/api/internal/resource-factory/**/*": [
      "./node_modules/@hyzyla/pdfium/dist/**/*",
    ],
  },
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
