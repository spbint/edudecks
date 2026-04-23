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

type FallbackThread = ForumThreadSummary & {
  authorLabel?: string;
  latestActivityText?: string;
  viewerSupports?: boolean;
};

function makeFallbackThread(
  thread: Omit<
    FallbackThread,
    "user_id" | "authorLabel" | "latestActivityText" | "viewerSupports"
  > & {
    user_id?: string;
    authorLabel?: string;
    latestActivityText?: string;
    viewerSupports?: boolean;
  },
): FallbackThread {
  return {
    ...thread,
    user_id: thread.user_id ?? "demo-user",
    authorLabel: thread.authorLabel ?? "MyLearna Community",
    latestActivityText: thread.latestActivityText ?? "No replies yet",
    viewerSupports: thread.viewerSupports ?? false,
  };
}

const CATEGORY_FALLBACKS: Record<
  string,
  {
    name: string;
    description: string;
    emptyTitle: string;
    emptyText: string;
    starterThreads: FallbackThread[];
  }
> = {
  "general-discussion": {
    name: "General Discussion",
    description:
      "A calm place for homeschool families to share wins, ask everyday questions, and encourage one another.",
    emptyTitle: "Be the first to start this conversation",
    emptyText:
      "This is the place for everyday homeschool conversation, practical questions, and warm encouragement.",
    starterThreads: [
      makeFallbackThread({
        id: "sample-general-1",
        category_id: "general-discussion",
        title: "What does a calm homeschool morning look like for your family?",
        body: "Share one thing that helps the day begin well.",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        replyCount: 0,
        is_pinned: true,
        status: "under_review",
        supportCount: 0,
        authorLabel: "MyLearna Community",
      }),
    ],
  },
  "planning-ideas": {
    name: "Planning Ideas",
    description:
      "Talk about planning rhythms, year levels, and how families structure learning across the week.",
    emptyTitle: "Start the first planning discussion",
    emptyText:
      "Ask about weekly planning, year levels, and how other families organise their learning.",
    starterThreads: [
      makeFallbackThread({
        id: "sample-plan-1",
        category_id: "planning-ideas",
        title: "How do you plan for multiple children at different ages?",
        body: "Share routines, tools, or simple systems that actually help.",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        replyCount: 0,
        is_pinned: true,
        status: "under_review",
        supportCount: 0,
        authorLabel: "MyLearna Community",
      }),
    ],
  },
  "resources-and-ideas": {
    name: "Resources & Ideas",
    description:
      "Share books, printables, websites, games, projects, and creative ideas that have genuinely helped your family.",
    emptyTitle: "Be the first to start this conversation",
    emptyText:
      "This is a great place to swap practical ideas, unit-study resources, and helpful learning tools.",
    starterThreads: [
      makeFallbackThread({
        id: "sample-resource-1",
        category_id: "resources-and-ideas",
        title: "Favourite free resources for Year 2 reading and writing?",
        body: "Share websites, printable packs, readers, or simple literacy ideas.",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        replyCount: 0,
        is_pinned: true,
        status: "under_review",
        supportCount: 0,
        authorLabel: "MyLearna Community",
      }),
    ],
  },
  "homeschool-resources": {
    name: "Homeschool Resources",
    description:
      "Share and discover useful homeschool resources, tools, printables, and curriculum ideas.",
    emptyTitle: "Be the first to share a helpful resource",
    emptyText:
      "Useful recommendations, printables, tools, and curriculum ideas can begin here.",
    starterThreads: [],
  },
  "classical-education": {
    name: "Classical Education",
    description:
      "Discuss classical education approaches, great books, memory work, and structured learning rhythms.",
    emptyTitle: "Start the first classical education discussion",
    emptyText:
      "A calm place to discuss classical approaches, great books, memory work, and structured rhythms.",
    starterThreads: [],
  },
  "getting-started": {
    name: "Getting Started",
    description:
      "A gentle starting point for parents who are just beginning and want calm, practical advice without noise or overwhelm.",
    emptyTitle: "Ask the first beginner question",
    emptyText:
      "This category is for new families who need a simple, safe starting point.",
    starterThreads: [
      makeFallbackThread({
        id: "sample-new-1",
        category_id: "getting-started",
        title: "What should I focus on first in my first month of homeschooling?",
        body: "Share simple advice for families just getting started.",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        replyCount: 0,
        is_pinned: true,
        status: "under_review",
        supportCount: 0,
        authorLabel: "MyLearna Community",
      }),
    ],
  },
  "christian-homeschooling": {
    name: "Christian Homeschooling",
    description:
      "Discuss Bible learning, Christian parenting, faith conversations, prayer, memory verses, and family discipleship.",
    emptyTitle: "Start the first faith discussion",
    emptyText:
      "A gentle space for Christian homeschool families to share faith-based ideas and encouragement.",
    starterThreads: [
      makeFallbackThread({
        id: "sample-faith-1",
        category_id: "christian-homeschooling",
        title: "What has helped your family build a simple Bible routine?",
        body: "Share practical ideas for keeping Christ central in the week.",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        replyCount: 0,
        is_pinned: true,
        status: "under_review",
        supportCount: 0,
        authorLabel: "MyLearna Community",
      }),
    ],
  },
  "help-shape-edudecks": {
    name: "Help Shape MyLearna",
    description:
      "Share feature ideas, pain points, and practical suggestions that would make MyLearna more helpful for real families.",
    emptyTitle: "Share the first MyLearna idea",
    emptyText:
      "Tell us what would help your family most and why it matters.",
    starterThreads: [
      makeFallbackThread({
        id: "sample-feature-1",
        category_id: "help-shape-edudecks",
        title: "A better way to compare multiple children's weekly plans",
        body: "This could help families with more than one learner see the whole week at a glance.",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        replyCount: 0,
        is_pinned: true,
        status: "under_review",
        supportCount: 3,
        authorLabel: "MyLearna Community",
      }),
    ],
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
      starterThreads: [],
    }
  );
}

export default function CommunityCategoryPage() {
  const params = useParams<{ slug: string }>();
  const slug = String(params?.slug ?? "");

  const [category, setCategory] = useState<ForumCategory | null>(null);
  const [threads, setThreads] = useState<ForumThreadSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fallback = useMemo(() => getFallbackCategory(slug), [slug]);
  const composeHref = `/community/new?category=${encodeURIComponent(slug)}`;

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const userId = await requireCommunityUserId();
        const data = await loadCategoryPageData(slug, userId ?? "demo-user");

        if (!mounted) return;

        setCategory(
          data.category ||
            ({
              id: slug,
              slug,
              name: fallback.name,
              description: fallback.description,
            } as ForumCategory),
        );

        if (data.threads?.length) {
          setThreads(data.threads);
        } else {
          setThreads(fallback.starterThreads);
        }
      } catch (error) {
        console.error("Community category load failed", error);

        if (!mounted) return;

        setCategory({
          id: slug,
          slug,
          name: fallback.name,
          description: fallback.description,
        } as ForumCategory);
        setThreads(fallback.starterThreads);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, [fallback.description, fallback.name, fallback.starterThreads, slug]);

  const resolvedCategory = category || ({
    id: slug,
    slug,
    name: fallback.name,
    description: fallback.description,
  } as ForumCategory);
  const isFeatureCategory = isFeatureSuggestionCategory(resolvedCategory);

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
