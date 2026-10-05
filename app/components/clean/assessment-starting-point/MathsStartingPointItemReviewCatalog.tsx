"use client";

import React, { useMemo, useState } from "react";
import { AssessmentStimulus } from "@/lib/clean/assessments/visualTemplates/AssessmentStimulus";
import {
  NUMBER_OPERATIONS_PLACEMENT_ITEM_REGISTRY,
  type NumberOperationsPlacementItemRegistryEntry,
} from "@/lib/clean/assessments/placement/numberOperationsItemRegistry";
import type { NumberOperationsSubElementKey } from "@/lib/clean/assessments/placement/numberOperationsPlacementResult";

const AREA_LABELS: Record<NumberOperationsSubElementKey, string> = {
  "number-place-value": "Number and place value",
  "counting-processes": "Counting processes",
  "additive-strategies": "Additive strategies",
  "multiplicative-strategies": "Multiplicative strategies",
  "understanding-money": "Understanding money",
};

const AREA_KEYS = Object.keys(AREA_LABELS) as NumberOperationsSubElementKey[];

type ReviewFilter =
  | "all"
  | "visual"
  | "observation"
  | "accessibility"
  | "asset"
  | "ordering"
  | "symbolic";

function areaFor(entry: NumberOperationsPlacementItemRegistryEntry) {
  return (
    AREA_KEYS.find((key) => entry.poolKey.startsWith(`${key}-p`)) ||
    AREA_KEYS.find((key) => entry.item.analytics?.tags?.includes(key)) ||
    null
  );
}

function tags(entry: NumberOperationsPlacementItemRegistryEntry) {
  return entry.item.analytics?.tags || [];
}

function hasTagFragment(
  entry: NumberOperationsPlacementItemRegistryEntry,
  fragment: string,
) {
  return tags(entry).some((tag) => tag.includes(fragment));
}

function matchesReviewFilter(
  entry: NumberOperationsPlacementItemRegistryEntry,
  filter: ReviewFilter,
) {
  if (filter === "all") return true;
  if (filter === "visual") return entry.item.stimulus.type !== "none";
  if (filter === "observation") {
    return hasTagFragment(entry, "hybrid-routing-only");
  }
  if (filter === "accessibility") {
    return hasTagFragment(entry, "accessible-form-required");
  }
  if (filter === "ordering") {
    return entry.item.response.type === "ordering";
  }
  if (filter === "symbolic") {
    return (
      entry.item.response.type === "short-answer" &&
      String(entry.item.response.correctValue ?? "").includes("/")
    );
  }
  return (
    hasTagFragment(entry, "asset-review") ||
    hasTagFragment(entry, "currency-review") ||
    hasTagFragment(entry, "currency-token-review")
  );
}

function answerSummary(entry: NumberOperationsPlacementItemRegistryEntry) {
  const response = entry.item.response;

  if (response.type === "short-answer") {
    return [
      `Canonical: ${response.correctValue ?? "—"}`,
      response.acceptableValues?.length
        ? `Accepted: ${response.acceptableValues.join(", ")}`
        : null,
    ]
      .filter(Boolean)
      .join(" · ");
  }

  const optionById = new Map(
    (response.options || []).map((option) => [option.id, option.label]),
  );
  const labels = (response.correctOptionIds || []).map(
    (id) => optionById.get(id) || id,
  );
  return response.type === "ordering"
    ? `Correct order: ${labels.join(" → ")}`
    : `Correct: ${labels.join(", ")}`;
}

const fieldStyle: React.CSSProperties = {
  minHeight: 42,
  border: "1px solid #CBD5E1",
  borderRadius: 10,
  background: "#FFFFFF",
  color: "#17204B",
  padding: "8px 10px",
  font: "inherit",
};

