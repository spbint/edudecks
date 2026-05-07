"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import CleanFamilyWorkspaceProvider, {
  useCleanFamilyWorkspace,
} from "@/app/components/clean/CleanFamilyWorkspaceProvider";
import CleanWorkflowRibbon from "@/app/components/clean/CleanWorkflowRibbon";
import {
  createCleanPortfolioHighlight,
  deleteCleanPortfolioHighlight,
  listCleanPortfolioItems,
} from "@/lib/clean/portfolio/client";
import type { CleanPortfolioItem } from "@/lib/clean/portfolio/types";
import {
  CLEAN_SCHEMA_NOT_INSTALLED_MESSAGE,
  normalizeCleanErrorMessage,
} from "@/lib/clean/family/client";

const shellStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#f8fafc",
  padding: "32px 20px 48px",
};

const wrapStyle: React.CSSProperties = {
  maxWidth: 1080,
  margin: "0 auto",
  display: "grid",
  gap: 20,
};

const cardStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 18,
  background: "#ffffff",
  padding: 20,
  boxShadow: "0 8px 24px rgba(15,23,42,0.05)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #cbd5e1",
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 14,
};

const buttonStyle: React.CSSProperties = {
  border: "1px solid #0f172a",
  background: "#0f172a",
  color: "#ffffff",
  borderRadius: 10,
  padding: "10px 14px",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
};

function getLearnerLabel(firstName: string, preferredName: string | null) {
  return preferredName || firstName;
}

