"use client";

import React from "react";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";
import TemporaryUnavailableCard from "@/app/components/TemporaryUnavailableCard";

export default function PlannerPage() {
  return (
    <FamilyTopNavShell title="EduDecks Family" subtitle="Planner">
      <TemporaryUnavailableCard
        title="Planner"
        message="Curriculum setup is temporarily unavailable during rebuild."
      />
    </FamilyTopNavShell>
  );
}
