import React from "react";
import { FamilyWorkspaceProvider } from "@/app/components/FamilyWorkspaceProvider";
import CleanFamilyWorkspaceProvider from "@/app/components/clean/CleanFamilyWorkspaceProvider";
import MyLearnaAppShellV2 from "@/app/components/clean/design-v2/MyLearnaAppShellV2";
import { requireAuthenticatedRoute } from "@/lib/auth/serverRouteAuth";

export default async function CleanRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuthenticatedRoute("/clean-my-day");

  return (
    <FamilyWorkspaceProvider>
      <CleanFamilyWorkspaceProvider>
        <MyLearnaAppShellV2>{children}</MyLearnaAppShellV2>
      </CleanFamilyWorkspaceProvider>
    </FamilyWorkspaceProvider>
  );
}
