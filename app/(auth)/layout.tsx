import type { ReactNode } from "react";

import AuthRouteGuard from "@/app/components/AuthRouteGuard";
import { FamilyWorkspaceProvider } from "@/app/components/FamilyWorkspaceProvider";
import { FamilyShellSurface } from "@/app/components/FamilyTopNavShell";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <AuthRouteGuard>
      <FamilyWorkspaceProvider>
        <FamilyShellSurface>{children}</FamilyShellSurface>
      </FamilyWorkspaceProvider>
    </AuthRouteGuard>
  );
}
