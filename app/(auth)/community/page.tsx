"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";
import {
  loadCommunityHomeData,
  requireCommunityUserId,
  type ForumCategorySummary,
} from "@/lib/communityForum";

type CommunityThreadPreview = {
  id: string;
  title: string;
  replyCount: number;
  relativeTime: string;
};

type CommunityCategoryCard = {
  id: string;
  slug: string;
  name: string;
  description: string;
  tone: string;
  threadCount: number;
  latestThreads: CommunityThreadPreview[];
};

const FALLBACK_CATEGORIES: CommunityCategoryCard[] = [
  {
    id: "general-discussion",
    slug: "general-discussion",
    name: "General Discussion",
    description:
      "A calm place for homeschool families to share wins, ask everyday questions, and encourage one another.",
    tone: "Ask, share, encourage",
    threadCount: 18,
    latestThreads: [
      {
        id: "fallback-general-1",
        title: "What does a calm homeschool morning look like in your home?",
        replyCount: 7,
        relativeTime: "3 hours ago",
      },
      {
        id: "fallback-general-2",
        title: "What helped your family settle into this week well?",
        replyCount: 4,
        relativeTime: "1 day ago",
      },
    ],
  },
  {
    id: "planning-and-routines",
    slug: "planning-ideas",
    name: "Planning & Routines",
    description:
      "Talk about planning rhythms, year levels, and how families structure learning across the week.",
    tone: "Plan with confidence",
    threadCount: 24,
    latestThreads: [
      {
        id: "fallback-planning-1",
        title: "How do you plan for multiple children at different ages?",
        replyCount: 10,
        relativeTime: "5 hours ago",
      },
      {
        id: "fallback-planning-2",
        title: "What does a realistic weekly rhythm look like for your family?",
        replyCount: 6,
        relativeTime: "2 days ago",
      },
    ],
  },
  {
    id: "resources-and-ideas",
    slug: "resources-and-ideas",
    name: "Resources & Ideas",
    description:
      "Share printable resources, websites, books, games, projects, field trip ideas, and creative learning tools.",
    tone: "Swap useful ideas",
    threadCount: 31,
    latestThreads: [
      {
        id: "fallback-resources-1",
        title: "Favourite free resources for Year 2 reading and writing?",
        replyCount: 12,
        relativeTime: "2 hours ago",
      },
      {
        id: "fallback-resources-2",
        title: "Which science videos or kits have worked especially well lately?",
        replyCount: 5,
        relativeTime: "1 day ago",
      },
    ],
  },
  {
    id: "new-to-homeschooling",
    slug: "getting-started",
    name: "New to Homeschooling",
    description:
      "A gentle starting point for families beginning the homeschool journey and wanting practical advice without pressure or noise.",
    tone: "A gentle first step",
    threadCount: 15,
    latestThreads: [
      {
        id: "fallback-starting-1",
        title: "What should I focus on in my first month of homeschooling?",
        replyCount: 8,
        relativeTime: "6 hours ago",
      },
    ],
  },
  {
    id: "faith-and-family",
    slug: "christian-homeschooling",
    name: "Faith & Family",
    description:
      "Discuss Bible learning, Christian parenting, prayer, memory verses, and how faith shapes homeschool life.",
    tone: "Encourage one another",
    threadCount: 12,
    latestThreads: [
      {
        id: "fallback-faith-1",
        title: "How do you build a simple Bible rhythm into the week?",
        replyCount: 4,
        relativeTime: "1 day ago",
      },
    ],
  },
  {
    id: "feature-suggestions",
    slug: "help-shape-edudecks",
    name: "Feature Suggestions",
    description:
      "Help shape MyLearna by sharing feature ideas, pain points, and practical suggestions that would make the platform more helpful.",
    tone: "Help shape MyLearna",
    threadCount: 9,
    latestThreads: [
      {
        id: "fallback-feature-1",
        title: "A better way to compare multiple children's weekly plans",
        replyCount: 3,
        relativeTime: "8 hours ago",
      },
    ],
  },
];

