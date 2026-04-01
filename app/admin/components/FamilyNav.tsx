"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type FamilyNavProps = {
  selectedChildId?: string;
};

const S = {
  shell: {
    borderBottom: "1px solid #e2e8f0",
    marginBottom: 18,
    paddingBottom: 12,
  } as React.CSSProperties,

  row: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    alignItems: "center",
  } as React.CSSProperties,

  tab: (active: boolean): React.CSSProperties => ({
    padding: "8px 14px",
    borderRadius: 10,
    background: active ? "#2563eb" : "#ffffff",
    color: active ? "#ffffff" : "#0f172a",
    border: active ? "1px solid #2563eb" : "1px solid #cbd5e1",
    fontWeight: 900,
    textDecoration: "none",
    fontSize: 13,
  }),

  action: {
    marginLeft: "auto",
    padding: "8px 12px",
    borderRadius: 10,
    background: "#16a34a",
    color: "white",
    fontWeight: 900,
    textDecoration: "none",
    fontSize: 13,
    border: "1px solid #16a34a",
  } as React.CSSProperties,
};

export default function FamilyNav({ selectedChildId = "" }: FamilyNavProps) {
  const pathname = usePathname();

  const tabs = [
    { label: "Parent Dashboard", href: "/admin/parent-dashboard" },
    { label: "Homeschool Reporting", href: "/admin/homeschool-reporting" },
    {
      label: "Selected Portfolio",
      href: selectedChildId
        ? `/admin/students/${selectedChildId}/portfolio`
        : "/admin/parent-dashboard",
    },
    {
      label: "Print Portfolio",
      href: selectedChildId
        ? `/admin/students/${selectedChildId}/portfolio-print`
        : "/admin/parent-dashboard",
    },
  ];

  return (
    <div style={S.shell}>
      <div style={S.row}>
        {tabs.map((t) => {
          const active =
            pathname === t.href || pathname.startsWith(t.href + "/");

          return (
            <Link key={t.href + t.label} href={t.href} style={S.tab(active)}>
              {t.label}
            </Link>
          );
        })}

        <Link
          href={
            selectedChildId
              ? `/admin/evidence-entry?studentId=${encodeURIComponent(selectedChildId)}`
              : "/admin/evidence-entry"
          }
          style={S.action}
        >
          + Evidence
        </Link>
      </div>
    </div>
  );
}