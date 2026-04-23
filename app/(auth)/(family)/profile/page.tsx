"use client";

import React, { useEffect, useMemo, useState } from "react";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";
import { useFamilyWorkspace } from "@/app/components/FamilyWorkspaceProvider";
import { createFamilyEvidenceEntry } from "@/lib/familyEvidence";
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
import { hasSupabaseEnv, supabase } from "@/lib/supabaseClient";

type EvidenceRow = {
  id: string;
  student_id?: string | null;
  title?: string | null;
  summary?: string | null;
  created_at?: string | null;
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

function formatTimestamp(value: string | null | undefined) {
  const clean = safe(value);
  if (!clean) return "Just now";

  const parsed = new Date(clean);
  if (Number.isNaN(parsed.getTime())) return clean;

  return parsed.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function FamilyProfilePage() {
  const {
    workspace,
    activeLearnerId,
    error: workspaceError,
    reloadWorkspace,
    setWorkspacePatch,
    setActiveLearner,
  } = useFamilyWorkspace();

  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [busyChildId, setBusyChildId] = useState("");
  const [adding, setAdding] = useState(false);
  const [showCaptureForm, setShowCaptureForm] = useState(false);
  const [captureTitle, setCaptureTitle] = useState("");
  const [captureDescription, setCaptureDescription] = useState("");
  const [savingCapture, setSavingCapture] = useState(false);
  const [addName, setAddName] = useState("");
  const [addYear, setAddYear] = useState("");
  const [editingChildId, setEditingChildId] = useState("");
  const [editDrafts, setEditDrafts] = useState<Record<string, EditDraft>>({});
  const [recentEvidence, setRecentEvidence] = useState<EvidenceRow[]>([]);

  const children = workspace.learners;
  const profile = workspace.profile as FamilySettings;

  useEffect(() => {
    setError(workspaceError);
    if (workspaceError) {
      setWarning("");
    }
  }, [workspaceError]);

  useEffect(() => {
    let mounted = true;

    async function hydrateReadModels() {
      if (!workspace.userId || !hasSupabaseEnv) {
        if (!mounted) return;
        setRecentEvidence([]);
        return;
      }

      const learnerIds = children
        .map((child) => child.id)
        .filter((id) => !id.startsWith("local-"));

      if (!learnerIds.length) {
        if (!mounted) return;
        setRecentEvidence([]);
        return;
      }

      try {
        const evidenceRes = await supabase
          .from("evidence_entries")
          .select("id,student_id,title,summary,created_at")
          .in("student_id", learnerIds)
          .eq("is_deleted", false)
          .order("created_at", { ascending: false })
          .limit(6);

        if (!mounted) return;

        if (!evidenceRes.error) {
          setRecentEvidence((evidenceRes.data ?? []) as EvidenceRow[]);
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

  const learnerNameById = useMemo(
    () => new Map(children.map((child) => [child.id, learnerName(child)])),
    [children],
  );

  const currentLearnerId = activeLearnerId || profile.default_child_id || null;

  async function handleSwitchLearner(childId: string) {
    setBusyChildId(childId);
    setStatus("");
    setError("");
    setWarning("");

    try {
      if (!workspace.userId || childId.startsWith("local-")) {
        const nextProfile = { ...profile, default_child_id: childId };
        persistSettingsToLocalStorage(nextProfile);
        setWorkspacePatch({ profile: nextProfile });
        setActiveLearner(childId);
        setStatus("Currently viewing was updated for this family workspace.");
        return;
      }

      const saved = await setDefaultLearner(profile, childId);
      setWorkspacePatch({ profile: saved });
      setActiveLearner(childId);
      setStatus("Currently viewing was updated for this family workspace.");
    } catch (saveError) {
      console.error("profile set active learner failed", saveError);
      await reloadWorkspace();
      setError("We could not update the active learner right now.");
    } finally {
      setBusyChildId("");
    }
  }

  async function handleAddLearner() {
    const learnerNameInput = safe(addName);
    if (!learnerNameInput) {
      setError("Enter a learner name before saving.");
      setWarning("");
      return;
    }

    setAdding(true);
    setStatus("");
    setError("");
    setWarning("");

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
        const createdLearner = await createLinkedLearner(
          workspace.userId,
          learnerNameInput,
          safe(addYear),
        );
        const nextLearners = [...children, createdLearner];
        const shouldAssignDefault = !safe(profile.default_child_id) && children.length === 0;
        let nextProfile = shouldAssignDefault
          ? { ...profile, default_child_id: createdLearner.id }
          : profile;
        let defaultWarning = "";

        setWorkspacePatch({
          learners: nextLearners,
          profile: nextProfile,
          storageMode: "database",
        });
        setActiveLearner(createdLearner.id);

        if (shouldAssignDefault) {
          try {
            const saved = await setDefaultLearner(profile, createdLearner.id);
            nextProfile = saved;
            setWorkspacePatch({ profile: saved });
          } catch (defaultError) {
            console.error("profile set active learner after add failed", defaultError);
            defaultWarning =
              "We added the learner, but couldn't update the active learner just yet.";
          }
        }

        await reloadWorkspace();
        setWorkspacePatch({
          learners: nextLearners,
          profile: nextProfile,
          storageMode: "database",
        });
        setActiveLearner(createdLearner.id);

        setWarning(defaultWarning);
      }

      setAddName("");
      setAddYear("");
      setStatus("This learner was added.");
    } catch (saveError) {
      console.error("profile add learner failed", saveError);
      setError(
        safe((saveError as { message?: unknown })?.message) ||
          "We couldn't add this learner yet. Please try again.",
      );
    } finally {
      setAdding(false);
    }
  }

  async function handleCaptureLearning() {
    const title = safe(captureTitle);
    const description = safe(captureDescription);

    if (!activeLearner) {
      setError("Choose who you are currently viewing before capturing learning.");
      setWarning("");
      return;
    }

    if (!title) {
      setError("Add a title before saving this learning moment.");
      setWarning("");
      return;
    }

    if (!workspace.userId || !hasSupabaseEnv) {
      setError("Family evidence capture needs a signed-in family workspace.");
      setWarning("");
      return;
    }

    setSavingCapture(true);
    setStatus("");
    setError("");
    setWarning("");

    try {
      console.log("CAPTURE_SUBMIT", {
        learnerId: currentLearnerId,
        title,
        description,
      });

      const created = await createFamilyEvidenceEntry({
        studentId: activeLearner.id,
        userId: workspace.userId,
        title,
        summary: description,
        note: description,
        learningArea: "General",
        evidenceType: "note",
        visibility: profile.evidence_privacy_default,
      });

      setRecentEvidence((current) =>
        [
          {
            id: created.id,
            student_id: activeLearner.id,
            title,
            summary: description,
            created_at: new Date().toISOString(),
          },
          ...current,
        ].slice(0, 6),
      );
      setCaptureTitle("");
      setCaptureDescription("");
      setShowCaptureForm(false);
      setStatus("Learning captured and added to Recent learning.");
    } catch (saveError) {
      console.error("profile capture learning failed", saveError);
      setError(
        safe((saveError as { message?: unknown })?.message) ||
          "We couldn't save this learning moment yet. Please try again.",
      );
    } finally {
      setSavingCapture(false);
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
    setWarning("");

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
    setWarning("");

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
      heroText="Manage learners, confirm the active learner for the wider workflow, and keep a read-only view of the current family setup."
      heroAsideTitle="Family workspace"
      heroAsideText="Profile now consumes the shared family workspace. Curriculum setup stays in settings."
    >
      <div style={S.page}>
        <section id="manage-family" style={S.section}>
          <div style={S.sectionHeader}>
            <div>
              <div style={S.eyebrow}>Family profile</div>
              <h2 style={S.sectionTitle}>Manage learners</h2>
              <div style={S.helperText}>
                Keep learner details, switching context, and quick learning capture in one family workspace.
              </div>
            </div>
          </div>

          {status ? <div style={S.successBanner}>{status}</div> : null}
          {warning ? <div style={S.warningBanner}>{warning}</div> : null}
          {error ? <div style={S.errorBanner}>{error}</div> : null}

          <div style={S.summaryGrid}>
            <div style={S.summaryCard}>
              <div style={S.summaryLabel}>Family name</div>
              <div style={S.summaryValue}>{profile.family_display_name || "Your family"}</div>
            </div>
            <div style={S.summaryCard}>
              <div style={S.summaryLabel}>Currently viewing</div>
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
              <div style={S.helperText}>
                This writes through the shared family workspace path. Leave year blank or enter a whole number.
              </div>
            </div>
            <div style={S.formRow}>
              <input
                value={addName}
                onChange={(e) => {
                  setAddName(e.target.value);
                  if (error) setError("");
                  if (warning) setWarning("");
                }}
                placeholder="Learner name"
                style={S.input}
              />
              <input
                value={addYear}
                onChange={(e) => {
                  setAddYear(e.target.value);
                  if (error) setError("");
                  if (warning) setWarning("");
                }}
                placeholder="Year"
                inputMode="numeric"
                aria-label="Year level"
                style={S.inputSmall}
              />
              <button type="button" onClick={handleAddLearner} disabled={adding} style={adding ? S.buttonDisabled : S.primaryButton}>
                {adding ? "Saving..." : "Add learner"}
              </button>
            </div>
          </div>

          <div style={S.addCard}>
            <div style={S.addHeader}>
              <div style={S.cardTitle}>Capture learning</div>
              <div style={S.helperText}>
                Save one learning moment for who you are currently viewing without leaving profile.
              </div>
            </div>
            <div style={S.captureHeaderRow}>
              <div style={S.captureContext}>
                <div style={S.summaryLabel}>Currently viewing</div>
                <div style={S.summaryValue}>{activeLearner?.label || "Choose a learner first"}</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowCaptureForm((current) => !current);
                  setError("");
                  setWarning("");
                }}
                disabled={!activeLearner || savingCapture}
                style={!activeLearner || savingCapture ? S.buttonDisabled : S.secondaryButton}
              >
                {showCaptureForm ? "Close" : "Capture learning"}
              </button>
            </div>

            {showCaptureForm ? (
              <div style={S.captureForm}>
                <input
                  value={captureTitle}
                  onChange={(e) => {
                    setCaptureTitle(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="Title"
                  aria-label="Learning title"
                  style={S.input}
                />
                <textarea
                  value={captureDescription}
                  onChange={(e) => {
                    setCaptureDescription(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="Description (optional)"
                  aria-label="Learning description"
                  rows={4}
                  style={S.textarea}
                />
                <div style={S.captureActions}>
                  <button
                    type="button"
                    onClick={handleCaptureLearning}
                    disabled={savingCapture}
                    style={savingCapture ? S.buttonDisabled : S.primaryButton}
                  >
                    {savingCapture ? "Saving..." : "Save learning"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCaptureForm(false);
                      setCaptureTitle("");
                      setCaptureDescription("");
                    }}
                    disabled={savingCapture}
                    style={S.secondaryButton}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          <div style={S.learnerList}>
            {children.map((child) => {
              const draft = editDrafts[child.id] ?? { name: learnerName(child), year: yearInputValue(child) };
              const isEditing = editingChildId === child.id;
              const isBusy = busyChildId === child.id;
              const isCurrentLearner = currentLearnerId === child.id;

              return (
                <article key={child.id} style={S.learnerCard}>
                  <div style={S.learnerHeader}>
                    <div>
                      <div style={S.cardTitle}>{learnerName(child)}</div>
                      <div style={S.helperText}>{child.yearLabel || "Year level not set"}</div>
                    </div>
                    {isCurrentLearner ? <span style={S.chip}>Currently viewing</span> : null}
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
                        <button type="button" onClick={() => void handleSwitchLearner(child.id)} disabled={isBusy || isCurrentLearner} style={isBusy || isCurrentLearner ? S.buttonDisabled : S.secondaryButton}>
                          {isCurrentLearner ? "Currently viewing" : "Switch to"}
                        </button>
                        <button type="button" onClick={() => setEditingChildId(child.id)} style={S.secondaryButton}>
                          Edit
                        </button>
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
          <div style={S.summaryCard}>
            <div style={S.cardTitle}>Curriculum setup lives in settings</div>
            <div style={S.helperText}>
              This page now shows learner management only. Open settings to change the family framework and level.
            </div>
            <div style={S.helperText}>
              Profile no longer owns curriculum edits, which keeps the family workflow on one settings path.
            </div>
          </div>
        </section>

        <section style={S.section}>
          <div style={S.sectionHeader}>
            <div>
              <div style={S.eyebrow}>Learning record</div>
              <h2 style={S.sectionTitle}>Recent learning</h2>
            </div>
          </div>
          <div style={S.activityGridSingle}>
            {recentEvidence.length ? recentEvidence.map((row) => (
              <div key={row.id} style={S.learningRow}>
                <div style={S.learningRowText}>
                  <div style={S.cardTitle}>{safe(row.title) || "Untitled learning"}</div>
                  <div style={S.helperText}>
                    {learnerNameById.get(safe(row.student_id)) || "Unknown learner"}
                    {" · "}
                    {formatTimestamp(row.created_at)}
                  </div>
                  {safe(row.summary) ? <div style={S.activityRow}>{safe(row.summary)}</div> : null}
                </div>
              </div>
            )) : (
              <div style={S.helperText}>No learning has been captured yet.</div>
            )}
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
  captureHeaderRow: { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "end", flexWrap: "wrap" },
  captureContext: { display: "grid", gap: 6 },
  captureForm: { display: "grid", gap: 10 },
  captureActions: { display: "flex", gap: 10, flexWrap: "wrap" },
  learnerList: { display: "grid", gap: 12 },
  learnerCard: { border: "1px solid #e5e7eb", borderRadius: 18, background: "#ffffff", padding: 16, display: "grid", gap: 12 },
  learnerHeader: { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" },
  cardTitle: { fontSize: 16, fontWeight: 900, color: "#0f172a" },
  helperText: { fontSize: 13, lineHeight: 1.5, color: "#64748b" },
  formRow: { display: "flex", gap: 10, flexWrap: "wrap" },
  actionRow: { display: "flex", gap: 10, flexWrap: "wrap" },
  input: { flex: "1 1 220px", minWidth: 0, borderRadius: 12, border: "1px solid #cbd5e1", padding: "11px 12px", fontSize: 14 },
  inputSmall: { width: 110, borderRadius: 12, border: "1px solid #cbd5e1", padding: "11px 12px", fontSize: 14 },
  textarea: { width: "100%", minHeight: 110, borderRadius: 12, border: "1px solid #cbd5e1", padding: "11px 12px", fontSize: 14, resize: "vertical" },
  primaryButton: { border: "none", borderRadius: 12, background: "#0f172a", color: "#ffffff", padding: "11px 14px", fontWeight: 800, fontSize: 14, cursor: "pointer" },
  secondaryButton: { border: "1px solid #cbd5e1", borderRadius: 12, background: "#ffffff", color: "#0f172a", padding: "11px 14px", fontWeight: 800, fontSize: 14, cursor: "pointer" },
  buttonDisabled: { border: "1px solid #e5e7eb", borderRadius: 12, background: "#f8fafc", color: "#94a3b8", padding: "11px 14px", fontWeight: 800, fontSize: 14, cursor: "not-allowed" },
  dangerButton: { border: "1px solid #fecaca", borderRadius: 12, background: "#fff1f2", color: "#b91c1c", padding: "11px 14px", fontWeight: 800, fontSize: 14, cursor: "pointer" },
  successBanner: { border: "1px solid #bbf7d0", borderRadius: 16, background: "#f0fdf4", color: "#166534", padding: "12px 14px", fontSize: 14 },
  warningBanner: { border: "1px solid #fde68a", borderRadius: 16, background: "#fffbeb", color: "#92400e", padding: "12px 14px", fontSize: 14 },
  errorBanner: { border: "1px solid #fdba74", borderRadius: 16, background: "#fff7ed", color: "#9a3412", padding: "12px 14px", fontSize: 14 },
  chip: { display: "inline-flex", alignItems: "center", borderRadius: 999, background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", padding: "6px 10px", fontSize: 12, fontWeight: 800 },
  activityGridSingle: { display: "grid", gap: 12 },
  activityRow: { fontSize: 14, lineHeight: 1.55, color: "#334155" },
  learningRow: { border: "1px solid #e5e7eb", borderRadius: 14, background: "#f8fafc", padding: 14, display: "grid", gap: 8 },
  learningRowText: { display: "grid", gap: 4 },
};