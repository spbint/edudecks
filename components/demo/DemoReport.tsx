"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { demoButton, demoCard, demoColors, demoSecondaryButton } from "@/components/demo/DemoShell";
import DemoWorksheetPreview from "@/components/demo/DemoWorksheetPreview";
import { downloadCarterFamilyDemoPdf } from "@/lib/demo/demoPdf";
import type { DemoReportViewModel, DemoState } from "@/lib/demo/demoTypes";
import { trackPublicAcquisitionEvent } from "@/app/lib/publicAnalytics";

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function DemoReport({
  model,
  state,
  onKeepExploring,
}: {
  model: DemoReportViewModel;
  state: DemoState;
  onKeepExploring: () => void;
}) {
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    trackPublicAcquisitionEvent("public_report_viewed", "/demo");
  }, []);

  async function download() {
    setDownloading(true);
    try {
      await downloadCarterFamilyDemoPdf("Emma's Learning Report", state);
      trackPublicAcquisitionEvent("public_report_downloaded", "/demo");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <section aria-labelledby="demo-report-title" style={{ ...demoCard, display: "grid", gap: 18 }}>
      <header style={{ display: "grid", gap: 10, borderBottom: `1px solid ${demoColors.line}`, paddingBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ color: demoColors.purple, fontWeight: 900, fontSize: 12, letterSpacing: "0.08em" }}>MYLEARNA LEARNING REPORT</div>
          <span style={{ border: "1px solid #bbf7d0", borderRadius: 999, background: "#f0fdf4", color: "#166534", padding: "6px 10px", fontSize: 12, fontWeight: 900 }}>Ready</span>
        </div>
        <h1 id="demo-report-title" style={{ margin: 0, fontSize: "clamp(28px, 5vw, 38px)", lineHeight: 1.08 }}>Preview Emma&apos;s Learning Report</h1>
        <h2 style={{ margin: 0, fontSize: 22 }}>Emma Carter Learning Record</h2>
        <div style={{ display: "grid", gap: 4, color: demoColors.slate, lineHeight: 1.55 }}>
          <div><strong>Reporting period:</strong> {model.reportingPeriod}</div>
          <div><strong>Prepared:</strong> {model.preparedOnLabel}</div>
          <div><strong>Learning area:</strong> Mathematics</div>
        </div>
        <div role="note" style={{ border: "1px solid #ddd6fe", borderRadius: 12, background: "#faf5ff", padding: 12, color: "#5b21b6", fontSize: 13, lineHeight: 1.5 }}>
          {model.disclaimer}
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="button" onClick={download} disabled={downloading} style={{ ...demoButton, opacity: downloading ? 0.65 : 1 }}>
            {downloading ? "Preparing sample report..." : "Download sample report"}
          </button>
        </div>
      </header>

      <section style={{ ...demoCard, boxShadow: "none", display: "grid", gap: 12, background: "#fbfdff" }}>
        <div style={{ color: demoColors.slate, fontSize: 12, fontWeight: 900, letterSpacing: "0.06em" }}>LEARNING SNAPSHOT</div>
        <h2 style={{ margin: 0, fontSize: 24 }}>Here is Emma&apos;s learning story and the work behind it.</h2>
        <p style={{ margin: 0, color: demoColors.slate, lineHeight: 1.7 }}>{model.summary}</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
          {[
            ["Reporting period", "1 Mar 2026 to 31 Jul 2026"],
            ["Status", "Ready"],
            ["Learning areas", "1 represented"],
            ["Learning records", String(model.evidenceEntries.length)],
            ["Latest learning", "24 Jul 2026"],
          ].map(([label, value]) => (
            <div key={label} style={{ border: `1px solid ${demoColors.line}`, borderRadius: 12, padding: 12, background: "#ffffff" }}>
              <div style={{ color: demoColors.slate, fontSize: 12, fontWeight: 800 }}>{label}</div>
              <strong style={{ display: "block", marginTop: 5 }}>{value}</strong>
            </div>
          ))}
        </div>
      </section>

      <section style={{ ...demoCard, boxShadow: "none", display: "grid", gap: 12 }}>
        <div style={{ color: demoColors.slate, fontSize: 12, fontWeight: 900, letterSpacing: "0.06em" }}>MATHEMATICS / PATHWAY SUMMARY</div>
        <h2 style={{ margin: 0, fontSize: 25 }}>Mathematics</h2>
        <div style={{ color: demoColors.slate }}>8 learning records | Latest: 24 July 2026</div>
        <p style={{ margin: 0, color: demoColors.slate, lineHeight: 1.7 }}>{model.pathwaySummary}</p>
        <div style={{ display: "grid", gap: 8 }}>
          <strong>{model.pathway}</strong>
          <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>
            {[
              ["Developing", "Simple scaling and related quantities"],
              ["Consolidating", "Rates, ratios, tables and unit comparisons"],
              ["Increasingly secure", "Real-world proportional reasoning, judgement and mathematical communication"],
            ].map(([label, text], index) => (
              <div key={label} style={{ border: `1px solid ${index === 2 ? "#bbf7d0" : demoColors.line}`, borderRadius: 12, padding: 12, background: index === 2 ? "#f0fdf4" : "#ffffff" }}>
                <strong style={{ color: index === 2 ? "#166534" : demoColors.navy }}>{label}</strong>
                <div style={{ marginTop: 5, color: demoColors.slate, lineHeight: 1.45 }}>{text}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="demo-evidence-title" style={{ display: "grid", gap: 14 }}>
        <div>
          <div style={{ color: demoColors.slate, fontSize: 12, fontWeight: 900, letterSpacing: "0.06em" }}>SELECTED LEARNING RECORDS</div>
          <h2 id="demo-evidence-title" style={{ margin: "5px 0 0", fontSize: 25 }}>Emma&apos;s proportional reasoning journey</h2>
        </div>
        {model.evidenceEntries.map((entry) => (
          <article key={entry.id} style={{ ...demoCard, boxShadow: "none", display: "grid", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 21 }}>{entry.title}</h3>
                <div style={{ marginTop: 5, color: demoColors.slate, fontSize: 13 }}>{formatDate(entry.observedOn)} | {entry.learningArea} | {entry.pathway}</div>
              </div>
              <span style={{ borderRadius: 999, padding: "6px 10px", background: entry.progress === "Secure" ? "#dcfce7" : "#ffedd5", color: entry.progress === "Secure" ? "#166534" : "#9a3412", fontSize: 12, fontWeight: 900 }}>{entry.progress}</span>
            </div>
            <div style={{ color: demoColors.slate, fontSize: 13, fontWeight: 800 }}>Connected pathway step: Step {entry.step}</div>
            <DemoWorksheetPreview url={entry.worksheetUrl} alt={entry.imageAlt} />
            <div style={{ display: "grid", gap: 10 }}>
              <div><strong>What happened</strong><p style={{ margin: "4px 0 0", color: demoColors.slate, lineHeight: 1.65 }}>{entry.whatHappened}</p></div>
              <div><strong>Parent observation</strong><p style={{ margin: "4px 0 0", color: demoColors.slate, lineHeight: 1.65 }}>{entry.parentObservation}</p></div>
              <div><strong>Learner reflection</strong><p style={{ margin: "4px 0 0", color: demoColors.slate, lineHeight: 1.65 }}>{entry.learnerReflection}</p></div>
            </div>
          </article>
        ))}
      </section>

      {state.captureIncludedInPortfolio ? (
        <section aria-label="Demo completion" style={{ border: "1px solid #bfdbfe", borderRadius: 16, padding: 16, background: "#f8fbff", display: "grid", gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 22 }}>You&apos;ve taken one learning moment from today&apos;s plan into a printable family report.</h2>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/start-free?source=demo-complete" style={demoButton}>Use MyLearna with your family</Link>
            <button type="button" onClick={onKeepExploring} style={demoSecondaryButton}>Keep exploring</button>
          </div>
        </section>
      ) : null}
    </section>
  );
}
