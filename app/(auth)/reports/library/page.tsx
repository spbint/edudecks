"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  archiveReportDraft,
  deleteReportDraft,
  duplicateReportDraft,
  finalizeReportDraft,
  listReportDrafts,
  marketLabel,
  modeLabel,
  periodLabel,
  submitReportDraft,
  type ReportDraftRow,
} from "@/lib/reportDrafts";
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

function selectedCount(row: ReportDraftRow) {
  return Array.isArray(row.selected_evidence_ids)
    ? row.selected_evidence_ids.length
    : 0;
}

function areaCount(row: ReportDraftRow) {
  return Array.isArray(row.selected_areas) ? row.selected_areas.length : 0;
}

function titleForRow(row: ReportDraftRow) {
  return safe(row.title) || `${row.child_name || "Child"} Report`;
}

function sortDrafts(rows: ReportDraftRow[]) {
  return [...rows].sort((a, b) => {
    const aa = safe(a.updated_at || a.created_at);
    const bb = safe(b.updated_at || b.created_at);
    if (aa === bb) return 0;
    return aa > bb ? -1 : 1;
  });
}

function getStatusMeta(status?: string | null): {
  label: string;
  tone: "secondary" | "info" | "success" | "danger";
  description: string;
  cardBorder: string;
  cardBackground: string;
} {
  const v = safe(status).toLowerCase();

  if (v === "submitted") {
    return {
      label: "Submitted",
      tone: "success",
      description:
        "This report has been submitted and is now treated as a locked artifact.",
      cardBorder: "#bbf7d0",
      cardBackground: "#f0fdf4",
    };
  }

  if (v === "final") {
    return {
      label: "Final",
      tone: "info",
      description:
        "This report has been finalized and locked. Duplicate it if you want to continue editing.",
      cardBorder: "#bfdbfe",
      cardBackground: "#eff6ff",
    };
  }

  if (v === "archived") {
    return {
      label: "Archived",
      tone: "danger",
      description:
        "This report has been archived. Keep it for record purposes or duplicate it into a fresh draft.",
      cardBorder: "#e5e7eb",
      cardBackground: "#f8fafc",
    };
  }

  return {
    label: "Draft",
    tone: "secondary",
    description:
      "This report is still editable and can continue through output and authority flows.",
    cardBorder: "#e5e7eb",
    cardBackground: "#ffffff",
  };
}

function getDraftReadiness(row: ReportDraftRow) {
  let score = 22;

  if (safe(row.child_name)) score += 10;
  if (selectedCount(row) >= 4) score += 24;
  else if (selectedCount(row) >= 2) score += 16;
  else if (selectedCount(row) >= 1) score += 8;

  if (areaCount(row) >= 4) score += 16;
  else if (areaCount(row) >= 2) score += 10;

  const coreCount = row.selected_evidence_ids.filter(
    (id) => row.selection_meta?.[id]?.role !== "appendix"
  ).length;
  if (coreCount >= 2) score += 8;

  const appendixCount = row.selected_evidence_ids.filter(
    (id) => row.selection_meta?.[id]?.role === "appendix"
  ).length;
  if (appendixCount >= 1) score += 4;

  const requiredCount = row.selected_evidence_ids.filter((id) =>
    Boolean(row.selection_meta?.[id]?.required)
  ).length;
  if (requiredCount >= 1) score += 4;

  if (row.include_action_plan) score += 4;
  if (row.include_weekly_plan) score += 4;
  if (row.include_appendix) score += 3;
  if (row.include_readiness_notes) score += 5;
  if (safe(row.notes).length >= 20) score += 6;
  if (safe(row.report_mode).toLowerCase() === "authority-ready") score += 4;
  if (safe(row.status).toLowerCase() === "final") score += 3;
  if (safe(row.status).toLowerCase() === "submitted") score += 5;

  score = Math.min(score, 100);

  if (score >= 80) {
    return { score, label: "Strong", tone: "success" as const };
  }
  if (score >= 60) {
    return { score, label: "Good", tone: "info" as const };
  }
  if (score >= 40) {
    return { score, label: "Developing", tone: "warning" as const };
  }
  return { score, label: "Needs work", tone: "danger" as const };
}

function latestEditableDraft(rows: ReportDraftRow[]) {
  return rows.find((row) => safe(row.status).toLowerCase() === "draft") || rows[0] || null;
}

