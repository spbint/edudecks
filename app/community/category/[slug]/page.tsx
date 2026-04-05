"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";
import ForumThreadRow from "@/app/components/ForumThreadRow";
import {
  createForumThread,
  loadCategoryPageData,
  requireCommunityUserId,
  type ForumCategory,
  type ForumThreadSummary,
} from "@/lib/communityForum";

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

  useEffect(() => {
    async function load() {
      const userId = await requireCommunityUserId();
      if (!userId) {
        router.replace("/login");
        return;
      }

      setViewerId(userId);
      const data = await loadCategoryPageData(slug, userId);
      setCategory(data.category);
      setThreads(data.threads);
      setLoading(false);
    }

    void load();
  }, [router, slug]);

  async function handleCreateThread() {
    if (!viewerId || !category) return;
    if (!title.trim()) {
      setMessage("Add a thread title first.");
      return;
    }

    setSaving(true);
    setMessage("");

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
  }

  return (
    <FamilyTopNavShell
      title="EduDecks Family"
      subtitle="Community"
      heroTitle={category?.name || "Community"}
      heroText={
        category?.description ||
        "A calm, structured place to start or continue a thoughtful homeschool discussion."
      }
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
          gap: 12,
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
              {category?.name || "Loading…"}
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.7, color: "#475569", marginTop: 8, maxWidth: 760 }}>
              {category?.description}
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
              Start new thread
            </button>
          </div>
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
            <div style={{ fontSize: 16, fontWeight: 900, color: "#0f172a" }}>Start a new discussion</div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Thread title"
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
              placeholder="Write the opening post"
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
                {saving ? "Posting…" : "Post thread"}
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
          Loading threads…
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
          <div style={{ fontSize: 20, fontWeight: 900, color: "#0f172a" }}>No threads yet</div>
          <div style={{ fontSize: 14, lineHeight: 1.7, color: "#475569" }}>
            Start the first discussion in this category.
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
