"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import CleanAccountMenu from "@/app/components/clean/CleanAccountMenu";

type HeaderNavItem = {
  label: string;
  href: string;
  matches: string[];
};

const sectionStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 20,
  background: "#ffffff",
  padding: 16,
  boxShadow: "0 10px 24px rgba(15,23,42,0.04)",
};

const navItems: HeaderNavItem[] = [
  { label: "Today", href: "/my-day", matches: ["/my-day", "/clean-my-day"] },
  {
    label: "Plan",
    href: "/my-calendar",
    matches: ["/my-calendar", "/clean-my-calendar"],
  },
  {
    label: "Programs",
    href: "/my-programs",
    matches: ["/my-programs", "/clean-my-programs"],
  },
  {
    label: "Capture",
    href: "/my-capture",
    matches: ["/my-capture", "/clean-my-capture"],
  },
  {
    label: "Portfolio",
    href: "/my-portfolio",
    matches: ["/my-portfolio", "/clean-my-portfolio"],
  },
  {
    label: "Reports",
    href: "/my-reports",
    matches: ["/my-reports", "/my-outputs", "/clean-my-reports", "/clean-my-outputs"],
  },
];

function matchesPath(pathname: string, candidate: string) {
  return pathname === candidate || pathname.startsWith(`${candidate}/`);
}

export default function CleanAppHeader() {
  const pathname = usePathname();

  return (
    <section style={sectionStyle}>
      <div style={{ display: "grid", gap: 14 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/my-day"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              textDecoration: "none",
              color: "#0f172a",
              minWidth: 0,
            }}
          >
            <Image
              src="/branding/MyLearna Logo.png"
              alt="MyLearna"
              width={1916}
              height={821}
              priority
              style={{
                width: "clamp(132px, 20vw, 172px)",
                maxWidth: "100%",
                height: "auto",
                display: "block",
              }}
            />
            <span
              style={{
                display: "grid",
                gap: 2,
                minWidth: 0,
              }}
            >
              <span style={{ color: "#0f172a", fontSize: 14, fontWeight: 800 }}>
                MyLearna
              </span>
              <span style={{ color: "#64748b", fontSize: 12, lineHeight: 1.4 }}>
                Guided home learning
              </span>
            </span>
          </Link>

          <CleanAccountMenu />
        </div>

        <nav aria-label="App sections" style={{ overflowX: "auto", paddingBottom: 2 }}>
          <div
            style={{
              display: "flex",
              gap: 8,
              minWidth: "max-content",
              flexWrap: "nowrap",
            }}
          >
            {navItems.map((item) => {
              const isCurrent = item.matches.some((candidate) =>
                matchesPath(pathname, candidate),
              );

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isCurrent ? "page" : undefined}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 999,
                    border: isCurrent ? "1px solid #1d4ed8" : "1px solid #dbeafe",
                    background: isCurrent ? "#eff6ff" : "#ffffff",
                    color: isCurrent ? "#1d4ed8" : "#334155",
                    padding: "8px 12px",
                    fontSize: 13,
                    fontWeight: 700,
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* TODO: outputs and report grouping can sit in the header nav later if the flow needs it. */}
      </div>
    </section>
  );
}
