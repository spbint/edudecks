"use client";

import React, { useMemo, useState } from "react";
import type { StartingPointRendererQaItem } from "@/lib/clean/assessments/interactivePlayer/startingPointRendererCoverage";
import { NUMBER_OPERATIONS_STARTING_POINT_PRODUCT } from "@/lib/clean/assessments/numberOperationsStartingPointProduct";
import StartingPointPlayer from "./StartingPointPlayer";

type Props = {
  items: StartingPointRendererQaItem[];
  edgeCases: Array<{ label: string; itemId: string }>;
  summary: { total: number; initial: number; fresh: number; alternatives: number; routingOnly: number };
};

const viewportOptions = [
  { label: "Phone · 390px", width: 390 },
  { label: "Large phone · 430px", width: 430 },
  { label: "Tablet · 768px", width: 768 },
  { label: "Desktop · 1024px", width: 1024 },
] as const;

const continuumLabels = Object.fromEntries(
  NUMBER_OPERATIONS_STARTING_POINT_PRODUCT.assessedAreas.map((area) => [area.key, area.shortLabel]),
) as Record<string, string>;

const controlStyle: React.CSSProperties = {
  minHeight: 44,
  border: "1px solid #CBD5E1",
  borderRadius: 10,
  padding: "8px 10px",
  background: "#FFFFFF",
  color: "#17204B",
  font: "inherit",
};

