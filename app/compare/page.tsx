"use client";

import React from "react";
import Link from "next/link";
import PublicSiteShell, {
  publicButtonStyle,
  publicCardStyle,
  publicPill,
} from "@/app/components/PublicSiteShell";

type Approach = {
  title: string;
  bestAt: string;
  recordGap: string;
  myLearnaFit: string;
};

type ComparisonRow = {
  capability: string;
  ai: string;
  planner: string;
  manual: string;
  myLearna: string;
};

const APPROACHES: Approach[] = [
  {
    title: "AI planner or lesson generator",
    bestAt:
      "Generating ideas, lesson outlines, activities and schedules quickly.",
    recordGap:
      "What was actually used, what the child did, work samples, observations and the long-term family record still need somewhere to live.",
    myLearnaFit:
      "Keep using the AI tool if it helps. Capture the learning that actually happened in MyLearna.",
  },
  {
    title: "Conventional homeschool planner",
    bestAt:
      "Organising lessons, sequences, dates, routines and completion across the homeschool week.",
    recordGap:
      "A completed lesson does not automatically become evidence, a curated portfolio or a report-ready learning record.",
    myLearnaFit:
      "Use whichever planner suits your family. MyLearna connects the actual learning to evidence, portfolios and reports.",
  },
  {
    title: "Spreadsheet or notes system",
    bestAt:
      "Flexible lists, custom logging and storing information exactly the way you choose.",
    recordGap:
      "The family usually has to create the structure, link the evidence and rebuild the story manually when reporting time arrives.",
    myLearnaFit:
      "MyLearna gives the record a connected structure without taking away the flexibility of the resources you already use.",
  },
  {
    title: "MyLearna",
    bestAt:
      "Connecting planning, real learning evidence, Portfolio, learning understanding and Reports in one private family record.",
    recordGap:
      "It does not need to replace your curriculum, books, co-op, AI planner or other resources.",
    myLearnaFit:
      "Use MyLearna as the family’s system of record for the learning that happens across all of them.",
  },
];

const COMPARISON_ROWS: ComparisonRow[] = [
  {
    capability: "Generate lesson ideas or activities",
    ai: "Core strength",
    planner: "Varies by tool",
    manual: "Manual",
    myLearna: "Not the focus",
  },
  {
    capability: "Organise lessons and schedules",
    ai: "Often",
    planner: "Core strength",
    manual: "Manual",
    myLearna: "Included",
  },
  {
    capability: "Record what actually happened",
    ai: "Varies by tool",
    planner: "Varies by tool",
    manual: "Manual",
    myLearna: "Core workflow",
  },
  {
    capability: "Keep work samples and observations together",
    ai: "Varies by tool",
    planner: "Varies by tool",
    manual: "Manual",
    myLearna: "Core workflow",
  },
  {
    capability: "Build a Portfolio from saved evidence",
    ai: "Varies by tool",
    planner: "Varies by tool",
    manual: "Manual",
    myLearna: "Core workflow",
  },
  {
    capability: "Create reports from the accumulated record",
    ai: "Varies by tool",
    planner: "Varies by tool",
    manual: "Manual",
    myLearna: "Core workflow",
  },
  {
    capability: "Work alongside outside curriculum and resources",
    ai: "Usually",
    planner: "Usually",
    manual: "Yes",
    myLearna: "Yes",
  },
];

function comparisonCellStyle(emphasised = false): React.CSSProperties {
  return {
    padding: "14px 12px",
    borderRight: "1px solid #e5e7eb",
    borderBottom: "1px solid #e5e7eb",
    textAlign: "center",
    fontSize: 13,
    lineHeight: 1.45,
    color: emphasised ? "#166534" : "#475569",
    fontWeight: emphasised ? 800 : 650,
    background: emphasised ? "#f0fdf4" : "#ffffff",
  };
}

