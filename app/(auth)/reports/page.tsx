"use client";

import React from "react";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";
import TemporaryUnavailableCard from "@/app/components/TemporaryUnavailableCard";

export default function ReportsPage() {
  return (
    <FamilyTopNavShell title="EduDecks Family" subtitle="Reports">
      <TemporaryUnavailableCard
        title="Reports"
        message="Curriculum setup is temporarily unavailable during rebuild."
      />
    </FamilyTopNavShell>
  );
}
