"use client";

import React from "react";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";
import PostOnboardingPanel from "@/app/components/guided/PostOnboardingPanel";

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FamilyTopNavShell
      title="EduDecks Family"
      subtitle="Reports"
      heroTitle="Shape captured learning into calm reports"
      heroText="Keep the family journey visible while you turn real learning moments into summaries, drafts, and cleaner reporting output."
      heroAsideTitle="Reports step"
      heroAsideText="Reports sits after capture and before portfolio, so parents can always see where this work belongs in the wider journey."
      workflowCurrentHref="/reports"
      workflowHelperText="You are in the reports step now. Review what was captured, shape the summary, and keep portfolio as the next quieter step."
    >
      <PostOnboardingPanel />
      {children}
    </FamilyTopNavShell>
  );
}
