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
    setCategorySlug(requestedCategory || "");
  }, [requestedCategory]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const userId = await requireCommunityUserId();

        if (!mounted) return;

        setViewerId(userId);

        if (!userId) {
          setMessage("Sign in to start a conversation");
          setCategories([]);
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

          // ensure selected slug is valid
          if (!normalized.find((c) => c.slug === categorySlug)) {
            setCategorySlug(normalized[0]?.slug || "");
          }
        } else {
          // 🚨 DO NOT FALL BACK — BLOCK WRITE
          setCategories([]);
          setMessage("Community categories are not ready yet. Refresh and try again.");
        }
      } catch (error) {
        console.error("Community compose load failed", error);
        if (!mounted) return;

        setViewerId(null);
        setCategories([]);
        setMessage("Community categories could not be loaded right now.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, [categorySlug]);

  const selectedCategory =
    categories.find((category) => category.slug === categorySlug) || null;

  const canPost = Boolean(viewerId && selectedCategory);

  async function handleSubmit() {
    if (!viewerId) {
      setMessage("Sign in to start a conversation");
      return;
    }

    if (!selectedCategory) {
      setMessage("Select a valid category first.");
      return;
    }

    // 🚨 BLOCK fallback IDs (critical fix)
    if (selectedCategory.id.startsWith("default-")) {
      setMessage("This category is not ready yet. Refresh and try again.");
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

      router.push(buildCommunityThreadHref(category.slug, result.thread.id));
    } catch (error) {
      console.error("Create thread failed", {
        error,
        selectedCategory,
        viewerId,
      });

      const errorMessage =
        error instanceof Error ? error.message : "";

      setMessage(
        errorMessage ||
          "That discussion could not be posted right now."
      );
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
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 900, color: "#64748b" }}>
              New thread
            </div>
            <div style={{ fontSize: 28, fontWeight: 900 }}>
              Start a discussion
            </div>
          </div>

          <Link
            href={
              selectedCategory
                ? buildCommunityCategoryHref(selectedCategory.slug)
                : "/community"
            }
          >
            Back
          </Link>
        </div>

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