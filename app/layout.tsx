import React, { Suspense } from "react";
import type { Metadata } from "next";
import "./globals.css";

import { AuthUserProvider } from "@/app/components/AuthUserProvider";
import GoogleAnalyticsPageTracker from "@/app/components/GoogleAnalyticsPageTracker";
import { buildPublicMetadata, PUBLIC_SITE_URL } from "@/app/lib/publicMetadata";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "G-4MRBYZENKS";

export const metadata: Metadata = {
  metadataBase: new URL(PUBLIC_SITE_URL),
  applicationName: "MyLearna",
  ...buildPublicMetadata({
    title: "Homeschool Record Keeping and Reporting for Families | MyLearna",
    description:
      "MyLearna helps homeschooling families plan learning, capture evidence, build portfolios, and prepare homeschool reports from connected learning records.",
    path: "/",
  }),
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
        <AuthUserProvider>
          <Suspense fallback={<div />}>{children}</Suspense>
        </AuthUserProvider>
      </body>
    </html>
  );
}
