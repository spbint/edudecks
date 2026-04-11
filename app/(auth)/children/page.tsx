"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";
import { useFamilyWorkspace } from "@/app/components/FamilyWorkspaceProvider";
import {
  persistSettingsToLocalStorage,
  type FamilySettings,
} from "@/lib/familySettings";
import {
  persistLearnersToLocalCache,
  removeLinkedLearner,
  setActiveLearnerId,
  setDefaultLearner,
} from "@/lib/familyWorkspace";

type ChildCard = {
  id: string;
  name: string;
  yearLabel: string;
};

export default function ChildrenPage() {
  const { workspace, loading, error, reloadWorkspace, setWorkspacePatch, setActiveLearner } =
    useFamilyWorkspace();
  const [busyChildId, setBusyChildId] = useState("");
  const [status, setStatus] = useState("");

  const children = useMemo<ChildCard[]>(
    () =>
      workspace.learners.map((learner) => ({
        id: learner.id,
        name: learner.label,
        yearLabel: learner.yearLabel || "",
      })),
    [workspace.learners],
  );

  async function handleSetDefaultChild(id: string) {
    setBusyChildId(id);
    setStatus("");

    try {
      const nextSettings: FamilySettings = {
        ...workspace.profile,
        default_child_id: id,
      };

      if (!workspace.userId || id.startsWith("local-")) {
        persistSettingsToLocalStorage(nextSettings);
        setWorkspacePatch({
          profile: nextSettings,
          storageMode: "local",
          userId: workspace.userId,
        });
        setActiveLearner(id);
        setStatus("Default learner updated.");
        return;
      }

      const saved = await setDefaultLearner(workspace.profile, id);
      setWorkspacePatch({
        profile: saved,
        storageMode: "database",
        userId: workspace.userId,
      });
      setActiveLearner(id);
      setStatus("Default learner updated.");
    } catch (err) {
      console.error("Set default child failed", err);
      const nextSettings: FamilySettings = {
        ...workspace.profile,
        default_child_id: id,
      };
      persistSettingsToLocalStorage(nextSettings);
      setWorkspacePatch({
        profile: nextSettings,
        storageMode: "local",
        userId: workspace.userId,
      });
      setActiveLearnerId(id);
      setStatus("Default learner updated locally.");
    } finally {
      setBusyChildId("");
    }
  }

  async function handleDeleteChild(id: string) {
    if (
      typeof window !== "undefined" &&
      !window.confirm("Remove this child from the family workspace?")
    ) {
      return;
    }

    setBusyChildId(id);
    setStatus("");

    const nextLearners = workspace.learners.filter((learner) => learner.id !== id);
    const nextSettings: FamilySettings = {
      ...workspace.profile,
      default_child_id:
        workspace.profile.default_child_id === id
          ? nextLearners[0]?.id || null
          : workspace.profile.default_child_id,
    };

    try {
      persistLearnersToLocalCache(nextLearners);
      persistSettingsToLocalStorage(nextSettings);
      setWorkspacePatch({
        learners: nextLearners,
        profile: nextSettings,
        storageMode: !workspace.userId || id.startsWith("local-") ? "local" : workspace.storageMode,
        userId: workspace.userId,
      });

      if (!id.startsWith("local-") && workspace.userId) {
        await removeLinkedLearner(workspace.userId, id);
        await reloadWorkspace();
      }

      if (nextSettings.default_child_id) {
        setActiveLearner(nextSettings.default_child_id);
      }

      setStatus("Learner removed.");
    } catch (err) {
      console.error("Delete child failed", err);
      await reloadWorkspace();
      setStatus("Learner could not be removed.");
    } finally {
      setBusyChildId("");
    }
  }

  return (
    <FamilyTopNavShell
      title="EduDecks Family"
      subtitle="Children"
      heroTitle="Children linked to this family workspace"
      heroText="This page uses the same shared learner and default-child state as family home, profile, and settings."
      heroAsideTitle="Shared source"
      heroAsideText="Learners shown here are the same linked learners used across the authenticated family workspace."
    >
      <main style={styles.app}>
        <div style={styles.wrap}>
          <div style={styles.header}>
            <div>
              <div style={styles.eyebrow}>Family</div>
              <h1 style={styles.h1}>Children</h1>
              <div style={styles.sub}>
                Manage children in your learning workspace
              </div>
            </div>

            <Link href="/children/new" style={styles.primaryButton}>
              Add child
            </Link>
          </div>

          {status ? <div style={styles.infoCard}>{status}</div> : null}
          {error ? <div style={styles.warnCard}>{error}</div> : null}

          {loading ? (
            <div style={styles.emptyCard}>Loading linked learners...</div>
          ) : null}

          {!loading && children.length === 0 ? (
            <div style={styles.emptyCard}>
              <div style={styles.emptyTitle}>
                No children added yet
              </div>

              <div style={styles.emptyText}>
                Add a child to begin capturing evidence,
                building portfolios, and creating reports.
              </div>

              <Link href="/children/new" style={styles.primaryButton}>
                Add your first child
              </Link>
            </div>
          ) : null}

          {!loading ? (
            <div style={styles.grid}>
              {children.map((c) => {
                const isDefault = workspace.profile.default_child_id === c.id;

                return (
                  <div key={c.id} style={styles.card}>
                    <div style={styles.cardHeader}>
                      <div>
                        <div style={styles.cardTitle}>
                          {c.name}
                        </div>

                        {c.yearLabel ? (
                          <div style={styles.year}>
                            {c.yearLabel}
                          </div>
                        ) : null}
                      </div>

                      {isDefault ? (
                        <span style={styles.defaultChip}>
                          Default
                        </span>
                      ) : null}
                    </div>

                    <div style={styles.actions}>
                      <Link
                        href={`/children/${c.id}`}
                        style={styles.secondaryButton}
                      >
                        Open
                      </Link>

                      {!isDefault ? (
                        <button
                          style={styles.secondaryButton}
                          onClick={() => void handleSetDefaultChild(c.id)}
                          disabled={busyChildId === c.id}
                        >
                          {busyChildId === c.id ? "Saving..." : "Set default"}
                        </button>
                      ) : null}

                      <button
                        style={styles.dangerButton}
                        onClick={() => void handleDeleteChild(c.id)}
                        disabled={busyChildId === c.id}
                      >
                        {busyChildId === c.id ? "Working..." : "Remove"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      </main>
    </FamilyTopNavShell>
  );
}

const styles: Record<string, React.CSSProperties> = {
  app: {
    minHeight: "100vh",
    background: "#f6f8fc",
    paddingBottom: 80,
  },
  wrap: {
    maxWidth: 1100,
    margin: "0 auto",
    display: "grid",
    gap: 18,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: 800,
    textTransform: "uppercase",
    color: "#64748b",
  },
  h1: {
    margin: 0,
    fontSize: 26,
    fontWeight: 900,
    color: "#0f172a",
  },
  sub: {
    fontSize: 14,
    color: "#64748b",
  },
  grid: {
    display: "grid",
    gap: 16,
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
  },
  card: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 18,
    display: "grid",
    gap: 12,
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 900,
  },
  year: {
    fontSize: 13,
    color: "#64748b",
  },
  defaultChip: {
    background: "#ecfdf5",
    border: "1px solid #a7f3d0",
    padding: "4px 8px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 800,
    color: "#166534",
  },
  actions: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  primaryButton: {
    background: "#2563eb",
    color: "#fff",
    padding: "10px 14px",
    borderRadius: 10,
    textDecoration: "none",
    fontWeight: 700,
  },
  secondaryButton: {
    background: "#fff",
    border: "1px solid #d1d5db",
    padding: "8px 12px",
    borderRadius: 10,
    fontWeight: 700,
    cursor: "pointer",
  },
  dangerButton: {
    background: "#fff1f2",
    border: "1px solid #fecdd3",
    color: "#be123c",
    padding: "8px 12px",
    borderRadius: 10,
    fontWeight: 700,
    cursor: "pointer",
  },
  emptyCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 40,
    textAlign: "center",
    display: "grid",
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 900,
  },
  emptyText: {
    color: "#64748b",
  },
  infoCard: {
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    color: "#1d4ed8",
    borderRadius: 14,
    padding: 12,
    fontSize: 14,
  },
  warnCard: {
    background: "#fff7ed",
    border: "1px solid #fed7aa",
    color: "#9a3412",
    borderRadius: 14,
    padding: 12,
    fontSize: 14,
  },
};
