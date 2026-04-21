"use client";

import React from "react";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";
import TemporaryUnavailableCard from "@/app/components/TemporaryUnavailableCard";

export default function ReportsOutputPage() {
  return (
    <FamilyTopNavShell title="EduDecks Family" subtitle="Report Output">
      <TemporaryUnavailableCard
        title="Report Output"
        message="Curriculum setup is temporarily unavailable during rebuild."
      />
    </FamilyTopNavShell>
  );
}