export default function ComparePage() {
  return (
    <PublicSiteShell
      title="Compare MyLearna"
      eyebrow="WHAT MYLEARNA IS FOR"
      heroTitle="Use any curriculum or planner. Keep the learning record in MyLearna."
      heroText="AI planners can generate ideas. Homeschool planners can organise schedules. Spreadsheets and notes can store information. MyLearna connects what actually happened to evidence, portfolios and reports."
      heroBadges={[
        "Works with your curriculum",
        "Capture real learning",
        "Portfolio → Reports",
      ]}
      primaryCta={{
        label: "See how learning becomes a report",
        href: "/demo?source=compare-primary-demo",
      }}
      secondaryCta={{
        label: "Create your free family space",
        href: "/start-free?source=compare-secondary-family-space",
      }}
      asideTitle="MyLearna is the record layer"
      asideText="You do not have to move every part of your homeschool into one system. Keep using the tools that help; use MyLearna to keep the learning story together."
    >
      <section style={{ ...publicCardStyle(), marginBottom: 22 }}>
        <div style={{ marginBottom: 16 }}>
          <div style={publicPill("#eff6ff", "#1d4ed8")}>Different tools solve different jobs</div>
          <h2 style={{ margin: "12px 0 8px", fontSize: 26, lineHeight: 1.18, color: "#0f172a" }}>
            You may already have a planner, an AI tool, a spreadsheet — or all three.
          </h2>
          <p style={{ margin: 0, color: "#475569", lineHeight: 1.65, maxWidth: 860 }}>
            MyLearna is not asking you to throw those tools away. The question is what happens after the lesson, activity, outing or project: where does the learning record live?
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))",
            gap: 14,
          }}
        >
          {APPROACHES.map((approach) => (
            <article
              key={approach.title}
              style={{
                border: approach.title === "MyLearna" ? "1px solid #bbf7d0" : "1px solid #e5e7eb",
                borderRadius: 16,
                padding: 16,
                background: approach.title === "MyLearna" ? "#f0fdf4" : "#ffffff",
                display: "grid",
                gap: 12,
              }}
            >
              <h3 style={{ margin: 0, fontSize: 18, lineHeight: 1.25, color: "#0f172a" }}>
                {approach.title}
              </h3>
              <div>
                <strong style={{ color: "#334155", fontSize: 13 }}>Best at</strong>
                <p style={{ margin: "4px 0 0", color: "#475569", lineHeight: 1.55, fontSize: 14 }}>
                  {approach.bestAt}
                </p>
              </div>
              <div>
                <strong style={{ color: "#334155", fontSize: 13 }}>What still needs a home</strong>
                <p style={{ margin: "4px 0 0", color: "#475569", lineHeight: 1.55, fontSize: 14 }}>
                  {approach.recordGap}
                </p>
              </div>
              <div>
                <strong style={{ color: "#166534", fontSize: 13 }}>Where MyLearna fits</strong>
                <p style={{ margin: "4px 0 0", color: "#334155", lineHeight: 1.55, fontSize: 14 }}>
                  {approach.myLearnaFit}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section style={{ ...publicCardStyle(), marginBottom: 22 }}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ color: "#64748b", fontSize: 12, fontWeight: 850, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Typical emphasis
          </div>
          <h2 style={{ margin: "6px 0 6px", fontSize: 25, lineHeight: 1.2, color: "#0f172a" }}>
            The difference is what the tool is designed to hold together
          </h2>
          <p style={{ margin: 0, color: "#64748b", fontSize: 13, lineHeight: 1.55 }}>
            Category descriptions are intentionally broad. Features vary by product; this comparison is about the typical job each approach is built to do.
          </p>
        </div>

        <div style={{ overflowX: "auto", border: "1px solid #e5e7eb", borderRadius: 18 }}>
          <table style={{ width: "100%", minWidth: 900, borderCollapse: "collapse", background: "#ffffff" }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {[
                  "Capability",
                  "AI planner",
                  "Homeschool planner",
                  "Spreadsheet / notes",
                  "MyLearna",
                ].map((label, index) => (
                  <th
                    key={label}
                    style={{
                      padding: "14px 12px",
                      borderRight: index === 4 ? undefined : "1px solid #e5e7eb",
                      borderBottom: "1px solid #e5e7eb",
                      textAlign: index === 0 ? "left" : "center",
                      fontSize: 13,
                      color: index === 4 ? "#166534" : "#475569",
                      background: index === 4 ? "#ecfdf5" : "#f8fafc",
                    }}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row) => (
                <tr key={row.capability}>
                  <td
                    style={{
                      padding: "14px 12px",
                      borderRight: "1px solid #e5e7eb",
                      borderBottom: "1px solid #e5e7eb",
                      fontWeight: 800,
                      color: "#0f172a",
                      minWidth: 220,
                    }}
                  >
                    {row.capability}
                  </td>
                  <td style={comparisonCellStyle()}>{row.ai}</td>
                  <td style={comparisonCellStyle()}>{row.planner}</td>
                  <td style={comparisonCellStyle()}>{row.manual}</td>
                  <td style={{ ...comparisonCellStyle(true), borderRight: undefined }}>{row.myLearna}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
          gap: 18,
          marginBottom: 22,
        }}
      >
        <div style={publicCardStyle()}>
          <div style={publicPill("#f5f3ff", "#6d28d9")}>Where MyLearna starts to matter</div>
          <h2 style={{ margin: "12px 0 8px", color: "#0f172a", fontSize: 24, lineHeight: 1.2 }}>
            Plan → Capture → Portfolio → Understand → Report
          </h2>
          <p style={{ margin: 0, color: "#475569", lineHeight: 1.65 }}>
            Planning is useful, but the stronger MyLearna value appears after learning happens: capture the moment, keep the evidence, build the Portfolio, understand the record and create Reports without rebuilding the story later.
          </p>
        </div>

        <div style={publicCardStyle()}>
          <div style={publicPill("#ecfdf5", "#166534")}>Completion is not the same as learning</div>
          <h2 style={{ margin: "12px 0 8px", color: "#0f172a", fontSize: 24, lineHeight: 1.2 }}>
            A ticked lesson can tell you it was done. Evidence tells you what happened.
          </h2>
          <p style={{ margin: 0, color: "#475569", lineHeight: 1.65 }}>
            MyLearna keeps the parent’s observations, work samples and learning evidence connected to the child’s longer-term record rather than treating lesson completion as proof of learning.
          </p>
        </div>
      </section>

      <section
        style={{
          ...publicCardStyle(),
          background: "linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)",
          border: "1px solid #bfdbfe",
          display: "grid",
          gap: 14,
        }}
      >
        <div>
          <div style={{ color: "#1d4ed8", fontSize: 12, fontWeight: 850, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Keep what already works
          </div>
          <h2 style={{ margin: "6px 0 8px", color: "#0f172a", fontSize: 26, lineHeight: 1.2 }}>
            You do not need to replace the tools that already help your family.
          </h2>
          <p style={{ margin: 0, color: "#475569", lineHeight: 1.65, maxWidth: 820 }}>
            Keep your curriculum. Keep the books, worksheets, websites, co-ops, classes, projects and AI tools that suit your homeschool. Use MyLearna to bring the learning from all of them into one private record you can keep, understand and report from.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href="/demo?source=compare-bottom-demo" style={publicButtonStyle(true)}>
            See how learning becomes a report
          </Link>
          <Link href="/start-free?source=compare-bottom-family-space" style={publicButtonStyle(false)}>
            Create your free family space
          </Link>
        </div>
      </section>
    </PublicSiteShell>
  );
}
