"use client";

import React from "react";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";
import TemporaryUnavailableCard from "@/app/components/TemporaryUnavailableCard";

export default function FamilySettingsPage() {
  return (
    <FamilyTopNavShell subtitle="Settings" hideHero={true}>
      <main style={styles.page}>
        <TemporaryUnavailableCard
          title="Settings"
          message="Settings is staying available while the new MyLearna account and preferences experience is modernised."
        />
      </main>
    </FamilyTopNavShell>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    display: "grid",
    gap: 18,
    paddingBottom: 56,
  },
};
