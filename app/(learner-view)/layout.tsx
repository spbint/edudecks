import type { ReactNode } from "react";
import { FamilyWorkspaceProvider } from "@/app/components/FamilyWorkspaceProvider";
import CleanFamilyWorkspaceProvider from "@/app/components/clean/CleanFamilyWorkspaceProvider";
import { requireAuthenticatedRoute } from "@/lib/auth/serverRouteAuth";

export default async function LearnerViewLayout({ children }: { children: ReactNode }) {
  await requireAuthenticatedRoute("/learner-view");
  return <FamilyWorkspaceProvider><CleanFamilyWorkspaceProvider>{children}</CleanFamilyWorkspaceProvider></FamilyWorkspaceProvider>;
}
