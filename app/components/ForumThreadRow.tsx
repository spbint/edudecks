"use client";

import React from "react";
import Link from "next/link";
import { relativeTime, type ForumThreadSummary } from "@/lib/communityForum";

type ForumThreadRowProps = {
  thread: ForumThreadSummary;
};

export default function ForumThreadRow({ thread }: ForumThreadRowProps) {
  return (
    <Link
      href={`/community/thread/${thread.id}`}
      style={{
        border: "1px solid #e5e7eb",
        background: "#ffffff",
        borderRadius: 18,
        padding: 16,
        boxShadow: "0 10px 30px rgba(15,23,42,0.04)",
        display: "grid",
        gap: 10,
        textDecoration: "none",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            {thread.is_pinned ? (
              <span
                style={{
                  border: "1px solid #bfdbfe",
                  background: "#eff6ff",
                  color: "#1d4ed8",
                  borderRadius: 999,
                  padding: "4px 8px",
                  fontSize: 11,
                  fontWeight: 900,
                }}
              >
                Pinned
              </span>
            ) : null}
            <div style={{ fontSize: 18, lineHeight: 1.25, fontWeight: 900, color: "#0f172a" }}>
              {thread.title}
            </div>
          </div>

          <div style={{ fontSize: 14, lineHeight: 1.65, color: "#475569" }}>
            {thread.body.length > 180 ? `${thread.body.slice(0, 180)}…` : thread.body}
          </div>
        </div>

        <div style={{ fontSize: 12, lineHeight: 1.6, color: "#64748b", fontWeight: 700 }}>
          {thread.authorLabel} · {relativeTime(thread.created_at)}
        </div>
      </div>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 13, color: "#64748b", fontWeight: 700 }}>
        <span>{thread.replyCount} replies</span>
        <span>{thread.latestActivityText}</span>
      </div>
    </Link>
  );
}
