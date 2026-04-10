"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import UpgradeCard from "@/app/components/premium/UpgradeCard";
import {
  loadReportDraftById,
  marketLabel,
  modeLabel,
  periodLabel,
  type ReportDraftRow,
} from "@/lib/reportDrafts";
import {
  loadAuthorityPackConfig,
  type AuthorityPackConfig,
  type AuthorityPackSectionKey,
} from "@/lib/authorityPackConfig";
import {
  getAuthorityFilteredEvidenceIds,
  loadAuthorityEvidenceRows,
  type AuthorityEvidenceRow,
} from "@/lib/authorityPackData";
import { buildAuthorityPackDocx } from "@/lib/authorityPackDocx";
import { buildAuthorityPackPdf } from "@/lib/authorityPackPdf";
import { buildAuthorityConfidence } from "@/lib/authorityConfidence";
import { saveAuthorityExportSnapshot } from "@/lib/authorityExportSnapshots";
import { familyStyles as S } from "@/lib/theme/familyStyles";

type ExportKind = "pdf" | "docx" | "print" | "";

function safe(v: unknown) {
  return String(v ?? "").trim();
}

function shortDate(value?: string | null) {
  const s = safe(value);
  if (!s) return "—";
  try {
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return s.slice(0, 10);
    return d.toLocaleDateString();
  } catch {
    return s.slice(0, 10);
  }
}

function selectedCoreCount(draft: ReportDraftRow) {
  return draft.selected_evidence_ids.filter(
    (id) => draft.selection_meta?.[id]?.role !== "appendix"
  ).length;
}

function selectedAppendixCount(draft: ReportDraftRow) {
  return draft.selected_evidence_ids.filter(
    (id) => draft.selection_meta?.[id]?.role === "appendix"
  ).length;
}

function selectedRequiredCount(draft: ReportDraftRow) {
  return draft.selected_evidence_ids.filter((id) =>
    Boolean(draft.selection_meta?.[id]?.required)
  ).length;
}

function sectionLabel(key: AuthorityPackSectionKey) {
  switch (key) {
    case "cover":
      return "Cover page";
    case "overview":
      return "Overview";
    case "coverage":
      return "Coverage snapshot";
    case "evidence":
      return "Selected evidence";
    case "appendix":
      return "Appendix";
    case "action-plan":
      return "Action plan";
    case "weekly-plan":
      return "Weekly plan";
    case "readiness-notes":
      return "Readiness notes";
    case "parent-note":
      return "Parent note";
    default:
      return key;
  }
}

function buildDefaultConfig(draft: ReportDraftRow): AuthorityPackConfig {
  const jurisdiction =
    draft.preferred_market === "uk" || draft.preferred_market === "us"
      ? draft.preferred_market
      : "au";

  return {
    draftId: draft.id,
    jurisdiction,
    title: `${safe(draft.child_name) || "Selected child"} Authority Pack`,
    includeSections: {
      cover: true,
      overview: true,
      coverage: true,
      evidence: true,
      appendix: true,
      "action-plan": draft.include_action_plan !== false,
      "weekly-plan": draft.include_weekly_plan !== false,
      "readiness-notes": draft.include_readiness_notes !== false,
      "parent-note": Boolean(safe(draft.notes)),
    },
    selectedEvidenceIds: Array.isArray(draft.selected_evidence_ids)
      ? [...draft.selected_evidence_ids]
      : [],
    emphasisNote: "",
    reviewerNote: "",
    includeOnlyRequiredEvidence: false,
    includeOnlyCoreEvidence: false,
    updatedAt: new Date().toISOString(),
  };
}

function confidenceBandLabel(
  band: "ready" | "strong" | "developing" | "attention"
) {
  if (band === "ready") return "Submission Ready";
  if (band === "strong") return "Strong";
  if (band === "developing") return "Nearly Ready";
  return "Not Ready for Formal Export";
}

function confidenceTone(
  band: "ready" | "strong" | "developing" | "attention"
): "success" | "info" | "warning" | "danger" {
  if (band === "ready") return "success";
  if (band === "strong") return "info";
  if (band === "developing") return "warning";
  return "danger";
}

