"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import CleanFamilyWorkspaceProvider, {
  useCleanFamilyWorkspace,
} from "@/app/components/clean/CleanFamilyWorkspaceProvider";
import {
  createCleanCalendarItem,
  deleteCleanCalendarItem,
  listCleanCalendarItems,
  updateCleanCalendarItem,
} from "@/lib/clean/calendar/client";
import type { CleanCalendarItem } from "@/lib/clean/calendar/types";
import { CLEAN_SCHEMA_NOT_INSTALLED_MESSAGE, normalizeCleanErrorMessage } from "@/lib/clean/family/client";

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

const textAreaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: 100,
  resize: "vertical",
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

function getTodayDate() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
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

function getLearnerLabel(firstName: string, preferredName: string | null) {
  return preferredName || firstName;
}

function CleanCalendarWorkspaceBody() {
  const workspace = useCleanFamilyWorkspace();
  const [items, setItems] = useState<CleanCalendarItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [plannedDate, setPlannedDate] = useState(getTodayDate);
  const [learnerId, setLearnerId] = useState("");
  const [description, setDescription] = useState("");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
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

  useEffect(() => {
    async function loadItems() {
      if (!workspace.profile || workspace.schemaMissing || workspace.requiresFamilyCreation) {
        setItems([]);
        return;
      }

      setItemsLoading(true);
      setItemsError(null);
      try {
        const nextItems = await listCleanCalendarItems(workspace.profile.id, {
          limit: 50,
        });
        setItems(nextItems);
      } catch (error) {
        setItemsError(
          normalizeCleanErrorMessage(
            error,
            "We could not load clean calendar items just now.",
          ),
        );
      } finally {
        setItemsLoading(false);
      }
    }

    void loadItems();
  }, [workspace.profile, workspace.requiresFamilyCreation, workspace.schemaMissing]);

  function resetForm() {
    setEditingItemId(null);
    setTitle("");
    setPlannedDate(getTodayDate());
    setLearnerId("");
    setDescription("");
  }

  async function reloadItems() {
    if (!workspace.profile) return;

    setItemsLoading(true);
    setItemsError(null);
    try {
      const nextItems = await listCleanCalendarItems(workspace.profile.id, {
        limit: 50,
      });
      setItems(nextItems);
    } catch (error) {
      setItemsError(
        normalizeCleanErrorMessage(
          error,
          "We could not refresh clean calendar items.",
        ),
      );
    } finally {
      setItemsLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workspace.profile) return;

    setSubmitting(true);
    setMessage(null);
    setActionError(null);

    try {
      if (editingItemId) {
        await updateCleanCalendarItem(workspace.profile.id, editingItemId, {
          title,
          plannedDate,
          learnerId: learnerId || null,
          description: description || null,
        });
        setMessage("Clean calendar item updated.");
      } else {
        await createCleanCalendarItem(workspace.profile.id, {
          title,
          plannedDate,
          learnerId: learnerId || null,
          description: description || null,
        });
        setMessage("Clean calendar item created.");
      }

      resetForm();
      await reloadItems();
    } catch (error) {
      setActionError(
        normalizeCleanErrorMessage(
          error,
          "We could not save the clean calendar item.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(item: CleanCalendarItem) {
    if (!workspace.profile) return;

    setSubmitting(true);
    setMessage(null);
    setActionError(null);

    try {
      await deleteCleanCalendarItem(workspace.profile.id, item.id);
      setMessage("Clean calendar item deleted.");
      if (editingItemId === item.id) {
        resetForm();
      }
      await reloadItems();
    } catch (error) {
      setActionError(
        normalizeCleanErrorMessage(
          error,
          "We could not delete the clean calendar item.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleEdit(item: CleanCalendarItem) {
    setEditingItemId(item.id);
    setTitle(item.title);
    setPlannedDate(item.plannedDate);
    setLearnerId(item.learnerId || "");
    setDescription(item.description || "");
    setMessage(null);
    setActionError(null);
  }

  const readyForCalendar = !workspace.loading && !workspace.schemaMissing && !workspace.requiresFamilyCreation;

  return (
    <div style={shellStyle}>
      <div style={wrapStyle}>
        <section style={cardStyle}>
          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", color: "#64748b", textTransform: "uppercase" }}>
              Clean rebuild scaffold
            </div>
            <h1 style={{ margin: 0, fontSize: 28, color: "#0f172a" }}>My Calendar</h1>
            <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
              This preview route uses only the clean <code>calendar_items</code> table and explicit save actions.
            </p>
          </div>
        </section>

        {workspace.loading ? <section style={cardStyle}>Loading clean family workspace...</section> : null}

        {!workspace.loading && workspace.schemaMissing ? (
          <section style={cardStyle}>
            <strong style={{ display: "block", marginBottom: 8 }}>{CLEAN_SCHEMA_NOT_INSTALLED_MESSAGE}</strong>
            <p style={{ margin: 0, color: "#475569" }}>
              The clean calendar scaffold will not fall back to legacy planning tables.
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
              Calendar items are family-scoped in the clean rebuild. Create the family profile first on{" "}
              <Link href="/my-profile">My Profile</Link>.
            </p>
          </section>
        ) : null}

        {readyForCalendar && !workspace.learners.length ? (
          <section style={cardStyle}>
            <h2 style={{ marginTop: 0, color: "#0f172a" }}>Add a learner first</h2>
            <p style={{ margin: 0, color: "#475569" }}>
              The calendar can hold family-wide items, but this scaffold expects at least one learner before daily planning starts.
              Add a learner on <Link href="/my-profile">My Profile</Link>.
            </p>
          </section>
        ) : null}

        {readyForCalendar && workspace.profile && workspace.learners.length ? (
          <>
            <section style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <div>
                  <h2 style={{ margin: 0, color: "#0f172a" }}>Add or edit a calendar item</h2>
                  <p style={{ margin: "8px 0 0", color: "#475569" }}>
                    Learners are loaded from the clean workspace only.
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
              <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12, marginTop: 16 }}>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="What is planned?"
                  style={inputStyle}
                />
                <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                  <input
                    type="date"
                    value={plannedDate}
                    onChange={(event) => setPlannedDate(event.target.value)}
                    style={inputStyle}
                  />
                  <select
                    value={learnerId}
                    onChange={(event) => setLearnerId(event.target.value)}
                    style={inputStyle}
                  >
                    <option value="">Family / all learners</option>
                    {learnerOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Optional planning notes"
                  style={textAreaStyle}
                />
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button type="submit" style={buttonStyle} disabled={submitting}>
                    {submitting ? "Saving..." : editingItemId ? "Save changes" : "Add calendar item"}
                  </button>
                  {editingItemId ? (
                    <button
                      type="button"
                      style={{ ...buttonStyle, background: "#ffffff", color: "#0f172a" }}
                      onClick={resetForm}
                      disabled={submitting}
                    >
                      Cancel edit
                    </button>
                  ) : null}
                </div>
              </form>
            </section>

            <section style={cardStyle}>
              <h2 style={{ marginTop: 0, color: "#0f172a" }}>Planned items</h2>
              <p style={{ marginTop: 0, color: "#475569" }}>
                This simple list is the first clean planning layer. My Day reads from the same table.
              </p>

              {itemsLoading ? <p style={{ margin: 0, color: "#475569" }}>Loading calendar items...</p> : null}
              {itemsError ? <p style={{ margin: 0, color: "#b91c1c" }}>{itemsError}</p> : null}

              {!itemsLoading && !itemsError && !items.length ? (
                <p style={{ margin: 0, color: "#475569" }}>
                  No clean calendar items exist yet. Add one above to start the planning layer.
                </p>
              ) : null}

              {!itemsLoading && !itemsError && items.length ? (
                <div style={{ display: "grid", gap: 12 }}>
                  {items.map((item) => {
                    const learnerLabel =
                      learnerOptions.find((option) => option.value === item.learnerId)?.label ||
                      "Family / all learners";

                    return (
                      <div
                        key={item.id}
                        style={{
                          border: "1px solid #e2e8f0",
                          borderRadius: 14,
                          padding: 14,
                          display: "grid",
                          gap: 8,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                          <div>
                            <strong>{item.title}</strong>
                            <div style={{ color: "#64748b", marginTop: 4 }}>
                              {formatDateLabel(item.plannedDate)} - {learnerLabel}
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <button
                              type="button"
                              style={{ ...buttonStyle, background: "#ffffff", color: "#0f172a" }}
                              onClick={() => handleEdit(item)}
                              disabled={submitting}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              style={{ ...buttonStyle, background: "#b91c1c", borderColor: "#b91c1c" }}
                              onClick={() => void handleDelete(item)}
                              disabled={submitting}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        {item.description ? (
                          <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>{item.description}</p>
                        ) : null}
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

export default function CleanCalendarWorkspace() {
  return (
    <CleanFamilyWorkspaceProvider>
      <CleanCalendarWorkspaceBody />
    </CleanFamilyWorkspaceProvider>
  );
}
