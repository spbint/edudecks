"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";
import {
  buildCommunityCategoryHref,
  buildCommunityThreadHref,
  loadCommunityHomeData,
  requireCommunityUserId,
  type ForumCategorySummary,
} from "@/lib/communityForum";

type CommunityThreadPreview = {
  id: string;
  categorySlug?: string;
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
  primaryLabel: string;
  emptyStateLabel: string;
};

const FALLBACK_CATEGORIES: CommunityCategoryCard[] = [
  {
    id: "general-discussion",
    slug: "general-discussion",
    name: "General Discussion",
    description:
      "A calm place for homeschool families to share wins, ask everyday questions, and encourage one another.",
    tone: "Ask, share, encourage",
    threadCount: 0,
    primaryLabel: "Join discussion",
    emptyStateLabel: "Be the first to start this conversation",
    latestThreads: [],
  },
  {
    id: "planning-ideas",
    slug: "planning-ideas",
    name: "Planning Ideas",
    description:
      "Talk about planning rhythms, year levels, and how families structure learning across the week.",
    tone: "Plan with confidence",
    threadCount: 0,
    primaryLabel: "Join discussion",
    emptyStateLabel: "Be the first to start this conversation",
    latestThreads: [],
  },
  {
    id: "resources-and-ideas",
    slug: "resources-and-ideas",
    name: "Resources & Ideas",
    description:
      "Share printable resources, websites, books, games, projects, field trip ideas, and creative learning tools.",
    tone: "Swap useful ideas",
    threadCount: 0,
    primaryLabel: "Share a resource",
    emptyStateLabel: "Be the first to start this conversation",
    latestThreads: [],
  },
  {
    id: "homeschool-resources",
    slug: "homeschool-resources",
    name: "Homeschool Resources",
    description:
      "Share and discover useful homeschool resources, tools, printables, and curriculum ideas.",
    tone: "Share what helps",
    threadCount: 0,
    primaryLabel: "Share a resource",
    emptyStateLabel: "Be the first to share a helpful resource",
    latestThreads: [],
  },
  {
    id: "classical-education",
    slug: "classical-education",
    name: "Classical Education",
    description:
      "Discuss classical education approaches, great books, memory work, and structured learning rhythms.",
    tone: "Structured learning",
    threadCount: 0,
    primaryLabel: "Join discussion",
    emptyStateLabel: "Start the first classical education discussion",
    latestThreads: [],
  },
  {
    id: "getting-started",
    slug: "getting-started",
    name: "Getting Started",
    description:
      "A gentle starting point for families beginning the homeschool journey and wanting practical advice without pressure or noise.",
    tone: "A gentle first step",
    threadCount: 0,
    primaryLabel: "Join discussion",
    emptyStateLabel: "Be the first to start this conversation",
    latestThreads: [],
  },
  {
    id: "christian-homeschooling",
    slug: "christian-homeschooling",
    name: "Faith & Family",
    description:
      "Discuss Bible learning, Christian parenting, prayer, memory verses, and how faith shapes homeschool life.",
    tone: "Encourage one another",
    threadCount: 0,
    primaryLabel: "Join discussion",
    emptyStateLabel: "Be the first to start this conversation",
    latestThreads: [],
  },
  {
    id: "help-shape-edudecks",
    slug: "help-shape-edudecks",
    name: "Help Shape MyLearna",
    description:
      "Help shape MyLearna by sharing feature ideas, pain points, and practical suggestions that would make the platform more helpful.",
    tone: "Help shape MyLearna",
    threadCount: 0,
    primaryLabel: "Help shape MyLearna",
    emptyStateLabel: "Be the first to start this conversation",
    latestThreads: [],
  },
];

