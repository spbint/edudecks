"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ClassLeftNav({ classId }: { classId: string }) {
  const pathname = usePathname();
  const [canSeeLeadership, setCanSeeLeadership] = useState<boolean>(false);

  useEffect(() => {
    const loadPermissions = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setCanSeeLeadership(false);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("is_admin, is_leader")
        .eq("id", user.id)
        .maybeSingle();

      setCanSeeLeadership(Boolean(data?.is_admin || data?.is_leader));
    };

    loadPermissions();
  }, []);

  const items = [
    { label: "Overview", href: `/classes/${classId}` },
    { label: "Squad", href: `/classes/${classId}/squad` },
    { label: "Coach Summary", href: `/classes/${classId}/summary` },
    { label: "Heatmap", href: `/classes/${classId}/heatmap` },
    { label: "Students to Monitor", href: `/classes/${classId}/interventions` },
    ...(canSeeLeadership
      ? [{ label: "Leadership", href: `/classes/${classId}/leadership` }]
      : []),
  ];

  return (
    <div
      style={{
        width: 220,
        borderRight: "1px solid #eee",
        padding: 16,
        background: "#fafafa",
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 900,
          color: "#777",
          marginBottom: 12,
        }}
      >
        CLASS NAVIGATION
      </div>

      {items.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== `/classes/${classId}` &&
            pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: "block",
              padding: "10px 12px",
              marginBottom: 6,
              borderRadius: 10,
              fontWeight: active ? 900 : 700,
              background: active ? "#eef2ff" : "transparent",
              color: "#111",
              textDecoration: "none",
            }}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
