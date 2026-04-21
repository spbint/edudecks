"use client";

import React from "react";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";
import TemporaryUnavailableCard from "@/app/components/TemporaryUnavailableCard";

export default function PortfolioPage() {
  return (
    <FamilyTopNavShell title="EduDecks Family" subtitle="Portfolio">
      <TemporaryUnavailableCard
        title="Portfolio"
        message="Curriculum setup is temporarily unavailable during rebuild."
      />
    </FamilyTopNavShell>
  );
}
