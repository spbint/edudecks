"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useReportWebVitals } from "next/web-vitals";
import { useAuthUser } from "@/app/components/AuthUserProvider";
import {
  identifyProductUser,
  trackCoreJourneyEvent,
  trackPageView,
  trackProductEvent,
} from "@/lib/clean/analytics/productAnalytics";
import { consumePendingProductEntry } from "@/lib/authAnalytics";

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

function readCaptureSourceSurface(value: string | null) {
  return ["pathways", "my_day", "calendar", "quick_capture", "general", "other_internal"].includes(value ?? "")
    ? value
    : "other_internal";
}

export default function ProductAnalyticsProvider() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuthUser();
  const lastPageViewRef = useRef("");
  const lastCapturePortfolioViewRef = useRef("");
  const signedInTrackedRef = useRef<string | null>(null);

  const area = useMemo(() => getAreaFromRoute(pathname), [pathname]);

  const reportWebVital = useCallback<Parameters<typeof useReportWebVitals>[0]>(
    (metric) => {
      trackCoreJourneyEvent(
        "core_web_vital",
        {
          route: pathname,
          area,
          metric: metric.name,
          metricValue: Number(metric.value.toFixed(4)),
          metricRating: metric.rating,
        },
        user?.id,
      );
    },
    [area, pathname, user?.id],
  );

  useReportWebVitals(reportWebVital);

  useEffect(() => {
    if (!user?.id || signedInTrackedRef.current === user.id) return;

    identifyProductUser(user.id, { source: "authenticated_app" });
    trackProductEvent("product_signed_in", { route: pathname, area }, user.id);
    signedInTrackedRef.current = user.id;
  }, [area, pathname, user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    const pending = consumePendingProductEntry();
    if (!pending) return;
    trackProductEvent("auth_product_entry", { route: pathname, area, challengeType: pending.challengeType, journey: pending.journey, attemptId: pending.attemptId }, user.id);
  }, [area, pathname, user?.id]);

  useEffect(() => {
    if (!user?.id || area !== "my_portfolio") return;
    if (searchParams.get("source") !== "my-capture") return;
    const latestEvidenceId = searchParams.get("latestEvidenceId") ?? "";
    if (!latestEvidenceId) return;

    const viewKey = `${user.id}:${latestEvidenceId}`;
    if (lastCapturePortfolioViewRef.current === viewKey) return;
    trackCoreJourneyEvent(
      "portfolio_viewed_after_capture",
      {
        route: pathname,
        area,
        source: "my_capture",
        sourceSurface: readCaptureSourceSurface(searchParams.get("captureSource")),
      },
      user.id,
    );
    lastCapturePortfolioViewRef.current = viewKey;
  }, [area, pathname, searchParams, user?.id]);

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
      trackProductEvent(
        "report_previewed",
        {
          route: pathname,
          area,
          reportEntrySource: searchParams.get("source") === "portfolio" ? "portfolio" : "other_internal",
        },
        user.id,
      );
    }

    lastPageViewRef.current = pageKey;
  }, [area, pathname, searchParams, user?.id]);

  return null;
}
