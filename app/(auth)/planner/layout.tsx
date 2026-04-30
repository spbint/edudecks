"use client";

import React from "react";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";

export default function PlannerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FamilyTopNavShell
      subtitle="My Calendar"
      heroTitle="A calm, simple calendar for the week"
      heroText="Keep this week light and purposeful. Choose a gentle focus, take a few meaningful steps, and let the story build naturally without losing the wider family workflow."
      heroAsideTitle="Calendar step"
      heroAsideText="My Calendar stays connected to capture, portfolio, reports, output, and authority so the whole family journey remains visible."
    >
      {children}
    </FamilyTopNavShell>
  );
}
