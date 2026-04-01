"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import ClassLeftNav from "@/app/components/ClassLeftNav";

type SquadRow = {
  student_id: string;
  student_name: string;
  red_count: number;
  amber_count: number;
  green_count: number;
  risk_score: number;
  last_evidence_at: string | null;
};

type ClassRow = {
  name: string | null;
  year_level: number | null;
};

type QuickAttr = {
  attribute_id: string;
  attribute_name: string;
  domain: string | null;
  band: "healthy" | "monitor" | "risk";
  trend: "up" | "flat" | "down";
  last_evidence_at: string | null;
};

type QuickEvidence = {
  id: string;
  created_at: string;
  occurred_on: string | null;
  learning_area: string | null;
  title: string | null;
  summary: string | null;
};

type QuickViewPayload = {
  student: { student_id: string; student_name: string; class_id: string | null };
  counts: { red: number; amber: number; green: number };
  top_concerns: QuickAttr[];
  recent_evidence: QuickEvidence[];
};

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString();
}

function riskGlyph(r: string) {
  if (r === "risk") return "🔴";
  if (r === "monitor") return "🟡";
  return "🟢";
}

function trendGlyph(t: string) {
  return t === "up" ? "▲" : t === "down" ? "▼" : "—";
}

function Badge({ label }: { label: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "4px 8px",
        borderRadius: 999,
        border: "1px solid #eee",
        background: "#fff",
        fontSize: 12,
        fontWeight: 900,
      }}
    >
      {label}
    </span>
  );
}

function isTypingTarget(el: EventTarget | null) {
  const t = el as HTMLElement | null;
  if (!t) return false;
  const tag = (t.tagName || "").toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  if (t.getAttribute?.("contenteditable") === "true") return true;
  return false;
}

function rangeIds(rows: SquadRow[], a: number, b: number) {
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  return rows.slice(lo, hi + 1).map((r) => r.student_id);
}

type Priority = "low" | "medium" | "high";