export default function StartingPointPlayerShowcase({ items, edgeCases, summary }: Props) {
  const [frameWidth, setFrameWidth] = useState<number>(390);
  const [continuum, setContinuum] = useState("all");
  const [progression, setProgression] = useState("all");
  const [renderer, setRenderer] = useState("all");
  const [form, setForm] = useState("all");
  const [alternative, setAlternative] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(items[0]?.item.id ?? "");

  const filtered = useMemo(() => items.filter(({ item, coverage }) =>
    (continuum === "all" || coverage.continuum === continuum) &&
    (progression === "all" || coverage.progressionTarget === progression) &&
    (renderer === "all" || coverage.rendererFamily === renderer) &&
    (form === "all" || coverage.form === form) &&
    (alternative === "all" || (alternative === "yes") === coverage.accessibilityLimited) &&
    (!query.trim() || item.id.toLowerCase().includes(query.trim().toLowerCase())),
  ), [alternative, continuum, form, items, progression, query, renderer]);

  const selected = filtered.find(({ item }) => item.id === selectedId) ?? filtered[0];
  const selectedIndex = selected ? filtered.findIndex(({ item }) => item.id === selected.item.id) : -1;
  const progressions = [...new Set(items.map(({ coverage }) => coverage.progressionTarget))]
    .sort((left, right) => Number(left.slice(1)) - Number(right.slice(1)));
  const renderers = [...new Set(items.flatMap(({ coverage }) => coverage.rendererFamily ? [coverage.rendererFamily] : []))].sort();

  function resetFilters(nextItemId?: string) {
    setContinuum("all"); setProgression("all"); setRenderer("all");
    setForm("all"); setAlternative("all"); setQuery("");
    if (nextItemId) setSelectedId(nextItemId);
  }

  return (
    <main style={{ minHeight: "100vh", background: "#F4F2FA", padding: "clamp(16px, 4vw, 42px)" }}>
      <div style={{ width: "min(100%, 1180px)", margin: "0 auto", display: "grid", gap: 24 }}>
        <header style={{ display: "grid", gap: 12 }}>
          <span style={{ color: "#6C4DF6", fontSize: 12, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase" }}>Staff-only · full-estate QA</span>
          <h1 style={{ margin: 0, color: "#17204B", fontSize: "clamp(30px, 5vw, 52px)", letterSpacing: "-0.035em" }}>{NUMBER_OPERATIONS_STARTING_POINT_PRODUCT.commercialDisplayName}</h1>
          <p style={{ margin: 0, maxWidth: 820, color: "#5B6478", lineHeight: 1.65 }}>
            Review all {summary.total} active canonical items through the production player adapter. This surface saves no evidence and changes no learner pathway.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {[`${summary.initial} initial`, `${summary.fresh} fresh/recheck`, `${summary.alternatives} with another answer path`, `${summary.routingOnly} routing-only evidence`].map((label) =>
              <span key={label} style={{ borderRadius: 999, padding: "6px 10px", background: "#FFFFFF", border: "1px solid #E1E5EE", color: "#4B5563", fontSize: 12, fontWeight: 800 }}>{label}</span>
            )}
          </div>
        </header>

        <section aria-label="Full-estate filters" style={{ border: "1px solid #DDD6FE", borderRadius: 18, background: "#FBFAFF", padding: 16, display: "grid", gap: 12 }}>
          <strong style={{ color: "#17204B" }}>Find a canonical item</strong>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 10 }}>
            <label style={{ display: "grid", gap: 5 }}><span>Continuum</span><select style={controlStyle} value={continuum} onChange={(event) => setContinuum(event.target.value)}><option value="all">All five areas</option>{NUMBER_OPERATIONS_STARTING_POINT_PRODUCT.assessedAreas.map((area) => <option key={area.key} value={area.key}>{area.shortLabel}</option>)}</select></label>
            <label style={{ display: "grid", gap: 5 }}><span>Progression target</span><select style={controlStyle} value={progression} onChange={(event) => setProgression(event.target.value)}><option value="all">All targets</option>{progressions.map((value) => <option key={value}>{value}</option>)}</select></label>
            <label style={{ display: "grid", gap: 5 }}><span>Renderer family</span><select style={controlStyle} value={renderer} onChange={(event) => setRenderer(event.target.value)}><option value="all">All renderers</option>{renderers.map((value) => <option key={value}>{value}</option>)}</select></label>
            <label style={{ display: "grid", gap: 5 }}><span>Assessment form</span><select style={controlStyle} value={form} onChange={(event) => setForm(event.target.value)}><option value="all">Initial and fresh</option><option value="initial-placement">Initial placement</option><option value="fresh-recheck">Fresh/recheck</option></select></label>
            <label style={{ display: "grid", gap: 5 }}><span>Another answer path</span><select style={controlStyle} value={alternative} onChange={(event) => setAlternative(event.target.value)}><option value="all">All items</option><option value="yes">Required</option><option value="no">Not required</option></select></label>
            <label style={{ display: "grid", gap: 5 }}><span>Item ID</span><input style={controlStyle} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search canonical ID" /></label>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <strong style={{ color: "#17204B" }}>Edge cases:</strong>
            {edgeCases.map((edgeCase) => <button key={`${edgeCase.label}:${edgeCase.itemId}`} type="button" onClick={() => resetFilters(edgeCase.itemId)} style={{ ...controlStyle, minHeight: 38, padding: "6px 9px", cursor: "pointer" }}>{edgeCase.label}</button>)}
          </div>
          <label style={{ display: "grid", gap: 5 }}><span>{filtered.length} matching items</span><select style={controlStyle} size={Math.min(6, Math.max(2, filtered.length))} value={selected?.item.id ?? ""} onChange={(event) => setSelectedId(event.target.value)}>{filtered.map(({ item, coverage }) => <option key={item.id} value={item.id}>{coverage.progressionTarget} · {coverage.form === "fresh-recheck" ? "Fresh" : "Initial"} · {coverage.rendererFamily} · {item.id}</option>)}</select></label>
        </section>

        <nav aria-label="Review viewport" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {viewportOptions.map((option) => <button key={option.width} type="button" aria-pressed={frameWidth === option.width} onClick={() => setFrameWidth(option.width)} style={{ minHeight: 44, border: frameWidth === option.width ? "2px solid #6C4DF6" : "1px solid #CDD3E1", borderRadius: 14, padding: "9px 14px", background: frameWidth === option.width ? "#EEE9FF" : "#FFFFFF", color: "#17204B", fontWeight: 850, cursor: "pointer" }}>{option.label}</button>)}
        </nav>

        {selected ? <section style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start", flexWrap: "wrap" }}>
            <div style={{ display: "grid", gap: 4 }}><h2 style={{ margin: 0, color: "#17204B", fontSize: 20 }}>{continuumLabels[selected.coverage.continuum]} · {selected.coverage.progressionTarget}</h2><span style={{ color: "#64748B", fontSize: 12, fontWeight: 750 }}>Staff metadata: {selected.item.id} · v{selected.item.version} · {selected.coverage.assessmentRole} · {selected.coverage.rendererFamily}</span></div>
            <span style={{ border: "1px solid #D9D0FF", borderRadius: 999, padding: "6px 10px", background: "#F8F6FF", color: "#5535DF", fontSize: 12, fontWeight: 850 }}>Viewport {frameWidth}px</span>
          </div>
          <div aria-label="Visual quality checks" style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>{[selected.coverage.form === "fresh-recheck" ? "Fresh/recheck" : "Initial", selected.coverage.accessibilityLimited ? "Another answer path required" : "Standard access", selected.coverage.routingOnlyEvidence ? "Routing-only evidence" : "Standard evidence", "No persistence"].map((label) => <span key={label} style={{ borderRadius: 999, padding: "5px 9px", background: "#FFFFFF", border: "1px solid #E1E5EE", color: "#5B6478", fontSize: 11, fontWeight: 800 }}>{label}</span>)}</div>
          <div data-review-width={frameWidth} style={{ width: `min(100%, ${frameWidth}px)`, margin: "0 auto", overflow: "hidden", border: "1px dashed #B9A8FF", borderRadius: frameWidth <= 430 ? 22 : 30, background: "#FFFFFF" }}>
            <StartingPointPlayer key={selected.item.id} item={selected.item} progress={{ current: selectedIndex + 1, total: filtered.length }} />
          </div>
        </section> : <div role="status" style={{ border: "1px solid #DDE4EE", borderRadius: 16, background: "#FFFFFF", padding: 20, color: "#4B5563" }}>No canonical items match these filters. Clear or broaden a filter to continue reviewing.</div>}
      </div>
    </main>
  );
}
