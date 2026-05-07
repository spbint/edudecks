import type { ReactNode } from "react";

import { FamilyWorkspaceProvider } from "@/app/components/FamilyWorkspaceProvider";
import { FamilyShellSurface } from "@/app/components/FamilyTopNavShell";
import { requireAuthenticatedRoute } from "@/lib/auth/serverRouteAuth";

export default async function AuthLayout({ children }: { children: ReactNode }) {
  await requireAuthenticatedRoute("/my-day");

  return (
    <FamilyWorkspaceProvider>
      <FamilyShellSurface>{children}</FamilyShellSurface>
    </FamilyWorkspaceProvider>
  );
}
