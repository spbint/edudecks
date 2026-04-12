"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";
import {
  createForumReply,
  getThreadStatusLabel,
  isFeatureSuggestionCategory,
  loadThreadPageData,
  relativeTime,
  requireCommunityUserId,
  supportForumThread,
  type ForumCategory,
  type ForumThreadStatus,
} from "@/lib/communityForum";

type ThreadView = {
  id: string;
  category_id: string;
  user_id: string;
  title: string;
  body: string;
  is_pinned: boolean;
  status: ForumThreadStatus;
  created_at: string;
  updated_at: string;
  authorLabel: string;
  supportCount: number;
  viewerSupports: boolean;
};

type ReplyView = {
  id: string;
  thread_id: string;
  user_id: string;
  body: string;
  created_at: string;
  updated_at: string;
  authorLabel: string;
};

function statusBadge(status: ForumThreadStatus): React.CSSProperties {
  if (status === "under_review") {
    return {
      border: "1px solid #bfdbfe",
      background: "#eff6ff",
      color: "#1d4ed8",
    };
  }

  if (status === "planned") {
    return {
      border: "1px solid #fde68a",
      background: "#fffbeb",
      color: "#a16207",
    };
  }

  return {
    border: "1px solid #bbf7d0",
    background: "#f0fdf4",
    color: "#166534",
  };
}

function fallbackThread(id: string): {
  category: ForumCategory;
  thread: ThreadView;
  replies: ReplyView[];
} {
  return {
    category: {
      id: "general-discussion",
      slug: "general-discussion",
      name: "General Discussion",
      description:
        "A calm place for homeschool families to talk through everyday learning and family life.",
    } as ForumCategory,
    thread: {
      id,
      category_id: "general-discussion",
      user_id: "demo-user",
      title: "Welcome to the EduDecks community",
      body:
        "This is a preview thread so the community space feels alive from first click.\n\nParents will be able to share ideas, resources, routines, questions, and encouragement here in a calm, structured format.",
      is_pinned: true,
      status: "open",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      authorLabel: "EduDecks Community",
      supportCount: 0,
      viewerSupports: false,
    },
    replies: [
      {
        id: "reply-1",
        thread_id: id,
        user_id: "demo-user-2",
        body:
          "I love the idea of having a forum that feels calm and practical rather than noisy. This would be such a helpful place to swap planning ideas.",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        authorLabel: "Homeschool parent",
      },
      {
        id: "reply-2",
        thread_id: id,
        user_id: "demo-user-3",
        body:
          "A category for resources and another for new homeschoolers would be especially useful.",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        authorLabel: "EduDecks family",
      },
    ],
  };
}

