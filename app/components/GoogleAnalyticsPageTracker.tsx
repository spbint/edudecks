"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackPublicAcquisitionEvent } from "@/app/lib/publicAnalytics";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function trackPageView(pathname: string) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return;
  }

  window.gtag("event", "page_view", {
    page_path: pathname,
    page_location: `${window.location.origin}${pathname}`,
    page_title: document.title,
  });
}

export default function GoogleAnalyticsPageTracker() {
  const pathname = usePathname();
  const hasTrackedInitialView = useRef(false);

  useEffect(() => {
    if (!pathname) {
      return;
    }

    if (!hasTrackedInitialView.current) {
      hasTrackedInitialView.current = true;
      trackPublicAcquisitionEvent("public_session_source", pathname);
      return;
    }

    trackPageView(pathname);
    trackPublicAcquisitionEvent("public_session_source", pathname);
  }, [pathname]);

  return null;
}
