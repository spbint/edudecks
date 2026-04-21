"use client";

import React from "react";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";
import TemporaryUnavailableCard from "@/app/components/TemporaryUnavailableCard";

export default function FamilySettingsPage() {
  return (
    <FamilyTopNavShell title="EduDecks Family" subtitle="Settings" hideHero={true}>
      <main style={styles.page}>
        <TemporaryUnavailableCard title="Settings" />
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
