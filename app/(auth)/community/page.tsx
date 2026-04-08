"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";
import ForumCategoryCard from "@/app/components/ForumCategoryCard";
import {
  loadCommunityHomeData,
  requireCommunityUserId,
  type ForumCategorySummary,
} from "@/lib/communityForum";

export default function CommunityHomePage() {
  const router = useRouter();
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [categories, setCategories] = useState<ForumCategorySummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const userId = await requireCommunityUserId();
      if (!userId) {
        router.replace("/login");
        return;
      }

      setViewerId(userId);
      const data = await loadCommunityHomeData(userId);
      setCategories(data.categories);
      setLoading(false);
    }

    void load();
  }, [router]);

  return (
    <FamilyTopNavShell
      title="EduDecks Family"
      subtitle="Community"
      heroTitle="Community"
      heroText="A calm place for homeschool families to ask, share, and encourage one another."
      hideHeroAside={true}
      workflowHelperText="Community is a members-only discussion space alongside the family journey. It is for thoughtful conversation, not noisy feed browsing."
    >
      <section
        style={{
          border: "1px solid #e5e7eb",
          background: "#ffffff",
          borderRadius: 22,
          padding: 20,
          boxShadow: "0 10px 30px rgba(15,23,42,0.04)",
          marginBottom: 18,
        }}
      >
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
          Members-only forum
        </div>
        <div
          style={{
            fontSize: 26,
            lineHeight: 1.15,
            fontWeight: 900,
            color: "#0f172a",
            marginBottom: 10,
          }}
        >
          You’re among families building learning one step at a time.
        </div>
        <div style={{ fontSize: 14, lineHeight: 1.7, color: "#475569", maxWidth: 820 }}>
          Browse by topic, open a discussion, and return to the threads that matter most. Community
          is structured to stay readable, supportive, and useful over time.
        </div>
      </section>

      {loading ? (
        <section
          style={{
            border: "1px solid #e5e7eb",
            background: "#ffffff",
            borderRadius: 20,
            padding: 18,
            color: "#475569",
            fontWeight: 700,
          }}
        >
          Loading community…
        </section>
      ) : (
        <section style={{ display: "grid", gap: 14 }}>
          {categories.map((category) => (
            <ForumCategoryCard key={category.id} category={category} />
          ))}
        </section>
      )}

      {!loading && viewerId ? null : null}
    </FamilyTopNavShell>
  );
}
