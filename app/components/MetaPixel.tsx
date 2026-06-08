"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

const META_PIXEL_ID = "833692524078029";

const PUBLIC_EXACT_PATHS = new Set([
  "/",
  "/about",
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

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

function isPublicTrackedPath(pathname: string) {
  return PUBLIC_EXACT_PATHS.has(pathname);
}

export default function MetaPixel() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pixelReady, setPixelReady] = useState(false);
  const lastPageViewKey = useRef("");

  const shouldTrack = isPublicTrackedPath(pathname);
  const trackingKey = useMemo(() => {
    const query = searchParams.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!pixelReady || !shouldTrack || typeof window.fbq !== "function") {
      return;
    }

    if (lastPageViewKey.current !== trackingKey) {
      window.fbq("track", "PageView");
      lastPageViewKey.current = trackingKey;
    }

  }, [pathname, pixelReady, shouldTrack, trackingKey]);

  if (!shouldTrack) {
    return null;
  }

  return (
    <>
      <Script
        id="meta-pixel"
        strategy="afterInteractive"
        onReady={() => setPixelReady(true)}
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${META_PIXEL_ID}');
          `,
        }}
      />
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}
