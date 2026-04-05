"use client";

import React from "react";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";

export default function CalendarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FamilyTopNavShell
      title="EduDecks Family"
      subtitle="Calendar"
      heroTitle="Give the plan a calm place in the week"
      heroText="Calendar keeps the family journey practical. Place one learning moment into the week, then let capture and reports follow when the moment happens."
      heroAsideTitle="Calendar step"
      heroAsideText="Calendar is the bridge between planning and capture, so parents can always see what comes next without juggling the whole system."
      workflowCurrentHref="/calendar"
      workflowHelperText="You are in the calendar step now. Place the plan gently in the week, then move into capture when the moment is complete."
    >
      {children}
    </FamilyTopNavShell>
  );
}
