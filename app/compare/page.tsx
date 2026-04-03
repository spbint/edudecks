"use client";

import React from "react";
import Link from "next/link";
import PublicSiteShell, {
  publicButtonStyle,
  publicCardStyle,
  publicPill,
} from "@/app/components/PublicSiteShell";

type ComparisonStatus = "yes" | "partial" | "no";

type ComparisonRow = {
  feature: string;
  edudecks: ComparisonStatus;
  spreadsheet: ComparisonStatus;
  notesApp: ComparisonStatus;
  genericSchoolTool: ComparisonStatus;
};

function checkStyle(kind: ComparisonStatus): React.CSSProperties {
  if (kind === "yes") return publicPill("#ecfdf5", "#166534");
  if (kind === "partial") return publicPill("#fff7ed", "#9a3412");
  return publicPill("#f3f4f6", "#374151");
}

function statusLabel(kind: ComparisonStatus) {
  if (kind === "yes") return "Yes";
  if (kind === "partial") return "Partial";
  return "No";
}

const COMPARISON_ROWS: ComparisonRow[] = [
  {
    feature: "Fast evidence capture",
    edudecks: "yes",
    spreadsheet: "partial",
    notesApp: "partial",
    genericSchoolTool: "partial",
  },
  {
    feature: "Homeschool-first workflow",
    edudecks: "yes",
    spreadsheet: "no",
    notesApp: "no",
    genericSchoolTool: "no",
  },
  {
    feature: "Portfolio curation guidance",
    edudecks: "yes",
    spreadsheet: "no",
    notesApp: "no",
    genericSchoolTool: "partial",
  },
  {
    feature: "Submission preview before reporting",
    edudecks: "yes",
    spreadsheet: "no",
    notesApp: "no",
    genericSchoolTool: "partial",
  },
  {
    feature: "Goals + weekly rhythm planning",
    edudecks: "yes",
    spreadsheet: "partial",
    notesApp: "partial",
    genericSchoolTool: "partial",
  },
  {
    feature: "Family-friendly reporting flow",
    edudecks: "yes",
    spreadsheet: "no",
    notesApp: "no",
    genericSchoolTool: "partial",
  },
  {
    feature: "Authority-ready direction",
    edudecks: "yes",
    spreadsheet: "partial",
    notesApp: "no",
    genericSchoolTool: "partial",
  },
  {
    feature: "Calm B2C design for real homes",
    edudecks: "yes",
    spreadsheet: "no",
    notesApp: "partial",
    genericSchoolTool: "no",
  },
];

const SWITCH_REASONS = [
  {
    title: "From scattered evidence to one calm record",
    text:
      "EduDecks brings capture, portfolio, planning, and reporting into one homeschool-friendly flow so families do not have to stitch the story together later.",
  },
  {
    title: "From reactive reporting to guided readiness",
    text:
      "Instead of discovering gaps at the end, families can see coverage, draft reports, and authority direction before submission pressure builds.",
  },
  {
    title: "From generic tools to a homeschool-first system",
    text:
      "Most tools can be adapted. EduDecks is designed around what homeschool families actually need: confidence, evidence, and a usable path to reporting.",
  },
];

