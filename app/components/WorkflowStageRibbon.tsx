"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import {
  FAMILY_WORKFLOW_STAGES,
  resolveFamilyWorkflowStage,
  type FamilyWorkflowStageKey,
} from "@/lib/familyWorkflow";

type WorkflowStageRibbonProps = {
  currentRoute?: string;
  currentStage?: FamilyWorkflowStageKey | null;
  helperText?: string;
  style?: React.CSSProperties;
};

export default function WorkflowStageRibbon({
  currentRoute,
  currentStage,
  helperText = "Follow a clear path from home to planning, capture, curriculum, and reporting.",
  style,
}: WorkflowStageRibbonProps) {
  const pathname = usePathname();
  const resolvedStage =
    currentStage ?? resolveFamilyWorkflowStage(currentRoute || pathname);

  if (!resolvedStage) return null;

  const currentIndex = FAMILY_WORKFLOW_STAGES.findIndex(
    (stage) => stage.key === resolvedStage,
  );

  return (
    <section
      style={{
        borderBottom: "1px solid #e2e8f0",
        background: "rgba(255,255,255,0.94)",
        ...style,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 1440,
          margin: "0 auto",
          padding: "14px 24px 12px",
          display: "grid",
          gap: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          {FAMILY_WORKFLOW_STAGES.map((stage, index) => {
            const active = stage.key === resolvedStage;
            const complete = index < currentIndex;

            return (
              <React.Fragment key={stage.key}>
                <Link
                  href={stage.href}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 10,
                    minHeight: 40,
                    padding: "8px 14px",
                    borderRadius: 999,
                    border: active
                      ? "1px solid #bfdbfe"
                      : complete
                        ? "1px solid #cbd5e1"
                        : "1px solid #e2e8f0",
                    background: active
                      ? "#eff6ff"
                      : complete
                        ? "#f8fafc"
                        : "#ffffff",
                    color: active
                      ? "#1d4ed8"
                      : complete
                        ? "#334155"
                        : "#64748b",
                    textDecoration: "none",
                    fontSize: 13,
                    fontWeight: active ? 900 : 800,
                    boxShadow: active
                      ? "0 0 0 4px rgba(59,130,246,0.08)"
                      : "none",
                  }}
                >
                  <span
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 999,
                      border: active
                        ? "1px solid #bfdbfe"
                        : complete
                          ? "1px solid #cbd5e1"
                          : "1px solid #e2e8f0",
                      background: active ? "#ffffff" : complete ? "#ffffff" : "#f8fafc",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 900,
                      color: active ? "#1d4ed8" : complete ? "#334155" : "#64748b",
                    }}
                  >
                    {index + 1}
                  </span>
                  <span>{stage.label}</span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 900,
                      textTransform: "uppercase",
                      letterSpacing: 0.4,
                      color: active ? "#2563eb" : complete ? "#64748b" : "#94a3b8",
                    }}
                  >
                    {active ? "Now" : complete ? "Done" : "Next"}
                  </span>
                </Link>

                {index < FAMILY_WORKFLOW_STAGES.length - 1 ? (
                  <span style={{ color: "#94a3b8", fontWeight: 900 }}>→</span>
                ) : null}
              </React.Fragment>
            );
          })}
        </div>

        <div
          style={{
            fontSize: 12,
            lineHeight: 1.55,
            color: "#64748b",
          }}
        >
          {helperText}
        </div>
      </div>
    </section>
  );
}
