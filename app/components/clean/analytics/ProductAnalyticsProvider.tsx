"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import { useAuthUser } from "@/app/components/AuthUserProvider";
import {
  identifyProductUser,
  trackPageView,
  trackProductEvent,
} from "@/lib/clean/analytics/productAnalytics";

function getAreaFromRoute(pathname: string) {
  if (pathname.startsWith("/my-day")) return "my_day";
  if (pathname.startsWith("/my-calendar")) return "my_calendar";
  if (pathname.startsWith("/my-pathways")) return "my_pathways";
  if (pathname.startsWith("/practice/number-targeted")) return "my_pathways";
  if (pathname.startsWith("/assessments/number")) return "my_pathways";
  if (pathname.startsWith("/my-capture")) return "my_capture";
  if (pathname.startsWith("/my-portfolio")) return "my_portfolio";
  if (pathname.startsWith("/my-learna") || pathname.startsWith("/my-data")) return "my_learna";
  if (pathname.startsWith("/my-reports")) return "my_reports";
  if (pathname.startsWith("/my-outputs")) return "my_outputs";
  if (pathname.startsWith("/my-settings")) return "my_settings";
  if (pathname.startsWith("/my-skills")) return "my_skills";
  return "authenticated_app";
}

export default function ProductAnalyticsProvider() {
  const pathname = usePathname();
  const { user } = useAuthUser();
  const lastPageViewRef = useRef("");
  const signedInTrackedRef = useRef<string | null>(null);

  const area = useMemo(() => getAreaFromRoute(pathname), [pathname]);

  useEffect(() => {
    if (!user?.id || signedInTrackedRef.current === user.id) return;

    identifyProductUser(user.id, { source: "authenticated_app" });
    trackProductEvent("product_signed_in", { route: pathname, area }, user.id);
    signedInTrackedRef.current = user.id;
  }, [area, pathname, user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    const pageKey = `${user.id}:${pathname}`;
    if (lastPageViewRef.current === pageKey) return;

    trackPageView(pathname, area, user.id);
    if (area === "my_day") {
      trackProductEvent("daily_plan_viewed", { route: pathname, area }, user.id);
    }
    if (area === "my_pathways") {
      trackProductEvent("pathway_viewed", { route: pathname, area }, user.id);
    }
    if (area === "my_portfolio") {
      trackProductEvent("portfolio_viewed", { route: pathname, area }, user.id);
    }
    if (area === "my_reports") {
      trackProductEvent("report_previewed", { route: pathname, area }, user.id);
    }

    lastPageViewRef.current = pageKey;
  }, [area, pathname, user?.id]);

  return null;
}