function draftStatusMeta(status?: string | null): {
  label: string;
  tone: "secondary" | "info" | "success" | "danger";
  locked: boolean;
  exportBlocked: boolean;
  message: string;
} {
  const v = safe(status).toLowerCase();

  if (v === "submitted") {
    return {
      label: "Submitted",
      tone: "success",
      locked: true,
      exportBlocked: false,
      message:
        "This export is based on a submitted report artifact. Treat it as a locked, trust-preserving export surface.",
    };
  }

  if (v === "final") {
    return {
      label: "Final",
      tone: "info",
      locked: false,
      exportBlocked: false,
      message:
        "This export is based on a finalized report. It is stable enough for export review and formal handoff.",
    };
  }

  if (v === "archived") {
    return {
      label: "Archived",
      tone: "danger",
      locked: true,
      exportBlocked: true,
      message:
        "This export is based on an archived report. It should be treated as reference-only rather than used for fresh formal export.",
    };
  }

  return {
    label: "Draft",
    tone: "secondary",
    locked: false,
    exportBlocked: false,
    message:
      "This export is based on a draft report. Review it carefully before generating a formal artifact.",
  };
}

function latestEvidenceDate(rows: AuthorityEvidenceRow[]) {
  if (!rows.length) return "—";
  const sorted = rows
    .map((row: any) => safe(row.occurredOn || row.occurred_on))
    .filter(Boolean)
    .sort((a, b) => (a > b ? -1 : 1));
  return sorted[0] ? shortDate(sorted[0]) : "—";
}

function childName(draft: ReportDraftRow) {
  return (
    safe((draft as any).child_name) ||
    safe((draft as any).student_name) ||
    safe((draft as any).student_display_name) ||
    "Selected child"
  );
}

function reviewerImpression(args: {
  confidence:
    | ReturnType<typeof buildAuthorityConfidence>
    | null;
  evidenceRows: AuthorityEvidenceRow[];
  includedSections: AuthorityPackSectionKey[];
  draft: ReportDraftRow;
}) {
  const { confidence, evidenceRows, includedSections, draft } = args;

  if (!confidence) {
    return "This submission still needs to load before a reviewer-facing impression can be formed.";
  }

  const parts: string[] = [];

  if (confidence.band === "ready") {
    parts.push("This pack reads as calm, structured, and ready for formal export.");
  } else if (confidence.band === "strong") {
    parts.push("This pack reads as strong and well-organised, with only light refinement likely needed.");
  } else if (confidence.band === "developing") {
    parts.push("This pack reads as nearly ready, but still slightly uneven in structure or evidence balance.");
  } else {
    parts.push("This pack still reads more like a draft configuration than a finished submission.");
  }

  if (evidenceRows.length >= 4) {
    parts.push("The evidence body feels substantial enough to support a reviewer’s confidence.");
  } else if (evidenceRows.length > 0) {
    parts.push("The evidence body is present, but still fairly light.");
  } else {
    parts.push("There is currently no filtered evidence included.");
  }

  if (includedSections.includes("coverage")) {
    parts.push("Coverage is being made visible, which helps the pack feel broader and more intentional.");
  } else {
    parts.push("Coverage is not being shown explicitly, which may make breadth harder to interpret.");
  }

  if (
    safe((draft as any).report_mode).toLowerCase() === "authority-ready" &&
    includedSections.includes("readiness-notes")
  ) {
    parts.push("Readiness notes support a more prepared authority-facing posture.");
  }

  return parts.join(" ");
}

