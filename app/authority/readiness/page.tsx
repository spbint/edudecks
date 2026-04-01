"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  loadLatestReportDraft,
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
import { buildAuthorityConfidence } from "@/lib/authorityConfidence";
import { familyStyles as S } from "@/lib/theme/familyStyles";

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
  return {
    draftId: draft.id,
    jurisdiction: draft.preferred_market,
    title: `${draft.child_name} — Authority Pack`,
    includeSections: {
      cover: true,
      overview: true,
      coverage: true,
      evidence: true,
      appendix: draft.include_appendix,
      "action-plan": draft.include_action_plan,
      "weekly-plan": draft.include_weekly_plan,
      "readiness-notes": draft.include_readiness_notes,
      "parent-note": Boolean(draft.notes?.trim()),
    },
    selectedEvidenceIds: draft.selected_evidence_ids || [],
    emphasisNote: "",
    reviewerNote: "",
    includeOnlyRequiredEvidence: false,
    includeOnlyCoreEvidence: false,
    updatedAt: new Date().toISOString(),
  };
}

function confidenceBandTone(
  band: "ready" | "strong" | "developing" | "attention"
): "success" | "info" | "warning" | "danger" {
  if (band === "ready") return "success";
  if (band === "strong") return "info";
  if (band === "developing") return "warning";
  return "danger";
}

function confidenceBandLabel(
  band: "ready" | "strong" | "developing" | "attention"
) {
  if (band === "ready") return "Submission Ready";
  if (band === "strong") return "Strong";
  if (band === "developing") return "Developing";
  return "Needs Attention";
}

function readinessHeadline(
  band: "ready" | "strong" | "developing" | "attention"
) {
  if (band === "ready") return "This pack is in a strong submission posture";
  if (band === "strong") return "This pack is close and generally well-formed";
  if (band === "developing") {
    return "This pack is forming, but still needs strengthening";
  }
  return "This pack needs more work before it is authority-ready";
}

function readinessBody(
  band: "ready" | "strong" | "developing" | "attention"
) {
  if (band === "ready") {
    return "You have enough structure and evidence quality to treat this as a serious submission-ready pack. Review once more in Export, then download with confidence.";
  }
  if (band === "strong") {
    return "The pack is in a good position, but a small number of improvements may still make the submission calmer and stronger.";
  }
  if (band === "developing") {
    return "The pack has a foundation, but it still needs more representative evidence or better structural balance before export.";
  }
  return "The current builder state is too weak to rely on as a formal authority submission. Strengthen the pack before moving forward.";
}

function uniqueLearningAreas(rows: AuthorityEvidenceRow[]) {
  return Array.from(
    new Set(
      rows
        .map((row) => safe((row as any).learningArea || (row as any).learning_area))
        .filter(Boolean)
    )
  );
}

function latestEvidenceDate(rows: AuthorityEvidenceRow[]) {
  const values = rows
    .map((row) => safe((row as any).occurredOn || (row as any).occurred_on))
    .filter(Boolean)
    .sort((a, b) => (a > b ? -1 : 1));

  return values[0] ? shortDate(values[0]) : "—";
}

function confidenceNarrative(args: {
  score: number;
  band: "ready" | "strong" | "developing" | "attention";
  evidenceCount: number;
  areaCount: number;
  sectionCount: number;
}) {
  const { score, band, evidenceCount, areaCount, sectionCount } = args;

  if (band === "ready") {
    return "Your pack is balanced enough across learning areas, includes strong evidence anchors, and currently meets a confident submission threshold.";
  }
  if (band === "strong") {
    return `Your pack already has a solid submission base, but it still looks slightly light in one or two areas. With ${evidenceCount} evidence item${
      evidenceCount === 1 ? "" : "s"
    }, ${areaCount} coverage area${areaCount === 1 ? "" : "s"}, and ${sectionCount} active section${
      sectionCount === 1 ? "" : "s"
    }, it is close rather than complete.`;
  }
  if (band === "developing") {
    return "Your pack has enough structure to work from, but it still lacks the breadth, recency, or balance needed for a calm formal submission.";
  }
  return `At ${score}%, the current pack is still too weak to rely on. It needs stronger evidence depth, better coverage, and a clearer structure before export.`;
}

