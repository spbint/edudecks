"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";
import ForumCategoryCard from "@/app/components/ForumCategoryCard";
import {
  loadCommunityHomeData,
  requireCommunityUserId,
  type ForumCategorySummary,
} from "@/lib/communityForum";

function panelStyle(): React.CSSProperties {
  return {
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    borderRadius: 22,
    padding: 20,
    boxShadow: "0 10px 30px rgba(15,23,42,0.04)",
    display: "grid",
    gap: 12,
  };
}

export default function CommunityHomePage() {
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [categories, setCategories] = useState<ForumCategorySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const userId = await requireCommunityUserId();
        if (!mounted) return;

        setViewerId(userId);

        if (!userId) {
          setCategories([]);
          setMessage("Sign in to browse Community.");
          return;
        }

        const data = await loadCommunityHomeData(userId);
        if (!mounted) return;

        setCategories(data.categories);
        setMessage(data.categories.length === 0 ? "Community categories are not ready yet." : "");
      } catch (error) {
        console.error("Community home load failed", error);
        if (!mounted) return;

        setCategories([]);
        setMessage(error instanceof Error ? error.message : "Community could not load.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <FamilyTopNavShell
      title="MyLearna Family"
      subtitle="Community"
      heroTitle="Community"
      heroText="Calm, structured conversations for homeschool families."
      hideHeroAside={true}
      workflowHelperText="Browse a real category, open a real discussion, and reply when you're signed in."
    >
      <section style={{ ...panelStyle(), marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "grid", gap: 8, maxWidth: 760 }}>
            <div style={{ fontSize: 20, lineHeight: 1.25, fontWeight: 900, color: "#0f172a" }}>
              One clear place for practical support
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.7, color: "#475569" }}>
              Categories keep Community calm and readable. Open the right space, start one real
              conversation, and let replies build from there.
            </div>
          </div>

          {viewerId && categories.length > 0 ? (
            <Link
              href="/community/new"
              style={{
                border: "1px solid #2563eb",
                background: "#2563eb",
                color: "#ffffff",
                borderRadius: 10,
                padding: "10px 14px",
                fontSize: 14,
                fontWeight: 800,
                textDecoration: "none",
                height: "fit-content",
              }}
            >
              Start a conversation
            </Link>
          ) : null}
        </div>
      </section>

      {loading ? (
        <section style={panelStyle()}>
          <div style={{ fontSize: 15, color: "#475569", fontWeight: 700 }}>Loading Community...</div>
        </section>
      ) : !viewerId ? (
        <section style={panelStyle()}>
          <div style={{ fontSize: 20, fontWeight: 900, color: "#0f172a" }}>Community sign-in required</div>
          <div style={{ fontSize: 14, lineHeight: 1.7, color: "#475569" }}>
            Sign in to browse Community, start a conversation, or reply to another family.
          </div>
        </section>
      ) : categories.length === 0 ? (
        <section style={panelStyle()}>
          <div style={{ fontSize: 20, fontWeight: 900, color: "#0f172a" }}>Community is not ready yet</div>
          <div style={{ fontSize: 14, lineHeight: 1.7, color: "#475569" }}>
            {message || "Community categories have not loaded from the database yet."}
          </div>
        </section>
      ) : (
        <section style={{ display: "grid", gap: 14 }}>
          {categories.map((category) => (
            <ForumCategoryCard key={category.id} category={category} />
          ))}
        </section>
      )}
    </FamilyTopNavShell>
  );
}