async function withTimeout<T>(
  promise: Promise<T>,
  label: string,
  ms = 3500,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error(`${label} timed out after ${ms}ms`));
        }, ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function normalizeCategory(category: ForumCategorySummary): CommunityCategoryCard {
  const slug =
    typeof (category as { slug?: unknown }).slug === "string" &&
    (category as { slug?: string }).slug
      ? String((category as { slug?: string }).slug)
      : String(category.id);

  const fallback =
    FALLBACK_CATEGORIES.find((item) => item.slug === slug) ||
    FALLBACK_CATEGORIES.find((item) => item.id === String(category.id));

  return {
    id: String(category.id),
    slug,
    name:
      category.name === "Feature Suggestions"
        ? "Help Shape MyLearna"
        : category.name,
    description:
      category.name === "Feature Suggestions"
        ? "Share feature ideas, pain points, and practical suggestions that would make MyLearna more helpful for real families."
        : category.description,
    tone:
      category.name === "Feature Suggestions"
        ? "Help shape MyLearna"
        : fallback?.tone || "Join the conversation",
    threadCount:
      typeof (category as { threadCount?: unknown }).threadCount === "number"
        ? Number((category as { threadCount?: number }).threadCount)
        : fallback?.threadCount || 0,
    latestThreads:
      Array.isArray((category as { latestThreads?: unknown }).latestThreads) &&
      (category as { latestThreads?: CommunityThreadPreview[] }).latestThreads?.length
        ? ((category as { latestThreads?: CommunityThreadPreview[] }).latestThreads ?? []).slice(0, 2)
        : fallback?.latestThreads || [],
  };
}

