"use client";

import React, { useMemo, useState } from "react";
import AdminLeftNav from "@/app/components/AdminLeftNav";
import { supabase } from "@/lib/supabaseClient";

/* OneRoster CSVs commonly:
   - users.csv (students/teachers)
   - classes.csv
   - enrollments.csv
*/

type CsvRow = Record<string, string>;

function safe(v: any) {
  return String(v ?? "").trim();
}

function parseCsvText(text: string): { headers: string[]; rows: CsvRow[]; errors: string[] } {
  const errors: string[] = [];
  const rows: string[][] = [];
  let i = 0;
  const s = text.replace(/\uFEFF/g, "");
  const len = s.length;

  const readCell = () => {
    let out = "";
    if (s[i] === '"') {
      i++;
      while (i < len) {
        if (s[i] === '"') {
          if (s[i + 1] === '"') {
            out += '"';
            i += 2;
            continue;
          }
          i++;
          break;
        }
        out += s[i++];
      }
      while (i < len && (s[i] === " " || s[i] === "\t")) i++;
      if (s[i] === ",") i++;
      return out;
    } else {
      while (i < len && s[i] !== "," && s[i] !== "\n" && s[i] !== "\r") out += s[i++];
      if (s[i] === ",") i++;
      return out.trim();
    }
  };

  const readRow = () => {
    const row: string[] = [];
    while (i < len) {
      row.push(readCell());
      if (s[i] === "\n") {
        i++;
        break;
      }
      if (s[i] === "\r") {
        i++;
        if (s[i] === "\n") i++;
        break;
      }
      if (i >= len) break;
    }
    return row;
  };

  while (i < len) {
    if (s[i] === "\n") {
      i++;
      continue;
    }
    if (s[i] === "\r") {
      i++;
      if (s[i] === "\n") i++;
      continue;
    }
    const row = readRow();
    if (row.some((c) => c !== "")) rows.push(row);
  }

  if (rows.length === 0) return { headers: [], rows: [], errors: ["CSV appears empty."] };
  const headers = rows[0].map((h) => safe(h));
  if (headers.length === 0 || headers.every((h) => !h)) errors.push("Header row missing or blank.");

  const outRows: CsvRow[] = [];
  for (let r = 1; r < rows.length; r++) {
    const raw = rows[r];
    const obj: CsvRow = {};
    for (let c = 0; c < headers.length; c++) obj[headers[c] || `col_${c + 1}`] = safe(raw[c] ?? "");
    if (Object.values(obj).every((v) => !safe(v))) continue;
    outRows.push(obj);
  }

  return { headers, rows: outRows, errors };
}

async function trySelectColumn(table: string, col: string) {
  const { error } = await supabase.from(table).select(`id,${col}`).limit(1);
  return !error;
}
async function detectFirstExistingColumn(table: string, candidates: string[]) {
  for (const c of candidates) {
    // eslint-disable-next-line no-await-in-loop
    const ok = await trySelectColumn(table, c);
    if (ok) return c;
  }
  return null;
}

