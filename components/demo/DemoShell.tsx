"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useReducer, useState } from "react";
import DemoCalendar from "@/components/demo/DemoCalendar";
import DemoData from "@/components/demo/DemoData";
import DemoNavigation from "@/components/demo/DemoNavigation";
import DemoGuide from "@/components/demo/DemoGuide";
import DemoPathways from "@/components/demo/DemoPathways";
import DemoOutputs from "@/components/demo/DemoOutputs";
import DemoToday from "@/components/demo/DemoToday";
import DemoCaptureFlow from "@/components/demo/DemoCaptureFlow";
import DemoPortfolioFlow from "@/components/demo/DemoPortfolioFlow";
import DemoReport from "@/components/demo/DemoReport";
import { carterFamilyDemo } from "@/lib/demo/carterFamilyDemoData";
import { buildDemoReportViewModel, demoReducer, initialDemoState } from "@/lib/demo/demoState";
import type { DemoViewId } from "@/lib/demo/demoTypes";
import { trackPublicAcquisitionEvent } from "@/app/lib/publicAnalytics";

export type DemoSectionId = DemoViewId;

export const demoColors = {
  navy: "#0f172a",
  blue: "#2563eb",
  green: "#16a34a",
  orange: "#ea580c",
  purple: "#7c3aed",
  slate: "#475569",
  soft: "#f8fafc",
  line: "#e2e8f0",
};

export const demoCard: React.CSSProperties = {
  border: `1px solid ${demoColors.line}`,
  borderRadius: 22,
  background: "#ffffff",
  boxShadow: "0 16px 34px rgba(15,23,42,0.06)",
  padding: "clamp(18px, 4vw, 28px)",
};

export const demoButton: React.CSSProperties = {
  minHeight: 44,
  border: `1px solid ${demoColors.navy}`,
  borderRadius: 999,
  background: demoColors.navy,
  color: "#ffffff",
  padding: "10px 15px",
  fontWeight: 800,
  fontSize: 14,
  cursor: "pointer",
  textDecoration: "none",
  display: "inline-flex",
  justifyContent: "center",
  alignItems: "center",
};

export const demoSecondaryButton: React.CSSProperties = {
  ...demoButton,
  background: "#ffffff",
  color: demoColors.navy,
  border: "1px solid #cbd5e1",
};

export default function DemoShell() {
  const [state, dispatch] = useReducer(demoReducer, initialDemoState);
  const [showEntryChoice, setShowEntryChoice] = useState(true);
  const reportModel = useMemo(() => buildDemoReportViewModel(state), [state]);

  useEffect(() => {
    trackPublicAcquisitionEvent("public_demo_started", "/demo");
  }, []);

  function navigate(view: DemoViewId) {
    setShowEntryChoice(false);
    dispatch({ type: "navigate", view });
  }

  function resetDemo() {
    dispatch({ type: "reset" });
    setShowEntryChoice(true);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #f8fafc 0%, #eef6ff 38%, #f8fafc 100%)",
        color: demoColors.navy,
      }}
    >
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "clamp(14px, 4vw, 30px) clamp(12px, 4vw, 22px) 54px", display: "grid", gap: 16 }}>
        <header style={{ ...demoCard, padding: "14px 16px", display: "grid", gap: 14, position: "sticky", top: 0, zIndex: 10, background: "rgba(255,255,255,0.96)", backdropFilter: "blur(10px)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <Link href="/" style={{ color: demoColors.navy, textDecoration: "none", fontSize: 22, fontWeight: 900 }}>MyLearna</Link>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ borderRadius: 999, padding: "6px 10px", background: "#eff6ff", color: demoColors.blue, fontSize: 12, fontWeight: 900 }}>Fictional Carter Family</span>
              <button type="button" onClick={resetDemo} style={{ ...demoSecondaryButton, minHeight: 40, padding: "8px 12px", fontSize: 13 }}>Reset demo</button>
            </div>
          </div>
          <div role="note" style={{ border: "1px solid #bfdbfe", borderRadius: 12, background: "#f8fbff", padding: "10px 12px", color: "#1e40af", fontSize: 13, lineHeight: 1.45 }}>
            You&apos;re exploring a fictional family. Changes stay in this browser and are not saved.
          </div>
          <DemoNavigation activeView={state.activeView} onNavigate={navigate} />
        </header>

        {showEntryChoice ? (
          <section
            aria-labelledby="demo-entry-choice-title"
            style={{ ...demoCard, display: "grid", gap: 14, borderColor: "#bfdbfe", background: "#f8fbff" }}
          >
            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ color: demoColors.blue, fontWeight: 900, fontSize: 12, letterSpacing: "0.06em" }}>
                SEE HOW MYLEARNA WORKS
              </div>
              <h1 id="demo-entry-choice-title" style={{ margin: 0, fontSize: "clamp(24px, 5vw, 34px)", lineHeight: 1.12 }}>
                One learning moment can become part of a useful learning record.
              </h1>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 10, maxWidth: 620 }}>
              <button type="button" onClick={() => navigate("today")} style={{ ...demoButton, width: "100%" }}>
                Start with today
              </button>
              <button type="button" onClick={() => navigate("report")} style={{ ...demoSecondaryButton, width: "100%" }}>
                Skip to Emma&apos;s report
              </button>
            </div>
          </section>
        ) : null}

        <DemoGuide state={state} onNavigate={navigate} />

        {state.activeView === "today" ? (
          <DemoToday onStartCapture={() => navigate("capture")} />
        ) : null}
        {state.activeView === "capture" ? (
          <DemoCaptureFlow
            state={state}
            onChange={(value) => dispatch({ type: "update-capture-text", value })}
            onAdd={() => dispatch({ type: "add-learning-moment" })}
            onViewPortfolio={() => navigate("portfolio")}
          />
        ) : null}
        {state.activeView === "portfolio" ? (
          <DemoPortfolioFlow
            state={state}
            onAddToPortfolio={() => dispatch({ type: "add-capture-to-portfolio" })}
            onViewReport={() => navigate("report")}
          />
        ) : null}
        {state.activeView === "report" ? (
          <DemoReport model={reportModel} state={state} onKeepExploring={() => navigate("today")} />
        ) : null}

        <details style={{ ...demoCard, padding: "14px 18px" }}>
          <summary style={{ cursor: "pointer", fontWeight: 900 }}>Explore more of the Carter demo</summary>
          <div style={{ display: "grid", gap: 16, marginTop: 16 }}>
            <p style={{ margin: 0, color: demoColors.slate, lineHeight: 1.55 }}>
              Browse the wider fictional Calendar, Pathways, My Data and sample Outputs experience after trying the guided flow.
            </p>
            <DemoCalendar onNext={() => navigate("today")} />
            <DemoPathways onNext={() => navigate("capture")} />
            <DemoData onNext={() => navigate("report")} />
            <DemoOutputs />
          </div>
        </details>

        <footer style={{ color: demoColors.slate, lineHeight: 1.6, fontSize: 13 }}>
          {carterFamilyDemo.family.note} This public sandbox uses fictional data only and is separate from the authenticated MyLearna app.
        </footer>
      </div>
    </main>
  );
}
