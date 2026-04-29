"use client";

import React, { useEffect, useState } from "react";
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

export default function CommunityComposePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedCategory = String(searchParams.get("category") ?? "").trim();

  const [viewerId, setViewerId] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [categorySlug, setCategorySlug] = useState(requestedCategory || "");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
          setMessage("Sign in to start a conversation.");
          return;
        }

        const data = await loadCommunityHomeData(userId);

        if (!mounted) return;

        if (data.categories?.length) {
          const normalized = data.categories.map((c: ForumCategorySummary) => ({
            id: c.id,
            slug: c.slug,
            name: c.name,
            description: c.description,
          }));

          setCategories(normalized);

          if (!normalized.find((c) => c.slug === requestedCategory)) {
            setCategorySlug(normalized[0]?.slug || "");
          }
        } else {
          setCategories([]);
          setMessage("Community categories are not ready yet. Refresh and try again.");
        }
      } catch (error) {
        console.error("Community load failed", error);
        if (!mounted) return;

        setCategories([]);
        setViewerId(null);
        setMessage("Community could not load.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, [requestedCategory]);

  const selectedCategory =
    categories.find((c) => c.slug === categorySlug) || null;

  const canPost = Boolean(viewerId && selectedCategory);

  async function handleSubmit() {
    if (!viewerId) {
      setMessage("Sign in to start a conversation.");
      return;
    }

    if (!selectedCategory) {
      setMessage("Select a valid category.");
      return;
    }

    // 🚨 CRITICAL FIX: block fallback IDs
    if (selectedCategory.id.startsWith("default-")) {
      setMessage("Category not ready. Refresh the page.");
      return;
    }

    if (!title.trim()) {
      setMessage("Add a title.");
      return;
    }

    if (!body.trim()) {
      setMessage("Add a message.");
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

      router.push(buildCommunityThreadHref(category.slug, result.thread.id));
    } catch (error) {
      console.error("Create thread failed", {
        error,
        viewerId,
        selectedCategory,
      });

      const errorMessage =
        error instanceof Error
          ? error.message
          : JSON.stringify(error);

      setMessage(errorMessage || "Unknown error occurred.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <FamilyTopNavShell
      title="MyLearna Family"
      subtitle="Community"
      heroTitle="Start a discussion"
      heroText="Start a calm, readable discussion with one clear opening post."
      hideHeroAside={true}
      workflowHelperText="Choose a category, write a strong opening post, and let replies build."
    >
      <section style={{ display: "grid", gap: 12 }}>
        <select
          value={categorySlug}
          onChange={(e) => setCategorySlug(e.target.value)}
          disabled={!canPost}
        >
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Discussion title"
          disabled={!canPost}
        />

        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write your opening post"
          disabled={!canPost}
        />

        {message && <div>{message}</div>}

        <button
          onClick={() => void handleSubmit()}
          disabled={!canPost || saving}
        >
          {saving ? "Posting..." : "Post discussion"}
        </button>
      </section>
    </FamilyTopNavShell>
  );
}