"use client";

import React from "react";
import FamilyTopNavShell, { FamilyCommandLayer } from "@/app/components/FamilyTopNavShell";
import TemporaryUnavailableCard from "@/app/components/TemporaryUnavailableCard";

export default function MyPortfolioPage() {
  return (
    <FamilyTopNavShell
      subtitle="My Portfolio"
      heroTitle="A calmer place to curate the learning story"
      heroText="Use My Portfolio to keep the clearest evidence close and shape a visible record over time."
      heroAsideTitle="Portfolio snapshot"
      heroAsideText="Evidence-first portfolios feel stronger when they are curated steadily rather than reconstructed at the end."
    >
      <div className="grid gap-5 pb-14">
        <TemporaryUnavailableCard
          title="My Portfolio"
          message="The portfolio workspace will be modernised next. The new route and navigation language are already live."
        />
        <FamilyCommandLayer
          eyebrow="Portfolio actions"
          title="Move between evidence, reporting, and progress with one shared family flow."
          primaryActionLabel="Back to Home"
          primaryActionHref="/home"
        />
      </div>
    </FamilyTopNavShell>
  );
}
