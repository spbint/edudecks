"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { type WorkflowGuideStep } from "@/lib/familyWorkflow";

type WorkflowGuideRailProps = {
  steps: WorkflowGuideStep[];
  activeStepId?: string;
  title?: string;
  helperText?: string;
};

export default function WorkflowGuideRail({
  steps,
  activeStepId,
  title = "On this page",
  helperText = "Move down the page in order and use each section to support the next stage.",
}: WorkflowGuideRailProps) {
  const [hashStepId, setHashStepId] = useState("");

  useEffect(() => {
    function syncHash() {
      setHashStepId(window.location.hash.replace(/^#/, ""));
    }

    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  const resolvedActiveStepId = hashStepId || activeStepId || steps[0]?.id || "";
  const currentIndex = useMemo(
    () => steps.findIndex((step) => step.id === resolvedActiveStepId),
    [resolvedActiveStepId, steps],
  );

  return (
    <>
      <section className="xl:hidden" style={{ marginBottom: 16 }}>
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 20,
            background: "#ffffff",
            padding: 16,
            boxShadow: "0 10px 28px rgba(15,23,42,0.04)",
            display: "grid",
            gap: 10,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: 1,
              textTransform: "uppercase",
              color: "#64748b",
            }}
          >
            {title}
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.55, color: "#64748b" }}>
            {helperText}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {steps.map((step, index) => {
              const active = step.id === resolvedActiveStepId;
              return (
                <Link
                  key={step.id}
                  href={`#${step.id}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    borderRadius: 999,
                    border: active ? "1px solid #bfdbfe" : "1px solid #e5e7eb",
                    background: active ? "#eff6ff" : "#ffffff",
                    color: active ? "#1d4ed8" : "#475569",
                    textDecoration: "none",
                    padding: "8px 12px",
                    fontSize: 12,
                    fontWeight: 800,
                  }}
                >
                  <span>{index + 1}</span>
                  <span>{step.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <aside className="hidden xl:block xl:w-[220px] xl:flex-shrink-0">
        <div className="sticky top-28">
          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 24,
              background: "#ffffff",
              padding: 18,
              boxShadow: "0 10px 30px rgba(15,23,42,0.04)",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: 1,
                textTransform: "uppercase",
                color: "#64748b",
                marginBottom: 8,
              }}
            >
              {title}
            </div>
            <div
              style={{
                fontSize: 13,
                lineHeight: 1.55,
                color: "#64748b",
                marginBottom: 16,
              }}
            >
              {helperText}
            </div>

            <div style={{ position: "relative", paddingLeft: 6 }}>
              <div
                style={{
                  position: "absolute",
                  left: 18,
                  top: 12,
                  bottom: 12,
                  width: 1,
                  background: "#e2e8f0",
                }}
              />

              <div style={{ display: "grid", gap: 16 }}>
                {steps.map((step, index) => {
                  const active = step.id === resolvedActiveStepId;
                  const complete = currentIndex >= 0 && index < currentIndex;

                  return (
                    <Link
                      key={step.id}
                      href={`#${step.id}`}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "30px minmax(0,1fr)",
                        gap: 12,
                        alignItems: "start",
                        textDecoration: "none",
                      }}
                    >
                      <span
                        style={{
                          position: "relative",
                          zIndex: 1,
                          width: 26,
                          height: 26,
                          borderRadius: 999,
                          border: active
                            ? "1px solid #bfdbfe"
                            : complete
                              ? "1px solid #cbd5e1"
                              : "1px solid #e2e8f0",
                          background: active ? "#eff6ff" : complete ? "#f8fafc" : "#ffffff",
                          color: active ? "#1d4ed8" : complete ? "#334155" : "#64748b",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 11,
                          fontWeight: 900,
                          boxShadow: active
                            ? "0 0 0 4px rgba(59,130,246,0.08)"
                            : "none",
                        }}
                      >
                        {index + 1}
                      </span>

                      <span style={{ display: "grid", gap: 4 }}>
                        <span
                          style={{
                            fontSize: 14,
                            lineHeight: 1.2,
                            fontWeight: 900,
                            color: active ? "#0f172a" : complete ? "#334155" : "#475569",
                          }}
                        >
                          {step.label}
                        </span>
                        <span
                          style={{
                            fontSize: 12,
                            lineHeight: 1.5,
                            color: "#64748b",
                          }}
                        >
                          {step.detail}
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 900,
                            letterSpacing: 0.5,
                            textTransform: "uppercase",
                            color: active
                              ? "#2563eb"
                              : complete
                                ? "#64748b"
                                : "#94a3b8",
                          }}
                        >
                          {active ? "Current step" : complete ? "Complete" : "Coming up"}
                        </span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
