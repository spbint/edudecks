"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

type MasterTable = "assessment_instruments" | "assessments";

type NormalizedAssessment = {
  id: string;
  code?: string | null;
  name: string;
  domain?: string | null;
  score_type?: string | null;
  year_level?: number | null;
  visible?: boolean | null;
};

type Capabilities = {
  table: MasterTable | null;

  // columns
  hasId: boolean;
  hasName: boolean; // name or instrument_name
  hasCode: boolean; // instrument_code
  hasDomain: boolean;
  hasScoreType: boolean;
  hasYearLevel: boolean;

  // visibility column name (if exists)
  visibilityCol: "is_visible" | "visible" | "is_active" | null;

  // exact column names used by table
  colName: "name" | "instrument_name" | null;
  colCode: "instrument_code" | null;
};

const DOMAINS = ["Reading", "Writing", "Maths", "Spelling", "Other"];
const SCORE_TYPES = ["Numeric", "Rubric", "Scale", "Yes/No"];

export default function AssessmentsAdminPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const [caps, setCaps] = useState<Capabilities>({
    table: null,
    hasId: false,
    hasName: false,
    hasCode: false,
    hasDomain: false,
    hasScoreType: false,
    hasYearLevel: false,
    visibilityCol: null,
    colName: null,
    colCode: null,
  });

  const [rows, setRows] = useState<NormalizedAssessment[]>([]);

  // form state
  const [name, setName] = useState("");
  const [code, setCode] = useState(""); // only used if instrument_code exists
  const [domain, setDomain] = useState(DOMAINS[0]);
  const [scoreType, setScoreType] = useState(SCORE_TYPES[0]);
  const [yearLevel, setYearLevel] = useState<string>("");
  const [visible, setVisible] = useState(true);

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
  // PROBE: find table + columns
  // ─────────────────────────────
  const trySelect = async (table: MasterTable, select: string) => {
    const { data, error } = await supabase.from(table).select(select).limit(1);
    return { data, error };
  };

  const probeTable = async (): Promise<Capabilities> => {
    // We try assessment_instruments first (common in your earlier work),
    // then fallback to assessments.
    // For each table, we "probe" columns by attempting selects.

    const candidateTables: MasterTable[] = ["assessment_instruments", "assessments"];

    for (const table of candidateTables) {
      // Step 1: can we select id?
      const base = await trySelect(table, "id");
      if (base.error) continue;

      // Step 2: find name column
      const nameAsName = await trySelect(table, "id, name");
      const nameAsInstrumentName = await trySelect(table, "id, instrument_name");

      const colName: Capabilities["colName"] =
        !nameAsName.error ? "name" : !nameAsInstrumentName.error ? "instrument_name" : null;

      if (!colName) continue; // if we can't find a label column, skip

      // Step 3: detect optional columns
      const hasCode = !(await trySelect(table, "id, instrument_code")).error;
      const hasDomain = !(await trySelect(table, "id, domain")).error;
      const hasScoreType = !(await trySelect(table, "id, score_type")).error;
      const hasYearLevel = !(await trySelect(table, "id, year_level")).error;

      // Step 4: detect visibility column (common variants)
      const hasIsVisible = !(await trySelect(table, "id, is_visible")).error;
      const hasVisible = !(await trySelect(table, "id, visible")).error;
      const hasIsActive = !(await trySelect(table, "id, is_active")).error;

      const visibilityCol: Capabilities["visibilityCol"] = hasIsVisible
        ? "is_visible"
        : hasVisible
        ? "visible"
        : hasIsActive
        ? "is_active"
        : null;

      const colCode: Capabilities["colCode"] = hasCode ? "instrument_code" : null;

      return {
        table,
        hasId: true,
        hasName: true,
        hasCode,
        hasDomain,
        hasScoreType,
        hasYearLevel,
        visibilityCol,
        colName,
        colCode,
      };
    }

    // Nothing matched
    return {
      table: null,
      hasId: false,
      hasName: false,
      hasCode: false,
      hasDomain: false,
      hasScoreType: false,
      hasYearLevel: false,
      visibilityCol: null,
      colName: null,
      colCode: null,
    };
  };

  const buildSelect = (c: Capabilities) => {
    if (!c.table || !c.colName) return "";
    const cols: string[] = ["id", c.colName];
    if (c.colCode) cols.push(c.colCode);
    if (c.hasDomain) cols.push("domain");
    if (c.hasScoreType) cols.push("score_type");
    if (c.hasYearLevel) cols.push("year_level");
    if (c.visibilityCol) cols.push(c.visibilityCol);
    return cols.join(", ");
  };

  const normalizeRows = (c: Capabilities, data: any[]): NormalizedAssessment[] => {
    if (!c.table || !c.colName) return [];

    return (data ?? []).map((r: any) => {
      const id = String(r.id);
      const nm = String(r[c.colName] ?? "").trim() || "(unnamed)";
      const cd = c.colCode ? (r[c.colCode] ?? null) : null;

      const dom = c.hasDomain ? (r.domain ?? null) : null;
      const st = c.hasScoreType ? (r.score_type ?? null) : null;
      const yl = c.hasYearLevel ? (r.year_level ?? null) : null;

      const vis =
        c.visibilityCol != null ? (r[c.visibilityCol] ?? null) : null;

      return {
        id,
        name: nm,
        code: cd,
        domain: dom,
        score_type: st,
        year_level: yl,
        visible: vis,
      };
    });
  };

  // ─────────────────────────────
  // LOAD
  // ─────────────────────────────
  const loadAll = async () => {
    setLoading(true);
    setErr("");
    setOk("");

    const c = await probeTable();
    setCaps(c);

    if (!c.table || !c.colName) {
      setRows([]);
      setErr(
        `Could not find a usable master assessments table. I tried "assessment_instruments" and "assessments" but couldn't detect a usable name column (name or instrument_name).`
      );
      setLoading(false);
      return;
    }

    const select = buildSelect(c);

    const q = supabase.from(c.table).select(select);

    // ordering: year_level if exists, then name
    if (c.hasYearLevel) q.order("year_level", { ascending: true });
    q.order(c.colName, { ascending: true });

    const { data, error } = await q;

    if (error) {
      setErr(`Load failed: ${error.message}`);
      setRows([]);
      setLoading(false);
      return;
    }

    setRows(normalizeRows(c, data as any[]));
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─────────────────────────────
  // CREATE
  // ─────────────────────────────
  const createAssessment = async () => {
    setErr("");
    setOk("");

    if (!caps.table || !caps.colName) {
      setErr("No master table detected — refresh the page.");
      return;
    }

    if (!name.trim()) {
      setErr("Assessment name is required.");
      return;
    }

    const payload: any = {};
    payload[caps.colName] = name.trim();

    if (caps.colCode) payload[caps.colCode] = code.trim() || null;
    if (caps.hasDomain) payload.domain = domain;
    if (caps.hasScoreType) payload.score_type = scoreType;
    if (caps.hasYearLevel) payload.year_level = yearLevel ? Number(yearLevel) : null;
    if (caps.visibilityCol) payload[caps.visibilityCol] = visible;

    setSaving(true);

    const { error } = await supabase.from(caps.table).insert([payload]);

    if (error) {
      setErr(error.message);
      setSaving(false);
      return;
    }

    setName("");
    setCode("");
    setYearLevel("");
    setVisible(true);

    setOk("Assessment created ✅");
    await loadAll();
    setSaving(false);
  };

  // ─────────────────────────────
  // TOGGLE VISIBILITY (only if exists)
  // ─────────────────────────────
  const toggleVisibility = async (row: NormalizedAssessment) => {
    setErr("");
    setOk("");

    if (!caps.table || !caps.visibilityCol) {
      setErr("Visibility toggle not available (no visibility column on this table).");
      return;
    }

    const next = !(row.visible ?? false);

    const { error } = await supabase
      .from(caps.table)
      .update({ [caps.visibilityCol]: next })
      .eq("id", row.id);

    if (error) {
      setErr(error.message);
      return;
    }

    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, visible: next } : r)));
    setOk("Visibility updated ✅");
  };

  const schemaSummary = useMemo(() => {
    if (!caps.table) return "No table detected.";
    return `Using table: ${caps.table} • name: ${caps.colName}${
      caps.colCode ? " • code: instrument_code" : ""
    }${caps.hasDomain ? " • domain" : ""}${caps.hasScoreType ? " • score_type" : ""}${
      caps.hasYearLevel ? " • year_level" : ""
    }${caps.visibilityCol ? ` • visibility: ${caps.visibilityCol}` : ""}`;
  }, [caps]);

  if (loading) return <main style={{ padding: 24 }}>Loading assessments…</main>;

  return (
    <main style={{ padding: 24, maxWidth: 1050 }}>
      {/* Header */}
      <section style={panel}>
        <div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>ADMIN • ASSESSMENT SETUP</div>
          <div style={{ fontSize: 22, fontWeight: 900, marginTop: 4 }}>
            Assessments (Infrastructure)
          </div>
          <div style={{ fontSize: 12, opacity: 0.75 }}>
            {schemaSummary}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button onClick={() => router.push("/admin")} style={btn}>← Back to Admin</button>
          <button onClick={() => loadAll()} style={btn}>Refresh</button>
        </div>
      </section>

      {!!err && (
        <div style={errBox}>
          <strong style={{ color: "crimson" }}>Error:</strong> {err}
        </div>
      )}
      {!!ok && (
        <div style={okBox}>
          <strong style={{ color: "green" }}>OK:</strong> {ok}
        </div>
      )}

      {/* Create form */}
      <section style={panel}>
        <div style={{ width: "100%" }}>
          <div style={{ fontWeight: 900, marginBottom: 8 }}>Create new assessment</div>

          <div style={{ display: "grid", gridTemplateColumns: caps.colCode ? "2fr 1fr 1fr 1fr 1fr" : "2fr 1fr 1fr 1fr", gap: 12 }}>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={caps.colName === "instrument_name" ? "Instrument name (e.g. SWST)" : "Assessment name (e.g. SWST)"}
              style={input}
            />

            {caps.colCode ? (
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Code (optional)"
                style={input}
              />
            ) : null}

            {caps.hasDomain ? (
              <select value={domain} onChange={(e) => setDomain(e.target.value)} style={input}>
                {DOMAINS.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            ) : (
              <div style={mutedBox}>No domain column</div>
            )}

            {caps.hasScoreType ? (
              <select value={scoreType} onChange={(e) => setScoreType(e.target.value)} style={input}>
                {SCORE_TYPES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            ) : (
              <div style={mutedBox}>No score_type column</div>
            )}

            {caps.hasYearLevel ? (
              <input
                value={yearLevel}
                onChange={(e) => setYearLevel(e.target.value)}
                placeholder="Year (optional)"
                style={input}
              />
            ) : (
              <div style={mutedBox}>No year_level column</div>
            )}
          </div>

          {caps.visibilityCol ? (
            <label style={{ marginTop: 10, display: "flex", gap: 8, fontSize: 12 }}>
              <input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} />
              Visible to teachers ({caps.visibilityCol})
            </label>
          ) : (
            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
              Visibility toggle is unavailable (no visibility column on this table).
            </div>
          )}

          <button onClick={createAssessment} disabled={saving} style={{ ...btn, marginTop: 12 }}>
            {saving ? "Saving…" : "Create assessment"}
          </button>
        </div>
      </section>

      {/* List */}
      <section style={panel}>
        <div style={{ width: "100%" }}>
          <div style={{ fontWeight: 900, marginBottom: 8 }}>
            Existing assessments ({rows.length})
          </div>

          {rows.length === 0 ? (
            <div style={{ fontSize: 13, opacity: 0.75 }}>No assessments found.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
                <thead>
                  <tr style={{ textAlign: "left", fontSize: 12, opacity: 0.7 }}>
                    <th style={th}>Name</th>
                    {caps.colCode ? <th style={th}>Code</th> : null}
                    {caps.hasDomain ? <th style={th}>Domain</th> : null}
                    {caps.hasScoreType ? <th style={th}>Score type</th> : null}
                    {caps.hasYearLevel ? <th style={th}>Year</th> : null}
                    {caps.visibilityCol ? <th style={th}>Visible</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((a) => (
                    <tr key={a.id} style={{ borderTop: "1px solid #f0f0f0" }}>
                      <td style={tdStrong}>{a.name}</td>
                      {caps.colCode ? <td style={td}>{a.code ?? "—"}</td> : null}
                      {caps.hasDomain ? <td style={td}>{a.domain ?? "—"}</td> : null}
                      {caps.hasScoreType ? <td style={td}>{a.score_type ?? "—"}</td> : null}
                      {caps.hasYearLevel ? <td style={td}>{a.year_level ?? "—"}</td> : null}
                      {caps.visibilityCol ? (
                        <td style={td}>
                          <button onClick={() => toggleVisibility(a)} style={tinyBtn}>
                            {a.visible ? "Visible" : "Hidden"}
                          </button>
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

/* ───────── UI helpers ───────── */

const panel: React.CSSProperties = {
  border: "1px solid #e6e6e6",
  borderRadius: 16,
  padding: 16,
  marginBottom: 16,
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
};

const btn: React.CSSProperties = {
  padding: "8px 14px",
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

const input: React.CSSProperties = {
  padding: 10,
  borderRadius: 12,
  border: "1px solid #ddd",
  width: "100%",
};

const errBox: React.CSSProperties = {
  marginBottom: 12,
  padding: 10,
  border: "1px solid #f2c1c1",
  borderRadius: 10,
};

const okBox: React.CSSProperties = {
  marginBottom: 12,
  padding: 10,
  border: "1px solid #cfe9cf",
  borderRadius: 10,
};

const mutedBox: React.CSSProperties = {
  padding: 10,
  borderRadius: 12,
  border: "1px dashed #ddd",
  fontSize: 12,
  opacity: 0.7,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const th: React.CSSProperties = { padding: "8px 6px" };
const td: React.CSSProperties = { padding: "10px 6px" };
const tdStrong: React.CSSProperties = { padding: "10px 6px", fontWeight: 900 };
