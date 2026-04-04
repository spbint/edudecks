"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AdminLeftNav from "@/app/components/AdminLeftNav";
import { supabase } from "@/lib/supabaseClient";

/* ───────────────────────── TYPES ───────────────────────── */

type ClassRow = {
  id: string;
  name: string | null;
  year_level?: number | null;
  [k: string]: any;
};

type StudentRow = {
  id: string;
  class_id: string | null;
  first_name: string | null;
  preferred_name?: string | null;
  surname?: string | null;
  family_name?: string | null;
  is_ilp?: boolean | null;
  status?: string | null;
  is_archived?: boolean | null;
  created_at?: string | null;
  [k: string]: any;
};

/* ───────────────────────── HELPERS ───────────────────────── */

function safe(v: any) {
  return String(v ?? "").trim();
}

function isMissingColumnError(err: any) {
  const msg = String(err?.message ?? "").toLowerCase();
  return msg.includes("does not exist") && msg.includes("column");
}

function fmtYear(y?: number | null) {
  return y == null ? "" : `Y${y}`;
}

function studentDisplayName(s: Partial<StudentRow> | null | undefined) {
  if (!s) return "Student";
  const first = safe(s.preferred_name || s.first_name);
  const sur = safe((s as any).surname || (s as any).family_name);
  const full = `${first}${sur ? " " + sur : ""}`.trim();
  return full || "Student";
}

/* ───────────────────────── STYLES ───────────────────────── */

const S = {
  shell: { display: "flex", minHeight: "100vh", background: "#f6f7fb" } as React.CSSProperties,
  main: { flex: 1, padding: 24, maxWidth: 1260, margin: "0 auto", width: "100%" } as React.CSSProperties,

  hero: {
    border: "1px solid #e8eaf0",
    borderRadius: 22,
    background: "linear-gradient(135deg, rgba(17,24,39,0.06), rgba(99,102,241,0.08))",
    padding: 18,
  } as React.CSSProperties,

  h1: { fontSize: 34, fontWeight: 950, margin: 0, color: "#0f172a", lineHeight: 1.05 } as React.CSSProperties,
  sub: { marginTop: 8, color: "#475569", fontWeight: 800, fontSize: 13, lineHeight: 1.45 } as React.CSSProperties,

  card: { border: "1px solid #e8eaf0", borderRadius: 18, background: "#fff" } as React.CSSProperties,
  subtle: {
    color: "#6b7280",
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  } as React.CSSProperties,

  grid: { marginTop: 14, display: "grid", gap: 14 } as React.CSSProperties,
  row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 } as React.CSSProperties,
  twoCol: { marginTop: 14, display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 14 } as React.CSSProperties,

  label: { display: "block", fontWeight: 950, color: "#0f172a", marginBottom: 6 } as React.CSSProperties,

  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    outline: "none",
    fontWeight: 800,
    color: "#0f172a",
    background: "#fff",
  } as React.CSSProperties,

  select: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    outline: "none",
    fontWeight: 800,
    color: "#0f172a",
    background: "#fff",
  } as React.CSSProperties,

  chip: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid #e5e7eb",
    background: "#fff",
    fontSize: 12,
    fontWeight: 900,
    color: "#0f172a",
    whiteSpace: "nowrap",
  } as React.CSSProperties,

  chipMuted: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    fontSize: 12,
    fontWeight: 900,
    color: "#475569",
    whiteSpace: "nowrap",
  } as React.CSSProperties,

  err: {
    marginTop: 10,
    border: "1px solid #fecaca",
    background: "#fff1f2",
    padding: 12,
    borderRadius: 14,
    color: "#9f1239",
    fontWeight: 900,
  } as React.CSSProperties,

  ok: {
    marginTop: 10,
    border: "1px solid #bbf7d0",
    background: "#ecfdf5",
    padding: 12,
    borderRadius: 14,
    color: "#065f46",
    fontWeight: 900,
  } as React.CSSProperties,

  actions: { display: "flex", gap: 12, marginTop: 6, flexWrap: "wrap" } as React.CSSProperties,

  btn: {
    padding: "12px 16px",
    fontWeight: 900,
    background: "#e5e7eb",
    color: "#0f172a",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    cursor: "pointer",
  } as React.CSSProperties,

  btnPrimary: {
    padding: "12px 16px",
    fontWeight: 950,
    background: "#111827",
    color: "#fff",
    borderRadius: 12,
    border: "1px solid #111827",
    cursor: "pointer",
  } as React.CSSProperties,

  btnDanger: {
    padding: "12px 16px",
    fontWeight: 950,
    background: "#fff1f2",
    color: "#9f1239",
    borderRadius: 12,
    border: "1px solid #fecaca",
    cursor: "pointer",
  } as React.CSSProperties,

  btnMini: {
    padding: "8px 10px",
    fontWeight: 900,
    background: "#ffffff",
    color: "#0f172a",
    borderRadius: 10,
    border: "1px solid #dbe2ea",
    cursor: "pointer",
  } as React.CSSProperties,

  sectionPad: { padding: 16 } as React.CSSProperties,

  sectionTitle: {
    fontSize: 18,
    fontWeight: 950,
    color: "#0f172a",
  } as React.CSSProperties,

  sectionHelp: {
    marginTop: 6,
    color: "#64748b",
    fontSize: 12,
    fontWeight: 800,
    lineHeight: 1.45,
  } as React.CSSProperties,

  list: {
    display: "grid",
    gap: 10,
    marginTop: 12,
  } as React.CSSProperties,

  item: {
    border: "1px solid #edf2f7",
    borderRadius: 14,
    background: "#fff",
    padding: 12,
  } as React.CSSProperties,
};

