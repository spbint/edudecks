"use client";

import React, { useMemo, useState } from "react";
import type { StartingPointVisualTruthAuditEntry } from "@/lib/clean/assessments/interactivePlayer/startingPointVisualTruthAudit";
import StartingPointPlayer from "./StartingPointPlayer";

type Props = {
  entries: StartingPointVisualTruthAuditEntry[];
};

type Shortcut =
  | "all"
  | "canonical"
  | "presentation"
  | "base-ten"
  | "counters"
  | "additive"
  | "multiplicative"
  | "currency"
  | "remove"
  | "share"
  | "closed-groups";

const shell: React.CSSProperties = {
  minHeight: "100vh",
  padding: "clamp(16px, 4vw, 42px)",
  background: "#F7F8FC",
  color: "#17204B",
};

const panel: React.CSSProperties = {
  border: "1px solid #E1E6F0",
  borderRadius: 18,
  background: "#FFFFFF",
  padding: 16,
};

function matchesShortcut(entry: StartingPointVisualTruthAuditEntry, shortcut: Shortcut) {
  const signature = entry.truthSignature;
  if (shortcut === "all") return true;
  if (shortcut === "canonical") return entry.classification === "canonical-visual";
  if (shortcut === "presentation") return entry.classification === "presentation-visual";
  if (shortcut === "base-ten") return signature.kind === "place-value";
  if (shortcut === "counters") return ["counter-set", "counter-groups", "closed-groups"].includes(signature.kind);
  if (shortcut === "additive") return entry.coverage.continuum === "additive-strategies";
  if (shortcut === "multiplicative") return entry.coverage.continuum === "multiplicative-strategies";
  if (shortcut === "currency") return signature.kind === "currency" || signature.kind === "currency-repeat";
  if (shortcut === "remove") return signature.kind === "counter-groups" && signature.action === "remove";
  if (shortcut === "share") return signature.kind === "counter-groups" && signature.action === "share";
  return signature.kind === "closed-groups";
}

export default function StartingPointVisualTruthReview({ entries }: Props) {
  const [shortcut, setShortcut] = useState<Shortcut>("all");
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return entries.filter((entry) =>
      matchesShortcut(entry, shortcut) &&
      (!normalizedQuery || [
        entry.item.id,
        entry.coverage.continuum,
        entry.coverage.progressionTarget,
        entry.truthSignature.kind,
        entry.learnerPrompt,
      ].join(" ").toLowerCase().includes(normalizedQuery)),
    );
  }, [entries, query, shortcut]);
  const [selectedId, setSelectedId] = useState(entries[0]?.item.id ?? "");
  const selected = filtered.find((entry) => entry.item.id === selectedId) ?? filtered[0] ?? null;

  return (
    <main style={shell}>
      <div style={{ maxWidth: 1160, margin: "0 auto", display: "grid", gap: 18 }}>
        <header style={{ ...panel, display: "grid", gap: 10 }}>
          <span style={{ color: "#92400E", fontSize: 12, fontWeight: 900, textTransform: "uppercase" }}>
            Staff-only evidence-integrity QA
          </span>
          <h1 style={{ margin: 0 }}>Starting Point Visual Truth Audit</h1>
          <p style={{ margin: 0, color: "#4B5563", lineHeight: 1.6 }}>
            Every canonical and presentation visual is derived from the active item estate. Select a card to inspect the actual learner player beside the staff-only expected mathematical truth.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }} aria-label="Visual truth shortcuts">
            {([
              ["all", "All visuals"], ["canonical", "Canonical visuals"], ["presentation", "Presentation visuals"],
              ["base-ten", "Base-ten"], ["counters", "Counters"], ["additive", "Additive"],
              ["multiplicative", "Multiplicative"], ["currency", "All currency"], ["remove", "Remove"],
              ["share", "Share"], ["closed-groups", "Closed groups"],
            ] as Array<[Shortcut, string]>).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={shortcut === value}
                onClick={() => setShortcut(value)}
                style={{ minHeight: 42, border: "1px solid #D9D0FF", borderRadius: 999, padding: "7px 12px", background: shortcut === value ? "#EEE9FF" : "#FFF", color: "#4F35CC", fontWeight: 800 }}
              >
                {label}
              </button>
            ))}
          </div>
          <label style={{ display: "grid", gap: 5, maxWidth: 480, fontWeight: 800 }}>
            Find by item, continuum, progression or family
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              style={{ minHeight: 46, border: "1px solid #CBD5E1", borderRadius: 12, padding: "8px 12px", font: "inherit" }}
            />
          </label>
          <strong>{filtered.length} visual items in this view</strong>
        </header>

        {selected ? (
          <section style={{ ...panel, display: "grid", gap: 12 }} aria-labelledby="active-visual-heading">
            <div>
              <h2 id="active-visual-heading" style={{ margin: 0 }}>Rendered learner question</h2>
              <p style={{ color: "#64748B", marginBottom: 0 }}>{selected.item.id} · {selected.coverage.continuum} · {selected.coverage.progressionTarget} · {selected.coverage.form}</p>
            </div>
            <aside style={{ border: "1px solid #CFE3D5", borderRadius: 14, background: "#F7FCF8", padding: 12 }}>
              <strong style={{ color: "#166534" }}>Staff-only expected truth</strong>
              <p style={{ margin: "5px 0 0", lineHeight: 1.5 }}>{selected.expectedTruth}</p>
            </aside>
            <StartingPointPlayer item={selected.item} progress={{ current: 1, total: 1 }} />
          </section>
        ) : (
          <p style={panel}>No visual item matches these filters.</p>
        )}

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }} aria-label="Visual item inventory">
          {filtered.map((entry) => (
            <article key={entry.item.id} style={{ ...panel, display: "grid", gap: 8, alignContent: "start" }}>
              <small style={{ color: "#64748B", fontWeight: 800 }}>{entry.classification} · {entry.coverage.progressionTarget} · {entry.truthSignature.kind}</small>
              <strong>{entry.item.id}</strong>
              <p style={{ margin: 0, lineHeight: 1.5 }}>{entry.learnerPrompt}</p>
              <p style={{ margin: 0, color: "#166534", lineHeight: 1.45 }}><strong>Expected truth:</strong> {entry.expectedTruth}</p>
              <button type="button" onClick={() => { setSelectedId(entry.item.id); window.scrollTo({ top: 0, behavior: "smooth" }); }} style={{ minHeight: 44, border: 0, borderRadius: 12, background: "#17204B", color: "#FFF", fontWeight: 800 }}>
                Inspect learner rendering
              </button>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
