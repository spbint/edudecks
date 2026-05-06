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

type CleanFamilyWorkspaceContextValue = CleanWorkspaceState & {
  loading: boolean;
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

const CleanFamilyWorkspaceContext = createContext<CleanFamilyWorkspaceContextValue>({
  ...INITIAL_STATE,
  loading: true,
  reload: async () => undefined,
});

export default function CleanFamilyWorkspaceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [workspace, setWorkspace] = useState<CleanWorkspaceState>(INITIAL_STATE);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const nextWorkspace = await loadCleanWorkspace();
      setWorkspace(nextWorkspace);
    } finally {
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
      reload,
    }),
    [loading, reload, workspace],
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
