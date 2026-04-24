"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";
import {
  buildCommunityCategoryHref,
  buildCommunityThreadHref,
  createForumThread,
  loadCommunityHomeData,
  requireCommunityUserId,
  type ForumCategory,
  type ForumCategorySummary,
} from "@/lib/communityForum";

type CategoryOption = {
  id: string;
  slug: string;
  name: string;
  description: string;
};

const FALLBACK_OPTIONS: CategoryOption[] = [
  {
    id: "default-general-discussion",
    slug: "general-discussion",
    name: "General Discussion",
    description: "Ask everyday questions and share practical homeschool encouragement.",
  },
  {
    id: "default-homeschool-resources",
    slug: "homeschool-resources",
    name: "Homeschool Resources",
    description: "Share and discover useful homeschool resources, tools, printables, and curriculum ideas.",
  },
  {
    id: "default-classical-education",
    slug: "classical-education",
    name: "Classical Education",
    description: "Discuss classical education approaches, great books, memory work, and structured learning rhythms.",
  },
  {
    id: "default-help-shape-edudecks",
    slug: "help-shape-edudecks",
    name: "Help Shape MyLearna",
    description: "Share ideas, pain points, and practical suggestions that would make MyLearna more helpful.",
  },
];

function normalizeCategory(category: ForumCategorySummary): CategoryOption {
  return {
    id: category.id,
    slug: category.slug,
    name: category.name === "Help Shape EduDecks" ? "Help Shape MyLearna" : category.name,
    description:
      category.name === "Help Shape EduDecks"
        ? "Share ideas, pain points, and practical suggestions that would make MyLearna more helpful."
        : category.description,
  };
}

export default function CommunityComposePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedCategory = String(searchParams.get("category") ?? "").trim();

  const [viewerId, setViewerId] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryOption[]>(FALLBACK_OPTIONS);
  const [categorySlug, setCategorySlug] = useState(requestedCategory || FALLBACK_OPTIONS[0].slug);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setCategorySlug(requestedCategory || FALLBACK_OPTIONS[0].slug);
  }, [requestedCategory]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const userId = await requireCommunityUserId();

        if (!mounted) return;

        setViewerId(userId);

        if (!userId) {
          setCategories(FALLBACK_OPTIONS);
          setMessage("Sign in to start a conversation");
          return;
        }

        const data = await loadCommunityHomeData(userId);
        if (!mounted) return;

        if (data.categories?.length) {
          setCategories(data.categories.map(normalizeCategory));
        } else {
          setCategories(FALLBACK_OPTIONS);
        }
      } catch (error) {
        console.error("Community compose load failed", error);
        if (!mounted) return;
        setViewerId(null);
        setCategories(FALLBACK_OPTIONS);
        setMessage("Community categories could not be loaded right now.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  const selectedCategory =
    categories.find((category) => category.slug === categorySlug) || categories[0] || FALLBACK_OPTIONS[0];
  const canPost = Boolean(viewerId);

  const composerTitle =
    selectedCategory.slug === "help-shape-edudecks"
      ? "Help shape MyLearna"
      : selectedCategory.slug === "homeschool-resources"
        ? "Share a resource"
        : "Start a discussion";

  const titlePlaceholder =
    selectedCategory.slug === "homeschool-resources"
      ? "Resource title"
      : selectedCategory.slug === "general-discussion"
        ? "Question or discussion title"
        : "Discussion title";

  const bodyPlaceholder =
    selectedCategory.slug === "help-shape-edudecks"
      ? "Describe the idea, the problem it solves, and how it would help your family."
      : selectedCategory.slug === "homeschool-resources"
        ? "Share the resource, why it helped, and who it might suit."
        : "Write your opening post";

  async function handleSubmit() {
    if (!viewerId) {
      setMessage("Sign in to start a conversation");
      return;
    }

    if (!title.trim()) {
      setMessage("Add a title first.");
      return;
    }

    if (!body.trim()) {
      setMessage("Add a message before posting.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const category: ForumCategory = {
        id: selectedCategory.id,
        slug: selectedCategory.slug,
        name: selectedCategory.name,
        description: selectedCategory.description,
        created_at: new Date().toISOString(),
      };

      const result = await createForumThread({
        viewerId,
        category,
        title,
        body,
      });

      router.push(buildCommunityThreadHref(selectedCategory.slug, result.thread.id));
    } catch (error) {
      console.error("Create thread failed", error);
      setMessage("That discussion could not be posted right now.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <FamilyTopNavShell
      title="MyLearna Family"
      subtitle="Community"
      heroTitle={composerTitle}
      heroText="Start a calm, readable discussion with one clear opening post."
      hideHeroAside={true}
      workflowHelperText="Community threads stay simple: choose a category, write one strong opening post, and let replies build from there."
    >
      <section
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
              New thread
            </div>
            <div style={{ fontSize: 28, lineHeight: 1.15, fontWeight: 900, color: "#0f172a" }}>
              {composerTitle}
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.7, color: "#475569", marginTop: 8, maxWidth: 760 }}>
              Choose the right category, then write one clear opening post that helps other families understand the conversation.
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link
              href={selectedCategory ? buildCommunityCategoryHref(selectedCategory.slug) : "/community"}
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
              Back
            </Link>
          </div>
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: "#334155" }}>Category</span>
            <select
              value={categorySlug}
              onChange={(event) => setCategorySlug(event.target.value)}
              disabled={loading || !canPost}
              style={{
                width: "100%",
                border: "1px solid #d1d5db",
                borderRadius: 12,
                padding: "12px 14px",
                fontSize: 14,
                background: "#ffffff",
              }}
            >
              {categories.map((category) => (
                <option key={category.slug} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: "#334155" }}>Title</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={titlePlaceholder}
              disabled={!canPost}
              style={{
                width: "100%",
                border: "1px solid #d1d5db",
                borderRadius: 12,
                padding: "12px 14px",
                fontSize: 14,
                background: canPost ? "#ffffff" : "#f8fafc",
              }}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: "#334155" }}>Message</span>
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={7}
              placeholder={bodyPlaceholder}
              disabled={!canPost}
              style={{
                width: "100%",
                border: "1px solid #d1d5db",
                borderRadius: 12,
                padding: "12px 14px",
                fontSize: 14,
                lineHeight: 1.6,
                background: canPost ? "#ffffff" : "#f8fafc",
                resize: "vertical",
              }}
            />
          </label>

          {message ? (
            <div style={{ fontSize: 13, color: "#475569", fontWeight: 700 }}>{message}</div>
          ) : null}

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={saving || loading || !canPost}
              style={{
                border: canPost ? "1px solid #2563eb" : "1px solid #d1d5db",
                background: canPost ? "#2563eb" : "#f8fafc",
                color: canPost ? "#ffffff" : "#64748b",
                borderRadius: 10,
                padding: "10px 14px",
                fontSize: 14,
                fontWeight: 800,
                cursor: !canPost ? "default" : saving ? "wait" : "pointer",
                opacity: saving || !canPost ? 0.8 : 1,
              }}
            >
              {!canPost ? "Sign in to start a conversation" : saving ? "Posting..." : "Post discussion"}
            </button>
          </div>
        </div>
      </section>
    </FamilyTopNavShell>
  );
}
