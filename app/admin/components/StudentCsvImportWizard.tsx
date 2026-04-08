"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type ClassRow = { id: string; name: string | null };

type DetectedCols = {
  colSurname: string | null;
  colSisId: string | null;
  colStatus: string | null;
  colArchived: string | null;
};

type WizardProps = {
  open: boolean;
  onClose: () => void;
  classes: ClassRow[];
  detected: DetectedCols;
  onImported?: () => Promise<void> | void;
};

type MapKey =
  | "preferred_name"
  | "first_name"
  | "surname"
  | "class_name"
  | "class_id"
  | "is_ilp"
  | "sis_id"
  | "status"
  | "is_archived";

type Mapping = Partial<Record<MapKey, string>>;

type RowObj = Record<string, string>;

function safe(v: any) {
  return String(v ?? "").trim();
}

function escCsv(x: any) {
  const s = String(x ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
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

/**
 * CSV parser that handles:
 * - commas
 * - quotes with escaped quotes ""
 * - newlines inside quoted fields
 */
function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let i = 0;
  let inQuotes = false;

  const pushField = () => {
    row.push(field);
    field = "";
  };
  const pushRow = () => {
    // keep empty trailing lines out
    if (row.length === 1 && safe(row[0]) === "" && rows.length === 0) {
      row = [];
      return;
    }
    rows.push(row);
    row = [];
  };

  while (i < text.length) {
    const c = text[i];

    if (inQuotes) {
      if (c === '"') {
        const next = text[i + 1];
        if (next === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += c;
      i += 1;
      continue;
    }

    if (c === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (c === ",") {
      pushField();
      i += 1;
      continue;
    }
    if (c === "\r") {
      i += 1;
      continue;
    }
    if (c === "\n") {
      pushField();
      pushRow();
      i += 1;
      continue;
    }

    field += c;
    i += 1;
  }

  // flush last
  pushField();
  if (row.length) pushRow();

  if (!rows.length) return { headers: [], rows: [] };

  const headers = rows[0].map((h) => safe(h));
  const data = rows.slice(1);

  return { headers, rows: data };
}

function normalizeHeader(h: string) {
  return safe(h).toLowerCase().replace(/\s+/g, "_");
}

function guessMapping(headers: string[], detected: DetectedCols): Mapping {
  const norm = headers.map(normalizeHeader);

  const find = (cands: string[]) => {
    for (let i = 0; i < norm.length; i++) {
      if (cands.includes(norm[i])) return headers[i];
    }
    return undefined;
  };

  const m: Mapping = {};

  m.preferred_name = find(["preferred_name", "preferred", "pref", "given_name", "display_name", "name"]);
  m.first_name = find(["first_name", "firstname", "first", "given", "givenname"]);
  if (detected.colSurname) m.surname = find(["surname", "last_name", "lastname", "family_name", "family"]);
  m.class_name = find(["class_name", "class", "homegroup", "group", "classroom"]);
  m.class_id = find(["class_id"]);
  m.is_ilp = find(["is_ilp", "ilp", "iep"]);
  if (detected.colSisId) m.sis_id = find(["sis_id", "student_code", "student_id", "external_id"]);
  if (detected.colStatus) m.status = find(["status", "state"]);
  if (detected.colArchived) m.is_archived = find(["is_archived", "archived", "inactive"]);

  // tidy: if preferred missing but first exists, okay
  return m;
}

function buildClassIndex(classes: ClassRow[]) {
  const byName = new Map<string, string>();
  for (const c of classes) {
    const n = safe(c.name);
    if (!n) continue;
    byName.set(n.toLowerCase(), c.id);
  }
  return byName;
}

function coerceBool(x: string) {
  const v = safe(x).toLowerCase();
  return v === "true" || v === "1" || v === "yes" || v === "y" || v === "t";
}

type PreparedRow = {
  idx: number;
  payload: any | null;
  reason?: string;
};

const LS_KEY = "edu_student_import_resume_v1";

export default function StudentCsvImportWizard({ open, onClose, classes, detected, onImported }: WizardProps) {
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [rawText, setRawText] = useState<string>("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<RowObj[]>([]);
  const [mapping, setMapping] = useState<Mapping>({});

  const [prepared, setPrepared] = useState<PreparedRow[]>([]);
  const [successCount, setSuccessCount] = useState<number>(0);
  const [failCount, setFailCount] = useState<number>(0);

  const classIndex = useMemo(() => buildClassIndex(classes), [classes]);

  // Reset when opening
  useEffect(() => {
    if (!open) return;
    setStep(1);
    setBusy(false);
    setErr(null);
    setInfo(null);
    setRawText("");
    setHeaders([]);
    setRows([]);
    setMapping({});
    setPrepared([]);
    setSuccessCount(0);
    setFailCount(0);

    // if we have a resume session, show it
    const saved = localStorage.getItem(LS_KEY);
    if (saved) {
      try {
        const s = JSON.parse(saved);
        if (s?.rows?.length && s?.headers?.length) {
          setInfo("Resume available: previous import session found.");
        }
      } catch {
        // ignore
      }
    }
  }, [open]);

  function closeAll() {
    setErr(null);
    setInfo(null);
    onClose();
  }

  function readFile(file: File) {
    setErr(null);
    setInfo(null);

    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      setRawText(text);

      const parsed = parseCsv(text);
      if (!parsed.headers.length) {
        setErr("That CSV looks empty (no header row found).");
        return;
      }

      const objs: RowObj[] = parsed.rows.map((r) => {
        const o: RowObj = {};
        for (let i = 0; i < parsed.headers.length; i++) {
          o[parsed.headers[i]] = safe(r[i] ?? "");
        }
        return o;
      });

      setHeaders(parsed.headers);
      setRows(objs);
      const guess = guessMapping(parsed.headers, detected);
      setMapping(guess);
      setStep(2);

      // save resume snapshot
      try {
        localStorage.setItem(
          LS_KEY,
          JSON.stringify({
            headers: parsed.headers,
            rows: objs,
            mapping: guess,
            detected,
            saved_at: new Date().toISOString(),
          })
        );
      } catch {
        // ignore
      }
    };
    reader.onerror = () => setErr("Could not read that file.");
    reader.readAsText(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    const f = e.dataTransfer.files?.[0];
    if (f) readFile(f);
  }

  function useResume() {
    setErr(null);
    setInfo(null);
    const saved = localStorage.getItem(LS_KEY);
    if (!saved) {
      setErr("No resume session found.");
      return;
    }
    try {
      const s = JSON.parse(saved);
      if (!s?.headers?.length || !s?.rows?.length) {
        setErr("Resume session is invalid.");
        return;
      }
      setHeaders(s.headers);
      setRows(s.rows);
      setMapping(s.mapping || {});
      setStep(2);
      setInfo("Resumed import session.");
    } catch {
      setErr("Could not read resume session.");
    }
  }

  function clearResume() {
    localStorage.removeItem(LS_KEY);
    setInfo("Resume cleared.");
  }

  function setMap(key: MapKey, header: string) {
    setMapping((m) => ({ ...m, [key]: header || undefined }));
  }

  function requiredOk(row: RowObj) {
    const pref = safe(mapping.preferred_name ? row[mapping.preferred_name] : "");
    const first = safe(mapping.first_name ? row[mapping.first_name] : "");
    return !!(pref || first);
  }

  function resolveClassId(row: RowObj) {
    const direct = safe(mapping.class_id ? row[mapping.class_id] : "");
    if (direct) return direct;

    const cname = safe(mapping.class_name ? row[mapping.class_name] : "");
    if (!cname) return null;

    // exact match (case-insensitive)
    const id = classIndex.get(cname.toLowerCase());
    if (id) return id;

    // soft match (contains)
    const lc = cname.toLowerCase();
    for (const [name, cid] of classIndex.entries()) {
      if (name.includes(lc) || lc.includes(name)) return cid;
    }
    return null;
  }

  function makePayload(row: RowObj): { payload: any | null; reason?: string } {
    if (!requiredOk(row)) return { payload: null, reason: "Missing name (preferred_name or first_name)" };

    const preferred = safe(mapping.preferred_name ? row[mapping.preferred_name] : "");
    const first = safe(mapping.first_name ? row[mapping.first_name] : "");
    const surname = safe(mapping.surname ? row[mapping.surname] : "");
    const sis = safe(mapping.sis_id ? row[mapping.sis_id] : "");
    const status = safe(mapping.status ? row[mapping.status] : "");
    const isArch = safe(mapping.is_archived ? row[mapping.is_archived] : "");
    const ilp = safe(mapping.is_ilp ? row[mapping.is_ilp] : "");

    const classId = resolveClassId(row);

    const payload: any = {
      first_name: first || preferred || null,
      preferred_name: preferred || first || null,
      class_id: classId || null,
      is_ilp: ilp ? coerceBool(ilp) : false,
    };

    if (detected.colSurname) payload[detected.colSurname] = surname || null;
    if (detected.colSisId) payload[detected.colSisId] = sis || null;

    // Status / archived (optional)
    const inferredArchived = isArch ? coerceBool(isArch) : false;
    if (detected.colStatus) {
      if (status) payload[detected.colStatus] = status;
      else payload[detected.colStatus] = inferredArchived ? "archived" : "active";
    }
    if (detected.colArchived) {
      payload[detected.colArchived] = inferredArchived || (status.toLowerCase() === "archived");
    }

    return { payload };
  }

  function buildPreview() {
    setErr(null);
    setInfo(null);

    if (!headers.length || !rows.length) {
      setErr("Load a CSV first.");
      return;
    }

    // sanity: mapping must have at least one name field
    if (!mapping.preferred_name && !mapping.first_name) {
      setErr("Map at least one of: preferred_name or first_name.");
      return;
    }

    const prep: PreparedRow[] = rows.map((r, idx) => {
      const { payload, reason } = makePayload(r);
      return { idx: idx + 2, payload, reason }; // +2 because header row is 1
    });

    setPrepared(prep);
    const fails = prep.filter((p) => !p.payload).length;
    setFailCount(fails);
    setSuccessCount(0);
    setStep(3);
    setInfo(`Prepared ${prep.length} rows. ${fails} have issues.`);
  }

  async function runImport() {
    setErr(null);
    setInfo(null);
    if (!prepared.length) {
      setErr("No prepared rows. Click “Validate & preview” first.");
      return;
    }

    setBusy(true);
    let ok = 0;
    const failures: Array<{ row_number: number; reason: string }> = [];

    try {
      const authResp = await supabase.auth.getUser();
      const user = authResp.data.user;
      if (!user) throw new Error("You must be signed in.");

      // Only import valid payloads
      const valid = prepared.filter((p) => p.payload);

      // Chunk into batches (supabase insert can choke on huge arrays)
      const CHUNK = 500;
      for (let i = 0; i < valid.length; i += CHUNK) {
        const chunk = valid.slice(i, i + CHUNK);
        const payloads = chunk.map((c) => ({ ...c.payload, user_id: user.id }));

        // eslint-disable-next-line no-await-in-loop
        const { error } = await supabase.from("students").insert(payloads);
        if (error) {
          // mark each row in chunk as failed with same reason (supabase doesn't return per-row errors reliably)
          for (const c of chunk) failures.push({ row_number: c.idx, reason: error.message });
        } else {
          ok += payloads.length;
        }
      }

      // Add validation failures into failure report
      for (const p of prepared) {
        if (!p.payload) failures.push({ row_number: p.idx, reason: p.reason || "Invalid row" });
      }

      setSuccessCount(ok);
      setFailCount(failures.length);
      setStep(4);

      // Store resume: remaining failures only (so you can fix CSV and re-run)
      try {
        localStorage.setItem(
          LS_KEY,
          JSON.stringify({
            headers,
            rows,
            mapping,
            detected,
            saved_at: new Date().toISOString(),
            last_result: { ok, failures },
          })
        );
      } catch {
        // ignore
      }

      // allow error download
      if (failures.length) {
        const lines = ["row_number,reason", ...failures.map((f) => `${escCsv(f.row_number)},${escCsv(f.reason)}`)];
        downloadTextFile(`student_import_errors_${new Date().toISOString().slice(0, 10)}.csv`, lines.join("\n"), "text/csv;charset=utf-8");
      }

      setInfo(`Imported ${ok}. Failed ${failures.length}. (Error report downloaded if there were failures.)`);
      if (onImported) await onImported();
    } catch (e: any) {
      setErr(e?.message ?? "Import failed.");
    } finally {
      setBusy(false);
    }
  }

  function downloadTemplate() {
    const headers = ["preferred_name", "first_name", "surname", "class_name", "is_ilp"];
    const sample = [
      ["Ava", "Ava", "Smith", "3/4 Hudson", "false"],
      ["Jobe", "Jobe", "Jones", "3/4 Hudson", "true"],
    ];
    const lines = [headers.map(escCsv).join(","), ...sample.map((r) => r.map(escCsv).join(","))];
    downloadTextFile("Edu-Dashboard_Student_Template.csv", lines.join("\n"), "text/csv;charset=utf-8");
  }

  const previewRows = useMemo(() => prepared.slice(0, 20), [prepared]);
  const validCount = useMemo(() => prepared.filter((p) => !!p.payload).length, [prepared]);

  if (!open) return null;

  return (
    <>
      <div onMouseDown={closeAll} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", zIndex: 90 }} />
      <div style={{ position: "fixed", inset: 0, zIndex: 91, display: "grid", placeItems: "center", padding: 16 }}>
        <div style={{ width: "min(980px, 96vw)", background: "#fff", borderRadius: 22, border: "1px solid #e8eaf0", boxShadow: "0 18px 60px rgba(0,0,0,0.18)" }}>
          <div style={{ padding: 16, borderBottom: "1px solid #e8eaf0", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 16, fontWeight: 950, color: "#0f172a" }}>CSV import</div>

            <div style={{ marginLeft: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button style={S.btn} onClick={downloadTemplate} disabled={busy}>
                Download template
              </button>
              <button style={S.btn} onClick={useResume} disabled={busy}>
                Resume
              </button>
              <button style={S.btn} onClick={clearResume} disabled={busy}>
                Clear resume
              </button>
              <button style={S.btn} onClick={closeAll} disabled={busy}>
                Close
              </button>
            </div>
          </div>

          <div style={{ padding: 16 }}>
            {info ? <div style={S.bannerOk}>{info}</div> : null}
            {err ? <div style={{ ...S.bannerErr, marginTop: info ? 10 : 0 }}>{err}</div> : null}

            {/* Stepper */}
            <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span style={pill(step === 1)}>1 · Upload</span>
              <span style={pill(step === 2)}>2 · Map columns</span>
              <span style={pill(step === 3)}>3 · Preview</span>
              <span style={pill(step === 4)}>4 · Result</span>
            </div>

            {/* Step 1 */}
            {step === 1 ? (
              <div style={{ marginTop: 14 }}>
                <div
                  onDrop={onDrop}
                  onDragOver={(e) => e.preventDefault()}
                  style={{
                    border: "2px dashed #cbd5e1",
                    borderRadius: 18,
                    padding: 18,
                    background: "#f8fafc",
                  }}
                >
                  <div style={{ fontWeight: 950, color: "#0f172a" }}>Drag & drop your CSV here</div>
                  <div style={{ marginTop: 6, color: "#64748b", fontWeight: 850 }}>
                    Or choose a file. We’ll detect headers, then you map columns, validate, preview, and import.
                  </div>

                  <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".csv,text/csv"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) readFile(f);
                      }}
                    />
                    <button
                      style={S.btn}
                      onClick={() => fileRef.current?.click()}
                    >
                      Choose file…
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Step 2 */}
            {step === 2 ? (
              <div style={{ marginTop: 14 }}>
                <div style={{ color: "#334155", fontWeight: 900 }}>
                  We found <b>{headers.length}</b> columns and <b>{rows.length}</b> data rows. Map what you need:
                </div>

                <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <MapRow label="preferred_name (recommended)" value={mapping.preferred_name || ""} headers={headers} onChange={(v) => setMap("preferred_name", v)} />
                  <MapRow label="first_name" value={mapping.first_name || ""} headers={headers} onChange={(v) => setMap("first_name", v)} />

                  <MapRow label="surname" value={mapping.surname || ""} headers={headers} onChange={(v) => setMap("surname", v)} disabled={!detected.colSurname} hint={!detected.colSurname ? "No surname column detected in DB." : undefined} />

                  <MapRow label="class_name" value={mapping.class_name || ""} headers={headers} onChange={(v) => setMap("class_name", v)} />
                  <MapRow label="class_id" value={mapping.class_id || ""} headers={headers} onChange={(v) => setMap("class_id", v)} />

                  <MapRow label="is_ilp" value={mapping.is_ilp || ""} headers={headers} onChange={(v) => setMap("is_ilp", v)} />

                  <MapRow label="sis_id" value={mapping.sis_id || ""} headers={headers} onChange={(v) => setMap("sis_id", v)} disabled={!detected.colSisId} hint={!detected.colSisId ? "No sis_id column detected in DB." : undefined} />

                  <MapRow label="status" value={mapping.status || ""} headers={headers} onChange={(v) => setMap("status", v)} disabled={!detected.colStatus} hint={!detected.colStatus ? "No status column detected in DB." : undefined} />
                  <MapRow label="is_archived" value={mapping.is_archived || ""} headers={headers} onChange={(v) => setMap("is_archived", v)} disabled={!detected.colArchived} hint={!detected.colArchived ? "No is_archived column detected in DB." : undefined} />
                </div>

                <div style={{ marginTop: 14, display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
                  <button style={S.btn} onClick={() => setStep(1)} disabled={busy}>
                    Back
                  </button>
                  <button style={S.btnPrimary} onClick={buildPreview} disabled={busy}>
                    Validate & preview →
                  </button>
                </div>
              </div>
            ) : null}

            {/* Step 3 */}
            {step === 3 ? (
              <div style={{ marginTop: 14 }}>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <span style={S.pill}>Rows: {prepared.length}</span>
                  <span style={S.pillOk}>Valid: {validCount}</span>
                  <span style={failCount ? S.pillWarn : S.pill}>Invalid: {failCount}</span>
                  <span style={{ marginLeft: "auto", color: "#64748b", fontWeight: 900, fontSize: 12 }}>
                    Previewing first 20 rows
                  </span>
                </div>

                <div style={{ marginTop: 10, border: "1px solid #e8eaf0", borderRadius: 18, overflow: "hidden" }}>
                  <div style={{ overflow: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
                      <thead>
                        <tr>
                          <Th>#</Th>
                          <Th>Name</Th>
                          <Th>Class</Th>
                          <Th>ILP</Th>
                          <Th>Status</Th>
                          <Th>Result</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewRows.map((p) => {
                          const pl = p.payload;
                          const ok = !!pl;
                          const name = ok ? safe(pl.preferred_name || pl.first_name) + (detected.colSurname ? ` ${safe(pl[detected.colSurname] || "")}` : "") : "—";
                          const cls = ok ? safe(pl.class_id || "") : "";
                          const clsLabel = cls ? classes.find((c) => c.id === cls)?.name : "";
                          const ilp = ok ? (pl.is_ilp ? "true" : "false") : "—";
                          const status = ok
                            ? detected.colStatus
                              ? safe(pl[detected.colStatus])
                              : detected.colArchived
                              ? (pl[detected.colArchived] ? "archived" : "active")
                              : "—"
                            : "—";

                          return (
                            <tr key={p.idx} style={{ background: "#fff" }}>
                              <Td>{p.idx}</Td>
                              <Td style={{ fontWeight: 950 }}>{name || "—"}</Td>
                              <Td>{clsLabel || "—"}</Td>
                              <Td>{ilp}</Td>
                              <Td>{status}</Td>
                              <Td>
                                {ok ? (
                                  <span style={S.pillOk}>OK</span>
                                ) : (
                                  <span style={S.pillWarn}>{p.reason || "Invalid row"}</span>
                                )}
                              </Td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div style={{ marginTop: 14, display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
                  <button style={S.btn} onClick={() => setStep(2)} disabled={busy}>
                    Back
                  </button>
                  <button style={S.btnPrimary} onClick={runImport} disabled={busy || validCount === 0}>
                    {busy ? "Importing…" : "Import now"}
                  </button>
                </div>
              </div>
            ) : null}

            {/* Step 4 */}
            {step === 4 ? (
              <div style={{ marginTop: 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div style={S.cardMini}>
                    <div style={S.kpiLabel}>IMPORTED</div>
                    <div style={S.kpiValue}>{successCount}</div>
                  </div>
                  <div style={S.cardMini}>
                    <div style={S.kpiLabel}>FAILED</div>
                    <div style={S.kpiValue}>{failCount}</div>
                  </div>
                </div>

                <div style={{ marginTop: 12, color: "#64748b", fontWeight: 900 }}>
                  If there were failures, an <b>error report CSV</b> has been downloaded automatically with row numbers and reasons.
                  Fix your CSV and click <b>Resume</b> to re-run quickly.
                </div>

                <div style={{ marginTop: 14, display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
                  <button style={S.btn} onClick={() => setStep(1)} disabled={busy}>
                    Import another file
                  </button>
                  <button style={S.btnPrimary} onClick={closeAll} disabled={busy}>
                    Done
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}

/* ───────────────────────────── SMALL UI ───────────────────────────── */

function pill(active: boolean): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: 999,
    border: active ? "1px solid #0f172a" : "1px solid #e5e7eb",
    background: active ? "#0f172a" : "#fff",
    color: active ? "#fff" : "#0f172a",
    fontWeight: 950,
    fontSize: 12,
  };
}

function MapRow({
  label,
  value,
  headers,
  onChange,
  disabled,
  hint,
}: {
  label: string;
  value: string;
  headers: string[];
  onChange: (v: string) => void;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 950, color: "#64748b" }}>
        {label} {hint ? <span style={{ fontWeight: 850, color: "#94a3b8" }}>· {hint}</span> : null}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        style={{
          width: "100%",
          marginTop: 6,
          padding: "10px 12px",
          borderRadius: 14,
          border: "1px solid #e5e7eb",
          fontWeight: 900,
          color: disabled ? "#94a3b8" : "#0f172a",
          opacity: disabled ? 0.6 : 1,
          background: "#fff",
          outline: "none",
        }}
      >
        <option value="">— Not mapped —</option>
        {headers.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      style={{
        textAlign: "left",
        fontSize: 12,
        color: "#64748b",
        fontWeight: 950,
        padding: "12px 12px",
        borderBottom: "1px solid #e8eaf0",
        background: "#f8fafc",
        position: "sticky",
        top: 0,
        zIndex: 1,
      }}
    >
      {children}
    </th>
  );
}

function Td({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <td
      style={{
        padding: "12px 12px",
        borderBottom: "1px solid #eef2f7",
        fontSize: 13,
        fontWeight: 850,
        color: "#0f172a",
        verticalAlign: "middle",
        ...style,
      }}
    >
      {children}
    </td>
  );
}

const S: Record<string, React.CSSProperties> = {
  btn: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "#fff",
    fontWeight: 950,
    cursor: "pointer",
  },
  btnPrimary: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #0f172a",
    background: "#0f172a",
    color: "#fff",
    fontWeight: 950,
    cursor: "pointer",
  },
  bannerOk: {
    border: "1px solid #bbf7d0",
    background: "#f0fdf4",
    color: "#14532d",
    padding: 10,
    borderRadius: 14,
    fontWeight: 950,
  },
  bannerErr: {
    border: "1px solid #fecaca",
    background: "#fff1f2",
    color: "#9f1239",
    padding: 10,
    borderRadius: 14,
    fontWeight: 950,
  },
  pill: {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid #e5e7eb",
    background: "#fff",
    fontSize: 12,
    fontWeight: 950,
    color: "#0f172a",
  },
  pillOk: {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid #bbf7d0",
    background: "#f0fdf4",
    fontSize: 12,
    fontWeight: 950,
    color: "#14532d",
  },
  pillWarn: {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid #fecaca",
    background: "#fff1f2",
    fontSize: 12,
    fontWeight: 950,
    color: "#9f1239",
  },
  cardMini: {
    border: "1px solid #e8eaf0",
    borderRadius: 18,
    background: "#fff",
    padding: 14,
  },
  kpiLabel: { fontSize: 12, fontWeight: 950, color: "#64748b" },
  kpiValue: { fontSize: 28, fontWeight: 950, color: "#0f172a", marginTop: 4 },
};
