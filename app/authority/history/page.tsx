"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  listAuthorityExportSnapshots,
  updateAuthorityExportSnapshotStatus,
  type AuthorityExportSnapshotRow,
  type AuthoritySubmissionStatus,
} from "@/lib/authorityExportSnapshots";
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
    return d.toLocaleString();
  } catch {
    return s.slice(0, 10);
  }
}

function exportTypeLabel(value?: string | null) {
  const v = safe(value).toLowerCase();
  if (v === "pdf") return "PDF";
  if (v === "docx") return "DOCX";
  if (v === "print") return "Print";
  return value || "Unknown";
}

function jurisdictionLabel(value?: string | null) {
  const v = safe(value).toLowerCase();
  if (v === "au") return "Australia";
  if (v === "uk") return "United Kingdom";
  if (v === "us") return "United States";
  return value || "Unknown";
}

function bandTone(
  band?: string | null
): "success" | "info" | "warning" | "danger" {
  const v = safe(band).toLowerCase();
  if (v === "ready") return "success";
  if (v === "strong") return "info";
  if (v === "developing") return "warning";
  return "danger";
}

function bandLabel(band?: string | null) {
  const v = safe(band).toLowerCase();
  if (v === "ready") return "Submission Ready";
  if (v === "strong") return "Strong";
  if (v === "developing") return "Developing";
  if (v === "attention") return "Needs Attention";
  return band || "Unknown";
}

function statusTone(
  status?: string | null
): "secondary" | "info" | "success" | "warning" | "danger" {
  const v = safe(status).toLowerCase();
  if (v === "approved") return "success";
  if (v === "submitted") return "info";
  if (v === "revision-needed") return "warning";
  if (v === "archived") return "danger";
  return "secondary";
}

function statusLabel(status?: string | null) {
  const v = safe(status).toLowerCase();
  if (v === "draft") return "Draft";
  if (v === "submitted") return "Submitted";
  if (v === "approved") return "Approved";
  if (v === "revision-needed") return "Needs Revision";
  if (v === "archived") return "Archived";
  return status || "Draft";
}

function historyActionHref(row: AuthorityExportSnapshotRow): string {
  const type = safe(row.export_type).toLowerCase();
  const draftId = safe(row.draft_id);

  if (!draftId) return "/authority/export";

  if (type === "print") {
    return `/authority/export/print?draftId=${draftId}`;
  }

  if (type === "pdf") {
    return `/authority/export?draftId=${draftId}&auto=pdf`;
  }

  if (type === "docx") {
    return `/authority/export?draftId=${draftId}&auto=docx`;
  }

  return `/authority/export?draftId=${draftId}`;
}

function historyActionLabel(row: AuthorityExportSnapshotRow): string {
  const type = safe(row.export_type).toLowerCase();

  if (type === "pdf") return "Download PDF again";
  if (type === "docx") return "Download DOCX again";
  if (type === "print") return "Open print again";
  return "Open export again";
}

type HistoryRowWithMeta = AuthorityExportSnapshotRow & {
  version: number;
  isLatest: boolean;
};

type HistoryGroup = {
  draftId: string;
  title: string;
  jurisdiction: string;
  rows: HistoryRowWithMeta[];
  latestRow: AuthorityExportSnapshotRow | null;
};

function buildGroups(rows: AuthorityExportSnapshotRow[]): HistoryGroup[] {
  const map = new Map<string, AuthorityExportSnapshotRow[]>();

  for (const row of rows) {
    const draftId = safe(row.draft_id) || "unknown-draft";
    if (!map.has(draftId)) {
      map.set(draftId, []);
    }
    map.get(draftId)!.push(row);
  }

  const groups: HistoryGroup[] = [];

  for (const [draftId, groupedRows] of map.entries()) {
    const sorted = [...groupedRows].sort((a, b) => {
      const aa = safe(a.created_at);
      const bb = safe(b.created_at);
      if (aa === bb) return 0;
      return aa > bb ? -1 : 1;
    });

    const enriched: HistoryRowWithMeta[] = sorted.map((row, index) => ({
      ...row,
      version: sorted.length - index,
      isLatest: index === 0,
    }));

    groups.push({
      draftId,
      title: safe(sorted[0]?.title) || "Untitled authority export",
      jurisdiction: safe(sorted[0]?.jurisdiction),
      rows: enriched,
      latestRow: sorted[0] || null,
    });
  }

  groups.sort((a, b) => {
    const aa = safe(a.latestRow?.created_at);
    const bb = safe(b.latestRow?.created_at);
    if (aa === bb) return 0;
    return aa > bb ? -1 : 1;
  });

  return groups;
}

