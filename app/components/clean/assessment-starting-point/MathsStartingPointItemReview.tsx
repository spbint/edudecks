"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AssessmentStimulus } from "@/lib/clean/assessments/visualTemplates/AssessmentStimulus";
import {
  NUMBER_OPERATIONS_CUSTOMER_ROUTE_ITEM_REGISTRY,
  NUMBER_OPERATIONS_PLACEMENT_ITEM_REGISTRY,
  type NumberOperationsPlacementPoolKind,
} from "@/lib/clean/assessments/placement/numberOperationsItemRegistry";
import {
  getNumberOperationsItemReviewFlags,
  numberOperationsItemReviewFlagLabel,
} from "@/lib/clean/assessments/placement/numberOperationsItemReviewFlags";

const LOCAL_REVIEW_STORAGE_KEY =
  "mylearna:maths-starting-point:item-review:v1";

function readLocalReviewedItemIds() {
  if (typeof window === "undefined") return new Set<string>();

  try {
    const raw = window.localStorage.getItem(LOCAL_REVIEW_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(
      Array.isArray(parsed)
        ? parsed.filter((value): value is string => typeof value === "string")
        : [],
    );
  } catch {
    return new Set<string>();
  }
}

function writeLocalReviewedItemIds(reviewed: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      LOCAL_REVIEW_STORAGE_KEY,
      JSON.stringify(Array.from(reviewed).sort()),
    );
  } catch {
    // Local staff review progress is a convenience only.
  }
}

const AREA_LABELS: Record<string, string> = {
  "number-place-value": "Number & place value",
  "counting-processes": "Counting processes",
  "additive-strategies": "Additive strategies",
  "multiplicative-strategies": "Multiplicative strategies",
  "understanding-money": "Understanding money",
};

function parsePoolKey(poolKey: string) {
  const match = poolKey.match(
    /^(number-place-value|counting-processes|additive-strategies|multiplicative-strategies|understanding-money)-p(\d+)$/,
  );
  return {
    area: match?.[1] || "",
    pLevel: match ? Number(match[2]) : null,
  };
}

const panel: React.CSSProperties = {
  border: "1px solid #E1E6F0",
  borderRadius: 18,
  background: "#FFFFFF",
  padding: 16,
  display: "grid",
  gap: 10,
};