function improvementImpact(insight: string) {
  const text = safe(insight).toLowerCase();

  if (
    text.includes("coverage") ||
    text.includes("learning area") ||
    text.includes("broaden")
  ) {
    return "+6–10%";
  }
  if (
    text.includes("recent") ||
    text.includes("recency") ||
    text.includes("fresh")
  ) {
    return "+3–6%";
  }
  if (
    text.includes("required") ||
    text.includes("core") ||
    text.includes("anchor")
  ) {
    return "+4–8%";
  }
  if (
    text.includes("section") ||
    text.includes("overview") ||
    text.includes("readiness")
  ) {
    return "+2–5%";
  }
  return "+3–7%";
}

function sectionStrengthState(args: {
  key: AuthorityPackSectionKey;
  enabled: boolean;
  draft: ReportDraftRow;
  evidenceRows: AuthorityEvidenceRow[];
}) {
  const { key, enabled, draft, evidenceRows } = args;

  if (!enabled) {
    if (
      key === "overview" ||
      key === "coverage" ||
      key === "evidence" ||
      key === "readiness-notes"
    ) {
      return {
        label: "Missing but recommended",
        tone: "warning" as const,
        description: "This section is off, but it would usually strengthen submission clarity.",
      };
    }

    return {
      label: "Excluded",
      tone: "secondary" as const,
      description: "This section is not currently included in the authority pack.",
    };
  }

  if (key === "evidence") {
    if (evidenceRows.length >= 3) {
      return {
        label: "Included and strong",
        tone: "success" as const,
        description: "The evidence section has enough visible depth to support the pack well.",
      };
    }

    return {
      label: "Included but light",
      tone: "warning" as const,
      description: "The evidence section is on, but the current evidence depth still feels light.",
    };
  }

  if (key === "appendix") {
    if (selectedAppendixCount(draft) >= 1) {
      return {
        label: "Included and useful",
        tone: "info" as const,
        description: "Appendix support is available and adds depth beyond the core anchors.",
      };
    }

    return {
      label: "Included but empty",
      tone: "warning" as const,
      description: "Appendix is on, but there is little or no appendix evidence currently available.",
    };
  }

  if (key === "coverage") {
    if (uniqueLearningAreas(evidenceRows).length >= 4) {
      return {
        label: "Included and strong",
        tone: "success" as const,
        description: "Coverage breadth is visible and should support a more balanced submission.",
      };
    }

    return {
      label: "Included but narrow",
      tone: "warning" as const,
      description: "Coverage is visible, but the spread across learning areas still feels narrow.",
    };
  }

  return {
    label: "Included",
    tone: "info" as const,
    description: "This section is currently included in the authority pack.",
  };
}

function trendText(score: number, band: "ready" | "strong" | "developing" | "attention") {
  if (band === "ready") return `${Math.max(score - 8, 0)} → ${Math.max(score - 3, 0)} → ${score} ↑`;
  if (band === "strong") return `${Math.max(score - 10, 0)} → ${Math.max(score - 4, 0)} → ${score} ↑`;
  if (band === "developing") return `${Math.max(score - 6, 0)} → ${Math.max(score - 2, 0)} → ${score}`;
  return `${Math.max(score - 3, 0)} → ${Math.max(score - 1, 0)} → ${score}`;
}

function signalTone(passed: boolean) {
  return passed ? "success" : "warning";
}

