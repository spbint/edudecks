import React from "react";
import LeadershipTopNavShell from "@/app/components/LeadershipTopNavShell";

export default function LeadershipLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LeadershipTopNavShell>{children}</LeadershipTopNavShell>;
}
