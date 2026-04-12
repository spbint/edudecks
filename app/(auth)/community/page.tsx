"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
};

const FALLBACK_CATEGORIES: CommunityCategoryCard[] = [
  {
    id: "general-discussion",
    slug: "general-discussion",
    name: "General Discussion",
    description:
      "A calm place for homeschool families to talk about the everyday rhythm of home education, family life, wins, worries, and encouragement.",
    starterPrompt:
      "Start with a simple question, a quick encouragement, or something your family is navigating this week.",
    ctaLabel: "Start a general thread",
    tone: "Ask, share, encourage",
  },
  {
    id: "curriculum-and-planning",
    slug: "curriculum-and-planning",
    name: "Curriculum & Planning",
    description:
      "Talk about curriculum choices, year levels, term plans, weekly flow, routines, and how other families organise their learning.",
    starterPrompt:
      "Ask how other parents plan a week, structure a day, or choose resources for a particular age or year level.",
    ctaLabel: "Start a planning thread",
    tone: "Plan with confidence",
  },
  {
    id: "resources-and-ideas",
    slug: "resources-and-ideas",
    name: "Resources & Ideas",
    description:
      "Share printable resources, websites, books, games, memory work ideas, science projects, field trip ideas, and creative learning tools.",
    starterPrompt:
      "Share something that worked well for your child, or ask for help finding a resource for a specific topic.",
    ctaLabel: "Share a resource",
    tone: "Swap useful ideas",
  },
  {
    id: "new-to-homeschooling",
    slug: "new-to-homeschooling",
    name: "New to Homeschooling",
    description:
      "A gentle starting point for families beginning the homeschool journey and wanting practical advice without pressure or noise.",
    starterPrompt:
      "Ask your first question here — from getting started and routines to curriculum, confidence, or what a normal week can look like.",
    ctaLabel: "Ask your first question",
    tone: "A gentle first step",
  },
  {
    id: "faith-and-family",
    slug: "faith-and-family",
    name: "Faith & Family",
    description:
      "Discuss family discipleship, Bible learning, Christian parenting, prayer, and how faith shapes homeschool life and culture.",
    starterPrompt:
      "Share ideas for Bible time, memory verses, faith conversations, or how your family keeps Christ central in the week.",
    ctaLabel: "Start a faith thread",
    tone: "Encourage one another",
  },
  {
    id: "feature-suggestions",
    slug: "feature-suggestions",
    name: "Feature Suggestions",
    description:
      "Help shape EduDecks by sharing feature ideas, pain points, and practical suggestions that would make the platform more helpful for families.",
    starterPrompt:
      "Tell us what would help your family most, what problem it would solve, and how it could improve your homeschool workflow.",
    ctaLabel: "Suggest a feature",
    tone: "Help build EduDecks",
  },
];

function normalizeCategory(
  category: ForumCategorySummary
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
      "Start a thread with a simple question, a useful resource, or an encouraging idea.",
    ctaLabel: fallback?.ctaLabel || "Open category",
    tone: fallback?.tone || "Join the conversation",
  };
}

function CategoryCard({
  category,
}: {
  category: CommunityCategoryCard;
}) {
  return (
    <article
      style={{
        border: "1px solid #e5e7eb",
        background: "#ffffff",
        borderRadius: 22,
        padding: 20,
        boxShadow: "0 10px 30px rgba(15,23,42,0.04)",
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
          gap: 6,
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
  const router = useRouter();
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [categories, setCategories] = useState<CommunityCategoryCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const userId = await requireCommunityUserId();

        if (!mounted) return;

        if (!userId) {
          setViewerId("demo-user");
          setCategories(FALLBACK_CATEGORIES);
          setMessage(
            "Community is currently running in preview mode, so starter categories are being shown.",
          );
          setLoading(false);
          return;
        }

        setViewerId(userId);

        const data = await loadCommunityHomeData(userId);

        if (!mounted) return;

        if (data.categories?.length) {
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
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, [router]);

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
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
            gap: 16,
          }}
        >
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </section>
      )}

      {!loading && viewerId ? null : null}
    </FamilyTopNavShell>
  );
}