"use client";

import React from "react";
import WorkflowStageRibbon from "@/app/components/WorkflowStageRibbon";
import { resolveFamilyWorkflowStage } from "@/lib/familyWorkflow";

export type FamilyWorkflowStripProps = {
  current?: string;
  currentHref?: string;
  className?: string;
};

export default function FamilyWorkflowStrip({
  current,
  currentHref,
}: FamilyWorkflowStripProps) {
  const resolvedHref =
    currentHref ?? (current ? `/${current.replace(/^\//, "")}` : "");

  return (
    <WorkflowStageRibbon
      currentRoute={resolvedHref}
      currentStage={resolveFamilyWorkflowStage(resolvedHref)}
      helperText="See where this page sits in the family workflow before moving to the next stage."
      style={{ borderTop: "1px solid #f1f5f9" }}
    />
  );
}