type DiffState = {
  leftId: string;
  rightId: string;
} | null;

function toSet(items: string[]) {
  return new Set(items.map((x) => safe(x)).filter(Boolean));
}

function formatSignedDelta(n: number) {
  if (n > 0) return `+${n}`;
  if (n < 0) return `${n}`;
  return "0";
}

function buildDiffSummary(left: AuthorityExportSnapshotRow, right: AuthorityExportSnapshotRow) {
  const leftConfidence = left.confidence_score ?? 0;
  const rightConfidence = right.confidence_score ?? 0;
  const confidenceDelta = rightConfidence - leftConfidence;

  const leftEvidence = left.selected_evidence_ids.length;
  const rightEvidence = right.selected_evidence_ids.length;
  const evidenceDelta = rightEvidence - leftEvidence;

  const leftSections = left.included_sections.length;
  const rightSections = right.included_sections.length;
  const sectionsDelta = rightSections - leftSections;

  const parts: string[] = [];

  if (confidenceDelta !== 0) {
    parts.push(
      confidenceDelta > 0
        ? `confidence improved by ${confidenceDelta} points`
        : `confidence dropped by ${Math.abs(confidenceDelta)} points`
    );
  }

  if (evidenceDelta !== 0) {
    parts.push(
      evidenceDelta > 0
        ? `${evidenceDelta} more evidence item${evidenceDelta === 1 ? "" : "s"} included`
        : `${Math.abs(evidenceDelta)} fewer evidence item${Math.abs(evidenceDelta) === 1 ? "" : "s"} included`
    );
  }

  if (sectionsDelta !== 0) {
    parts.push(
      sectionsDelta > 0
        ? `${sectionsDelta} more section${sectionsDelta === 1 ? "" : "s"} included`
        : `${Math.abs(sectionsDelta)} fewer section${Math.abs(sectionsDelta) === 1 ? "" : "s"} included`
    );
  }

  if (safe(left.export_type).toLowerCase() !== safe(right.export_type).toLowerCase()) {
    parts.push(
      `export type changed from ${exportTypeLabel(left.export_type)} to ${exportTypeLabel(right.export_type)}`
    );
  }

  if (
    safe(left.submission_status).toLowerCase() !==
    safe(right.submission_status).toLowerCase()
  ) {
    parts.push(
      `submission status changed from ${statusLabel(left.submission_status)} to ${statusLabel(
        right.submission_status
      )}`
    );
  }

  if (!parts.length) {
    return "No major structured differences were detected between these two versions.";
  }

  return parts[0].charAt(0).toUpperCase() + parts[0].slice(1) + ". " + parts.slice(1).join(". ") + (parts.length > 1 ? "." : "");
}

