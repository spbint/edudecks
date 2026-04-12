"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";
import ForumThreadRow from "@/app/components/ForumThreadRow";
import {
  createForumThread,
  isFeatureSuggestionCategory,
  loadCategoryPageData,
  requireCommunityUserId,
  type ForumCategory,
  type ForumThreadSummary,
} from "@/lib/communityForum";

type FallbackThread = ForumThreadSummary & {
  authorLabel?: string;
};

function makeFallbackThread(
  thread: Omit<FallbackThread, "user_id"> & { user_id?: string },
): FallbackThread {
  return {
    ...thread,
    user_id: thread.user_id ?? "demo-user",
  };
}

const CATEGORY_FALLBACKS: Record<
  string,
  {
    name: string;
    description: string;
    prompts: string[];
    emptyTitle: string;
    emptyText: string;
    starterThreads: FallbackThread[];
  }
> = {
  "general-discussion": {
    name: "General Discussion",
    description:
      "A calm place for homeschool families to share wins, ask everyday questions, and encourage one another.",
    prompts: [
      "What has worked well in your home this week?",
      "What is one challenge your family is navigating right now?",
      "What encouragement would help another parent today?",
    ],
    emptyTitle: "Start the first general discussion",
    emptyText:
      "This is the place for everyday homeschool conversation, simple questions, and warm encouragement.",
    starterThreads: [
      makeFallbackThread({
        id: "sample-general-1",
        category_id: "general-discussion",
        title: "What does a calm homeschool morning look like for your family?",
        body: "Share one thing that helps the day begin well.",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        replyCount: 0,
        lastReplyAt: new Date().toISOString(),
        is_pinned: true,
        status: "under_review",
        supportCount: 0,
        authorLabel: "EduDecks Community",
        slug: "",
      }),
    ],
  },
  "curriculum-and-planning": {
    name: "Curriculum & Planning",
    description:
      "Talk about curriculum choices, planning rhythms, year levels, and how families structure learning across the week.",
    prompts: [
      "What curriculum are you loving this term?",
      "How do you plan a week without making home feel like school-school?",
      "How do you balance structure and flexibility?",
    ],
    emptyTitle: "Start the first planning conversation",
    emptyText:
      "Ask about curriculum, weekly planning, year levels, and how other families organise their learning.",
    starterThreads: [
      makeFallbackThread({
        id: "sample-plan-1",
        category_id: "curriculum-and-planning",
        title: "How do you plan for multiple children at different ages?",
        body: "Share routines, tools, or simple systems that actually help.",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        replyCount: 0,
        lastReplyAt: new Date().toISOString(),
        is_pinned: true,
        status: "under_review",
        supportCount: 0,
        authorLabel: "EduDecks Community",
        slug: "",
      }),
    ],
  },
  "resources-and-ideas": {
    name: "Resources & Ideas",
    description:
      "Share books, printables, websites, games, projects, and creative ideas that have genuinely helped your family.",
    prompts: [
      "What resource made a real difference this month?",
      "What free or low-cost tool would you recommend to another parent?",
      "What is a hands-on idea your child loved recently?",
    ],
    emptyTitle: "Share the first useful resource",
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
        lastReplyAt: new Date().toISOString(),
        is_pinned: true,
        status: "under_review",
        supportCount: 0,
        authorLabel: "EduDecks Community",
        slug: "",
      }),
    ],
  },
  "new-to-homeschooling": {
    name: "New to Homeschooling",
    description:
      "A gentle starting point for parents who are just beginning and want calm, practical advice without noise or overwhelm.",
    prompts: [
      "What is your biggest first-step question?",
      "What do you wish someone had told you when you began?",
      "How did you build confidence in your first term?",
    ],
    emptyTitle: "Ask the first beginner question",
    emptyText:
      "This category is for new families who need a simple, safe starting point.",
    starterThreads: [
      makeFallbackThread({
        id: "sample-new-1",
        category_id: "new-to-homeschooling",
        title: "What should I focus on first in my first month of homeschooling?",
        body: "Share simple advice for families just getting started.",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        replyCount: 0,
        lastReplyAt: new Date().toISOString(),
        is_pinned: true,
        status: "under_review",
        supportCount: 0,
        authorLabel: "EduDecks Community",
        slug: "",
      }),
    ],
  },
  "faith-and-family": {
    name: "Faith & Family",
    description:
      "Discuss Bible learning, Christian parenting, faith conversations, prayer, memory verses, and family discipleship.",
    prompts: [
      "How do you keep faith woven through the week naturally?",
      "What Bible routine has worked well in your home?",
      "What are your favourite family discipleship resources?",
    ],
    emptyTitle: "Start the first faith discussion",
    emptyText:
      "A gentle space for Christian homeschool families to share faith-based ideas and encouragement.",
    starterThreads: [
      makeFallbackThread({
        id: "sample-faith-1",
        category_id: "faith-and-family",
        title: "What has helped your family build a simple Bible routine?",
        body: "Share practical ideas for keeping Christ central in the week.",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        replyCount: 0,
        lastReplyAt: new Date().toISOString(),
        is_pinned: true,
        status: "under_review",
        supportCount: 0,
        authorLabel: "EduDecks Community",
        slug: "",
      }),
    ],
  },
  "feature-suggestions": {
    name: "Feature Suggestions",
    description:
      "Help shape EduDecks by suggesting features that would make planning, capture, portfolios, and reporting more helpful for families.",
    prompts: [
      "What would make EduDecks more useful for your family?",
      "What problem would this feature solve?",
      "How would it save time, reduce overwhelm, or improve visibility?",
    ],
    emptyTitle: "Share the first feature idea",
    emptyText:
      "Tell us what would help your family most and why it matters.",
    starterThreads: [
      makeFallbackThread({
        id: "sample-feature-1",
        category_id: "feature-suggestions",
        title: "I’d love a better way to compare multiple children’s weekly plans",
        body: "This could help families with more than one learner see the whole week at a glance.",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        replyCount: 0,
        lastReplyAt: new Date().toISOString(),
        is_pinned: true,
        status: "under_review",
        supportCount: 3,
        authorLabel: "EduDecks Community",
        slug: "",
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
      prompts: [
        "What question would you like to ask?",
        "What resource or encouragement could you share?",
        "What would be useful to another family today?",
      ],
      emptyTitle: "Start the first discussion",
      emptyText:
        "This category is ready for the first thoughtful conversation.",
      starterThreads: [],
    }
  );
}

export default function CommunityCategoryPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const slug = String(params?.slug ?? "");

  const [viewerId, setViewerId] = useState<string | null>(null);
  const [category, setCategory] = useState<ForumCategory | null>(null);
  const [threads, setThreads] = useState<ForumThreadSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [showComposer, setShowComposer] = useState(false);

  const fallback = useMemo(() => getFallbackCategory(slug), [slug]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const userId = await requireCommunityUserId();

        if (!mounted) return;

        setViewerId(userId ?? "demo-user");

        if (!userId) {
          setCategory({
            id: slug,
            slug,
            name: fallback.name,
            description: fallback.description,
          } as ForumCategory);
          setThreads(fallback.starterThreads);
          setLoading(false);
          return;
        }

        const data = await loadCategoryPageData(slug, userId);

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

        setViewerId("demo-user");
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
  }, [fallback.description, fallback.name, fallback.starterThreads, router, slug]);

  async function handleCreateThread() {
    if (!category) return;
    if (!title.trim()) {
      setMessage("Add a thread title first.");
      return;
    }

    if (!viewerId || viewerId === "demo-user") {
      setMessage("Preview mode is active. Live posting will work once community sign-in is connected.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const result = await createForumThread({
        viewerId,
        category,
        title,
        body,
      });

      setTitle("");
      setBody("");
      setShowComposer(false);
      router.push(`/community/thread/${result.thread.id}`);
    } catch (error) {
      console.error("Create thread failed", error);
      setMessage("That thread could not be posted right now.");
    } finally {
      setSaving(false);
    }
  }

  const isFeatureCategory = isFeatureSuggestionCategory(category);
  const composerTitle = isFeatureCategory ? "Suggest a feature" : "Start a new discussion";
  const composerPlaceholder = isFeatureCategory
    ? "Tell us about your idea, the problem behind it, and how it would help your family."
    : "Write the opening post";

  return (
    <FamilyTopNavShell
      title="EduDecks Family"
      subtitle="Community"
      heroTitle={category?.name || fallback.name}
      heroText={category?.description || fallback.description}
      hideHeroAside={true}
      workflowHelperText="Community is structured by category first, then threads, then replies."
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
              {category?.name || fallback.name}
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.7, color: "#475569", marginTop: 8, maxWidth: 760 }}>
              {category?.description || fallback.description}
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
            <button
              type="button"
              onClick={() => setShowComposer((current) => !current)}
              style={{
                border: "1px solid #2563eb",
                background: "#2563eb",
                color: "#ffffff",
                borderRadius: 10,
                padding: "10px 14px",
                fontSize: 14,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              {isFeatureCategory ? "Share an idea" : "Start new thread"}
            </button>
          </div>
        </div>

        <div
          style={{
            border: "1px solid #e2e8f0",
            background: "#f8fafc",
            borderRadius: 18,
            padding: 16,
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
            Helpful prompts
          </div>
          {fallback.prompts.map((prompt) => (
            <div
              key={prompt}
              style={{
                fontSize: 14,
                lineHeight: 1.65,
                color: "#334155",
              }}
            >
              • {prompt}
            </div>
          ))}
        </div>

        {showComposer ? (
          <div
            style={{
              border: "1px solid #e5e7eb",
              background: "#f8fafc",
              borderRadius: 18,
              padding: 16,
              display: "grid",
              gap: 12,
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 900, color: "#0f172a" }}>{composerTitle}</div>

            {isFeatureCategory ? (
              <div
                style={{
                  border: "1px solid #dbeafe",
                  background: "#eff6ff",
                  borderRadius: 14,
                  padding: 14,
                  display: "grid",
                  gap: 8,
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 800, color: "#1d4ed8" }}>
                  Optional prompts
                </div>
                <div style={{ fontSize: 14, lineHeight: 1.6, color: "#334155" }}>
                  What would you like to see?
                </div>
                <div style={{ fontSize: 14, lineHeight: 1.6, color: "#334155" }}>
                  What problem would this solve?
                </div>
                <div style={{ fontSize: 14, lineHeight: 1.6, color: "#334155" }}>
                  How would it help your family?
                </div>
              </div>
            ) : null}

            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isFeatureCategory ? "Idea title" : "Thread title"}
              style={{
                width: "100%",
                border: "1px solid #d1d5db",
                borderRadius: 12,
                padding: "12px 14px",
                fontSize: 14,
                background: "#ffffff",
              }}
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              placeholder={composerPlaceholder}
              style={{
                width: "100%",
                border: "1px solid #d1d5db",
                borderRadius: 12,
                padding: "12px 14px",
                fontSize: 14,
                lineHeight: 1.6,
                background: "#ffffff",
                resize: "vertical",
              }}
            />
            {message ? (
              <div style={{ fontSize: 13, color: "#475569", fontWeight: 700 }}>{message}</div>
            ) : null}
            <div>
              <button
                type="button"
                onClick={() => void handleCreateThread()}
                disabled={saving}
                style={{
                  border: "1px solid #2563eb",
                  background: "#2563eb",
                  color: "#ffffff",
                  borderRadius: 10,
                  padding: "10px 14px",
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: saving ? "wait" : "pointer",
                  opacity: saving ? 0.8 : 1,
                }}
              >
                {saving ? "Posting..." : isFeatureCategory ? "Share idea" : "Post thread"}
              </button>
            </div>
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