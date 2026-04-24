"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";
import ForumThreadRow from "@/app/components/ForumThreadRow";
import {
  isFeatureSuggestionCategory,
  loadCategoryPageData,
  requireCommunityUserId,
  type ForumCategory,
  type ForumThreadSummary,
} from "@/lib/communityForum";

const CATEGORY_FALLBACKS: Record<
  string,
  {
    name: string;
    description: string;
    emptyTitle: string;
    emptyText: string;
  }
> = {
  "general-discussion": {
    name: "General Discussion",
    description:
      "A calm place for homeschool families to share wins, ask everyday questions, and encourage one another.",
    emptyTitle: "Be the first to start this conversation",
    emptyText:
      "This is the place for everyday homeschool conversation, practical questions, and warm encouragement.",
  },
  "planning-ideas": {
    name: "Planning Ideas",
    description:
      "Talk about planning rhythms, year levels, and how families structure learning across the week.",
    emptyTitle: "Start the first planning discussion",
    emptyText:
      "Ask about weekly planning, year levels, and how other families organise their learning.",
  },
  "homeschool-resources": {
    name: "Homeschool Resources",
    description:
      "Share and discover useful homeschool resources, tools, printables, and curriculum ideas.",
    emptyTitle: "Be the first to share a helpful resource",
    emptyText:
      "Useful recommendations, printables, tools, and curriculum ideas can begin here.",
  },
  "classical-education": {
    name: "Classical Education",
    description:
      "Discuss classical education approaches, great books, memory work, and structured learning rhythms.",
    emptyTitle: "Start the first classical education discussion",
    emptyText:
      "A calm place to discuss classical approaches, great books, memory work, and structured rhythms.",
  },
  "getting-started": {
    name: "Getting Started",
    description:
      "A gentle starting point for parents who are just beginning and want calm, practical advice without noise or overwhelm.",
    emptyTitle: "Ask the first beginner question",
    emptyText:
      "This category is for new families who need a simple, safe starting point.",
  },
  "christian-homeschooling": {
    name: "Christian Homeschooling",
    description:
      "Discuss Bible learning, Christian parenting, faith conversations, prayer, memory verses, and family discipleship.",
    emptyTitle: "Start the first faith discussion",
    emptyText:
      "A gentle space for Christian homeschool families to share faith-based ideas and encouragement.",
  },
  "help-shape-edudecks": {
    name: "Help Shape MyLearna",
    description:
      "Share feature ideas, pain points, and practical suggestions that would make MyLearna more helpful for real families.",
    emptyTitle: "Share the first MyLearna idea",
    emptyText:
      "Tell us what would help your family most and why it matters.",
  },
};

function getFallbackCategory(slug: string) {
  return (
    CATEGORY_FALLBACKS[slug] || {
      name: "Community",
      description:
        "A calm, structured place to start or continue a thoughtful homeschool discussion.",
      emptyTitle: "Start the first discussion",
      emptyText:
        "This category is ready for the first thoughtful conversation.",
    }
  );
}

