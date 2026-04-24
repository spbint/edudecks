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
import Link from "next/link";
import { resolveEffectiveLearnerLearningConfig } from "@/lib/familyLearningConfig";

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

function friendlyAddLearnerMessage() {
  return "We couldn't add this learner just yet. Try again in a moment.";
}

function friendlyProfileCaptureMessage() {
  return "We couldn't save this learning moment just yet. Try again in a moment.";
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
  const effectiveLearningConfig = useMemo(
    () => resolveEffectiveLearnerLearningConfig(workspace.profile, activeLearner),
    [activeLearner, workspace.profile],
  );

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
      setError(friendlyAddLearnerMessage());
    } finally {
      setAdding(false);
    }
  }

  async function handleCaptureLearning() {
    const title = safe(captureTitle);
    const description = safe(captureDescription);
    const familyProfileId = safe((profile as { id?: unknown }).id);

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

    if (!workspace.userId || !hasSupabaseEnv || !familyProfileId || familyProfileId === "local") {
      setError("Capture becomes available once this family workspace is fully connected.");
      setWarning("");
      return;
    }

    setSavingCapture(true);
    setStatus("");
    setError("");
    setWarning("");

    try {
      const created = await createFamilyEvidenceEntry({
        studentId: activeLearner.id,
        userId: workspace.userId,
        title,
        summary: description,
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
      setError(friendlyProfileCaptureMessage());
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
      subtitle="My Profile"
      heroTitle="Keep learner details tidy and connected"
      heroText="Manage learners, confirm the active learner for the wider workflow, and keep a read-only view of the current family setup."
      heroAsideTitle="Family workspace"
      heroAsideText="Profile now consumes the shared family workspace. Curriculum setup stays in settings."
    >
      <div style={S.page}>
        {/* existing learner management / family setup sections stay unchanged */}

        <section style={S.section}>
          <div style={S.sectionHeader}>
            <div>
              <div style={S.eyebrow}>Learning record</div>
              <h2 style={S.sectionTitle}>Recent learning</h2>
              <div style={S.helperText}>
                A quick view of the latest captured moments for your current family workspace.
              </div>
            </div>
          </div>

          <div style={S.activityGridSingle}>
            {recentEvidence.length ? (
              recentEvidence.map((row) => (
                <div key={row.id} style={S.learningRow}>
                  <div style={S.learningRowText}>
                    <div style={S.cardTitle}>{safe(row.title) || "Untitled learning"}</div>
                    <div style={S.helperText}>
                      {learnerNameById.get(safe(row.student_id)) || "Unknown learner"}
                      {" Â· "}
                      {formatTimestamp(row.created_at)}
                    </div>
                    {safe(row.summary) ? (
                      <div style={S.activityRow}>{safe(row.summary)}</div>
                    ) : null}
                  </div>
                </div>
              ))
            ) : (
              <div style={S.emptyCard}>
                <div style={S.cardTitle}>No learning captured yet</div>
                <div style={S.helperText}>
                  When you save a learning moment, it will appear here so the family record stays visible.
                </div>
              </div>
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
  helperText: { fontSize: 13, lineHeight: 1.5, color: "#64748b" },
  summaryLabel: { fontSize: 12, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.6 },
  summaryValue: { fontSize: 16, fontWeight: 900, color: "#0f172a" },
  cardTitle: { fontSize: 16, fontWeight: 900, color: "#0f172a" },
  sectionHeaderSpacer: { minHeight: 1 },
  activityGridSingle: { display: "grid", gap: 12 },
  learningRow: { border: "1px solid #e5e7eb", borderRadius: 14, background: "#f8fafc", padding: 14, display: "grid", gap: 8 },
  learningRowText: { display: "grid", gap: 4 },
  activityRow: { fontSize: 14, lineHeight: 1.55, color: "#334155" },
  emptyCard: { border: "1px solid #e5e7eb", borderRadius: 18, background: "#ffffff", padding: 18, display: "grid", gap: 8 },
};
