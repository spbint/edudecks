"use client";

import React from "react";
import WorkflowGuideRail from "@/app/components/WorkflowGuideRail";
import { type WorkflowGuideStep } from "@/lib/familyWorkflow";

type WorkflowPageFrameProps = {
  steps: WorkflowGuideStep[];
  activeStepId?: string;
  title?: string;
  helperText?: string;
  children: React.ReactNode;
};

export default function WorkflowPageFrame({
  steps,
  activeStepId,
  title,
  helperText,
  children,
}: WorkflowPageFrameProps) {
  return (
    <div className="flex gap-6 xl:gap-8">
      <WorkflowGuideRail
        steps={steps}
        activeStepId={activeStepId}
        title={title}
        helperText={helperText}
      />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
