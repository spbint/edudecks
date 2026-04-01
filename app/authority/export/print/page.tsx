"use client";

import React, { useEffect, useMemo, useState } from "react";
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
  loadAuthorityEvidenceRows,
  type AuthorityEvidenceRow,
} from "@/lib/authorityPackData";
import { buildAuthorityConfidence } from "@/lib/authorityConfidence";

function safe(v: any) {
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

function confidenceLabel(band: string) {
  if (band === "ready") return "Submission Ready";
  if (band === "strong") return "Strong";
  if (band === "developing") return "Developing";
  return "Needs Attention";
}

export default function AuthorityPrintPage() {
  const searchParams = useSearchParams();

  const [draft, setDraft] = useState<ReportDraftRow | null>(null);
  const [config, setConfig] = useState<AuthorityPackConfig | null>(null);
  const [evidenceRows, setEvidenceRows] = useState<AuthorityEvidenceRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      const requestedDraftId = safe(searchParams.get("draftId"));

      const loadedDraft = requestedDraftId
        ? await loadReportDraftById(requestedDraftId)
        : await loadLatestReportDraft();

      if (!mounted) return;

      if (!loadedDraft) {
        setLoading(false);
        return;
      }

      const cfg =
        loadAuthorityPackConfig(loadedDraft.id) ||
        buildDefaultConfig(loadedDraft);

      const rows = await loadAuthorityEvidenceRows(loadedDraft, cfg);

      if (!mounted) return;

      setDraft(loadedDraft);
      setConfig(cfg);
      setEvidenceRows(rows);

      setTimeout(() => window.print(), 400);
      setLoading(false);
    }

    hydrate();
    return () => {
      mounted = false;
    };
  }, [searchParams]);

  const confidence = useMemo(() => {
    if (!draft || !config) return null;
    return buildAuthorityConfidence(draft, config, evidenceRows);
  }, [draft, config, evidenceRows]);

  if (loading) return <div style={styles.loading}>Preparing print…</div>;

  if (!draft || !config) {
    return <div>No data</div>;
  }

  return (
    <div style={styles.page}>
      <div style={styles.sheet}>
        <h1 style={styles.h1}>{config.title}</h1>

        <div style={styles.meta}>
          <Meta label="Child" value={draft.child_name} />
          <Meta label="Mode" value={modeLabel(draft.report_mode)} />
          <Meta label="Market" value={marketLabel(config.jurisdiction)} />
          <Meta label="Updated" value={shortDate(config.updatedAt)} />
        </div>

        {confidence && (
          <section style={styles.section}>
            <h2 style={styles.h2}>Authority Confidence</h2>
            <p style={styles.p}>
              Score: {confidence.score}% —{" "}
              {confidenceLabel(confidence.band)}
            </p>
          </section>
        )}

        <section style={styles.section}>
          <h2 style={styles.h2}>Evidence</h2>
          {evidenceRows.map((row) => (
            <div key={row.id} style={styles.item}>
              <strong>{row.title}</strong>
              <div>{row.summary}</div>
            </div>
          ))}
        </section>

        <section style={styles.section}>
          <h2 style={styles.h2}>Included Sections</h2>
          {Object.entries(config.includeSections)
            .filter(([, v]) => v)
            .map(([k]) => (
              <div key={k}>{sectionLabel(k as any)}</div>
            ))}
        </section>
      </div>
    </div>
  );
}

function Meta({ label, value }: any) {
  return (
    <div>
      <strong>{label}:</strong> {value}
    </div>
  );
}

const styles: any = {
  page: { padding: 24 },
  sheet: { maxWidth: 800, margin: "0 auto" },
  h1: { fontSize: 28, fontWeight: 800 },
  h2: { fontSize: 18, marginTop: 20 },
  p: { fontSize: 14 },
  section: { marginTop: 20 },
  item: { marginTop: 10 },
  meta: { display: "grid", gap: 6 },
  loading: { padding: 40 },
};