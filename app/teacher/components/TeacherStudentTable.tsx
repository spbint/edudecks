"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

/* ───────────────────────────── TYPES ───────────────────────────── */

type StudentRow = {
  id: string;
  first_name: string | null;
  preferred_name: string | null;
  is_ilp: boolean | null;
  class_id: string | null;
};

type Props = {
  students: StudentRow[];
  classId?: string;
};

type EvidenceLite = {
  id: string;
  student_id: string;
  occurred_at: string; // ISO string (derived)
  evidence_type?: string | null;
  title?: string | null;
  details?: string | null; // derived from note_text/description/summary
  is_confidential?: boolean | null;
};

type ViewMode =
  | "all"
  | "needs_attention"
  | "no_evidence"
  | "stale_14"
  | "evidence_today";

/* ───────────────────────────── COMPONENT ───────────────────────────── */

export default function TeacherStudentTable({ students, classId }: Props) {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [showILPOnly, setShowILPOnly] = useState(false);

  // selection + bulk UI
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkPanelOpen, setBulkPanelOpen] = useState(false);
  const [bulkIndex, setBulkIndex] = useState(0);

  // placeholder-only local actions
  const [noteDraft, setNoteDraft] = useState("");
  const [noteOpen, setNoteOpen] = useState(false);
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(new Set());

  // Evidence cache (read-only list + quick add writes)
  const [evLoading, setEvLoading] = useState(false);
  const [evErr, setEvErr] = useState("");
  const [evByStudent, setEvByStudent] = useState<Map<string, EvidenceLite[]>>(
    new Map()
  );

  // View filters
  const [viewMode, setViewMode] = useState<ViewMode>("all");

  // Quick Add Evidence modal
  const [qaOpen, setQaOpen] = useState(false);
  const [qaScope, setQaScope] = useState<"single" | "bulk">("single");
  const [qaStudentId, setQaStudentId] = useState<string | null>(null);
  const [qaSaving, setQaSaving] = useState(false);
  const [qaErr, setQaErr] = useState("");

  const [qaType, setQaType] = useState<string>("Observation");
  const [qaTitle, setQaTitle] = useState<string>("");
  const [qaNote, setQaNote] = useState<string>("");
  const [qaConfidential, setQaConfidential] = useState<boolean>(false);
  const [qaDate, setQaDate] = useState<string>(() => {
    // yyyy-mm-dd
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${mm}-${dd}`;
  });

  const studentName = (s: StudentRow) => {
    const pref = (s.preferred_name ?? "").trim();
    const first = (s.first_name ?? "").trim();
    return pref || first || "Unnamed student";
  };

  const classStudents = useMemo(() => {
    return students.filter((s) => (classId ? s.class_id === classId : true));
  }, [students, classId]);

  /* ───────────────────────── Evidence loader (schema-safe) ───────────────────────── */

  const loadEvidence = async () => {
    setEvLoading(true);
    setEvErr("");

    try {
      const ids = classStudents.map((s) => s.id).filter(Boolean);
      if (ids.length === 0) {
        setEvByStudent(new Map());
        setEvLoading(false);
        return;
      }

      // IMPORTANT: your schema does NOT have evidence_entries.details.
      // We only select columns that are common / likely.
      const selectOptions = [
        // safest (note_text is common in your project)
        "id, student_id, occurred_on, created_at, evidence_type, title, note_text, is_confidential",
        "id, student_id, occurred_on, created_at, type, title, note_text, is_confidential",
        // fallback (no occurred_on)
        "id, student_id, created_at, evidence_type, title, note_text, is_confidential",
        "id, student_id, created_at, type, title, note_text, is_confidential",
        // last resort (minimal)
        "id, student_id, created_at, note_text",
      ];

      let data: any[] | null = null;
      let lastError: any = null;

      for (const sel of selectOptions) {
        // Try ordering by created_at first (nearly always exists)
        const r1 = await supabase
          .from("evidence_entries")
          .select(sel)
          .in("student_id", ids)
          .order("created_at", { ascending: false })
          .limit(700);

        if (!r1.error) {
          data = (r1.data as any[]) ?? [];
          lastError = null;
          break;
        }

        // Try ordering by occurred_on if present
        const r2 = await supabase
          .from("evidence_entries")
          .select(sel)
          .in("student_id", ids)
          .order("occurred_on", { ascending: false })
          .limit(700);

        if (!r2.error) {
          data = (r2.data as any[]) ?? [];
          lastError = null;
          break;
        }

        lastError = r2.error || r1.error;
      }

      if (!data)
        throw new Error(
          lastError?.message ??
            "Failed to load evidence_entries (schema mismatch)."
        );

      const byStudent = new Map<string, EvidenceLite[]>();

      for (const row of data) {
        const sid = String(row.student_id ?? "");
        if (!sid) continue;

        const occurred =
          row.occurred_on ??
          row.occurred_at ??
          row.created_at ??
          new Date().toISOString();

        const details =
          row.note_text ??
          row.description ??
          row.summary ??
          row.notes ??
          row.note ??
          null;

        const lite: EvidenceLite = {
          id: String(row.id ?? `${sid}-${occurred}`),
          student_id: sid,
          occurred_at: new Date(occurred).toISOString(),
          evidence_type: (row.evidence_type ?? row.type ?? null) as any,
          title: (row.title ?? null) as any,
          details: (details ?? null) as any,
          is_confidential: (row.is_confidential ?? row.confidential ?? null) as any,
        };

        const arr = byStudent.get(sid) ?? [];
        arr.push(lite);
        byStudent.set(sid, arr);
      }

      // keep latest 10 per student
      for (const [sid, arr] of byStudent.entries()) {
        arr.sort((a, b) => (a.occurred_at < b.occurred_at ? 1 : -1));
        byStudent.set(sid, arr.slice(0, 10));
      }

      setEvByStudent(byStudent);
    } catch (e: any) {
      console.error("TeacherStudentTable loadEvidence() failed:", e);
      setEvErr(e?.message ?? "Failed to load evidence.");
      setEvByStudent(new Map());
    } finally {
      setEvLoading(false);
    }
  };

  useEffect(() => {
    loadEvidence();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, students]);

  /* ───────────────────────── Evidence-derived helpers ───────────────────────── */

  const lastEvidenceTimeByStudent = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of classStudents) {
      const arr = evByStudent.get(s.id) ?? [];
      if (!arr.length) continue;
      const t = new Date(arr[0].occurred_at).getTime();
      if (Number.isFinite(t)) m.set(s.id, t);
    }
    return m;
  }, [classStudents, evByStudent]);

  const startOfTodayMs = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  }, []);

  const staleCutoffMs = useMemo(() => {
    const msDay = 24 * 60 * 60 * 1000;
    return startOfTodayMs - 14 * msDay;
  }, [startOfTodayMs]);

  const studentHasEvidenceToday = (sid: string) => {
    const arr = evByStudent.get(sid) ?? [];
    if (!arr.length) return false;
    return new Date(arr[0].occurred_at).getTime() >= startOfTodayMs;
  };

  const studentIsStale14 = (sid: string) => {
    const last = lastEvidenceTimeByStudent.get(sid);
    if (!last) return false;
    return last < staleCutoffMs;
  };

  const studentHasNoEvidence = (sid: string) => {
    return !lastEvidenceTimeByStudent.get(sid);
  };

  const needsAttention = (sid: string) => {
    return studentHasNoEvidence(sid) || studentIsStale14(sid);
  };

  /* ───────────────────────── Filters + sorting ───────────────────────── */

  const baseFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return classStudents
      .filter((s) => (showILPOnly ? !!s.is_ilp : true))
      .filter((s) => {
        if (!q) return true;
        return (
          studentName(s).toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q)
        );
      });
  }, [classStudents, showILPOnly, search]);

  const viewFiltered = useMemo(() => {
    const list = baseFiltered.slice();

    if (viewMode === "all") return list;
    if (viewMode === "needs_attention") return list.filter((s) => needsAttention(s.id));
    if (viewMode === "no_evidence") return list.filter((s) => studentHasNoEvidence(s.id));
    if (viewMode === "stale_14") return list.filter((s) => studentIsStale14(s.id));
    if (viewMode === "evidence_today") return list.filter((s) => studentHasEvidenceToday(s.id));

    return list;
  }, [baseFiltered, viewMode, evByStudent, lastEvidenceTimeByStudent, staleCutoffMs, startOfTodayMs]);

  const filtered = useMemo(() => {
    const list = viewFiltered.slice();
    const lastTime = (sid: string) => lastEvidenceTimeByStudent.get(sid) ?? 0;

    if (viewMode === "needs_attention" || viewMode === "no_evidence" || viewMode === "stale_14") {
      // Worst-first: none first, then stalest first
      list.sort((a, b) => {
        const aNone = studentHasNoEvidence(a.id) ? 1 : 0;
        const bNone = studentHasNoEvidence(b.id) ? 1 : 0;
        if (aNone !== bNone) return bNone - aNone; // 1 before 0
        return lastTime(a.id) - lastTime(b.id);
      });
      return list;
    }

    if (viewMode === "evidence_today") {
      list.sort((a, b) => lastTime(b.id) - lastTime(a.id));
      return list;
    }

    list.sort((a, b) => studentName(a).localeCompare(studentName(b)));
    return list;
  }, [viewFiltered, viewMode, lastEvidenceTimeByStudent, evByStudent]);

  const viewCounts = useMemo(() => {
    let all = baseFiltered.length;
    let needs = 0;
    let none = 0;
    let stale = 0;
    let today = 0;

    for (const s of baseFiltered) {
      const sid = s.id;
      const isNone = studentHasNoEvidence(sid);
      const isStale = studentIsStale14(sid);
      const isToday = studentHasEvidenceToday(sid);

      if (isNone) none += 1;
      if (isStale) stale += 1;
      if (isToday) today += 1;
      if (isNone || isStale) needs += 1;
    }

    return { all, needs, none, stale, today };
  }, [baseFiltered, lastEvidenceTimeByStudent, evByStudent, staleCutoffMs, startOfTodayMs]);

  /* ───────────────────────── Selection helpers ───────────────────────── */

  const selectedList = useMemo(() => {
    const byId = new Map(filtered.map((s) => [s.id, s]));
    return Array.from(selectedIds)
      .map((id) => byId.get(id))
      .filter(Boolean) as StudentRow[];
  }, [selectedIds, filtered]);

  const allVisibleSelected = useMemo(() => {
    if (filtered.length === 0) return false;
    return filtered.every((s) => selectedIds.has(s.id));
  }, [filtered, selectedIds]);

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const s of filtered) next.delete(s.id);
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const s of filtered) next.add(s.id);
        return next;
      });
    }
  };

  /* ───────────────────────── Bulk actions ───────────────────────── */

  const openBulkEvidenceQueue = () => {
    if (selectedList.length === 0) return;
    setBulkIndex(0);
    setBulkPanelOpen(true);
  };

  const openCurrentFromQueue = () => {
    const s = selectedList[bulkIndex];
    if (!s) return;
    router.push(`/students/${s.id}`);
  };

  const openSelectedInTabs = () => {
    const ids = selectedList.map((s) => s.id);
    for (const id of ids) window.open(`/students/${id}`, "_blank");
  };

  const openNotesModal = () => {
    if (selectedList.length === 0) return;
    setNoteDraft("");
    setNoteOpen(true);
  };

  const applyNotePlaceholder = () => setNoteOpen(false);

  const toggleFlagPlaceholder = () => {
    setFlaggedIds((prev) => {
      const next = new Set(prev);
      for (const s of selectedList) {
        if (next.has(s.id)) next.delete(s.id);
        else next.add(s.id);
      }
      return next;
    });
  };

  /* ───────────────────────── Quick Add Evidence (writes) ───────────────────────── */

  const openQuickAddSingle = (studentId: string) => {
    setQaScope("single");
    setQaStudentId(studentId);
    setQaErr("");
    setQaType("Observation");
    setQaTitle("");
    setQaNote("");
    setQaConfidential(false);
    setQaOpen(true);
  };

  const openQuickAddBulk = () => {
    if (selectedList.length === 0) return;
    setQaScope("bulk");
    setQaStudentId(null);
    setQaErr("");
    setQaType("Observation");
    setQaTitle("");
    setQaNote("");
    setQaConfidential(false);
    setQaOpen(true);
  };

  const closeQuickAdd = () => {
    if (qaSaving) return;
    setQaOpen(false);
  };

  const buildOccurredISO = () => {
    // Store as ISO so we can reuse for occurred_on OR occurred_at attempts.
    // Use midday to avoid timezone weirdness for date-only schemas.
    const d = new Date(`${qaDate}T12:00:00`);
    return d.toISOString();
  };

  const insertEvidenceForStudent = async (student_id: string) => {
    const occurredISO = buildOccurredISO();

    // Try several payload shapes to match whatever your table expects.
    // Key point: NEVER use evidence_entries.details (doesn't exist).
    const attempts: any[] = [
      // common in our codebase
      {
        student_id,
        occurred_on: qaDate, // date-only
        evidence_type: qaType,
        title: qaTitle || null,
        note_text: qaNote || null,
        is_confidential: qaConfidential,
      },
      {
        student_id,
        occurred_on: qaDate,
        type: qaType,
        title: qaTitle || null,
        note_text: qaNote || null,
        is_confidential: qaConfidential,
      },
      // timestamp variants
      {
        student_id,
        occurred_at: occurredISO,
        evidence_type: qaType,
        title: qaTitle || null,
        note_text: qaNote || null,
        is_confidential: qaConfidential,
      },
      {
        student_id,
        occurred_at: occurredISO,
        type: qaType,
        title: qaTitle || null,
        note_text: qaNote || null,
        is_confidential: qaConfidential,
      },
      // minimal
      {
        student_id,
        note_text: qaNote || qaTitle || qaType,
      },
    ];

    let lastErr: any = null;

    for (const payload of attempts) {
      const res = await supabase.from("evidence_entries").insert(payload);
      if (!res.error) return true;
      lastErr = res.error;
    }

    throw new Error(lastErr?.message ?? "Insert failed (schema mismatch).");
  };

  const saveQuickAdd = async () => {
    setQaSaving(true);
    setQaErr("");

    try {
      const targets =
        qaScope === "single"
          ? qaStudentId
            ? [qaStudentId]
            : []
          : selectedList.map((s) => s.id);

      if (targets.length === 0) {
        setQaErr("No students selected.");
        setQaSaving(false);
        return;
      }

      // Simple sequential inserts keeps it predictable and avoids RLS surprises.
      for (const sid of targets) {
        await insertEvidenceForStudent(sid);
      }

      setQaOpen(false);
      await loadEvidence();
    } catch (e: any) {
      console.error("Quick Add Evidence failed:", e);
      setQaErr(e?.message ?? "Failed to add evidence.");
    } finally {
      setQaSaving(false);
    }
  };

  /* ───────────────────────── UI helpers ───────────────────────── */

  const formatShortDate = (iso: string) => {
    try {
      const d = new Date(iso);
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yy = String(d.getFullYear()).slice(-2);
      return `${dd}/${mm}/${yy}`;
    } catch {
      return "—";
    }
  };

  const snippet = (s?: string | null, max = 90) => {
    const v = (s ?? "").trim().replace(/\s+/g, " ");
    if (!v) return "";
    return v.length > max ? v.slice(0, max).trim() + "…" : v;
  };

  /* ───────────────────────── RENDER ───────────────────────── */

  return (
    <section style={panel}>
      <div style={{ width: "100%" }}>
        {/* Header row */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 16 }}>Students</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>
              Showing {filtered.length} student{filtered.length === 1 ? "" : "s"}
              {selectedIds.size ? ` • Selected ${selectedIds.size}` : ""}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or ID…" style={input} />

            <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <input type="checkbox" checked={showILPOnly} onChange={(e) => setShowILPOnly(e.target.checked)} />
              ILP only
            </label>

            <button style={miniBtn} onClick={toggleSelectAllVisible} disabled={filtered.length === 0}>
              {allVisibleSelected ? "Unselect visible" : "Select visible"}
            </button>

            <button style={miniBtn} onClick={clearSelection} disabled={selectedIds.size === 0}>
              Clear
            </button>
          </div>
        </div>

        {/* View chips */}
        <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 12, opacity: 0.7, fontWeight: 900 }}>View:</span>

          <Chip active={viewMode === "all"} onClick={() => setViewMode("all")} label={`All (${viewCounts.all})`} />
          <Chip
            active={viewMode === "needs_attention"}
            onClick={() => setViewMode("needs_attention")}
            label={`Needs attention (${viewCounts.needs})`}
            tone="warn"
          />
          <Chip
            active={viewMode === "no_evidence"}
            onClick={() => setViewMode("no_evidence")}
            label={`No evidence (${viewCounts.none})`}
            tone="danger"
          />
          <Chip
            active={viewMode === "stale_14"}
            onClick={() => setViewMode("stale_14")}
            label={`Stale 14d+ (${viewCounts.stale})`}
            tone="warn"
          />
          <Chip
            active={viewMode === "evidence_today"}
            onClick={() => setViewMode("evidence_today")}
            label={`Evidence today (${viewCounts.today})`}
            tone="ok"
          />

          <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <button style={miniBtn} onClick={loadEvidence} disabled={evLoading}>
              {evLoading ? "Refreshing evidence…" : "Refresh evidence"}
            </button>
            {evErr ? (
              <span style={{ fontSize: 12, color: "crimson" }}>Evidence warning: {evErr}</span>
            ) : (
              <span style={{ fontSize: 12, opacity: 0.7 }}>Evidence snippets are read-only.</span>
            )}
          </div>
        </div>

        {/* Bulk bar */}
        {selectedIds.size > 0 ? (
          <div style={bulkBar}>
            <div style={{ fontWeight: 900 }}>Bulk actions ({selectedIds.size} selected)</div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
              <button style={{ ...miniBtn, borderColor: "#111" }} onClick={openQuickAddBulk}>
                Quick Add Evidence
              </button>

              <button style={miniBtn} onClick={openBulkEvidenceQueue}>
                Evidence queue
              </button>

              <button style={miniBtn} onClick={openNotesModal}>
                Add Note (placeholder)
              </button>

              <button style={miniBtn} onClick={toggleFlagPlaceholder}>
                Toggle Flag (placeholder)
              </button>

              <button style={miniBtn} onClick={openSelectedInTabs} title="Opens each selected student in a new tab">
                Open in tabs
              </button>
            </div>
          </div>
        ) : null}

        {/* Table */}
        <div style={{ marginTop: 12 }}>
          {filtered.length === 0 ? (
            <div style={{ fontSize: 13, opacity: 0.7 }}>No students match this view.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1100 }}>
                <thead>
                  <tr style={{ textAlign: "left", fontSize: 12, opacity: 0.7 }}>
                    <th style={{ ...th, width: 44 }}>
                      <input
                        type="checkbox"
                        checked={allVisibleSelected && filtered.length > 0}
                        onChange={toggleSelectAllVisible}
                        aria-label="Select all visible"
                      />
                    </th>
                    <th style={th}>Name</th>
                    <th style={th}>ILP</th>
                    <th style={th}>Status</th>
                    <th style={th}>Flag</th>
                    <th style={th}>Recent evidence</th>
                    <th style={th}>Student ID</th>
                    <th style={th}></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => {
                    const checked = selectedIds.has(s.id);
                    const isFlagged = flaggedIds.has(s.id);

                    const ev = evByStudent.get(s.id) ?? [];
                    const latest = ev[0] ?? null;

                    const isNone = studentHasNoEvidence(s.id);
                    const isStale = studentIsStale14(s.id);
                    const isToday = studentHasEvidenceToday(s.id);

                    const status = isNone ? "No evidence" : isStale ? "Stale 14d+" : isToday ? "Updated today" : "OK";

                    const evTitle = latest?.title || (latest?.evidence_type ? `${latest.evidence_type}` : "") || "Evidence";
                    const evDetails = snippet(latest?.details, 90);

                    return (
                      <tr key={s.id} style={{ borderTop: "1px solid #eee" }}>
                        <td style={td}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleOne(s.id)}
                            aria-label={`Select ${studentName(s)}`}
                          />
                        </td>

                        <td style={tdName}>
                          <div style={{ display: "flex", gap: 10, alignItems: "baseline", flexWrap: "wrap" }}>
                            <span>{studentName(s)}</span>
                            {isToday ? <span style={{ fontSize: 12, opacity: 0.75 }}>• updated today</span> : null}
                          </div>
                        </td>

                        <td style={td}>{s.is_ilp ? "Yes" : "No"}</td>

                        <td style={td}>
                          <span
                            style={{
                              ...statusPill,
                              borderColor: isNone
                                ? "rgba(220,38,38,0.35)"
                                : isStale
                                ? "rgba(245,158,11,0.45)"
                                : "rgba(0,0,0,0.12)",
                              background: isNone
                                ? "rgba(220,38,38,0.06)"
                                : isStale
                                ? "rgba(245,158,11,0.10)"
                                : "white",
                            }}
                          >
                            {status}
                          </span>
                        </td>

                        <td style={td}>
                          {isFlagged ? <span style={flagPill}>Flagged</span> : <span style={{ opacity: 0.5 }}>—</span>}
                        </td>

                        <td style={td}>
                          {!latest ? (
                            <span style={{ opacity: 0.6 }}>—</span>
                          ) : (
                            <div style={{ display: "grid", gap: 4 }}>
                              <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
                                <span style={{ fontWeight: 900 }}>{evTitle}</span>
                                <span style={{ fontSize: 12, opacity: 0.7 }}>
                                  {formatShortDate(latest.occurred_at)}
                                  {latest.is_confidential ? " • 🔒" : ""}
                                </span>
                              </div>
                              {evDetails ? <div style={{ fontSize: 12, opacity: 0.85 }}>{evDetails}</div> : null}
                            </div>
                          )}
                        </td>

                        <td style={tdCode}>
                          <code>{s.id}</code>
                        </td>

                        <td style={tdRight}>
                          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
                            <button style={miniBtn} onClick={() => openQuickAddSingle(s.id)}>
                              Quick add
                            </button>
                            <button style={miniBtn} onClick={() => router.push(`/students/${s.id}`)}>
                              Open profile
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div style={{ marginTop: 8, fontSize: 12, opacity: 0.65 }}>
                Tip: status comes from newest <code>evidence_entries</code> per student (no class_id needed).
              </div>
            </div>
          )}
        </div>

        {/* Bulk Evidence Queue Panel */}
        {bulkPanelOpen ? (
          <div style={modalBackdrop} onClick={() => setBulkPanelOpen(false)}>
            <div style={modalCard} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 900, fontSize: 16 }}>Bulk: Evidence queue</div>
                  <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
                    Work through the selected students one by one.
                  </div>
                </div>
                <button style={miniBtn} onClick={() => setBulkPanelOpen(false)}>
                  Close
                </button>
              </div>

              <div style={{ marginTop: 14, borderTop: "1px solid #eee", paddingTop: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                  <div style={{ fontWeight: 900 }}>
                    {selectedList[bulkIndex] ? studentName(selectedList[bulkIndex]) : "—"}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.75, fontWeight: 800 }}>
                    {selectedList.length ? bulkIndex + 1 : 0} / {selectedList.length}
                  </div>
                </div>

                <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    style={miniBtn}
                    onClick={() => setBulkIndex((i) => Math.max(0, i - 1))}
                    disabled={bulkIndex <= 0}
                  >
                    ← Previous
                  </button>

                  <button
                    style={miniBtn}
                    onClick={() => setBulkIndex((i) => Math.min(selectedList.length - 1, i + 1))}
                    disabled={bulkIndex >= selectedList.length - 1}
                  >
                    Next →
                  </button>

                  <button
                    style={{ ...miniBtn, borderColor: "#111", background: "#111", color: "#fff" }}
                    onClick={openCurrentFromQueue}
                  >
                    Open student
                  </button>

                  <button style={miniBtn} onClick={() => {
                    setBulkPanelOpen(false);
                    openQuickAddBulk();
                  }}>
                    Quick Add Evidence
                  </button>

                  <button style={miniBtn} onClick={clearSelection}>
                    Clear selection
                  </button>
                </div>

                <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
                  Use the queue when you want to open profiles; use “Quick Add Evidence” when you want fast logging.
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Notes Placeholder Modal */}
        {noteOpen ? (
          <div style={modalBackdrop} onClick={() => setNoteOpen(false)}>
            <div style={modalCard} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 900, fontSize: 16 }}>Bulk: Add Note (placeholder)</div>
                  <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
                    This does not save to DB yet. It’s a UI placeholder only.
                  </div>
                </div>
                <button style={miniBtn} onClick={() => setNoteOpen(false)}>
                  Close
                </button>
              </div>

              <div style={{ marginTop: 12 }}>
                <textarea
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  placeholder="Type your note…"
                  style={textarea}
                />
              </div>

              <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <button style={miniBtn} onClick={() => setNoteOpen(false)}>
                  Cancel
                </button>
                <button
                  style={{ ...miniBtn, borderColor: "#111", background: "#111", color: "#fff" }}
                  onClick={applyNotePlaceholder}
                >
                  Apply (placeholder)
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* Quick Add Evidence Modal */}
        {qaOpen ? (
          <div style={modalBackdrop} onClick={closeQuickAdd}>
            <div style={modalCard} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontWeight: 900, fontSize: 16 }}>
                    Quick Add Evidence{" "}
                    <span style={{ fontSize: 12, opacity: 0.75, fontWeight: 800 }}>
                      • {qaScope === "bulk" ? `${selectedList.length} students` : "1 student"}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
                    Saves to <code>evidence_entries</code> using a schema-flex insert (no <code>details</code> column).
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button style={miniBtn} onClick={closeQuickAdd} disabled={qaSaving}>
                    Close
                  </button>
                </div>
              </div>

              {qaErr ? (
                <div style={{ marginTop: 10, fontSize: 12, color: "crimson" }}>
                  {qaErr}
                </div>
              ) : null}

              {qaScope === "single" && qaStudentId ? (
                <div style={{ marginTop: 10, fontSize: 12, opacity: 0.8 }}>
                  Student: <strong>{studentName(filtered.find((x) => x.id === qaStudentId) ?? { id: qaStudentId, first_name: null, preferred_name: null, is_ilp: null, class_id: null })}</strong>
                </div>
              ) : null}

              <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 10 }}>
                  <label style={label}>
                    Type
                    <input value={qaType} onChange={(e) => setQaType(e.target.value)} style={field} placeholder="e.g., Observation, Reading, Behaviour…" />
                  </label>

                  <label style={label}>
                    Date
                    <input type="date" value={qaDate} onChange={(e) => setQaDate(e.target.value)} style={field} />
                  </label>
                </div>

                <label style={label}>
                  Title (optional)
                  <input value={qaTitle} onChange={(e) => setQaTitle(e.target.value)} style={field} placeholder="Short headline…" />
                </label>

                <label style={label}>
                  Note
                  <textarea value={qaNote} onChange={(e) => setQaNote(e.target.value)} style={textarea} placeholder="What happened? What did you observe? What’s the next step?" />
                </label>

                <label style={{ ...label, display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="checkbox" checked={qaConfidential} onChange={(e) => setQaConfidential(e.target.checked)} />
                  Confidential (🔒)
                </label>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>
                  <button style={miniBtn} onClick={closeQuickAdd} disabled={qaSaving}>
                    Cancel
                  </button>
                  <button
                    style={{ ...miniBtn, borderColor: "#111", background: "#111", color: "#fff" }}
                    onClick={saveQuickAdd}
                    disabled={qaSaving}
                  >
                    {qaSaving ? "Saving…" : qaScope === "bulk" ? "Save to selected" : "Save evidence"}
                  </button>
                </div>

                <div style={{ fontSize: 12, opacity: 0.7 }}>
                  After save, evidence snippets refresh automatically.
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

/* ───────────────────────── UI bits ───────────────────────── */

function Chip({
  label,
  active,
  onClick,
  tone = "base",
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  tone?: "base" | "ok" | "warn" | "danger";
}) {
  const toneStyle =
    tone === "ok"
      ? { borderColor: "rgba(34,197,94,0.45)", background: "rgba(34,197,94,0.08)" }
      : tone === "warn"
      ? { borderColor: "rgba(245,158,11,0.55)", background: "rgba(245,158,11,0.10)" }
      : tone === "danger"
      ? { borderColor: "rgba(220,38,38,0.45)", background: "rgba(220,38,38,0.08)" }
      : { borderColor: "rgba(0,0,0,0.12)", background: "white" };

  return (
    <button
      onClick={onClick}
      style={{
        ...chip,
        ...(active ? { borderColor: "#111", background: "#111", color: "white" } : toneStyle),
      }}
    >
      {label}
    </button>
  );
}

const panel: React.CSSProperties = {
  border: "1px solid #e6e6e6",
  borderRadius: 16,
  padding: 16,
  background: "white",
};

const input: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid #ddd",
  fontSize: 13,
};

const th: React.CSSProperties = {
  padding: "8px 6px",
};

const td: React.CSSProperties = {
  padding: "10px 6px",
  fontSize: 13,
  verticalAlign: "top",
};

const tdName: React.CSSProperties = {
  ...td,
  fontWeight: 900,
};

const tdCode: React.CSSProperties = {
  ...td,
  fontSize: 12,
  opacity: 0.75,
};

const tdRight: React.CSSProperties = {
  ...td,
  textAlign: "right",
  whiteSpace: "nowrap",
};

const miniBtn: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 8,
  border: "1px solid #ddd",
  fontWeight: 800,
  cursor: "pointer",
  background: "white",
  fontSize: 12,
};

const chip: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid rgba(0,0,0,0.12)",
  fontWeight: 900,
  cursor: "pointer",
  background: "white",
  fontSize: 12,
};

const statusPill: React.CSSProperties = {
  display: "inline-block",
  padding: "4px 8px",
  borderRadius: 999,
  border: "1px solid rgba(0,0,0,0.12)",
  fontSize: 12,
  fontWeight: 900,
  background: "white",
};

const bulkBar: React.CSSProperties = {
  marginTop: 12,
  padding: 10,
  borderRadius: 12,
  border: "1px solid rgba(0,0,0,0.10)",
  background: "#fafafa",
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  flexWrap: "wrap",
  alignItems: "center",
};

const flagPill: React.CSSProperties = {
  display: "inline-block",
  padding: "3px 8px",
  borderRadius: 999,
  border: "1px solid rgba(0,0,0,0.12)",
  fontSize: 12,
  fontWeight: 800,
  background: "#fff",
};

const modalBackdrop: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.30)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 16,
  zIndex: 50,
};

const modalCard: React.CSSProperties = {
  width: "min(720px, 100%)",
  borderRadius: 16,
  background: "white",
  border: "1px solid rgba(0,0,0,0.12)",
  padding: 14,
};

const textarea: React.CSSProperties = {
  width: "100%",
  minHeight: 110,
  padding: 10,
  borderRadius: 12,
  border: "1px solid #ddd",
  fontSize: 13,
  resize: "vertical",
};

const label: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 900,
  display: "grid",
  gap: 6,
};

const field: React.CSSProperties = {
  padding: "10px 10px",
  borderRadius: 12,
  border: "1px solid #ddd",
  fontSize: 13,
};
