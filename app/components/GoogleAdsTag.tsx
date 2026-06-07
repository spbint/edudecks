"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

const GOOGLE_ADS_ID =
  process.env.NEXT_PUBLIC_GOOGLE_ADS_ID ?? "AW-18220708361";

const PUBLIC_EXACT_PATHS = new Set([
  "/",
  "/about",
  "/beta",
  "/beta/thanks",
  "/compare",
  "/contact",
  "/demo",
  "/faq",
  "/get-started",
  "/homeschool-learning-evidence",
  "/homeschool-maths-worksheets",
  "/homeschool-planning",
  "/homeschool-portfolio",
  "/homeschool-record-keeping",
  "/homeschool-reporting",
  "/pricing",
  "/privacy",
  "/start-free",
  "/terms",
]);

function isPublicTrackedPath(pathname: string) {
  return PUBLIC_EXACT_PATHS.has(pathname);
}

export default function GoogleAdsTag() {
  const pathname = usePathname();

  if (!isPublicTrackedPath(pathname)) {
    return null;
  }

  return (
    <>
      <Script
        id="google-ads-gtag-src"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`}
      />
      <Script
        id="google-ads-gtag-config"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            window.gtag = window.gtag || function gtag(){window.dataLayer.push(arguments);}
            window.gtag('js', new Date());
            window.gtag('config', '${GOOGLE_ADS_ID}');
          `,
        }}
      />
    </>
  );
}
