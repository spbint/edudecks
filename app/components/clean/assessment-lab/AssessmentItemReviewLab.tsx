"use client";

import React, { useMemo, useState } from "react";
import AssessmentPlayerV1 from "@/app/components/clean/assessment-lab/AssessmentPlayerV1";
import {
  ASSESSMENT_PLACEMENT_ITEM_REGISTRY,
  type AssessmentPlacementPoolKind,
} from "@/lib/clean/assessments/placement/assessmentPlacementItemRegistry";

type ReviewFrame = "phone" | "tablet" | "desktop";

const FRAME_WIDTHS: Record<ReviewFrame, number | string> = {
  phone: 390,
  tablet: 768,
  desktop: "100%",
};

const card: React.CSSProperties = {
  border: "1px solid #E1E6F0",
  borderRadius: 18,
  background: "#ffffff",
  padding: 16,
  display: "grid",
  gap: 10,
};

function subElementFromPoolKey(poolKey: string) {
  return poolKey.replace(/-p\d+$/, "");
}

export default function AssessmentItemReviewLab() {
  const [poolKind, setPoolKind] = useState<"all" | AssessmentPlacementPoolKind>("all");
  const [subElement, setSubElement] = useState("all");
  const [frame, setFrame] = useState<ReviewFrame>("phone");
  const [query, setQuery] = useState("");

  const subElements = useMemo(
    () =>
      Array.from(
        new Set(
          ASSESSMENT_PLACEMENT_ITEM_REGISTRY.map((entry) =>
            subElementFromPoolKey(entry.poolKey),
          ),
        ),
      ).sort(),
    [],
  );

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return ASSESSMENT_PLACEMENT_ITEM_REGISTRY.filter((entry) => {
      if (poolKind !== "all" && entry.poolKind !== poolKind) return false;
      if (
        subElement !== "all" &&
        subElementFromPoolKey(entry.poolKey) !== subElement
      ) {
        return false;
      }
      if (!normalizedQuery) return true;
      return (
        entry.item.id.toLowerCase().includes(normalizedQuery) ||
        entry.item.prompt.toLowerCase().includes(normalizedQuery) ||
        (entry.item.curriculum?.code || "")
          .toLowerCase()
          .includes(normalizedQuery)
      );
    });
  }, [poolKind, query, subElement]);

  const [selectedItemId, setSelectedItemId] = useState(
    ASSESSMENT_PLACEMENT_ITEM_REGISTRY[0]?.item.id || "",
  );

  const selected =
    filtered.find((entry) => entry.item.id === selectedItemId) ||
    filtered[0] ||
    null;

  const selectedIndex = selected
    ? filtered.findIndex((entry) => entry.item.id === selected.item.id)
    : -1;

  const chooseIndex = (nextIndex: number) => {
    const entry = filtered[nextIndex];
    if (entry) setSelectedItemId(entry.item.id);
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F7F8FC",
        padding: "clamp(16px, 4vw, 38px)",
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          display: "grid",
          gap: 18,
        }}
      >
        <section style={card}>
          <span
            style={{
              color: "#6C4DF6",
              fontSize: 12,
              fontWeight: 900,
              textTransform: "uppercase",
            }}
          >
            Internal assessment lab · item review
          </span>
          <h1
            style={{
              margin: 0,
              color: "#17204B",
              fontSize: "clamp(28px, 5vw, 44px)",
            }}
          >
            Trusted item & visual review
          </h1>
          <p style={{ margin: 0, color: "#5B6478", lineHeight: 1.6 }}>
            Review the exact score-bearing item in the shared placement player.
            This route is staff-only and does not save responses or learner data.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
              gap: 10,
            }}
          >
            <label style={{ display: "grid", gap: 5 }}>
              <strong style={{ color: "#17204B", fontSize: 13 }}>
                Pool
              </strong>
              <select
                aria-label="Pool"
                value={poolKind}
                onChange={(event) => {
                  setPoolKind(
                    event.target.value as
                      | "all"
                      | AssessmentPlacementPoolKind,
                  );
                  setSelectedItemId("");
                }}
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
              <strong style={{ color: "#17204B", fontSize: 13 }}>
                Sub-element
              </strong>
              <select
                aria-label="Sub-element"
                value={subElement}
                onChange={(event) => {
                  setSubElement(event.target.value);
                  setSelectedItemId("");
                }}
              >
                <option value="all">All sub-elements</option>
                {subElements.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: "grid", gap: 5 }}>
              <strong style={{ color: "#17204B", fontSize: 13 }}>
                Search
              </strong>
              <input
                aria-label="Search items"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setSelectedItemId("");
                }}
                placeholder="Item ID, prompt or progression code"
              />
            </label>

            <label style={{ display: "grid", gap: 5 }}>
              <strong style={{ color: "#17204B", fontSize: 13 }}>
                Viewport
              </strong>
              <select
                aria-label="Viewport"
                value={frame}
                onChange={(event) =>
                  setFrame(event.target.value as ReviewFrame)
                }
              >
                <option value="phone">Phone · 390px</option>
                <option value="tablet">Tablet · 768px</option>
                <option value="desktop">Desktop</option>
              </select>
            </label>
          </div>

          <strong style={{ color: "#17204B" }}>
            {filtered.length} item{filtered.length === 1 ? "" : "s"} in this view
          </strong>
        </section>

        {selected ? (
          <>
            <section style={card}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ display: "grid", gap: 4 }}>
                  <strong style={{ color: "#17204B", fontSize: 18 }}>
                    {selected.item.id}
                  </strong>
                  <code style={{ color: "#64748B" }}>
                    {selected.item.curriculum?.code || "No curriculum code"}
                  </code>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <span>{selected.poolKind}</span>
                  <span>·</span>
                  <span>{selected.poolKey}</span>
                  <span>·</span>
                  <span>v{selected.item.version}</span>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: 10,
                }}
              >
                <div>
                  <small style={{ color: "#64748B" }}>Response type</small>
                  <div style={{ color: "#17204B", fontWeight: 800 }}>
                    {selected.item.response.type}
                  </div>
                </div>
                <div>
                  <small style={{ color: "#64748B" }}>Stimulus type</small>
                  <div style={{ color: "#17204B", fontWeight: 800 }}>
                    {selected.item.stimulus.type}
                  </div>
                </div>
                <div>
                  <small style={{ color: "#64748B" }}>Status</small>
                  <div style={{ color: "#17204B", fontWeight: 800 }}>
                    {selected.item.status}
                  </div>
                </div>
                <div>
                  <small style={{ color: "#64748B" }}>Misconception tags</small>
                  <div style={{ color: "#17204B", fontWeight: 800 }}>
                    {selected.item.misconceptionTags?.length
                      ? selected.item.misconceptionTags.join(", ")
                      : "None"}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  disabled={selectedIndex <= 0}
                  onClick={() => chooseIndex(selectedIndex - 1)}
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={selectedIndex < 0 || selectedIndex >= filtered.length - 1}
                  onClick={() => chooseIndex(selectedIndex + 1)}
                >
                  Next
                </button>
                <select
                  aria-label="Selected assessment item"
                  value={selected.item.id}
                  onChange={(event) => setSelectedItemId(event.target.value)}
                  style={{ minWidth: 280, maxWidth: "100%" }}
                >
                  {filtered.map((entry) => (
                    <option key={entry.item.id} value={entry.item.id}>
                      {entry.item.id}
                    </option>
                  ))}
                </select>
              </div>
            </section>

            <section
              aria-label={frame + " assessment preview"}
              style={{
                width: FRAME_WIDTHS[frame],
                maxWidth: "100%",
                margin: "0 auto",
                border:
                  frame === "desktop"
                    ? "none"
                    : "10px solid #17204B",
                borderRadius: frame === "phone" ? 28 : 20,
                background: "#ffffff",
                padding: frame === "desktop" ? 0 : 10,
                boxSizing: "border-box",
              }}
            >
              <AssessmentPlayerV1
                key={selected.item.id + "-" + frame}
                title={"Item review · " + selected.item.id}
                items={[selected.item]}
                mode="placement"
              />
            </section>
          </>
        ) : (
          <section style={{ ...card, background: "#FFFDF5" }}>
            <strong style={{ color: "#92400E" }}>No matching item</strong>
          </section>
        )}
      </div>
    </main>
  );
}
