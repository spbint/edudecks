"use client";

import Link from "next/link";
import React, { useMemo, useState } from "react";
import DemoCalendar from "@/components/demo/DemoCalendar";
import DemoCapture from "@/components/demo/DemoCapture";
import DemoData from "@/components/demo/DemoData";
import DemoDay from "@/components/demo/DemoDay";
import DemoHero from "@/components/demo/DemoHero";
import DemoOutputs from "@/components/demo/DemoOutputs";
import DemoPathways from "@/components/demo/DemoPathways";
import DemoPortfolio from "@/components/demo/DemoPortfolio";
import DemoReports from "@/components/demo/DemoReports";
import { carterFamilyDemo } from "@/lib/demo/carterFamilyDemoData";

const sections = [
  ["family", "Meet the family"],
  ["calendar", "Calendar"],
  ["today", "Today"],
  ["pathways", "Pathways"],
  ["capture", "Capture"],
  ["portfolio", "Portfolio"],
  ["data", "Data"],
  ["reports", "Reports"],
  ["outputs", "Outputs"],
] as const;

export type DemoSectionId = (typeof sections)[number][0];

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

function scrollToSection(id: DemoSectionId) {
  document.getElementById(`demo-${id}`)?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

export default function DemoShell() {
  const [activeSection, setActiveSection] = useState<DemoSectionId>("family");
  const nextMap = useMemo<Record<DemoSectionId, DemoSectionId | null>>(
    () => ({
      family: "calendar",
      calendar: "today",
      today: "pathways",
      pathways: "capture",
      capture: "portfolio",
      portfolio: "data",
      data: "reports",
      reports: "outputs",
      outputs: null,
    }),
    [],
  );

  function goTo(id: DemoSectionId) {
    setActiveSection(id);
    scrollToSection(id);
  }

  function nextFrom(id: DemoSectionId) {
    const next = nextMap[id];
    if (next) goTo(next);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #f8fafc 0%, #eef6ff 38%, #f8fafc 100%)",
        color: demoColors.navy,
      }}
    >
      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "clamp(16px, 4vw, 34px) clamp(12px, 4vw, 22px) 54px",
          display: "grid",
          gap: 18,
        }}
      >
        <nav
          aria-label="Demo journey"
          style={{
            position: "sticky",
            top: 0,
            zIndex: 10,
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            padding: "10px 0",
            background: "rgba(248,250,252,0.92)",
            backdropFilter: "blur(10px)",
          }}
        >
          {sections.map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => goTo(id)}
              style={{
                border: `1px solid ${activeSection === id ? "#93c5fd" : "#dbeafe"}`,
                borderRadius: 999,
                background: activeSection === id ? "#eff6ff" : "#ffffff",
                color: activeSection === id ? demoColors.blue : demoColors.slate,
                padding: "8px 10px",
                fontSize: 12,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              {label}
            </button>
          ))}
        </nav>

        <DemoHero onStart={() => goTo("calendar")} />
        <DemoCalendar onNext={() => nextFrom("calendar")} />
        <DemoDay onNext={() => nextFrom("today")} />
        <DemoPathways onNext={() => nextFrom("pathways")} />
        <DemoCapture onNext={() => nextFrom("capture")} />
        <DemoPortfolio onNext={() => nextFrom("portfolio")} />
        <DemoData onNext={() => nextFrom("data")} />
        <DemoReports onNext={() => nextFrom("reports")} />
        <DemoOutputs />

        <section
          style={{
            ...demoCard,
            display: "grid",
            gap: 14,
            background:
              "linear-gradient(135deg, rgba(37,99,235,0.08) 0%, rgba(124,58,237,0.08) 100%)",
            border: "1px solid #bfdbfe",
          }}
        >
          <div style={{ color: demoColors.blue, fontWeight: 900, fontSize: 12 }}>
            NEXT STEP
          </div>
          <h2 style={{ margin: 0, fontSize: 30 }}>Want to help shape MyLearna?</h2>
          <p style={{ margin: 0, color: demoColors.slate, lineHeight: 1.7, maxWidth: 820 }}>
            MyLearna is growing through beta. Explore the demo, try the workflow,
            and if it could help your homeschool, join the beta and help shape what
            comes next.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/beta?source=demo" style={demoButton}>
              Join the beta
            </Link>
            <button type="button" onClick={() => goTo("family")} style={demoSecondaryButton}>
              Revisit the demo
            </button>
          </div>
        </section>

        <footer style={{ color: demoColors.slate, lineHeight: 1.6, fontSize: 13 }}>
          {carterFamilyDemo.family.note} This public simulator uses static fictional data
          only and is separate from the authenticated MyLearna app.
        </footer>
      </div>
    </main>
  );
}
