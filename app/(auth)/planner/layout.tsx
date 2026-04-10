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
      title="EduDecks Family"
      subtitle="Planner"
      heroTitle="A calm, simple plan for the week"
      heroText="Keep this week light and purposeful. Choose a gentle focus, take a few meaningful steps, and let the story build naturally without losing the wider family workflow."
      heroAsideTitle="Planning step"
      heroAsideText="Planning stays connected to capture, portfolio, reports, output, and authority so the whole family journey remains visible."
    >
      {children}
    </FamilyTopNavShell>
  );
}
