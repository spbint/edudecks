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

type FamilyWorkflowStripProps = {
  currentHref?: string;
  helperText?: string;
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
    borderRadius: 14,
    border: `1px solid ${active ? "#bfdbfe" : "#e5e7eb"}`,
    background: active ? "#f8fbff" : "#f8fafc",
    color: active ? "#1d4ed8" : "#475569",
    textDecoration: "none",
    fontSize: 13,
    fontWeight: active ? 800 : 700,
    whiteSpace: "nowrap",
    boxShadow: active ? "0 6px 16px rgba(37,99,235,0.08)" : "none",
    opacity: 1,
  };
}

const WORKFLOW_STEPS: WorkflowStep[] = [
  { href: "/family", label: "Home", matches: ["/family"] },
  { href: "/calendar", label: "Calendar", matches: ["/calendar"] },
  { href: "/capture", label: "Capture", matches: ["/capture"] },
  { href: "/portfolio", label: "Portfolio", matches: ["/portfolio"] },
];

export default function FamilyWorkflowStrip({
  currentHref,
  helperText,
}: FamilyWorkflowStripProps) {
  const pathname = usePathname();
  const isMobile = useIsMobile();

  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
        borderRadius: 16,
        padding: isMobile ? 12 : 14,
        boxShadow: "0 10px 30px rgba(15,23,42,0.03)",
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
        How it flows
      </div>

      {helperText ? (
        <div
          style={{
            fontSize: 13,
            lineHeight: 1.6,
            color: "#475569",
            marginBottom: 12,
            maxWidth: 760,
          }}
        >
          {helperText}
        </div>
      ) : null}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: isMobile ? 6 : 8,
          flexWrap: isMobile ? "nowrap" : "wrap",
          overflowX: isMobile ? "auto" : "visible",
          paddingBottom: isMobile ? 4 : 0,
        }}
      >
        {WORKFLOW_STEPS.map((step, index) => {
          const active =
            currentHref === step.href ||
            (!currentHref && isStepActive(pathname, step));

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
                    background: active ? "#2563eb" : "#ffffff",
                    color: active ? "#ffffff" : "#64748b",
                    border: `1px solid ${active ? "#2563eb" : "#dbe3ef"}`,
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
                    fontSize: 13,
                    fontWeight: 800,
                    flexShrink: 0,
                  }}
                >
                  &rarr;
                </span>
              ) : null}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
