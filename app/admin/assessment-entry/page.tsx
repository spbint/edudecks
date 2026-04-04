"use client";

import { useEffect, useMemo, useState } from "react";
import { hasSupabaseEnv, supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

type InstrumentRow = {
  id: string;
  instrument_code: string;
  instrument_name: string;
  domain: string;
  score_type: string;
  is_active: boolean;
};

const SCORE_TYPES = ["raw", "stanine", "band", "rubric", "text", "mixed"] as const;

export default function AssessmentEntryPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const [rows, setRows] = useState<InstrumentRow[]>([]);

  // form
  const [instrumentCode, setInstrumentCode] = useState("");
  const [instrumentName, setInstrumentName] = useState("");
  const [domain, setDomain] = useState("Reading");
  const [scoreType, setScoreType] = useState<(typeof SCORE_TYPES)[number]>("raw");
  const [isActive, setIsActive] = useState(true);

  const domains = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => {
      const d = (r.domain ?? "").trim();
      if (d) set.add(d);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  // ─────────────────────────────
  // AUTH GUARD
  // ─────────────────────────────
  useEffect(() => {
    if (!hasSupabaseEnv) return;

    const guard = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) window.location.href = "/";
    };
    guard();
  }, []);

  // ─────────────────────────────
  // LOAD
  // ─────────────────────────────
  const load = async () => {
    if (!hasSupabaseEnv) {
      setRows([]);
      setLoading(false);
      setErr("Supabase environment variables are not configured for this deployment yet.");
      return;
    }

    setLoading(true);
    setErr("");
    setOk("");

    const { data, error } = await supabase
      .from("assessment_instruments")
      .select("id, instrument_code, instrument_name, domain, score_type, is_active")
      .order("domain", { ascending: true })
      .order("instrument_name", { ascending: true });

    if (error) {
      setErr(`Load failed: ${error.message}`);
      setRows([]);
    } else {
      setRows((data as InstrumentRow[]) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!hasSupabaseEnv) {
      setLoading(false);
      return;
    }

    load();
  }, []);

  // ─────────────────────────────
  // CREATE
  // ─────────────────────────────
  const create = async () => {
    if (!hasSupabaseEnv) {
      setErr("Supabase environment variables are not configured for this deployment yet.");
      return;
    }

    setErr("");
    setOk("");

    const code = instrumentCode.trim();
    const name = instrumentName.trim();
    const dom = domain.trim();

    if (!code) return setErr("Instrument code is required (e.g. SWST).");
    if (!name) return setErr("Instrument name is required (e.g. Single Word Spelling Test).");
    if (!dom) return setErr("Domain is required (e.g. Reading/Writing/Maths).");

    setSaving(true);
    try {
      const { error } = await supabase.from("assessment_instruments").insert([
        {
          instrument_code: code,
          instrument_name: name,
          domain: dom,
          score_type: scoreType,
          is_active: isActive,
        },
      ]);

      if (error) throw new Error(error.message);

      setInstrumentCode("");
      setInstrumentName("");
      setIsActive(true);
      setOk("Assessment instrument created ✅");
      await load();
    } catch (e: any) {
      setErr(`Create failed: ${e?.message ?? "Unknown error"}`);
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────
  // TOGGLE VISIBILITY
  // ─────────────────────────────
  const toggleActive = async (id: string, next: boolean) => {
    if (!hasSupabaseEnv) {
      setErr("Supabase environment variables are not configured for this deployment yet.");
      return;
    }

    setErr("");
    setOk("");

    const prev = rows;
    setRows((r) => r.map((x) => (x.id === id ? { ...x, is_active: next } : x)));

    const { error } = await supabase.from("assessment_instruments").update({ is_active: next }).eq("id", id);

    if (error) {
      setRows(prev);
      setErr(`Update failed: ${error.message}`);
      return;
    }
    setOk(next ? "Visibility ON ✅" : "Visibility OFF ✅");
  };

  // ─────────────────────────────
  // DELETE (SAFE)
  // ─────────────────────────────
  const del = async (id: string) => {
    if (!hasSupabaseEnv) {
      setErr("Supabase environment variables are not configured for this deployment yet.");
      return;
    }

    if (!confirm("Delete this assessment instrument? (Any results linked to it may fail.)")) return;
    setErr("");
    setOk("");

    const { error } = await supabase.from("assessment_instruments").delete().eq("id", id);
    if (error) return setErr(`Delete failed: ${error.message}`);

    setOk("Deleted ✅");
    await load();
  };

  if (loading) return <main style={{ padding: 24 }}>Loading assessment instruments…</main>;

  if (!hasSupabaseEnv) {
    return (
      <main style={{ padding: 24, maxWidth: 860 }}>
        <section
          style={{
            border: "1px solid #f2c1c1",
            background: "#fff8f8",
            borderRadius: 16,
            padding: 18,
          }}
        >
          <div style={{ fontSize: 12, opacity: 0.7 }}>ADMIN • SCHOOL SETUP</div>
          <div style={{ fontSize: 22, fontWeight: 900, marginTop: 4 }}>
            Supabase setup is still needed
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.7, opacity: 0.82, marginTop: 10 }}>
            This page depends on Supabase. Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to the deployment environment, then rebuild.
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 16 }}>
            <button
              onClick={() => router.push("/admin")}
              style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #ddd" }}
            >
              Back to Admin
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main style={{ padding: 24, maxWidth: 1100 }}>
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
          <div style={{ fontSize: 22, fontWeight: 900, marginTop: 4 }}>Assessment Library</div>
          <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
            Create assessments (instruments), choose domain + score type, and toggle visibility.
          </div>

          <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Pill label={`Total: ${rows.length}`} />
            <Pill label={`Visible: ${rows.filter((r) => r.is_active).length}`} />
            <Pill label={`Hidden: ${rows.filter((r) => !r.is_active).length}`} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            onClick={() => router.push("/admin")}
            style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #ddd" }}
          >
            ← Back to Admin
          </button>
        </div>
      </section>

      {!!err && (
        <div style={{ marginBottom: 14, padding: 10, border: "1px solid #f2c1c1", borderRadius: 10 }}>
          <strong style={{ color: "crimson" }}>Error:</strong> {err}
        </div>
      )}
      {!!ok && (
        <div style={{ marginBottom: 14, padding: 10, border: "1px solid #cfe9cf", borderRadius: 10 }}>
          <strong style={{ color: "green" }}>OK:</strong> {ok}
        </div>
      )}

      {/* Create */}
      <section style={{ border: "1px solid #e6e6e6", borderRadius: 16, padding: 16, marginBottom: 16 }}>
        <div style={{ fontWeight: 900, marginBottom: 8 }}>Create New Assessment Instrument</div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr", gap: 12 }}>
          <label style={{ fontSize: 12 }}>
            Code
            <input
              value={instrumentCode}
              onChange={(e) => setInstrumentCode(e.target.value)}
              placeholder="e.g. SWST"
              style={{ width: "100%", marginTop: 6, padding: 10, borderRadius: 12, border: "1px solid #ddd" }}
            />
          </label>

          <label style={{ fontSize: 12 }}>
            Name
            <input
              value={instrumentName}
              onChange={(e) => setInstrumentName(e.target.value)}
              placeholder="e.g. Single Word Spelling Test"
              style={{ width: "100%", marginTop: 6, padding: 10, borderRadius: 12, border: "1px solid #ddd" }}
            />
          </label>

          <label style={{ fontSize: 12 }}>
            Domain
            <input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              list="domain-list"
              placeholder="Reading / Writing / Maths ..."
              style={{ width: "100%", marginTop: 6, padding: 10, borderRadius: 12, border: "1px solid #ddd" }}
            />
            <datalist id="domain-list">
              {domains.map((d) => (
                <option value={d} key={d} />
              ))}
            </datalist>
          </label>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 12 }}>
          <label style={{ fontSize: 12 }}>
            Score type
            <select
              value={scoreType}
              onChange={(e) => setScoreType(e.target.value as any)}
              style={{ width: "100%", marginTop: 6, padding: 10, borderRadius: 12, border: "1px solid #ddd" }}
            >
              {SCORE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 10, marginTop: 18 }}>
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            Visible to teachers
          </label>

          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "end" }}>
            <button
              onClick={create}
              disabled={saving}
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                border: "1px solid #ddd",
                fontWeight: 900,
                background: "#111",
                color: "white",
                cursor: "pointer",
              }}
            >
              {saving ? "Saving…" : "Create assessment"}
            </button>
          </div>
        </div>

        <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
          Saves to <code>assessment_instruments</code>. Visibility uses <code>is_active</code>.
        </div>
      </section>

      {/* List */}
      <section style={{ border: "1px solid #e6e6e6", borderRadius: 16, padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 900, marginBottom: 6 }}>Existing Instruments</div>
            <div style={{ fontSize: 12, opacity: 0.75 }}>Toggle visibility or delete.</div>
          </div>
        </div>

        <div style={{ marginTop: 12, overflowX: "auto" }}>
          {rows.length === 0 ? (
            <div style={{ fontSize: 13, opacity: 0.75 }}>No assessment instruments yet.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
              <thead>
                <tr style={{ textAlign: "left", fontSize: 12, opacity: 0.7 }}>
                  <th style={{ padding: "8px 6px" }}>Visible</th>
                  <th style={{ padding: "8px 6px" }}>Code</th>
                  <th style={{ padding: "8px 6px" }}>Name</th>
                  <th style={{ padding: "8px 6px" }}>Domain</th>
                  <th style={{ padding: "8px 6px" }}>Score type</th>
                  <th style={{ padding: "8px 6px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} style={{ borderTop: "1px solid #f0f0f0" }}>
                    <td style={{ padding: "10px 6px" }}>
                      <input
                        type="checkbox"
                        checked={!!r.is_active}
                        onChange={(e) => toggleActive(r.id, e.target.checked)}
                        title="Toggle teacher visibility"
                      />
                    </td>
                    <td style={{ padding: "10px 6px", fontWeight: 900 }}>{r.instrument_code}</td>
                    <td style={{ padding: "10px 6px" }}>{r.instrument_name}</td>
                    <td style={{ padding: "10px 6px" }}>{r.domain}</td>
                    <td style={{ padding: "10px 6px" }}>
                      <Pill label={r.score_type} />
                    </td>
                    <td style={{ padding: "10px 6px" }}>
                      <button
                        onClick={() => del(r.id)}
                        style={{ padding: "6px 10px", borderRadius: 10, border: "1px solid #ddd", fontSize: 12 }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
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
        fontWeight: 700,
        display: "inline-block",
      }}
    >
      {label}
    </span>
  );
}
