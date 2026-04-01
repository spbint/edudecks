"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AdminLeftNav from "@/app/components/AdminLeftNav";
import { supabase } from "@/lib/supabaseClient";

/* ───────────────────────────── TYPES ───────────────────────────── */

type ClassRow = {
  id: string;
  name: string | null;
  year_level: number | null;
  created_at?: string;
};

type StudentRow = {
  id: string;
  first_name: string | null;
  preferred_name: string | null;
  is_ilp: boolean | null;
  class_id: string | null;
  created_at?: string;
  // surname-ish field (we detect)
  [key: string]: any;
};

type SurnameField = "surname" | "last_name" | "family_name";

/* ───────────────────────────── STYLE ───────────────────────────── */

const S = {
  shell: {
    display: "flex",
    minHeight: "100vh",
    background: "#f6f7fb",
  } as React.CSSProperties,
  main: {
    flex: 1,
    padding: 22,
    maxWidth: 1280,
    margin: "0 auto",
  } as React.CSSProperties,
  card: {
    border: "1px solid #e8eaf0",
    borderRadius: 18,
    background: "#fff",
  } as React.CSSProperties,
  hero: {
    border: "1px solid #e8eaf0",
    borderRadius: 22,
    background:
      "linear-gradient(135deg, rgba(17,24,39,0.06), rgba(99,102,241,0.08))",
    padding: 18,
  } as React.CSSProperties,
  subtle: {
    color: "#6b7280",
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: 0.6,
  } as React.CSSProperties,
  h1: {
    fontSize: 42,
    fontWeight: 950,
    lineHeight: 1.05,
    marginTop: 8,
    color: "#0f172a",
  } as React.CSSProperties,
  row: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    alignItems: "center",
  } as React.CSSProperties,
  btn: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    fontWeight: 900,
    cursor: "pointer",
    background: "#fff",
    color: "#0f172a",
  } as React.CSSProperties,
  btnPrimary: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #0f172a",
    fontWeight: 900,
    cursor: "pointer",
    background: "#0f172a",
    color: "#fff",
  } as React.CSSProperties,
  btnDanger: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #fecaca",
    fontWeight: 900,
    cursor: "pointer",
    background: "#fff1f2",
    color: "#9f1239",
  } as React.CSSProperties,
  input: {
    padding: "12px 14px",
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    width: "100%",
    fontWeight: 900,
    background: "#fff",
    outline: "none",
    color: "#0f172a",
  } as React.CSSProperties,
  select: {
    padding: "10px 12px",
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    width: "100%",
    fontWeight: 900,
    background: "#fff",
    outline: "none",
    color: "#0f172a",
  } as React.CSSProperties,
  helper: {
    marginTop: 8,
    fontSize: 12,
    color: "#6b7280",
    fontWeight: 750,
  } as React.CSSProperties,
  chip: {
    display: "inline-flex",
    alignItems: "center",
    padding: "5px 10px",
    borderRadius: 999,
    border: "1px solid #e5e7eb",
    background: "#fff",
    fontSize: 12,
    fontWeight: 900,
    color: "#0f172a",
    whiteSpace: "nowrap",
  } as React.CSSProperties,
  alert: {
    marginTop: 10,
    borderRadius: 14,
    border: "1px solid #fecaca",
    background: "#fff1f2",
    padding: 12,
    color: "#9f1239",
    fontWeight: 900,
  } as React.CSSProperties,
  ok: {
    marginTop: 10,
    borderRadius: 14,
    border: "1px solid #bbf7d0",
    background: "#f0fdf4",
    padding: 12,
    color: "#14532d",
    fontWeight: 900,
  } as React.CSSProperties,
  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
  } as React.CSSProperties,
  th: {
    position: "sticky",
    top: 0,
    background: "#fff",
    zIndex: 1,
    textAlign: "left",
    fontSize: 12,
    color: "#64748b",
    fontWeight: 950,
    padding: "10px 10px",
    borderBottom: "1px solid #e8eaf0",
    whiteSpace: "nowrap",
  } as React.CSSProperties,
  td: {
    padding: "10px 10px",
    borderBottom: "1px solid #f1f5f9",
    verticalAlign: "top",
  } as React.CSSProperties,
};

/* ───────────────────────────── HELPERS ───────────────────────────── */

function safe(s: string | null | undefined) {
  return (s ?? "").trim();
}

function fmtYear(y: number | null) {
  if (y == null) return "Year ?";
  return `Y${y}`;
}

function classLabel(c: ClassRow | undefined) {
  if (!c) return "—";
  const name = safe(c.name) || "Unnamed class";
  const y = c.year_level == null ? "" : ` (${fmtYear(c.year_level)})`;
  return `${name}${y}`;
}

