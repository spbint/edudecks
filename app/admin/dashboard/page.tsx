"use client";

import React, { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LegacyAdminDashboardRedirectPage() {
  return (
    <Suspense fallback={null}>
      <LegacyAdminDashboardRedirectPageContent />
    </Suspense>
  );
}

function LegacyAdminDashboardRedirectPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryString = searchParams?.toString() || "";

  useEffect(() => {
    const target = queryString
      ? `/admin/command-centre?${queryString}`
      : "/admin/command-centre";

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
      Redirecting to command centre…
    </main>
  );
}
