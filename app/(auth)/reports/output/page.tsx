"use client";

import React from "react";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";
import TemporaryUnavailableCard from "@/app/components/TemporaryUnavailableCard";

export default function ReportsOutputPage() {
  return (
    <FamilyTopNavShell subtitle="Report Output">
      <TemporaryUnavailableCard
        title="Report Output"
        message="Report output will be refreshed under the MyLearna shell next. The route remains available while deeper report views are updated."
      />
    </FamilyTopNavShell>
  );
}
