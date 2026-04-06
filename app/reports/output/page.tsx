"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  loadReportDraftById,
  marketLabel,
  modeLabel,
  periodLabel,
  type ReportDraftRow,
} from "@/lib/reportDrafts";
import CurriculumSummary from "@/app/components/CurriculumSummary";

function safe(v: unknown) {
  return String(v ?? "").trim();
}

function clip(v: string, max = 240) {
  return v.length > max ? `${v.slice(0, max)}...` : v;
}

export default function ReportsOutputPage() {
  return (
    <Suspense fallback={null}>
      <ReportsOutputPageContent />
    </Suspense>
  );
}

function ReportsOutputPageContent() {
  const searchParams = useSearchParams();
  const draftId = safe(searchParams.get("draftId"));

  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<ReportDraftRow | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      if (!draftId) {
        if (active) {
          setMessage("Choose or save a report draft first, then open the output view.");
          setLoading(false);
        }
        return;
      }

      try {
        const row = await loadReportDraftById(draftId);
        if (!active) return;
        setDraft(row);
        if (!row) {
          setMessage("We could not find that report draft. Save a draft again from Reports, then return here.");
        }
      } catch {
        if (!active) return;
        setMessage("We could not load the report output just now. Please return to Reports and try again.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [draftId]);

  const summaryText = useMemo(() => {
    if (!draft) return "";
    const note = safe(draft.notes);
    if (note) return clip(note, 320);
    return "This report draft brings selected learning moments together into one calmer, clearer summary you can review, keep, and improve.";
  }, [draft]);

  return (
    <main style={{ maxWidth: 1180, margin: "0 auto", padding: "24px 20px 48px", display: "grid", gap: 18 }}>
      <section
        style={{
          border: "1px solid #bfdbfe",
          borderRadius: 22,
          background: "linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)",
          padding: 22,
          boxShadow: "0 10px 30px rgba(15,23,42,0.04)",
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", color: "#64748b", marginBottom: 8 }}>
          Report Output
        </div>
        <div style={{ fontSize: 30, lineHeight: 1.1, fontWeight: 950, color: "#0f172a" }}>
          Review the report you have built so far
        </div>
        <div style={{ marginTop: 10, fontSize: 15, lineHeight: 1.7, color: "#475569", maxWidth: 860 }}>
          This is where your selected learning becomes a clearer, usable report draft. Review it, adjust it in Reports if needed, and keep the strongest learning visible in Portfolio.
        </div>
      </section>

      <CurriculumSummary
        variant="badge"
        prefix="Based on"
        helperText="You can change this anytime in Settings."
        includeCTA={false}
      />

      {loading ? (
        <section
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 18,
            background: "#ffffff",
            padding: 22,
            boxShadow: "0 10px 30px rgba(15,23,42,0.04)",
            color: "#475569",
            fontWeight: 800,
          }}
        >
          Loading report output...
        </section>
      ) : !draft ? (
        <section
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 18,
            background: "#ffffff",
            padding: 22,
            boxShadow: "0 10px 30px rgba(15,23,42,0.04)",
            display: "grid",
            gap: 12,
          }}
        >
          <div style={{ fontSize: 22, fontWeight: 900, color: "#0f172a" }}>No report draft ready</div>
          <div style={{ fontSize: 14, lineHeight: 1.7, color: "#475569" }}>
            {message || "Go back to Reports, choose the learning moments that matter, and save a draft first."}
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/reports" style={buttonStyle(true)}>
              Back to Reports
            </Link>
            <Link href="/portfolio" style={buttonStyle(false)}>
              Open Portfolio
            </Link>
          </div>
        </section>
      ) : (
        <>
          <section
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 12,
            }}
          >
            <StatCard label="Draft ID" value={draft.id} mono />
            <StatCard label="Mode" value={modeLabel(draft.report_mode)} />
            <StatCard label="Period" value={periodLabel(draft.period_mode)} />
            <StatCard label="Market" value={marketLabel(draft.preferred_market || "au")} />
          </section>

          <section
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.15fr) minmax(280px, 0.85fr)",
              gap: 18,
            }}
          >
            <section
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 20,
                background: "#ffffff",
                padding: 22,
                boxShadow: "0 10px 30px rgba(15,23,42,0.04)",
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", color: "#64748b", marginBottom: 8 }}>
                Draft Summary
              </div>
              <div style={{ fontSize: 26, lineHeight: 1.15, fontWeight: 950, color: "#0f172a" }}>
                A clear first version is ready to review
              </div>
              <div style={{ marginTop: 14, fontSize: 15, lineHeight: 1.75, color: "#334155", whiteSpace: "pre-wrap" }}>
                {summaryText}
              </div>

              <div
                style={{
                  marginTop: 18,
                  border: "1px solid #e5e7eb",
                  borderRadius: 16,
                  background: "#f8fafc",
                  padding: 16,
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 900, color: "#0f172a" }}>What to do next</div>
                <div style={{ marginTop: 8, fontSize: 14, lineHeight: 1.7, color: "#475569" }}>
                  If this looks close, keep it and continue refining in Reports only when needed. If you want stronger supporting moments around it, add more in Portfolio and Capture, then return here.
                </div>
              </div>
            </section>

            <section
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 20,
                background: "#ffffff",
                padding: 22,
                boxShadow: "0 10px 30px rgba(15,23,42,0.04)",
                display: "grid",
                gap: 14,
                alignContent: "start",
              }}
            >
              <div>
                <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", color: "#64748b", marginBottom: 8 }}>
                  Next Actions
                </div>
                <div style={{ fontSize: 22, lineHeight: 1.2, fontWeight: 900, color: "#0f172a" }}>
                  Keep moving toward Report Ready
                </div>
              </div>

              <div style={softCardStyle}>
                <div style={{ fontSize: 13, fontWeight: 900, color: "#0f172a" }}>Return to Reports</div>
                <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.6, color: "#64748b" }}>
                  Adjust the learner, evidence mix, note, or save settings if you want a stronger next version.
                </div>
              </div>

              <div style={softCardStyle}>
                <div style={{ fontSize: 13, fontWeight: 900, color: "#0f172a" }}>Revisit Portfolio</div>
                <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.6, color: "#64748b" }}>
                  Keep the strongest learning moments visible so future report writing stays easier.
                </div>
              </div>

              <div style={{ display: "grid", gap: 10 }}>
                <Link href={`/reports?draftId=${encodeURIComponent(draft.id)}`} style={buttonStyle(true)}>
                  Back to Reports
                </Link>
                <Link href="/portfolio" style={buttonStyle(false)}>
                  Open Portfolio
                </Link>
              </div>
            </section>
          </section>
        </>
      )}
    </main>
  );
}

function StatCard({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 16,
        background: "#ffffff",
        padding: 16,
        boxShadow: "0 10px 30px rgba(15,23,42,0.04)",
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", color: "#64748b" }}>
        {label}
      </div>
      <div
        style={{
          marginTop: 8,
          fontSize: mono ? 13 : 22,
          fontWeight: 900,
          color: "#0f172a",
          fontFamily: mono ? 'ui-monospace, SFMono-Regular, Menlo, monospace' : undefined,
          wordBreak: "break-word",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function buttonStyle(primary = false): React.CSSProperties {
  return {
    minHeight: 42,
    padding: "10px 14px",
    borderRadius: 12,
    border: `1px solid ${primary ? "#2563eb" : "#d1d5db"}`,
    background: primary ? "#2563eb" : "#ffffff",
    color: primary ? "#ffffff" : "#0f172a",
    textDecoration: "none",
    fontWeight: 900,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  };
}

const softCardStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  background: "#f8fafc",
  padding: 14,
};