export default function ComparePage() {
  return (
    <PublicSiteShell
      title="Compare EduDecks"
      eyebrow="WHY SWITCH"
      heroTitle="Why families move from spreadsheets and notes apps to EduDecks"
      heroText="Most families do not need more tools. They need one clear system that helps them capture learning, shape evidence, and move toward reporting with confidence."
      heroBadges={[
        "Homeschool-first workflow",
        "Capture → portfolio → reports",
        "Confidence before submission",
      ]}
      primaryCta={{ label: "Get Started", href: "/get-started" }}
      secondaryCta={{ label: "View Pricing", href: "/pricing" }}
      asideTitle="The simplest difference"
      asideText="Spreadsheets and notes apps can store information. EduDecks helps families turn that information into a usable learning record."
    >
      <section style={publicCardStyle()}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
            alignItems: "end",
            marginBottom: 16,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: 1,
                marginBottom: 8,
              }}
            >
              Feature comparison
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 900,
                color: "#0f172a",
                lineHeight: 1.2,
              }}
            >
              What changes when the workflow is built for families
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/faq" style={publicButtonStyle(false)}>
              FAQ
            </Link>
            <Link href="/get-started" style={publicButtonStyle(true)}>
              Start with EduDecks
            </Link>
          </div>
        </div>

        <div
          style={{
            overflowX: "auto",
            border: "1px solid #e5e7eb",
            borderRadius: 18,
            background: "#ffffff",
          }}
        >
          <table
            style={{
              width: "100%",
              minWidth: 860,
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                <th
                  style={{
                    textAlign: "left",
                    padding: "14px 12px",
                    borderRight: "1px solid #e5e7eb",
                    borderBottom: "1px solid #e5e7eb",
                    fontSize: 13,
                    color: "#475569",
                  }}
                >
                  Capability
                </th>
                <th
                  style={{
                    textAlign: "center",
                    padding: "14px 12px",
                    borderRight: "1px solid #e5e7eb",
                    borderBottom: "1px solid #e5e7eb",
                    fontSize: 13,
                    color: "#166534",
                    background: "#ecfdf5",
                  }}
                >
                  EduDecks
                </th>
                <th
                  style={{
                    textAlign: "center",
                    padding: "14px 12px",
                    borderRight: "1px solid #e5e7eb",
                    borderBottom: "1px solid #e5e7eb",
                    fontSize: 13,
                    color: "#475569",
                  }}
                >
                  Spreadsheet
                </th>
                <th
                  style={{
                    textAlign: "center",
                    padding: "14px 12px",
                    borderRight: "1px solid #e5e7eb",
                    borderBottom: "1px solid #e5e7eb",
                    fontSize: 13,
                    color: "#475569",
                  }}
                >
                  Notes app
                </th>
                <th
                  style={{
                    textAlign: "center",
                    padding: "14px 12px",
                    borderBottom: "1px solid #e5e7eb",
                    fontSize: 13,
                    color: "#475569",
                  }}
                >
                  Generic school tool
                </th>
              </tr>
            </thead>

            <tbody>
              {COMPARISON_ROWS.map((row) => (
                <tr key={row.feature}>
                  <td
                    style={{
                      padding: "14px 12px",
                      borderRight: "1px solid #e5e7eb",
                      borderBottom: "1px solid #e5e7eb",
                      background: "#ffffff",
                      fontWeight: 800,
                      color: "#0f172a",
                    }}
                  >
                    {row.feature}
                  </td>

                  <td
                    style={{
                      padding: "14px 12px",
                      borderRight: "1px solid #e5e7eb",
                      borderBottom: "1px solid #e5e7eb",
                      background: "#f0fdf4",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ display: "inline-flex" }}>
                      <span style={checkStyle(row.edudecks)}>
                        {statusLabel(row.edudecks)}
                      </span>
                    </div>
                  </td>

                  <td
                    style={{
                      padding: "14px 12px",
                      borderRight: "1px solid #e5e7eb",
                      borderBottom: "1px solid #e5e7eb",
                      background: "#ffffff",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ display: "inline-flex" }}>
                      <span style={checkStyle(row.spreadsheet)}>
                        {statusLabel(row.spreadsheet)}
                      </span>
                    </div>
                  </td>

                  <td
                    style={{
                      padding: "14px 12px",
                      borderRight: "1px solid #e5e7eb",
                      borderBottom: "1px solid #e5e7eb",
                      background: "#ffffff",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ display: "inline-flex" }}>
                      <span style={checkStyle(row.notesApp)}>
                        {statusLabel(row.notesApp)}
                      </span>
                    </div>
                  </td>

                  <td
                    style={{
                      padding: "14px 12px",
                      borderBottom: "1px solid #e5e7eb",
                      background: "#ffffff",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ display: "inline-flex" }}>
                      <span style={checkStyle(row.genericSchoolTool)}>
                        {statusLabel(row.genericSchoolTool)}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 18,
        }}
      >
        {SWITCH_REASONS.map((item) => (
          <div key={item.title} style={publicCardStyle()}>
            <div
              style={{
                fontSize: 18,
                fontWeight: 900,
                color: "#0f172a",
                lineHeight: 1.25,
                marginBottom: 10,
              }}
            >
              {item.title}
            </div>
            <div
              style={{
                fontSize: 14,
                lineHeight: 1.7,
                color: "#475569",
              }}
            >
              {item.text}
            </div>
          </div>
        ))}
      </section>

      <section
        style={{
          ...publicCardStyle(),
          background: "linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)",
          border: "1px solid #bfdbfe",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 900,
                color: "#0f172a",
                lineHeight: 1.2,
                marginBottom: 8,
              }}
            >
              The real switch is from storage to structure
            </div>
            <div
              style={{
                fontSize: 14,
                lineHeight: 1.7,
                color: "#475569",
                maxWidth: 760,
              }}
            >
              Families often already have the raw information. EduDecks helps shape it into a clearer story that can support portfolio decisions, reporting, and authority direction later.
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/pricing" style={publicButtonStyle(false)}>
              View Pricing
            </Link>
            <Link href="/get-started" style={publicButtonStyle(true)}>
              Get Started
            </Link>
          </div>
        </div>
      </section>
    </PublicSiteShell>
  );
}