"use client";

import React, { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { buildLeadershipHeatmapPath } from "@/lib/leadershipRoutes";

export default function LegacyLearningHeatmapRedirectPage() {
  return (
    <Suspense fallback={null}>
      <LegacyLearningHeatmapRedirectPageContent />
    </Suspense>
  );
}

function LegacyLearningHeatmapRedirectPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryString = searchParams?.toString() || "";

  useEffect(() => {
    const base = buildLeadershipHeatmapPath();
    const target = queryString ? `${base}?${queryString}` : base;
    router.replace(target);
  }, [queryString, router]);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#0f172a",
        color: "#e5e7eb",
        fontWeight: 900,
      }}
    >
      Redirecting to leadership heatmap…
    </main>
  );
}