/* ───────────────────────── PAGE ───────────────────────── */

export default function StudentEntryPage() {
  return (
    <Suspense fallback={null}>
      <StudentEntryPageContent />
    </Suspense>
  );
}

function StudentEntryPageContent() {
  const router = useRouter();
  const sp = useSearchParams();

  const editId = safe(sp.get("id"));
  const classIdParam = safe(sp.get("class_id") || sp.get("classId"));

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [existing, setExisting] = useState<StudentRow | null>(null);

  const [classId, setClassId] = useState<string>(classIdParam);
  const [firstName, setFirstName] = useState("");
  const [preferredName, setPreferredName] = useState("");
  const [surname, setSurname] = useState("");
  const [isIlp, setIsIlp] = useState(false);
  const [status, setStatus] = useState("active");
  const [isArchived, setIsArchived] = useState(false);
  const [search, setSearch] = useState("");

  async function loadClasses() {
    const { data, error } = await supabase
      .from("classes")
      .select("id,name,year_level")
      .order("year_level", { ascending: true })
      .order("name", { ascending: true });

    if (error) throw error;
    setClasses((data ?? []) as ClassRow[]);
  }

  async function loadStudents() {
    const tries = [
      "id,class_id,first_name,preferred_name,surname,is_ilp,status,is_archived,created_at",
      "id,class_id,first_name,preferred_name,family_name,is_ilp,status,is_archived,created_at",
      "id,class_id,first_name,preferred_name,surname,is_ilp,created_at",
      "id,class_id,first_name,preferred_name,family_name,is_ilp,created_at",
      "id,class_id,first_name,preferred_name,created_at",
    ];

    for (const sel of tries) {
      const r = await supabase
        .from("students")
        .select(sel)
        .limit(30000);

      if (!r.error) {
        setStudents(((r.data ?? []) as unknown) as StudentRow[]);
        return;
      }

      if (!isMissingColumnError(r.error)) throw r.error;
    }

    setStudents([]);
  }

  async function loadExisting() {
    if (!editId) return;

    const tries = [
      "id,class_id,first_name,preferred_name,surname,is_ilp,status,is_archived,created_at",
      "id,class_id,first_name,preferred_name,family_name,is_ilp,status,is_archived,created_at",
      "id,class_id,first_name,preferred_name,surname,is_ilp,is_archived,created_at",
      "id,class_id,first_name,preferred_name,family_name,is_ilp,is_archived,created_at",
      "id,class_id,first_name,preferred_name,surname,created_at",
      "id,class_id,first_name,preferred_name,family_name,created_at",
    ];

    for (const sel of tries) {
      const r = await supabase.from("students").select(sel).eq("id", editId).single();
      if (!r.error) {
        const s = (r.data as unknown) as StudentRow;
        setExisting(s);

        setClassId(s.class_id ?? classIdParam ?? "");
        setFirstName(s.first_name ?? "");
        setPreferredName(s.preferred_name ?? "");
        setSurname((s as any).surname ?? (s as any).family_name ?? "");
        setIsIlp(!!s.is_ilp);
        setStatus(safe(s.status) || "active");
        setIsArchived(!!s.is_archived);
        return;
      }

      if (!isMissingColumnError(r.error)) throw r.error;
    }
  }

  async function loadAll() {
    setBusy(true);
    setErr(null);
    setOkMsg(null);

    try {
      await Promise.all([loadClasses(), loadStudents()]);
      await loadExisting();
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load student entry page.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedClass = useMemo(() => classes.find((c) => c.id === classId), [classes, classId]);

  const previewStudent = useMemo(
    () =>
      ({
        first_name: firstName,
        preferred_name: preferredName,
        surname,
      }) as Partial<StudentRow>,
    [firstName, preferredName, surname]
  );

  const studentsInClass = useMemo(() => {
    const list = students.filter((s) => !classId || s.class_id === classId);
    const q = safe(search).toLowerCase();

    const filtered = !q
      ? list
      : list.filter((s) => {
          const hay = [
            studentDisplayName(s),
            safe(s.status),
            s.is_ilp ? "ilp" : "",
            s.is_archived ? "archived" : "",
          ]
            .join(" ")
            .toLowerCase();

          return hay.includes(q);
        });

    return filtered.sort((a, b) => studentDisplayName(a).localeCompare(studentDisplayName(b)));
  }, [students, classId, search]);

  function clearForm() {
    setFirstName("");
    setPreferredName("");
    setSurname("");
    setIsIlp(false);
    setStatus("active");
    setIsArchived(false);
    if (!classIdParam) setClassId("");
  }

  async function save() {
    setBusy(true);
    setErr(null);
    setOkMsg(null);

    try {
      if (!classId) throw new Error("Please choose a class.");
      if (!safe(firstName)) throw new Error("Please enter a first name.");

      const basePayload: any = {
        class_id: classId,
        first_name: safe(firstName) || null,
        preferred_name: safe(preferredName) || null,
        is_ilp: !!isIlp,
        status: safe(status) || "active",
        is_archived: !!isArchived,
      };

      const surnamePayload = { ...basePayload, surname: safe(surname) || null };
      const familyPayload = { ...basePayload, family_name: safe(surname) || null };

      if (editId) {
        let r = await supabase.from("students").update(surnamePayload).eq("id", editId);

        if (r.error && isMissingColumnError(r.error)) {
          r = await supabase.from("students").update(familyPayload).eq("id", editId);
        }

        if (r.error && isMissingColumnError(r.error)) {
          const fallback = await supabase.from("students").update(basePayload).eq("id", editId);
          if (fallback.error) throw fallback.error;
        } else if (r.error) {
          throw r.error;
        }

        setOkMsg("Student updated.");
        router.push(`/admin/students/${editId}`);
        return;
      } else {
        let insertedId = "";

        let r = await supabase.from("students").insert(surnamePayload).select("id").single();

        if (r.error && isMissingColumnError(r.error)) {
          r = await supabase.from("students").insert(familyPayload).select("id").single();
        }

        if (r.error && isMissingColumnError(r.error)) {
          const fallback = await supabase.from("students").insert(basePayload).select("id").single();
          if (fallback.error) throw fallback.error;
          insertedId = safe((fallback.data as any)?.id);
        } else if (r.error) {
          throw r.error;
        } else {
          insertedId = safe((r.data as any)?.id);
        }

        setOkMsg("Student created.");

        if (insertedId) {
          router.push(`/admin/students/${insertedId}`);
          return;
        }

        router.push(classId ? `/admin/classes/${classId}` : "/admin/students");
      }
    } catch (e: any) {
      setErr(e?.message ?? "Save failed.");
    } finally {
      setBusy(false);
      setTimeout(() => setOkMsg(null), 1400);
    }
  }

  async function archiveStudent() {
    if (!editId) return;
    const ok = window.confirm("Archive this student?");
    if (!ok) return;

    setBusy(true);
    setErr(null);
    setOkMsg(null);

    try {
      const r = await supabase.from("students").update({ is_archived: true }).eq("id", editId);
      if (r.error) throw r.error;
      setOkMsg("Student archived.");
      await loadExisting();
    } catch (e: any) {
      setErr(e?.message ?? "Archive failed.");
    } finally {
      setBusy(false);
      setTimeout(() => setOkMsg(null), 1400);
    }
  }

  return (
    <div style={S.shell}>
      <AdminLeftNav />

      <main style={S.main}>
        <section style={S.hero}>
          <div style={S.subtle}>Student Entry</div>
          <h1 style={S.h1}>{editId ? "Edit student" : "New student"}</h1>
          <div style={S.sub}>
            Create or edit a student record for your class roster, then jump straight into the student profile or class hub.
            <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <span style={S.chip}>Student: {studentDisplayName(previewStudent)}</span>

              {selectedClass ? (
                <span style={S.chip}>
                  Class: {safe(selectedClass.name) || "Class"}{" "}
                  {selectedClass.year_level != null ? fmtYear(selectedClass.year_level) : ""}
                </span>
              ) : (
                <span style={S.chip}>Class: —</span>
              )}

              <span style={S.chip}>ILP: {isIlp ? "Yes" : "No"}</span>
              <span style={S.chip}>Status: {status}</span>
              {isArchived ? <span style={S.chipMuted}>Archived</span> : null}

              <div style={{ marginLeft: "auto", display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button style={S.btn} onClick={loadAll} disabled={busy}>
                  Refresh
                </button>
                <button
                  style={S.btn}
                  onClick={() => router.push(classId ? `/admin/classes/${classId}` : "/admin/students")}
                  disabled={busy}
                >
                  Back →
                </button>
              </div>
            </div>
          </div>

          {err ? <div style={S.err}>{err}</div> : null}
          {okMsg ? <div style={S.ok}>{okMsg}</div> : null}
        </section>

        <section style={S.twoCol}>
          <div style={{ ...S.card }}>
            <div style={S.sectionPad}>
              <div style={S.sectionTitle}>Student details</div>
              <div style={S.sectionHelp}>
                Complete the core roster details below. First name is required.
              </div>

              <div style={S.grid}>
                <div style={S.row2}>
                  <div>
                    <label style={S.label}>Class</label>
                    <select value={classId} onChange={(e) => setClassId(e.target.value)} style={S.select} disabled={busy}>
                      <option value="">Select class</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {safe(c.name) || "Class"} {c.year_level != null ? `(${fmtYear(c.year_level)})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={S.label}>Status</label>
                    <select value={status} onChange={(e) => setStatus(e.target.value)} style={S.select} disabled={busy}>
                      <option value="active">active</option>
                      <option value="monitor">monitor</option>
                      <option value="inactive">inactive</option>
                    </select>
                  </div>
                </div>

                <div style={S.row2}>
                  <div>
                    <label style={S.label}>First name</label>
                    <input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      style={S.input}
                      placeholder="Required"
                      disabled={busy}
                    />
                  </div>

                  <div>
                    <label style={S.label}>Preferred name</label>
                    <input
                      value={preferredName}
                      onChange={(e) => setPreferredName(e.target.value)}
                      style={S.input}
                      placeholder="Optional"
                      disabled={busy}
                    />
                  </div>
                </div>

                <div>
                  <label style={S.label}>Surname / family name</label>
                  <input
                    value={surname}
                    onChange={(e) => setSurname(e.target.value)}
                    style={S.input}
                    placeholder="Optional"
                    disabled={busy}
                  />
                </div>

                <div style={S.row2}>
                  <label style={{ ...S.label, display: "flex", alignItems: "center", gap: 10, marginBottom: 0 }}>
                    <input type="checkbox" checked={isIlp} onChange={(e) => setIsIlp(e.target.checked)} disabled={busy} />
                    ILP student
                  </label>

                  <label style={{ ...S.label, display: "flex", alignItems: "center", gap: 10, marginBottom: 0 }}>
                    <input
                      type="checkbox"
                      checked={isArchived}
                      onChange={(e) => setIsArchived(e.target.checked)}
                      disabled={busy}
                    />
                    Archived
                  </label>
                </div>

                <div style={S.actions}>
                  <button onClick={save} disabled={busy} style={S.btnPrimary}>
                    {busy ? "Saving…" : editId ? "Update student" : "Create student"}
                  </button>

                  <button
                    onClick={() => {
                      clearForm();
                      if (editId) {
                        router.push(`/admin/student-entry${classId ? `?class_id=${encodeURIComponent(classId)}` : ""}`);
                      }
                    }}
                    style={S.btn}
                    disabled={busy}
                  >
                    New student
                  </button>

                  <button
                    onClick={() => router.push(classId ? `/admin/classes/${classId}` : "/admin/students")}
                    style={S.btn}
                    disabled={busy}
                  >
                    Cancel
                  </button>

                  {editId ? (
                    <button
                      onClick={archiveStudent}
                      style={S.btnDanger}
                      disabled={busy || !!existing?.is_archived}
                    >
                      {existing?.is_archived ? "Archived" : "Archive"}
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div style={{ ...S.card }}>
            <div style={S.sectionPad}>
              <div style={S.sectionTitle}>Class roster preview</div>
              <div style={S.sectionHelp}>
                A quick look at students in the selected class so you can place the new entry in context.
              </div>

              <div style={{ marginTop: 12 }}>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search selected class roster..."
                  style={S.input}
                />
              </div>

              <div style={S.list}>
                {classId ? (
                  studentsInClass.length ? (
                    studentsInClass.slice(0, 24).map((s) => (
                      <div key={s.id} style={S.item}>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                          <span style={S.chip}>{studentDisplayName(s)}</span>
                          {s.is_ilp ? <span style={S.chipMuted}>ILP</span> : null}
                          {safe(s.status) ? <span style={S.chipMuted}>{safe(s.status)}</span> : null}
                          {s.is_archived ? <span style={S.chipMuted}>Archived</span> : null}

                          <div style={{ marginLeft: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <button
                              style={S.btnMini}
                              onClick={() => router.push(`/admin/students/${s.id}`)}
                            >
                              Profile →
                            </button>
                            <button
                              style={S.btnMini}
                              onClick={() => router.push(`/admin/student-entry?id=${encodeURIComponent(s.id)}`)}
                            >
                              Edit →
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ color: "#64748b", fontWeight: 900, marginTop: 12 }}>
                      No students found in this class.
                    </div>
                  )
                ) : (
                  <div style={{ color: "#64748b", fontWeight: 900, marginTop: 12 }}>
                    Select a class to preview its roster.
                  </div>
                )}

                {classId && studentsInClass.length > 24 ? (
                  <div style={{ color: "#64748b", fontWeight: 900 }}>
                    Showing first 24 students. Use the search box to narrow the list.
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
