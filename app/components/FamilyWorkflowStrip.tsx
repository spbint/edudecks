"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import useIsMobile from "@/app/components/useIsMobile";

type WorkflowStep = {
  href: string;
  label: string;
  matches: string[];
};

function isStepActive(pathname: string, step: WorkflowStep) {
  return step.matches.some((match) => {
    if (match === pathname) return true;
    return pathname.startsWith(`${match}/`);
  });
}

function stepStyle(active: boolean): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 12px",
    borderRadius: 999,
    border: `1px solid ${active ? "#2563eb" : "#dbe3ef"}`,
    background: active ? "#eff6ff" : "#ffffff",
    color: active ? "#1d4ed8" : "#475569",
    textDecoration: "none",
    fontSize: 13,
    fontWeight: active ? 900 : 700,
    whiteSpace: "nowrap",
    boxShadow: active ? "0 8px 20px rgba(37,99,235,0.12)" : "none",
  };
}

const WORKFLOW_STEPS: WorkflowStep[] = [
  { href: "/family", label: "Home", matches: ["/family"] },
  { href: "/planner", label: "Planning", matches: ["/planner", "/goals"] },
  { href: "/calendar", label: "Calendar", matches: ["/calendar"] },
  { href: "/capture", label: "Capture", matches: ["/capture"] },
  { href: "/portfolio", label: "Portfolio", matches: ["/portfolio"] },
  { href: "/reports", label: "Reports", matches: ["/reports", "/reports/library", "/reports/output", "/reports/presets"] },
];

export default function FamilyWorkflowStrip() {
  const pathname = usePathname();
  const isMobile = useIsMobile();

  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
        borderRadius: 18,
        padding: 14,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 900,
          letterSpacing: 1.1,
          textTransform: "uppercase",
          color: "#64748b",
          marginBottom: 10,
        }}
      >
        Family workflow
      </div>

      <div
        style={{
          fontSize: 13,
          color: "#475569",
          lineHeight: 1.55,
          marginBottom: 10,
          fontWeight: 700,
        }}
      >
        {isMobile
          ? "Keep the daily family loop close at hand."
          : "Follow one clear family loop from planning into capture, then into portfolio and reports."}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: isMobile ? "nowrap" : "wrap",
          overflowX: isMobile ? "auto" : "visible",
          paddingBottom: isMobile ? 4 : 0,
        }}
      >
        {WORKFLOW_STEPS.map((step, index) => {
          const active = isStepActive(pathname, step);

          return (
            <React.Fragment key={step.href}>
              <Link href={step.href} style={stepStyle(active)}>
                <span
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 999,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: active ? "#2563eb" : "#f8fafc",
                    color: active ? "#ffffff" : "#64748b",
                    border: `1px solid ${active ? "#2563eb" : "#d1d5db"}`,
                    fontSize: 11,
                    fontWeight: 900,
                    flexShrink: 0,
                  }}
                >
                  {index + 1}
                </span>
                <span>{step.label}</span>
              </Link>

              {index < WORKFLOW_STEPS.length - 1 ? (
                <span
                  aria-hidden="true"
                  style={{
                    color: "#94a3b8",
                    fontSize: 14,
                    fontWeight: 900,
                    flexShrink: 0,
                  }}
                >
                  →
                </span>
              ) : null}
            </React.Fragment>
          );
        })}
      </div>

      {!isMobile ? (
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginTop: 12,
          }}
        >
          <Link href="/reports/library" style={stepStyle(isStepActive(pathname, { href: "/reports/library", label: "Report Library", matches: ["/reports/library"] }))}>
            <span>Report Library</span>
          </Link>
          <Link href="/reports/output" style={stepStyle(isStepActive(pathname, { href: "/reports/output", label: "Output", matches: ["/reports/output"] }))}>
            <span>Output</span>
          </Link>
          <Link
            href="/authority"
            style={stepStyle(
              isStepActive(pathname, {
                href: "/authority",
                label: "Authority",
                matches: ["/authority", "/authority-au", "/authority-uk", "/authority-us"],
              })
            )}
          >
            <span>Authority</span>
          </Link>
        </div>
      ) : null}
    </div>
  );
}
