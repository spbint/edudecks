"use client";

import React from "react";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";
import TemporaryUnavailableCard from "@/app/components/TemporaryUnavailableCard";

export default function CapturePage() {
  return (
    <FamilyTopNavShell subtitle="Capture">
      <TemporaryUnavailableCard
        title="Capture"
        message="Capture will be refreshed under the new MyLearna shell next. The route and family context are already aligned."
      />
    </FamilyTopNavShell>
  );
}
