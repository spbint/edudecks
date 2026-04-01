"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type TargetRow = {
  key: string;
  label: string;
  target_value: number;
  direction: "higher_is_better" | "lower_is_better";
  updated_at: string;
};

export default function LeadershipBenchmarksPage() {
  const [rows, setRows] = useState<TargetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");
  const [savingKey, setSavingKey] = useState<string>("");

  // editable values (keep separate so we can cancel/revert easily)
  const [draft, setDraft] = useState<Record<string, string>>({});

  async function loadTargets() {
    setLoading(true);
    setErrMsg("");

    const { data, error } = await supabase
      .from("leadership_targets")
      .select("key,label,target_value,direction,updated_at")
      .order("label", { ascending: true });

    if (error) {
      setErrMsg(error.message || "Failed to load benchmarks.");
      setRows([]);
      setLoading(false);
      return;
    }

    const r = (data || []) as TargetRow[];
    setRows(r);

    const nextDraft: Record<string, string> = {};
    for (const t of r) nextDraft[t.key] = String(t.target_value);
    setDraft(nextDraft);

    setLoading(false);
  }

  useEffect(() => {
    loadTargets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dirtyKeys = useMemo(() => {
    const s = new Set<string>();
    for (const r of rows) {
      const d = draft[r.key];
      if (d == null) continue;
      if (String(r.target_value) !== String(d).trim()) s.add(r.key);
    }
    return s;
  }, [rows, draft]);

  const dirtyCount = dirtyKeys.size;

  function validateValue(row: TargetRow, raw: string) {
    const trimmed = raw.trim();
    if (!trimmed) return { ok: false, msg: `"${row.label}" target must be a valid number.` };
    const parsed = Number(trimmed);
    if (Number.isNaN(parsed)) return { ok: false, msg: `"${row.label}" target must be a valid number.` };
    // sensible guardrails (optional)
    if (parsed < 0) return { ok: false, msg: `"${row.label}" target cannot be negative.` };
    return { ok: true, parsed };
  }

  async function saveOne(key: string) {
    setErrMsg("");
    setSavingKey(key);

    const row = rows.find((r) => r.key === key);
    if (!row) {
      setSavingKey("");
      return;
    }

    const raw = (draft[key] ?? "");
    const v = validateValue(row, raw);

    if (!v.ok) {
      setErrMsg(v.msg);
      setSavingKey("");
      return;
    }

    const { data, error } = await supabase
      .from("leadership_targets")
      .update({ target_value: v.parsed, updated_at: new Date().toISOString() })
      .eq("key", key)
      .select("key,label,target_value,direction,updated_at")
      .single();

    if (error) {
      setErrMsg(error.message || "Failed to save benchmark.");
      setSavingKey("");
      return;
    }

    setRows((prev) => prev.map((r) => (r.key === key ? (data as TargetRow) : r)));
    setDraft((prev) => ({ ...prev, [key]: String((data as TargetRow).target_value) }));
    setSavingKey("");
  }

  async function saveAll() {
    setErrMsg("");

    if (dirtyKeys.size === 0) return;

    // Validate all dirty rows first
    for (const key of Array.from(dirtyKeys)) {
      const row = rows.find((r) => r.key === key);
      if (!row) continue;
      const v = validateValue(row, draft[key] ?? "");
      if (!v.ok) {
        setErrMsg(v.msg);
        return;
      }
    }

    setSavingKey("__all__");

    // Save sequentially (simple + reliable)
    for (const key of Array.from(dirtyKeys)) {
      // eslint-disable-next-line no-await-in-loop
      await saveOne(key);
    }

    setSavingKey("");
  }

  function resetOne(key: string) {
    const row = rows.find((r) => r.key === key);
    if (!row) return;
    setDraft((prev) => ({ ...prev, [key]: String(row.target_value) }));
  }

  function resetAll() {
    const nextDraft: Record<string, string> = {};
    for (const r of rows) nextDraft[r.key] = String(r.target_value);
    setDraft(nextDraft);
  }

  if (loading) return <div style={{ padding: 24 }}>Loading…</div>;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ fontSize: 12, color: "#777", fontWeight: 900 }}>
        LEADERSHIP · SETTINGS
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h1 style={{ margin: "6px 0 0 0" }}>Benchmark Editor</h1>

        <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ fontSize: 12, fontWeight: 900, color: dirtyCount ? "#7f1d1d" : "#666" }}>
            Unsaved: {dirtyCount}
          </span>

          <button
            onClick={loadTargets}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #eee",
              background: "#fff",
              fontWeight: 900,
              cursor: "pointer",
              color: "#111",
            }}
          >
            Refresh
          </button>

          <button
            disabled={dirtyCount === 0 || savingKey === "__all__"}
            onClick={saveAll}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #111",
              background: dirtyCount === 0 ? "#f3f4f6" : "#111",
              color: dirtyCount === 0 ? "#666" : "#fff",
              fontWeight: 900,
              cursor: dirtyCount === 0 ? "not-allowed" : "pointer",
            }}
          >
            {savingKey === "__all__" ? "Saving…" : "Save All"}
          </button>

          <button
            disabled={dirtyCount === 0 || savingKey === "__all__"}
            onClick={resetAll}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #eee",
              background: "#fff",
              fontWeight: 900,
              cursor: dirtyCount === 0 ? "not-allowed" : "pointer",
              color: "#111",
            }}
          >
            Reset All
          </button>

          <Link
            href="/leadership"
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #eee",
              background: "#fff",
              fontWeight: 900,
              textDecoration: "none",
              color: "#111",
            }}
          >
            Back to Leadership
          </Link>
        </div>
      </div>

      <div style={{ marginTop: 10, color: "#555", lineHeight: 1.5, maxWidth: 900 }}>
        These targets drive the <b>Above target / On track / Below target</b> chips on the leadership dashboard.
        <br />
        Only users marked <b>is_admin</b> or <b>is_leader</b> can edit (enforced by RLS).
      </div>

      {errMsg && (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 12,
            border: "1px solid #f5c2c7",
            background: "#fff5f5",
            color: "#7f1d1d",
            fontWeight: 800,
          }}
        >
          {errMsg}
        </div>
      )}

      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        {rows.map((r) => {
          const isDirty = dirtyKeys.has(r.key);
          const isSaving = savingKey === r.key || savingKey === "__all__";

          return (
            <div
              key={r.key}
              style={{
                border: "1px solid #eee",
                borderRadius: 14,
                padding: 14,
                background: "#fff",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: "#777", fontWeight: 900 }}>
                    {r.key}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 900, marginTop: 2 }}>
                    {r.label}
                  </div>

                  <div
                    style={{
                      marginTop: 8,
                      display: "flex",
                      gap: 10,
                      flexWrap: "wrap",
                      alignItems: "center",
                    }}
                  >
                    <label style={{ fontSize: 12, color: "#777", fontWeight: 900 }}>
                      TARGET VALUE
                    </label>

                    <input
                      value={draft[r.key] ?? ""}
                      onChange={(e) =>
                        setDraft((prev) => ({ ...prev, [r.key]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveOne(r.key);
                        if (e.key === "Escape") resetOne(r.key);
                      }}
                      inputMode="decimal"
                      style={{
                        width: 160,
                        padding: "10px 12px",
                        borderRadius: 10,
                        border: isDirty ? "2px solid #111" : "1px solid #ddd",
                        fontWeight: 900,
                        outline: "none",
                      }}
                    />

                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 900,
                        padding: "6px 10px",
                        borderRadius: 999,
                        border: "1px solid #e5e7eb",
                        background: "#f7f7f7",
                        color: "#444",
                      }}
                    >
                      {r.direction === "higher_is_better"
                        ? "Higher is better"
                        : "Lower is better"}
                    </span>

                    <span style={{ fontSize: 12, color: "#777", fontWeight: 800 }}>
                      Updated: {new Date(r.updated_at).toLocaleString()}
                    </span>

                    {isDirty && (
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 900,
                          padding: "6px 10px",
                          borderRadius: 999,
                          border: "1px solid #111",
                          background: "#111",
                          color: "#fff",
                        }}
                      >
                        Unsaved
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    disabled={!isDirty || isSaving}
                    onClick={() => saveOne(r.key)}
                    style={{
                      padding: "10px 14px",
                      borderRadius: 10,
                      border: "1px solid #111",
                      background: !isDirty ? "#f3f4f6" : "#111",
                      color: !isDirty ? "#666" : "#fff",
                      fontWeight: 900,
                      cursor: !isDirty ? "not-allowed" : "pointer",
                    }}
                  >
                    {savingKey === r.key ? "Saving…" : "Save"}
                  </button>

                  <button
                    disabled={!isDirty || isSaving}
                    onClick={() => resetOne(r.key)}
                    style={{
                      padding: "10px 14px",
                      borderRadius: 10,
                      border: "1px solid #eee",
                      background: "#fff",
                      fontWeight: 900,
                      cursor: !isDirty ? "not-allowed" : "pointer",
                      color: "#111",
                    }}
                  >
                    Reset
                  </button>
                </div>
              </div>

              <div style={{ marginTop: 10, fontSize: 12, color: "#666", fontWeight: 800 }}>
                Shortcut: <b>Enter</b> saves this row · <b>Esc</b> resets
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 14, fontSize: 12, color: "#777", fontWeight: 800 }}>
        Tip: If you get “permission denied / RLS”, mark your user in <code>profiles</code> as{" "}
        <code>is_admin</code> or <code>is_leader</code>.
      </div>
    </div>
  );
}
