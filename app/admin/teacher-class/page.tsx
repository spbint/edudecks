"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

/**
 * Teacher ↔ Class Assignment (Admin)
 * File: C:\Users\seanb\edu-dashboard\app\admin\teacher-class\page.tsx
 *
 * ✅ Designed to be resilient to your evolving DB schema:
 * - Tries multiple teacher table shapes (teachers.* OR admins.*)
 * - Uses class_teachers join table with ONLY class_id + teacher_id (no role/created_at)
 * - Gives clean "roster" style view per class + quick assign/unassign
 * - Includes CSV export (per class + all)
 * - Includes Print mode
 */

type ClassRow = {
  id: string;
  name: string | null;
  year_level: number | null;
};

type TeacherRow = {
  id: string;
  label: string; // computed display name
  email?: string | null;
  source: "teachers" | "admins";
};

type ClassTeacherRow = {
  class_id: string;
  teacher_id: string;
};

export default function TeacherClassPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [links, setLinks] = useState<ClassTeacherRow[]>([]);

  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const [classFocusId, setClassFocusId] = useState<string>("");
  const [teacherSearch, setTeacherSearch] = useState<string>("");

  const [assignClassId, setAssignClassId] = useState<string>("");
  const [assignTeacherId, setAssignTeacherId] = useState<string>("");

  const [printIncludeIds, setPrintIncludeIds] = useState(false);
  const [printFontSize, setPrintFontSize] = useState<"S" | "M" | "L">("M");

  useEffect(() => {
    const guard = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) window.location.href = "/";
    };
    guard();
  }, []);

  const loadClasses = async (): Promise<ClassRow[]> => {
    const { data, error } = await supabase
      .from("classes")
      .select("id, name, year_level")
      .order("year_level", { ascending: true })
      .order("name", { ascending: true });

    if (error) throw new Error(`Load classes failed: ${error.message}`);
    return (data as ClassRow[]) ?? [];
  };

  const buildTeacherLabel = (row: any) => {
    const preferred = (row.preferred_name ?? row.preferred ?? "").toString().trim();
    const first = (row.first_name ?? row.first ?? "").toString().trim();
    const last = (row.last_name ?? row.surname ?? "").toString().trim();
    const full = (row.full_name ?? row.name ?? row.display_name ?? "").toString().trim();
    const email = (row.email ?? "").toString().trim();

    const name =
      full ||
      [preferred || first, last].filter(Boolean).join(" ").trim() ||
      preferred ||
      first ||
      email ||
      row.id;

    return { label: name || row.id, email: email || null };
  };

  const loadTeachers = async (): Promise<TeacherRow[]> => {
    const teacherTries: Array<{
      select: string;
      map: (r: any) => TeacherRow;
    }> = [
      {
        select: "id, preferred_name, first_name, last_name, email",
        map: (r) => {
          const { label, email } = buildTeacherLabel(r);
          return { id: r.id, label, email, source: "teachers" as const };
        },
      },
      {
        select: "id, full_name, email",
        map: (r) => {
          const { label, email } = buildTeacherLabel(r);
          return { id: r.id, label, email, source: "teachers" as const };
        },
      },
      {
        select: "id, name, email",
        map: (r) => {
          const { label, email } = buildTeacherLabel(r);
          return { id: r.id, label, email, source: "teachers" as const };
        },
      },
    ];

    for (const t of teacherTries) {
      const res = await supabase.from("teachers").select(t.select).order("id", { ascending: true });
      if (!res.error) {
        const rows = (res.data as any[]) ?? [];
        return rows.map(t.map).sort((a, b) => a.label.localeCompare(b.label));
      }
    }

    const adminRes = await supabase.from("admins").select("id, email, role").order("email", { ascending: true });
    if (adminRes.error) {
      throw new Error(
        `Load teachers failed: no usable teachers/admins source. Last error: ${adminRes.error.message}`
      );
    }

    const adminRows = (adminRes.data as any[]) ?? [];
    const mapped = adminRows.map((r) => {
      const email = (r.email ?? "").toString().trim();
      const label = email || r.id;
      return { id: r.id, label, email: email || null, source: "admins" as const };
    });

    return mapped.sort((a, b) => a.label.localeCompare(b.label));
  };

  const loadLinks = async (): Promise<ClassTeacherRow[]> => {
    const { data, error } = await supabase.from("class_teachers").select("class_id, teacher_id");
    if (error) throw new Error(`Load class_teachers failed: ${error.message}`);
    return (data as ClassTeacherRow[]) ?? [];
  };

  const loadAll = async () => {
    setLoading(true);
    setErr("");
    setOk("");

    try {
      const [c, t, l] = await Promise.all([loadClasses(), loadTeachers(), loadLinks()]);
      setClasses(c);
      setTeachers(t);
      setLinks(l);

      if (!assignClassId && c.length > 0) setAssignClassId(c[0].id);
      if (!assignTeacherId && t.length > 0) setAssignTeacherId(t[0].id);
    } catch (e: any) {
      setErr(e?.message ?? "Load failed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const classById = useMemo(() => {
    const m = new Map<string, ClassRow>();
    for (const c of classes) m.set(c.id, c);
    return m;
  }, [classes]);

  const teacherById = useMemo(() => {
    const m = new Map<string, TeacherRow>();
    for (const t of teachers) m.set(t.id, t);
    return m;
  }, [teachers]);

  const linkByClass = useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const l of links) {
      if (!m.has(l.class_id)) m.set(l.class_id, new Set<string>());
      m.get(l.class_id)!.add(l.teacher_id);
    }
    return m;
  }, [links]);

  const classCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of classes) counts[c.id] = 0;
    for (const l of links) counts[l.class_id] = (counts[l.class_id] ?? 0) + 1;
    return counts;
  }, [classes, links]);

  const filteredTeachers = useMemo(() => {
    const q = teacherSearch.trim().toLowerCase();
    if (!q) return teachers;
    return teachers.filter((t) => t.label.toLowerCase().includes(q) || (t.email ?? "").toLowerCase().includes(q));
  }, [teachers, teacherSearch]);

  const fontSizePx = useMemo(() => {
    if (printFontSize === "S") return 12;
    if (printFontSize === "L") return 16;
    return 14;
  }, [printFontSize]);

  const assignTeacherToClass = async (classId: string, teacherId: string) => {
    setErr("");
    setOk("");

    if (!classId) return setErr("Choose a class.");
    if (!teacherId) return setErr("Choose a teacher.");

    const set = linkByClass.get(classId);
    if (set && set.has(teacherId)) {
      setOk("Already assigned ✅");
      return;
    }

    setSaving(true);
    const { error } = await supabase.from("class_teachers").insert([{ class_id: classId, teacher_id: teacherId }]);

    if (error) {
      const msg = error.message ?? "";
      if (msg.toLowerCase().includes("duplicate") || msg.includes("23505")) {
        setOk("Already assigned ✅");
        setSaving(false);
        return;
      }
      setErr(`Assign failed: ${error.message}`);
      setSaving(false);
      return;
    }

    setLinks((prev) => [...prev, { class_id: classId, teacher_id: teacherId }]);
    setOk("Assigned ✅");
    setSaving(false);
  };

  const unassignTeacherFromClass = async (classId: string, teacherId: string) => {
    setErr("");
    setOk("");

    setSaving(true);

    const { error } = await supabase
      .from("class_teachers")
      .delete()
      .eq("class_id", classId)
      .eq("teacher_id", teacherId);

    if (error) {
      setErr(`Unassign failed: ${error.message}`);
      setSaving(false);
      return;
    }

    setLinks((prev) => prev.filter((l) => !(l.class_id === classId && l.teacher_id === teacherId)));
    setOk("Unassigned ✅");
    setSaving(false);
  };

  const escapeCsv = (v: string) => {
    const needs = /[",\n]/.test(v);
    const safeValue = v.replace(/"/g, '""');
    return needs ? `"${safeValue}"` : safeValue;
  };

  const downloadCsv = (filename: string, rows: Record<string, any>[]) => {
    if (rows.length === 0) {
      setErr("No rows to export.");
      return;
    }
    const headers = Object.keys(rows[0]);
    const lines = [
      headers.map(escapeCsv).join(","),
      ...rows.map((r) => headers.map((h) => escapeCsv(String(r[h] ?? ""))).join(",")),
    ];
    const csv = "\ufeff" + lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    setOk(`Exported CSV ✅ (${filename})`);
  };

  const rowsForClass = (classId: string) => {
    const c = classById.get(classId);
    const className = c?.name ?? classId;
    const year = c?.year_level != null ? String(c.year_level) : "";

    const assigned = links
      .filter((l) => l.class_id === classId)
      .map((l) => teacherById.get(l.teacher_id))
      .filter(Boolean) as TeacherRow[];

    assigned.sort((a, b) => a.label.localeCompare(b.label));

    return assigned.map((t) => {
      const row: Record<string, any> = {
        Class: className,
        Year: year,
        Teacher: t.label,
        Email: t.email ?? "",
        Source: t.source,
      };
      if (printIncludeIds) row.TeacherId = t.id;
      if (printIncludeIds) row.ClassId = classId;
      return row;
    });
  };

  const exportClassCsv = (classId: string) => {
    const today = new Date().toISOString().slice(0, 10);
    const cname = (classById.get(classId)?.name ?? classId).replace(/[^\w\- ]+/g, "").replace(/\s+/g, "_");
    downloadCsv(`class_teachers_${cname}_${today}.csv`, rowsForClass(classId));
  };

  const exportAllCsv = () => {
    const today = new Date().toISOString().slice(0, 10);
    const rows: Record<string, any>[] = [];
    for (const c of classes) rows.push(...rowsForClass(c.id));
    downloadCsv(`class_teachers_all_${today}.csv`, rows);
  };

  const doPrint = () => setTimeout(() => window.print(), 50);

  if (loading) return <main style={{ padding: 24, maxWidth: 1200 }}>Loading…</main>;

  return (
    <main style={{ padding: 24, maxWidth: 1200 }}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-pagebreak { break-after: page; page-break-after: always; }
          .print-avoid-break { break-inside: avoid; page-break-inside: avoid; }
        }
        .print-only { display: none; }
      `}</style>

      <section className="print-only" style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 18, fontWeight: 900 }}>Teacher ↔ Class Assignments</div>
        <div style={{ fontSize: 12, opacity: 0.75 }}>{new Date().toLocaleString()}</div>
      </section>

      <section style={panel} className="no-print">
        <div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>ADMIN • SCHOOL SETUP</div>
          <div style={{ fontSize: 22, fontWeight: 900, marginTop: 4 }}>Teacher ↔ Class Assignment</div>
          <div style={{ fontSize: 12, opacity: 0.75 }}>
            Assign teachers to classes. Calm roster view + CSV export + Print.
          </div>

          <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Pill label={`Classes: ${classes.length}`} />
            <Pill label={`Teachers: ${teachers.length}`} />
            <Pill label={`Links: ${links.length}`} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button onClick={() => router.push("/admin")} style={btn}>
            ← Back to Admin
          </button>
          <button onClick={() => loadAll()} style={btn}>
            Refresh
          </button>
          <button onClick={() => setClassFocusId("")} style={btn}>
            Clear class focus
          </button>
        </div>
      </section>

      {!!err && (
        <div className="no-print" style={alertErr}>
          <strong style={{ color: "crimson" }}>Error:</strong> {err}
        </div>
      )}
      {!!ok && (
        <div className="no-print" style={alertOk}>
          <strong style={{ color: "green" }}>OK:</strong> {ok}
        </div>
      )}

      <section className="no-print" style={{ ...panel, marginBottom: 16 }}>
        <div style={{ width: "100%" }}>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>Quick Assign</div>
          <div style={{ fontSize: 12, opacity: 0.75 }}>Pick a class → pick a teacher → assign.</div>

          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1.2fr 1.8fr 1fr", gap: 12 }}>
            <label style={{ fontSize: 12 }}>
              Class
              <select value={assignClassId} onChange={(e) => setAssignClassId(e.target.value)} style={select}>
                <option value="">Select class…</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name ?? c.id} {c.year_level != null ? `(Year ${c.year_level})` : ""}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ fontSize: 12 }}>
              Teacher
              <select value={assignTeacherId} onChange={(e) => setAssignTeacherId(e.target.value)} style={select}>
                <option value="">Select teacher…</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={() => assignTeacherToClass(assignClassId, assignTeacherId)}
                disabled={saving || !assignClassId || !assignTeacherId}
                style={{ ...btn, background: "#111", color: "white" }}
              >
                {saving ? "Saving…" : "Assign"}
              </button>

              <button onClick={exportAllCsv} style={btn} title="Exports a single CSV for all class-teacher links">
                Export ALL (CSV)
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="no-print" style={{ ...panel, marginBottom: 16 }}>
        <div style={{ width: "100%" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontWeight: 900, marginBottom: 6 }}>Print</div>
              <div style={{ fontSize: 12, opacity: 0.75 }}>Print class rosters of teacher assignments.</div>
            </div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <label style={{ fontSize: 12, display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={printIncludeIds}
                  onChange={(e) => setPrintIncludeIds(e.target.checked)}
                />
                Include IDs
              </label>

              <label style={{ fontSize: 12 }}>
                Font
                <select
                  value={printFontSize}
                  onChange={(e) => setPrintFontSize(e.target.value as "S" | "M" | "L")}
                  style={{ ...select, width: 140, marginTop: 6 }}
                >
                  <option value="S">Small</option>
                  <option value="M">Medium</option>
                  <option value="L">Large</option>
                </select>
              </label>

              <button onClick={doPrint} style={{ ...btn, background: "#111", color: "white" }}>
                Print
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="no-print" style={{ ...panel, marginBottom: 16 }}>
        <div style={{ width: "100%" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.8fr", gap: 12 }}>
            <label style={{ fontSize: 12 }}>
              Focus a class roster
              <select value={classFocusId} onChange={(e) => setClassFocusId(e.target.value)} style={select}>
                <option value="">Show all classes</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name ?? c.id} {c.year_level != null ? `(Year ${c.year_level})` : ""}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ fontSize: 12 }}>
              Search teachers (for your dropdown sanity)
              <input
                value={teacherSearch}
                onChange={(e) => setTeacherSearch(e.target.value)}
                placeholder="Type a name or email…"
                style={input}
              />
            </label>
          </div>

          {teacherSearch.trim() ? (
            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
              Teachers matching search: <strong>{filteredTeachers.length}</strong>
            </div>
          ) : null}
        </div>
      </section>

      <section style={panel} className="print-avoid-break">
        <div className="no-print" style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 900, marginBottom: 6 }}>Class Rosters</div>
            <div style={{ fontSize: 12, opacity: 0.75 }}>Each class shows assigned teachers with quick unassign.</div>
          </div>
        </div>

        <div style={{ marginTop: 12, fontSize: fontSizePx, width: "100%" }}>
          {(classFocusId ? classes.filter((c) => c.id === classFocusId) : classes).map((c, idx, arr) => {
            const assignedTeacherIds = Array.from(
              (linkByClass.get(c.id) ?? new Set<string>()) as Set<string>
            ) as string[];

            const assignedTeachers = assignedTeacherIds
              .map((tid) => teacherById.get(tid))
              .filter(Boolean) as TeacherRow[];

            assignedTeachers.sort((a, b) => a.label.localeCompare(b.label));

            const count = classCounts[c.id] ?? 0;

            return (
              <div key={c.id} className={idx < arr.length - 1 ? "print-pagebreak" : ""} style={{ marginBottom: 10 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                    alignItems: "baseline",
                  }}
                >
                  <div style={{ fontWeight: 900, fontSize: 18 }}>
                    {c.name ?? c.id}{" "}
                    <span style={{ fontSize: 12, opacity: 0.75 }}>
                      • {c.year_level != null ? `Year ${c.year_level}` : "Year —"} • {count} teacher(s)
                    </span>
                  </div>

                  <div className="no-print" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button onClick={() => exportClassCsv(c.id)} style={tinyBtn}>
                      Export CSV
                    </button>

                    <button
                      onClick={() => {
                        setAssignClassId(c.id);
                        if (filteredTeachers.length > 0) setAssignTeacherId(filteredTeachers[0].id);
                      }}
                      style={tinyBtn}
                      title="Set this class in the Quick Assign panel"
                    >
                      Quick assign here
                    </button>
                  </div>
                </div>

                {assignedTeachers.length === 0 ? (
                  <div style={{ marginTop: 10, fontSize: 13, opacity: 0.75 }}>No teachers assigned.</div>
                ) : (
                  <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7, marginTop: 10 }}>
                    {assignedTeachers.map((t) => (
                      <li key={t.id} className="print-avoid-break" style={{ marginBottom: 6 }}>
                        <span style={{ fontWeight: 900 }}>{t.label}</span>{" "}
                        {t.email ? <span style={{ fontSize: 12, opacity: 0.75 }}>• {t.email}</span> : null}
                        {printIncludeIds ? (
                          <span style={{ fontSize: 12, opacity: 0.75, marginLeft: 8 }}>
                            (<code>{t.id}</code>)
                          </span>
                        ) : null}

                        <span className="no-print" style={{ marginLeft: 10 }}>
                          <button
                            onClick={() => unassignTeacherFromClass(c.id, t.id)}
                            disabled={saving}
                            style={{ ...tinyBtn, borderRadius: 10 }}
                            title="Remove this teacher from the class"
                          >
                            {saving ? "Saving…" : "Unassign"}
                          </button>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                {printIncludeIds ? (
                  <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
                    Class ID: <code>{c.id}</code>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      <section className="no-print" style={{ marginTop: 14, fontSize: 12, opacity: 0.7 }}>
        <details>
          <summary>Schema notes (if something breaks)</summary>
          <div style={{ marginTop: 8 }}>
            This page expects:
            <ul>
              <li>
                <code>classes</code> table with: <code>id</code>, <code>name</code>, <code>year_level</code>
              </li>
              <li>
                <code>class_teachers</code> join table with: <code>class_id</code>, <code>teacher_id</code>
              </li>
              <li>
                Teacher source:
                <ul>
                  <li>Prefer <code>teachers</code> table (any of: preferred_name/first_name/last_name/full_name/name/email)</li>
                  <li>Fallback to <code>admins</code> table (uses email as label)</li>
                </ul>
              </li>
            </ul>
            If your teachers are stored somewhere else, tell me the table + columns and I’ll hard-wire it cleanly.
          </div>
        </details>
      </section>
    </main>
  );
}

function Pill({ label }: { label: string }) {
  return (
    <span
      style={{
        padding: "6px 10px",
        borderRadius: 999,
        border: "1px solid #e6e6e6",
        fontSize: 12,
        fontWeight: 800,
      }}
    >
      {label}
    </span>
  );
}

const panel: React.CSSProperties = {
  border: "1px solid #e6e6e6",
  borderRadius: 16,
  padding: 16,
  marginBottom: 12,
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
};

const btn: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 10,
  border: "1px solid #ddd",
  fontWeight: 900,
  cursor: "pointer",
};

const tinyBtn: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 10,
  border: "1px solid #ddd",
  fontSize: 12,
  fontWeight: 900,
  cursor: "pointer",
};

const select: React.CSSProperties = {
  width: "100%",
  marginTop: 6,
  padding: 10,
  borderRadius: 12,
  border: "1px solid #ddd",
};

const input: React.CSSProperties = {
  width: "100%",
  marginTop: 6,
  padding: 10,
  borderRadius: 12,
  border: "1px solid #ddd",
};

const alertErr: React.CSSProperties = {
  marginBottom: 14,
  padding: 10,
  border: "1px solid #f2c1c1",
  borderRadius: 10,
};

const alertOk: React.CSSProperties = {
  marginBottom: 14,
  padding: 10,
  border: "1px solid #cfe9cf",
  borderRadius: 10,
};