function CategoryCard({ category }: { category: CommunityCategoryCard }) {
  const hasThreads = category.latestThreads.length > 0;

  return (
    <article
      style={{
        border: "1px solid #e5e7eb",
        background: "#ffffff",
        borderRadius: 22,
        padding: 20,
        boxShadow: "0 10px 30px rgba(15,23,42,0.04)",
        display: "grid",
        gap: 14,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "grid", gap: 8 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: 1.1,
              textTransform: "uppercase",
              color: "#64748b",
            }}
          >
            {category.tone}
          </div>

          <div
            style={{
              fontSize: 24,
              lineHeight: 1.15,
              fontWeight: 900,
              color: "#0f172a",
            }}
          >
            {category.name}
          </div>
        </div>

        <div
          style={{
            border: "1px solid #dbeafe",
            background: "#eff6ff",
            color: "#1d4ed8",
            borderRadius: 999,
            padding: "7px 12px",
            fontSize: 12,
            fontWeight: 800,
            whiteSpace: "nowrap",
          }}
        >
          {category.threadCount} thread{category.threadCount === 1 ? "" : "s"}
        </div>
      </div>

      <div
        style={{
          fontSize: 14,
          lineHeight: 1.7,
          color: "#475569",
        }}
      >
        {category.description}
      </div>

      <div
        style={{
          borderTop: "1px solid #eef2f7",
          paddingTop: 12,
          display: "grid",
          gap: 10,
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 900,
            letterSpacing: 1,
            textTransform: "uppercase",
            color: "#64748b",
          }}
        >
          Latest discussion
        </div>

        {hasThreads ? (
          category.latestThreads.map((thread) => (
            <Link
              key={thread.id}
              href={`/community/category/${category.slug}`}
              style={{
                textDecoration: "none",
                border: "1px solid #e2e8f0",
                background: "#f8fafc",
                borderRadius: 16,
                padding: 14,
                display: "grid",
                gap: 6,
              }}
            >
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  color: "#0f172a",
                  lineHeight: 1.45,
                }}
              >
                {thread.title}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "#64748b",
                  lineHeight: 1.5,
                }}
              >
                {thread.replyCount} repl{thread.replyCount === 1 ? "y" : "ies"} • {thread.relativeTime}
              </div>
            </Link>
          ))
        ) : (
          <div
            style={{
              border: "1px dashed #dbe2ea",
              background: "#f8fafc",
              borderRadius: 16,
              padding: 16,
              display: "grid",
              gap: 8,
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "#334155",
              }}
            >
              Be the first to start this conversation
            </div>
            <Link
              href={`/community/category/${category.slug}`}
              style={{
                width: "fit-content",
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
              Start a discussion
            </Link>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Link
          href={`/community/category/${category.slug}`}
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
          {hasThreads ? "Join discussion" : "Start a discussion"}
        </Link>

        <Link
          href={`/community/category/${category.slug}`}
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
          Browse all
        </Link>
      </div>
    </article>
  );
}

export default function CommunityHomePage() {
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [categories, setCategories] = useState<CommunityCategoryCard[]>(FALLBACK_CATEGORIES);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(
    "Starter categories are being shown so the community feels ready from first visit.",
  );

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);

      try {
        const userId = await withTimeout(
          requireCommunityUserId(),
          "community user",
          2000,
        ).catch(() => null);

        if (!mounted) return;

        setViewerId(userId ?? "demo-user");

        if (!userId) {
          setCategories(FALLBACK_CATEGORIES);
          setMessage(
            "Starter categories are being shown while live community sign-in settles.",
          );
          return;
        }

        const data = await withTimeout(
          loadCommunityHomeData(userId),
          "community home",
          2500,
        ).catch(() => null);

        if (!mounted) return;

        if (data?.categories?.length) {
          setCategories(data.categories.map(normalizeCategory));
          setMessage("");
        } else {
          setCategories(FALLBACK_CATEGORIES);
          setMessage(
            "Starter categories are being shown while the first live discussions are prepared.",
          );
        }
      } catch (error) {
        console.error("Community home load failed", error);

        if (!mounted) return;

        setViewerId("demo-user");
        setCategories(FALLBACK_CATEGORIES);
        setMessage(
          "Starter categories are being shown while the community connection settles.",
        );
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  const featuredActions = useMemo(
    () => [
      {
        label: "Ask a question",
        href: "/community/category/general-discussion",
      },
      {
        label: "Share a resource",
        href: "/community/category/resources-and-ideas",
      },
      {
        label: "Help shape MyLearna",
        href: "/community/category/help-shape-edudecks",
      },
    ],
    [],
  );

  return (
    <FamilyTopNavShell
      title="MyLearna Family"
      subtitle="Community"
      heroTitle="Community"
      heroText="Ask about planning, resources, and everyday homeschool life with families walking a similar journey."
      hideHeroAside={true}
      workflowHelperText="Community is a calm forum space with clear categories, readable threads, and practical parent-friendly starting points."
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
          gap: 12,
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 900,
            letterSpacing: 1.1,
            textTransform: "uppercase",
            color: "#64748b",
          }}
        >
          Members forum
        </div>

        <div
          style={{
            fontSize: 28,
            lineHeight: 1.15,
            fontWeight: 900,
            color: "#0f172a",
          }}
        >
          A real forum for homeschool families
        </div>

        <div
          style={{
            fontSize: 14,
            lineHeight: 1.75,
            color: "#475569",
            maxWidth: 860,
          }}
        >
          Share ideas, ask questions, post resources, encourage other parents,
          and start thoughtful discussions in the category that fits best.
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {featuredActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
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
              {action.label}
            </Link>
          ))}
        </div>

        {message ? (
          <div
            style={{
              border: "1px solid #dbeafe",
              background: "#eff6ff",
              borderRadius: 14,
              padding: "12px 14px",
              fontSize: 13,
              fontWeight: 700,
              color: "#1d4ed8",
            }}
          >
            {message}
          </div>
        ) : null}
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
          gap: 16,
        }}
      >
        {categories.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </section>

      {loading ? (
        <div
          style={{
            marginTop: 14,
            fontSize: 13,
            fontWeight: 700,
            color: "#64748b",
          }}
        >
          Refreshing live community data...
        </div>
      ) : null}

      {!loading && viewerId ? null : null}
    </FamilyTopNavShell>
  );
}
