"use client";

import React, { useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthUser } from "@/app/components/AuthUserProvider";
import { hasSupabaseEnv } from "@/lib/supabaseClient";

export default function AuthRouteGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuthUser();

  const loginHref = useMemo(() => {
    const next = pathname || "/home";
    return `/login?next=${encodeURIComponent(next)}`;
  }, [pathname]);

  useEffect(() => {
    if (!hasSupabaseEnv) return;
    if (loading) return;
    if (user) return;

    router.replace(loginHref);
  }, [loading, loginHref, router, user]);

  if (hasSupabaseEnv && (loading || !user)) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#f8fafc",
          color: "#475569",
          fontSize: 14,
          fontWeight: 700,
        }}
      >
        Checking session...
      </div>
    );
  }

  return <>{children}</>;
}
