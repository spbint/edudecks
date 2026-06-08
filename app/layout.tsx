import React, { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import "driver.js/dist/driver.css";
import "./globals.css";

import { AuthUserProvider } from "@/app/components/AuthUserProvider";
import GoogleAnalyticsPageTracker from "@/app/components/GoogleAnalyticsPageTracker";
import GoogleAdsTag from "@/app/components/GoogleAdsTag";
import MetaPixel from "@/app/components/MetaPixel";
import { GuidanceProvider } from "@/app/components/clean/guidance/GuidanceProvider";
import { GuidanceWelcomePrompt } from "@/app/components/clean/guidance/GuidanceToggle";
import { buildPublicMetadata, PUBLIC_SITE_URL } from "@/app/lib/publicMetadata";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "G-4MRBYZENKS";

export const metadata: Metadata = {
  metadataBase: new URL(PUBLIC_SITE_URL),
  applicationName: "MyLearna",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      {
        url: "/branding/mylearna-watermark-150.png",
        sizes: "150x150",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/branding/mylearna-watermark-150.png",
        sizes: "150x150",
        type: "image/png",
      },
    ],
    shortcut: ["/branding/mylearna-watermark-150.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MyLearna",
  },
  formatDetection: {
    telephone: false,
  },
  ...buildPublicMetadata({
    title: "Homeschool Record Keeping and Reporting for Families | MyLearna",
    description:
      "MyLearna helps homeschooling families plan learning, capture evidence, build portfolios, and prepare homeschool reports from connected learning records.",
    path: "/",
  }),
  other: {
    "p:domain_verify": "98533292cbf37d9ea909b51a3bf70309",
    "msvalidate.01": "77EA8DD6A77A843814C049E90FFB3304",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1d4ed8",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
        }}
      >
        <script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('js', new Date());
              gtag('consent', 'default', {
                analytics_storage: 'granted',
                ad_storage: 'denied',
                ad_user_data: 'denied',
                ad_personalization: 'denied'
              });
              gtag('config', '${GA_MEASUREMENT_ID}', {
                anonymize_ip: true,
                allow_google_signals: false,
                allow_ad_personalization_signals: false
              });
            `,
          }}
        />
        <GoogleAnalyticsPageTracker />
        <GoogleAdsTag />
        <Suspense fallback={null}>
          <MetaPixel />
        </Suspense>
        <AuthUserProvider>
          <GuidanceProvider>
            <Suspense fallback={<div />}>{children}</Suspense>
            <GuidanceWelcomePrompt />
          </GuidanceProvider>
        </AuthUserProvider>
      </body>
    </html>
  );
}
