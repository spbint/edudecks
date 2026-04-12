import React from "react";
// Dormant route layer: preserved for future leadership workflows, not part of the live family-first product.
import LeadershipTopNavShell from "@/app/components/LeadershipTopNavShell";

export default function LeadershipLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LeadershipTopNavShell>{children}</LeadershipTopNavShell>;
}
