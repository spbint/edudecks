"use client";

import React from "react";
import WorkflowStageRibbon from "@/app/components/WorkflowStageRibbon";

type FamilyWorkflowRibbonProps = {
  currentRoute?: string;
  helperText?: string;
  style?: React.CSSProperties;
};

export default function FamilyWorkflowRibbon({
  currentRoute,
  helperText = "Move from My Learning into planning, capture, and reports with one shared family flow.",
  style,
}: FamilyWorkflowRibbonProps) {
  return (
    <WorkflowStageRibbon
      currentRoute={currentRoute}
      helperText={helperText}
      style={style}
    />
  );
}