function formatDateLabel(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function portfolioCardTitle(item: CleanPortfolioItem) {
  return item.evidence.title || item.evidence.whatHappened;
}

function CleanPortfolioWorkspaceBody() {
  const workspace = useCleanFamilyWorkspace();
  const [selectedLearnerId, setSelectedLearnerId] = useState("");
  const [items, setItems] = useState<CleanPortfolioItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const learnerOptions = useMemo(
    () =>
      workspace.learners.map((learner) => ({
        value: learner.id,
        label: getLearnerLabel(learner.firstName, learner.preferredName),
      })),
    [workspace.learners],
  );

  const reloadItems = useCallback(async () => {
    if (!workspace.profile) return;

    setItemsLoading(true);
    setItemsError(null);
    try {
      const nextItems = await listCleanPortfolioItems(workspace.profile.id, {
        learnerId: selectedLearnerId || null,
        limit: 50,
      });
      setItems(nextItems);
    } catch (error) {
      setItemsError(
        normalizeCleanErrorMessage(
          error,
          "We could not load clean portfolio items just now.",
        ),
      );
    } finally {
      setItemsLoading(false);
    }
  }, [selectedLearnerId, workspace.profile]);

  useEffect(() => {
    if (!workspace.profile || workspace.schemaMissing || workspace.requiresFamilyCreation) {
      setItems([]);
      return;
    }

    void reloadItems();
  }, [
    reloadItems,
    workspace.profile,
    workspace.requiresFamilyCreation,
    workspace.schemaMissing,
  ]);

  async function handleToggleHighlight(item: CleanPortfolioItem) {
    if (!workspace.profile) return;

    setSubmitting(true);
    setMessage(null);
    setActionError(null);

    try {
      if (item.highlight) {
        await deleteCleanPortfolioHighlight(workspace.profile.id, item.highlight.id);
        setMessage("Portfolio highlight removed.");
      } else {
        await createCleanPortfolioHighlight(workspace.profile.id, {
          learnerId: item.evidence.learnerId,
          evidenceEntryId: item.evidence.id,
        });
        setMessage("Portfolio highlight saved.");
      }

      await reloadItems();
    } catch (error) {
      setActionError(
        normalizeCleanErrorMessage(
          error,
          "We could not update the clean portfolio highlight.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  const readyForPortfolio =
    !workspace.loading && !workspace.schemaMissing && !workspace.requiresFamilyCreation;

  return (
    <div style={shellStyle}>
      <div style={wrapStyle}>
        <CleanWorkflowRibbon />

        <section style={cardStyle}>
          <div style={{ display: "grid", gap: 8 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "0.08em",
                color: "#64748b",
                textTransform: "uppercase",
              }}
            >
              Clean rebuild scaffold
            </div>
            <h1 style={{ margin: 0, fontSize: 28, color: "#0f172a" }}>My Portfolio</h1>
            <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
              This preview route shows clean evidence cards and uses clean portfolio highlights only.
            </p>
          </div>
        </section>

        {workspace.loading ? (
          <section style={cardStyle}>Loading clean family workspace...</section>
        ) : null}

        {!workspace.loading && workspace.schemaMissing ? (
          <section style={cardStyle}>
            <strong style={{ display: "block", marginBottom: 8 }}>
              {CLEAN_SCHEMA_NOT_INSTALLED_MESSAGE}
            </strong>
            <p style={{ margin: 0, color: "#475569" }}>
              The clean portfolio scaffold will not fall back to legacy portfolio or storage systems.
            </p>
          </section>
        ) : null}

        {!workspace.loading && !workspace.schemaMissing && workspace.error ? (
          <section style={cardStyle}>
            <strong style={{ display: "block", marginBottom: 8 }}>Workspace error</strong>
            <p style={{ margin: 0, color: "#475569" }}>{workspace.error}</p>
          </section>
        ) : null}

        {!workspace.loading && !workspace.schemaMissing && workspace.requiresFamilyCreation ? (
          <section style={cardStyle}>
            <h2 style={{ marginTop: 0, color: "#0f172a" }}>Create family profile first</h2>
            <p style={{ margin: 0, color: "#475569" }}>
              Portfolio items are family-scoped in the clean rebuild. Create the family profile first on My Profile.
            </p>
          </section>
        ) : null}

        {readyForPortfolio && !workspace.learners.length ? (
          <section style={cardStyle}>
            <h2 style={{ marginTop: 0, color: "#0f172a" }}>Add a learner first</h2>
            <p style={{ margin: 0, color: "#475569" }}>
              A clean learner is required before the portfolio foundation can load evidence cards.
            </p>
          </section>
        ) : null}

        {readyForPortfolio && workspace.profile && workspace.learners.length ? (
          <>
            <section style={cardStyle}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <h2 style={{ margin: 0, color: "#0f172a" }}>Portfolio filters</h2>
                  <p style={{ margin: "8px 0 0", color: "#475569" }}>
                    Portfolio cards are derived from clean evidence entries, with a simple highlight toggle.
                  </p>
                </div>
                <button
                  type="button"
                  style={buttonStyle}
                  onClick={() => void reloadItems()}
                  disabled={itemsLoading || submitting}
                >
                  {itemsLoading ? "Refreshing..." : "Refresh"}
                </button>
              </div>

              <div style={{ marginTop: 16 }}>
                <select
                  value={selectedLearnerId}
                  onChange={(event) => setSelectedLearnerId(event.target.value)}
                  style={inputStyle}
                >
                  <option value="">All family</option>
                  {learnerOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </section>

            <section style={cardStyle}>
              <h2 style={{ marginTop: 0, color: "#0f172a" }}>Evidence cards</h2>
              {itemsLoading ? (
                <p style={{ margin: 0, color: "#475569" }}>Loading portfolio cards...</p>
              ) : null}
              {itemsError ? <p style={{ margin: 0, color: "#b91c1c" }}>{itemsError}</p> : null}

              {!itemsLoading && !itemsError && !items.length ? (
                <p style={{ margin: 0, color: "#475569" }}>
                  No clean portfolio items exist yet.
                </p>
              ) : null}

              {!itemsLoading && !itemsError && items.length ? (
                <div style={{ display: "grid", gap: 12 }}>
                  {items.map((item) => {
                    const learnerLabel =
                      learnerOptions.find(
                        (option) => option.value === item.evidence.learnerId,
                      )?.label || "Unknown learner";

                    return (
                      <div
                        key={item.evidence.id}
                        style={{
                          border: item.isHighlighted
                            ? "2px solid #1d4ed8"
                            : "1px solid #e2e8f0",
                          borderRadius: 14,
                          padding: 14,
                          display: "grid",
                          gap: 8,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 12,
                            flexWrap: "wrap",
                          }}
                        >
                          <div>
                            <strong>{portfolioCardTitle(item)}</strong>
                            <div style={{ color: "#64748b", marginTop: 4 }}>
                              {formatDateLabel(item.evidence.observedOn)} - {learnerLabel}
                              {item.evidence.learningArea
                                ? ` - ${item.evidence.learningArea}`
                                : ""}
                            </div>
                          </div>
                          <button
                            type="button"
                            style={{
                              ...buttonStyle,
                              background: item.isHighlighted ? "#1d4ed8" : "#0f172a",
                              borderColor: item.isHighlighted ? "#1d4ed8" : "#0f172a",
                            }}
                            onClick={() => void handleToggleHighlight(item)}
                            disabled={submitting}
                          >
                            {item.isHighlighted ? "Remove highlight" : "Highlight"}
                          </button>
                        </div>
                        {!item.evidence.title ? (
                          <p style={{ margin: 0, color: "#334155", lineHeight: 1.6 }}>
                            {item.evidence.whatHappened}
                          </p>
                        ) : (
                          <p style={{ margin: 0, color: "#334155", lineHeight: 1.6 }}>
                            {item.evidence.whatHappened}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </section>
          </>
        ) : null}

        {message ? (
          <section style={cardStyle}>
            <p style={{ margin: 0, color: "#0f766e" }}>{message}</p>
          </section>
        ) : null}

        {actionError ? (
          <section style={cardStyle}>
            <p style={{ margin: 0, color: "#b91c1c" }}>{actionError}</p>
          </section>
        ) : null}
      </div>
    </div>
  );
}

export default function CleanPortfolioWorkspace() {
  return (
    <CleanFamilyWorkspaceProvider>
      <CleanPortfolioWorkspaceBody />
    </CleanFamilyWorkspaceProvider>
  );
}
