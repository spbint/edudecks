"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

type FamilyWorkflowRibbonProps = {
  currentRoute?: string;
  helperText?: string;
  style?: React.CSSProperties;
};

type WorkflowItem = {
  label: string;
  href: string;
};

const WORKFLOW_ITEMS: WorkflowItem[] = [
  { label: "Home", href: "/family" },
  { label: "Plan", href: "/planner" },
  { label: "Capture", href: "/capture" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "Reports", href: "/reports" },
];

function resolveActiveHref(pathname: string) {
  if (pathname === "/family") return "/family";
  if (pathname.startsWith("/planner")) return "/planner";
  if (pathname.startsWith("/capture")) return "/capture";
  if (pathname.startsWith("/portfolio")) return "/portfolio";
  if (pathname.startsWith("/reports")) return "/reports";
  return "";
}

export default function FamilyWorkflowRibbon({
  currentRoute,
  helperText = "Plan learning, capture it, and build your report over time.",
  style,
}: FamilyWorkflowRibbonProps) {
  const pathname = usePathname();
  const activeHref = resolveActiveHref(currentRoute || pathname);

  if (!activeHref) return null;

  return (
    <section
      style={{
        borderBottom: "1px solid #e2e8f0",
        background: "rgba(255,255,255,0.92)",
        ...style,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 1440,
          margin: "0 auto",
          padding: "12px 24px 10px",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          {WORKFLOW_ITEMS.map((item) => {
            const active = item.href === activeHref;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  minHeight: 32,
                  padding: "7px 12px",
                  borderRadius: 999,
                  border: active ? "1px solid #bfdbfe" : "1px solid transparent",
                  background: active ? "#eff6ff" : "transparent",
                  color: active ? "#1d4ed8" : "#475569",
                  textDecoration: "none",
                  fontSize: 13,
                  fontWeight: active ? 800 : 700,
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
        <div
          style={{
            marginTop: 8,
            fontSize: 12,
            lineHeight: 1.5,
            color: "#64748b",
          }}
        >
          {helperText}
        </div>
      </div>
    </section>
  );
}
