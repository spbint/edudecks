"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";
import {
  buildCommunityThreadHref,
  createForumThread,
  loadCommunityHomeData,
  requireCommunityUserId,
  type ForumCategorySummary,
} from "@/lib/communityForum";

type CategoryOption = Pick<ForumCategorySummary, "id" | "slug" | "name" | "description">;

function panelStyle(): React.CSSProperties {
  return {
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    borderRadius: 22,
    padding: 20,
    boxShadow: "0 10px 30px rgba(15,23,42,0.04)",
    display: "grid",
    gap: 12,
  };
}

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

        const nextCategories = data.categories.map((category) => ({
          id: category.id,
          slug: category.slug,
          name: category.name,
          description: category.description,
        }));

        setCategories(nextCategories);

        if (nextCategories.length === 0) {
          setMessage("Community categories are not ready yet.");
          setCategorySlug("");
          return;
        }

        if (requestedCategory && !nextCategories.find((category) => category.slug === requestedCategory)) {
          setMessage("That category is not ready yet. Choose another category.");
          setCategorySlug(nextCategories[0].slug);
          return;
        }

        setCategorySlug(requestedCategory || nextCategories[0].slug);
      } catch (error) {
        console.error("Community compose load failed", error);
        if (!mounted) return;

        setCategories([]);
        setMessage(error instanceof Error ? error.message : "Community could not load.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, [requestedCategory]);

  const selectedCategory = categories.find((category) => category.slug === categorySlug) || null;
  const canPost = Boolean(viewerId && selectedCategory && !loading && !saving);

  async function handleSubmit() {
    if (!viewerId) {
      setMessage("Sign in to start a conversation.");
      return;
    }

    if (!selectedCategory) {
      setMessage("Choose a real category to continue.");
      return;
    }

    if (!title.trim()) {
      setMessage("Add a discussion title.");
      return;
    }

    if (!body.trim()) {
      setMessage("Add an opening post.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const result = await createForumThread({
        viewerId,
        categoryId: selectedCategory.id,
        title,
        body,
      });

      router.push(buildCommunityThreadHref(result.category.slug, result.thread.id));
    } catch (error) {
      console.error("Create thread failed", error);
      setMessage(error instanceof Error ? error.message : "Community could not post that discussion.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <FamilyTopNavShell
      title="MyLearna Family"
      subtitle="Community"
      heroTitle="Start a discussion"
      heroText="Start one real discussion in the right category."
      hideHeroAside={true}
      workflowHelperText="Choose a real category, write one clear opening post, and let replies build from there."
    >
      {loading ? (
        <section style={panelStyle()}>
          <div style={{ fontSize: 15, color: "#475569", fontWeight: 700 }}>Loading Community...</div>
        </section>
      ) : !viewerId ? (
        <section style={panelStyle()}>
          <div style={{ fontSize: 20, fontWeight: 900, color: "#0f172a" }}>Sign in to start a conversation</div>
          <div style={{ fontSize: 14, lineHeight: 1.7, color: "#475569" }}>
            Community posting is available only when you are signed in.
          </div>
        </section>
      ) : categories.length === 0 ? (
        <section style={panelStyle()}>
          <div style={{ fontSize: 20, fontWeight: 900, color: "#0f172a" }}>Community is not ready yet</div>
          <div style={{ fontSize: 14, lineHeight: 1.7, color: "#475569" }}>
            {message || "Community categories have not loaded from the database yet."}
          </div>
        </section>
      ) : (
        <section style={panelStyle()}>
          <select
            value={categorySlug}
            onChange={(event) => setCategorySlug(event.target.value)}
            disabled={!canPost}
            style={{
              width: "100%",
              border: "1px solid #d1d5db",
              borderRadius: 10,
              padding: "10px 12px",
              fontSize: 14,
              background: "#ffffff",
            }}
          >
            {categories.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>

          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Discussion title"
            disabled={!viewerId || saving}
            style={{
              width: "100%",
              border: "1px solid #d1d5db",
              borderRadius: 10,
              padding: "10px 12px",
              fontSize: 14,
              background: "#ffffff",
            }}
          />

          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Write your opening post"
            rows={7}
            disabled={!viewerId || saving}
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

          {message ? <div style={{ fontSize: 13, color: "#475569", fontWeight: 700 }}>{message}</div> : null}

          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={!canPost}
            style={{
              border: canPost ? "1px solid #2563eb" : "1px solid #d1d5db",
              background: canPost ? "#2563eb" : "#f8fafc",
              color: canPost ? "#ffffff" : "#64748b",
              borderRadius: 10,
              padding: "10px 14px",
              fontSize: 14,
              fontWeight: 800,
              cursor: canPost ? (saving ? "wait" : "pointer") : "default",
              opacity: saving ? 0.8 : 1,
            }}
          >
            {saving ? "Posting..." : "Post discussion"}
          </button>
        </section>
      )}
    </FamilyTopNavShell>
  );
}
