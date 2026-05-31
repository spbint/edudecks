"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import CleanAppHeader from "@/app/components/clean/CleanAppHeader";

type CleanWorkflowStepKey =
  | "calendar"
  | "pathways"
  | "capture"
  | "portfolio"
  | "reports"
  | "outputs";

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
  padding: "clamp(12px, 3vw, 16px)",
  boxShadow: "0 10px 24px rgba(15,23,42,0.04)",
};

const helperCardStyle: React.CSSProperties = {
  border: "1px solid #dbeafe",
  borderRadius: 18,
  background: "#f8fbff",
  padding: "clamp(12px, 3vw, 16px)",
  boxShadow: "0 8px 20px rgba(59,130,246,0.06)",
};

const steps: CleanWorkflowStep[] = [
  {
    key: "calendar",
    label: "Calendar",
    helper: "Plan the week",
    href: "/my-calendar",
    cleanHref: "/clean-my-calendar",
    matches: ["/my-calendar", "/clean-my-calendar"],
  },
  {
    key: "pathways",
    label: "Pathways",
    helper: "Follow the next step",
    href: "/my-pathways",
    cleanHref: "/clean-my-pathways",
    matches: ["/my-pathways", "/clean-my-pathways", "/pathways"],
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
    helper: "Build the learning record",
    href: "/my-reports",
    cleanHref: "/clean-my-reports",
    matches: ["/my-reports", "/clean-my-reports"],
  },
  {
    key: "outputs",
    label: "Outputs",
    helper: "Download the record",
    href: "/my-outputs",
    cleanHref: "/clean-my-outputs",
    matches: ["/my-outputs", "/clean-my-outputs"],
  },
];

const workflowGuidance: Record<
  CleanWorkflowStepKey,
  { title: string; copy: string }
> = {
  calendar: {
    title: "New here? Start here",
    copy: "Use your calendar to plan when learning happens. Evidence can later link back to the day or block.",
  },
  pathways: {
    title: "What to do next",
    copy: "Choose a pathway step, practise it, then capture evidence or check understanding.",
  },
  capture: {
    title: "What to do next",
    copy: "Record what happened. Strong notes can later become portfolio evidence and support reports.",
  },
  portfolio: {
    title: "What to do next",
    copy: "Choose the strongest examples from your captured evidence. Not every capture needs to go into a report.",
  },
  reports: {
    title: "What to do next",
    copy: "Reports use your current learning year automatically and bring together selected portfolio evidence with written reflections.",
  },
  outputs: {
    title: "What to do next",
    copy: "Download outputs when the learning record feels clear, evidence-backed, and ready to share.",
  },
};

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
  const currentIndex = steps.findIndex((step) => step.key === currentStep);
  const useCleanLinks = pathname.startsWith("/clean-");
  const defaultGuidance = currentStep ? workflowGuidance[currentStep] : null;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <CleanAppHeader />

      {currentStep ? (
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
              Guided flow
            </div>
            <div style={{ color: "#475569", lineHeight: 1.6 }}>
              Move through the next useful step without losing the broader learning record.
            </div>
            <nav
              aria-label="Guided flow steps"
              style={{
                overflowX: "auto",
                paddingBottom: 4,
                WebkitOverflowScrolling: "touch",
                scrollbarWidth: "thin",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "stretch",
                  gap: 10,
                  minWidth: "max-content",
                  scrollSnapType: "x proximity",
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
                        title={`${step.label} - ${step.helper}`}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "34px minmax(0, 1fr)",
                          alignItems: "center",
                          gap: 10,
                          minWidth: 148,
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
                          scrollSnapAlign: "start",
                        }}
                      >
                        <span
                          style={{
                            width: 34,
                            height: 34,
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
                          <span style={{ color: "#0f172a", fontSize: 14, fontWeight: 700 }}>
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
            <div style={{ color: "#64748b", fontSize: 12, lineHeight: 1.5 }}>
              Swipe across on smaller screens to follow the full flow.
            </div>
          </div>
        </section>
      ) : null}

      {guidanceSlot ? (
        <div>{guidanceSlot}</div>
      ) : defaultGuidance ? (
        <section style={helperCardStyle}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.08em",
              color: "#64748b",
              textTransform: "uppercase",
            }}
          >
            {defaultGuidance.title}
          </div>
          <div style={{ color: "#475569", lineHeight: 1.6 }}>{defaultGuidance.copy}</div>
        </section>
      ) : null}
    </div>
  );
}
