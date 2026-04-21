"use client";

import React from "react";
import FamilyTopNavShell, { FamilyCommandLayer } from "@/app/components/FamilyTopNavShell";
import TemporaryUnavailableCard from "@/app/components/TemporaryUnavailableCard";

export default function MyReportsPage() {
  return (
    <FamilyTopNavShell
      subtitle="My Reports"
      heroTitle="Build clearer family reports from real learning"
      heroText="My Reports brings evidence, reflection, and structure together so reporting feels calmer and more trustworthy."
      heroAsideTitle="Reporting snapshot"
      heroAsideText="Use this space when you are ready to turn what has been captured into something clearer and more shareable."
    >
      <div className="grid gap-5 pb-14">
        <TemporaryUnavailableCard
          title="My Reports"
          message="The full reports builder will be modernised after /home. This route now matches the new MyLearna IA."
        />
        <FamilyCommandLayer
          eyebrow="Reporting actions"
          title="Continue from evidence into reporting, then review progress when you need a clearer picture."
          primaryActionLabel="Back to Home"
          primaryActionHref="/home"
        />
      </div>
    </FamilyTopNavShell>
  );
}
