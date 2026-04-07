import type { ReactNode } from "react";

import { FamilyShellSurface } from "@/app/components/FamilyTopNavShell";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <FamilyShellSurface>{children}</FamilyShellSurface>;
}
