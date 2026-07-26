"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
  DEFAULT_FAMILY_PROFILE,
  DEFAULT_FAMILY_SETTINGS,
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
  setActiveLearnerId: (learnerId: string | null | undefined) => void;
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
  setActiveLearnerId: () => {},
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

function emptyWorkspace(userId: string | null): FamilyWorkspaceState {
  return {
    profile: {
      ...DEFAULT_FAMILY_SETTINGS,
      ...DEFAULT_FAMILY_PROFILE,
      id: "local",
      user_id: userId,
      owner_user_id: userId,
    },
    learners: [],
    userId,
    storageMode: "local",
  };
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
  const reloadInFlightRef = useRef<Promise<void> | null>(null);
  const hasLoadedWorkspaceRef = useRef(false);
  const requestGenerationRef = useRef(0);
  const userIdRef = useRef<string | null>(user?.id ?? null);

  const reloadWorkspace = useCallback(async () => {
    if (reloadInFlightRef.current) {
      return reloadInFlightRef.current;
    }

    const generation = requestGenerationRef.current;
    const run = (async () => {
      // Keep the last valid workspace mounted during refreshes after bootstrap.
      if (!hasLoadedWorkspaceRef.current) setLoading(true);
      setError("");

      try {
        const nextWorkspace = await loadFamilyWorkspace(user?.id ?? null);
        if (generation !== requestGenerationRef.current) return;
        setWorkspace(nextWorkspace);
        setActiveLearnerIdState(applyActiveLearner(nextWorkspace));
        setError(nextWorkspace.syncIssue ?? "");
      } catch {
        if (generation !== requestGenerationRef.current) return;
        const fallback = buildLocalFamilyWorkspaceSnapshot();
        setWorkspace((prev) => ({
          ...fallback,
          // Mark the attempted account as resolved even when bootstrap falls
          // back locally; otherwise accountTransition keeps loading true
          // forever for a first-load failure.
          userId: user?.id ?? prev.userId,
          syncIssue: "Family workspace is using the last local snapshot.",
        }));
        setActiveLearnerIdState(applyActiveLearner(fallback));
        setError("Family workspace is using the last local snapshot.");
      } finally {
        if (generation === requestGenerationRef.current) {
          hasLoadedWorkspaceRef.current = true;
          setLoading(false);
          reloadInFlightRef.current = null;
        }
      }
    })();

    reloadInFlightRef.current = run;
    return run;
  }, [user?.id]);

  const setWorkspacePatch = useCallback((patch: {
    profile?: FamilyProfileRow | FamilySettings;
    learners?: FamilyLearner[];
    storageMode?: "database" | "local";
    userId?: string | null;
  }) => {
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
        persistLearnersToLocalCache(nextWorkspace.learners, { notify: false });
      }

      setActiveLearnerIdState(applyActiveLearner(nextWorkspace));
      return nextWorkspace;
    });
  }, []);

  const handleSetActiveLearner = useCallback((learnerId: string | null | undefined) => {
    const nextId = resolveCanonicalActiveLearnerId(
      workspace.learners,
      workspace.profile,
      learnerId,
    );
    setActiveLearnerId(nextId || null);
    setActiveLearnerIdState(nextId);
  }, [workspace.learners, workspace.profile]);

  useEffect(() => {
    const nextUserId = user?.id ?? null;
    if (userIdRef.current !== nextUserId) {
      requestGenerationRef.current += 1;
      reloadInFlightRef.current = null;
      hasLoadedWorkspaceRef.current = false;
      setWorkspace(emptyWorkspace(nextUserId));
      setActiveLearnerIdState("");
      setLoading(true);
      setError("");
      userIdRef.current = nextUserId;
    }
    void reloadWorkspace();
  }, [reloadWorkspace, user?.id]);

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
  }, [reloadWorkspace, workspace]);

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
  }, [workspace, activeLearnerId]);

  useEffect(() => {
    if (process.env.NODE_ENV === "production" || loading) return;

    const debugPayload = {
      hasAuthenticatedUser: Boolean(user?.id),
      profileId: workspace.profile.id,
      storageMode: workspace.storageMode,
      syncIssue: workspace.syncIssue ?? null,
      learnerCount: workspace.learners.length,
      learnerLabels: workspace.learners.map((learner) => learner.label).filter(Boolean),
    };

    (
      window as Window & {
        __MYLEARNA_FAMILY_WORKSPACE__?: typeof debugPayload;
      }
    ).__MYLEARNA_FAMILY_WORKSPACE__ = debugPayload;

    console.debug("[family-workspace]", {
      ...debugPayload,
      userId: workspace.userId,
    });
  }, [
    loading,
    user?.id,
    workspace.learners.length,
    workspace.learners,
    workspace.profile.id,
    workspace.storageMode,
    workspace.syncIssue,
    workspace.userId,
  ]);

  const activeLearner =
    workspace.learners.find((learner) => learner.id === activeLearnerId) ?? null;
  const accountTransition =
    (user?.id ?? null) !== workspace.userId && Boolean(user?.id || workspace.userId);
  const effectiveLoading = loading || accountTransition;

  const value = useMemo(
    () => ({
      workspace,
      activeLearnerId,
      activeLearner,
      loading: effectiveLoading,
      error,
      reloadWorkspace,
      setWorkspacePatch,
      setActiveLearner: handleSetActiveLearner,
      setActiveLearnerId: handleSetActiveLearner,
    }),
    [
      workspace,
      activeLearnerId,
      activeLearner,
      effectiveLoading,
      error,
      reloadWorkspace,
      setWorkspacePatch,
      handleSetActiveLearner,
    ],
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