function isMissingColumnError(err: any) {
  const msg = String(err?.message ?? "").toLowerCase();
  return msg.includes("does not exist") && msg.includes("column");
}

async function trySelectStudents(surnameField: SurnameField) {
  return await supabase
    .from("students")
    .select(`id,first_name,preferred_name,${surnameField},is_ilp,class_id,created_at`)
    .order("created_at", { ascending: false });
}

function studentDisplayName(s: StudentRow, surnameCol: SurnameField | null) {
  const first = safe(s.preferred_name) || safe(s.first_name);
  const sur = surnameCol ? safe(s[surnameCol]) : "";
  return `${first}${sur ? " " + sur : ""}`.trim() || "Unnamed student";
}

/* ───────────────────────────── PAGE ───────────────────────────── */

export default function StudentClassPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const [classes, setClasses] = useState<ClassRow[]>([]);
  const classMap = useMemo(() => new Map(classes.map((c) => [c.id, c])), [classes]);

  const [surnameCol, setSurnameCol] = useState<SurnameField | null>(null);
  const [students, setStudents] = useState<StudentRow[]>([]);

  // Focus / target class
  const [targetClassId, setTargetClassId] = useState<string>("");

  // Filters
  const [q, setQ] = useState("");
  const [scope, setScope] = useState<"all" | "unassigned" | "inClass">("all");
  const [ilpOnly, setIlpOnly] = useState(false);
  const [sortMode, setSortMode] = useState<"name" | "class">("name");

  // Selection
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const selectedCount = useMemo(() => Object.values(selected).filter(Boolean).length, [selected]);

  const didInitialLoad = useRef(false);

  async function loadAll(preserveSelection = false) {
    setErr(null);
    setMsg(null);
    setBusy(true);

    try {
      const { data: classRows, error: classErr } = await supabase
        .from("classes")
        .select("id,name,year_level,created_at")
        .order("year_level", { ascending: true });

      if (classErr) throw classErr;
      const cls = (classRows ?? []) as ClassRow[];
      setClasses(cls);

      // Detect surname column by select attempts
      const candidates: SurnameField[] = ["surname", "last_name", "family_name"];
      let detected: SurnameField | null = null;
      let stuRows: any[] = [];

      for (const cand of candidates) {
        const res = await trySelectStudents(cand);
        if (res.error) {
          if (isMissingColumnError(res.error)) continue;
          throw res.error;
        }
        detected = cand;
        stuRows = res.data ?? [];
        break;
      }

      // If no surname column exists, still load minimal fields
      if (!detected) {
        const { data, error } = await supabase
          .from("students")
          .select("id,first_name,preferred_name,is_ilp,class_id,created_at")
          .order("created_at", { ascending: false });

        if (error) throw error;
        stuRows = data ?? [];
      }

      setSurnameCol(detected);
      setStudents((stuRows ?? []) as StudentRow[]);

      // Ensure targetClassId exists
      setTargetClassId((cur) => {
        const param = (searchParams?.get("classId") ?? "").trim();
        const candidate = param || cur;
        if (candidate && cls.some((c) => c.id === candidate)) return candidate;
        return cls[0]?.id ?? "";
      });

      if (!preserveSelection) setSelected({});
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load students/classes.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (didInitialLoad.current) return;
    didInitialLoad.current = true;
    loadAll(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep URL in sync when target class changes (deep link)
  useEffect(() => {
    if (!targetClassId) return;
    const url = `/admin/student-class?classId=${encodeURIComponent(targetClassId)}`;
    router.replace(url);
  }, [targetClassId, router]);

  const targetClass = useMemo(
    () => (targetClassId ? classMap.get(targetClassId) : undefined),
    [classMap, targetClassId]
  );

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    let list = students.filter((s) => {
      if (ilpOnly && !s.is_ilp) return false;

      if (scope === "unassigned" && s.class_id) return false;
      if (scope === "inClass" && targetClassId && s.class_id !== targetClassId) return false;

      if (!query) return true;

      const sur = surnameCol ? safe(s[surnameCol]) : "";
      const hay = [
        safe(s.first_name),
        safe(s.preferred_name),
        sur,
        s.is_ilp ? "ilp" : "",
        s.class_id ? classLabel(classMap.get(s.class_id)) : "unassigned",
      ]
        .join(" ")
        .toLowerCase();

      return hay.includes(query);
    });

    if (sortMode === "name") {
      list.sort((a, b) => studentDisplayName(a, surnameCol).localeCompare(studentDisplayName(b, surnameCol)));
    } else {
      // class sort: class label then name
      list.sort((a, b) => {
        const al = a.class_id ? classLabel(classMap.get(a.class_id)) : "Unassigned";
        const bl = b.class_id ? classLabel(classMap.get(b.class_id)) : "Unassigned";
        const d = al.localeCompare(bl);
        if (d !== 0) return d;
        return studentDisplayName(a, surnameCol).localeCompare(studentDisplayName(b, surnameCol));
      });
    }

    return list;
  }, [students, q, ilpOnly, scope, targetClassId, sortMode, surnameCol, classMap]);

  const allVisibleSelected = useMemo(() => {
    if (filtered.length === 0) return false;
    return filtered.every((s) => selected[s.id]);
  }, [filtered, selected]);

  const inTargetCount = useMemo(() => {
    if (!targetClassId) return 0;
    return students.filter((s) => s.class_id === targetClassId).length;
  }, [students, targetClassId]);

  const unassignedCount = useMemo(() => students.filter((s) => !s.class_id).length, [students]);

  function toggleSelect(id: string) {
    setSelected((cur) => ({ ...cur, [id]: !cur[id] }));
  }

  function selectVisible(on: boolean) {
    setSelected((cur) => {
      const next = { ...cur };
      for (const s of filtered) next[s.id] = on;
      return next;
    });
  }

  function clearSelection() {
    setSelected({});
  }

  async function assignSelectedToTarget() {
    setErr(null);
    setMsg(null);

    if (!targetClassId) {
      setErr("No target class selected.");
      return;
    }

    const ids = Object.entries(selected)
      .filter(([, v]) => v)
      .map(([k]) => k);

    if (ids.length === 0) {
      setErr("Select at least one student first.");
      return;
    }

    setBusy(true);
    try {
      const { error } = await supabase.from("students").update({ class_id: targetClassId }).in("id", ids);
      if (error) throw error;

      setMsg(`Assigned ${ids.length} student(s) to ${safe(targetClass?.name) || "class"}.`);
      setTimeout(() => setMsg(null), 1400);

      await loadAll(false);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to assign students.");
    } finally {
      setBusy(false);
    }
  }

  async function unassignSelected() {
    setErr(null);
    setMsg(null);

    const ids = Object.entries(selected)
      .filter(([, v]) => v)
      .map(([k]) => k);

    if (ids.length === 0) {
      setErr("Select at least one student first.");
      return;
    }

    setBusy(true);
    try {
      const { error } = await supabase.from("students").update({ class_id: null }).in("id", ids);
      if (error) throw error;

      setMsg(`Unassigned ${ids.length} student(s).`);
      setTimeout(() => setMsg(null), 1200);

      await loadAll(false);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to unassign students.");
    } finally {
      setBusy(false);
    }
  }

  async function moveOne(id: string, classId: string | null) {
    setErr(null);
    setMsg(null);
    setBusy(true);
    try {
      const { error } = await supabase.from("students").update({ class_id: classId }).eq("id", id);
      if (error) throw error;
      await loadAll(true);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to update student class.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={S.shell}>
      <AdminLeftNav />

      <main style={S.main}>
        {/* HERO */}
        <section style={S.hero}>
          <div style={S.subtle}>ASSIGNMENT</div>
          <div style={S.h1}>Assign students → classes</div>

          <div style={{ ...S.row, marginTop: 10 }}>
            <div style={{ color: "#334155", fontSize: 14, fontWeight: 850 }}>
              Select a target class, then bulk-assign students (or unassign back to “Unassigned”).
            </div>

            <div style={{ marginLeft: "auto", display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button style={S.btn} onClick={() => loadAll(true)} disabled={busy}>
                Refresh
              </button>
              {targetClassId ? (
                <a
                  href={`/admin/classes/${targetClassId}`}
                  style={{ ...S.btnPrimary, textDecoration: "none", display: "inline-flex", alignItems: "center" }}
                >
                  Open class dashboard →
                </a>
              ) : null}
            </div>
          </div>

          <div style={S.helper}>
            Target: <span style={S.chip}>{classLabel(targetClass)}</span> · In target:{" "}
            <span style={S.chip}>{inTargetCount}</span> · Unassigned: <span style={S.chip}>{unassignedCount}</span> ·
            Selected: <span style={S.chip}>{selectedCount}</span>
          </div>

          {err ? <div style={S.alert}>{err}</div> : null}
          {msg ? <div style={S.ok}>{msg}</div> : null}

          {/* CONTROLS */}
          <div
            style={{
              marginTop: 14,
              display: "grid",
              gridTemplateColumns: "1fr 280px 280px",
              gap: 12,
              alignItems: "start",
            }}
          >
            <div>
              <input
                style={S.input}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search students… (name, ILP, class)"
                disabled={busy}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setQ("");
                }}
              />
              <div style={S.helper}>
                Showing <strong>{filtered.length}</strong> of <strong>{students.length}</strong> students · Surname column:{" "}
                <span style={S.chip}>{surnameCol ? surnameCol : "none"}</span>
              </div>
            </div>

            <div>
              <div style={{ ...S.subtle, marginBottom: 8 }}>TARGET CLASS</div>
              <select
                style={S.select}
                value={targetClassId}
                onChange={(e) => setTargetClassId(e.target.value)}
                disabled={busy}
              >
                {classes.length === 0 ? <option value="">No classes</option> : null}
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {classLabel(c)}
                  </option>
                ))}
              </select>

              <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button style={S.btnPrimary} onClick={assignSelectedToTarget} disabled={busy || selectedCount === 0}>
                  Assign selected →
                </button>
                <button style={S.btnDanger} onClick={unassignSelected} disabled={busy || selectedCount === 0}>
                  Unassign selected
                </button>
              </div>
            </div>

            <div>
              <div style={{ ...S.subtle, marginBottom: 8 }}>FILTERS</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <select
                  style={S.select}
                  value={scope}
                  onChange={(e) => setScope(e.target.value as any)}
                  disabled={busy}
                >
                  <option value="all">All students</option>
                  <option value="unassigned">Unassigned only</option>
                  <option value="inClass">In target class only</option>
                </select>

                <select
                  style={S.select}
                  value={sortMode}
                  onChange={(e) => setSortMode(e.target.value as any)}
                  disabled={busy}
                >
                  <option value="name">Sort: name</option>
                  <option value="class">Sort: class</option>
                </select>
              </div>

              <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <label style={{ display: "inline-flex", alignItems: "center", gap: 10, fontWeight: 900, color: "#0f172a" }}>
                  <input
                    type="checkbox"
                    checked={ilpOnly}
                    onChange={(e) => setIlpOnly(e.target.checked)}
                    disabled={busy}
                  />
                  ILP only
                </label>

                <button style={S.btn} onClick={() => selectVisible(!allVisibleSelected)} disabled={busy}>
                  {allVisibleSelected ? "Unselect visible" : "Select visible"}
                </button>
                <button style={S.btn} onClick={clearSelection} disabled={busy}>
                  Clear selection
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* TABLE */}
        <section style={{ ...S.card, marginTop: 14, overflow: "hidden" }}>
          <div style={{ padding: 12, borderBottom: "1px solid #e8eaf0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={S.chip}>Roster assignment</span>
              <span style={{ fontSize: 12, color: "#64748b", fontWeight: 850 }}>
                Tip: Use the per-row dropdown to move an individual student quickly.
              </span>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}></th>
                  <th style={S.th}>Student</th>
                  <th style={S.th}>ILP</th>
                  <th style={S.th}>Current class</th>
                  <th style={S.th}>Move to…</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const isSel = !!selected[s.id];
                  const currentClass = s.class_id ? classMap.get(s.class_id) : undefined;

                  return (
                    <tr key={s.id}>
                      <td style={S.td}>
                        <input type="checkbox" checked={isSel} onChange={() => toggleSelect(s.id)} disabled={busy} />
                      </td>

                      <td style={S.td}>
                        <div style={{ fontWeight: 950, color: "#0f172a" }}>{studentDisplayName(s, surnameCol)}</div>
                        <div style={{ marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {s.class_id ? <span style={S.chip}>Assigned</span> : <span style={S.chip}>Unassigned</span>}
                        </div>
                      </td>

                      <td style={S.td}>
                        {s.is_ilp ? <span style={S.chip}>ILP</span> : <span style={{ color: "#94a3b8", fontWeight: 900 }}>—</span>}
                      </td>

                      <td style={S.td}>
                        <span style={S.chip}>{classLabel(currentClass)}</span>
                      </td>

                      <td style={S.td}>
                        <select
                          style={{ ...S.select, borderRadius: 12 }}
                          value={s.class_id ?? ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            moveOne(s.id, v ? v : null);
                          }}
                          disabled={busy}
                        >
                          <option value="">Unassigned</option>
                          {classes.map((c) => (
                            <option key={c.id} value={c.id}>
                              {classLabel(c)}
                            </option>
                          ))}
                        </select>

                        <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button
                            style={S.btnPrimary}
                            onClick={() => moveOne(s.id, targetClassId || null)}
                            disabled={busy || !targetClassId}
                            title="Move this student to the target class"
                          >
                            Move to target →
                          </button>
                          <button style={S.btnDanger} onClick={() => moveOne(s.id, null)} disabled={busy}>
                            Unassign
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ ...S.td, padding: 16, color: "#64748b", fontWeight: 900 }}>
                      No students match your filters. Try clearing search, changing scope, or toggling ILP only.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <div style={{ marginTop: 14, fontSize: 12, color: "#94a3b8", fontWeight: 800 }}>
          Keyboard tip: <strong>Esc</strong> clears search.
        </div>
      </main>
    </div>
  );
}
