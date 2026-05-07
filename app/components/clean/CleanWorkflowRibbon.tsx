"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

type CleanWorkflowStepKey =
  | "today"
  | "plan"
  | "programs"
  | "capture"
  | "portfolio"
  | "reports";

type CleanWorkflowStep = {
  key: CleanWorkflowStepKey;
  label: string;
  helper: string;
  href: string;
  cleanHref: string;
  matches: string[];
};

const sectionStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 20,
  background: "#ffffff",
  padding: 16,
  boxShadow: "0 10px 24px rgba(15,23,42,0.04)",
};

const steps: CleanWorkflowStep[] = [
  {
    key: "today",
    label: "Today",
    helper: "Run today",
    href: "/my-day",
    cleanHref: "/clean-my-day",
    matches: ["/my-day", "/clean-my-day"],
  },
  {
    key: "plan",
    label: "Plan",
    helper: "Build the week",
    href: "/my-calendar",
    cleanHref: "/clean-my-calendar",
    matches: ["/my-calendar", "/clean-my-calendar"],
  },
  {
    key: "programs",
    label: "Programs",
    helper: "Shape learning",
    href: "/my-programs",
    cleanHref: "/clean-my-programs",
    matches: ["/my-programs", "/clean-my-programs"],
  },
  {
    key: "capture",
    label: "Capture",
    helper: "Record what happened",
    href: "/my-capture",
    cleanHref: "/clean-my-capture",
    matches: ["/my-capture", "/clean-my-capture"],
  },
  {
    key: "portfolio",
    label: "Portfolio",
    helper: "Choose evidence",
    href: "/my-portfolio",
    cleanHref: "/clean-my-portfolio",
    matches: ["/my-portfolio", "/clean-my-portfolio"],
  },
  {
    key: "reports",
    label: "Reports",
    helper: "Prepare outputs",
    href: "/my-reports",
    cleanHref: "/clean-my-reports",
    matches: ["/my-reports", "/my-outputs", "/clean-my-reports", "/clean-my-outputs"],
  },
];

function matchesPath(pathname: string, candidate: string) {
  return pathname === candidate || pathname.startsWith(`${candidate}/`);
}

function getCurrentStep(pathname: string): CleanWorkflowStepKey | null {
  const current = steps.find((step) =>
    step.matches.some((candidate) => matchesPath(pathname, candidate)),
  );

  return current?.key ?? null;
}

export default function CleanWorkflowRibbon({
  guidanceSlot,
}: {
  guidanceSlot?: React.ReactNode;
}) {
  const pathname = usePathname();
  const currentStep = getCurrentStep(pathname);

  if (!currentStep) return null;

  const currentIndex = steps.findIndex((step) => step.key === currentStep);
  const useCleanLinks = pathname.startsWith("/clean-");

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <section style={sectionStyle}>
        <div style={{ display: "grid", gap: 10 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.08em",
              color: "#64748b",
              textTransform: "uppercase",
            }}
          >
            Journey
          </div>
          <nav aria-label="Journey steps" style={{ overflowX: "auto", paddingBottom: 4 }}>
            <div
              style={{
                display: "flex",
                alignItems: "stretch",
                gap: 10,
                minWidth: "max-content",
              }}
            >
              {steps.map((step, index) => {
                const isCurrent = step.key === currentStep;
                const isPast = index < currentIndex;
                const href = useCleanLinks ? step.cleanHref : step.href;

                return (
                  <React.Fragment key={step.key}>
                    <Link
                      href={href}
                      aria-current={isCurrent ? "step" : undefined}
                      title={`${step.label} — ${step.helper}`}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "36px minmax(0, 1fr)",
                        alignItems: "center",
                        gap: 10,
                        minWidth: 168,
                        padding: "10px 12px",
                        borderRadius: 16,
                        border: isCurrent
                          ? "1px solid #1d4ed8"
                          : isPast
                            ? "1px solid #bfdbfe"
                            : "1px solid #e2e8f0",
                        background: isCurrent
                          ? "#eff6ff"
                          : isPast
                            ? "#f8fbff"
                            : "#ffffff",
                        textDecoration: "none",
                      }}
                    >
                      <span
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 999,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 13,
                          fontWeight: 800,
                          color: isCurrent ? "#ffffff" : isPast ? "#1d4ed8" : "#64748b",
                          background: isCurrent ? "#1d4ed8" : isPast ? "#dbeafe" : "#f8fafc",
                          border: isCurrent
                            ? "1px solid #1d4ed8"
                            : isPast
                              ? "1px solid #bfdbfe"
                              : "1px solid #e2e8f0",
                        }}
                      >
                        {index + 1}
                      </span>
                      <span style={{ display: "grid", gap: 2 }}>
                        <span style={{ color: "#0f172a", fontSize: 15, fontWeight: 700 }}>
                          {step.label}
                        </span>
                        <span style={{ color: "#64748b", fontSize: 12, lineHeight: 1.4 }}>
                          {step.helper}
                        </span>
                      </span>
                    </Link>
                    {index < steps.length - 1 ? (
                      <span
                        aria-hidden="true"
                        style={{
                          alignSelf: "center",
                          width: 14,
                          height: 1,
                          background: index < currentIndex ? "#93c5fd" : "#e2e8f0",
                          flexShrink: 0,
                        }}
                      />
                    ) : null}
                  </React.Fragment>
                );
              })}
            </div>
          </nav>
        </div>
      </section>

      {guidanceSlot ? <div>{guidanceSlot}</div> : null}
      {/* TODO: route-specific step guidance can sit under the workflow ribbon when each page is ready. */}
    </div>
  );
}