export default function MathsStartingPointItemReviewCatalog() {
  const [area, setArea] = useState<"all" | NumberOperationsSubElementKey>("all");
  const [poolKind, setPoolKind] = useState<"all" | NumberOperationsPlacementItemRegistryEntry["poolKind"]>("all");
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>("all");
  const [query, setQuery] = useState("");

  const reviewCounts = useMemo(() => {
    const entries = NUMBER_OPERATIONS_PLACEMENT_ITEM_REGISTRY;
    return {
      visual: entries.filter((entry) => entry.item.stimulus.type !== "none").length,
      observation: entries.filter((entry) =>
        hasTagFragment(entry, "hybrid-routing-only"),
      ).length,
      accessibility: entries.filter((entry) =>
        hasTagFragment(entry, "accessible-form-required"),
      ).length,
      asset: entries.filter(
        (entry) =>
          hasTagFragment(entry, "asset-review") ||
          hasTagFragment(entry, "currency-review") ||
          hasTagFragment(entry, "currency-token-review"),
      ).length,
      ordering: entries.filter(
        (entry) => entry.item.response.type === "ordering",
      ).length,
      symbolic: entries.filter(
        (entry) =>
          entry.item.response.type === "short-answer" &&
          String(entry.item.response.correctValue ?? "").includes("/"),
      ).length,
    };
  }, []);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return NUMBER_OPERATIONS_PLACEMENT_ITEM_REGISTRY.filter((entry) => {
      const entryArea = areaFor(entry);
      if (area !== "all" && entryArea !== area) return false;
      if (poolKind !== "all" && entry.poolKind !== poolKind) return false;
      if (!matchesReviewFilter(entry, reviewFilter)) return false;
      if (!needle) return true;

      return [
        entry.item.id,
        entry.item.prompt,
        entry.item.skill.name,
        entry.poolKey,
        entry.item.curriculum?.code || "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [area, poolKind, query, reviewFilter]);

  return (
    <section style={{ display: "grid", gap: 16 }}>
      <section
        style={{
          border: "1px solid #DDE4EE",
          borderRadius: 18,
          background: "#FFFFFF",
          padding: 16,
          display: "grid",
          gap: 12,
        }}
      >
        <strong style={{ color: "#17204B", fontSize: 18 }}>
          Review {rows.length} of {NUMBER_OPERATIONS_PLACEMENT_ITEM_REGISTRY.length} items
        </strong>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {[
            ["Visual", reviewCounts.visual],
            ["Observation-limited", reviewCounts.observation],
            ["Accessible alternative", reviewCounts.accessibility],
            ["Asset review", reviewCounts.asset],
            ["Ordering", reviewCounts.ordering],
            ["Symbolic answer", reviewCounts.symbolic],
          ].map(([label, count]) => (
            <span
              key={String(label)}
              style={{
                border: "1px solid #DDE4EE",
                borderRadius: 999,
                background: "#F8FAFC",
                color: "#475569",
                padding: "4px 8px",
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              {label}: {count}
            </span>
          ))}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 10,
          }}
        >
          <label style={{ display: "grid", gap: 5 }}>
            <span style={{ fontWeight: 800, color: "#475569" }}>Area</span>
            <select
              value={area}
              onChange={(event) =>
                setArea(
                  event.target.value as
                    | "all"
                    | NumberOperationsSubElementKey,
                )
              }
              style={fieldStyle}
            >
              <option value="all">All areas</option>
              {AREA_KEYS.map((key) => (
                <option key={key} value={key}>
                  {AREA_LABELS[key]}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: "grid", gap: 5 }}>
            <span style={{ fontWeight: 800, color: "#475569" }}>Pool</span>
            <select
              value={poolKind}
              onChange={(event) =>
                setPoolKind(
                  event.target.value as
                    | "all"
                    | NumberOperationsPlacementItemRegistryEntry["poolKind"],
                )
              }
              style={fieldStyle}
            >
              <option value="all">All pools</option>
              <option value="anchor">Anchor</option>
              <option value="reserve">Reserve</option>
              <option value="search">Search</option>
              <option value="boundary">Boundary</option>
              <option value="confirmation">Confirmation</option>
            </select>
          </label>

          <label style={{ display: "grid", gap: 5 }}>
            <span style={{ fontWeight: 800, color: "#475569" }}>Review focus</span>
            <select
              value={reviewFilter}
              onChange={(event) =>
                setReviewFilter(event.target.value as ReviewFilter)
              }
              style={fieldStyle}
            >
              <option value="all">All items</option>
              <option value="visual">Visual stimulus</option>
              <option value="observation">Observation-limited</option>
              <option value="accessibility">Accessibility review</option>
              <option value="asset">Asset review</option>
              <option value="ordering">Ordering interaction</option>
              <option value="symbolic">Symbolic short answer</option>
            </select>
          </label>

          <label style={{ display: "grid", gap: 5 }}>
            <span style={{ fontWeight: 800, color: "#475569" }}>Search</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Item ID, prompt or skill"
              style={fieldStyle}
            />
          </label>
        </div>
      </section>

      {rows.map((entry) => {
        const entryArea = areaFor(entry);
        return (
          <details
            key={entry.item.id}
            style={{
              border: "1px solid #DDE4EE",
              borderRadius: 16,
              background: "#FFFFFF",
              padding: "12px 14px",
            }}
          >
            <summary
              style={{
                cursor: "pointer",
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                alignItems: "center",
                color: "#17204B",
              }}
            >
              <strong>{entry.item.id}</strong>
              <span style={{ color: "#64748B" }}>
                {entryArea ? AREA_LABELS[entryArea] : "Unknown area"} · {entry.poolKind} · {entry.item.response.type}
              </span>
              <span
                style={{
                  border: "1px solid #CBD5E1",
                  borderRadius: 999,
                  padding: "2px 7px",
                  fontSize: 11,
                  fontWeight: 800,
                }}
              >
                {entry.item.status}
              </span>
            </summary>

            <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
              <div style={{ display: "grid", gap: 5 }}>
                <strong style={{ color: "#17204B" }}>{entry.item.skill.name}</strong>
                <span style={{ color: "#4B5563", lineHeight: 1.6 }}>
                  {entry.item.prompt}
                </span>
                <small style={{ color: "#64748B" }}>
                  {entry.item.curriculum?.code || "No curriculum code"} · {entry.item.curriculum?.yearLevel || "Year level not set"} · pool {entry.poolKey}
                </small>
              </div>

              {entry.item.stimulus.type !== "none" ? (
                <div style={{ display: "grid", gap: 6 }}>
                  <AssessmentStimulus stimulus={entry.item.stimulus} />
                  <small style={{ color: "#64748B", lineHeight: 1.5 }}>
                    Alt text: {entry.item.stimulus.altText || "—"}
                  </small>
                </div>
              ) : null}

              {entry.item.response.options?.length ? (
                <ol style={{ margin: 0, paddingLeft: 22, color: "#4B5563" }}>
                  {entry.item.response.options.map((option) => (
                    <li key={option.id}>
                      {option.label} <small>({option.id})</small>
                    </li>
                  ))}
                </ol>
              ) : null}

              <div
                style={{
                  border: "1px solid #CFE3D5",
                  borderRadius: 12,
                  background: "#F7FCF8",
                  padding: 10,
                  color: "#166534",
                  fontWeight: 800,
                  lineHeight: 1.5,
                }}
              >
                {answerSummary(entry)}
              </div>

              <small style={{ color: "#64748B", lineHeight: 1.5 }}>
                Tags: {tags(entry).join(", ") || "none"}
              </small>
            </div>
          </details>
        );
      })}

      {!rows.length ? (
        <div
          role="status"
          style={{
            border: "1px solid #DDE4EE",
            borderRadius: 16,
            background: "#FFFFFF",
            padding: 16,
            color: "#64748B",
          }}
        >
          No placement items match the current filters.
        </div>
      ) : null}
    </section>
  );
}
