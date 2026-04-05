"use client";

import React from "react";
import Link from "next/link";
import SignOutButton from "@/app/components/SignOutButton";

type TeacherShellHeaderProps = {
  title: string;
  subtitle: string;
  children?: React.ReactNode;
};

export default function TeacherShellHeader({
  title,
  subtitle,
  children,
}: TeacherShellHeaderProps) {
  return (
    <section
      style={{
        border: "1px solid #dbeafe",
        borderRadius: 24,
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(239,246,255,0.96) 100%)",
        boxShadow: "0 20px 50px rgba(15,23,42,0.06)",
        padding: 20,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "start",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ maxWidth: 760 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: 1.1,
              textTransform: "uppercase",
              color: "#64748b",
              marginBottom: 10,
            }}
          >
            EduDecks Teacher
          </div>
          <div
            style={{
              fontSize: 30,
              lineHeight: 1.08,
              fontWeight: 900,
              color: "#0f172a",
              marginBottom: 10,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 14,
              lineHeight: 1.7,
              color: "#475569",
            }}
          >
            {subtitle}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          {children}
          <Link
            href="/"
            style={{
              minHeight: 42,
              borderRadius: 12,
              border: "1px solid #d1d5db",
              background: "#ffffff",
              color: "#0f172a",
              padding: "10px 14px",
              fontSize: 14,
              fontWeight: 800,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            Home
          </Link>
          <SignOutButton />
        </div>
      </div>
    </section>
  );
}
