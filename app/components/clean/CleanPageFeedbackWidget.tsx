"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import ReportProblemDialog from "@/app/components/clean/feedback/ReportProblemDialog";
import { useGuidance } from "@/app/components/clean/guidance/GuidanceProvider";

type FeedbackPage = {
  key: string;
  title: string;
  matches: string[];
};

const PAGE_REPORT_OPTIONS = [
  "Something looks wrong",
  "A button or link is broken",
  "Text is confusing",
  "Page layout problem",
  "Loading problem",
  "Other",
] as const;

const feedbackPages: FeedbackPage[] = [
  { key: "my-day", title: "My Day", matches: ["/my-day", "/clean-my-day"] },
  { key: "my-calendar", title: "My Calendar", matches: ["/my-calendar", "/clean-my-calendar"] },
  { key: "my-pathways", title: "My Pathways", matches: ["/my-pathways", "/clean-my-pathways"] },
  { key: "my-capture", title: "My Capture", matches: ["/my-capture", "/clean-my-capture"] },
  { key: "my-portfolio", title: "My Portfolio", matches: ["/my-portfolio", "/clean-my-portfolio"] },
  { key: "my-curriculum", title: "My Data", matches: ["/my-data", "/my-curriculum", "/clean-my-curriculum"] },
  { key: "my-reports", title: "My Reports", matches: ["/my-reports", "/clean-my-reports"] },
  { key: "my-community", title: "My Community", matches: ["/my-community"] },
  { key: "my-profile", title: "My Profile", matches: ["/my-profile"] },
  { key: "my-settings", title: "My Settings", matches: ["/my-settings"] },
];

function matchesPath(pathname: string, candidate: string) {
  return pathname === candidate || pathname.startsWith(`${candidate}/`);
}

function getFeedbackPage(pathname: string) {
  return (
    feedbackPages.find((page) =>
      page.matches.some((candidate) => matchesPath(pathname, candidate)),
    ) ?? null
  );
}

function getSourceUrl() {
  if (typeof window === "undefined") return "";
  return window.location.href;
}

function getRoute(pathname: string) {
  if (typeof window === "undefined") return pathname;
  return `${window.location.pathname}${window.location.search}`;
}

function getUserAgent() {
  if (typeof navigator === "undefined") return "";
  return navigator.userAgent;
}

export default function CleanPageFeedbackWidget() {
  const pathname = usePathname();
  const { enabled: guidanceEnabled, setupStatus } = useGuidance();
  const page = useMemo(() => getFeedbackPage(pathname), [pathname]);
  const [open, setOpen] = useState(false);
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(max-width: 640px)");
    const sync = () => setIsCompact(mediaQuery.matches);

    sync();
    mediaQuery.addEventListener("change", sync);

    return () => mediaQuery.removeEventListener("change", sync);
  }, []);

  if (!page || (guidanceEnabled && setupStatus === "active")) {
    return null;
  }

  function getReportContext() {
    return {
      Page: page?.title,
      Route: getRoute(pathname),
      URL: getSourceUrl(),
      Timestamp: new Date().toISOString(),
      Browser: getUserAgent(),
    };
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Report a problem with this page"
        style={{
          position: "fixed",
          right: 12,
          bottom: "calc(env(safe-area-inset-bottom, 0px) + 14px)",
          zIndex: 70,
          border: "1px solid #dbeafe",
          background: "#ffffff",
          color: "#0f172a",
          borderRadius: 999,
          padding: isCompact ? "10px 12px" : "10px 14px",
          minHeight: 40,
          maxWidth: "calc(100vw - 24px)",
          boxShadow: "0 10px 22px rgba(15,23,42,0.08)",
          fontSize: 13,
          fontWeight: 700,
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        {isCompact ? "Report issue" : "Report a problem with this page"}
      </button>
      <ReportProblemDialog
        open={open}
        title="Report a problem with this page"
        description={`${page.title}. Please avoid private child details.`}
        type="page"
        categories={PAGE_REPORT_OPTIONS}
        defaultCategory="Something looks wrong"
        context={getReportContext}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
