"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuthUser } from "@/app/components/AuthUserProvider";
import {
  ACTIVE_CHILD_EVENT,
  FAMILY_WORKSPACE_EVENT,
  buildLocalFamilyWorkspaceSnapshot,
  isValidActiveLearnerId,
  loadFamilyWorkspace,
  persistLearnersToLocalCache,
  resolveCanonicalActiveLearnerId,
  resolveEffectiveActiveLearnerId,
  setActiveLearnerId,
  type FamilyLearner,
  type FamilyWorkspaceState,
} from "@/lib/familyWorkspace";
import {
  persistSettingsToLocalStorage,
  type FamilyProfileRow,
  type FamilySettings,
} from "@/lib/familySettings";

type FamilyWorkspaceContextValue = {
  workspace: FamilyWorkspaceState;
  activeLearnerId: string;
  activeLearner: FamilyLearner | null;
  loading: boolean;
  error: string;
  reloadWorkspace: () => Promise<void>;
  setWorkspacePatch: (patch: {
    profile?: FamilyProfileRow | FamilySettings;
    learners?: FamilyLearner[];
    storageMode?: "database" | "local";
    userId?: string | null;
  }) => void;
  setActiveLearner: (learnerId: string | null | undefined) => void;
};

const FamilyWorkspaceContext = createContext<FamilyWorkspaceContextValue>({
  workspace: buildLocalFamilyWorkspaceSnapshot(),
  activeLearnerId: "",
  activeLearner: null,
  loading: true,
  error: "",
  reloadWorkspace: async () => {},
  setWorkspacePatch: () => {},
  setActiveLearner: () => {},
});

function applyActiveLearner(
  workspace: FamilyWorkspaceState,
  explicitId?: string | null,
) {
  const nextId = resolveCanonicalActiveLearnerId(
    workspace.learners,
    workspace.profile,
    explicitId,
  );

  if (nextId) {
    setActiveLearnerId(nextId);
  }

  return nextId;
}

export function FamilyWorkspaceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuthUser();
  const [workspace, setWorkspace] = useState<FamilyWorkspaceState>(() =>
    buildLocalFamilyWorkspaceSnapshot(),
  );
  const [activeLearnerId, setActiveLearnerIdState] = useState(() =>
    resolveEffectiveActiveLearnerId(
      buildLocalFamilyWorkspaceSnapshot().learners,
      buildLocalFamilyWorkspaceSnapshot().profile,
    ),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function reloadWorkspace() {
    setLoading(true);
    setError("");

    try {
      const nextWorkspace = await loadFamilyWorkspace();
      setWorkspace(nextWorkspace);
      setActiveLearnerIdState(applyActiveLearner(nextWorkspace));
    } catch (err) {
      console.error("FamilyWorkspaceProvider reload failed", err);
      const fallback = buildLocalFamilyWorkspaceSnapshot();
      setWorkspace((prev) => ({
        ...fallback,
        userId: prev.userId,
      }));
      setActiveLearnerIdState(applyActiveLearner(fallback));
      setError("Family workspace is using the last local snapshot.");
    } finally {
      setLoading(false);
    }
  }

  function setWorkspacePatch(patch: {
    profile?: FamilyProfileRow | FamilySettings;
    learners?: FamilyLearner[];
    storageMode?: "database" | "local";
    userId?: string | null;
  }) {
    setWorkspace((prev) => {
      const nextWorkspace: FamilyWorkspaceState = {
        profile: patch.profile
          ? ({ ...prev.profile, ...patch.profile } as FamilyProfileRow)
          : prev.profile,
        learners: patch.learners ?? prev.learners,
        storageMode: patch.storageMode ?? prev.storageMode,
        userId: patch.userId === undefined ? prev.userId : patch.userId,
      };

      if (patch.profile) {
        persistSettingsToLocalStorage(nextWorkspace.profile);
      }

      if (patch.learners) {
        persistLearnersToLocalCache(nextWorkspace.learners);
      }

      setActiveLearnerIdState(applyActiveLearner(nextWorkspace));
      return nextWorkspace;
    });
  }

  function handleSetActiveLearner(learnerId: string | null | undefined) {
    const nextId = resolveCanonicalActiveLearnerId(
      workspace.learners,
      workspace.profile,
      learnerId,
    );
    setActiveLearnerId(nextId || null);
    setActiveLearnerIdState(nextId);
  }

  useEffect(() => {
    void reloadWorkspace();
  }, [user?.id]);

  useEffect(() => {
    function handleWorkspaceChanged() {
      void reloadWorkspace();
    }

    function handleActiveLearnerChanged(event: Event) {
      const customEvent = event as CustomEvent<{ childId?: string }>;
      const nextId = resolveCanonicalActiveLearnerId(
        workspace.learners,
        workspace.profile,
        customEvent.detail?.childId,
      );
      setActiveLearnerIdState(nextId);
    }

    function handleStorage(event: StorageEvent) {
      if (!event.key) return;
      if (
        event.key === "edudecks_family_settings_v1" ||
        event.key === "edudecks_children_seed_v1"
      ) {
        void reloadWorkspace();
      }
      if (event.key === "edudecks_active_student_id") {
        const nextId = resolveCanonicalActiveLearnerId(
          workspace.learners,
          workspace.profile,
          String(event.newValue ?? "").trim(),
        );
        setActiveLearnerIdState(nextId);
      }
    }

    window.addEventListener(FAMILY_WORKSPACE_EVENT, handleWorkspaceChanged);
    window.addEventListener(ACTIVE_CHILD_EVENT, handleActiveLearnerChanged as EventListener);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(FAMILY_WORKSPACE_EVENT, handleWorkspaceChanged);
      window.removeEventListener(
        ACTIVE_CHILD_EVENT,
        handleActiveLearnerChanged as EventListener,
      );
      window.removeEventListener("storage", handleStorage);
    };
  }, [user?.id, workspace.learners, workspace.profile]);

  useEffect(() => {
    if (!workspace.learners.length) {
      if (activeLearnerId) {
        setActiveLearnerId(null);
        setActiveLearnerIdState("");
      }
      return;
    }

    if (isValidActiveLearnerId(workspace.learners, activeLearnerId)) {
      return;
    }

    setActiveLearnerIdState(applyActiveLearner(workspace));
  }, [workspace.learners, workspace.profile, activeLearnerId]);

  const activeLearner =
    workspace.learners.find((learner) => learner.id === activeLearnerId) ?? null;

  const value = useMemo(
    () => ({
      workspace,
      activeLearnerId,
      activeLearner,
      loading,
      error,
      reloadWorkspace,
      setWorkspacePatch,
      setActiveLearner: handleSetActiveLearner,
    }),
    [workspace, activeLearnerId, activeLearner, loading, error],
  );

  return (
    <FamilyWorkspaceContext.Provider value={value}>
      {children}
    </FamilyWorkspaceContext.Provider>
  );
}

export function useFamilyWorkspace() {
  return useContext(FamilyWorkspaceContext);
}
