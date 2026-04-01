"use client";

import React from "react";
import Link from "next/link";
import PublicSiteShell, {
  publicButtonStyle,
  publicCardStyle,
  publicPill,
} from "@/app/components/PublicSiteShell";

function checkStyle(kind: "yes" | "partial" | "no"): React.CSSProperties {
  if (kind === "yes") return publicPill("#ecfdf5", "#166534");
  if (kind === "partial") return publicPill("#fff7ed", "#9a3412");
  return publicPill("#f3f4f6", "#374151");
}

const COMPARISON_ROWS = [
  { feature: "Fast evidence capture", edudecks: "yes", spreadsheet: "partial", notesApp: "partial", genericSchoolTool: "partial" },
  { feature: "Homeschool-first workflow", edudecks: "yes", spreadsheet: "no", notesApp: "no", genericSchoolTool: "no" },
  { feature: "Portfolio curation guidance", edudecks: "yes", spreadsheet: "no", notesApp: "no", genericSchoolTool: "partial" },
  { feature: "Submission preview before reporting", edudecks: "yes", spreadsheet: "no", notesApp: "no", genericSchoolTool: "partial" },
  { feature: "Goals + weekly rhythm planning", edudecks: "yes", spreadsheet: "partial", notesApp: "partial", genericSchoolTool: "partial" },
  { feature: "Family-friendly reporting flow", edudecks: "yes", spreadsheet: "no", notesApp: "no", genericSchoolTool: "partial" },
  { feature: "Authority-ready direction", edudecks: "yes", spreadsheet: "partial", notesApp: "no", genericSchoolTool: "partial" },
  { feature: "Calm B2C design for real homes", edudecks: "yes", spreadsheet: "no", notesApp: "partial", genericSchoolTool: "no" },
] as const;

export default function ComparePage() {
  return (
    <PublicSiteShell
      eyebrow="Why families switch"
      heroTitle="More than storage. A real homeschool workflow."
      heroText="EduDecks Family is not trying to out-spreadsheet a spreadsheet or out-notes a notes app. It is built to connect capture, curation, planning, and reporting into one homeschool-first system."
      heroBadges={["Capture", "Portfolio", "Planning", "Reporting"]}
      primaryCta={{ label: "Start Free", href: "/capture" }}
      secondaryCta={{ label: "View Pricing", href: "/pricing" }}
      asideTitle="Core advantage"
      asideText="Most tools only solve one piece of the problem. EduDecks Family helps families move from learning moment to final report without jumping between disconnected systems."
    >
      <section style={{ ...publicCardStyle(), marginBottom: 24 }}>
        <div style={{ fontSize: 28, fontWeight: 900, color: "#0f172a", marginBottom: 8 }}>
          Feature comparison
        </div>
        <div style={{ fontSize: 14, color: "#475569", lineHeight: 1.6, marginBottom: 16 }}>
          This table shows where EduDecks Family is intentionally different from general-purpose tools.
        </div>

        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "separate",
              borderSpacing: 0,
              minWidth: 860,
            }}
          >
            <thead>
              <tr>
                {["Feature", "EduDecks Family", "Spreadsheet", "Notes App", "Generic School Tool"].map(
                  (heading, idx) => (
                    <th
                      key={heading}
                      style={{
                        textAlign: "left",
                        padding: "14px 12px",
                        borderTop: "1px solid #e5e7eb",
                        borderBottom: "1px solid #e5e7eb",
                        borderLeft: idx === 0 ? "1px solid #e5e7eb" : "none",
                        borderRight: "1px solid #e5e7eb",
                        background: idx === 1 ? "#eff6ff" : "#f8fafc",
                        fontSize: 13,
                        fontWeight: 900,
                        color: "#0f172a",
                      }}
                    >
                      {heading}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row) => (
                <tr key={row.feature}>
                  <td style={{ padding: "14px 12px", borderLeft: "1px solid #e5e7eb", borderRight: "1px solid #e5e7eb", borderBottom: "1px solid #e5e7eb", background: "#ffffff", fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
                    {row.feature}
                  </td>
                  <td style={{ padding: "14px 12px", borderRight: "1px solid #e5e7eb", borderBottom: "1px solid #e5e7eb", background: "#f8fbff" }}>
                    <div style={checkStyle(row.edudecks)}>Yes</div>
                  </td>
                  <td style={{ padding: "14px 12px", borderRight: "1px solid #e5e7eb", borderBottom: "1px solid #e5e7eb", background: "#ffffff" }}>
                    <div style={checkStyle(row.spreadsheet)}>{row.spreadsheet === "partial" ? "Partial" : row.spreadsheet === "yes" ? "Yes" : "No"}</div>
                  </td>
                  <td style={{ padding: "14px 12px", borderRight: "1px solid #e5e7eb", borderBottom: "1px solid #e5e7eb", background: "#ffffff" }}>
                    <div style={checkStyle(row.notesApp)}>{row.notesApp === "partial" ? "Partial" : row.notesApp === "yes" ? "Yes" : "No"}</div>
                  </td>
                  <td style={{ padding: "14px 12px", borderRight: "1px solid #e5e7eb", borderBottom: "1px solid #e5e7eb", background: "#ffffff" }}>
                    <div style={checkStyle(row.genericSchoolTool)}>{row.genericSchoolTool === "partial" ? "Partial" : row.genericSchoolTool === "yes" ? "Yes" : "No"}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </PublicSiteShell>
  );
}