function sectionImpactSummary(enabledSections: AuthorityPackSectionKey[]) {
  const impacts: string[] = [];

  if (enabledSections.includes("overview")) impacts.push("clear context");
  if (enabledSections.includes("coverage")) impacts.push("visible curriculum breadth");
  if (enabledSections.includes("evidence")) impacts.push("a defined core evidence body");
  if (enabledSections.includes("appendix")) impacts.push("supporting depth");
  if (enabledSections.includes("parent-note")) impacts.push("family context");
  if (enabledSections.includes("readiness-notes")) impacts.push("stronger preparation posture");

  if (!impacts.length) {
    return "The current export is extremely lean and may not yet communicate enough structure.";
  }

  if (impacts.length === 1) {
    return `This export currently emphasises ${impacts[0]}.`;
  }

  return `This export currently communicates ${impacts
    .slice(0, -1)
    .join(", ")} and ${impacts[impacts.length - 1]}.`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function resolveBuilderResult(result: any, fallbackName: string) {
  if (!result) return null;

  if (result instanceof Blob) {
    return { kind: "blob" as const, blob: result, filename: fallbackName };
  }

  if (typeof result === "string") {
    return { kind: "url" as const, url: result };
  }

  if (result?.blob instanceof Blob) {
    return {
      kind: "blob" as const,
      blob: result.blob,
      filename: safe(result.filename) || fallbackName,
    };
  }

  if (typeof result?.url === "string") {
    return { kind: "url" as const, url: result.url };
  }

  return null;
}

export default function AuthorityExportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const printRef = useRef<HTMLDivElement | null>(null);

  const [draft, setDraft] = useState<ReportDraftRow | null>(null);
  const [config, setConfig] = useState<AuthorityPackConfig | null>(null);
  const [evidenceRows, setEvidenceRows] = useState<AuthorityEvidenceRow[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [exporting, setExporting] = useState<ExportKind>("");
  const [screenMode, setScreenMode] = useState<"screen" | "print">("screen");

  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      try {
        setLoading(true);
        setError("");
        setMessage("");

        const requestedDraftId = safe(searchParams.get("draftId"));
        if (!requestedDraftId) {
          throw new Error("No draftId was provided for export.");
        }

        const loadedDraft = await loadReportDraftById(requestedDraftId);
        if (!loadedDraft) {
          throw new Error("Could not load the selected report draft.");
        }

        const loadedConfig =
          loadAuthorityPackConfig(loadedDraft.id) || buildDefaultConfig(loadedDraft);

        const rows = await loadAuthorityEvidenceRows(loadedDraft, loadedConfig);

        if (!mounted) return;

        setDraft(loadedDraft);
        setConfig(loadedConfig);
        setEvidenceRows(rows);
      } catch (err: any) {
        if (!mounted) return;
        setError(String(err?.message || err || "Failed to load export page."));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void hydrate();
    return () => {
      mounted = false;
    };
  }, [searchParams]);

  const includedSections = useMemo(() => {
    if (!config) return [];
    return Object.entries(config.includeSections)
      .filter(([, enabled]) => Boolean(enabled))
      .map(([key]) => key as AuthorityPackSectionKey);
  }, [config]);

  const filteredEvidenceIds = useMemo(() => {
    if (!draft || !config) return [];
    return getAuthorityFilteredEvidenceIds(draft, config);
  }, [draft, config]);

  const confidence = useMemo(() => {
    if (!draft || !config) return null;
    return buildAuthorityConfidence(draft, config, evidenceRows);
  }, [draft, config, evidenceRows]);

  const status = useMemo(() => {
    return draftStatusMeta(draft?.status);
  }, [draft?.status]);

  const reviewerSummary = useMemo(() => {
    if (!draft) return "";
    return reviewerImpression({
      confidence,
      evidenceRows,
      includedSections,
      draft,
    });
  }, [confidence, evidenceRows, includedSections, draft]);

  const sectionImpact = useMemo(() => {
    return sectionImpactSummary(includedSections);
  }, [includedSections]);

  const exportTitle = useMemo(() => {
    if (!config?.title) return "Authority Pack";
    return config.title;
  }, [config]);

  const canFormallyExport = useMemo(() => {
    if (!confidence) return false;
    if (status.exportBlocked) return false;
    return confidence.band === "ready" || confidence.band === "strong";
  }, [confidence, status.exportBlocked]);

  async function saveSnapshot(kind: ExportKind) {
    if (!draft || !config || !confidence) return;

    try {
      await saveAuthorityExportSnapshot({
        draft_id: draft.id,
        export_kind: kind,
        title: exportTitle,
        jurisdiction: config.jurisdiction,
        confidence_score: confidence.score,
        confidence_band: confidence.band,
        filtered_evidence_count: evidenceRows.length,
        included_sections: includedSections,
      } as any);
    } catch {
      // Non-blocking on purpose
    }
  }

  async function handleExport(kind: ExportKind) {
    if (!draft || !config || !confidence) return;
    if (kind !== "print" && !canFormallyExport) return;

    setExporting(kind);
    setError("");
    setMessage("");

    try {
      if (kind === "print") {
        await saveSnapshot("print");
        setScreenMode("print");
        window.setTimeout(() => {
          window.print();
          setScreenMode("screen");
        }, 100);
        setMessage("Print view opened for this submission pack.");
        return;
      }

      const payload = {
        draft,
        config,
        evidenceRows,
        confidence,
      };

      if (kind === "pdf") {
        const result = await buildAuthorityPackPdf(payload as any);
        const resolved = resolveBuilderResult(
          result,
          `${exportTitle.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "authority-pack"}.pdf`
        );

        if (!resolved) {
          throw new Error("PDF export did not return a usable file.");
        }

        if (resolved.kind === "blob") {
          downloadBlob(resolved.blob, resolved.filename);
        } else {
          window.open(resolved.url, "_blank", "noopener,noreferrer");
        }

        await saveSnapshot("pdf");
        setMessage("PDF export generated successfully. A record has been saved to export history.");
        return;
      }

      if (kind === "docx") {
        const result = await buildAuthorityPackDocx(payload as any);
        const resolved = resolveBuilderResult(
          result,
          `${exportTitle.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "authority-pack"}.docx`
        );

        if (!resolved) {
          throw new Error("DOCX export did not return a usable file.");
        }

        if (resolved.kind === "blob") {
          downloadBlob(resolved.blob, resolved.filename);
        } else {
          window.open(resolved.url, "_blank", "noopener,noreferrer");
        }

        await saveSnapshot("docx");
        setMessage("DOCX export generated successfully. A record has been saved to export history.");
      }
    } catch (err: any) {
      setError(String(err?.message || err || "Export failed."));
    } finally {
      setExporting("");
    }
  }

  if (loading) {
    return (
      <main style={S.page()}>
        <div style={S.pageInner()}>
          <section style={S.card()}>
            <div style={S.h1()}>Authority Export</div>
            <div style={S.body()}>Loading your submission pack…</div>
          </section>
        </div>
      </main>
    );
  }

  if (!draft || !config) {
    return (
      <main style={S.page()}>
        <div style={S.pageInner()}>
          <section style={S.card()}>
            <div style={S.h1()}>No authority pack ready for export</div>
            <div style={S.body()}>
              Open the Authority Pack Builder first, then return here when the pack
              has been shaped around a saved report draft.
            </div>

            <div style={{ height: 16 }} />

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link href="/reports/library" style={S.button(false)}>
                Report Library
              </Link>
              <Link href="/authority/readiness" style={S.button(false)}>
                Authority Readiness
              </Link>
              <Link href="/reports" style={S.button(true)}>
                Open Reports Builder
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const hideSidebarForPrint = screenMode === "print";

  return (
    <main style={S.page()}>
      <div style={S.stickyTop()}>
        <div style={S.topBar()}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <Link
              href="/family"
              style={{ ...S.mutedLink(), fontWeight: 900, color: "#0f172a" }}
            >
              EduDecks Family
            </Link>
            <span style={{ color: "#94a3b8" }}>/</span>
            <Link href={`/authority/pack-builder?draftId=${draft.id}`} style={S.mutedLink()}>
              Pack Builder
            </Link>
            <span style={{ color: "#94a3b8" }}>/</span>
            <span style={{ ...S.mutedLink(), color: "#0f172a" }}>Export</span>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setScreenMode((prev) => (prev === "screen" ? "print" : "screen"))}
              style={S.button(false)}
            >
              {screenMode === "print" ? "Screen View" : "Print View"}
            </button>
            <Link href={`/authority/pack-builder?draftId=${draft.id}`} style={S.button(false)}>
              Back to builder
            </Link>
            <Link href={`/authority/history?draftId=${draft.id}`} style={S.button(false)}>
              Export history
            </Link>
          </div>
        </div>
      </div>

      <div style={S.pageInner()}>
        {error ? (
          <div style={{ ...S.statCard("danger"), marginBottom: 18 }}>
            <div style={S.small()}>{error}</div>
          </div>
        ) : null}

        {message ? (
          <div style={{ ...S.statCard("success"), marginBottom: 18 }}>
            <div style={S.small()}>{message}</div>
          </div>
        ) : null}

        <section style={S.hero()}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0,1.25fr) minmax(320px,0.85fr)",
              gap: 24,
              alignItems: "start",
            }}
          >
            <div>
              <div style={S.label()}>Final submission review</div>
              <div style={S.display()}>Review your submission before export</div>
              <div style={S.body()}>
                This export is generated from the saved report draft and saved authority
                pack settings linked to this draft ID. Review the final confidence signal,
                structure, and evidence scope here before generating the submission file.
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                  marginTop: 16,
                }}
              >
                <span style={S.pill("primary")}>{childName(draft)}</span>
                <span style={S.pill("secondary")}>{modeLabel(draft.report_mode)}</span>
                <span style={S.pill("info")}>{periodLabel(draft.period_mode)}</span>
                <span style={S.pill("secondary")}>{marketLabel(config.jurisdiction)}</span>
                <span style={S.pill(status.tone)}>{status.label}</span>
              </div>

              <div style={{ height: 16 }} />

              <div
                style={{
                  ...S.softCard(),
                  border:
                    status.tone === "success"
                      ? "1px solid #bbf7d0"
                      : status.tone === "info"
                      ? "1px solid #bfdbfe"
                      : status.tone === "danger"
                      ? "1px solid #fecaca"
                      : "1px solid #e5e7eb",
                  background:
                    status.tone === "success"
                      ? "#f0fdf4"
                      : status.tone === "info"
                      ? "#eff6ff"
                      : status.tone === "danger"
                      ? "#fff1f2"
                      : "#f8fafc",
                }}
              >
                <div style={S.label()}>Export source status</div>
                <div style={S.body()}>{status.message}</div>
              </div>

              <div style={{ height: 16 }} />

              <div
                style={{
                  ...S.softCard(),
                  border: "1px solid #dbeafe",
                  background: "#eff6ff",
                }}
              >
                <div style={S.label()}>Reviewer impression</div>
                <div style={{ ...S.body(), color: "#1e3a8a" }}>{reviewerSummary}</div>
              </div>
            </div>

            <div style={S.card()}>
              <div style={S.label()}>Submission status</div>
              <div style={S.h1()}>{confidence?.score ?? 0}%</div>
              <div style={{ ...S.body(), marginBottom: 12 }}>
                {confidence ? confidenceBandLabel(confidence.band) : "Loading status"}
              </div>

              <div
                style={{
                  height: 10,
                  borderRadius: 999,
                  background: "#e2e8f0",
                  overflow: "hidden",
                  marginBottom: 14,
                }}
              >
                <div
                  style={{
                    width: `${confidence?.score ?? 0}%`,
                    height: "100%",
                    borderRadius: 999,
                    background:
                      confidence?.band === "ready"
                        ? "linear-gradient(90deg, #22c55e 0%, #16a34a 100%)"
                        : confidence?.band === "strong"
                        ? "linear-gradient(90deg, #60a5fa 0%, #2563eb 100%)"
                        : confidence?.band === "developing"
                        ? "linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)"
                        : "linear-gradient(90deg, #f87171 0%, #dc2626 100%)",
                  }}
                />
              </div>

              <div style={{ display: "grid", gap: 10 }}>
                <MiniStat label="Filtered evidence" value={String(evidenceRows.length)} />
                <MiniStat label="Included sections" value={String(includedSections.length)} />
                <MiniStat
                  label="Latest evidence"
                  value={latestEvidenceDate(evidenceRows)}
                />
                <MiniStat
                  label="Submission quality"
                  value={confidence ? confidenceBandLabel(confidence.band) : "—"}
                />
              </div>
            </div>
          </div>
        </section>

        <div style={{ height: 18 }} />

        <div
          ref={printRef}
          style={{
            ...(screenMode === "print"
              ? {
                  maxWidth: 860,
                  margin: "0 auto",
                }
              : {}),
          }}
        >
          <div
            style={
              hideSidebarForPrint
                ? { display: "grid", gap: 18 }
                : S.splitMain()
            }
          >
            <div style={{ display: "grid", gap: 18 }}>
              <section style={S.card()}>
                <div style={S.h2()}>This is what will be submitted</div>
                <div style={S.small()}>
                  The structure below reflects the exact saved pack configuration used for export.
                </div>

                <div style={{ height: 12 }} />

                <div style={{ display: "grid", gap: 10 }}>
                  <SummaryRow label="Pack title" value={exportTitle} />
                  <SummaryRow label="Child" value={childName(draft)} />
                  <SummaryRow label="Mode" value={modeLabel(draft.report_mode)} />
                  <SummaryRow label="Period" value={periodLabel(draft.period_mode)} />
                  <SummaryRow label="Market" value={marketLabel(config.jurisdiction)} />
                  <SummaryRow label="Report status" value={status.label} />
                  <SummaryRow
                    label="Sections"
                    value={
                      includedSections.length
                        ? includedSections.map(sectionLabel).join(", ")
                        : "No sections selected"
                    }
                  />
                  <SummaryRow
                    label="Evidence scope"
                    value={`${filteredEvidenceIds.length} filtered item${
                      filteredEvidenceIds.length === 1 ? "" : "s"
                    }`}
                  />
                </div>
              </section>

              <section style={S.card()}>
                <div style={S.h2()}>Final confidence gate</div>
                <div style={S.body()}>
                  {status.exportBlocked
                    ? "Formal export is blocked because this pack is tied to an archived report artifact."
                    : confidence?.band === "ready"
                    ? "This pack is presenting as submission ready. It has enough structure and evidence to export with confidence."
                    : confidence?.band === "strong"
                    ? "This pack is strong and exportable. One or two refinements could improve it, but it is already in a trustworthy position."
                    : confidence?.band === "developing"
                    ? "This pack is nearly ready, but still has a few areas to tighten before a formal export will feel fully calm and defensible."
                    : "This pack is not yet ready for formal export. It needs more structure or evidence before it will feel trustworthy."}
                </div>

                <div style={{ height: 14 }} />

                <div style={{ display: "grid", gap: 8 }}>
                  {(confidence?.checklist || []).map((item: any, i: number) => (
                    <div
                      key={`${item.label}-${i}`}
                      style={{
                        padding: "10px 12px",
                        borderRadius: 12,
                        background: item.passed ? "#ecfdf5" : "#fff7ed",
                        border: `1px solid ${item.passed ? "#a7f3d0" : "#fed7aa"}`,
                        color: item.passed ? "#166534" : "#9a3412",
                        fontSize: 13,
                        lineHeight: 1.5,
                        fontWeight: 700,
                      }}
                    >
                      {item.passed ? "✔" : "✖"} {item.label}
                    </div>
                  ))}
                </div>

                {confidence?.insights?.length ? (
                  <>
                    <div style={{ height: 14 }} />
                    <div style={S.softCard()}>
                      <div style={S.label()}>What to improve before export</div>
                      <div style={{ display: "grid", gap: 8 }}>
                        {confidence.insights.map((insight: string, i: number) => (
                          <div key={`${insight}-${i}`} style={S.small()}>
                            • {insight}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : null}
              </section>

              <section style={S.card()}>
                <div style={S.h2()}>Submission structure</div>
                <div style={S.body()}>{sectionImpact}</div>

                <div style={{ height: 12 }} />

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: 12,
                  }}
                >
                  {includedSections.length ? (
                    includedSections.map((section) => (
                      <div key={section} style={S.softCard()}>
                        <div style={S.h3()}>{sectionLabel(section)}</div>
                        <div style={S.small()}>
                          Included in this export pack.
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={S.softCard()}>
                      <div style={S.small()}>No sections are currently enabled.</div>
                    </div>
                  )}
                </div>
              </section>

              <section style={S.card()}>
                <div style={S.h2()}>Included evidence scope</div>
                <div style={S.small()}>
                  This is the evidence body that will feed the exported pack.
                </div>

                <div style={{ height: 12 }} />

                {!evidenceRows.length ? (
                  <div style={S.softCard()}>
                    <div style={S.body()}>
                      No filtered evidence is currently included in this export.
                    </div>
                    <div style={S.small()}>
                      Return to the pack builder and widen the evidence scope before exporting.
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: 10 }}>
                    {evidenceRows.slice(0, 8).map((row: any) => (
                      <div
                        key={row.id}
                        style={{
                          border: "1px solid #e5e7eb",
                          borderRadius: 12,
                          background: "#ffffff",
                          padding: 12,
                          display: "grid",
                          gap: 6,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 10,
                            alignItems: "center",
                            flexWrap: "wrap",
                          }}
                        >
                          <div
                            style={{
                              fontSize: 14,
                              fontWeight: 800,
                              color: "#0f172a",
                            }}
                          >
                            {safe(row.title) || "Evidence item"}
                          </div>

                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <span style={S.pill(row.role === "appendix" ? "secondary" : "primary")}>
                              {row.role === "appendix" ? "Appendix" : "Core"}
                            </span>
                            {row.required ? (
                              <span style={S.pill("warning")}>Required</span>
                            ) : null}
                          </div>
                        </div>

                        <div style={S.small()}>
                          {row.learningArea || row.learning_area || "General"} •{" "}
                          {shortDate(row.occurredOn || row.occurred_on)}
                        </div>

                        <div style={S.body()}>
                          {safe(row.summary) || "No summary text available."}
                        </div>
                      </div>
                    ))}

                    {evidenceRows.length > 8 ? (
                      <div style={S.small()}>
                        + {evidenceRows.length - 8} more evidence item
                        {evidenceRows.length - 8 === 1 ? "" : "s"} included.
                      </div>
                    ) : null}
                  </div>
                )}
              </section>
            </div>

            {!hideSidebarForPrint ? (
              <aside style={{ display: "grid", gap: 18 }}>
                <section style={S.card()}>
                  <div style={S.h2()}>Export actions</div>
                  <div style={S.body()}>
                    Generate the final submission pack in the format you need.
                  </div>

                  <div style={{ height: 12 }} />

                  <div style={{ display: "grid", gap: 10 }}>
                    <button
                      type="button"
                      onClick={() => void handleExport("pdf")}
                      disabled={Boolean(exporting) || !canFormallyExport}
                      style={{
                        ...S.button(true),
                        opacity: Boolean(exporting) || !canFormallyExport ? 0.7 : 1,
                        cursor: Boolean(exporting) || !canFormallyExport ? "not-allowed" : "pointer",
                      }}
                    >
                      {exporting === "pdf" ? "Exporting PDF…" : "Export Submission Pack (PDF)"}
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleExport("docx")}
                      disabled={Boolean(exporting) || !canFormallyExport}
                      style={{
                        ...S.button(false),
                        opacity: Boolean(exporting) || !canFormallyExport ? 0.7 : 1,
                        cursor: Boolean(exporting) || !canFormallyExport ? "not-allowed" : "pointer",
                      }}
                    >
                      {exporting === "docx" ? "Exporting DOCX…" : "Export DOCX"}
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleExport("print")}
                      disabled={Boolean(exporting)}
                      style={{
                        ...S.button(false),
                        opacity: Boolean(exporting) ? 0.7 : 1,
                        cursor: Boolean(exporting) ? "not-allowed" : "pointer",
                      }}
                    >
                      {exporting === "print" ? "Preparing Print…" : "Open Print View"}
                    </button>
                  </div>

                  <div style={{ height: 12 }} />

                  <div style={S.softCard()}>
                    <div style={S.label()}>Export record</div>
                    <div style={S.small()}>
                      Every successful export is saved to your authority export history for later review and re-download.
                    </div>
                  </div>

                  {!canFormallyExport ? (
                    <>
                      <div style={{ height: 12 }} />
                      <div
                        style={{
                          ...S.softCard(),
                          border: "1px solid #fed7aa",
                          background: "#fff7ed",
                        }}
                      >
                        <div style={S.small()}>
                          Formal PDF and DOCX export is held behind the final confidence gate until the pack feels stronger. You can still use print view, return to the builder, or keep refining the pack.
                        </div>
                      </div>
                    </>
                  ) : null}
                </section>

                <section style={S.card()}>
                  <div style={S.h2()}>Enhanced export tools</div>
                  <div style={S.body()}>
                    When presentation quality becomes more important, enhanced export tools can help you create cleaner branded PDFs and richer DOCX handoff formats.
                  </div>

                  <div style={{ height: 12 }} />

                  <UpgradeCard trigger="reports-guidance" variant="compact" />
                </section>

                <section style={S.card()}>
                  <div style={S.h2()}>Pack signals</div>

                  <div style={{ height: 12 }} />

                  <div style={{ display: "grid", gap: 10 }}>
                    <SignalRow label="Core anchors" value={String(selectedCoreCount(draft))} />
                    <SignalRow label="Appendix items" value={String(selectedAppendixCount(draft))} />
                    <SignalRow label="Required items" value={String(selectedRequiredCount(draft))} />
                    <SignalRow label="Filtered items" value={String(filteredEvidenceIds.length)} />
                  </div>
                </section>

                <section style={S.card()}>
                  <div style={S.h2()}>Best next move</div>
                  <div style={S.body()}>
                    {canFormallyExport
                      ? "You are in a strong position to export this pack now. If you want one final check, use print view first."
                      : "Return to the pack builder and strengthen the areas highlighted above before formal export."}
                  </div>

                  <div style={{ height: 14 }} />

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <Link href={`/authority/pack-builder?draftId=${draft.id}`} style={S.button(false)}>
                      Edit pack
                    </Link>
                    <Link href={`/reports/output?draftId=${draft.id}`} style={S.button(false)}>
                      Review output
                    </Link>
                    <Link href={`/authority/history?draftId=${draft.id}`} style={S.button(false)}>
                      History
                    </Link>
                  </div>
                </section>

                <section style={S.card()}>
                  <div style={S.h2()}>Saved object reference</div>
                  <SummaryRow label="Draft ID" value={draft.id} mono />
                </section>
              </aside>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}

function SummaryRow({
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
        display: "grid",
        gridTemplateColumns: "110px minmax(0,1fr)",
        gap: 10,
        alignItems: "start",
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: 1.05,
          textTransform: "uppercase",
          color: "#64748b",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 13,
          lineHeight: 1.5,
          color: "#334155",
          fontFamily: mono
            ? 'ui-monospace, SFMono-Regular, Menlo, monospace'
            : undefined,
          wordBreak: "break-word",
        }}
      >
        {value || "—"}
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        alignItems: "center",
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid #e5e7eb",
        background: "#f8fafc",
      }}
    >
      <span style={{ fontSize: 13, color: "#64748b" }}>{label}</span>
      <strong style={{ fontSize: 15, color: "#0f172a" }}>{value}</strong>
    </div>
  );
}

function SignalRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        alignItems: "center",
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid #e5e7eb",
        background: "#f8fafc",
      }}
    >
      <span style={{ fontSize: 13, color: "#334155" }}>{label}</span>
      <span
        style={{
          fontSize: 13,
          fontWeight: 800,
          color: "#0f172a",
        }}
      >
        {value}
      </span>
    </div>
  );
}