export default function MathsStartingPointItemReview() {
  const [area, setArea] = useState("all");
  const [poolKind, setPoolKind] = useState<"all" | NumberOperationsPlacementPoolKind>("all");
  const [pLevel, setPLevel] = useState("all");
  const [status, setStatus] = useState("all");
  const [attentionOnly, setAttentionOnly] = useState(false);
  const [includeConfirmationItems, setIncludeConfirmationItems] =
    useState(false);
  const [unreviewedOnly, setUnreviewedOnly] = useState(false);
  const [reviewedItemIds, setReviewedItemIds] = useState<Set<string>>(
    () => new Set<string>(),
  );
  const [reviewHydrated, setReviewHydrated] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setReviewedItemIds(readLocalReviewedItemIds());
    setReviewHydrated(true);
  }, []);

  const toggleReviewed = (itemId: string) => {
    setReviewedItemIds((current) => {
      const next = new Set(current);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      writeLocalReviewedItemIds(next);
      return next;
    });
  };

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const source = includeConfirmationItems
      ? NUMBER_OPERATIONS_PLACEMENT_ITEM_REGISTRY
      : NUMBER_OPERATIONS_CUSTOMER_ROUTE_ITEM_REGISTRY;

    return source.filter((entry) => {
      const parsed = parsePoolKey(entry.poolKey);
      if (area !== "all" && parsed.area !== area) return false;
      if (poolKind !== "all" && entry.poolKind !== poolKind) return false;
      if (pLevel !== "all" && String(parsed.pLevel ?? "") !== pLevel) return false;
      if (status !== "all" && entry.item.status !== status) return false;
      const flags = getNumberOperationsItemReviewFlags(entry);
      if (attentionOnly && !flags.length) return false;
      if (unreviewedOnly && reviewedItemIds.has(entry.item.id)) return false;
      if (
        q &&
        ![
          entry.item.id,
          entry.item.prompt,
          entry.item.skill.name,
          entry.item.curriculum?.code || "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [
    area,
    attentionOnly,
    includeConfirmationItems,
    pLevel,
    poolKind,
    query,
    reviewedItemIds,
    status,
    unreviewedOnly,
  ]);

  const distinctPLevels = Array.from(
    new Set(
      NUMBER_OPERATIONS_PLACEMENT_ITEM_REGISTRY
        .map((entry) => parsePoolKey(entry.poolKey).pLevel)
        .filter((value): value is number => value !== null),
    ),
  ).sort((a, b) => a - b);

  return (
    <section style={{ display: "grid", gap: 16 }}>
      <section style={panel}>
        <span
          style={{
            color: "#92400E",
            fontSize: 12,
            fontWeight: 900,
            textTransform: "uppercase",
          }}
        >
          Staff-only item QA
        </span>
        <h1 style={{ margin: 0, color: "#17204B" }}>
          Number & Operations placement item review
        </h1>
        <p style={{ margin: 0, color: "#4B5563", lineHeight: 1.6 }}>
          Review the canonical item estate before publication. Filters never alter
          routing, status or customer visibility.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 10,
          }}
        >
          <label style={{ display: "grid", gap: 5 }}>
            <strong>Area</strong>
            <select value={area} onChange={(event) => setArea(event.target.value)}>
              <option value="all">All areas</option>
              {Object.entries(AREA_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </label>
          <label style={{ display: "grid", gap: 5 }}>
            <strong>P-level</strong>
            <select value={pLevel} onChange={(event) => setPLevel(event.target.value)}>
              <option value="all">All P-levels</option>
              {distinctPLevels.map((level) => (
                <option key={level} value={level}>P{level}</option>
              ))}
            </select>
          </label>
          <label style={{ display: "grid", gap: 5 }}>
            <strong>Pool</strong>
            <select
              value={poolKind}
              onChange={(event) =>
                setPoolKind(event.target.value as "all" | NumberOperationsPlacementPoolKind)
              }
            >
              <option value="all">All pools</option>
              {(["anchor", "reserve", "search", "boundary", "confirmation"] as const).map(
                (value) => <option key={value} value={value}>{value}</option>,
              )}
            </select>
          </label>
          <label style={{ display: "grid", gap: 5 }}>
            <strong>Status</strong>
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="all">All statuses</option>
              {["draft", "review", "approved", "published", "retired"].map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </label>
          <label
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              alignSelf: "end",
              minHeight: 44,
            }}
          >
            <input
              type="checkbox"
              checked={attentionOnly}
              onChange={(event) => setAttentionOnly(event.target.checked)}
            />
            <strong>Needs attention only</strong>
          </label>
          <label
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              alignSelf: "end",
              minHeight: 44,
            }}
          >
            <input
              type="checkbox"
              checked={includeConfirmationItems}
              onChange={(event) =>
                setIncludeConfirmationItems(event.target.checked)
              }
            />
            <strong>Include 20 confirmation-only lab items</strong>
          </label>
          <label
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              alignSelf: "end",
              minHeight: 44,
            }}
          >
            <input
              type="checkbox"
              checked={unreviewedOnly}
              onChange={(event) => setUnreviewedOnly(event.target.checked)}
            />
            <strong>Unreviewed in this browser only</strong>
          </label>
          <label style={{ display: "grid", gap: 5 }}>
            <strong>Search</strong>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ID, prompt, skill or code"
            />
          </label>
        </div>

        <strong style={{ color: "#17204B" }}>
          Showing {rows.length} of{" "}
          {includeConfirmationItems
            ? NUMBER_OPERATIONS_PLACEMENT_ITEM_REGISTRY.length
            : NUMBER_OPERATIONS_CUSTOMER_ROUTE_ITEM_REGISTRY.length}{" "}
          {includeConfirmationItems ? "registry" : "customer-route"} items
        </strong>
        <small style={{ color: "#64748B", lineHeight: 1.5 }}>
          {reviewHydrated
            ? `${reviewedItemIds.size} item${reviewedItemIds.size === 1 ? "" : "s"} marked reviewed in this browser.`
            : "Loading local review progress..."}{" "}
          This checklist never changes source status, release state or customer visibility.
        </small>
      </section>

      {rows.map((entry) => {
        const parsed = parsePoolKey(entry.poolKey);
        const flags = getNumberOperationsItemReviewFlags(entry);

        return (
          <article key={entry.item.id} style={panel}>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                alignItems: "center",
              }}
            >
              <strong style={{ color: "#17204B" }}>{entry.item.id}</strong>
              <span>{AREA_LABELS[parsed.area] || parsed.area}</span>
              <span>P{parsed.pLevel ?? "?"}</span>
              <span>{entry.poolKind}</span>
              <span>{entry.item.status}</span>
            </div>

            <div style={{ display: "grid", gap: 4 }}>
              <strong style={{ color: "#17204B" }}>{entry.item.skill.name}</strong>
              <span style={{ color: "#64748B", fontSize: 13 }}>
                {entry.item.curriculum?.code || "No curriculum code"}
              </span>
            </div>

            <p style={{ margin: 0, color: "#17204B", lineHeight: 1.6 }}>
              {entry.item.prompt}
            </p>

            {entry.item.stimulus.type !== "none" ? (
              <AssessmentStimulus stimulus={entry.item.stimulus} />
            ) : null}

            {entry.item.response.options?.length ? (
              <ol style={{ margin: 0, paddingLeft: 22, color: "#4B5563", lineHeight: 1.6 }}>
                {entry.item.response.options.map((option) => (
                  <li key={option.id}>
                    {option.label}
                    {entry.item.response.correctOptionIds?.includes(option.id)
                      ? " ✓"
                      : ""}
                  </li>
                ))}
              </ol>
            ) : null}

            {entry.item.response.type === "short-answer" ? (
              <div style={{ color: "#4B5563" }}>
                <strong>Canonical answer:</strong>{" "}
                {String(entry.item.response.correctValue ?? "")}
                {entry.item.response.acceptableValues?.length ? (
                  <>
                    {" · "}
                    <strong>Accepted:</strong>{" "}
                    {entry.item.response.acceptableValues.join(", ")}
                  </>
                ) : null}
              </div>
            ) : null}

            {entry.item.response.type === "ordering" ? (
              <div style={{ color: "#4B5563" }}>
                <strong>Correct order:</strong>{" "}
                {(entry.item.response.correctOptionIds || []).join(" → ")}
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => toggleReviewed(entry.item.id)}
              style={{
                border: reviewedItemIds.has(entry.item.id)
                  ? "1px solid #86EFAC"
                  : "1px solid #CBD5E1",
                borderRadius: 10,
                background: reviewedItemIds.has(entry.item.id)
                  ? "#F0FDF4"
                  : "#FFFFFF",
                color: reviewedItemIds.has(entry.item.id)
                  ? "#166534"
                  : "#17204B",
                minHeight: 40,
                padding: "8px 11px",
                width: "fit-content",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              {reviewedItemIds.has(entry.item.id)
                ? "Reviewed locally ✓"
                : "Mark reviewed locally"}
            </button>

            {flags.length ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {flags.map((flag) => (
                  <span
                    key={flag}
                    style={{
                      border: "1px solid #F5D08A",
                      borderRadius: 999,
                      background: "#FFFDF5",
                      color: "#92400E",
                      padding: "4px 8px",
                      fontSize: 12,
                      fontWeight: 800,
                    }}
                  >
                    {numberOperationsItemReviewFlagLabel(flag)}
                  </span>
                ))}
              </div>
            ) : null}
          </article>
        );
      })}
    </section>
  );
}