export default function CommunityThreadPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = String(params?.id ?? "");

  const [viewerId, setViewerId] = useState<string | null>(null);
  const [thread, setThread] = useState<ThreadView | null>(null);
  const [replies, setReplies] = useState<ReplyView[]>([]);
  const [category, setCategory] = useState<ForumCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyBody, setReplyBody] = useState("");
  const [replying, setReplying] = useState(false);
  const [supporting, setSupporting] = useState(false);
  const [message, setMessage] = useState("");

  const previewMode = useMemo(
    () => !viewerId || viewerId === "demo-user",
    [viewerId],
  );

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const userId = await requireCommunityUserId();

        if (!mounted) return;

        setViewerId(userId ?? "demo-user");

        if (!userId) {
          const preview = fallbackThread(id);
          setThread(preview.thread);
          setReplies(preview.replies);
          setCategory(preview.category);
          setLoading(false);
          return;
        }

        const data = await loadThreadPageData(id, userId);

        if (!mounted) return;

        if (data.thread) {
          setThread(data.thread as ThreadView);
          setReplies((data.replies as ReplyView[]) ?? []);
          setCategory(data.category);
        } else {
          const preview = fallbackThread(id);
          setThread(preview.thread);
          setReplies(preview.replies);
          setCategory(preview.category);
        }
      } catch (error) {
        console.error("Community thread load failed", error);

        if (!mounted) return;

        const preview = fallbackThread(id);
        setViewerId("demo-user");
        setThread(preview.thread);
        setReplies(preview.replies);
        setCategory(preview.category);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, [id, router]);

  async function handleReply() {
    if (!thread) return;
    if (!replyBody.trim()) {
      setMessage("Write a reply first.");
      return;
    }

    if (previewMode) {
      setReplies((current) => [
        ...current,
        {
          id: `preview-reply-${Date.now()}`,
          thread_id: thread.id,
          user_id: "demo-user",
          body: replyBody,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          authorLabel: "You",
        },
      ]);
      setReplyBody("");
      setMessage("Preview reply added. Live posting will work once community sign-in is connected.");
      return;
    }

    setReplying(true);
    setMessage("");

    try {
      const result = await createForumReply({
        viewerId: viewerId as string,
        threadId: thread.id,
        body: replyBody,
      });

      setReplies((current) => [
        ...current,
        {
          ...(result.post as ReplyView),
          authorLabel: "You",
        },
      ]);
      setReplyBody("");
    } catch (error) {
      console.error("Reply failed", error);
      setMessage("That reply could not be posted right now.");
    } finally {
      setReplying(false);
    }
  }

  async function handleSupport() {
    if (!thread || thread.viewerSupports) return;

    if (previewMode) {
      setThread((current) =>
        current
          ? {
              ...current,
              supportCount: current.supportCount + 1,
              viewerSupports: true,
            }
          : current,
      );
      setMessage("Preview support recorded.");
      return;
    }

    setSupporting(true);
    setMessage("");

    try {
      const result = await supportForumThread({
        viewerId: viewerId as string,
        threadId: thread.id,
      });

      if (!result.alreadySupported) {
        setThread((current) =>
          current
            ? {
                ...current,
                supportCount: current.supportCount + 1,
                viewerSupports: true,
              }
            : current,
        );
      } else {
        setThread((current) =>
          current
            ? {
                ...current,
                viewerSupports: true,
              }
            : current,
        );
      }
    } catch (error) {
      console.error("Support failed", error);
      setMessage("Support could not be saved right now.");
    } finally {
      setSupporting(false);
    }
  }

  const statusLabel = getThreadStatusLabel(thread?.status ?? null);
  const isFeatureCategory = isFeatureSuggestionCategory(category);

  return (
    <FamilyTopNavShell
      title="EduDecks Family"
      subtitle="Community"
      heroTitle={thread?.title || "Community"}
      heroText="A structured member conversation with one clear starting post and calm chronological replies."
      hideHeroAside={true}
      workflowHelperText="Community threads stay simple: one opening post, then a readable reply list."
    >
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
          Loading discussion...
        </section>
      ) : !thread ? (
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
          <div style={{ fontSize: 20, fontWeight: 900, color: "#0f172a" }}>Thread not found</div>
          <Link href="/community" style={{ color: "#2563eb", fontWeight: 800, textDecoration: "none" }}>
            Back to Community
          </Link>
        </section>
      ) : (
        <>
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
                  {category?.name || "Community thread"}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  {statusLabel ? (
                    <span
                      style={{
                        ...statusBadge(thread.status),
                        borderRadius: 999,
                        padding: "4px 8px",
                        fontSize: 11,
                        fontWeight: 900,
                      }}
                    >
                      {statusLabel}
                    </span>
                  ) : null}
                  <div style={{ fontSize: 30, lineHeight: 1.1, fontWeight: 900, color: "#0f172a" }}>
                    {thread.title}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {category ? (
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
                    Back to category
                  </Link>
                ) : null}
              </div>
            </div>

            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
              {thread.authorLabel} · {relativeTime(thread.created_at)}
            </div>

            <div style={{ fontSize: 15, lineHeight: 1.75, color: "#334155", whiteSpace: "pre-wrap" }}>
              {thread.body}
            </div>

            {isFeatureCategory ? (
              <div
                style={{
                  border: "1px solid #e5e7eb",
                  background: "#f8fafc",
                  borderRadius: 16,
                  padding: 14,
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <div style={{ display: "grid", gap: 4 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>
                    {thread.supportCount} families support this idea
                  </div>
                  <div style={{ fontSize: 13, lineHeight: 1.6, color: "#64748b" }}>
                    A simple way to show that this idea would help more than one family.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void handleSupport()}
                  disabled={thread.viewerSupports || supporting}
                  style={{
                    border: thread.viewerSupports ? "1px solid #bbf7d0" : "1px solid #2563eb",
                    background: thread.viewerSupports ? "#f0fdf4" : "#2563eb",
                    color: thread.viewerSupports ? "#166534" : "#ffffff",
                    borderRadius: 10,
                    padding: "10px 14px",
                    fontSize: 14,
                    fontWeight: 800,
                    cursor: thread.viewerSupports ? "default" : "pointer",
                    opacity: supporting ? 0.8 : 1,
                  }}
                >
                  {thread.viewerSupports ? "You support this idea" : supporting ? "Saving..." : "Support this idea"}
                </button>
              </div>
            ) : null}
          </section>

          <section style={{ display: "grid", gap: 14, marginBottom: 18 }}>
            {replies.map((reply) => (
              <article
                key={reply.id}
                style={{
                  border: "1px solid #e5e7eb",
                  background: "#ffffff",
                  borderRadius: 18,
                  padding: 16,
                  boxShadow: "0 10px 30px rgba(15,23,42,0.04)",
                  display: "grid",
                  gap: 10,
                }}
              >
                <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
                  {reply.authorLabel} · {relativeTime(reply.created_at)}
                </div>
                <div style={{ fontSize: 14, lineHeight: 1.7, color: "#334155", whiteSpace: "pre-wrap" }}>
                  {reply.body}
                </div>
              </article>
            ))}
          </section>

          <section
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
            <div style={{ fontSize: 18, fontWeight: 900, color: "#0f172a" }}>Reply to this discussion</div>
            <textarea
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              rows={5}
              placeholder={isFeatureCategory ? "Add a thoughtful reply or build on the idea" : "Write a thoughtful reply"}
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
                onClick={() => void handleReply()}
                disabled={replying}
                style={{
                  border: "1px solid #2563eb",
                  background: "#2563eb",
                  color: "#ffffff",
                  borderRadius: 10,
                  padding: "10px 14px",
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: replying ? "wait" : "pointer",
                  opacity: replying ? 0.8 : 1,
                }}
              >
                {replying ? "Posting..." : "Reply"}
              </button>
            </div>
          </section>
        </>
      )}
    </FamilyTopNavShell>
  );
}