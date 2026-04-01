"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import UpgradeCard from "@/app/components/premium/UpgradeCard";
import {
  loadReportDraftById,
  marketLabel,
  modeLabel,
  periodLabel,
  type ReportDraftRow,
} from "@/lib/reportDrafts";
import { familyStyles as S } from "@/lib/theme/familyStyles";

type EvidenceRow = {
  id: string;
  student_id?: string | null;
  class_id?: string | null;
  title?: string | null;
  summary?: string | null;
  body?: string | null;
  note?: string | null;
  learning_area?: string | null;
  evidence_type?: string | null;
  occurred_on?: string | null;
  created_at?: string | null;
  attachment_urls?: string[] | string | null;
  image_url?: string | null;
  photo_url?: string | null;
  file_url?: string | null;
  audio_url?: string | null;
  is_deleted?: boolean | null;
  [k: string]: any;
};

function safe(v: unknown) {
  return String(v ?? "").trim();
}

function clip(v: string | null | undefined, max = 220) {
  const s = safe(v);
  if (!s) return "";
  return s.length > max ? `${s.slice(0, max)}…` : s;
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

function guessArea(raw: string | null | undefined) {
  const x = safe(raw).toLowerCase();

  if (
    x.includes("liter") ||
    x.includes("reading") ||
    x.includes("writing") ||
    x.includes("english")
  ) {
    return "Literacy";
  }
  if (x.includes("math") || x.includes("num")) return "Numeracy";
  if (x.includes("science")) return "Science";
  if (
    x.includes("history") ||
    x.includes("geography") ||
    x.includes("human") ||
    x.includes("hass")
  ) {
    return "Humanities";
  }
  if (x.includes("art") || x.includes("music") || x.includes("drama")) {
    return "The Arts";
  }
  if (
    x.includes("health") ||
    x.includes("physical") ||
    x.includes("pe") ||
    x.includes("wellbeing")
  ) {
    return "Health & PE";
  }
  if (x.includes("tech")) return "Technologies";
  if (x.includes("language")) return "Languages";
  return "Other";
}

function evidenceText(row: EvidenceRow) {
  return safe(row.summary || row.body || row.note);
}

function hasMedia(row: EvidenceRow) {
  return Boolean(
    safe(row.image_url) ||
      safe(row.photo_url) ||
      safe(row.file_url) ||
      safe(row.audio_url) ||
      (Array.isArray(row.attachment_urls) && row.attachment_urls.length > 0) ||
      safe(row.attachment_urls)
  );
}

function evidenceStrength(row: EvidenceRow) {
  let score = 0;
  const text = evidenceText(row);

  if (safe(row.title)) score += 2;
  if (safe(row.learning_area)) score += 2;
  if (safe(row.evidence_type)) score += 1;
  if (text.length >= 180) score += 4;
  else if (text.length >= 90) score += 3;
  else if (text.length >= 35) score += 2;
  else if (text.length > 0) score += 1;
  if (hasMedia(row)) score += 2;

  return score;
}

function strengthTone(score: number): "success" | "info" | "warning" {
  if (score >= 8) return "success";
  if (score >= 5) return "info";
  return "warning";
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

function outputReadinessScore(draft: ReportDraftRow, evidenceRows: EvidenceRow[]) {
  let score = 24;

  if (safe(draft.child_name)) score += 10;
  if (draft.selected_areas.length >= 4) score += 16;
  if (draft.selected_evidence_ids.length >= 4) score += 22;
  else if (draft.selected_evidence_ids.length >= 2) score += 14;
  else if (draft.selected_evidence_ids.length >= 1) score += 8;

  if (selectedCoreCount(draft) >= 2) score += 7;
  if (selectedAppendixCount(draft) >= 1) score += 4;
  if (selectedRequiredCount(draft) >= 1) score += 5;
  if (draft.include_action_plan) score += 4;
  if (draft.include_weekly_plan) score += 4;
  if (draft.include_readiness_notes) score += 6;
  if (safe(draft.notes).length >= 20) score += 6;
  if (safe(draft.report_mode).toLowerCase() === "authority-ready") score += 4;

  const representedAreas = new Set(
    evidenceRows.map((row) => guessArea(row.learning_area)).filter((x) => x !== "Other")
  ).size;
  if (representedAreas >= 4) score += 6;

  return Math.min(score, 100);
}

function readinessTone(
  score: number
): "success" | "info" | "warning" | "danger" {
  if (score >= 80) return "success";
  if (score >= 60) return "info";
  if (score >= 40) return "warning";
  return "danger";
}

function readinessLabel(score: number) {
  if (score >= 80) return "Strong";
  if (score >= 60) return "Good";
  if (score >= 40) return "Developing";
  return "Needs work";
}

function isMissingRelationOrColumn(err: any) {
  const msg = String(err?.message ?? "").toLowerCase();
  return (
    msg.includes("does not exist") &&
    (msg.includes("relation") || msg.includes("column"))
  );
}

function joinNatural(items: string[]) {
  if (!items.length) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

async function loadEvidence(): Promise<EvidenceRow[]> {
  const variants = [
    "id,student_id,class_id,title,summary,body,note,learning_area,evidence_type,occurred_on,created_at,attachment_urls,image_url,photo_url,file_url,audio_url,is_deleted",
    "id,student_id,class_id,title,summary,body,note,learning_area,occurred_on,created_at,attachment_urls,image_url,photo_url,file_url,is_deleted",
    "id,student_id,class_id,title,summary,note,learning_area,occurred_on,created_at,is_deleted",
  ];

  let lastErr: any = null;

  for (const select of variants) {
    const res = await supabase
      .from("evidence_entries")
      .select(select)
      .order("occurred_on", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (!res.error) {
      return ((res.data || []) as EvidenceRow[]).filter((x) => !x.is_deleted);
    }

    lastErr = res.error;
    if (!isMissingRelationOrColumn(res.error)) break;
  }

  if (lastErr) throw lastErr;
  return [];
}

export default function ReportsOutputPage() {
  const searchParams = useSearchParams();

  const [draft, setDraft] = useState<ReportDraftRow | null>(null);
  const [evidence, setEvidence] = useState<EvidenceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      try {
        setLoading(true);
        setError("");

        const requestedDraftId = safe(searchParams.get("draftId"));

        if (!requestedDraftId) {
          throw new Error(
            "No report draft was provided. Open this page from the builder or library using a saved draft."
          );
        }

        const [loadedDraft, evidenceRows] = await Promise.all([
          loadReportDraftById(requestedDraftId),
          loadEvidence(),
        ]);

        if (!mounted) return;

        if (!loadedDraft) {
          throw new Error(
            "That saved report draft could not be found. It may have been removed or you may no longer have access to it."
          );
        }

        setDraft(loadedDraft);
        setEvidence(evidenceRows);
      } catch (err: any) {
        if (!mounted) return;
        setError(String(err?.message || err || "Failed to load report output."));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    hydrate();
    return () => {
      mounted = false;
    };
  }, [searchParams]);

  const selectedEvidenceRows = useMemo(() => {
    if (!draft) return [];
    const ids = new Set(draft.selected_evidence_ids);
    return evidence
      .filter((row) => ids.has(row.id))
      .sort((a, b) => {
        const aRole = draft.selection_meta?.[a.id]?.role === "appendix" ? 1 : 0;
        const bRole = draft.selection_meta?.[b.id]?.role === "appendix" ? 1 : 0;
        if (aRole !== bRole) return aRole - bRole;

        const aa = safe(a.occurred_on || a.created_at);
        const bb = safe(b.occurred_on || b.created_at);
        if (aa === bb) return 0;
        return aa > bb ? -1 : 1;
      });
  }, [draft, evidence]);

  const representedAreas = useMemo(() => {
    return Array.from(
      new Set(
        selectedEvidenceRows
          .map((row) => guessArea(row.learning_area))
          .filter((x) => x !== "Other")
      )
    );
  }, [selectedEvidenceRows]);

  const readiness = useMemo(() => {
    if (!draft) return 0;
    return outputReadinessScore(draft, selectedEvidenceRows);
  }, [draft, selectedEvidenceRows]);

  const strengths = useMemo(() => {
    if (!draft) return [];
    const items: string[] = [];

    if (selectedCoreCount(draft) >= 2) {
      items.push("The report has clear core evidence anchors.");
    }
    if (representedAreas.length >= 4) {
      items.push("Coverage is reasonably balanced across learning areas.");
    }
    if (safe(draft.notes).length >= 20) {
      items.push("The draft includes a useful parent-facing note.");
    }
    if (draft.include_action_plan) {
      items.push("An action-plan section is included for next steps.");
    }
    if (safe(draft.report_mode).toLowerCase() === "authority-ready") {
      items.push("The report is already framed for a stronger authority posture.");
    }

    return items.slice(0, 4);
  }, [draft, representedAreas]);

  const watchouts = useMemo(() => {
    if (!draft) return [];
    const items: string[] = [];

    if (draft.selected_evidence_ids.length === 0) {
      items.push("No evidence has been selected yet.");
    } else if (draft.selected_evidence_ids.length < 3) {
      items.push("The evidence set is still quite light.");
    }

    if (representedAreas.length < 3) {
      items.push("Area coverage is still narrow.");
    }

    if (!safe(draft.notes)) {
      items.push("There is no parent note yet.");
    }

    if (
      safe(draft.report_mode).toLowerCase() === "authority-ready" &&
      !draft.include_readiness_notes
    ) {
      items.push("Authority mode is active without readiness notes.");
    }

    return items.slice(0, 4);
  }, [draft, representedAreas]);

  const nextMove = useMemo(() => {
    if (!draft) return "Open the reports builder to create or load a draft.";
    if (draft.selected_evidence_ids.length === 0) {
      return "Return to the builder and select evidence first.";
    }
    if (safe(draft.report_mode).toLowerCase() === "authority-ready") {
      return "Move into the Authority Pack Builder to shape the formal submission.";
    }
    if (readiness < 60) {
      return "Return to the builder and strengthen evidence balance before exporting.";
    }
    return "This draft is in a strong position to continue to authority or remain as a family-facing report.";
  }, [draft, readiness]);

  const areaCounts = useMemo(() => {
    const map = new Map<string, number>();
    selectedEvidenceRows.forEach((row) => {
      const area = guessArea(row.learning_area);
      if (area === "Other") return;
      map.set(area, (map.get(area) || 0) + 1);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([area, count]) => ({ area, count }));
  }, [selectedEvidenceRows]);

  const narrative = useMemo(() => {
    if (!draft) return "";
    const child = safe(draft.child_name) || "The learner";
    const mode = safe(draft.report_mode).toLowerCase();
    const strongestAreas = areaCounts.slice(0, 2).map((x) => x.area);
    const weakerAreas = draft.selected_areas.filter(
      (area) => !representedAreas.includes(area)
    );

    const intro =
      mode === "authority-ready"
        ? `${child} has demonstrated progress across the selected learning areas represented in this saved report object.`
        : `${child} has shown meaningful progress across the selected learning areas represented in this saved report object.`;

    const strengthsLine = strongestAreas.length
      ? mode === "authority-ready"
        ? ` The strongest current evidence is in ${joinNatural(strongestAreas)}, where the selected pieces indicate growing consistency and clearer evidence anchors.`
        : ` The strongest current evidence is in ${joinNatural(strongestAreas)}, where the selected pieces show growing confidence and clearer evidence anchors.`
      : "";

    const balanceLine =
      representedAreas.length >= 4
        ? mode === "authority-ready"
          ? " Coverage is reasonably balanced across the included areas, supporting a stronger reporting posture."
          : " Coverage is reasonably balanced across the included areas, giving this report a calm and trustworthy feel."
        : representedAreas.length >= 2
        ? " Coverage is beginning to take shape, although the report would become stronger with broader evidence across more areas."
        : " Coverage is still fairly narrow, so the report would benefit from additional evidence before being treated as fully representative.";

    const watchLine = weakerAreas.length
      ? ` The main area to strengthen next is ${weakerAreas[0]}, which currently has limited or no selected evidence in this draft.`
      : " No major curriculum gap is obvious from the currently selected areas.";

    return `${intro}${strengthsLine}${balanceLine}${watchLine}`;
  }, [draft, areaCounts, representedAreas]);

  const strengthsNarrative = useMemo(() => {
    if (!draft) return "";
    const mode = safe(draft.report_mode).toLowerCase();
    const strongestAreas = areaCounts.slice(0, 2).map((x) => x.area);

    if (!strongestAreas.length) {
      return "Clear strengths are not yet strongly represented in the selected evidence set.";
    }

    return mode === "authority-ready"
      ? `Current strengths are most visible in ${joinNatural(
          strongestAreas
        )}, where the selected evidence provides the clearest reporting anchors.`
      : `Current strengths are most visible in ${joinNatural(
          strongestAreas
        )}, where the selected evidence gives the clearest picture of progress and confidence.`;
  }, [draft, areaCounts]);

  const growthNarrative = useMemo(() => {
    if (!draft) return "";
    const missingAreas = draft.selected_areas.filter(
      (area) => !representedAreas.includes(area)
    );

    if (missingAreas.length) {
      return `The clearest area for further development is ${missingAreas[0]}, where the current draft would benefit from stronger or more representative evidence.`;
    }

    if (representedAreas.length < 4) {
      return "The next stage of growth is to widen the evidence base so the report feels more balanced across the selected curriculum areas.";
    }

    return "The next stage of growth is to continue deepening the quality of evidence so the strongest areas remain well supported over time.";
  }, [draft, representedAreas]);

  const nextFocusNarrative = useMemo(() => {
    if (!draft) return "";
    if (safe(draft.report_mode).toLowerCase() === "authority-ready") {
      return "Before formal submission, make sure the evidence balance, parent note, and readiness notes fully reflect the intended authority posture.";
    }
    return "The strongest next move is to continue capturing representative learning moments so this report remains balanced, current, and easy to trust.";
  }, [draft]);

  const evidenceInsights = useMemo(() => {
    return selectedEvidenceRows.slice(0, 3).map((row) => {
      const area = guessArea(row.learning_area);
      const text = evidenceText(row);
      const strength = evidenceStrength(row);
      const metaRole = draft?.selection_meta?.[row.id]?.role === "appendix" ? "appendix" : "core";

      let insight = "";
      if (area === "Literacy") {
        insight = "This evidence suggests growing literacy development and increasing ability to communicate understanding.";
      } else if (area === "Numeracy") {
        insight = "This evidence suggests developing mathematical understanding and increasing confidence in applying number-related skills.";
      } else if (area === "Science") {
        insight = "This evidence suggests growing scientific thinking, observation, and explanation.";
      } else if (area === "Humanities") {
        insight = "This evidence suggests growing understanding of people, place, context, and interpretation.";
      } else if (area === "The Arts") {
        insight = "This evidence suggests growing creativity, expression, and intentional skill development.";
      } else if (area === "Health & PE") {
        insight = "This evidence suggests growing physical confidence, wellbeing awareness, or participation.";
      } else if (area === "Technologies") {
        insight = "This evidence suggests growing design, digital, or practical problem-solving capability.";
      } else if (area === "Languages") {
        insight = "This evidence suggests growing language familiarity, expression, and communication confidence.";
      } else {
        insight = "This evidence adds broader support to the overall learner picture.";
      }

      if (strength >= 8) {
        insight += " It is one of the stronger anchors in this report.";
      } else if (metaRole === "appendix") {
        insight += " It currently works best as supporting evidence rather than a main anchor.";
      }

      return {
        id: row.id,
        title: safe(row.title) || "Untitled evidence",
        area,
        date: shortDate(row.occurred_on || row.created_at),
        excerpt: clip(text, 180) || "No written summary yet.",
        insight,
      };
    });
  }, [selectedEvidenceRows, draft]);

  const submissionReadinessItems = useMemo(() => {
    if (!draft) return [];

    return [
      {
        label: "Core evidence anchors are in place",
        ok: selectedCoreCount(draft) >= 2,
      },
      {
        label: "Coverage feels reasonably balanced",
        ok: representedAreas.length >= 4,
      },
      {
        label: "The draft includes a parent-facing note",
        ok: safe(draft.notes).length >= 20,
      },
      {
        label: "The selected evidence set is sufficiently robust",
        ok: draft.selected_evidence_ids.length >= 3,
      },
      {
        label: "Readiness notes are included when needed",
        ok:
          safe(draft.report_mode).toLowerCase() !== "authority-ready" ||
          draft.include_readiness_notes,
      },
    ];
  }, [draft, representedAreas]);

  if (loading) {
    return (
      <main style={S.page()}>
        <div style={S.pageInner()}>
          <section style={S.card()}>
            <div style={S.h1()}>Report Output</div>
            <div style={S.body()}>Loading saved report object…</div>
          </section>
        </div>
      </main>
    );
  }

  if (!draft) {
    return (
      <main style={S.page()}>
        <div style={S.pageInner()}>
          <section style={S.card()}>
            <div style={S.h1()}>No saved report draft found</div>
            <div style={S.body()}>
              Open the builder first and save a report draft before reviewing output.
            </div>
            <div style={{ height: 14 }} />
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link href="/reports" style={S.button(true)}>
                Open builder
              </Link>
              <Link href="/reports/library" style={S.button(false)}>
                Open library
              </Link>
            </div>
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
              href="/family"
              style={{ ...S.mutedLink(), fontWeight: 900, color: "#0f172a" }}
            >
              EduDecks Family
            </Link>
            <span style={{ color: "#94a3b8" }}>/</span>
            <Link href="/reports" style={S.mutedLink()}>
              Reports
            </Link>
            <span style={{ color: "#94a3b8" }}>/</span>
            <span style={{ ...S.mutedLink(), color: "#0f172a" }}>Output</span>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href={`/reports?draftId=${draft.id}`} style={S.button(false)}>
              Back to builder
            </Link>
            <Link href="/reports/library" style={S.button(false)}>
              Library
            </Link>
            <Link
              href={`/authority/pack-builder?draftId=${draft.id}`}
              style={S.button(true)}
            >
              Authority pack
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

        <section style={S.hero()}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0,1.2fr) minmax(320px,0.9fr)",
              gap: 24,
              alignItems: "start",
            }}
          >
            <div>
              <div style={S.label()}>Frozen report object</div>
              <div style={S.display()}>{safe(draft.title) || "Saved report"}</div>
              <div style={S.body()}>
                This output page reflects the saved report object rather than transient
                builder state. It is the calmer review surface before you continue to
                authority, revise the report draft, or treat this as a family-facing
                summary.
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                  marginTop: 16,
                }}
              >
                <span style={S.pill("primary")}>{draft.child_name || "Child"}</span>
                <span style={S.pill("secondary")}>{modeLabel(draft.report_mode)}</span>
                <span style={S.pill("info")}>{periodLabel(draft.period_mode)}</span>
                <span style={S.pill(readinessTone(readiness))}>
                  {readinessLabel(readiness)} {readiness}%
                </span>
              </div>

              <div style={{ height: 16 }} />

              <div
                style={{
                  ...S.softCard(),
                  border: "1px solid #dbeafe",
                  background: "#eff6ff",
                }}
              >
                <div style={S.label()}>Report summary</div>
                <div style={{ ...S.body(), color: "#1e3a8a" }}>{narrative}</div>
              </div>
            </div>

            <div style={S.card()}>
              <div style={S.label()}>Output summary</div>
              <div style={S.h1()}>{draft.selected_evidence_ids.length}</div>
              <div style={S.small()}>
                selected evidence item{draft.selected_evidence_ids.length === 1 ? "" : "s"}
              </div>

              <div style={{ height: 12 }} />

              <div style={{ display: "grid", gap: 10 }}>
                <MiniStat label="Areas selected" value={String(draft.selected_areas.length)} />
                <MiniStat label="Core items" value={String(selectedCoreCount(draft))} />
                <MiniStat label="Appendix items" value={String(selectedAppendixCount(draft))} />
                <MiniStat label="Required items" value={String(selectedRequiredCount(draft))} />
              </div>
            </div>
          </div>
        </section>

        <div style={{ height: 18 }} />

        <div style={S.splitMain()}>
          <div style={{ display: "grid", gap: 18 }}>
            <section style={S.card()}>
              <div style={S.h2()}>Report overview</div>

              <div style={{ height: 12 }} />

              <div style={{ display: "grid", gap: 10 }}>
                <SummaryRow label="Child" value={draft.child_name} />
                <SummaryRow label="Mode" value={modeLabel(draft.report_mode)} />
                <SummaryRow label="Period" value={periodLabel(draft.period_mode)} />
                <SummaryRow
                  label="Market"
                  value={marketLabel(draft.preferred_market)}
                />
                <SummaryRow
                  label="Status"
                  value={safe(draft.status) || "Draft"}
                />
                <SummaryRow
                  label="Updated"
                  value={shortDate((draft as any).updated_at || (draft as any).created_at)}
                />
              </div>
            </section>

            <section style={S.card()}>
              <div style={S.h2()}>Strengths, growth, and next focus</div>

              <div style={{ height: 12 }} />

              <div style={{ display: "grid", gap: 12 }}>
                <InsightBlock
                  title="Current strengths"
                  text={strengthsNarrative}
                  tone="success"
                />
                <InsightBlock
                  title="Growth area"
                  text={growthNarrative}
                  tone="warning"
                />
                <InsightBlock
                  title="Next focus"
                  text={nextFocusNarrative}
                  tone="info"
                />
              </div>
            </section>

            <section style={S.card()}>
              <div style={S.h2()}>Coverage snapshot</div>

              <div style={{ height: 12 }} />

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {draft.selected_areas.length ? (
                  draft.selected_areas.map((area) => (
                    <span key={area} style={S.pill("primary")}>
                      {area}
                    </span>
                  ))
                ) : (
                  <span style={S.pill("warning")}>No areas selected</span>
                )}
              </div>

              <div style={{ height: 12 }} />

              <div style={S.softCard()}>
                <div style={S.label()}>Represented by selected evidence</div>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                    marginTop: 8,
                  }}
                >
                  {representedAreas.length ? (
                    representedAreas.map((area) => (
                      <span key={area} style={S.pill("info")}>
                        {area}
                      </span>
                    ))
                  ) : (
                    <span style={S.pill("warning")}>No represented areas yet</span>
                  )}
                </div>
              </div>

              {areaCounts.length ? (
                <>
                  <div style={{ height: 12 }} />
                  <div style={S.softCard()}>
                    <div style={S.label()}>Evidence balance</div>
                    <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
                      {areaCounts.map((item) => (
                        <div
                          key={item.area}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 12,
                            alignItems: "center",
                          }}
                        >
                          <span style={{ fontSize: 13, color: "#334155" }}>
                            {item.area}
                          </span>
                          <span style={S.pill(item.count >= 2 ? "success" : "warning")}>
                            {item.count} selected
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : null}
            </section>

            <section style={S.card()}>
              <div style={S.h2()}>Selected evidence</div>

              <div style={{ height: 12 }} />

              {!selectedEvidenceRows.length ? (
                <div style={S.softCard()}>
                  <div style={S.body()}>
                    No evidence is currently selected in this report object.
                  </div>
                  <div style={S.small()}>
                    Return to the builder to curate the evidence set first.
                  </div>
                </div>
              ) : (
                <div style={{ display: "grid", gap: 12 }}>
                  {selectedEvidenceRows.map((row) => {
                    const meta = draft.selection_meta?.[row.id];
                    const strength = evidenceStrength(row);

                    return (
                      <div
                        key={row.id}
                        style={{
                          border: "1px solid #e5e7eb",
                          borderRadius: 14,
                          background: "#ffffff",
                          padding: 14,
                          display: "grid",
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 12,
                            alignItems: "start",
                            flexWrap: "wrap",
                          }}
                        >
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={S.h3()}>
                              {safe(row.title) || "Untitled evidence"}
                            </div>
                            <div style={S.small()}>
                              {guessArea(row.learning_area)} •{" "}
                              {shortDate(row.occurred_on || row.created_at)}
                            </div>
                          </div>

                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <span style={S.pill(strengthTone(strength))}>
                              Strength {strength}
                            </span>
                            <span style={S.pill(meta?.role === "appendix" ? "secondary" : "info")}>
                              {meta?.role === "appendix" ? "Appendix" : "Core"}
                            </span>
                            {meta?.required ? (
                              <span style={S.pill("success")}>Required</span>
                            ) : null}
                            {hasMedia(row) ? (
                              <span style={S.pill("secondary")}>Media</span>
                            ) : null}
                          </div>
                        </div>

                        <div style={S.body()}>
                          {clip(evidenceText(row), 260) || "No written summary yet."}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {evidenceInsights.length ? (
              <section style={S.card()}>
                <div style={S.h2()}>What the evidence is showing</div>

                <div style={{ height: 12 }} />

                <div style={{ display: "grid", gap: 12 }}>
                  {evidenceInsights.map((item) => (
                    <div key={item.id} style={S.softCard()}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 10,
                          alignItems: "center",
                          flexWrap: "wrap",
                        }}
                      >
                        <div style={S.h3()}>{item.title}</div>
                        <span style={S.pill("info")}>{item.area}</span>
                      </div>
                      <div style={{ ...S.small(), marginTop: 6 }}>{item.date}</div>
                      <div style={{ ...S.body(), marginTop: 8 }}>{item.insight}</div>
                      <div style={{ ...S.small(), marginTop: 8 }}>{item.excerpt}</div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {safe(draft.notes) ? (
              <section style={S.card()}>
                <div style={S.h2()}>Parent note</div>
                <div style={S.body()}>{draft.notes}</div>
              </section>
            ) : null}

            {draft.include_action_plan ? (
              <section style={S.card()}>
                <div style={S.h2()}>Action plan</div>
                <div style={{ display: "grid", gap: 10 }}>
                  <ActionItem>
                    Continue collecting representative evidence across the selected
                    learning areas.
                  </ActionItem>
                  <ActionItem>
                    Keep at least two strong core pieces as the main anchors of the
                    report.
                  </ActionItem>
                  <ActionItem>
                    Use the authority flow if this draft is intended for more formal
                    review or submission.
                  </ActionItem>
                </div>
              </section>
            ) : null}

            {draft.include_weekly_plan ? (
              <section style={S.card()}>
                <div style={S.h2()}>Weekly plan</div>
                <div style={{ display: "grid", gap: 10 }}>
                  <ActionItem>
                    Capture one meaningful learning moment early in the week.
                  </ActionItem>
                  <ActionItem>
                    Add one broader supporting piece by mid-week.
                  </ActionItem>
                  <ActionItem>
                    Review one strong item at week’s end and decide whether it belongs
                    in the core or appendix.
                  </ActionItem>
                </div>
              </section>
            ) : null}
          </div>

          <aside style={{ display: "grid", gap: 18 }}>
            <section style={S.card()}>
              <div style={S.h2()}>Submission readiness</div>

              <div style={{ height: 12 }} />

              <div style={{ display: "grid", gap: 10 }}>
                {submissionReadinessItems.map((item) => (
                  <div
                    key={item.label}
                    style={{
                      ...S.softCard(),
                      border: item.ok ? "1px solid #bbf7d0" : "1px solid #fed7aa",
                      background: item.ok ? "#f0fdf4" : "#fff7ed",
                    }}
                  >
                    <div style={S.small()}>
                      {item.ok ? "✓" : "!"} {item.label}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section style={S.card()}>
              <div style={S.h2()}>Draft quality signals</div>

              <div style={{ height: 12 }} />

              <div style={{ display: "grid", gap: 10 }}>
                {strengths.length ? (
                  strengths.map((item) => (
                    <div key={item} style={S.softCard()}>
                      <div style={S.small()}>✓ {item}</div>
                    </div>
                  ))
                ) : (
                  <div style={S.softCard()}>
                    <div style={S.small()}>
                      No clear strengths have been surfaced yet.
                    </div>
                  </div>
                )}

                {watchouts.length ? (
                  watchouts.map((item) => (
                    <div
                      key={item}
                      style={{
                        ...S.softCard(),
                        border: "1px solid #fed7aa",
                        background: "#fff7ed",
                      }}
                    >
                      <div style={S.small()}>! {item}</div>
                    </div>
                  ))
                ) : (
                  <div style={S.softCard()}>
                    <div style={S.small()}>
                      No major watchouts detected in this draft state.
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section style={S.card()}>
              <div style={S.h2()}>Included report features</div>

              <div style={{ height: 12 }} />

              <div style={{ display: "grid", gap: 10 }}>
                <FeatureRow
                  label="Action plan"
                  enabled={draft.include_action_plan}
                />
                <FeatureRow
                  label="Weekly plan"
                  enabled={draft.include_weekly_plan}
                />
                <FeatureRow
                  label="Appendix"
                  enabled={draft.include_appendix}
                />
                <FeatureRow
                  label="Readiness notes"
                  enabled={draft.include_readiness_notes}
                />
              </div>
            </section>

            <section style={S.card()}>
              <div style={S.h2()}>Export & sharing</div>
              <div style={S.body()}>
                When you want to turn this into a polished PDF or DOCX, premium export
                tools can help you generate cleaner files for sharing, printing, or
                authority-facing use.
              </div>

              <div style={{ height: 12 }} />

              <UpgradeCard trigger="output-export" variant="compact" />
            </section>

            <section style={S.card()}>
              <div style={S.h2()}>Next best move</div>
              <div style={S.body()}>{nextMove}</div>

              <div style={{ height: 14 }} />

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Link href={`/reports?draftId=${draft.id}`} style={S.button(false)}>
                  Edit draft
                </Link>
                <Link href="/reports/library" style={S.button(false)}>
                  Back to library
                </Link>
                <Link
                  href={`/authority/pack-builder?draftId=${draft.id}`}
                  style={S.button(true)}
                >
                  Authority pack
                </Link>
              </div>
            </section>

            <section style={S.card()}>
              <div style={S.h2()}>Saved object reference</div>
              <SummaryRow label="Draft ID" value={draft.id} mono />
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
      <strong style={{ fontSize: 16, color: "#0f172a" }}>{value}</strong>
    </div>
  );
}

function ActionItem({ children }: { children: React.ReactNode }) {
  return (
    <div style={S.softCard()}>
      <div style={S.small()}>{children}</div>
    </div>
  );
}

function FeatureRow({
  label,
  enabled,
}: {
  label: string;
  enabled: boolean;
}) {
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
      <span style={S.pill(enabled ? "success" : "secondary")}>
        {enabled ? "Included" : "Off"}
      </span>
    </div>
  );
}

function InsightBlock({
  title,
  text,
  tone,
}: {
  title: string;
  text: string;
  tone: "success" | "info" | "warning";
}) {
  const bg =
    tone === "success"
      ? "#f0fdf4"
      : tone === "info"
      ? "#eff6ff"
      : "#fff7ed";
  const border =
    tone === "success"
      ? "#bbf7d0"
      : tone === "info"
      ? "#bfdbfe"
      : "#fed7aa";

  return (
    <div
      style={{
        border: `1px solid ${border}`,
        borderRadius: 14,
        background: bg,
        padding: 14,
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: 1.05,
          textTransform: "uppercase",
          color: "#64748b",
          marginBottom: 6,
        }}
      >
        {title}
      </div>
      <div style={{ fontSize: 14, lineHeight: 1.65, color: "#334155" }}>
        {text}
      </div>
    </div>
  );
}