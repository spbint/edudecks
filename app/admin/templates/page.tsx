"use client";

import React, { useEffect, useMemo, useState } from "react";
import AdminLeftNav from "@/app/components/AdminLeftNav";
import { supabase } from "@/lib/supabaseClient";

type TemplateRow = {
  id: string;
  label?: string | null;
  name?: string | null;
  short?: string | null;
  domain?: string | null;
  description?: string | null;
  created_at?: string | null;
  [key: string]: any;
};

function safe(s: string | null | undefined) {
  return (s ?? "").trim();
}

function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const S = {
  shell: { display: "flex", minHeight: "100vh", background: "#f6f7fb" } as React.CSSProperties,
  main: { flex: 1, padding: 22, maxWidth: 1320, margin: "0 auto" } as React.CSSProperties,

  hero: {
    border: "1px solid #e8eaf0",
    borderRadius: 22,
    background: "linear-gradient(135deg, rgba(17,24,39,0.06), rgba(99,102,241,0.08))",
    padding: 18,
  } as React.CSSProperties,

  card: { border: "1px solid #e8eaf0", borderRadius: 18, background: "#fff" } as React.CSSProperties,
  subtle: { color: "#6b7280", fontSize: 12, fontWeight: 900, letterSpacing: 0.6 } as React.CSSProperties,
  h1: { fontSize: 36, fontWeight: 950, lineHeight: 1.05, marginTop: 8, color: "#0f172a" } as React.CSSProperties,

  row: { display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" } as React.CSSProperties,

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

  btn: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    fontWeight: 900,
    cursor: "pointer",
    background: "#fff",
    color: "#0f172a",
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

  warn: {
    marginTop: 10,
    borderRadius: 14,
    border: "1px solid #fde68a",
    background: "#fffbeb",
    padding: 12,
    color: "#7c2d12",
    fontWeight: 900,
  } as React.CSSProperties,
};

async function tryLoadTemplates() {
  // Try preferred table first
  const t1 = await supabase.from("assessment_templates").select("*").order("created_at", { ascending: false }).limit(2000);
  if (!t1.error) return { table: "assessment_templates", rows: (t1.data ?? []) as TemplateRow[] };

  // Then fall back to templates
  const t2 = await supabase.from("templates").select("*").order("created_at", { ascending: false }).limit(2000);
  if (!t2.error) return { table: "templates", rows: (t2.data ?? []) as TemplateRow[] };

  // Neither table exists (or permissions)
  throw new Error(
    `Could not load templates. Tried tables: assessment_templates and templates. ` +
      `Errors: [assessment_templates: ${t1.error?.message ?? "unknown"}] [templates: ${t2.error?.message ?? "unknown"}]`
  );
}

export default function TemplatesPage() {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [tableName, setTableName] = useState<string>("—");
  const [rows, setRows] = useState<TemplateRow[]>([]);
  const [q, setQ] = useState("");

  async function loadAll() {
    setBusy(true);
    setErr(null);
    try {
      const res = await tryLoadTemplates();
      setTableName(res.table);
      setRows(res.rows);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load templates.");
      setRows([]);
      setTableName("—");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    if (!ql) return rows;

    return rows.filter((r) => {
      const label = safe(r.label) || safe(r.name);
      const hay = [label, safe(r.short), safe(r.domain), safe(r.description)].join(" ").toLowerCase();
      return hay.includes(ql);
    });
  }, [rows, q]);

  return (
    <div style={S.shell}>
      <AdminLeftNav />
      <main style={S.main}>
        <section style={S.hero}>
          <div style={S.subtle}>ADMIN • TEMPLATES</div>
          <div style={S.h1}>Templates</div>

          <div style={{ ...S.row, marginTop: 10 }}>
            <span style={S.chip}>Table: {tableName}</span>
            <span style={S.chip}>Showing: {filtered.length}</span>
            <span style={S.chip}>Loaded: {rows.length}</span>

            <div style={{ marginLeft: "auto", display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button style={S.btn} onClick={loadAll} disabled={busy}>
                Refresh
              </button>
            </div>
          </div>

          {err ? <div style={S.alert}>{err}</div> : null}
          {!err && rows.length === 0 ? <div style={S.warn}>No templates found. If this is unexpected, check RLS/policies or table name.</div> : null}
        </section>

        <section style={{ marginTop: 14, ...S.card, padding: 14 }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "end" }}>
            <div style={{ flex: 1, minWidth: 280 }}>
              <div style={S.subtle}>SEARCH</div>
              <input style={S.input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search label, domain, description…" disabled={busy} />
            </div>
          </div>

          <div style={{ marginTop: 12, borderTop: "1px solid #eef2f7" }}>
            {filtered.slice(0, 250).map((r) => {
              const label = safe(r.label) || safe(r.name) || "Template";
              return (
                <div
                  key={r.id}
                  style={{
                    padding: 12,
                    borderBottom: "1px solid #eef2f7",
                    display: "grid",
                    gridTemplateColumns: "1.2fr 0.8fr 0.6fr",
                    gap: 12,
                    alignItems: "start",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 950, color: "#0f172a" }}>{label}</div>
                    <div style={{ marginTop: 6, fontWeight: 850, color: "#334155", whiteSpace: "pre-wrap", lineHeight: 1.35 }}>
                      {safe(r.description) || <span style={{ color: "#94a3b8" }}>No description.</span>}
                    </div>
                  </div>

                  <div>
                    <div style={S.subtle}>META</div>
                    <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {safe(r.domain) ? <span style={S.chip}>{safe(r.domain)}</span> : null}
                      {safe(r.short) ? <span style={S.chip}>{safe(r.short)}</span> : null}
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={S.subtle}>CREATED</div>
                    <div style={{ marginTop: 8, fontWeight: 900, color: "#334155" }}>{formatDateTime(r.created_at)}</div>
                  </div>
                </div>
              );
            })}

            {filtered.length === 0 ? <div style={{ padding: 12, color: "#64748b", fontWeight: 900 }}>No templates match your search.</div> : null}

            {filtered.length > 250 ? (
              <div style={{ padding: 12, color: "#64748b", fontWeight: 900 }}>
                Showing first <strong>250</strong> results (refine search to narrow).
              </div>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}