function toCsv(rows: Array<Record<string, any>>, headers: string[]) {
  const esc = (x: any) => {
    const s = String(x ?? "");
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines: string[] = [];
  lines.push(headers.map(esc).join(","));
  for (const r of rows) lines.push(headers.map((h) => esc(r[h])).join(","));
  return lines.join("\n");
}
function downloadTextFile(filename: string, contents: string, mime = "text/plain;charset=utf-8") {
  const blob = new Blob([contents], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

export default function OneRosterImportPage() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [usersFile, setUsersFile] = useState<string>("");
  const [classesFile, setClassesFile] = useState<string>("");
  const [enrollFile, setEnrollFile] = useState<string>("");

  const [users, setUsers] = useState<CsvRow[]>([]);
  const [classes, setClasses] = useState<CsvRow[]>([]);
  const [enroll, setEnroll] = useState<CsvRow[]>([]);

  const [usersErrors, setUsersErrors] = useState<string[]>([]);
  const [classesErrors, setClassesErrors] = useState<string[]>([]);
  const [enrollErrors, setEnrollErrors] = useState<string[]>([]);

  const [onlyStudents, setOnlyStudents] = useState(true);
  const [overwriteBySisId, setOverwriteBySisId] = useState(true);
  const [createMissingClasses, setCreateMissingClasses] = useState(true);

  // detect flexible columns
  const [colStudentSis, setColStudentSis] = useState<string | null>("sis_id");
  const [colStudentSurname, setColStudentSurname] = useState<string | null>("surname");
  const [colStudentExtra, setColStudentExtra] = useState<string | null>("extra");

  const [colClassSis, setColClassSis] = useState<string | null>("sis_id");
  const [colClassExtra, setColClassExtra] = useState<string | null>("extra");

  useMemo(() => {
    (async () => {
      setColStudentSis((await detectFirstExistingColumn("students", ["sis_id", "student_code", "external_id"])) ?? "sis_id");
      setColStudentSurname((await detectFirstExistingColumn("students", ["surname", "last_name", "family_name"])) ?? "surname");
      setColStudentExtra(await detectFirstExistingColumn("students", ["extra"]));

      setColClassSis((await detectFirstExistingColumn("classes", ["sis_id", "external_id", "class_code"])) ?? "sis_id");
      setColClassExtra(await detectFirstExistingColumn("classes", ["extra"]));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadCsv(file: File, kind: "users" | "classes" | "enrollments") {
    const text = await file.text();
    const parsed = parseCsvText(text);

    if (kind === "users") {
      setUsersFile(file.name);
      setUsers(parsed.rows);
      setUsersErrors(parsed.errors);
    } else if (kind === "classes") {
      setClassesFile(file.name);
      setClasses(parsed.rows);
      setClassesErrors(parsed.errors);
    } else {
      setEnrollFile(file.name);
      setEnroll(parsed.rows);
      setEnrollErrors(parsed.errors);
    }
  }

  function exportErrorReport(failed: Array<{ row: any; reason: string }>, headers: string[], filename: string) {
    const outHeaders = [...headers, "__reason"];
    const rows = failed.map((f) => ({ ...f.row, __reason: f.reason }));
    downloadTextFile(filename, toCsv(rows, outHeaders), "text/csv;charset=utf-8");
  }

  function guessHeader(row: CsvRow, candidates: string[]) {
    const keys = Object.keys(row).map((k) => k.toLowerCase());
    for (const c of candidates) {
      const idx = keys.indexOf(c.toLowerCase());
      if (idx >= 0) return Object.keys(row)[idx];
    }
    return null;
  }

  async function runImport() {
    setErr(null);
    setMsg(null);

    if (usersErrors.length || classesErrors.length || enrollErrors.length) {
      setErr("Fix CSV parsing errors first (one of the files failed to parse).");
      return;
    }
    if (users.length === 0 || classes.length === 0 || enroll.length === 0) {
      setErr("Upload users.csv, classes.csv, and enrollments.csv first.");
      return;
    }

    setBusy(true);
    try {
      const authResp = await supabase.auth.getUser();
      const user = authResp.data.user;
      if (!user) throw new Error("You must be signed in.");

      // Identify OneRoster columns (best-effort)
      const u0 = users[0];
      const c0 = classes[0];
      const e0 = enroll[0];

      const u_sourcedId = guessHeader(u0, ["sourcedId", "sourcedid"]);
      const u_role = guessHeader(u0, ["role"]);
      const u_given = guessHeader(u0, ["givenName", "givenname", "firstName", "firstname"]);
      const u_family = guessHeader(u0, ["familyName", "familyname", "lastName", "lastname"]);
      const u_identifier = guessHeader(u0, ["identifier", "studentNumber", "studentnumber"]);

      const c_sourcedId = guessHeader(c0, ["sourcedId", "sourcedid"]);
      const c_title = guessHeader(c0, ["title", "className", "classname", "name"]);
      const c_code = guessHeader(c0, ["classCode", "classcode", "code"]);

      const e_user = guessHeader(e0, ["userSourcedId", "usersourcedid"]);
      const e_class = guessHeader(e0, ["classSourcedId", "classsourcedid"]);
      const e_role = guessHeader(e0, ["role"]);

      if (!u_sourcedId || !u_given || !u_family || !u_role) {
        throw new Error("users.csv missing required columns (need sourcedId, givenName, familyName, role).");
      }
      if (!c_sourcedId || (!c_title && !c_code)) {
        throw new Error("classes.csv missing required columns (need sourcedId and title or classCode).");
      }
      if (!e_user || !e_class) {
        throw new Error("enrollments.csv missing required columns (need userSourcedId and classSourcedId).");
      }

      // 1) Create/Upsert classes
      const classMap = new Map<string, string>(); // OneRoster classSourcedId -> our classes.id

      // preload existing classes by sis_id if available
      const classSisToId = new Map<string, string>();
      if (colClassSis) {
        const { data: existingClasses } = await supabase.from("classes").select(`id,${colClassSis}`).limit(5000);
        for (const r of (existingClasses ?? []) as any[]) {
          const k = safe(r[colClassSis]);
          if (k) classSisToId.set(k, r.id);
        }
      }

      let classesCreated = 0;
      for (const r of classes) {
        const classSourced = safe(r[u_sourcedId as any] ?? r[c_sourcedId]);
        const classIdKey = safe(r[c_sourcedId]);
        const title = safe((c_title ? r[c_title] : "") || "");
        const code = safe((c_code ? r[c_code] : "") || "");
        const name = title || code || `Class ${classIdKey}`;

        const existingId = colClassSis ? classSisToId.get(classIdKey) : null;

        const payload: any = { name };
        if (colClassSis) payload[colClassSis] = classIdKey;

        if (colClassExtra) payload[colClassExtra] = { oneroster: { ...r } };

        if (!existingId) {
          if (!createMissingClasses) continue;
          const { data, error } = await supabase.from("classes").insert(payload).select("id").single();
          if (!error && data?.id) {
            classSisToId.set(classIdKey, data.id);
            classesCreated++;
          }
        } else {
          // update name/extra lightly
          await supabase.from("classes").update(payload).eq("id", existingId);
        }

        const ourId = colClassSis ? classSisToId.get(classIdKey) : null;
        if (ourId) classMap.set(classIdKey, ourId);
      }

      // 2) Create/Upsert students
      const studentSisToId = new Map<string, string>();
      if (colStudentSis) {
        const { data: existingStudents } = await supabase.from("students").select(`id,${colStudentSis}`).limit(50000);
        for (const r of (existingStudents ?? []) as any[]) {
          const k = safe(r[colStudentSis]);
          if (k) studentSisToId.set(k, r.id);
        }
      }

      let studentsProcessed = 0;
      const failedUsers: Array<{ row: any; reason: string }> = [];

      for (const u of users) {
        const role = safe(u[u_role]).toLowerCase();
        if (onlyStudents && role !== "student") continue;

        const sourcedId = safe(u[u_sourcedId]);
        const given = safe(u[u_given]);
        const family = safe(u[u_family]);
        const ident = u_identifier ? safe(u[u_identifier]) : "";

        if (!sourcedId || (!given && !family)) {
          failedUsers.push({ row: u, reason: "Missing sourcedId or name." });
          continue;
        }

        const sisKey = sourcedId; // primary
        const existingId = colStudentSis ? studentSisToId.get(sisKey) : null;

        const payload: any = {
          user_id: user.id,
          first_name: given || null,
          preferred_name: given || null,
          is_ilp: false,
        };
        if (colStudentSurname) payload[colStudentSurname] = family || null;
        if (colStudentSis) payload[colStudentSis] = sisKey;

        if (colStudentExtra) payload[colStudentExtra] = { oneroster: { ...u, identifier: ident } };

        if (existingId && overwriteBySisId) {
          const { error } = await supabase.from("students").update(payload).eq("id", existingId);
          if (error) failedUsers.push({ row: u, reason: `Update failed: ${error.message}` });
          studentsProcessed++;
        } else if (!existingId) {
          const { data, error } = await supabase.from("students").insert(payload).select("id").single();
          if (error) {
            failedUsers.push({ row: u, reason: `Insert failed: ${error.message}` });
          } else if (data?.id && colStudentSis) {
            studentSisToId.set(sisKey, data.id);
          }
          studentsProcessed++;
        }
      }

      // 3) Enrollments -> assign students.class_id (first match wins)
      let enrollmentsApplied = 0;
      const failedEnroll: Array<{ row: any; reason: string }> = [];

      for (const e of enroll) {
        const eRole = e_role ? safe(e[e_role]).toLowerCase() : "";
        if (onlyStudents && eRole && eRole !== "student") continue;

        const userSourced = safe(e[e_user]);
        const classSourced = safe(e[e_class]);

        const studentId = colStudentSis ? studentSisToId.get(userSourced) : null;
        const classId = classMap.get(classSourced);

        if (!studentId) {
          failedEnroll.push({ row: e, reason: "Student not found (userSourcedId not imported / no sis_id match)." });
          continue;
        }
        if (!classId) {
          failedEnroll.push({ row: e, reason: "Class not found (classSourcedId not imported / no sis_id match)." });
          continue;
        }

        // Assign the class_id (simple model)
        const { error } = await supabase.from("students").update({ class_id: classId }).eq("id", studentId);
        if (error) failedEnroll.push({ row: e, reason: `Update failed: ${error.message}` });
        else enrollmentsApplied++;
      }

      // Reporting
      if (failedUsers.length) {
        exportErrorReport(failedUsers, Object.keys(users[0]), "oneroster_users_failures.csv");
      }
      if (failedEnroll.length) {
        exportErrorReport(failedEnroll, Object.keys(enroll[0]), "oneroster_enrollments_failures.csv");
      }

      setMsg(
        `Import complete. Classes created: ${classesCreated}. Students processed: ${studentsProcessed}. Enrollments applied: ${enrollmentsApplied}. Failures exported if any.`
      );
      setTimeout(() => setMsg(null), 3500);
    } catch (e: any) {
      setErr(e?.message ?? "Import failed.");
    } finally {
      setBusy(false);
    }
  }

  const preview = useMemo(() => {
    const p = (rows: CsvRow[]) => rows.slice(0, 5);
    return {
      users: p(users),
      classes: p(classes),
      enroll: p(enroll),
    };
  }, [users, classes, enroll]);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f6f7fb" }}>
      <AdminLeftNav />
      <main style={{ flex: 1, padding: 22, maxWidth: 1200, margin: "0 auto" }}>
        <section style={{ border: "1px solid #e8eaf0", borderRadius: 22, background: "#fff", padding: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 900, color: "#6b7280", letterSpacing: 0.6 }}>SIS · ONEROSTER</div>
          <div style={{ fontSize: 36, fontWeight: 950, color: "#0f172a", marginTop: 6 }}>OneRoster import</div>
          <div style={{ marginTop: 10, color: "#334155", fontWeight: 800 }}>
            Upload <strong>users.csv</strong>, <strong>classes.csv</strong>, <strong>enrollments.csv</strong> → import students, classes, and assign class membership.
          </div>

          <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <label style={{ display: "inline-flex", gap: 10, alignItems: "center", fontWeight: 900 }}>
              <input type="checkbox" checked={onlyStudents} onChange={(e) => setOnlyStudents(e.target.checked)} disabled={busy} />
              Only import role=student
            </label>
            <label style={{ display: "inline-flex", gap: 10, alignItems: "center", fontWeight: 900 }}>
              <input type="checkbox" checked={overwriteBySisId} onChange={(e) => setOverwriteBySisId(e.target.checked)} disabled={busy} />
              Overwrite by SIS ID
            </label>
            <label style={{ display: "inline-flex", gap: 10, alignItems: "center", fontWeight: 900 }}>
              <input type="checkbox" checked={createMissingClasses} onChange={(e) => setCreateMissingClasses(e.target.checked)} disabled={busy} />
              Create missing classes
            </label>

            <button
              onClick={runImport}
              disabled={busy}
              style={{
                marginLeft: "auto",
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid #0f172a",
                background: "#0f172a",
                color: "#fff",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              {busy ? "Importing…" : "Run import"}
            </button>
          </div>

          {msg ? (
            <div style={{ marginTop: 12, border: "1px solid #bbf7d0", background: "#f0fdf4", color: "#14532d", padding: 10, borderRadius: 14, fontWeight: 900 }}>
              {msg}
            </div>
          ) : null}
          {err ? (
            <div style={{ marginTop: 12, border: "1px solid #fecaca", background: "#fff1f2", color: "#9f1239", padding: 10, borderRadius: 14, fontWeight: 900 }}>
              {err}
            </div>
          ) : null}
        </section>

        {/* Upload cards */}
        <section style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
          <UploadCard
            title="users.csv"
            fileName={usersFile}
            rows={users.length}
            errors={usersErrors}
            onPick={(f) => loadCsv(f, "users")}
            preview={preview.users}
          />
          <UploadCard
            title="classes.csv"
            fileName={classesFile}
            rows={classes.length}
            errors={classesErrors}
            onPick={(f) => loadCsv(f, "classes")}
            preview={preview.classes}
          />
          <UploadCard
            title="enrollments.csv"
            fileName={enrollFile}
            rows={enroll.length}
            errors={enrollErrors}
            onPick={(f) => loadCsv(f, "enrollments")}
            preview={preview.enroll}
          />
        </section>

        <section style={{ marginTop: 14, border: "1px solid #e8eaf0", borderRadius: 22, background: "#fff", padding: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 950, color: "#0f172a" }}>Storage</div>
          <div style={{ marginTop: 8, color: "#475569", fontWeight: 850 }}>
            Students store OneRoster <strong>users.sourcedId</strong> into <code>students.{safe(colStudentSis)}</code>.
            Classes store OneRoster <strong>classes.sourcedId</strong> into <code>classes.{safe(colClassSis)}</code>.
            If <code>extra</code> exists, raw OneRoster rows are stored in JSON.
          </div>
        </section>
      </main>
    </div>
  );
}

function UploadCard(props: {
  title: string;
  fileName: string;
  rows: number;
  errors: string[];
  onPick: (f: File) => void;
  preview: CsvRow[];
}) {
  return (
    <div style={{ border: "1px solid #e8eaf0", borderRadius: 18, background: "#fff", padding: 16 }}>
      <div style={{ fontSize: 16, fontWeight: 950, color: "#0f172a" }}>{props.title}</div>
      <div style={{ marginTop: 8, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) props.onPick(f);
          }}
        />
        <span style={{ fontSize: 12, fontWeight: 900, color: "#64748b" }}>{props.fileName || "No file yet"}</span>
        {props.rows ? <span style={{ fontSize: 12, fontWeight: 900, color: "#0f172a" }}>Rows: {props.rows}</span> : null}
      </div>

      {props.errors?.length ? (
        <div style={{ marginTop: 10, border: "1px solid #fecaca", background: "#fff1f2", color: "#9f1239", padding: 10, borderRadius: 14, fontWeight: 900 }}>
          {props.errors.map((x, idx) => (
            <div key={idx}>{x}</div>
          ))}
        </div>
      ) : null}

      <div style={{ marginTop: 10, border: "1px solid #e8eaf0", borderRadius: 14, overflow: "auto", maxHeight: 220 }}>
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
          <thead>
            <tr>
              {Object.keys(props.preview?.[0] || { preview: "" }).slice(0, 6).map((h) => (
                <th key={h} style={{ textAlign: "left", fontSize: 11, color: "#64748b", fontWeight: 950, padding: "8px 10px", borderBottom: "1px solid #e8eaf0", background: "#f8fafc" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {props.preview.map((r, idx) => (
              <tr key={idx}>
                {Object.keys(props.preview?.[0] || {}).slice(0, 6).map((k) => (
                  <td key={k} style={{ padding: "8px 10px", borderBottom: "1px solid #eef2f7", fontSize: 12, fontWeight: 800, color: "#0f172a" }}>
                    {safe(r[k]) || "—"}
                  </td>
                ))}
              </tr>
            ))}
            {props.preview.length === 0 ? (
              <tr>
                <td style={{ padding: 10, color: "#64748b", fontWeight: 900 }} colSpan={6}>
                  Upload to preview rows.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
