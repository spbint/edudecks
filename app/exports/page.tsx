"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ActiveChildContextBar from "@/app/components/ActiveChildContextBar";
import { useActiveStudent } from "@/app/hooks/useActiveStudent";

function safe(v: any) {
  return String(v ?? "").trim();
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoIso(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

const S = {
  shell: {
    minHeight: "100vh",
    background: "#f6f7fb",
    padding: 24,
  } as React.CSSProperties,

  wrap: {
    maxWidth: 1180,
    margin: "0 auto",
  } as React.CSSProperties,

  hero: {
    border: "1px solid #e5e7eb",
    borderRadius: 26,
    padding: 28,
    background:
      "linear-gradient(135deg, rgba(17,24,39,0.06), rgba(99,102,241,0.08))",
  } as React.CSSProperties,

  subtle: {
    color: "#6b7280",
    fontSize: 12,
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  } as React.CSSProperties,

  h1: {
    margin: "10px 0 0 0",
    fontSize: 38,
    fontWeight: 950,
    color: "#0f172a",
    lineHeight: 1.05,
  } as React.CSSProperties,

  lead: {
    marginTop: 14,
    fontSize: 17,
    lineHeight: 1.65,
    color: "#475569",
    fontWeight: 700,
    maxWidth: 850,
  } as React.CSSProperties,

  callout: {
    marginTop: 16,
    background: "#eff6ff",
    border: "1px solid #dbeafe",
    color: "#1d4ed8",
    padding: 14,
    borderRadius: 16,
    fontWeight: 800,
    lineHeight: 1.55,
  } as React.CSSProperties,

  btnRow: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    marginTop: 22,
  } as React.CSSProperties,

  btn: {
    padding: "12px 16px",
    borderRadius: 14,
    border: "1px solid #dbe1ea",
    background: "#fff",
    color: "#0f172a",
    fontWeight: 900,
    cursor: "pointer",
  } as React.CSSProperties,

  btnPrimary: {
    padding: "12px 16px",
    borderRadius: 14,
    border: "1px solid #111827",
    background: "#111827",
    color: "#fff",
    fontWeight: 900,
    cursor: "pointer",
  } as React.CSSProperties,

  grid4: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 14,
    marginTop: 18,
  } as React.CSSProperties,

  grid3: {
    display: "grid",
    gridTemplateColumns: "1.2fr 1fr 1fr",
    gap: 14,
    marginTop: 18,
  } as React.CSSProperties,

  grid2: {
    display: "grid",
    gridTemplateColumns: "1.1fr 0.9fr",
    gap: 14,
    marginTop: 18,
  } as React.CSSProperties,

  card: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 20,
    padding: 18,
  } as React.CSSProperties,

  statK: {
    fontSize: 12,
    fontWeight: 900,
    textTransform: "uppercase",
    color: "#64748b",
  } as React.CSSProperties,

  statV: {
    marginTop: 6,
    fontSize: 28,
    fontWeight: 950,
    color: "#0f172a",
  } as React.CSSProperties,

  statS: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: 700,
    color: "#475569",
    lineHeight: 1.45,
  } as React.CSSProperties,

  sectionTitle: {
    fontSize: 18,
    fontWeight: 950,
    color: "#0f172a",
  } as React.CSSProperties,

  sectionText: {
    marginTop: 8,
    fontWeight: 700,
    color: "#475569",
    lineHeight: 1.6,
    fontSize: 14,
  } as React.CSSProperties,

  fieldGrid: {
    display: "grid",
    gap: 14,
    marginTop: 14,
  } as React.CSSProperties,

  fieldRow2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  } as React.CSSProperties,

  field: {
    display: "grid",
    gap: 8,
  } as React.CSSProperties,

  label: {
    fontSize: 12,
    color: "#475569",
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  } as React.CSSProperties,

  input: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 14,
    border: "1px solid #dbe1ea",
    background: "#fff",
    color: "#0f172a",
    fontWeight: 800,
    outline: "none",
  } as React.CSSProperties,

  actionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 12,
    marginTop: 14,
  } as React.CSSProperties,

  actionCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 16,
    textAlign: "left",
    cursor: "pointer",
  } as React.CSSProperties,

  actionTitle: {
    fontSize: 16,
    fontWeight: 950,
    color: "#0f172a",
  } as React.CSSProperties,

  actionText: {
    marginTop: 8,
    color: "#475569",
    fontWeight: 700,
    lineHeight: 1.5,
    fontSize: 14,
  } as React.CSSProperties,

  chipRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  } as React.CSSProperties,

  chip: {
    display: "inline-flex",
    alignItems: "center",
    padding: "8px 10px",
    borderRadius: 999,
    background: "#fff",
    border: "1px solid #dbe1ea",
    color: "#0f172a",
    fontSize: 12,
    fontWeight: 900,
  } as React.CSSProperties,

  preview: {
    marginTop: 12,
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: 14,
    background: "#fff",
  } as React.CSSProperties,

  previewTitle: {
    fontSize: 17,
    fontWeight: 950,
    color: "#0f172a",
  } as React.CSSProperties,

  previewText: {
    marginTop: 10,
    color: "#334155",
    fontWeight: 700,
    lineHeight: 1.6,
    fontSize: 14,
  } as React.CSSProperties,

  info: {
    marginTop: 12,
    borderRadius: 12,
    border: "1px solid #bfdbfe",
    background: "#eff6ff",
    padding: 10,
    color: "#1d4ed8",
    fontWeight: 900,
  } as React.CSSProperties,

  warn: {
    marginTop: 12,
    borderRadius: 12,
    border: "1px solid #fde68a",
    background: "#fffbeb",
    padding: 10,
    color: "#92400e",
    fontWeight: 900,
  } as React.CSSProperties,
};

