"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";
import {
  loadCommunityHomeData,
  requireCommunityUserId,
  type ForumCategorySummary,
} from "@/lib/communityForum";

type CommunityCategoryCard = {
  id: string;
  slug: string;
  name: string;
  description: string;
  starterPrompt: string;
  ctaLabel: string;
  tone: string;
  threadCount: number;
  latestThreadTitle: string;
  latestThreadMeta: string;
};

const FALLBACK_CATEGORIES: CommunityCategoryCard[] = [
  {
    id: "general-discussion",
    slug: "general-discussion",
    name: "General Discussion",
    description:
      "A calm place for homeschool families to share wins, ask everyday questions, and encourage one another.",
    starterPrompt:
      "Start with a simple question, a quick encouragement, or something your family is navigating this week.",
    ctaLabel: "Open discussion",
    tone: "Ask, share, encourage",
    threadCount: 18,
    latestThreadTitle: "What does a calm homeschool morning look like in your home?",
    latestThreadMeta: "Latest: routines, breakfast, and peaceful starts",
  },
  {
    id: "curriculum-and-planning",
    slug: "curriculum-and-planning",
    name: "Curriculum & Planning",
    description:
      "Talk about curriculum choices, planning rhythms, year levels, and how families structure learning across the week.",
    starterPrompt:
      "Ask how other parents plan a week, structure a day, or choose resources for a particular age or year level.",
    ctaLabel: "Open planning forum",
    tone: "Plan with confidence",
    threadCount: 24,
    latestThreadTitle: "How do you plan for multiple children at different ages?",
    latestThreadMeta: "Latest: loops, blocks, and gentle structure",
  },
  {
    id: "resources-and-ideas",
    slug: "resources-and-ideas",
    name: "Resources & Ideas",
    description:
      "Share printable resources, websites, books, games, projects, field trip ideas, and creative learning tools.",
    starterPrompt:
      "Share something that worked well for your child, or ask for help finding a resource for a specific topic.",
    ctaLabel: "Open resource forum",
    tone: "Swap useful ideas",
    threadCount: 31,
    latestThreadTitle: "Favourite free resources for Year 2 reading and writing?",
    latestThreadMeta: "Latest: websites, readers, and printable packs",
  },
  {
    id: "new-to-homeschooling",
    slug: "new-to-homeschooling",
    name: "New to Homeschooling",
    description:
      "A gentle starting point for families beginning the homeschool journey and wanting practical advice without pressure or noise.",
    starterPrompt:
      "Ask your first question here, from getting started and routines to curriculum, confidence, or what a normal week can look like.",
    ctaLabel: "Open starter forum",
    tone: "A gentle first step",
    threadCount: 15,
    latestThreadTitle: "What should I focus on in my first month of homeschooling?",
    latestThreadMeta: "Latest: first steps, confidence, and simple priorities",
  },
  {
    id: "faith-and-family",
    slug: "faith-and-family",
    name: "Faith & Family",
    description:
      "Discuss Bible learning, Christian parenting, prayer, memory verses, and how faith shapes homeschool life.",
    starterPrompt:
      "Share ideas for Bible time, memory verses, faith conversations, or how your family keeps Christ central in the week.",
    ctaLabel: "Open faith forum",
    tone: "Encourage one another",
    threadCount: 12,
    latestThreadTitle: "How do you build a simple Bible rhythm into the week?",
    latestThreadMeta: "Latest: family devotions and memory work",
  },
  {
    id: "feature-suggestions",
    slug: "feature-suggestions",
    name: "Feature Suggestions",
    description:
      "Help shape EduDecks by sharing feature ideas, pain points, and practical suggestions that would make the platform more helpful.",
    starterPrompt:
      "Tell us what would help your family most, what problem it would solve, and how it would improve your workflow.",
    ctaLabel: "Open feature forum",
    tone: "Help build EduDecks",
    threadCount: 9,
    latestThreadTitle: "A better way to compare multiple children’s weekly plans",
    latestThreadMeta: "Latest: support, triage, and family-level visibility",
  },
  {
    id: "classical-education",
    slug: "classical-education",
    name: "Classical Education",
    description:
      "Explore classical education, Charlotte Mason, Great Books, and time-tested approaches to learning.",
    starterPrompt:
      "How do you practically implement classical education at home without overwhelm?",
    ctaLabel: "Open classical forum",
    tone: "Classical approaches",
    threadCount: 0,
    latestThreadTitle: "Start the first classical education discussion",
    latestThreadMeta: "Ready for the first conversation",
  },
  {
    id: "special-needs",
    slug: "special-needs",
    name: "Special Needs & Diverse Learners",
    description:
      "Support for children with additional needs, different learning styles, and personalised learning approaches.",
    starterPrompt:
      "What has helped your child thrive when traditional learning approaches didn’t work?",
    ctaLabel: "Open support forum",
    tone: "Personalised support",
    threadCount: 0,
    latestThreadTitle: "Start the first diverse learners discussion",
    latestThreadMeta: "Ready for the first conversation",
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

function normalizeCategory(
  category: ForumCategorySummary,
): CommunityCategoryCard {
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
    name: category.name,
    description: category.description,
    starterPrompt:
      fallback?.starterPrompt ||
      "Start with a question, a resource, or a practical idea that could help another family.",
    ctaLabel: fallback?.ctaLabel || "Open forum",
    tone: fallback?.tone || "Join the conversation",
    threadCount:
      typeof (category as { thread_count?: unknown }).thread_count === "number"
        ? Number((category as { thread_count?: number }).thread_count)
        : fallback?.threadCount || 0,
    latestThreadTitle:
      (typeof (category as { latest_thread_title?: unknown }).latest_thread_title ===
      "string"
        ? String((category as { latest_thread_title?: string }).latest_thread_title)
        : "") || fallback?.latestThreadTitle || "Start the first thread here",
    latestThreadMeta:
      (typeof (category as { latest_thread_meta?: unknown }).latest_thread_meta ===
      "string"
        ? String((category as { latest_thread_meta?: string }).latest_thread_meta)
        : "") || fallback?.latestThreadMeta || "Ready for the first conversation",
  };
}

function CategoryCard({ category }: { category: CommunityCategoryCard }) {
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
          {category.threadCount} threads
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
          border: "1px solid #e2e8f0",
          background: "#f8fafc",
          borderRadius: 16,
          padding: 14,
          display: "grid",
          gap: 8,
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
          Starter prompt
        </div>
        <div
          style={{
            fontSize: 14,
            lineHeight: 1.65,
            color: "#334155",
          }}
        >
          {category.starterPrompt}
        </div>
      </div>

      <div
        style={{
          borderTop: "1px solid #eef2f7",
          paddingTop: 12,
          display: "grid",
          gap: 4,
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
          Active thread
        </div>
        <div
          style={{
            fontSize: 15,
            fontWeight: 800,
            color: "#0f172a",
            lineHeight: 1.45,
          }}
        >
          {category.latestThreadTitle}
        </div>
        <div
          style={{
            fontSize: 13,
            color: "#64748b",
            lineHeight: 1.5,
          }}
        >
          {category.latestThreadMeta}
        </div>
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
          {category.ctaLabel}
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
          Browse threads
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
        label: "Suggest a feature",
        href: "/community/category/feature-suggestions",
      },
    ],
    [],
  );

  return (
    <FamilyTopNavShell
      title="EduDecks Family"
      subtitle="Community"
      heroTitle="Community"
      heroText="Ask about planning, curriculum, resources, and everyday homeschool life with families walking a similar journey."
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
          <Link
            href="/family"
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
            Family Home
          </Link>
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
          Refreshing live community data…
        </div>
      ) : null}

      {!loading && viewerId ? null : null}
    </FamilyTopNavShell>
  );
}
