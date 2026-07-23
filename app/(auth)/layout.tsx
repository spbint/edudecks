import type { ReactNode } from "react";

import { FamilyWorkspaceProvider } from "@/app/components/FamilyWorkspaceProvider";
import CleanFamilyWorkspaceProvider from "@/app/components/clean/CleanFamilyWorkspaceProvider";
import MyLearnaAppShellV2 from "@/app/components/clean/design-v2/MyLearnaAppShellV2";
import { requireAuthenticatedRoute } from "@/lib/auth/serverRouteAuth";

export default async function AuthLayout({ children }: { children: ReactNode }) {
  await requireAuthenticatedRoute("/my-day");

  return (
    <FamilyWorkspaceProvider>
      <CleanFamilyWorkspaceProvider>
        <MyLearnaAppShellV2>{children}</MyLearnaAppShellV2>
      </CleanFamilyWorkspaceProvider>
    </FamilyWorkspaceProvider>
  );
}