export default function ExportsPage() {
  const router = useRouter();
  const { student, studentName, activeStudentId } = useActiveStudent();

  const [dateFrom, setDateFrom] = useState(daysAgoIso(90));
  const [dateTo, setDateTo] = useState(todayIso());
  const [framework, setFramework] = useState("homeschool_core");
  const [groupBy, setGroupBy] = useState("area");
  const [exportStyle, setExportStyle] = useState("portfolio");
  const [includeReflection, setIncludeReflection] = useState("yes");
  const [includeGoals, setIncludeGoals] = useState("yes");

  const launchSummary = useMemo(() => {
    return {
      child: studentName || "No child selected",
      range: `${dateFrom} → ${dateTo}`,
      framework:
        framework === "homeschool_core"
          ? "Homeschool Core"
          : framework === "raw"
          ? "Raw Learning Areas"
          : framework,
      style:
        exportStyle === "portfolio"
          ? "Portfolio summary"
          : exportStyle === "authority"
          ? "Authority-ready report"
          : exportStyle === "appendix"
          ? "Evidence appendix"
          : exportStyle,
    };
  }, [studentName, dateFrom, dateTo, framework, exportStyle]);

  function requireChild(next: () => void) {
    if (!activeStudentId) {
      router.push("/children");
      return;
    }
    next();
  }

  return (
    <div style={S.shell}>
      <div style={S.wrap}>
        <ActiveChildContextBar
          showOpenProfile={true}
          showOpenPortfolio={true}
          showAddEvidence={true}
        />

        <section style={S.hero}>
          <div style={S.subtle}>Exports</div>
          <h1 style={S.h1}>Authority-ready export launcher</h1>
          <div style={S.lead}>
            Use this page to prepare a cleaner, parent-friendly export workflow.
            It helps you define the child, timeframe, framework, and export style
            before jumping into portfolio, sharing, or later report generation.
          </div>

          <div style={S.callout}>
            This is the best place to evolve EduDecks from evidence collection
            into real reporting confidence for homeschool families.
          </div>

          <div style={S.btnRow}>
            <button
              style={S.btnPrimary}
              onClick={() =>
                requireChild(() =>
                  router.push(`/admin/students/${encodeURIComponent(activeStudentId!)}/portfolio`)
                )
              }
            >
              Open export source portfolio
            </button>

            <button
              style={S.btn}
              onClick={() =>
                requireChild(() =>
                  router.push(`/admin/students/${encodeURIComponent(activeStudentId!)}/share`)
                )
              }
            >
              Open share/export tools
            </button>

            <button style={S.btn} onClick={() => router.push("/portfolio")}>
              Back to portfolio launcher
            </button>
          </div>

          {!activeStudentId ? (
            <div style={S.warn}>
              No active child selected yet. Choose a child first so exports can be prepared in context.
            </div>
          ) : null}
        </section>

        <section style={S.grid4}>
          <div style={S.card}>
            <div style={S.statK}>Active child</div>
            <div style={S.statV}>{studentName || "—"}</div>
            <div style={S.statS}>The learner currently driving this export setup.</div>
          </div>

          <div style={S.card}>
            <div style={S.statK}>Timeframe</div>
            <div style={S.statV}>{dateFrom ? "Set" : "—"}</div>
            <div style={S.statS}>A defined reporting window is ready to use.</div>
          </div>

          <div style={S.card}>
            <div style={S.statK}>Framework</div>
            <div style={S.statV}>
              {framework === "homeschool_core" ? "Core" : framework === "raw" ? "Raw" : framework}
            </div>
            <div style={S.statS}>The report view this export will be based on.</div>
          </div>

          <div style={S.card}>
            <div style={S.statK}>Style</div>
            <div style={S.statV}>
              {exportStyle === "portfolio"
                ? "Portfolio"
                : exportStyle === "authority"
                ? "Authority"
                : "Appendix"}
            </div>
            <div style={S.statS}>The reporting intent selected for this export.</div>
          </div>
        </section>

        <section style={S.grid2}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Export setup</div>
            <div style={S.sectionText}>
              Choose the reporting window and structure you want to use.
            </div>

            <div style={S.fieldGrid}>
              <div style={S.fieldRow2}>
                <div style={S.field}>
                  <label style={S.label}>Date from</label>
                  <input
                    style={S.input}
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>

                <div style={S.field}>
                  <label style={S.label}>Date to</label>
                  <input
                    style={S.input}
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
              </div>

              <div style={S.fieldRow2}>
                <div style={S.field}>
                  <label style={S.label}>Framework</label>
                  <select
                    style={S.input}
                    value={framework}
                    onChange={(e) => setFramework(e.target.value)}
                  >
                    <option value="homeschool_core">Homeschool Core</option>
                    <option value="raw">Raw Learning Areas</option>
                  </select>
                </div>

                <div style={S.field}>
                  <label style={S.label}>Group by</label>
                  <select
                    style={S.input}
                    value={groupBy}
                    onChange={(e) => setGroupBy(e.target.value)}
                  >
                    <option value="area">Learning area</option>
                    <option value="type">Evidence type</option>
                    <option value="term">Term</option>
                    <option value="month">Month</option>
                  </select>
                </div>
              </div>

              <div style={S.fieldRow2}>
                <div style={S.field}>
                  <label style={S.label}>Export style</label>
                  <select
                    style={S.input}
                    value={exportStyle}
                    onChange={(e) => setExportStyle(e.target.value)}
                  >
                    <option value="portfolio">Portfolio summary</option>
                    <option value="authority">Authority-ready report</option>
                    <option value="appendix">Evidence appendix</option>
                  </select>
                </div>

                <div style={S.field}>
                  <label style={S.label}>Include reflection</label>
                  <select
                    style={S.input}
                    value={includeReflection}
                    onChange={(e) => setIncludeReflection(e.target.value)}
                  >
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
              </div>

              <div style={S.field}>
                <label style={S.label}>Include goals</label>
                <select
                  style={S.input}
                  value={includeGoals}
                  onChange={(e) => setIncludeGoals(e.target.value)}
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
            </div>

            <div style={S.btnRow}>
              <button
                style={S.btnPrimary}
                onClick={() =>
                  requireChild(() =>
                    router.push(`/admin/students/${encodeURIComponent(activeStudentId!)}/portfolio`)
                  )
                }
              >
                Launch portfolio export source
              </button>

              <button
                style={S.btn}
                onClick={() =>
                  requireChild(() =>
                    router.push(`/admin/students/${encodeURIComponent(activeStudentId!)}/share`)
                  )
                }
              >
                Launch share/export page
              </button>
            </div>
          </div>

          <div style={S.card}>
            <div style={S.sectionTitle}>Export preview</div>
            <div style={S.sectionText}>
              A simple summary of the export shape you are preparing.
            </div>

            <div style={S.preview}>
              <div style={S.previewTitle}>{launchSummary.style}</div>
              <div style={S.previewText}>
                Child: <strong>{launchSummary.child}</strong>
              </div>
              <div style={S.previewText}>
                Timeframe: <strong>{launchSummary.range}</strong>
              </div>
              <div style={S.previewText}>
                Framework: <strong>{launchSummary.framework}</strong>
              </div>
              <div style={S.previewText}>
                Grouping: <strong>{groupBy}</strong>
              </div>

              <div style={S.chipRow}>
                <span style={S.chip}>{launchSummary.framework}</span>
                <span style={S.chip}>{groupBy}</span>
                <span style={S.chip}>
                  Reflection {includeReflection === "yes" ? "included" : "excluded"}
                </span>
                <span style={S.chip}>
                  Goals {includeGoals === "yes" ? "included" : "excluded"}
                </span>
              </div>
            </div>

            <div style={S.info}>
              Later, this page can become the front door for true PDF report generation,
              authority templates, and formal export bundles.
            </div>
          </div>
        </section>

        <section style={S.grid3}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Export actions</div>
            <div style={S.sectionText}>
              These are the most useful next steps depending on what kind of export you want.
            </div>

            <div style={S.actionGrid}>
              <button
                style={S.actionCard}
                onClick={() =>
                  requireChild(() =>
                    router.push(`/admin/students/${encodeURIComponent(activeStudentId!)}/portfolio`)
                  )
                }
              >
                <div style={S.actionTitle}>Portfolio review</div>
                <div style={S.actionText}>
                  Open the grouped portfolio and inspect evidence coverage first.
                </div>
              </button>

              <button
                style={S.actionCard}
                onClick={() =>
                  requireChild(() =>
                    router.push(`/admin/evidence-feed?studentId=${encodeURIComponent(activeStudentId!)}`)
                  )
                }
              >
                <div style={S.actionTitle}>Evidence appendix source</div>
                <div style={S.actionText}>
                  Review the raw evidence feed before building an appendix-style export.
                </div>
              </button>

              <button
                style={S.actionCard}
                onClick={() =>
                  requireChild(() =>
                    router.push(`/admin/students/${encodeURIComponent(activeStudentId!)}/share`)
                  )
                }
              >
                <div style={S.actionTitle}>Secure share link</div>
                <div style={S.actionText}>
                  Create a parent-controlled link for sharing portfolio evidence externally.
                </div>
              </button>

              <button
                style={S.actionCard}
                onClick={() => router.push("/children")}
              >
                <div style={S.actionTitle}>Switch learner</div>
                <div style={S.actionText}>
                  Change the active child before preparing the export.
                </div>
              </button>
            </div>
          </div>

          <div style={S.card}>
            <div style={S.sectionTitle}>Why this page matters</div>
            <div style={S.sectionText}>
              Exports are where parents start asking, “Can I actually report from this?”
              This launcher is the bridge from evidence collection to reporting confidence.
            </div>

            <div style={S.chipRow}>
              <span style={S.chip}>Child in context</span>
              <span style={S.chip}>Timeframe selection</span>
              <span style={S.chip}>Framework choice</span>
              <span style={S.chip}>Authority direction</span>
            </div>

            <div style={S.callout}>
              Even before full report generation is built, this page gives parents a clearer
              mental model of how EduDecks can support official reporting.
            </div>
          </div>

          <div style={S.card}>
            <div style={S.sectionTitle}>Likely next upgrades</div>
            <div style={S.sectionText}>
              This export launcher is the right place for future formal reporting features.
            </div>

            <div style={S.chipRow}>
              <span style={S.chip}>PDF pack builder</span>
              <span style={S.chip}>Authority templates</span>
              <span style={S.chip}>Date-range exports</span>
              <span style={S.chip}>Appendix generator</span>
              <span style={S.chip}>Reflection sheet</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}