function statusActionSet(status?: string | null) {
  const v = safe(status).toLowerCase();

  if (v === "submitted") {
    return {
      canEdit: false,
      canOutput: true,
      canAuthority: true,
      canFinalize: false,
      canSubmit: false,
      canArchive: false,
      canDuplicate: true,
      canDelete: false,
    };
  }

  if (v === "final") {
    return {
      canEdit: false,
      canOutput: true,
      canAuthority: true,
      canFinalize: false,
      canSubmit: true,
      canArchive: true,
      canDuplicate: true,
      canDelete: false,
    };
  }

  if (v === "archived") {
    return {
      canEdit: false,
      canOutput: true,
      canAuthority: false,
      canFinalize: false,
      canSubmit: false,
      canArchive: false,
      canDuplicate: true,
      canDelete: true,
    };
  }

  return {
    canEdit: true,
    canOutput: true,
    canAuthority: true,
    canFinalize: true,
    canSubmit: false,
    canArchive: true,
    canDuplicate: true,
    canDelete: true,
  };
}

export default function ReportsLibraryPage() {
  const [rows, setRows] = useState<ReportDraftRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [marketFilter, setMarketFilter] = useState("all");
  const [modeFilter, setModeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [busyId, setBusyId] = useState("");

  async function hydrate() {
    try {
      setLoading(true);
      setError("");
      const data = await listReportDrafts();
      setRows(sortDrafts(data));
    } catch (err: any) {
      setError(String(err?.message || err || "Failed to load report drafts."));
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
        titleForRow(row).toLowerCase().includes(q) ||
        safe(row.child_name).toLowerCase().includes(q) ||
        safe(row.id).toLowerCase().includes(q) ||
        safe(row.notes).toLowerCase().includes(q);

      const matchesMarket =
        marketFilter === "all" ||
        safe(row.preferred_market).toLowerCase() === marketFilter;

      const matchesMode =
        modeFilter === "all" ||
        safe(row.report_mode).toLowerCase() === modeFilter;

      const rowStatus = safe(row.status).toLowerCase() || "draft";
      const matchesStatus =
        statusFilter === "all" || rowStatus === statusFilter;

      return matchesQuery && matchesMarket && matchesMode && matchesStatus;
    });
  }, [rows, query, marketFilter, modeFilter, statusFilter]);

  const summary = useMemo(() => {
    return {
      total: filtered.length,
      draft: filtered.filter((x) => safe(x.status).toLowerCase() === "draft").length,
      final: filtered.filter((x) => safe(x.status).toLowerCase() === "final").length,
      submitted: filtered.filter((x) => safe(x.status).toLowerCase() === "submitted").length,
      archived: filtered.filter((x) => safe(x.status).toLowerCase() === "archived").length,
    };
  }, [filtered]);

  const continueRow = useMemo(() => latestEditableDraft(filtered), [filtered]);

  async function handleDuplicate(row: ReportDraftRow) {
    try {
      setBusyId(row.id);
      setError("");
      setMessage("");

      const copy = await duplicateReportDraft(row.id);
      await hydrate();

      setMessage(`Draft duplicated: ${titleForRow(copy)}.`);
    } catch (err: any) {
      setError(String(err?.message || err || "Failed to duplicate draft."));
    } finally {
      setBusyId("");
    }
  }

  async function handleDelete(row: ReportDraftRow) {
    const ok = window.confirm(
      `Delete "${titleForRow(row)}"? This cannot be undone.`
    );
    if (!ok) return;

    try {
      setBusyId(row.id);
      setError("");
      setMessage("");

      await deleteReportDraft(row.id);
      setRows((prev) => prev.filter((x) => x.id !== row.id));
      setMessage(`Draft deleted: ${titleForRow(row)}.`);
    } catch (err: any) {
      setError(String(err?.message || err || "Failed to delete draft."));
    } finally {
      setBusyId("");
    }
  }

  async function handleFinalize(row: ReportDraftRow) {
    try {
      setBusyId(row.id);
      setError("");
      setMessage("");

      await finalizeReportDraft(row.id);
      await hydrate();
      setMessage(`Draft finalized: ${titleForRow(row)}.`);
    } catch (err: any) {
      setError(String(err?.message || err || "Failed to finalize draft."));
    } finally {
      setBusyId("");
    }
  }

  async function handleSubmit(row: ReportDraftRow) {
    try {
      setBusyId(row.id);
      setError("");
      setMessage("");

      await submitReportDraft(row.id);
      await hydrate();
      setMessage(`Draft submitted: ${titleForRow(row)}.`);
    } catch (err: any) {
      setError(String(err?.message || err || "Failed to submit draft."));
    } finally {
      setBusyId("");
    }
  }

  async function handleArchive(row: ReportDraftRow) {
    try {
      setBusyId(row.id);
      setError("");
      setMessage("");

      await archiveReportDraft(row.id);
      await hydrate();
      setMessage(`Draft archived: ${titleForRow(row)}.`);
    } catch (err: any) {
      setError(String(err?.message || err || "Failed to archive draft."));
    } finally {
      setBusyId("");
    }
  }

  if (loading) {
    return (
      <main style={S.page()}>
        <div style={S.pageInner()}>
          <section style={S.card()}>
            <div style={S.h1()}>Reports Library</div>
            <div style={S.body()}>Loading saved report drafts…</div>
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
            <span style={{ ...S.mutedLink(), color: "#0f172a" }}>Library</span>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/reports" style={S.button(false)}>
              New report
            </Link>
            <Link href="/authority/history" style={S.button(false)}>
              Authority history
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
              <div style={S.label()}>Saved report drafts</div>
              <div style={S.display()}>
                Reopen, review, finalize, submit, and manage your report objects
              </div>
              <div style={S.body()}>
                This library is the calmer home for saved report drafts. Each row
                represents a reusable report object with child, market, mode,
                selected evidence, notes, and next-step pathways into output and
                authority workflows.
              </div>

              {continueRow ? (
                <div
                  style={{
                    ...S.softCard(),
                    marginTop: 16,
                    border: "1px solid #bfdbfe",
                    background: "#eff6ff",
                  }}
                >
                  <div style={S.label()}>Continue where you left off</div>
                  <div style={S.h3()}>{titleForRow(continueRow)}</div>
                  <div style={{ ...S.small(), marginTop: 6 }}>
                    {continueRow.child_name || "Child"} •{" "}
                    {modeLabel(continueRow.report_mode)} •{" "}
                    {periodLabel(continueRow.period_mode)} •{" "}
                    {marketLabel(continueRow.preferred_market)}
                  </div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
                    <Link href={`/reports?draftId=${continueRow.id}`} style={S.button(true)}>
                      Continue draft
                    </Link>
                    <Link
                      href={`/reports/output?draftId=${continueRow.id}`}
                      style={S.button(false)}
                    >
                      Open output
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>

            <div style={S.card()}>
              <div style={S.label()}>Library summary</div>
              <div style={S.h1()}>{summary.total}</div>
              <div style={S.small()}>
                saved report object{summary.total === 1 ? "" : "s"}
              </div>

              <div style={{ height: 12 }} />

              <div style={{ display: "grid", gap: 10 }}>
                <MiniStat label="Drafts" value={String(summary.draft)} />
                <MiniStat label="Final" value={String(summary.final)} />
                <MiniStat label="Submitted" value={String(summary.submitted)} />
                <MiniStat label="Archived" value={String(summary.archived)} />
              </div>
            </div>
          </div>
        </section>

        {message ? (
          <div style={{ ...S.statCard("success"), marginTop: 18 }}>
            <div style={S.small()}>{message}</div>
          </div>
        ) : null}

        {error ? (
          <div style={{ ...S.statCard("danger"), marginTop: 18 }}>
            <div style={S.small()}>{error}</div>
          </div>
        ) : null}

        <div style={{ height: 18 }} />

        <section style={S.card()}>
          <div style={S.h2()}>Filters</div>

          <div style={{ height: 12 }} />

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "minmax(240px,1.4fr) minmax(180px,0.8fr) minmax(220px,0.8fr) minmax(180px,0.75fr)",
              gap: 12,
            }}
          >
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search title, child, id, notes..."
              style={{ ...S.input(240), width: "100%" }}
            />

            <select
              value={marketFilter}
              onChange={(e) => setMarketFilter(e.target.value)}
              style={{ ...S.input(180), width: "100%" }}
            >
              <option value="all">All markets</option>
              <option value="au">Australia</option>
              <option value="uk">United Kingdom</option>
              <option value="us">United States</option>
            </select>

            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              style={{ ...S.input(220), width: "100%" }}
            >
              <option value="all">All modes</option>
              <option value="family-summary">Family Summary</option>
              <option value="authority-ready">Authority Ready</option>
              <option value="progress-review">Progress Review</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ ...S.input(180), width: "100%" }}
            >
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="final">Final</option>
              <option value="submitted">Submitted</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </section>

        <div style={{ height: 18 }} />

        <section style={S.card()}>
          <div style={S.h2()}>Saved reports</div>

          <div style={{ height: 12 }} />

          {!filtered.length ? (
            <div style={S.softCard()}>
              <div style={S.body()}>
                No report drafts were found for the current filter state.
              </div>
              <div style={S.small()}>
                Create a report in the builder and it will appear here.
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {filtered.map((row) => {
                const status = getStatusMeta(row.status);
                const readiness = getDraftReadiness(row);
                const actions = statusActionSet(row.status);
                const isBusy = busyId === row.id;

                return (
                  <div
                    key={row.id}
                    style={{
                      border: `1px solid ${status.cardBorder}`,
                      borderRadius: 16,
                      background: status.cardBackground,
                      padding: 16,
                      display: "grid",
                      gap: 12,
                      opacity: safe(row.status).toLowerCase() === "archived" ? 0.88 : 1,
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
                        <div style={S.h3()}>{titleForRow(row)}</div>
                        <div style={S.small()}>
                          {row.child_name || "Child"} • {modeLabel(row.report_mode)} •{" "}
                          {periodLabel(row.period_mode)} •{" "}
                          {marketLabel(row.preferred_market)}
                        </div>
                        <div style={{ ...S.small(), marginTop: 6 }}>
                          {status.description}
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <span style={S.pill(status.tone)}>{status.label}</span>
                        <span style={S.pill(readiness.tone)}>
                          {readiness.label} {readiness.score}%
                        </span>
                        <span style={S.pill("info")}>
                          {selectedCount(row)} selected
                        </span>
                        <span style={S.pill("secondary")}>
                          {areaCount(row)} areas
                        </span>
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
                        label="Selected evidence"
                        value={String(selectedCount(row))}
                      />
                      <MiniStat
                        label="Selected areas"
                        value={String(areaCount(row))}
                      />
                      <MiniStat
                        label="Last updated"
                        value={shortDate(row.updated_at || row.created_at)}
                      />
                    </div>

                    {safe(row.notes) ? (
                      <div style={S.softCard()}>
                        <div style={S.label()}>Draft note</div>
                        <div style={S.body()}>{safe(row.notes)}</div>
                      </div>
                    ) : null}

                    <div style={S.softCard()}>
                      <div style={S.label()}>Draft ID</div>
                      <div
                        style={{
                          fontSize: 13,
                          lineHeight: 1.5,
                          color: "#334155",
                          fontFamily:
                            'ui-monospace, SFMono-Regular, Menlo, monospace',
                          wordBreak: "break-word",
                        }}
                      >
                        {row.id}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      {actions.canEdit ? (
                        <Link
                          href={`/reports?draftId=${row.id}`}
                          style={S.button(true)}
                        >
                          Open builder
                        </Link>
                      ) : (
                        <Link
                          href={`/reports/output?draftId=${row.id}`}
                          style={S.button(true)}
                        >
                          View output
                        </Link>
                      )}

                      {actions.canOutput ? (
                        <Link
                          href={`/reports/output?draftId=${row.id}`}
                          style={S.button(false)}
                        >
                          Open output
                        </Link>
                      ) : null}

                      {actions.canAuthority ? (
                        <Link
                          href={`/authority/pack-builder?draftId=${row.id}`}
                          style={S.button(false)}
                        >
                          Authority pack
                        </Link>
                      ) : null}

                      {actions.canFinalize ? (
                        <button
                          type="button"
                          onClick={() => void handleFinalize(row)}
                          disabled={isBusy}
                          style={{
                            ...S.button(false),
                            borderColor: "#bfdbfe",
                            background: "#eff6ff",
                            color: "#2563eb",
                          }}
                        >
                          {isBusy ? "Working…" : "Finalize"}
                        </button>
                      ) : null}

                      {actions.canSubmit ? (
                        <button
                          type="button"
                          onClick={() => void handleSubmit(row)}
                          disabled={isBusy}
                          style={{
                            ...S.button(false),
                            borderColor: "#bbf7d0",
                            background: "#f0fdf4",
                            color: "#166534",
                          }}
                        >
                          {isBusy ? "Working…" : "Mark submitted"}
                        </button>
                      ) : null}

                      {actions.canArchive ? (
                        <button
                          type="button"
                          onClick={() => void handleArchive(row)}
                          disabled={isBusy}
                          style={{
                            ...S.button(false),
                            borderColor: "#fde68a",
                            background: "#fffbeb",
                            color: "#92400e",
                          }}
                        >
                          {isBusy ? "Working…" : "Archive"}
                        </button>
                      ) : null}

                      {actions.canDuplicate ? (
                        <button
                          type="button"
                          onClick={() => void handleDuplicate(row)}
                          disabled={isBusy}
                          style={S.button(false)}
                        >
                          {isBusy ? "Duplicating…" : "Duplicate"}
                        </button>
                      ) : null}

                      {actions.canDelete ? (
                        <button
                          type="button"
                          onClick={() => void handleDelete(row)}
                          disabled={isBusy}
                          style={{
                            ...S.button(false),
                            borderColor: "#fecdd3",
                            color: "#be123c",
                            background: "#fff1f2",
                          }}
                        >
                          {isBusy ? "Deleting…" : "Delete"}
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
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