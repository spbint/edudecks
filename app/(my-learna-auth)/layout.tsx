import type { ReactNode } from "react";

import { FamilyWorkspaceProvider } from "@/app/components/FamilyWorkspaceProvider";
import CleanFamilyWorkspaceProvider from "@/app/components/clean/CleanFamilyWorkspaceProvider";
import { MyLearnaCoachProvider } from "@/app/components/clean/coach/MyLearnaCoachProvider";
import MyLearnaAppShellV2 from "@/app/components/clean/design-v2/MyLearnaAppShellV2";

export default function MyLearnaAuthenticatedLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <FamilyWorkspaceProvider>
      <CleanFamilyWorkspaceProvider>
        <MyLearnaCoachProvider>
          <MyLearnaAppShellV2>{children}</MyLearnaAppShellV2>
        </MyLearnaCoachProvider>
      </CleanFamilyWorkspaceProvider>
    </FamilyWorkspaceProvider>
  );
}