export default function AuthorityHistoryPage() {
  const [rows, setRows] = useState<AuthorityExportSnapshotRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [jurisdiction, setJurisdiction] = useState("all");
  const [exportType, setExportType] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [savingStatusId, setSavingStatusId] = useState("");
  const [diffState, setDiffState] = useState<DiffState>(null);

  async function hydrate() {
    try {
      setLoading(true);
      setError("");
      const data = await listAuthorityExportSnapshots();
      setRows(data);
    } catch (err: any) {
      setError(String(err?.message || err || "Failed to load export history."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void hydrate();
  }, []);

  const filtered = useMemo(() => {
    const q = safe(query).toLowerCase();

    return rows.filter((row) => {
      const matchesQuery =
        !q ||
        safe(row.title).toLowerCase().includes(q) ||
        safe(row.draft_id).toLowerCase().includes(q) ||
        safe(row.student_id).toLowerCase().includes(q) ||
        safe(row.confidence_band).toLowerCase().includes(q) ||
        safe(row.submission_status).toLowerCase().includes(q);

      const matchesJurisdiction =
        jurisdiction === "all" ||
        safe(row.jurisdiction).toLowerCase() === jurisdiction;

      const matchesExportType =
        exportType === "all" ||
        safe(row.export_type).toLowerCase() === exportType;

      const matchesStatus =
        statusFilter === "all" ||
        safe(row.submission_status).toLowerCase() === statusFilter;

      return (
        matchesQuery &&
        matchesJurisdiction &&
        matchesExportType &&
        matchesStatus
      );
    });
  }, [rows, query, jurisdiction, exportType, statusFilter]);

  const grouped = useMemo(() => buildGroups(filtered), [filtered]);

  const summary = useMemo(() => {
    const pdf = filtered.filter(
      (x) => safe(x.export_type).toLowerCase() === "pdf"
    ).length;
    const docx = filtered.filter(
      (x) => safe(x.export_type).toLowerCase() === "docx"
    ).length;
    const print = filtered.filter(
      (x) => safe(x.export_type).toLowerCase() === "print"
    ).length;

    const submitted = filtered.filter(
      (x) => safe(x.submission_status).toLowerCase() === "submitted"
    ).length;
    const approved = filtered.filter(
      (x) => safe(x.submission_status).toLowerCase() === "approved"
    ).length;
    const revisionNeeded = filtered.filter(
      (x) => safe(x.submission_status).toLowerCase() === "revision-needed"
    ).length;

    return {
      total: filtered.length,
      drafts: grouped.length,
      pdf,
      docx,
      print,
      submitted,
      approved,
      revisionNeeded,
    };
  }, [filtered, grouped]);

  const diffPair = useMemo(() => {
    if (!diffState) return null;
    const left = rows.find((r) => r.id === diffState.leftId) || null;
    const right = rows.find((r) => r.id === diffState.rightId) || null;
    if (!left || !right) return null;

    const leftEvidenceSet = toSet(left.selected_evidence_ids);
    const rightEvidenceSet = toSet(right.selected_evidence_ids);

    const leftSectionSet = toSet(left.included_sections);
    const rightSectionSet = toSet(right.included_sections);

    const addedEvidence = [...rightEvidenceSet].filter((x) => !leftEvidenceSet.has(x));
    const removedEvidence = [...leftEvidenceSet].filter((x) => !rightEvidenceSet.has(x));
    const addedSections = [...rightSectionSet].filter((x) => !leftSectionSet.has(x));
    const removedSections = [...leftSectionSet].filter((x) => !rightSectionSet.has(x));

    return {
      left,
      right,
      confidenceDelta: (right.confidence_score ?? 0) - (left.confidence_score ?? 0),
      evidenceDelta: right.selected_evidence_ids.length - left.selected_evidence_ids.length,
      sectionsDelta: right.included_sections.length - left.included_sections.length,
      addedEvidence,
      removedEvidence,
      addedSections,
      removedSections,
      summary: buildDiffSummary(left, right),
    };
  }, [diffState, rows]);

  async function handleStatusChange(
    snapshotId: string,
    submissionStatus: AuthoritySubmissionStatus
  ) {
    try {
      setSavingStatusId(snapshotId);
      setError("");
      await updateAuthorityExportSnapshotStatus({
        snapshotId,
        submissionStatus,
      });

      setRows((prev) =>
        prev.map((row) =>
          row.id === snapshotId
            ? { ...row, submission_status: submissionStatus }
            : row
        )
      );
    } catch (err: any) {
      setError(
        String(err?.message || err || "Failed to update submission status.")
      );
    } finally {
      setSavingStatusId("");
    }
  }

  function openDiff(leftId: string, rightId: string) {
    setDiffState({ leftId, rightId });
  }

  if (loading) {
    return (
      <main style={S.page()}>
        <div style={S.pageInner()}>
          <section style={S.card()}>
            <div style={S.h1()}>Authority Export History</div>
            <div style={S.body()}>Loading export history…</div>
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
            <span style={{ ...S.mutedLink(), color: "#0f172a" }}>History</span>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/authority/pack-builder" style={S.button(false)}>
              Pack Builder
            </Link>
            <Link href="/authority/export" style={S.button(false)}>
              Export
            </Link>
            <Link href="/authority/readiness" style={S.button(true)}>
              Readiness
            </Link>
          </div>
        </div>
      </div>

      <div style={S.pageInner()}>
        <section style={S.hero()}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0,1.25fr) minmax(320px,0.95fr)",
              gap: 24,
              alignItems: "start",
            }}
          >
            <div>
              <div style={S.label()}>Authority export history</div>
              <div style={S.display()}>
                Review saved export versions, lifecycle, and change history
              </div>
              <div style={S.body()}>
                This page now shows not only export versions and submission status,
                but also what changed between versions so you can see whether a
                revision genuinely strengthened the pack.
              </div>
            </div>

            <div style={S.card()}>
              <div style={S.label()}>History summary</div>
              <div style={S.h1()}>{summary.total}</div>
              <div style={S.small()}>
                saved export event{summary.total === 1 ? "" : "s"}
              </div>

              <div style={{ height: 12 }} />

              <div style={{ display: "grid", gap: 10 }}>
                <MiniStat label="Draft groups" value={String(summary.drafts)} />
                <MiniStat label="Submitted" value={String(summary.submitted)} />
                <MiniStat label="Approved" value={String(summary.approved)} />
                <MiniStat
                  label="Needs revision"
                  value={String(summary.revisionNeeded)}
                />
              </div>
            </div>
          </div>
        </section>

        {error ? (
          <div style={{ ...S.statCard("danger"), marginTop: 18 }}>
            <div style={S.small()}>{error}</div>
          </div>
        ) : null}

        {diffPair ? (
          <section style={{ ...S.card(), marginTop: 18 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <div>
                <div style={S.h2()}>Version diff view</div>
                <div style={S.small()}>
                  Comparing {safe(diffPair.left.title) || "Earlier version"} with{" "}
                  {safe(diffPair.right.title) || "Later version"}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDiffState(null)}
                style={S.button(false)}
              >
                Close diff
              </button>
            </div>

            <div style={{ height: 14 }} />

            <div style={S.softCard()}>
              <div style={S.label()}>Plain-English summary</div>
              <div style={S.body()}>{diffPair.summary}</div>
            </div>

            <div style={{ height: 14 }} />

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)",
                gap: 14,
              }}
            >
              <div style={S.softCard()}>
                <div style={S.label()}>Earlier version</div>
                <div style={S.h3()}>
                  {exportTypeLabel(diffPair.left.export_type)} •{" "}
                  {statusLabel(diffPair.left.submission_status)}
                </div>
                <div style={S.small()}>
                  {shortDate(diffPair.left.created_at)}
                </div>
                <div style={{ height: 10 }} />
                <SummaryRow
                  label="Confidence"
                  value={
                    diffPair.left.confidence_score == null
                      ? "—"
                      : `${diffPair.left.confidence_score}%`
                  }
                />
                <SummaryRow
                  label="Evidence"
                  value={String(diffPair.left.selected_evidence_ids.length)}
                />
                <SummaryRow
                  label="Sections"
                  value={String(diffPair.left.included_sections.length)}
                />
              </div>

              <div style={S.softCard()}>
                <div style={S.label()}>Later version</div>
                <div style={S.h3()}>
                  {exportTypeLabel(diffPair.right.export_type)} •{" "}
                  {statusLabel(diffPair.right.submission_status)}
                </div>
                <div style={S.small()}>
                  {shortDate(diffPair.right.created_at)}
                </div>
                <div style={{ height: 10 }} />
                <SummaryRow
                  label="Confidence"
                  value={
                    diffPair.right.confidence_score == null
                      ? "—"
                      : `${diffPair.right.confidence_score}%`
                  }
                />
                <SummaryRow
                  label="Evidence"
                  value={String(diffPair.right.selected_evidence_ids.length)}
                />
                <SummaryRow
                  label="Sections"
                  value={String(diffPair.right.included_sections.length)}
                />
              </div>
            </div>

            <div style={{ height: 14 }} />

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 12,
              }}
            >
              <MetricCard
                title="Confidence delta"
                value={formatSignedDelta(diffPair.confidenceDelta)}
                tone={
                  diffPair.confidenceDelta > 0
                    ? "success"
                    : diffPair.confidenceDelta < 0
                    ? "danger"
                    : "secondary"
                }
                text="How much confidence changed between the two versions."
              />
              <MetricCard
                title="Evidence delta"
                value={formatSignedDelta(diffPair.evidenceDelta)}
                tone={
                  diffPair.evidenceDelta > 0
                    ? "success"
                    : diffPair.evidenceDelta < 0
                    ? "warning"
                    : "secondary"
                }
                text="How many evidence items were added or removed."
              />
              <MetricCard
                title="Sections delta"
                value={formatSignedDelta(diffPair.sectionsDelta)}
                tone={
                  diffPair.sectionsDelta > 0
                    ? "info"
                    : diffPair.sectionsDelta < 0
                    ? "warning"
                    : "secondary"
                }
                text="How the pack structure changed between versions."
              />
            </div>

            <div style={{ height: 14 }} />

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)",
                gap: 14,
              }}
            >
              <div style={S.softCard()}>
                <div style={S.label()}>Added sections</div>
                {diffPair.addedSections.length ? (
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      flexWrap: "wrap",
                      marginTop: 8,
                    }}
                  >
                    {diffPair.addedSections.map((item) => (
                      <span key={item} style={S.pill("success")}>
                        {item}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div style={{ ...S.small(), marginTop: 8 }}>None</div>
                )}
              </div>

              <div style={S.softCard()}>
                <div style={S.label()}>Removed sections</div>
                {diffPair.removedSections.length ? (
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      flexWrap: "wrap",
                      marginTop: 8,
                    }}
                  >
                    {diffPair.removedSections.map((item) => (
                      <span key={item} style={S.pill("warning")}>
                        {item}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div style={{ ...S.small(), marginTop: 8 }}>None</div>
                )}
              </div>
            </div>

            <div style={{ height: 14 }} />

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)",
                gap: 14,
              }}
            >
              <div style={S.softCard()}>
                <div style={S.label()}>Added evidence IDs</div>
                {diffPair.addedEvidence.length ? (
                  <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
                    {diffPair.addedEvidence.slice(0, 10).map((item) => (
                      <div key={item} style={S.small()}>
                        + {item}
                      </div>
                    ))}
                    {diffPair.addedEvidence.length > 10 ? (
                      <div style={S.small()}>
                        + {diffPair.addedEvidence.length - 10} more
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div style={{ ...S.small(), marginTop: 8 }}>None</div>
                )}
              </div>

              <div style={S.softCard()}>
                <div style={S.label()}>Removed evidence IDs</div>
                {diffPair.removedEvidence.length ? (
                  <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
                    {diffPair.removedEvidence.slice(0, 10).map((item) => (
                      <div key={item} style={S.small()}>
                        − {item}
                      </div>
                    ))}
                    {diffPair.removedEvidence.length > 10 ? (
                      <div style={S.small()}>
                        + {diffPair.removedEvidence.length - 10} more
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div style={{ ...S.small(), marginTop: 8 }}>None</div>
                )}
              </div>
            </div>
          </section>
        ) : null}

        <div style={{ height: 18 }} />

        <section style={S.card()}>
          <div style={S.h2()}>Filters</div>

          <div style={{ height: 12 }} />

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "minmax(240px,1.4fr) minmax(180px,0.8fr) minmax(180px,0.8fr) minmax(180px,0.8fr)",
              gap: 12,
            }}
          >
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search title, draft id, student id, band, status..."
              style={{ ...S.input(240), width: "100%" }}
            />

            <select
              value={jurisdiction}
              onChange={(e) => setJurisdiction(e.target.value)}
              style={{ ...S.input(180), width: "100%" }}
            >
              <option value="all">All markets</option>
              <option value="au">Australia</option>
              <option value="uk">United Kingdom</option>
              <option value="us">United States</option>
            </select>

            <select
              value={exportType}
              onChange={(e) => setExportType(e.target.value)}
              style={{ ...S.input(180), width: "100%" }}
            >
              <option value="all">All export types</option>
              <option value="pdf">PDF</option>
              <option value="docx">DOCX</option>
              <option value="print">Print</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ ...S.input(180), width: "100%" }}
            >
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="revision-needed">Needs Revision</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </section>

        <div style={{ height: 18 }} />

        <section style={S.card()}>
          <div style={S.h2()}>Saved export history</div>

          <div style={{ height: 12 }} />

          {!grouped.length ? (
            <div style={S.softCard()}>
              <div style={S.body()}>
                No export history found for the current filter state.
              </div>
              <div style={S.small()}>
                Export a pack from the authority export page and it will appear
                here.
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 18 }}>
              {grouped.map((group) => (
                <section
                  key={group.draftId}
                  style={{
                    border: "1px solid #dbe4f0",
                    borderRadius: 18,
                    background: "#ffffff",
                    padding: 16,
                    display: "grid",
                    gap: 14,
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
                      <div style={S.h3()}>{group.title}</div>
                      <div style={S.small()}>
                        Draft ID: {group.draftId} •{" "}
                        {jurisdictionLabel(group.jurisdiction)} • Latest export:{" "}
                        {shortDate(group.latestRow?.created_at)}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <span style={S.pill("primary")}>
                        {group.rows.length} version
                        {group.rows.length === 1 ? "" : "s"}
                      </span>
                      {group.latestRow?.submission_status ? (
                        <span
                          style={S.pill(
                            statusTone(group.latestRow.submission_status)
                          )}
                        >
                          {statusLabel(group.latestRow.submission_status)}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(180px, 1fr))",
                      gap: 10,
                    }}
                  >
                    <MiniStat
                      label="Latest confidence"
                      value={
                        group.latestRow?.confidence_score == null
                          ? "—"
                          : `${group.latestRow.confidence_score}%`
                      }
                    />
                    <MiniStat
                      label="Latest evidence"
                      value={String(
                        group.latestRow?.selected_evidence_ids?.length ?? 0
                      )}
                    />
                    <MiniStat
                      label="Latest sections"
                      value={String(
                        group.latestRow?.included_sections?.length ?? 0
                      )}
                    />
                  </div>

                  <div style={{ display: "grid", gap: 10 }}>
                    {group.rows.map((row, index) => {
                      const previousRow =
                        index < group.rows.length - 1
                          ? group.rows[index + 1]
                          : null;

                      return (
                        <div
                          key={row.id}
                          style={{
                            border: "1px solid #e5e7eb",
                            borderRadius: 14,
                            background: row.isLatest ? "#f8fafc" : "#ffffff",
                            padding: 14,
                            display: "grid",
                            gap: 12,
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
                              <div
                                style={{
                                  display: "flex",
                                  gap: 8,
                                  flexWrap: "wrap",
                                  alignItems: "center",
                                }}
                              >
                                <span style={S.pill("secondary")}>
                                  Version v{row.version}
                                </span>
                                {row.isLatest ? (
                                  <span style={S.pill("success")}>Latest</span>
                                ) : null}
                                <span style={S.pill("primary")}>
                                  {exportTypeLabel(row.export_type)}
                                </span>
                                <span
                                  style={S.pill(bandTone(row.confidence_band))}
                                >
                                  {bandLabel(row.confidence_band)}
                                </span>
                                <span
                                  style={S.pill(
                                    statusTone(row.submission_status)
                                  )}
                                >
                                  {statusLabel(row.submission_status)}
                                </span>
                              </div>

                              <div style={{ height: 8 }} />

                              <div style={S.small()}>
                                {shortDate(row.created_at)} • Evidence:{" "}
                                {row.selected_evidence_ids.length} • Sections:{" "}
                                {row.included_sections.length}
                              </div>
                            </div>

                            <div
                              style={{
                                fontSize: 22,
                                fontWeight: 900,
                                color: "#0f172a",
                              }}
                            >
                              {row.confidence_score == null
                                ? "—"
                                : `${row.confidence_score}%`}
                            </div>
                          </div>

                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns:
                                "minmax(220px, 1fr) minmax(220px, 1fr)",
                              gap: 12,
                              alignItems: "start",
                            }}
                          >
                            <div>
                              <div style={S.label()}>Submission status</div>
                              <select
                                value={
                                  safe(row.submission_status).toLowerCase() ||
                                  "draft"
                                }
                                onChange={(e) =>
                                  void handleStatusChange(
                                    row.id,
                                    e.target
                                      .value as AuthoritySubmissionStatus
                                  )
                                }
                                disabled={savingStatusId === row.id}
                                style={{ ...S.input(220), width: "100%" }}
                              >
                                <option value="draft">Draft</option>
                                <option value="submitted">Submitted</option>
                                <option value="approved">Approved</option>
                                <option value="revision-needed">
                                  Needs Revision
                                </option>
                                <option value="archived">Archived</option>
                              </select>
                            </div>

                            <div style={S.softCard()}>
                              <div style={S.label()}>Lifecycle meaning</div>
                              <div style={S.small()}>
                                {safe(row.submission_status).toLowerCase() ===
                                "submitted"
                                  ? "This version has been used as a formal submission."
                                  : safe(row.submission_status).toLowerCase() ===
                                    "approved"
                                  ? "This version has been accepted and can be treated as settled."
                                  : safe(row.submission_status).toLowerCase() ===
                                    "revision-needed"
                                  ? "This version needs further work before it can be relied on."
                                  : safe(row.submission_status).toLowerCase() ===
                                    "archived"
                                  ? "This version is being retained for record-keeping only."
                                  : "This version is still a draft working state."}
                              </div>
                            </div>
                          </div>

                          <div
                            style={{ display: "flex", gap: 10, flexWrap: "wrap" }}
                          >
                            <Link
                              href={historyActionHref(row)}
                              style={S.button(true)}
                            >
                              {historyActionLabel(row)}
                            </Link>

                            <Link
                              href={`/authority/export?draftId=${row.draft_id}`}
                              style={S.button(false)}
                            >
                              Reopen export
                            </Link>

                            <Link
                              href={`/authority/pack-builder?draftId=${row.draft_id}`}
                              style={S.button(false)}
                            >
                              Open builder
                            </Link>

                            <Link
                              href={`/reports/output?draftId=${row.draft_id}`}
                              style={S.button(false)}
                            >
                              Open report output
                            </Link>

                            {previousRow ? (
                              <button
                                type="button"
                                onClick={() => openDiff(previousRow.id, row.id)}
                                style={S.button(false)}
                              >
                                Compare with previous
                              </button>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </section>
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
  tone: "success" | "info" | "warning" | "danger" | "secondary";
}) {
  const tones: Record<
    "success" | "info" | "warning" | "danger" | "secondary",
    { bg: string; bd: string; fg: string }
  > = {
    success: { bg: "#ecfdf5", bd: "#a7f3d0", fg: "#166534" },
    info: { bg: "#ecfeff", bd: "#a5f3fc", fg: "#0c4a6e" },
    warning: { bg: "#fff7ed", bd: "#fed7aa", fg: "#9a3412" },
    danger: { bg: "#fff1f2", bd: "#fecdd3", fg: "#be123c" },
    secondary: { bg: "#f8fafc", bd: "#e5e7eb", fg: "#475569" },
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