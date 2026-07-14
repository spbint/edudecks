"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { loadCleanWorkspace } from "@/lib/clean/workspace/client";
import type { CleanWorkspaceState } from "@/lib/clean/workspace/types";
import {
  buildEmptyCleanSetupStatus,
  loadCleanSetupStatus,
} from "@/lib/clean/setup/setupStateClient";
import type { CleanSetupStatus } from "@/lib/clean/setup/setupStatus";

type CleanFamilyWorkspaceContextValue = CleanWorkspaceState & {
  loading: boolean;
  setupLoading: boolean;
  setupStatus: CleanSetupStatus;
  reload: () => Promise<void>;
};

const INITIAL_STATE: CleanWorkspaceState = {
  currentUserId: null,
  profile: null,
  membership: null,
  members: [],
  learners: [],
  requiresFamilyCreation: false,
  schemaMissing: false,
  error: null,
};

const INITIAL_SETUP_STATUS = buildEmptyCleanSetupStatus(INITIAL_STATE);

const CleanFamilyWorkspaceContext = createContext<CleanFamilyWorkspaceContextValue>({
  ...INITIAL_STATE,
  loading: true,
  setupLoading: true,
  setupStatus: INITIAL_SETUP_STATUS,
  reload: async () => undefined,
});

export default function CleanFamilyWorkspaceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [workspace, setWorkspace] = useState<CleanWorkspaceState>(INITIAL_STATE);
  const [loading, setLoading] = useState(true);
  const [setupStatus, setSetupStatus] =
    useState<CleanSetupStatus>(INITIAL_SETUP_STATUS);
  const [setupLoading, setSetupLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    setSetupLoading(true);
    try {
      const nextWorkspace = await loadCleanWorkspace();
      setWorkspace(nextWorkspace);
      if (
        nextWorkspace.schemaMissing ||
        nextWorkspace.error ||
        nextWorkspace.requiresFamilyCreation ||
        !nextWorkspace.profile
      ) {
        setSetupStatus(buildEmptyCleanSetupStatus(nextWorkspace));
        return;
      }
      try {
        setSetupStatus(await loadCleanSetupStatus(nextWorkspace));
      } catch (error) {
        console.error("Clean setup status hydrate failed", error);
        setSetupStatus(buildEmptyCleanSetupStatus(nextWorkspace));
      }
    } finally {
      setSetupLoading(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const value = useMemo(
    () => ({
      ...workspace,
      loading,
      setupLoading,
      setupStatus,
      reload,
    }),
    [loading, reload, setupLoading, setupStatus, workspace],
  );

  return (
    <CleanFamilyWorkspaceContext.Provider value={value}>
      {children}
    </CleanFamilyWorkspaceContext.Provider>
  );
}

export function useCleanFamilyWorkspace() {
  return useContext(CleanFamilyWorkspaceContext);
}