export default function SquadPage() {
  const params = useParams();
  const router = useRouter();
  const classId = (params?.id as string) || "";

  const [cls, setCls] = useState<ClassRow | null>(null);
  const [rows, setRows] = useState<SquadRow[]>([]);
  const [query, setQuery] = useState<string>("");
  const [err, setErr] = useState<string | null>(null);

  // Focus (FM current row)
  const [focusedId, setFocusedId] = useState<string | null>(null);

  // Multi-select
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [anchorId, setAnchorId] = useState<string | null>(null);

  // Right panel payload
  const [quick, setQuick] = useState<QuickViewPayload | null>(null);
  const [quickErr, setQuickErr] = useState<string | null>(null);
  const [quickLoading, setQuickLoading] = useState(false);

  // Scroll-follow refs
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});

  // Create Intervention modal
  const [showModal, setShowModal] = useState(false);
  const [iTitle, setITitle] = useState("");
  const [iNotes, setINotes] = useState("");
  const [iDueOn, setIDueOn] = useState<string>("");
  const [iPriority, setIPriority] = useState<Priority>("medium");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [saveErr, setSaveErr] = useState<string | null>(null);

  /* ---------------- data load ---------------- */

  useEffect(() => {
    if (!classId) return;

    setErr(null);

    supabase
      .from("classes")
      .select("name, year_level")
      .eq("id", classId)
      .maybeSingle()
      .then(({ data }) => setCls((data ?? null) as ClassRow | null));

    supabase
      .rpc("get_class_squad_view", { p_class_id: classId })
      .then(({ data, error }) => {
        if (error) {
          setErr(error.message);
          setRows([]);
          return;
        }

        const r = (data ?? []) as SquadRow[];
        setRows(r);

        if (r.length) {
          const firstId = r[0].student_id;
          setFocusedId((prev) => prev ?? firstId);
          setSelectedIds((prev) => (prev.size ? prev : new Set([firstId])));
          setAnchorId((prev) => prev ?? firstId);
        }
      });
  }, [classId]);

  /* ---------------- filtering ---------------- */

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.student_name.toLowerCase().includes(q));
  }, [rows, query]);

  // Keep focus valid when filter changes
  useEffect(() => {
    if (filtered.length === 0) {
      setFocusedId(null);
      setSelectedIds(new Set());
      setAnchorId(null);
      return;
    }

    if (!focusedId || !filtered.some((r) => r.student_id === focusedId)) {
      const first = filtered[0].student_id;
      setFocusedId(first);
      setSelectedIds(new Set([first]));
      setAnchorId(first);
    }
  }, [filtered, focusedId]);

  /* ---------------- scroll-follow ---------------- */

  useEffect(() => {
    if (!focusedId) return;
    const el = rowRefs.current[focusedId];
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [focusedId]);

  /* ---------------- quick panel (focused student) ---------------- */

  useEffect(() => {
    if (!focusedId) return;

    setQuickLoading(true);
    setQuickErr(null);
    setQuick(null);

    supabase
      .rpc("get_student_quick_view", {
        p_student_id: focusedId,
        p_recent_evidence_limit: 6,
      })
      .then(({ data, error }) => {
        if (error) {
          setQuickErr(error.message);
          setQuick(null);
        } else {
          setQuick(data as QuickViewPayload);
        }
        setQuickLoading(false);
      });
  }, [focusedId]);

  /* ---------------- selection helpers ---------------- */

  const focusIndex = useMemo(() => {
    if (!focusedId) return -1;
    return filtered.findIndex((r) => r.student_id === focusedId);
  }, [filtered, focusedId]);

  const indexOfId = (id: string | null) =>
    id ? filtered.findIndex((r) => r.student_id === id) : -1;

  const setSingle = (id: string) => {
    setFocusedId(id);
    setSelectedIds(new Set([id]));
    setAnchorId(id);
  };

  const toggleOne = (id: string) => {
    setFocusedId(id);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      if (next.size === 0 && filtered.length) next.add(id);
      return next;
    });
    setAnchorId((prev) => prev ?? id);
  };

  const selectRangeFromAnchorTo = (id: string) => {
    const aIdx = indexOfId(anchorId);
    const bIdx = indexOfId(id);
    if (aIdx < 0 || bIdx < 0) {
      setSingle(id);
      return;
    }
    const ids = rangeIds(filtered, aIdx, bIdx);
    setFocusedId(id);
    setSelectedIds(new Set(ids));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setFocusedId(null);
    setAnchorId(null);
  };

  const copySelectedNames = async () => {
    const selected = rows.filter((r) => selectedIds.has(r.student_id));
    const text = selected.map((s) => s.student_name).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setSaveMsg(`Copied ${selected.length} names to clipboard`);
      setTimeout(() => setSaveMsg(null), 2000);
    } catch {
      setSaveErr("Could not copy to clipboard (browser permission).");
      setTimeout(() => setSaveErr(null), 2500);
    }
  };

  /* ---------------- keyboard nav (wrap + multi-select) ---------------- */

  useEffect(() => {
    const JUMP = 10;

    const moveFocus = (delta: number, withShift: boolean) => {
      if (!filtered.length) return;

      const n = filtered.length;
      const base = focusIndex < 0 ? 0 : focusIndex;
      const nextIndex = ((base + delta) % n + n) % n;
      const nextId = filtered[nextIndex].student_id;

      if (!withShift) {
        setSingle(nextId);
        return;
      }

      if (!anchorId) setAnchorId(filtered[base]?.student_id ?? nextId);
      setFocusedId(nextId);

      const aIdx = indexOfId(anchorId ?? filtered[base]?.student_id ?? nextId);
      const bIdx = nextIndex;
      const ids = rangeIds(filtered, aIdx, bIdx);
      setSelectedIds(new Set(ids));
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      if (!filtered.length) return;

      const withShift = e.shiftKey;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        moveFocus(+1, withShift);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        moveFocus(-1, withShift);
        return;
      }
      if (e.key === "PageDown") {
        e.preventDefault();
        moveFocus(+JUMP, withShift);
        return;
      }
      if (e.key === "PageUp") {
        e.preventDefault();
        moveFocus(-JUMP, withShift);
        return;
      }
      if (e.key === "Home") {
        e.preventDefault();
        const first = filtered[0].student_id;
        if (withShift && anchorId) {
          setFocusedId(first);
          const ids = rangeIds(filtered, indexOfId(anchorId), 0);
          setSelectedIds(new Set(ids));
        } else {
          setSingle(first);
        }
        return;
      }
      if (e.key === "End") {
        e.preventDefault();
        const last = filtered[filtered.length - 1].student_id;
        if (withShift && anchorId) {
          setFocusedId(last);
          const ids = rangeIds(filtered, indexOfId(anchorId), filtered.length - 1);
          setSelectedIds(new Set(ids));
        } else {
          setSingle(last);
        }
        return;
      }
      if (e.key === "Enter") {
        if (!focusedId) return;
        e.preventDefault();
        router.push(`/students/${focusedId}`);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        clearSelection();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [filtered, focusIndex, focusedId, anchorId, router]);

  /* ---------------- Create Intervention ---------------- */

  const openModal = () => {
    setSaveErr(null);
    setSaveMsg(null);
    setITitle("");
    setINotes("");
    setIDueOn("");
    setIPriority("medium");
    setShowModal(true);
  };

  const createIntervention = async () => {
    const selected = Array.from(selectedIds);
    if (selected.length === 0) return;

    const title = iTitle.trim();
    if (!title) {
      setSaveErr("Title is required.");
      return;
    }

    setSaving(true);
    setSaveErr(null);
    setSaveMsg(null);

    try {
      // 1) create intervention header
      const { data: inserted, error: insErr } = await supabase
        .from("interventions")
        .insert({
          class_id: classId,
          title,
          notes: iNotes.trim() ? iNotes.trim() : null,
          due_on: iDueOn ? iDueOn : null,
          priority: iPriority,
          status: "open",
        })
        .select("id")
        .single();

      if (insErr) throw new Error(insErr.message);
      const interventionId = inserted?.id as string;

      // 2) link students
      const links = selected.map((sid) => ({
        intervention_id: interventionId,
        student_id: sid,
      }));

      const { error: linkErr } = await supabase
        .from("intervention_students")
        .insert(links);

      if (linkErr) throw new Error(linkErr.message);

      setSaveMsg(`Intervention created (${selected.length} students).`);
      setTimeout(() => setSaveMsg(null), 2500);

      setShowModal(false);
    } catch (e: any) {
      setSaveErr(e?.message ?? "Failed to create intervention.");
      setTimeout(() => setSaveErr(null), 3500);
    } finally {
      setSaving(false);
    }
  };

  /* ---------------- render ---------------- */

  if (err) return <div style={{ padding: 24, color: "red" }}>{err}</div>;
  if (!rows.length) return <div style={{ padding: 24 }}>Loading class dashboard…</div>;

  const classLabel =
    cls?.name ?? (cls?.year_level != null ? `Year ${cls.year_level}` : "Class");

  const focusedRow =
    (focusedId ? rows.find((r) => r.student_id === focusedId) : null) ?? null;

  const selectedCount = selectedIds.size;

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <ClassLeftNav classId={classId} />

      {/* Middle: table */}
      <div style={{ flex: 1, padding: 24, position: "relative" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 12,
            marginBottom: 14,
          }}
        >
          <div>
            <div style={{ fontSize: 12, color: "#777" }}>CLASSES · DASHBOARD</div>
            <div style={{ fontSize: 28, fontWeight: 900, marginTop: 6 }}>
              {classLabel}
            </div>
            <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
              Ctrl/Cmd+Click toggle · Shift+Click range · Shift+↑↓ range · Enter open · Esc clear
            </div>
          </div>

          <Link href={`/classes/${classId}`} style={{ fontWeight: 900 }}>
            ← Back to Overview
          </Link>
        </div>

        {/* Controls */}
        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            alignItems: "center",
            marginBottom: 14,
          }}
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search students…"
            style={{
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid #ddd",
              width: 280,
            }}
          />

          <Badge label={`Students: ${filtered.length}`} />
          <Badge label={`Selected: ${selectedCount}`} />
        </div>

        {/* Table */}
        <div
          style={{
            border: "1px solid #eee",
            borderRadius: 16,
            overflow: "auto",
            background: "#fff",
            maxHeight: "72vh",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#fafafa" }}>
                <th style={{ textAlign: "left", padding: 12 }}>Student</th>
                <th style={{ padding: 12 }}>🔴</th>
                <th style={{ padding: 12 }}>🟡</th>
                <th style={{ padding: 12 }}>🟢</th>
                <th style={{ padding: 12 }}>Risk</th>
                <th style={{ padding: 12 }}>Last evidence</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((r) => {
                const isFocused = r.student_id === focusedId;
                const isSelected = selectedIds.has(r.student_id);

                return (
                  <tr
                    key={r.student_id}
                    ref={(el) => (rowRefs.current[r.student_id] = el)}
                    style={{
                      borderTop: "1px solid #eee",
                      cursor: "pointer",
                      background: isFocused ? "#eef2ff" : isSelected ? "#f3f4f6" : "#fff",
                    }}
                    onClick={(e) => {
                      const isToggle = e.ctrlKey || e.metaKey;
                      const isRange = e.shiftKey;

                      if (isRange) {
                        if (!anchorId) setAnchorId(r.student_id);
                        selectRangeFromAnchorTo(r.student_id);
                        return;
                      }

                      if (isToggle) {
                        toggleOne(r.student_id);
                        return;
                      }

                      setSingle(r.student_id);
                    }}
                  >
                    <td style={{ padding: 12, fontWeight: 900 }}>
                      {isSelected ? "✓ " : ""}
                      {r.student_name}
                    </td>

                    <td style={{ padding: 12, textAlign: "center", fontWeight: 900 }}>
                      {r.red_count}
                    </td>
                    <td style={{ padding: 12, textAlign: "center", fontWeight: 900 }}>
                      {r.amber_count}
                    </td>
                    <td style={{ padding: 12, textAlign: "center", fontWeight: 900 }}>
                      {r.green_count}
                    </td>

                    <td style={{ padding: 12, textAlign: "center", fontWeight: 900 }}>
                      {r.risk_score}
                    </td>

                    <td style={{ padding: 12, textAlign: "center" }}>
                      {formatDate(r.last_evidence_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ✅ Action Bar (appears when selected) */}
        {selectedCount > 0 ? (
          <div
            style={{
              position: "sticky",
              bottom: 0,
              marginTop: 14,
              background: "#fff",
              border: "1px solid #eee",
              borderRadius: 14,
              padding: 12,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div style={{ fontWeight: 900 }}>{selectedCount} selected</div>

              {saveMsg ? <span style={{ fontSize: 12, color: "#0a7" }}>{saveMsg}</span> : null}
              {saveErr ? <span style={{ fontSize: 12, color: "red" }}>{saveErr}</span> : null}
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                onClick={openModal}
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid #ddd",
                  background: "#111",
                  color: "#fff",
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                Create Intervention
              </button>

              <button
                onClick={copySelectedNames}
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid #ddd",
                  background: "#fff",
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                Copy names
              </button>

              <button
                onClick={clearSelection}
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid #ddd",
                  background: "#fff",
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                Clear
              </button>
            </div>
          </div>
        ) : null}

        {/* ✅ Modal */}
        {showModal ? (
          <div
            onMouseDown={() => setShowModal(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
              zIndex: 50,
            }}
          >
            <div
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                width: "min(720px, 96vw)",
                background: "#fff",
                borderRadius: 16,
                border: "1px solid #eee",
                padding: 16,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 12, color: "#777", fontWeight: 900 }}>
                    CREATE INTERVENTION
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 900, marginTop: 6 }}>
                    {selectedCount} students
                  </div>
                </div>

                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    border: "1px solid #ddd",
                    background: "#fff",
                    borderRadius: 12,
                    padding: "8px 10px",
                    cursor: "pointer",
                    fontWeight: 900,
                  }}
                >
                  ✕
                </button>
              </div>

              <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 220px", gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 900, marginBottom: 6 }}>Title</div>
                  <input
                    value={iTitle}
                    onChange={(e) => setITitle(e.target.value)}
                    placeholder="e.g., Small-group decoding focus (2 weeks)"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 12,
                      border: "1px solid #ddd",
                    }}
                  />
                </div>

                <div>
                  <div style={{ fontWeight: 900, marginBottom: 6 }}>Priority</div>
                  <select
                    value={iPriority}
                    onChange={(e) => setIPriority(e.target.value as Priority)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 12,
                      border: "1px solid #ddd",
                      background: "#fff",
                      fontWeight: 900,
                    }}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 900, marginBottom: 6 }}>Notes</div>
                <textarea
                  value={iNotes}
                  onChange={(e) => setINotes(e.target.value)}
                  placeholder="What are we doing? How often? What evidence will show progress?"
                  rows={5}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid #ddd",
                    resize: "vertical",
                  }}
                />
              </div>

              <div style={{ marginTop: 12, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontWeight: 900, marginBottom: 6 }}>Due date</div>
                  <input
                    type="date"
                    value={iDueOn}
                    onChange={(e) => setIDueOn(e.target.value)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 12,
                      border: "1px solid #ddd",
                    }}
                  />
                </div>

                <div style={{ flex: 1 }} />

                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid #ddd",
                    background: "#fff",
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>

                <button
                  disabled={saving}
                  onClick={createIntervention}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid #ddd",
                    background: saving ? "#999" : "#111",
                    color: "#fff",
                    fontWeight: 900,
                    cursor: saving ? "not-allowed" : "pointer",
                  }}
                >
                  {saving ? "Creating…" : "Create"}
                </button>
              </div>

              {saveErr ? (
                <div style={{ marginTop: 10, color: "red", fontSize: 12 }}>{saveErr}</div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      {/* Right: FM-style “Student Card” */}
      <div
        style={{
          width: 360,
          borderLeft: "1px solid #eee",
          background: "#fafafa",
          padding: 16,
          minHeight: "100vh",
        }}
      >
        <div style={{ fontSize: 12, color: "#777", fontWeight: 900 }}>
          STUDENT CARD
        </div>

        {!focusedRow ? (
          <div style={{ marginTop: 12, color: "#666" }}>Select a student.</div>
        ) : (
          <>
            <div style={{ marginTop: 10, fontSize: 20, fontWeight: 900 }}>
              {focusedRow.student_name}
            </div>

            <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Badge label={`🔴 ${focusedRow.red_count}`} />
              <Badge label={`🟡 ${focusedRow.amber_count}`} />
              <Badge label={`🟢 ${focusedRow.green_count}`} />
              <Badge label={`Score ${focusedRow.risk_score}`} />
            </div>

            <div style={{ marginTop: 12 }}>
              <Link
                href={`/students/${focusedRow.student_id}`}
                style={{ fontWeight: 900, textDecoration: "none" }}
              >
                → Open full student profile
              </Link>
            </div>

            <div style={{ marginTop: 14, borderTop: "1px solid #eee", paddingTop: 12 }}>
              <div style={{ fontWeight: 900, marginBottom: 8 }}>Top concerns</div>

              {quickLoading ? (
                <div style={{ color: "#666" }}>Loading…</div>
              ) : quickErr ? (
                <div style={{ color: "red" }}>{quickErr}</div>
              ) : !quick ? (
                <div style={{ color: "#666" }}>No data.</div>
              ) : quick.top_concerns.length === 0 ? (
                <div style={{ color: "#666" }}>No concerns flagged.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {quick.top_concerns.map((a) => (
                    <div
                      key={a.attribute_id}
                      style={{
                        border: "1px solid #eee",
                        borderRadius: 12,
                        padding: 10,
                        background: "#fff",
                      }}
                    >
                      <div style={{ fontWeight: 900, fontSize: 13 }}>
                        {riskGlyph(a.band)} {a.attribute_name}
                        <span style={{ marginLeft: 8, color: "#666", fontWeight: 800 }}>
                          {trendGlyph(a.trend)}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                        {a.domain ?? "—"} · Last evidence: {formatDate(a.last_evidence_at)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginTop: 14, borderTop: "1px solid #eee", paddingTop: 12 }}>
              <div style={{ fontWeight: 900, marginBottom: 8 }}>Recent evidence</div>

              {quickLoading ? (
                <div style={{ color: "#666" }}>Loading…</div>
              ) : quickErr ? (
                <div style={{ color: "red" }}>{quickErr}</div>
              ) : !quick ? (
                <div style={{ color: "#666" }}>No data.</div>
              ) : quick.recent_evidence.length === 0 ? (
                <div style={{ color: "#666" }}>No recent evidence logged.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {quick.recent_evidence.map((e) => (
                    <div
                      key={e.id}
                      style={{
                        border: "1px solid #eee",
                        borderRadius: 12,
                        padding: 10,
                        background: "#fff",
                      }}
                    >
                      <div style={{ fontWeight: 900, fontSize: 13 }}>
                        {e.title ?? e.learning_area ?? "Evidence"}
                      </div>
                      <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                        {formatDate(e.created_at)} · {e.learning_area ?? "—"}
                      </div>
                      {e.summary ? (
                        <div style={{ fontSize: 12, marginTop: 6, color: "#222" }}>
                          {e.summary}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
