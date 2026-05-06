"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import CleanFamilyWorkspaceProvider, {
  useCleanFamilyWorkspace,
} from "@/app/components/clean/CleanFamilyWorkspaceProvider";
import { listCleanCalendarItems } from "@/lib/clean/calendar/client";
import type { CleanCalendarItem } from "@/lib/clean/calendar/types";
import { CLEAN_SCHEMA_NOT_INSTALLED_MESSAGE, normalizeCleanErrorMessage } from "@/lib/clean/family/client";

const shellStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#f8fafc",
  padding: "32px 20px 48px",
};

const wrapStyle: React.CSSProperties = {
  maxWidth: 960,
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

function getTodayDate() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function formatTodayHeading(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getLearnerLabel(firstName: string, preferredName: string | null) {
  return preferredName || firstName;
}

function CleanDayWorkspaceBody() {
  const workspace = useCleanFamilyWorkspace();
  const [selectedLearnerId, setSelectedLearnerId] = useState("");
  const [items, setItems] = useState<CleanCalendarItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsError, setItemsError] = useState<string | null>(null);

  const today = getTodayDate();

  const learnerOptions = useMemo(
    () =>
      workspace.learners.map((learner) => ({
        value: learner.id,
        label: getLearnerLabel(learner.firstName, learner.preferredName),
      })),
    [workspace.learners],
  );

  const visibleItems = useMemo(() => {
    if (!selectedLearnerId) return items;

    return items.filter(
      (item) => item.learnerId === selectedLearnerId || item.learnerId === null,
    );
  }, [items, selectedLearnerId]);

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
          fromDate: today,
          toDate: today,
          limit: 20,
        });
        setItems(nextItems);
      } catch (error) {
        setItemsError(
          normalizeCleanErrorMessage(
            error,
            "We could not load today's clean calendar items.",
          ),
        );
      } finally {
        setItemsLoading(false);
      }
    }

    void loadItems();
  }, [today, workspace.profile, workspace.requiresFamilyCreation, workspace.schemaMissing]);

  const readyForDay = !workspace.loading && !workspace.schemaMissing && !workspace.requiresFamilyCreation;

  return (
    <div style={shellStyle}>
      <div style={wrapStyle}>
        <section style={cardStyle}>
          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", color: "#64748b", textTransform: "uppercase" }}>
              Clean rebuild scaffold
            </div>
            <h1 style={{ margin: 0, fontSize: 28, color: "#0f172a" }}>My Day</h1>
            <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
              {formatTodayHeading(today)}
            </p>
          </div>
        </section>

        {workspace.loading ? <section style={cardStyle}>Loading clean family workspace...</section> : null}

        {!workspace.loading && workspace.schemaMissing ? (
          <section style={cardStyle}>
            <strong style={{ display: "block", marginBottom: 8 }}>{CLEAN_SCHEMA_NOT_INSTALLED_MESSAGE}</strong>
            <p style={{ margin: 0, color: "#475569" }}>
              The clean day scaffold only reads from the new family-only schema.
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
            <p style={{ margin: 0, color: "#475569" }}>
              Create a clean family profile first on <Link href="/my-profile">My Profile</Link>.
            </p>
          </section>
        ) : null}

        {readyForDay && !workspace.learners.length ? (
          <section style={cardStyle}>
            <p style={{ margin: 0, color: "#475569" }}>
              Add a learner first on <Link href="/my-profile">My Profile</Link> before using the clean daily view.
            </p>
          </section>
        ) : null}

        {readyForDay && workspace.learners.length ? (
          <>
            <section style={cardStyle}>
              <div style={{ display: "grid", gap: 12 }}>
                <div>
                  <h2 style={{ margin: 0, color: "#0f172a" }}>Today filter</h2>
                  <p style={{ margin: "8px 0 0", color: "#475569" }}>
                    My Day is derived directly from clean <code>calendar_items</code> rows planned for today.
                  </p>
                </div>
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
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <div>
                  <h2 style={{ margin: 0, color: "#0f172a" }}>Today plan</h2>
                  <p style={{ margin: "8px 0 0", color: "#475569" }}>
                    Use the clean calendar scaffold to add or adjust items for today.
                  </p>
                </div>
                <Link href="/clean-my-calendar" style={{ color: "#1d4ed8", fontWeight: 700 }}>
                  Open clean calendar
                </Link>
              </div>

              {itemsLoading ? <p style={{ marginTop: 16, marginBottom: 0, color: "#475569" }}>Loading items for today...</p> : null}
              {itemsError ? <p style={{ marginTop: 16, marginBottom: 0, color: "#b91c1c" }}>{itemsError}</p> : null}

              {!itemsLoading && !itemsError && !visibleItems.length ? (
                <p style={{ marginTop: 16, marginBottom: 0, color: "#475569" }}>
                  Nothing planned for today yet.
                </p>
              ) : null}

              {!itemsLoading && !itemsError && visibleItems.length ? (
                <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
                  {visibleItems.map((item) => {
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
                        <div>
                          <strong>{item.title}</strong>
                        </div>
                        <div style={{ color: "#64748b" }}>{learnerLabel}</div>
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
      </div>
    </div>
  );
}

export default function CleanDayWorkspace() {
  return (
    <CleanFamilyWorkspaceProvider>
      <CleanDayWorkspaceBody />
    </CleanFamilyWorkspaceProvider>
  );
}