export default function CommunityCategoryPage() {
  const params = useParams<{ categorySlug: string }>();
  const slug = String(params?.categorySlug ?? "");

  const [category, setCategory] = useState<ForumCategory | null>(null);
  const [threads, setThreads] = useState<ForumThreadSummary[]>([]);
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fallback = useMemo(() => getFallbackCategory(slug), [slug]);
  const composeHref = `/community/new?category=${encodeURIComponent(slug)}`;

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const userId = await requireCommunityUserId();
        const data = await loadCategoryPageData(slug, userId);

        if (!mounted) return;

        setViewerId(userId);
        setCategory(
          data.category ||
            ({
              id: slug,
              slug,
              name: fallback.name,
              description: fallback.description,
              created_at: new Date().toISOString(),
            } as ForumCategory),
        );

        if (data.threads?.length) {
          setThreads(data.threads);
        } else {
          setThreads([]);
        }
      } catch (error) {
        console.error("Community category load failed", error);

        if (!mounted) return;

        setViewerId(null);
        setCategory({
          id: slug,
          slug,
          name: fallback.name,
          description: fallback.description,
          created_at: new Date().toISOString(),
        } as ForumCategory);
        setThreads([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, [fallback.description, fallback.name, slug]);

  const resolvedCategory = category || ({
    id: slug,
    slug,
    name: fallback.name,
    description: fallback.description,
    created_at: new Date().toISOString(),
  } as ForumCategory);
  const isFeatureCategory = isFeatureSuggestionCategory(resolvedCategory);
  const canStartDiscussion = Boolean(viewerId);

  return (
    <FamilyTopNavShell
      title="MyLearna Family"
      subtitle="Community"
      heroTitle={resolvedCategory.name}
      heroText={resolvedCategory.description}
      hideHeroAside={true}
      workflowHelperText="Community categories stay calm and readable: a clear title, recent discussions, and one simple path to start a new thread."
    >
      <section
        style={{
          border: "1px solid #e5e7eb",
          background: "#ffffff",
          borderRadius: 22,
          padding: 20,
          boxShadow: "0 10px 30px rgba(15,23,42,0.04)",
          marginBottom: 18,
          display: "grid",
          gap: 14,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: 1.1,
                textTransform: "uppercase",
                color: "#64748b",
                marginBottom: 8,
              }}
            >
              Category
            </div>
            <div style={{ fontSize: 28, lineHeight: 1.15, fontWeight: 900, color: "#0f172a" }}>
              {resolvedCategory.name}
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.7, color: "#475569", marginTop: 8, maxWidth: 760 }}>
              {resolvedCategory.description}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link
              href="/community"
              style={{
                border: "1px solid #d1d5db",
                background: "#ffffff",
                color: "#334155",
                borderRadius: 10,
                padding: "10px 14px",
                fontSize: 14,
                fontWeight: 800,
                textDecoration: "none",
              }}
            >
              Back to categories
            </Link>
            {canStartDiscussion ? (
              <Link
                href={composeHref}
                style={{
                  border: "1px solid #2563eb",
                  background: "#2563eb",
                  color: "#ffffff",
                  borderRadius: 10,
                  padding: "10px 14px",
                  fontSize: 14,
                  fontWeight: 800,
                  textDecoration: "none",
                }}
              >
                {isFeatureCategory ? "Start a discussion" : "Start a discussion"}
              </Link>
            ) : (
              <span
                style={{
                  border: "1px solid #d1d5db",
                  background: "#f8fafc",
                  color: "#64748b",
                  borderRadius: 10,
                  padding: "10px 14px",
                  fontSize: 14,
                  fontWeight: 800,
                  display: "inline-flex",
                }}
              >
                Sign in to start a conversation
              </span>
            )}
          </div>
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
          Loading threads...
        </section>
      ) : threads.length === 0 ? (
        <section
          style={{
            border: "1px solid #e5e7eb",
            background: "#ffffff",
            borderRadius: 20,
            padding: 24,
            display: "grid",
            gap: 10,
          }}
        >
          <div style={{ fontSize: 20, fontWeight: 900, color: "#0f172a" }}>
            {fallback.emptyTitle}
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.7, color: "#475569" }}>
            {fallback.emptyText}
          </div>
          <div>
            {canStartDiscussion ? (
              <Link
                href={composeHref}
                style={{
                  border: "1px solid #2563eb",
                  background: "#2563eb",
                  color: "#ffffff",
                  borderRadius: 10,
                  padding: "10px 14px",
                  fontSize: 14,
                  fontWeight: 800,
                  textDecoration: "none",
                  display: "inline-flex",
                }}
              >
                Start a discussion
              </Link>
            ) : (
              <span
                style={{
                  border: "1px solid #d1d5db",
                  background: "#f8fafc",
                  color: "#64748b",
                  borderRadius: 10,
                  padding: "10px 14px",
                  fontSize: 14,
                  fontWeight: 800,
                  display: "inline-flex",
                }}
              >
                Sign in to start a conversation
              </span>
            )}
          </div>
        </section>
      ) : (
        <section style={{ display: "grid", gap: 14 }}>
          {threads.map((thread) => (
            <ForumThreadRow key={thread.id} thread={thread} />
          ))}
        </section>
      )}
    </FamilyTopNavShell>
  );
}
