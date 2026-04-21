"use client";

import React from "react";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";
import TemporaryUnavailableCard from "@/app/components/TemporaryUnavailableCard";

export default function CapturePage() {
  return (
    <FamilyTopNavShell title="EduDecks Family" subtitle="Capture">
      <TemporaryUnavailableCard
        title="Capture"
        message="Curriculum setup is temporarily unavailable during rebuild."
      />
    </FamilyTopNavShell>
  );
}