export default function AuthorityReadinessPage() {
  const searchParams = useSearchParams();

  const [draft, setDraft] = useState<ReportDraftRow | null>(null);
  const [config, setConfig] = useState<AuthorityPackConfig | null>(null);
  const [evidenceRows, setEvidenceRows] = useState<AuthorityEvidenceRow[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      try {
        setLoading(true);
        setError("");

        const requestedDraftId = safe(searchParams.get("draftId"));
        const loadedDraft = requestedDraftId
          ? await loadReportDraftById(requestedDraftId)
          : await loadLatestReportDraft();

        if (!mounted) return;

        if (!loadedDraft) {
          setDraft(null);
          setConfig(null);
          setEvidenceRows([]);
          return;
        }

        const existingConfig =
          loadAuthorityPackConfig(loadedDraft.id) ||
          buildDefaultConfig(loadedDraft);

        const rows = await loadAuthorityEvidenceRows(
          loadedDraft,
          existingConfig
        );

        if (!mounted) return;

        setDraft(loadedDraft);
        setConfig(existingConfig);
        setEvidenceRows(rows);
      } catch (err: any) {
        if (!mounted) return;
        setError(
          String(err?.message || err || "Failed to load authority readiness.")
        );
      } finally {
        if (mounted) setLoading(false);
      }
    }

    hydrate();
    return () => {
      mounted = false;
    };
  }, [searchParams]);

  const filteredEvidenceIds = useMemo(() => {
    if (!draft || !config) return [];
    return getAuthorityFilteredEvidenceIds(draft, config);
  }, [draft, config]);

  const includedSections = useMemo(() => {
    if (!config) return [];
    return Object.entries(config.includeSections)
      .filter(([, enabled]) => enabled)
      .map(([key]) => key as AuthorityPackSectionKey);
  }, [config]);

  const confidence = useMemo(() => {
    if (!draft || !config) return null;
    return buildAuthorityConfidence(draft, config, evidenceRows);
  }, [draft, config, evidenceRows]);

  const areas = useMemo(() => uniqueLearningAreas(evidenceRows), [evidenceRows]);

  const readinessSignals = useMemo(() => {
    if (!draft || !config || !confidence) return [];

    return [
      {
        label: "Coverage",
        passed: areas.length >= 4,
        detail:
          areas.length >= 4
            ? "Breadth looks balanced enough"
            : "Coverage still feels narrow",
      },
      {
        label: "Evidence depth",
        passed: evidenceRows.length >= 3,
        detail:
          evidenceRows.length >= 3
            ? "Enough visible evidence anchors"
            : "Evidence count still feels light",
      },
      {
        label: "Structure",
        passed: includedSections.length >= 6,
        detail:
          includedSections.length >= 6
            ? "Pack structure is strong"
            : "More structure would help",
      },
      {
        label: "Recency",
        passed: confidence.checklist.some(
          (item) =>
            safe(item.label).toLowerCase().includes("recent evidence") && item.passed
        ),
        detail:
          confidence.checklist.some(
            (item) =>
              safe(item.label).toLowerCase().includes("recent evidence") && item.passed
          )
            ? "Recent evidence is present"
            : "Recent evidence is still weak",
      },
    ];
  }, [draft, config, confidence, areas.length, evidenceRows.length, includedSections.length]);

  if (loading) {
    return (
      <main style={S.page()}>
        <div style={S.pageInner()}>
          <section style={S.card()}>
            <div style={S.h1()}>Authority Mission Control</div>
            <div style={S.body()}>Loading readiness review…</div>
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
            <div style={S.h1()}>No authority pack source found</div>
            <div style={S.body()}>
              Open the Authority Pack Builder from a saved report draft first.
            </div>
            <div style={{ height: 14 }} />
            <Link href="/authority/pack-builder" style={S.button(true)}>
              Go to pack builder
            </Link>
          </section>
        </div>
      </main>
    );
  }

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
              href="/authority"
              style={{ ...S.mutedLink(), fontWeight: 900, color: "#0f172a" }}
            >
              Authority
            </Link>
            <span style={{ color: "#94a3b8" }}>/</span>
            <span style={{ ...S.mutedLink(), color: "#0f172a" }}>
              Readiness
            </span>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link
              href={`/authority/pack-builder?draftId=${draft.id}`}
              style={S.button(false)}
            >
              Open builder
            </Link>
            <Link
              href={`/authority/export?draftId=${draft.id}`}
              style={S.button(true)}
            >
              Open export
            </Link>
            <Link href="/authority/history" style={S.button(false)}>
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

        <section
          style={{
            ...S.hero(),
            padding: 20,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0,1.25fr) 300px",
              gap: 20,
              alignItems: "stretch",
            }}
          >
            <div
              style={{
                display: "grid",
                gap: 14,
              }}
            >
              <div style={S.label()}>Authority Mission Control</div>

              <div
                style={{
                  fontSize: 40,
                  lineHeight: 1,
                  fontWeight: 900,
                  color: "#0f172a",
                  letterSpacing: -1,
                }}
              >
                {confidence ? `${confidence.score}%` : "—"}
              </div>

              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: "#0f172a",
                }}
              >
                {confidence ? confidenceBandLabel(confidence.band) : "Readiness pending"}
              </div>

              <div style={S.body()}>
                {confidence
                  ? readinessBody(confidence.band)
                  : "This page checks the current builder state and evidence scope before you move into export."}
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <span style={S.pill("primary")}>{draft.child_name}</span>
                <span style={S.pill("secondary")}>
                  {modeLabel(draft.report_mode)}
                </span>
                <span style={S.pill("info")}>
                  {marketLabel(config.jurisdiction)}
                </span>
                {confidence ? (
                  <span style={S.pill(confidenceBandTone(confidence.band))}>
                    {readinessHeadline(confidence.band)}
                  </span>
                ) : null}
              </div>

              {confidence ? (
                <div
                  style={{
                    ...S.softCard(),
                    border: "1px solid #dbeafe",
                    background: "#eff6ff",
                  }}
                >
                  <div style={S.label()}>Why this score</div>
                  <div style={S.body()}>
                    {confidenceNarrative({
                      score: confidence.score,
                      band: confidence.band,
                      evidenceCount: evidenceRows.length,
                      areaCount: areas.length,
                      sectionCount: includedSections.length,
                    })}
                  </div>
                </div>
              ) : null}
            </div>

            <div
              style={{
                borderRadius: 20,
                padding: 20,
                background: confidence
                  ? confidence.band === "ready"
                    ? "#ecfdf5"
                    : confidence.band === "strong"
                    ? "#ecfeff"
                    : confidence.band === "developing"
                    ? "#fff7ed"
                    : "#fff1f2"
                  : "#ffffff",
                border: "1px solid #e5e7eb",
                display: "grid",
                alignContent: "start",
                gap: 10,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: 44,
                  lineHeight: 1,
                  fontWeight: 900,
                  color: "#0f172a",
                }}
              >
                {confidence ? `${confidence.score}%` : "—"}
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: "#475569",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                Authority Readiness
              </div>

              <div
                style={{
                  marginTop: 6,
                }}
              >
                <div
                  style={{
                    height: 10,
                    borderRadius: 999,
                    background: "#e5e7eb",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${confidence?.score ?? 0}%`,
                      height: "100%",
                      borderRadius: 999,
                      background:
                        confidence?.band === "ready"
                          ? "#16a34a"
                          : confidence?.band === "strong"
                          ? "#2563eb"
                          : confidence?.band === "developing"
                          ? "#f59e0b"
                          : "#dc2626",
                    }}
                  />
                </div>
              </div>

              <div style={S.small()}>
                {confidence ? readinessHeadline(confidence.band) : "Review pending"}
              </div>

              <div style={S.small()}>
                Last updated {shortDate(config.updatedAt)}
              </div>
            </div>
          </div>

          {readinessSignals.length ? (
            <>
              <div style={{ height: 16 }} />

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                {readinessSignals.map((signal) => (
                  <div
                    key={signal.label}
                    style={{
                      border: `1px solid ${
                        signal.passed ? "#bbf7d0" : "#fed7aa"
                      }`,
                      background: signal.passed ? "#f0fdf4" : "#fff7ed",
                      borderRadius: 999,
                      padding: "8px 12px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span style={S.pill(signalTone(signal.passed))}>
                      {signal.passed ? "OK" : "Risk"}
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#334155",
                      }}
                    >
                      {signal.label}: {signal.detail}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </section>

        <div style={{ height: 18 }} />

        <div style={S.splitMain()}>
          <div style={{ display: "grid", gap: 18 }}>
            {confidence ? (
              <section style={S.card()}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(0,1.15fr) 240px",
                    gap: 16,
                    alignItems: "start",
                  }}
                >
                  <div>
                    <div style={S.h2()}>Readiness checklist</div>
                    <div style={S.small()}>
                      The decision engine below shows what is already supporting the pack and what still needs work.
                    </div>

                    <div style={{ height: 12 }} />

                    <div style={{ display: "grid", gap: 8 }}>
                      {confidence.checklist.map((item, i) => (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "10px 12px",
                            borderRadius: 12,
                            border: "1px solid #e5e7eb",
                            background: item.passed ? "#ecfdf5" : "#fff7ed",
                            color: item.passed ? "#166534" : "#9a3412",
                            fontSize: 13,
                            fontWeight: 700,
                          }}
                        >
                          <span>{item.passed ? "✔" : "✖"}</span>
                          <span>{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={S.softCard()}>
                    <div style={S.label()}>Momentum</div>
                    <div
                      style={{
                        fontSize: 22,
                        fontWeight: 900,
                        color: "#0f172a",
                        marginBottom: 8,
                      }}
                    >
                      {trendText(confidence.score, confidence.band)}
                    </div>
                    <div style={S.small()}>
                      This is a lightweight readiness trend view for now. Later it can draw directly from export history snapshots.
                    </div>
                  </div>
                </div>

                {confidence.insights.length ? (
                  <>
                    <div style={{ height: 16 }} />
                    <div style={S.h2()}>Improvement impact</div>
                    <div style={S.small()}>
                      These are the next strongest moves if you want to lift submission confidence before export.
                    </div>

                    <div style={{ height: 12 }} />

                    <div style={{ display: "grid", gap: 10 }}>
                      {confidence.insights.map((insight, i) => (
                        <div
                          key={i}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "minmax(0,1fr) 96px",
                            gap: 12,
                            alignItems: "center",
                            border: "1px solid #e5e7eb",
                            borderRadius: 14,
                            background: "#f8fafc",
                            padding: 12,
                          }}
                        >
                          <div
                            style={{
                              fontSize: 13,
                              lineHeight: 1.55,
                              color: "#334155",
                            }}
                          >
                            • {insight}
                          </div>
                          <div
                            style={{
                              justifySelf: "end",
                            }}
                          >
                            <span style={S.pill("info")}>
                              {improvementImpact(insight)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : null}
              </section>
            ) : null}

            <section style={S.card()}>
              <div style={S.h2()}>Pack composition</div>
              <div style={S.small()}>
                This tells you how the pack is built right now, before export.
              </div>

              <div style={{ height: 12 }} />

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 12,
                }}
              >
                <MetricCard
                  title="Core evidence"
                  value={String(selectedCoreCount(draft))}
                  tone="info"
                  text="The main evidence anchors currently included."
                />
                <MetricCard
                  title="Appendix evidence"
                  value={String(selectedAppendixCount(draft))}
                  tone="secondary"
                  text="Supporting evidence available beyond the core anchors."
                />
                <MetricCard
                  title="Required marked"
                  value={String(selectedRequiredCount(draft))}
                  tone="success"
                  text="Evidence explicitly marked as required in the current report selection."
                />
                <MetricCard
                  title="Filtered ids"
                  value={String(filteredEvidenceIds.length)}
                  tone="warning"
                  text="Evidence items included after builder filters are applied."
                />
              </div>
            </section>

            <section style={S.card()}>
              <div style={S.h2()}>Section readiness</div>
              <div style={S.small()}>
                This tells you whether each section is helping, weak, or missing.
              </div>

              <div style={{ height: 12 }} />

              <div style={{ display: "grid", gap: 10 }}>
                {Object.entries(config.includeSections).map(([key, enabled]) => {
                  const meta = sectionStrengthState({
                    key: key as AuthorityPackSectionKey,
                    enabled,
                    draft,
                    evidenceRows,
                  });

                  return (
                    <div
                      key={key}
                      style={{
                        border: `1px solid ${
                          meta.tone === "success"
                            ? "#bbf7d0"
                            : meta.tone === "warning"
                            ? "#fed7aa"
                            : meta.tone === "info"
                            ? "#bfdbfe"
                            : "#e5e7eb"
                        }`,
                        background:
                          meta.tone === "success"
                            ? "#f0fdf4"
                            : meta.tone === "warning"
                            ? "#fff7ed"
                            : meta.tone === "info"
                            ? "#eff6ff"
                            : "#ffffff",
                        borderRadius: 14,
                        padding: 14,
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        alignItems: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={S.h3()}>
                          {sectionLabel(key as AuthorityPackSectionKey)}
                        </div>
                        <div style={S.small()}>{meta.description}</div>
                      </div>

                      <span style={S.pill(meta.tone)}>
                        {meta.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>

            <section style={S.card()}>
              <div style={S.h2()}>Evidence coverage snapshot</div>
              <div style={S.small()}>
                This is the current visible evidence body that will shape readiness.
              </div>

              <div style={{ height: 12 }} />

              {evidenceRows.length ? (
                <div style={{ display: "grid", gap: 12 }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "minmax(0,1fr) minmax(220px,0.55fr)",
                      gap: 12,
                    }}
                  >
                    <div style={S.softCard()}>
                      <div style={S.label()}>Learning areas represented</div>
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          flexWrap: "wrap",
                          marginTop: 8,
                        }}
                      >
                        {areas.map((area) => (
                          <span key={area} style={S.pill("primary")}>
                            {area}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div style={S.softCard()}>
                      <div style={S.label()}>Most recent evidence</div>
                      <div style={S.body()}>{latestEvidenceDate(evidenceRows)}</div>
                    </div>
                  </div>

                  <div style={{ display: "grid", gap: 10 }}>
                    {evidenceRows.slice(0, 6).map((row) => (
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
                            {safe((row as any).title) || "Evidence item"}
                          </div>

                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <span
                              style={S.pill(
                                row.role === "appendix" ? "secondary" : "info"
                              )}
                            >
                              {row.role === "appendix" ? "Appendix" : "Core"}
                            </span>
                            {row.required ? (
                              <span style={S.pill("success")}>Required</span>
                            ) : null}
                          </div>
                        </div>

                        <div style={S.small()}>
                          {safe((row as any).learningArea || (row as any).learning_area)} •{" "}
                          {shortDate(safe((row as any).occurredOn || (row as any).occurred_on))}
                        </div>

                        <div style={S.body()}>
                          {safe(row.summary) || "No summary text available."}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={S.softCard()}>
                  <div style={S.body()}>
                    No evidence is currently included in the builder scope.
                  </div>
                  <div style={S.small()}>
                    Return to the builder or report to strengthen the pack first.
                  </div>
                </div>
              )}
            </section>
          </div>

          <aside style={{ display: "grid", gap: 18 }}>
            <section style={S.card()}>
              <div style={S.h2()}>Pack source summary</div>
              <div style={{ display: "grid", gap: 10 }}>
                <SummaryRow label="Title" value={config.title} />
                <SummaryRow label="Child" value={draft.child_name} />
                <SummaryRow label="Mode" value={modeLabel(draft.report_mode)} />
                <SummaryRow
                  label="Period"
                  value={periodLabel(draft.period_mode)}
                />
                <SummaryRow
                  label="Market"
                  value={marketLabel(config.jurisdiction)}
                />
                <SummaryRow label="Updated" value={shortDate(config.updatedAt)} />
              </div>
            </section>

            <section style={S.card()}>
              <div style={S.h2()}>Snapshot</div>
              <div style={{ display: "grid", gap: 10 }}>
                <MiniStat
                  label="Evidence in scope"
                  value={String(evidenceRows.length)}
                />
                <MiniStat label="Coverage areas" value={String(areas.length)} />
                <MiniStat
                  label="Sections active"
                  value={String(includedSections.length)}
                />
                <MiniStat
                  label="Readiness band"
                  value={
                    confidence ? confidenceBandLabel(confidence.band) : "—"
                  }
                />
              </div>
            </section>

            <section style={S.card()}>
              <div style={S.h2()}>What this page is for</div>
              <div style={S.body()}>
                Authority Mission Control is the calmer diagnostic layer. It helps you decide whether the current pack is strong enough to move into export, what still needs work, and which improvements are most worth making first.
              </div>
            </section>

            <section style={S.card()}>
              <div style={S.h2()}>Best next move</div>
              <div style={S.body()}>
                {confidence
                  ? confidence.score >= 80
                    ? "You can move to Export with confidence and treat that page as the final submission gate."
                    : confidence.score >= 60
                    ? "Open the Pack Builder to tighten the weaker signals, then return here or continue into Export."
                    : "Go back to the Pack Builder and strengthen the evidence scope and structure before exporting."
                  : "Open the Pack Builder to shape the authority pack first."}
              </div>

              <div style={{ height: 14 }} />

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Link
                  href={`/authority/pack-builder?draftId=${draft.id}`}
                  style={S.button(false)}
                >
                  Open builder
                </Link>
                <Link
                  href={`/authority/export?draftId=${draft.id}`}
                  style={S.button(true)}
                >
                  Open export
                </Link>
                <Link href="/authority/history" style={S.button(false)}>
                  View history
                </Link>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
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
      <strong style={{ fontSize: 16, color: "#0f172a" }}>{value}</strong>
    </div>
  );
}

function MetricCard({
  title,
  value,
  text,
  tone,
}: {
  title: string;
  value: string;
  text: string;
  tone: "info" | "secondary" | "success" | "warning";
}) {
  const tones: Record<
    "info" | "secondary" | "success" | "warning",
    { bg: string; bd: string; fg: string }
  > = {
    info: {
      bg: "#ecfeff",
      bd: "#a5f3fc",
      fg: "#0c4a6e",
    },
    secondary: {
      bg: "#f5f3ff",
      bd: "#ddd6fe",
      fg: "#6d28d9",
    },
    success: {
      bg: "#ecfdf5",
      bd: "#a7f3d0",
      fg: "#166534",
    },
    warning: {
      bg: "#fff7ed",
      bd: "#fed7aa",
      fg: "#9a3412",
    },
  };

  const c = tones[tone];

  return (
    <div
      style={{
        background: c.bg,
        border: `1px solid ${c.bd}`,
        borderRadius: 16,
        padding: 16,
        display: "grid",
        gap: 8,
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 800, color: c.fg }}>
        {title}
      </div>
      <div style={{ fontSize: 28, fontWeight: 900, color: "#0f172a" }}>
        {value}
      </div>
      <div style={{ fontSize: 13, lineHeight: 1.5, color: "#334155" }}>
        {text}
      </div>
    </div>
  );
}