"use client";

import { useState } from "react";
import type React from "react";
import { usePathname } from "next/navigation";
import ReportProblemDialog from "@/app/components/clean/feedback/ReportProblemDialog";

type ReportProblemButtonProps = {
  pageTitle?: string;
};

const PAGE_REPORT_OPTIONS = [
  "Something looks wrong",
  "A button or link is broken",
  "Text is confusing",
  "Page layout problem",
  "Loading problem",
  "Other",
] as const;

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

const triggerStyle: React.CSSProperties = {
  border: "1px solid #E7EAF2",
  background: "#FFFFFF",
  color: "#5B6478",
  borderRadius: 999,
  padding: "8px 11px",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
};

export default function ReportProblemButton({ pageTitle }: ReportProblemButtonProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function getReportContext() {
    return {
      Page: pageTitle,
      Route: getRoute(pathname),
      URL: getSourceUrl(),
      Timestamp: new Date().toISOString(),
      Browser: getUserAgent(),
    };
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} style={triggerStyle}>
        <span aria-hidden="true" style={{ color: "#6C4DF6", fontSize: 13 }}>
          !
        </span>
        Report a problem with this page
      </button>
      <ReportProblemDialog
        open={open}
        title="Report a problem with this page"
        description={`${pageTitle ? `${pageTitle}. ` : ""}Please avoid private child details.`}
        type="page"
        categories={PAGE_REPORT_OPTIONS}
        defaultCategory="Something looks wrong"
        context={getReportContext}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
