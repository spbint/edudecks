import type { ReactNode } from "react";

import { FamilyWorkspaceProvider } from "@/app/components/FamilyWorkspaceProvider";
import { FamilyShellSurface } from "@/app/components/FamilyTopNavShell";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <FamilyWorkspaceProvider>
      <FamilyShellSurface>{children}</FamilyShellSurface>
    </FamilyWorkspaceProvider>
  );
}
