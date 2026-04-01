"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

type TeacherRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  email: string | null;
  created_at: string;
};

export default function TeacherEntryPage() {
  const router = useRouter();

  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [loading, setLoading] = useState(true);

  // form
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const fullNamePreview = useMemo(() => {
    const fn = firstName.trim();
    const ln = lastName.trim();
    return [fn, ln].filter(Boolean).join(" ");
  }, [firstName, lastName]);

  // ─────────────────────────────
  // AUTH GUARD
  // ─────────────────────────────
  useEffect(() => {
    const guard = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) window.location.href = "/";
    };
    guard();
  }, []);

  // ─────────────────────────────
  // LOAD TEACHERS
  // ─────────────────────────────
  const loadTeachers = async () => {
    setLoading(true);
    setErr("");

    const { data, error } = await supabase
      .from("teachers")
      .select("id, first_name, last_name, full_name, email, created_at")
      .order("full_name", { ascending: true });

    if (error) {
      setErr(error.message);
      setTeachers([]);
    } else {
      setTeachers((data as TeacherRow[]) ?? []);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadTeachers();
  }, []);

  // ─────────────────────────────
  // CREATE TEACHER
  // ─────────────────────────────
  const createTeacher = async () => {
    setErr("");
    setOk("");

    const fn = firstName.trim();
    const ln = lastName.trim();
    const em = email.trim();

    if (!fn || !ln) {
      setErr("First name and last name are required.");
      return;
    }

    const full_name = `${fn} ${ln}`.trim();

    setSaving(true);

    const { error } = await supabase.from("teachers").insert([
      {
        first_name: fn,
        last_name: ln,
        full_name,
        email: em === "" ? null : em,
      },
    ]);

    if (error) {
      setErr(error.message);
      setSaving(false);
      return;
    }

    setFirstName("");
    setLastName("");
    setEmail("");
    setOk("Teacher created ✅");

    await loadTeachers();
    setSaving(false);
  };

  // ─────────────────────────────
  // DELETE TEACHER (SAFE)
  // ─────────────────────────────
  const deleteTeacher = async (id: string, label: string) => {
    if (!confirm(`Delete teacher "${label}"?`)) return;

    setErr("");
    setOk("");

    const { error } = await supabase.from("teachers").delete().eq("id", id);

    if (error) {
      setErr(error.message);
      return;
    }

    setOk("Teacher deleted");
    await loadTeachers();
  };

  if (loading) return <main style={{ padding: 24 }}>Loading teachers…</main>;

  return (
    <main style={{ padding: 24, maxWidth: 1000 }}>
      {/* Header */}
      <section
        style={{
          border: "1px solid #e6e6e6",
          borderRadius: 16,
          padding: 16,
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>ADMIN • SCHOOL SETUP</div>
          <div style={{ fontSize: 22, fontWeight: 900, marginTop: 4 }}>
            Teacher Management
          </div>
          <div style={{ fontSize: 12, opacity: 0.75 }}>
            Create and manage staff accounts.
          </div>
        </div>

        <button
          onClick={() => router.push("/admin")}
          style={{
            padding: "8px 12px",
            borderRadius: 10,
            border: "1px solid #ddd",
          }}
        >
          ← Back to Admin
        </button>
      </section>

      {!!err && (
        <div
          style={{
            marginBottom: 14,
            padding: 10,
            border: "1px solid #f2c1c1",
            borderRadius: 10,
          }}
        >
          <strong style={{ color: "crimson" }}>Error:</strong> {err}
        </div>
      )}
      {!!ok && (
        <div
          style={{
            marginBottom: 14,
            padding: 10,
            border: "1px solid #cfe9cf",
            borderRadius: 10,
          }}
        >
          <strong style={{ color: "green" }}>OK:</strong> {ok}
        </div>
      )}

      {/* Add Teacher */}
      <section
        style={{
          border: "1px solid #e6e6e6",
          borderRadius: 16,
          padding: 16,
          marginBottom: 20,
        }}
      >
        <div style={{ fontWeight: 900, marginBottom: 8 }}>Add Teacher</div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: 12 }}>
          <label style={{ fontSize: 12 }}>
            First name
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="e.g. Sean"
              style={{
                width: "100%",
                marginTop: 6,
                padding: 10,
                borderRadius: 12,
                border: "1px solid #ddd",
              }}
            />
          </label>

          <label style={{ fontSize: 12 }}>
            Last name
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="e.g. Bint"
              style={{
                width: "100%",
                marginTop: 6,
                padding: 10,
                borderRadius: 12,
                border: "1px solid #ddd",
              }}
            />
          </label>

          <label style={{ fontSize: 12 }}>
            Email (optional)
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. test@school.com"
              style={{
                width: "100%",
                marginTop: 6,
                padding: 10,
                borderRadius: 12,
                border: "1px solid #ddd",
              }}
            />
          </label>
        </div>

        <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center" }}>
          <button
            onClick={createTeacher}
            disabled={saving}
            style={{ padding: "10px 14px", borderRadius: 12, border: "1px solid #ddd" }}
          >
            {saving ? "Saving…" : "Add teacher"}
          </button>

          <div style={{ fontSize: 12, opacity: 0.7 }}>
            Preview: <strong>{fullNamePreview || "—"}</strong>
          </div>
        </div>
      </section>

      {/* Teacher List */}
      <section style={{ border: "1px solid #e6e6e6", borderRadius: 16, padding: 16 }}>
        <div style={{ fontWeight: 900, marginBottom: 8 }}>
          Teachers ({teachers.length})
        </div>

        {teachers.length === 0 ? (
          <div style={{ fontSize: 13, opacity: 0.75 }}>No teachers added yet.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ fontSize: 12, opacity: 0.7, textAlign: "left" }}>
                <th style={{ padding: "8px 6px" }}>Name</th>
                <th style={{ padding: "8px 6px" }}>Email</th>
                <th style={{ padding: "8px 6px", width: 140 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((t) => {
                const name =
                  (t.full_name && t.full_name.trim()) ||
                  [t.first_name, t.last_name].filter(Boolean).join(" ") ||
                  "—";

                return (
                  <tr key={t.id} style={{ borderTop: "1px solid #f0f0f0" }}>
                    <td style={{ padding: "10px 6px", fontWeight: 800 }}>
                      {name}
                    </td>
                    <td style={{ padding: "10px 6px" }}>{t.email ?? "—"}</td>
                    <td style={{ padding: "10px 6px" }}>
                      <button
                        onClick={() => deleteTeacher(t.id, name)}
                        style={{
                          padding: "6px 10px",
                          borderRadius: 10,
                          border: "1px solid #ddd",
                          fontSize: 12,
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        <div style={{ marginTop: 10, fontSize: 12, opacity: 0.65 }}>
          Table: <code>teachers</code> • Columns expected:{" "}
          <code>first_name</code>, <code>last_name</code>, <code>full_name</code>{" "}
          (NOT NULL), <code>email</code>.
        </div>
      </section>
    </main>
  );
}
