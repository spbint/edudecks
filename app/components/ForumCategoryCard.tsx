"use client";

import React from "react";
import Link from "next/link";
import { type ForumCategorySummary } from "@/lib/communityForum";

type ForumCategoryCardProps = {
  category: ForumCategorySummary;
};

export default function ForumCategoryCard({ category }: ForumCategoryCardProps) {
  return (
    <Link
      href={`/community/category/${category.slug}`}
      style={{
        border: "1px solid #e5e7eb",
        background: "#ffffff",
        borderRadius: 20,
        padding: 18,
        boxShadow: "0 10px 30px rgba(15,23,42,0.04)",
        display: "grid",
        gap: 10,
        textDecoration: "none",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ fontSize: 20, lineHeight: 1.2, fontWeight: 900, color: "#0f172a" }}>
          {category.name}
        </div>
        <div
          style={{
            border: "1px solid #dbe3ef",
            background: "#f8fafc",
            color: "#475569",
            borderRadius: 999,
            padding: "4px 10px",
            fontSize: 12,
            fontWeight: 800,
            height: "fit-content",
          }}
        >
          {category.threadCount} threads
        </div>
      </div>

      <div style={{ fontSize: 14, lineHeight: 1.7, color: "#475569" }}>{category.description}</div>

      <div style={{ fontSize: 12, lineHeight: 1.6, color: "#64748b", fontWeight: 700 }}>
        {category.latestActivityText}
      </div>
    </Link>
  );
}
