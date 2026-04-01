"use client";

import React, { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { buildWholeSchoolPath } from "@/lib/leadershipRoutes";

export default function LegacySchoolOverviewRedirectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryString = searchParams?.toString() || "";

  useEffect(() => {
    const base = buildWholeSchoolPath();
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
      Redirecting to whole-school view…
    </main>
  );
}