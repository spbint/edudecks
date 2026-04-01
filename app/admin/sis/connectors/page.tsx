"use client";

import React, { useEffect, useState } from "react";
import AdminLeftNav from "@/app/components/AdminLeftNav";

type ConnectorKey = "oneroster" | "compass" | "sentral" | "edpass";

type ConnectorState = {
  enabled: boolean;
  mode: "manual" | "nightly";
  notes: string;
  last_run_iso: string | null;
};

const KEY = "edu:sisConnectors:v1";

const defaults: Record<ConnectorKey, ConnectorState> = {
  oneroster: { enabled: false, mode: "manual", notes: "", last_run_iso: null },
  compass: { enabled: false, mode: "manual", notes: "", last_run_iso: null },
  sentral: { enabled: false, mode: "manual", notes: "", last_run_iso: null },
  edpass: { enabled: false, mode: "manual", notes: "", last_run_iso: null },
};

function readState(): Record<ConnectorKey, ConnectorState> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    return { ...defaults, ...(parsed || {}) };
  } catch {
    return defaults;
  }
}

function writeState(s: Record<ConnectorKey, ConnectorState>) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s, null, 2));
  } catch {}
}

export default function SisConnectorsPage() {
  const [state, setState] = useState<Record<ConnectorKey, ConnectorState>>(defaults);

  useEffect(() => {
    setState(readState());
  }, []);

  function update(key: ConnectorKey, patch: Partial<ConnectorState>) {
    setState((cur) => {
      const next = { ...cur, [key]: { ...cur[key], ...patch } };
      writeState(next);
      return next;
    });
  }

  function markRunNow(key: ConnectorKey) {
    update(key, { last_run_iso: new Date().toISOString() });
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f6f7fb" }}>
      <AdminLeftNav />
      <main style={{ flex: 1, padding: 22, maxWidth: 1200, margin: "0 auto" }}>
        <section style={{ border: "1px solid #e8eaf0", borderRadius: 22, background: "#fff", padding: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 900, color: "#6b7280", letterSpacing: 0.6 }}>SIS</div>
          <div style={{ fontSize: 36, fontWeight: 950, color: "#0f172a", marginTop: 6 }}>Connectors</div>
          <div style={{ marginTop: 10, color: "#334155", fontWeight: 800 }}>
            This is UI scaffolding only (localStorage). Next step is wiring a server action / cron job.
          </div>
        </section>

        <section style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
          {(["oneroster", "compass", "sentral", "edpass"] as ConnectorKey[]).map((k) => {
            const c = state[k];
            const label = k === "oneroster" ? "OneRoster" : k === "edpass" ? "EdPass" : k[0].toUpperCase() + k.slice(1);

            return (
              <div key={k} style={{ border: "1px solid #e8eaf0", borderRadius: 18, background: "#fff", padding: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ fontSize: 16, fontWeight: 950, color: "#0f172a" }}>{label}</div>
                  <div style={{ marginLeft: "auto", display: "inline-flex", gap: 8, alignItems: "center" }}>
                    <label style={{ fontWeight: 900, fontSize: 13, color: "#0f172a" }}>
                      <input type="checkbox" checked={c.enabled} onChange={(e) => update(k, { enabled: e.target.checked })} /> Enabled
                    </label>
                  </div>
                </div>

                <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <div style={{ fontSize: 12, fontWeight: 900, color: "#64748b" }}>Mode</div>
                  <select
                    value={c.mode}
                    onChange={(e) => update(k, { mode: e.target.value as any })}
                    style={{ padding: "8px 10px", borderRadius: 12, border: "1px solid #e5e7eb", fontWeight: 900 }}
                    disabled={!c.enabled}
                  >
                    <option value="manual">Manual</option>
                    <option value="nightly">Nightly (planned)</option>
                  </select>

                  <button
                    onClick={() => markRunNow(k)}
                    style={{ padding: "8px 10px", borderRadius: 12, border: "1px solid #e5e7eb", background: "#fff", fontWeight: 900, cursor: "pointer" }}
                    disabled={!c.enabled}
                    title="Marks a run timestamp (placeholder)"
                  >
                    Run now (stub)
                  </button>

                  <div style={{ fontSize: 12, fontWeight: 900, color: "#64748b" }}>
                    Last run: <span style={{ color: "#0f172a" }}>{c.last_run_iso ?? "—"}</span>
                  </div>
                </div>

                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 900, color: "#64748b", marginBottom: 6 }}>Notes</div>
                  <textarea
                    value={c.notes}
                    onChange={(e) => update(k, { notes: e.target.value })}
                    rows={3}
                    style={{ width: "100%", borderRadius: 14, border: "1px solid #e5e7eb", padding: 10, fontWeight: 800 }}
                    placeholder="E.g., export path, API notes, school-specific quirks…"
                    disabled={!c.enabled}
                  />
                </div>
              </div>
            );
          })}
        </section>
      </main>
    </div>
  );
}