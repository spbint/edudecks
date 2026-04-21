"use client";

import React from "react";
import FamilyTopNavShell, { FamilyCommandLayer } from "@/app/components/FamilyTopNavShell";
import TemporaryUnavailableCard from "@/app/components/TemporaryUnavailableCard";

export default function MyPlanPage() {
  return (
    <FamilyTopNavShell
      subtitle="My Plan"
      heroTitle="A calm plan for the week ahead"
      heroText="Use My Plan to keep the next week visible, gentle, and realistic for your learner."
      heroAsideTitle="Planning snapshot"
      heroAsideText="Start small, build consistency, and leave room for the learning that emerges naturally."
    >
      <div className="grid gap-5 pb-14">
        <TemporaryUnavailableCard
          title="My Plan"
          message="The detailed planning workspace is the next page to modernise. The new shell, route, and family language are now in place."
        />
        <FamilyCommandLayer
          eyebrow="Planning actions"
          title="Keep the workflow moving without losing context."
          primaryActionLabel="Back to Home"
          primaryActionHref="/home"
        />
      </div>
    </FamilyTopNavShell>
  );
}
