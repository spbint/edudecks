"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";
import {
  listReportDrafts,
  loadLatestReportDraft,
  loadReportDraftById,
  marketLabel,
  modeLabel,
  periodLabel,
  type ReportDraftRow,
} from "@/lib/reportDrafts";
import {
  loadAuthorityPackConfig,
  saveAuthorityPackConfig,
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

/* ================= TYPES ================= */

type Jurisdiction = "au" | "uk" | "us";

type SectionOption = {
  key: AuthorityPackSectionKey;
  title: string;
  help: string;
  impact: string;
  recommended?: boolean;
};

/* ================= CONSTANTS ================= */

const SECTION_OPTIONS: SectionOption[] = [
  {
    key: "cover",
    title: "Cover page",
    help: "Adds a calm front page with pack title, child, period, and market.",
    impact: "Gives the submission a cleaner formal entry point for reviewers.",
    recommended: true,
  },
  {
    key: "overview",
    title: "Overview",
    help: "Adds a short review-facing summary of the report context.",
    impact: "Helps the reviewer understand the purpose and structure of the pack quickly.",
    recommended: true,
  },
  {
    key: "coverage",
    title: "Coverage snapshot",
    help: "Shows learning-area breadth across the selected evidence set.",
    impact: "Supports the perception of balance and curriculum breadth.",
    recommended: true,
  },
  {
    key: "evidence",
    title: "Selected evidence",
    help: "Includes the core evidence chosen for the authority pack.",
    impact: "Forms the main submission body and the strongest evidence anchors.",
    recommended: true,
  },
  {
    key: "appendix",
    title: "Appendix",
    help: "Includes supporting appendix evidence where available.",
    impact: "Adds depth and supporting material without crowding the main submission.",
  },
  {
    key: "action-plan",
    title: "Action plan",
    help: "Carries forward the next-step planning block from the report.",
    impact: "Shows reflective next-step planning and educational intentionality.",
  },
  {
    key: "weekly-plan",
    title: "Weekly plan",
    help: "Carries forward the lighter weekly structure where useful.",
    impact: "Adds practical rhythm and future planning, but is less essential than evidence.",
  },
  {
    key: "readiness-notes",
    title: "Readiness notes",
    help: "Adds supportive review-facing preparation notes.",
    impact: "Strengthens submission posture by making preparation more explicit.",
  },
  {
    key: "parent-note",
    title: "Parent note",
    help: "Includes the parent note from the report draft when present.",
    impact: "Adds human context and helps explain emphasis or learning direction.",
  },
];

/* ================= HELPERS ================= */

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

function childName(draft: ReportDraftRow) {
  return (
    safe((draft as any).child_name) ||
    safe((draft as any).student_name) ||
    safe((draft as any).student_display_name) ||
    safe((draft as any).title) ||
    "Selected child"
  );
}

function countCore(draft: ReportDraftRow) {
  const ids = Array.isArray((draft as any).selected_evidence_ids)
    ? (draft as any).selected_evidence_ids
    : [];

  return ids.filter(
    (id: string) => (draft as any).selection_meta?.[id]?.role !== "appendix"
  ).length;
}

function countAppendix(draft: ReportDraftRow) {
  const ids = Array.isArray((draft as any).selected_evidence_ids)
    ? (draft as any).selected_evidence_ids
    : [];

  return ids.filter(
    (id: string) => (draft as any).selection_meta?.[id]?.role === "appendix"
  ).length;
}

function countRequired(draft: ReportDraftRow) {
  const ids = Array.isArray((draft as any).selected_evidence_ids)
    ? (draft as any).selected_evidence_ids
    : [];

  return ids.filter((id: string) =>
    Boolean((draft as any).selection_meta?.[id]?.required)
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

function confidenceBandLabel(
  band: "ready" | "strong" | "developing" | "attention"
) {
  if (band === "ready") return "Submission Ready";
  if (band === "strong") return "Strong";
  if (band === "developing") return "Developing";
  return "Needs Attention";
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
  message: string;
} {
  const v = safe(status).toLowerCase();

  if (v === "submitted") {
    return {
      label: "Submitted",
      tone: "success",
      locked: true,
      message:
        "This authority pack is based on a submitted report and is now locked for trust and consistency.",
    };
  }

  if (v === "final") {
    return {
      label: "Final",
      tone: "info",
      locked: false,
      message:
        "This authority pack is based on a finalized report. It can still be reviewed here before export.",
    };
  }

  if (v === "archived") {
    return {
      label: "Archived",
      tone: "danger",
      locked: true,
      message:
        "This authority pack is based on an archived report. Treat it as a reference state rather than an active workflow.",
    };
  }

  return {
    label: "Draft",
    tone: "secondary",
    locked: false,
    message:
      "This authority pack is still editable and can be shaped further before export.",
  };
}

function buildDefaultConfig(draft: ReportDraftRow): AuthorityPackConfig {
  const preferredMarket = safe((draft as any).preferred_market).toLowerCase();

  return {
    draftId: draft.id,
    jurisdiction:
      preferredMarket === "uk" || preferredMarket === "us"
        ? (preferredMarket as Jurisdiction)
        : "au",
    title: `${childName(draft)} Authority Pack`,
    includeSections: {
      cover: true,
      overview: true,
      coverage: true,
      evidence: true,
      appendix: true,
      "action-plan": (draft as any).include_action_plan !== false,
      "weekly-plan": (draft as any).include_weekly_plan !== false,
      "readiness-notes": (draft as any).include_readiness_notes !== false,
      "parent-note": Boolean(safe((draft as any).notes)),
    },
    selectedEvidenceIds: Array.isArray((draft as any).selected_evidence_ids)
      ? [...(draft as any).selected_evidence_ids]
      : [],
    emphasisNote: "",
    reviewerNote: "",
    includeOnlyRequiredEvidence: false,
    includeOnlyCoreEvidence: false,
    updatedAt: new Date().toISOString(),
  };
}

function latestEvidenceDate(rows: AuthorityEvidenceRow[]) {
  if (!rows.length) return "—";

  const withDates = rows
    .map((r) => safe((r as any).occurredOn || (r as any).occurred_on))
    .filter(Boolean)
    .sort((a, b) => (a > b ? -1 : 1));

  return withDates[0] ? shortDate(withDates[0]) : "—";
}

function coverageSummary(rows: AuthorityEvidenceRow[]) {
  const unique = Array.from(
    new Set(
      rows
        .map((r) => safe((r as any).learningArea || (r as any).learning_area))
        .filter(Boolean)
    )
  );

  if (!unique.length) return "No coverage yet";
  if (unique.length <= 3) return unique.join(", ");
  return `${unique.slice(0, 3).join(", ")} +${unique.length - 3} more`;
}

function joinNatural(items: string[]) {
  if (!items.length) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function sectionImpactSummary(enabledSections: AuthorityPackSectionKey[]) {
  const impacts: string[] = [];

  if (enabledSections.includes("overview")) {
    impacts.push("clear context for reviewers");
  }
  if (enabledSections.includes("coverage")) {
    impacts.push("visible breadth across learning areas");
  }
  if (enabledSections.includes("evidence")) {
    impacts.push("a defined core evidence body");
  }
  if (enabledSections.includes("appendix")) {
    impacts.push("supporting depth through appendix evidence");
  }
  if (enabledSections.includes("parent-note")) {
    impacts.push("extra parent context");
  }
  if (enabledSections.includes("readiness-notes")) {
    impacts.push("stronger preparation posture");
  }

  if (!impacts.length) {
    return "The current pack is very lean and may need more structure before export.";
  }

  return `The current pack communicates ${joinNatural(impacts)}.`;
}

function buildPackNarrative(args: {
  draft: ReportDraftRow;
  config: AuthorityPackConfig;
  evidenceRows: AuthorityEvidenceRow[];
  confidence:
    | ReturnType<typeof buildAuthorityConfidence>
    | null;
  includedSections: AuthorityPackSectionKey[];
}) {
  const { draft, config, evidenceRows, confidence, includedSections } = args;

  const child = childName(draft);
  const market = marketLabel(config.jurisdiction);
  const mode = safe((draft as any).report_mode).toLowerCase();
  const areaList = Array.from(
    new Set(
      evidenceRows
        .map((r) => safe((r as any).learningArea || (r as any).learning_area))
        .filter(Boolean)
    )
  );
  const hasAppendix = includedSections.includes("appendix");
  const hasParentNote = includedSections.includes("parent-note");
  const hasReadinessNotes = includedSections.includes("readiness-notes");

  const intro =
    mode === "authority-ready"
      ? `${child}'s authority pack is being shaped as a more formal ${market}-facing submission based on the saved report draft.`
      : `${child}'s authority pack is being shaped as a structured ${market}-facing submission based on the saved report draft.`;

  const evidenceLine = evidenceRows.length
    ? ` The pack currently includes ${evidenceRows.length} filtered evidence item${
        evidenceRows.length === 1 ? "" : "s"
      } across ${areaList.length || 0} represented learning area${
        areaList.length === 1 ? "" : "s"
      }.`
    : " The pack currently has no filtered evidence included, so it will need strengthening before export.";

  const structureLine = hasAppendix
    ? " Supporting appendix material is enabled, which helps deepen the submission without overloading the main evidence body."
    : " Appendix evidence is currently excluded, which keeps the pack leaner but may reduce supporting depth.";

  const postureLine = hasReadinessNotes
    ? " Readiness notes are included, helping the submission feel more intentional and prepared."
    : " Readiness notes are currently off, so the pack may feel lighter but less explicitly prepared.";

  const contextLine = hasParentNote
    ? " Parent context is available, which can help reviewers understand emphasis and learning direction."
    : " Parent context is currently absent, so the submission will lean more heavily on evidence structure alone.";

  const confidenceLine = confidence
    ? confidence.band === "ready"
      ? " The live confidence signal suggests this pack is close to export-ready."
      : confidence.band === "strong"
      ? " The live confidence signal suggests this pack is structurally strong, with only light refinement likely needed."
      : confidence.band === "developing"
      ? " The live confidence signal suggests this pack is developing well but still has a few areas to tighten before export."
      : " The live confidence signal suggests this pack needs more work before it will feel calm and defensible."
    : "";

  return `${intro}${evidenceLine}${structureLine}${postureLine}${contextLine}${confidenceLine}`;
}

function buildPostureSummary(args: {
  draft: ReportDraftRow;
  config: AuthorityPackConfig;
  confidence:
    | ReturnType<typeof buildAuthorityConfidence>
    | null;
  evidenceRows: AuthorityEvidenceRow[];
}) {
  const { draft, confidence, evidenceRows } = args;
  const mode = safe((draft as any).report_mode).toLowerCase();
  const count = evidenceRows.length;

  if (!count) {
    return "The current pack posture is too light to feel submission-ready. Evidence selection should be strengthened first.";
  }

  if (confidence?.band === "ready") {
    return mode === "authority-ready"
      ? "This pack is presenting as a formal, evidence-led submission with a strong review posture."
      : "This pack is presenting as a calm, well-structured submission with good supporting depth.";
  }

  if (confidence?.band === "strong") {
    return "This pack already communicates structure and intent clearly, but one or two refinements could make export feel stronger.";
  }

  if (confidence?.band === "developing") {
    return "This pack is beginning to communicate structure and evidence, but it still needs tighter shaping before export.";
  }

  return "This pack currently feels more like a draft configuration than a finished submission posture.";
}

/* ================= PAGE ================= */

export default function AuthorityPackBuilderPage() {
  const searchParams = useSearchParams();

  const [drafts, setDrafts] = useState<ReportDraftRow[]>([]);
  const [draft, setDraft] = useState<ReportDraftRow | null>(null);
  const [config, setConfig] = useState<AuthorityPackConfig | null>(null);
  const [evidenceRows, setEvidenceRows] = useState<AuthorityEvidenceRow[]>([]);

  const [loading, setLoading] = useState(true);
  const [savingState, setSavingState] = useState<"idle" | "saved">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      try {
        setLoading(true);
        setError("");

        const rawId = searchParams.get("draftId");
        const requestedDraftId = rawId ? String(rawId).trim() : "";

        let chosenDraft: ReportDraftRow | null = null;

        if (requestedDraftId) {
          chosenDraft = await loadReportDraftById(requestedDraftId);
        }

        if (!chosenDraft) {
          chosenDraft = await loadLatestReportDraft();
        }

        const allDrafts = await listReportDrafts();

        if (!mounted) return;

        setDrafts(allDrafts);
        setDraft(chosenDraft);

        if (!chosenDraft) {
          setConfig(null);
          setEvidenceRows([]);
          return;
        }

        const existingConfig =
          loadAuthorityPackConfig(chosenDraft.id) || buildDefaultConfig(chosenDraft);

        const rows = await loadAuthorityEvidenceRows(chosenDraft, existingConfig);

        if (!mounted) return;

        setConfig(existingConfig);
        setEvidenceRows(rows);
      } catch (err: any) {
        if (!mounted) return;
        setError(String(err?.message || err || "Failed to load builder."));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void hydrate();

    return () => {
      mounted = false;
    };
  }, [searchParams]);

  useEffect(() => {
    if (!draft || !config) return;

    const nextConfig: AuthorityPackConfig =
      config.draftId === draft.id
        ? { ...config, updatedAt: new Date().toISOString() }
        : {
            ...(loadAuthorityPackConfig(draft.id) || buildDefaultConfig(draft)),
            updatedAt: new Date().toISOString(),
          };

    saveAuthorityPackConfig(nextConfig);
    setSavingState("saved");

    const id = window.setTimeout(() => setSavingState("idle"), 1200);
    return () => window.clearTimeout(id);
  }, [draft?.id, config]);

  useEffect(() => {
    let mounted = true;

    async function refreshEvidence() {
      if (!draft || !config) return;

      try {
        const rows = await loadAuthorityEvidenceRows(draft, config);
        if (!mounted) return;
        setEvidenceRows(rows);
      } catch {
        if (!mounted) return;
        setEvidenceRows([]);
      }
    }

    void refreshEvidence();

    return () => {
      mounted = false;
    };
  }, [draft, config]);

  const confidence = useMemo(() => {
    if (!draft || !config) return null;
    return buildAuthorityConfidence(draft, config, evidenceRows);
  }, [draft, config, evidenceRows]);

  const includedSections = useMemo(() => {
    if (!config) return [];

    return Object.entries(config.includeSections)
      .filter(([, enabled]) => enabled)
      .map(([key]) => key as AuthorityPackSectionKey);
  }, [config]);

  const filteredEvidenceIds = useMemo(() => {
    if (!draft || !config) return [];
    return getAuthorityFilteredEvidenceIds(draft, config);
  }, [draft, config]);

  const packNarrative = useMemo(() => {
    if (!draft || !config) return "";
    return buildPackNarrative({
      draft,
      config,
      evidenceRows,
      confidence,
      includedSections,
    });
  }, [draft, config, evidenceRows, confidence, includedSections]);

  const postureSummary = useMemo(() => {
    if (!draft || !config) return "";
    return buildPostureSummary({
      draft,
      config,
      confidence,
      evidenceRows,
    });
  }, [draft, config, confidence, evidenceRows]);

  const sectionImpactText = useMemo(() => {
    return sectionImpactSummary(includedSections);
  }, [includedSections]);

  const representedAreas = useMemo(() => {
    return Array.from(
      new Set(
        evidenceRows
          .map((r: any) => safe((r as any).learningArea || (r as any).learning_area))
          .filter(Boolean)
      )
    );
  }, [evidenceRows]);

  const strongestSignals = useMemo(() => {
    if (!draft || !config || !confidence) return [];

    const items: string[] = [];

    if (confidence.band === "ready" || confidence.band === "strong") {
      items.push("The pack already has a strong structural base.");
    }
    if (evidenceRows.length >= 4) {
      items.push("The evidence body is substantial enough to support a calmer submission.");
    }
    if (includedSections.includes("overview") && includedSections.includes("evidence")) {
      items.push("The pack provides both context and a clear main evidence body.");
    }
    if (includedSections.includes("appendix")) {
      items.push("Appendix support is available to deepen the submission.");
    }
    if (safe(config.emphasisNote) || safe(config.reviewerNote)) {
      items.push("The pack includes extra shaping notes to guide review posture.");
    }

    return items.slice(0, 4);
  }, [draft, config, confidence, evidenceRows, includedSections]);

  const attentionSignals = useMemo(() => {
    if (!draft || !config || !confidence) return [];

    const items: string[] = [];

    if (!evidenceRows.length) {
      items.push("No filtered evidence is currently included.");
    } else if (evidenceRows.length < 3) {
      items.push("The filtered evidence set is still fairly light.");
    }

    if (!includedSections.includes("overview")) {
      items.push("The pack may feel abrupt without an overview section.");
    }

    if (!includedSections.includes("coverage")) {
      items.push("The pack may undersell breadth without a coverage snapshot.");
    }

    if (
      safe((draft as any).report_mode).toLowerCase() === "authority-ready" &&
      !includedSections.includes("readiness-notes")
    ) {
      items.push("Authority-ready mode may feel less prepared without readiness notes.");
    }

    if (!safe(config.emphasisNote) && !safe(config.reviewerNote)) {
      items.push("No shaping notes are currently helping guide the submission tone.");
    }

    return items.slice(0, 4);
  }, [draft, config, confidence, evidenceRows, includedSections]);

  const status = useMemo(() => {
    return draftStatusMeta(draft?.status);
  }, [draft?.status]);

  const isLocked = status.locked;
  const isReadyForExport = confidence?.band === "ready";

  function updateConfig(patch: Partial<AuthorityPackConfig>) {
    if (isLocked) return;
    setConfig((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        ...patch,
        updatedAt: new Date().toISOString(),
      };
    });
  }

  function toggleSection(key: AuthorityPackSectionKey) {
    if (isLocked) return;
    setConfig((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        includeSections: {
          ...prev.includeSections,
          [key]: !prev.includeSections[key],
        },
        updatedAt: new Date().toISOString(),
      };
    });
  }

  async function handleDraftChange(nextId: string) {
    const safeId = safe(nextId);
    if (!safeId) return;

    setLoading(true);
    setError("");

    try {
      const nextDraft =
        drafts.find((d) => d.id === safeId) || (await loadReportDraftById(safeId));

      if (!nextDraft) {
        setError("Could not open the selected draft.");
        return;
      }

      const nextConfig =
        loadAuthorityPackConfig(nextDraft.id) || buildDefaultConfig(nextDraft);
      const rows = await loadAuthorityEvidenceRows(nextDraft, nextConfig);

      setDraft(nextDraft);
      setConfig(nextConfig);
      setEvidenceRows(rows);
    } catch (err: any) {
      setError(String(err?.message || err || "Could not switch drafts."));
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <FamilyTopNavShell
        title="EduDecks Family"
        subtitle="Authority Pack Builder"
        heroTitle="Build a calmer authority-ready pack"
        heroText="Bring your saved report into a clearer, more formal authority structure."
        heroAsideTitle="Pack workflow"
        heroAsideText="Choose a saved report, shape the pack, and review confidence before export."
      >
        <section style={S.card()}>
          <div style={S.h2()}>Loading Authority Pack Builder…</div>
          <div style={S.small()}>
            We’re loading the latest saved report draft and builder settings.
          </div>
        </section>
      </FamilyTopNavShell>
    );
  }

  if (!draft || !config) {
    return (
      <FamilyTopNavShell
        title="EduDecks Family"
        subtitle="Authority Pack Builder"
        heroTitle="Build a calmer authority-ready pack"
        heroText="Bring your saved report into a clearer, more formal authority structure."
        heroAsideTitle="Pack workflow"
        heroAsideText="Choose a saved report, shape the pack, and review confidence before export."
      >
        <section style={S.card()}>
          <div style={S.h2()}>No saved report draft found</div>
          <div style={S.body()}>
            Start with a saved report draft first, then come back here to shape the
            authority pack around it.
          </div>

          <div style={{ height: 16 }} />

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/reports" style={S.button(true)}>
              Open Reports Builder
            </Link>
            <Link href="/reports/library" style={S.button(false)}>
              Report Library
            </Link>
            <Link href="/authority/readiness" style={S.button(false)}>
              Authority Readiness
            </Link>
          </div>
        </section>
      </FamilyTopNavShell>
    );
  }

  return (
    <FamilyTopNavShell
      title="EduDecks Family"
      subtitle="Authority Pack Builder"
      heroTitle="Shape a stronger submission before export"
      heroText="Choose the report draft, tune the structure, and use the live confidence guidance to strengthen the pack before you move to export."
      heroAsideTitle="Builder status"
      heroAsideText={
        isLocked
          ? "This pack is currently locked because the source report has already been submitted."
          : savingState === "saved"
          ? "Builder changes saved locally for this draft."
          : "Your changes are being kept against this draft as you build."
      }
    >
      {error ? (
        <section
          style={{
            ...S.card(),
            border: "1px solid #fecdd3",
            background: "#fff1f2",
          }}
        >
          <div style={S.h2()}>Builder issue</div>
          <div style={S.body()}>{error}</div>
        </section>
      ) : null}

      <div style={{ height: 18 }} />

      <section style={S.hero()}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0,1.4fr) minmax(300px,0.9fr)",
            gap: 18,
            alignItems: "start",
          }}
        >
          <div>
            <div style={S.label()}>Current draft</div>
            <div style={S.h1()}>{config.title || "Authority Pack"}</div>
            <div style={S.body()}>
              Based on <strong>{childName(draft)}</strong> •{" "}
              {modeLabel((draft as any).report_mode)} •{" "}
              {periodLabel((draft as any).period_mode)} •{" "}
              {marketLabel(config.jurisdiction)}
            </div>

            <div style={{ ...S.small(), marginTop: 8 }}>
              Report ID: {draft.id.slice(0, 8)} • Last updated{" "}
              {shortDate((draft as any).updated_at || (draft as any).created_at)}
            </div>

            <div style={{ height: 14 }} />

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <span style={S.pill(status.tone)}>{status.label}</span>
              {confidence ? (
                <span style={S.pill(confidenceTone(confidence.band))}>
                  {confidenceBandLabel(confidence.band)} {confidence.score}%
                </span>
              ) : null}
            </div>

            <div style={{ height: 14 }} />

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
              <div style={S.label()}>Submission status</div>
              <div style={S.body()}>{status.message}</div>
            </div>

            <div style={{ height: 14 }} />

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link href={`/reports?draftId=${draft.id}`} style={S.button(false)}>
                Edit report
              </Link>
              <Link
                href={`/reports/output?draftId=${draft.id}`}
                style={S.button(false)}
              >
                Review output
              </Link>
              <Link
                href={`/authority/export?draftId=${draft.id}`}
                style={S.button(true)}
              >
                {isReadyForExport ? "Continue to export" : "Review before export"}
              </Link>
            </div>

            <div style={{ height: 16 }} />

            <div
              style={{
                ...S.softCard(),
                border: "1px solid #dbeafe",
                background: "#eff6ff",
              }}
            >
              <div style={S.label()}>Authority pack summary</div>
              <div style={{ ...S.body(), color: "#1e3a8a" }}>{packNarrative}</div>
            </div>
          </div>

          <div style={S.card()}>
            <div style={S.label()}>Pack snapshot</div>
            <div style={{ display: "grid", gap: 10 }}>
              <MiniStat label="Filtered evidence" value={String(evidenceRows.length)} />
              <MiniStat label="Included sections" value={String(includedSections.length)} />
              <MiniStat label="Coverage" value={coverageSummary(evidenceRows)} />
              <MiniStat label="Latest evidence" value={latestEvidenceDate(evidenceRows)} />
            </div>

            <div style={{ height: 14 }} />

            <div
              style={{
                ...S.softCard(),
                border:
                  confidence?.band === "ready"
                    ? "1px solid #bbf7d0"
                    : confidence?.band === "strong"
                    ? "1px solid #bfdbfe"
                    : confidence?.band === "developing"
                    ? "1px solid #fed7aa"
                    : "1px solid #fecaca",
                background:
                  confidence?.band === "ready"
                    ? "#f0fdf4"
                    : confidence?.band === "strong"
                    ? "#eff6ff"
                    : confidence?.band === "developing"
                    ? "#fff7ed"
                    : "#fff1f2",
              }}
            >
              <div style={S.label()}>Submission posture</div>
              <div style={S.body()}>{postureSummary}</div>
            </div>
          </div>
        </div>
      </section>

      <div style={{ height: 18 }} />

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,1.2fr) minmax(320px,0.8fr)",
          gap: 18,
          alignItems: "start",
        }}
      >
        <div style={{ display: "grid", gap: 22 }}>
          <section style={S.card()}>
            <div style={S.h2()}>Draft source</div>
            <div style={S.small()}>
              Choose which saved report draft to build this authority pack from.
            </div>

            <div style={{ height: 14 }} />

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(220px, 1fr) minmax(220px, 1fr)",
                gap: 12,
              }}
            >
              <div>
                <div style={S.label()}>Saved report draft</div>
                <select
                  value={draft.id}
                  onChange={(e) => void handleDraftChange(e.target.value)}
                  style={{ ...S.input(240), width: "100%" }}
                >
                  {drafts.length === 0 ? (
                    <option value={draft.id}>{config.title}</option>
                  ) : (
                    drafts.map((item) => (
                      <option key={item.id} value={item.id}>
                        {(item.title || "Untitled report draft").trim()} •{" "}
                        {childName(item)}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <div style={S.label()}>Jurisdiction</div>
                <select
                  value={config.jurisdiction}
                  disabled={isLocked}
                  onChange={(e) =>
                    updateConfig({
                      jurisdiction:
                        e.target.value === "uk" || e.target.value === "us"
                          ? (e.target.value as Jurisdiction)
                          : "au",
                    })
                  }
                  style={{
                    ...S.input(180),
                    width: "100%",
                    opacity: isLocked ? 0.7 : 1,
                    cursor: isLocked ? "not-allowed" : "pointer",
                  }}
                >
                  <option value="au">Australia</option>
                  <option value="uk">United Kingdom</option>
                  <option value="us">United States</option>
                </select>
              </div>
            </div>

            <div style={{ height: 14 }} />

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(220px,1fr) minmax(220px,1fr)",
                gap: 12,
              }}
            >
              <div>
                <div style={S.label()}>Pack title</div>
                <input
                  value={config.title}
                  disabled={isLocked}
                  onChange={(e) => updateConfig({ title: e.target.value })}
                  style={{
                    ...S.input(240),
                    width: "100%",
                    opacity: isLocked ? 0.7 : 1,
                  }}
                  placeholder="Authority pack title"
                />
              </div>

              <div>
                <div style={S.label()}>Last updated</div>
                <div style={S.softCard()}>
                  <div style={S.body()}>{shortDate(config.updatedAt)}</div>
                  <div style={S.small()}>
                    Draft updated {shortDate((draft as any).updated_at)}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section style={S.card()}>
            <div style={S.h2()}>What this pack communicates</div>
            <div style={S.small()}>
              This is the message your current builder choices are sending before export.
            </div>

            <div style={{ height: 14 }} />

            <div style={{ display: "grid", gap: 12 }}>
              <MeaningCard
                title="Submission structure"
                text={sectionImpactText}
                tone="info"
              />
              <MeaningCard
                title="Current breadth"
                text={
                  representedAreas.length
                    ? `The filtered evidence currently represents ${joinNatural(
                        representedAreas.slice(0, 4)
                      )}${
                        representedAreas.length > 4
                          ? ` and ${representedAreas.length - 4} more area${representedAreas.length - 4 === 1 ? "" : "s"}`
                          : ""
                      }.`
                    : "The filtered evidence is not yet communicating clear breadth across learning areas."
                }
                tone={representedAreas.length >= 4 ? "success" : "warning"}
              />
              <MeaningCard
                title="Reviewer impression"
                text={postureSummary}
                tone={
                  confidence?.band === "ready" || confidence?.band === "strong"
                    ? "success"
                    : "warning"
                }
              />
            </div>
          </section>

          <section style={S.card()}>
            <div style={S.h2()}>Section controls</div>
            <div style={S.small()}>
              Decide what appears in the submission-facing pack before export.
            </div>

            <div style={{ height: 14 }} />

            <div style={{ display: "grid", gap: 12 }}>
              {SECTION_OPTIONS.map((section) => {
                const enabled = Boolean(config.includeSections[section.key]);

                return (
                  <div
                    key={section.key}
                    style={{
                      border: `1px solid ${enabled ? "#bfdbfe" : "#e5e7eb"}`,
                      background: enabled ? "#eff6ff" : "#ffffff",
                      borderRadius: 14,
                      padding: 14,
                      display: "grid",
                      gap: 10,
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
                      <div>
                        <div
                          style={{
                            fontSize: 15,
                            fontWeight: 900,
                            color: "#0f172a",
                            marginBottom: 4,
                            display: "flex",
                            gap: 8,
                            alignItems: "center",
                            flexWrap: "wrap",
                          }}
                        >
                          <span>{section.title}</span>
                          {section.recommended ? (
                            <span style={S.pill("success")}>Recommended</span>
                          ) : null}
                        </div>
                        <div style={{ ...S.small(), maxWidth: 720 }}>{section.help}</div>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleSection(section.key)}
                        disabled={isLocked}
                        style={{
                          ...S.button(enabled),
                          opacity: isLocked ? 0.6 : 1,
                          cursor: isLocked ? "not-allowed" : "pointer",
                        }}
                      >
                        {enabled ? "Included" : "Excluded"}
                      </button>
                    </div>

                    <div
                      style={{
                        padding: "10px 12px",
                        borderRadius: 12,
                        background: enabled ? "#dbeafe" : "#f8fafc",
                        color: enabled ? "#1d4ed8" : "#475569",
                        fontSize: 13,
                        lineHeight: 1.5,
                        fontWeight: 700,
                      }}
                    >
                      {enabled
                        ? `Included impact: ${section.impact}`
                        : `Currently not contributing: ${section.impact}`}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section style={S.card()}>
            <div style={S.h2()}>Evidence filters</div>
            <div style={S.small()}>
              Adjust whether the pack should only show required and/or core evidence.
            </div>

            <div style={{ height: 14 }} />

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: 12,
              }}
            >
              <ToggleCard
                title="Only required evidence"
                text="Useful when you want a leaner compliance-focused pack."
                active={config.includeOnlyRequiredEvidence}
                locked={isLocked}
                onToggle={() =>
                  updateConfig({
                    includeOnlyRequiredEvidence: !config.includeOnlyRequiredEvidence,
                  })
                }
              />

              <ToggleCard
                title="Only core evidence"
                text="Removes appendix items and keeps the main submission tighter."
                active={config.includeOnlyCoreEvidence}
                locked={isLocked}
                onToggle={() =>
                  updateConfig({
                    includeOnlyCoreEvidence: !config.includeOnlyCoreEvidence,
                  })
                }
              />
            </div>

            <div style={{ height: 14 }} />

            <div style={S.softCard()}>
              <div style={S.label()}>Filtered selection result</div>
              <div style={S.body()}>
                {filteredEvidenceIds.length} evidence item
                {filteredEvidenceIds.length === 1 ? "" : "s"} currently included by
                the active builder rules.
              </div>
              <div style={S.small()}>
                Core selected: {countCore(draft)} • Appendix selected:{" "}
                {countAppendix(draft)} • Required selected: {countRequired(draft)}
              </div>
            </div>
          </section>

          <section style={S.card()}>
            <div style={S.h2()}>Pack notes</div>
            <div style={S.small()}>
              These notes help shape the tone and reviewing posture before export.
            </div>

            <div style={{ height: 14 }} />

            <div style={{ display: "grid", gap: 14 }}>
              <div>
                <div style={S.label()}>Emphasis note</div>
                <textarea
                  value={config.emphasisNote}
                  disabled={isLocked}
                  onChange={(e) => updateConfig({ emphasisNote: e.target.value })}
                  style={{
                    ...S.textarea(),
                    opacity: isLocked ? 0.7 : 1,
                  }}
                  placeholder="What should this pack especially emphasise?"
                />
              </div>

              <div>
                <div style={S.label()}>Reviewer note</div>
                <textarea
                  value={config.reviewerNote}
                  disabled={isLocked}
                  onChange={(e) => updateConfig({ reviewerNote: e.target.value })}
                  style={{
                    ...S.textarea(),
                    opacity: isLocked ? 0.7 : 1,
                  }}
                  placeholder="Optional note for review context or submission framing."
                />
              </div>
            </div>
          </section>

          <section style={S.card()}>
            <div style={S.h2()}>Pack preview summary</div>

            <div style={{ height: 12 }} />

            <div style={{ display: "grid", gap: 12 }}>
              <SummaryRow label="Title" value={config.title} />
              <SummaryRow label="Child" value={childName(draft)} />
              <SummaryRow label="Market" value={marketLabel(config.jurisdiction)} />
              <SummaryRow
                label="Mode"
                value={modeLabel((draft as any).report_mode)}
              />
              <SummaryRow
                label="Period"
                value={periodLabel((draft as any).period_mode)}
              />
              <SummaryRow
                label="Sections"
                value={
                  includedSections.length
                    ? includedSections.map(sectionLabel).join(", ")
                    : "No sections selected"
                }
              />
              <SummaryRow
                label="Evidence"
                value={`${evidenceRows.length} filtered item${
                  evidenceRows.length === 1 ? "" : "s"
                }`}
              />
            </div>
          </section>
        </div>

        <aside style={{ display: "grid", gap: 18 }}>
          {confidence ? (
            <section style={S.card()}>
              <div style={S.h2()}>Submission Readiness: {confidence.score}%</div>

              <div style={S.small()}>
                Live authority confidence based on your current pack — before export.
              </div>

              <div style={{ height: 12 }} />

              <span style={S.pill(confidenceTone(confidence.band))}>
                {confidenceBandLabel(confidence.band)}
              </span>

              <div style={{ height: 16 }} />

              <div style={S.label()}>Checklist</div>

              <div style={{ display: "grid", gap: 8 }}>
                {confidence.checklist.map((item: any, i: number) => (
                  <div
                    key={`${item.label}-${i}`}
                    style={{
                      padding: "9px 10px",
                      borderRadius: 10,
                      background: item.passed ? "#ecfdf5" : "#fff7ed",
                      border: `1px solid ${item.passed ? "#a7f3d0" : "#fed7aa"}`,
                      color: item.passed ? "#166534" : "#9a3412",
                      fontSize: 13,
                      lineHeight: 1.45,
                      fontWeight: 700,
                    }}
                  >
                    {item.passed ? "✔" : "✖"} {item.label}
                  </div>
                ))}
              </div>

              {confidence.insights.length ? (
                <>
                  <div style={{ height: 16 }} />
                  <div style={S.label()}>Suggestions</div>
                  <div style={{ display: "grid", gap: 8 }}>
                    {confidence.insights.map((insight: string, i: number) => (
                      <div key={`${insight}-${i}`} style={S.small()}>
                        • {insight}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ height: 16 }} />
                  <div
                    style={{
                      padding: "10px 12px",
                      borderRadius: 12,
                      border: "1px solid #a7f3d0",
                      background: "#ecfdf5",
                      color: "#166534",
                      fontSize: 13,
                      lineHeight: 1.5,
                      fontWeight: 700,
                    }}
                  >
                    This pack is building from a strong structure already. Export
                    should feel much calmer from here.
                  </div>
                </>
              )}
            </section>
          ) : null}

          <section style={S.card()}>
            <div style={S.h2()}>Strong signals and watchouts</div>

            <div style={{ height: 12 }} />

            <div style={{ display: "grid", gap: 10 }}>
              {strongestSignals.length ? (
                strongestSignals.map((item) => (
                  <div
                    key={item}
                    style={{
                      ...S.softCard(),
                      border: "1px solid #bbf7d0",
                      background: "#f0fdf4",
                    }}
                  >
                    <div style={S.small()}>✓ {item}</div>
                  </div>
                ))
              ) : (
                <div style={S.softCard()}>
                  <div style={S.small()}>
                    No strong submission signals are clearly surfacing yet.
                  </div>
                </div>
              )}

              {attentionSignals.length ? (
                attentionSignals.map((item) => (
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
                    No major watchouts are currently standing out in this pack.
                  </div>
                </div>
              )}
            </div>
          </section>

          <section style={S.card()}>
            <div style={S.h2()}>Included evidence</div>
            <div style={S.small()}>
              The rows below reflect the current builder filters and section choices.
            </div>

            <div style={{ height: 14 }} />

            {!evidenceRows.length ? (
              <div style={S.softCard()}>
                <div style={S.body()}>
                  No filtered evidence is currently available for this pack.
                </div>
                <div style={S.small()}>
                  Try widening the evidence filter or add more evidence in the
                  report builder first.
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
                      gap: 8,
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
                        <span
                          style={S.pill(
                            row.role === "appendix" ? "secondary" : "primary"
                          )}
                        >
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

                    <div style={S.small()}>
                      This item contributes to demonstrating progress in{" "}
                      {safe(row.learningArea || row.learning_area) || "the selected area"}.
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

          <section style={S.card()}>
            <div style={S.h2()}>Best next move</div>
            <div style={S.body()}>
              {confidence
                ? `Current confidence band: ${confidenceBandLabel(
                    confidence.band
                  )}. ${
                    confidence.insights.length
                      ? "Use the suggestions above to improve the pack before export."
                      : "You are in a strong position to continue to export."
                  }`
                : "Shape the pack here first, then move to export when the structure looks right."}
            </div>

            <div style={{ height: 14 }} />

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link
                href={`/authority/export?draftId=${draft.id}`}
                style={S.button(true)}
              >
                {isReadyForExport ? "Open export" : "Review before export"}
              </Link>
              <Link
                href={`/authority/readiness?draftId=${draft.id}`}
                style={S.button(false)}
              >
                Readiness
              </Link>
              <Link href={`/reports?draftId=${draft.id}`} style={S.button(false)}>
                Edit report
              </Link>
            </div>
          </section>
        </aside>
      </section>
    </FamilyTopNavShell>
  );
}

/* ================= SMALL COMPONENTS ================= */

function ToggleCard({
  title,
  text,
  active,
  locked,
  onToggle,
}: {
  title: string;
  text: string;
  active: boolean;
  locked?: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      style={{
        border: `1px solid ${active ? "#bfdbfe" : "#e5e7eb"}`,
        background: active ? "#eff6ff" : "#ffffff",
        borderRadius: 14,
        padding: 14,
        display: "grid",
        gap: 8,
        opacity: locked ? 0.8 : 1,
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
            fontSize: 15,
            fontWeight: 900,
            color: "#0f172a",
          }}
        >
          {title}
        </div>
        <button
          type="button"
          onClick={onToggle}
          disabled={locked}
          style={{
            ...S.button(active),
            opacity: locked ? 0.6 : 1,
            cursor: locked ? "not-allowed" : "pointer",
          }}
        >
          {active ? "On" : "Off"}
        </button>
      </div>

      <div style={S.small()}>{text}</div>
    </div>
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
      <strong style={{ fontSize: 15, color: "#0f172a" }}>{value}</strong>
    </div>
  );
}

function MeaningCard({
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