"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import CurriculumSummary from "@/app/components/CurriculumSummary";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";
import { useFamilyWorkspace } from "@/app/components/FamilyWorkspaceProvider";
import {
  createLinkedLearner,
  persistLearnersToLocalCache,
  removeLinkedLearner,
  setDefaultLearner,
  updateLinkedLearner,
  type FamilyLearner,
} from "@/lib/familyWorkspace";
import {
  persistSettingsToLocalStorage,
  type FamilySettings,
} from "@/lib/familySettings";
import { ReportDraftStatus } from "@/lib/reportDrafts";
import { hasSupabaseEnv, supabase } from "@/lib/supabaseClient";

type EvidenceRow = {
  id: string;
  title?: string | null;
  created_at?: string | null;
};

type ReportRow = {
  id: string;
  title?: string | null;
  status?: ReportDraftStatus | null;
  updated_at?: string | null;
};

type EditDraft = {
  name: string;
  year: string;
};

function safe(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function yearInputValue(learner: FamilyLearner) {
  return learner.year_level != null ? String(learner.year_level) : "";
}

function learnerName(learner: FamilyLearner) {
  return safe(learner.label) || "Unnamed learner";
}

function statusLabel(status?: string | null) {
  const value = safe(status).toLowerCase();
  if (value === "final") return "Final";
  if (value === "submitted") return "Submitted";
  if (value === "archived") return "Archived";
  return "Draft";
}

export default function FamilyProfilePage() {
  const {
    workspace,
    activeLearnerId,
    loading,
    error: workspaceError,
    reloadWorkspace,
    setWorkspacePatch,
    setActiveLearner,
  } = useFamilyWorkspace();

  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busyChildId, setBusyChildId] = useState("");
  const [adding, setAdding] = useState(false);
  const [addName, setAddName] = useState("");
  const [addYear, setAddYear] = useState("");
  const [editingChildId, setEditingChildId] = useState("");
  const [editDrafts, setEditDrafts] = useState<Record<string, EditDraft>>({});
  const [recentEvidence, setRecentEvidence] = useState<EvidenceRow[]>([]);
  const [recentReports, setRecentReports] = useState<ReportRow[]>([]);

  const children = workspace.learners;
  const profile = workspace.profile as FamilySettings;

  useEffect(() => {
    setError(workspaceError);
  }, [workspaceError]);

  useEffect(() => {
    let mounted = true;

    async function hydrateReadModels() {
      if (!workspace.userId || !hasSupabaseEnv) {
        if (!mounted) return;
        setRecentEvidence([]);
        setRecentReports([]);
        return;
      }

      const learnerIds = children
        .map((child) => child.id)
        .filter((id) => !id.startsWith("local-"));

      if (!learnerIds.length) {
        if (!mounted) return;
        setRecentEvidence([]);
        setRecentReports([]);
        return;
      }

      try {
        const [evidenceRes, reportRes] = await Promise.all([
          supabase
            .from("evidence_entries")
            .select("id,title,created_at")
            .in("student_id", learnerIds)
            .eq("is_deleted", false)
            .order("created_at", { ascending: false })
            .limit(4),
          supabase
            .from("report_drafts")
            .select("id,title,status,updated_at")
            .eq("user_id", workspace.userId)
            .order("updated_at", { ascending: false })
            .limit(4),
        ]);

        if (!mounted) return;

        if (!evidenceRes.error) {
          setRecentEvidence((evidenceRes.data ?? []) as EvidenceRow[]);
        }

        if (!reportRes.error) {
          setRecentReports((reportRes.data ?? []) as ReportRow[]);
        }
      } catch (readError) {
        console.error("profile read model hydrate failed", readError);
      }
    }

    void hydrateReadModels();

    return () => {
      mounted = false;
    };
  }, [children, workspace.userId]);

  useEffect(() => {
    setEditDrafts((current) => {
      const next: Record<string, EditDraft> = {};

      for (const child of children) {
        next[child.id] = current[child.id] ?? {
          name: learnerName(child),
          year: yearInputValue(child),
        };
      }

      return next;
    });
  }, [children]);

  const activeLearner = useMemo(
    () => children.find((child) => child.id === activeLearnerId) ?? null,
    [children, activeLearnerId],
  );

  async function handleSetDefaultChild(childId: string) {
    setBusyChildId(childId);
    setStatus("");
    setError("");

    try {
      if (!workspace.userId || childId.startsWith("local-")) {
        const nextProfile = { ...profile, default_child_id: childId };
        persistSettingsToLocalStorage(nextProfile);
        setWorkspacePatch({ profile: nextProfile });
        setActiveLearner(childId);
        setStatus("Default learner updated for this family workspace.");
        return;
      }

      const saved = await setDefaultLearner(profile, childId);
      setWorkspacePatch({ profile: saved });
      setActiveLearner(childId);
      setStatus("Default learner updated for this family workspace.");
    } catch (saveError) {
      console.error("profile set default learner failed", saveError);
      await reloadWorkspace();
      setError("We could not update the default learner right now.");
    } finally {
      setBusyChildId("");
    }
  }

  async function handleAddLearner() {
    const learnerNameInput = safe(addName);
    if (!learnerNameInput) {
      setError("Enter a learner name before saving.");
      return;
    }

    setAdding(true);
    setStatus("");
    setError("");

    try {
      if (!workspace.userId || !hasSupabaseEnv) {
        const localLearner: FamilyLearner = {
          id: `local-${Date.now()}`,
          label: learnerNameInput,
          yearLabel: safe(addYear) ? `Year ${safe(addYear)}` : "",
          year_level: safe(addYear) ? Number(safe(addYear)) : null,
          connectedAt: new Date().toISOString(),
        };
        const nextLearners = [...children, localLearner];
        persistLearnersToLocalCache(nextLearners);
        const nextProfile =
          profile.default_child_id || nextLearners.length > 1
            ? profile
            : { ...profile, default_child_id: localLearner.id };
        persistSettingsToLocalStorage(nextProfile);
        setWorkspacePatch({ learners: nextLearners, profile: nextProfile, storageMode: "local" });
        setActiveLearner(localLearner.id);
      } else {
        const studentId = await createLinkedLearner(
          workspace.userId,
          learnerNameInput,
          safe(addYear),
        );

        if (!profile.default_child_id) {
          const saved = await setDefaultLearner(profile, studentId);
          setWorkspacePatch({ profile: saved });
        }

        await reloadWorkspace();
        setActiveLearner(studentId);
      }

      setAddName("");
      setAddYear("");
      setStatus("Learner added to the family workspace.");
    } catch (saveError) {
      console.error("profile add learner failed", saveError);
      setError("We could not add that learner right now.");
    } finally {
      setAdding(false);
    }
  }

  async function handleSaveLearner(child: FamilyLearner) {
    const draft = editDrafts[child.id];
    const name = safe(draft?.name);
    const year = safe(draft?.year);

    if (!name) {
      setError("Learner name cannot be empty.");
      return;
    }

    setBusyChildId(child.id);
    setStatus("");
    setError("");

    try {
      if (!workspace.userId || child.id.startsWith("local-")) {
        const nextLearners = children.map((item) =>
          item.id === child.id
            ? {
                ...item,
                label: name,
                year_level: year ? Number(year) : null,
                yearLabel: year ? `Year ${year}` : "",
              }
            : item,
        );
        persistLearnersToLocalCache(nextLearners);
        setWorkspacePatch({ learners: nextLearners, storageMode: "local" });
      } else {
        await updateLinkedLearner(workspace.userId, child.id, name, year);
        await reloadWorkspace();
      }

      setEditingChildId("");
      setStatus("Learner details updated.");
    } catch (saveError) {
      console.error("profile update learner failed", saveError);
      setError("We could not update that learner right now.");
    } finally {
      setBusyChildId("");
    }
  }

  async function handleRemoveChild(child: FamilyLearner) {
    setBusyChildId(child.id);
    setStatus("");
    setError("");

    try {
      const nextDefaultId =
        profile.default_child_id === child.id
          ? children.find((item) => item.id !== child.id)?.id ?? null
          : null;

      if (!workspace.userId || child.id.startsWith("local-")) {
        const nextLearners = children.filter((item) => item.id !== child.id);
        persistLearnersToLocalCache(nextLearners);
        const nextProfile =
          profile.default_child_id === child.id
            ? { ...profile, default_child_id: nextLearners[0]?.id ?? null }
            : profile;
        persistSettingsToLocalStorage(nextProfile);
        setWorkspacePatch({ learners: nextLearners, profile: nextProfile, storageMode: "local" });
        if (activeLearnerId === child.id) {
          setActiveLearner(nextLearners[0]?.id ?? null);
        }
      } else {
        await removeLinkedLearner(workspace.userId, child.id);
        if (nextDefaultId !== null || profile.default_child_id === child.id) {
          const saved = await setDefaultLearner(profile, nextDefaultId);
          setWorkspacePatch({ profile: saved });
        }
        await reloadWorkspace();
      }

      setStatus("Learner removed from the family workspace.");
    } catch (removeError) {
      console.error("profile remove learner failed", removeError);
      setError("We could not remove that learner right now.");
    } finally {
      setBusyChildId("");
    }
  }

  return (
    <FamilyTopNavShell
      title="EduDecks Family"
      subtitle="Profile"
      heroTitle="Keep learner details tidy and connected"
      heroText="Manage learners, confirm the default child for the wider workflow, and keep a read-only view of the current family setup."
      heroAsideTitle="Family workspace"
      heroAsideText="Profile now consumes the shared family workspace. Curriculum setup stays in settings."
    >
      <div style={S.page}>
        <section id="manage-family" style={S.section}>
          <div style={S.sectionHeader}>
            <div>
              <div style={S.eyebrow}>Family profile</div>
              <h2 style={S.sectionTitle}>Manage learners</h2>
            </div>
            <Link href="/children/new" style={S.secondaryLink}>
              Open full child form
            </Link>
          </div>

          {status ? <div style={S.successBanner}>{status}</div> : null}
          {error ? <div style={S.errorBanner}>{error}</div> : null}

          <div style={S.summaryGrid}>
            <div style={S.summaryCard}>
              <div style={S.summaryLabel}>Family name</div>
              <div style={S.summaryValue}>{profile.family_display_name || "Your family"}</div>
            </div>
            <div style={S.summaryCard}>
              <div style={S.summaryLabel}>Default learner</div>
              <div style={S.summaryValue}>{activeLearner?.label || "Not set yet"}</div>
            </div>
            <div style={S.summaryCard}>
              <div style={S.summaryLabel}>Linked learners</div>
              <div style={S.summaryValue}>{children.length}</div>
            </div>
          </div>

          <div style={S.addCard}>
            <div style={S.addHeader}>
              <div style={S.cardTitle}>Add learner</div>
              <div style={S.helperText}>This writes through the shared family workspace path.</div>
            </div>
            <div style={S.formRow}>
              <input value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="Learner name" style={S.input} />
              <input value={addYear} onChange={(e) => setAddYear(e.target.value)} placeholder="Year" inputMode="numeric" style={S.inputSmall} />
              <button type="button" onClick={handleAddLearner} disabled={adding || loading} style={adding || loading ? S.buttonDisabled : S.primaryButton}>
                {adding ? "Saving..." : "Add learner"}
              </button>
            </div>
          </div>

          <div style={S.learnerList}>
            {children.map((child) => {
              const draft = editDrafts[child.id] ?? { name: learnerName(child), year: yearInputValue(child) };
              const isEditing = editingChildId === child.id;
              const isBusy = busyChildId === child.id;
              const isDefault = profile.default_child_id === child.id;

              return (
                <article key={child.id} style={S.learnerCard}>
                  <div style={S.learnerHeader}>
                    <div>
                      <div style={S.cardTitle}>{learnerName(child)}</div>
                      <div style={S.helperText}>{child.yearLabel || "Year level not set"}</div>
                    </div>
                    {isDefault ? <span style={S.chip}>Default learner</span> : null}
                  </div>

                  {isEditing ? (
                    <div style={S.formRow}>
                      <input
                        value={draft.name}
                        onChange={(e) => setEditDrafts((current) => ({ ...current, [child.id]: { ...draft, name: e.target.value } }))}
                        style={S.input}
                      />
                      <input
                        value={draft.year}
                        onChange={(e) => setEditDrafts((current) => ({ ...current, [child.id]: { ...draft, year: e.target.value } }))}
                        inputMode="numeric"
                        style={S.inputSmall}
                      />
                    </div>
                  ) : null}

                  <div style={S.actionRow}>
                    {isEditing ? (
                      <>
                        <button type="button" onClick={() => void handleSaveLearner(child)} disabled={isBusy} style={isBusy ? S.buttonDisabled : S.primaryButton}>
                          {isBusy ? "Saving..." : "Save"}
                        </button>
                        <button type="button" onClick={() => setEditingChildId("")} style={S.secondaryButton}>
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button type="button" onClick={() => void handleSetDefaultChild(child.id)} disabled={isBusy || isDefault} style={isBusy || isDefault ? S.buttonDisabled : S.primaryButton}>
                          {isDefault ? "Current default" : "Make default"}
                        </button>
                        <button type="button" onClick={() => setEditingChildId(child.id)} style={S.secondaryButton}>
                          Edit
                        </button>
                        <Link href={`/children/${child.id}`} style={S.secondaryLink}>
                          Open learner
                        </Link>
                        <button type="button" onClick={() => void handleRemoveChild(child)} disabled={isBusy} style={S.dangerButton}>
                          Remove
                        </button>
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section style={S.section}>
          <CurriculumSummary
            title="Curriculum setup lives in settings"
            description="This page now shows learner management only. Open settings to change the family framework and level."
            helperText="Profile no longer owns curriculum edits, which keeps the family workflow on one settings path."
            linkLabel="Open curriculum settings"
            linkHref="/settings#curriculum"
          />
        </section>

        <section style={S.section}>
          <div style={S.sectionHeader}>
            <div>
              <div style={S.eyebrow}>Read-only activity</div>
              <h2 style={S.sectionTitle}>Recent family activity</h2>
            </div>
          </div>
          <div style={S.activityGrid}>
            <div style={S.activityCard}>
              <div style={S.cardTitle}>Recent captures</div>
              {recentEvidence.length ? recentEvidence.map((row) => (
                <div key={row.id} style={S.activityRow}>{safe(row.title) || "Untitled capture"}</div>
              )) : <div style={S.helperText}>No recent evidence yet.</div>}
            </div>
            <div style={S.activityCard}>
              <div style={S.cardTitle}>Recent reports</div>
              {recentReports.length ? recentReports.map((row) => (
                <div key={row.id} style={S.activityRow}>
                  {(safe(row.title) || "Untitled report")} · {statusLabel(row.status)}
                </div>
              )) : <div style={S.helperText}>No recent report drafts yet.</div>}
            </div>
          </div>
        </section>
      </div>
    </FamilyTopNavShell>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: { display: "grid", gap: 18, paddingBottom: 56 },
  section: { display: "grid", gap: 14 },
  sectionHeader: { display: "flex", justifyContent: "space-between", gap: 16, alignItems: "end", flexWrap: "wrap" },
  eyebrow: { fontSize: 11, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", color: "#64748b" },
  sectionTitle: { margin: 0, fontSize: 22, fontWeight: 900, color: "#0f172a" },
  summaryGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 },
  summaryCard: { border: "1px solid #e5e7eb", borderRadius: 18, background: "#ffffff", padding: 16, display: "grid", gap: 8 },
  summaryLabel: { fontSize: 12, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.6 },
  summaryValue: { fontSize: 16, fontWeight: 900, color: "#0f172a" },
  addCard: { border: "1px solid #e5e7eb", borderRadius: 18, background: "#ffffff", padding: 16, display: "grid", gap: 12 },
  addHeader: { display: "grid", gap: 4 },
  learnerList: { display: "grid", gap: 12 },
  learnerCard: { border: "1px solid #e5e7eb", borderRadius: 18, background: "#ffffff", padding: 16, display: "grid", gap: 12 },
  learnerHeader: { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" },
  cardTitle: { fontSize: 16, fontWeight: 900, color: "#0f172a" },
  helperText: { fontSize: 13, lineHeight: 1.5, color: "#64748b" },
  formRow: { display: "flex", gap: 10, flexWrap: "wrap" },
  actionRow: { display: "flex", gap: 10, flexWrap: "wrap" },
  input: { flex: "1 1 220px", minWidth: 0, borderRadius: 12, border: "1px solid #cbd5e1", padding: "11px 12px", fontSize: 14 },
  inputSmall: { width: 110, borderRadius: 12, border: "1px solid #cbd5e1", padding: "11px 12px", fontSize: 14 },
  primaryButton: { border: "none", borderRadius: 12, background: "#0f172a", color: "#ffffff", padding: "11px 14px", fontWeight: 800, fontSize: 14, cursor: "pointer" },
  secondaryButton: { border: "1px solid #cbd5e1", borderRadius: 12, background: "#ffffff", color: "#0f172a", padding: "11px 14px", fontWeight: 800, fontSize: 14, cursor: "pointer" },
  buttonDisabled: { border: "1px solid #e5e7eb", borderRadius: 12, background: "#f8fafc", color: "#94a3b8", padding: "11px 14px", fontWeight: 800, fontSize: 14, cursor: "not-allowed" },
  dangerButton: { border: "1px solid #fecaca", borderRadius: 12, background: "#fff1f2", color: "#b91c1c", padding: "11px 14px", fontWeight: 800, fontSize: 14, cursor: "pointer" },
  secondaryLink: { display: "inline-flex", alignItems: "center", textDecoration: "none", borderRadius: 12, border: "1px solid #cbd5e1", background: "#ffffff", color: "#0f172a", padding: "11px 14px", fontWeight: 800, fontSize: 14 },
  successBanner: { border: "1px solid #bbf7d0", borderRadius: 16, background: "#f0fdf4", color: "#166534", padding: "12px 14px", fontSize: 14 },
  errorBanner: { border: "1px solid #fdba74", borderRadius: 16, background: "#fff7ed", color: "#9a3412", padding: "12px 14px", fontSize: 14 },
  chip: { display: "inline-flex", alignItems: "center", borderRadius: 999, background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", padding: "6px 10px", fontSize: 12, fontWeight: 800 },
  activityGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 12 },
  activityCard: { border: "1px solid #e5e7eb", borderRadius: 18, background: "#ffffff", padding: 16, display: "grid", gap: 10 },
  activityRow: { fontSize: 14, lineHeight: 1.55, color: "#334155" },
};