async function withTimeout<T>(promise: Promise<T>, label: string, ms = 3500): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
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

  const name =
    category.name === "Help Shape EduDecks"
      ? "Help Shape MyLearna"
      : category.name;

  return {
    id: String(category.id),
    slug,
    name,
    description:
      name === "Help Shape MyLearna"
        ? "Help shape MyLearna by sharing feature ideas, pain points, and practical suggestions that would make the platform more helpful."
        : category.description,
    tone:
      name === "Help Shape MyLearna"
        ? "Help shape MyLearna"
        : fallback?.tone || "Join the conversation",
    threadCount: typeof category.threadCount === "number" ? category.threadCount : fallback?.threadCount || 0,
    latestThreads: Array.isArray(category.latestThreads) && category.latestThreads.length
      ? category.latestThreads.slice(0, 2)
      : fallback?.latestThreads || [],
    primaryLabel: fallback?.primaryLabel || "Join discussion",
    emptyStateLabel: fallback?.emptyStateLabel || "Be the first to start this conversation",
  };
}

function CategoryCard({
  category,
  canStartDiscussion,
}: {
  category: CommunityCategoryCard;
  canStartDiscussion: boolean;
}) {
  const hasThreads = category.latestThreads.length > 0;
  const composeHref = `/community/new?category=${encodeURIComponent(category.slug)}`;

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

      <div style={{ fontSize: 14, lineHeight: 1.7, color: "#475569" }}>{category.description}</div>

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
              href={buildCommunityThreadHref(thread.categorySlug || category.slug, thread.id)}
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
              {category.emptyStateLabel}
            </div>
            {canStartDiscussion ? (
              <Link
                href={composeHref}
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
            ) : (
              <span
                style={{
                  width: "fit-content",
                  border: "1px solid #d1d5db",
                  background: "#f8fafc",
                  color: "#64748b",
                  borderRadius: 10,
                  padding: "10px 14px",
                  fontSize: 14,
                  fontWeight: 800,
                }}
              >
                Sign in to start a conversation
              </span>
            )}
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {hasThreads || canStartDiscussion ? (
          <Link
            href={hasThreads ? buildCommunityCategoryHref(category.slug) : composeHref}
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
            {hasThreads ? category.primaryLabel : "Start a discussion"}
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
            }}
          >
            Sign in to start a conversation
          </span>
        )}

        <Link
          href={buildCommunityCategoryHref(category.slug)}
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
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);

      try {
        const userId = await withTimeout(requireCommunityUserId(), "community user", 2000).catch(() => null);

        if (!mounted) return;

        setViewerId(userId);

        if (!userId) {
          setCategories(FALLBACK_CATEGORIES);
          setMessage("Sign in to start a conversation.");
          return;
        }

        const data = await withTimeout(loadCommunityHomeData(userId), "community home", 2500).catch(() => null);

        if (!mounted) return;

        if (data?.categories?.length) {
          setCategories(data.categories.map(normalizeCategory));
          setMessage("");
        } else {
          setCategories(FALLBACK_CATEGORIES);
          setMessage("");
        }
      } catch (error) {
        console.error("Community home load failed", error);

        if (!mounted) return;

        setViewerId(null);
        setCategories(FALLBACK_CATEGORIES);
        setMessage("Community is not loading just yet. Please try again in a moment.");
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
      { label: "Ask a question", href: "/community/new?category=general-discussion" },
      { label: "Share a resource", href: "/community/new?category=homeschool-resources" },
      { label: "Help shape MyLearna", href: "/community/new?category=help-shape-edudecks" },
    ],
    [],
  );
  const canStartDiscussion = Boolean(viewerId);

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
          Share ideas, ask questions, post resources, and encourage other parents in the category
          that fits best.
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {canStartDiscussion ? (
            featuredActions.map((action, index) => (
              <Link
                key={action.label}
                href={action.href}
                style={{
                  border: index === 0 ? "1px solid #2563eb" : "1px solid #d1d5db",
                  background: index === 0 ? "#2563eb" : "#ffffff",
                  color: index === 0 ? "#ffffff" : "#334155",
                  borderRadius: 10,
                  padding: "10px 14px",
                  fontSize: 14,
                  fontWeight: 800,
                  textDecoration: "none",
                }}
              >
                {action.label}
              </Link>
            ))
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
              }}
            >
              Sign in to start a conversation.
            </span>
          )}
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
          <CategoryCard key={category.id} category={category} canStartDiscussion={canStartDiscussion} />
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
