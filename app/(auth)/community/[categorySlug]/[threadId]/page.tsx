"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";
import {
  buildCommunityCategoryHref,
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
  categorySlug: string;
  user_id: string;
  title: string;
  body: string;
  excerpt: string;
  is_pinned: boolean;
  status: ForumThreadStatus;
  created_at: string;
  updated_at: string;
  authorLabel: string;
  replyCount: number;
  latestActivityAt: string;
  supportCount: number;
  viewerSupports: boolean;
};

type ReplyView = {
  id: string;
  thread_id: string;
  user_id: string;
  body: string;
  excerpt: string;
  created_at: string;
  updated_at: string;
  authorLabel: string;
};

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

function statusBadge(status: ForumThreadStatus): React.CSSProperties {
  if (status === "under_review") {
    return { border: "1px solid #bfdbfe", background: "#eff6ff", color: "#1d4ed8" };
  }
  if (status === "planned") {
    return { border: "1px solid #fde68a", background: "#fffbeb", color: "#a16207" };
  }
  return { border: "1px solid #bbf7d0", background: "#f0fdf4", color: "#166534" };
}

export default function CommunityThreadPage() {
  const params = useParams<{ categorySlug: string; threadId: string }>();
  const categorySlug = String(params?.categorySlug ?? "");
  const threadId = String(params?.threadId ?? "");

  const [viewerId, setViewerId] = useState<string | null>(null);
  const [thread, setThread] = useState<ThreadView | null>(null);
  const [replies, setReplies] = useState<ReplyView[]>([]);
  const [category, setCategory] = useState<ForumCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyBody, setReplyBody] = useState("");
  const [replying, setReplying] = useState(false);
  const [supporting, setSupporting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const userId = await requireCommunityUserId();
        if (!mounted) return;

        setViewerId(userId);
        if (!userId) {
          setThread(null);
          setReplies([]);
          setCategory(null);
          setMessage("Sign in to browse Community.");
          return;
        }

        const data = await loadThreadPageData(threadId, userId);
        if (!mounted) return;

        if (data.thread) {
          setThread(data.thread as ThreadView);
          setReplies((data.replies as ReplyView[]) ?? []);
          setCategory(data.category);
          setMessage("");
        } else {
          setThread(null);
          setReplies([]);
          setCategory(null);
          setMessage("This discussion could not be found in the database.");
        }
      } catch (error) {
        console.error("Community thread load failed", error);
        if (!mounted) return;

        setThread(null);
        setReplies([]);
        setCategory(null);
        setMessage(error instanceof Error ? error.message : "Community could not load this discussion.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, [categorySlug, threadId]);

  async function handleReply() {
    if (!thread) return;
    if (!viewerId) {
      setMessage("Sign in to reply.");
      return;
    }
    if (!replyBody.trim()) {
      setMessage("Write a reply first.");
      return;
    }

    setReplying(true);
    setMessage("");

    try {
      const result = await createForumReply({
        viewerId,
        threadId: thread.id,
        body: replyBody,
      });

      const nextTimestamp = result.post.updated_at || result.post.created_at;
      setReplies((current) => [...current, { ...(result.post as ReplyView), authorLabel: "You" }]);
      setThread((current) =>
        current
          ? {
              ...current,
              replyCount: current.replyCount + 1,
              latestActivityAt: nextTimestamp,
              updated_at: nextTimestamp,
            }
          : current,
      );
      setReplyBody("");
      setMessage("Reply posted.");
    } catch (error) {
      console.error("Reply failed", error);
      setMessage(error instanceof Error ? error.message : "Community could not post that reply.");
    } finally {
      setReplying(false);
    }
  }

  async function handleSupport() {
    if (!thread || thread.viewerSupports) return;
    if (!viewerId) {
      setMessage("Sign in to support this idea.");
      return;
    }

    setSupporting(true);
    setMessage("");

    try {
      const result = await supportForumThread({
        viewerId,
        threadId: thread.id,
      });

      setThread((current) =>
        current
          ? {
              ...current,
              supportCount: result.alreadySupported ? current.supportCount : current.supportCount + 1,
              viewerSupports: true,
            }
          : current,
      );
      setMessage(result.alreadySupported ? "You already support this idea." : "Support saved.");
    } catch (error) {
      console.error("Support failed", error);
      setMessage(error instanceof Error ? error.message : "Community could not save that support.");
    } finally {
      setSupporting(false);
    }
  }

  const statusLabel = getThreadStatusLabel(thread?.status ?? null);
  const isFeatureCategory = isFeatureSuggestionCategory(category);
  const backHref = category ? buildCommunityCategoryHref(category.slug) : buildCommunityCategoryHref(categorySlug);
  const canReply = Boolean(viewerId && thread);

  return (
    <FamilyTopNavShell
      title="MyLearna Family"
      subtitle="Community"
      heroTitle={thread?.title || "Community"}
      heroText="A structured member conversation with one clear starting post and calm chronological replies."
      hideHeroAside={true}
      workflowHelperText="Community threads stay simple: one opening post, then a readable reply list."
    >
      {loading ? (
        <section style={panelStyle()}>
          <div style={{ fontSize: 15, color: "#475569", fontWeight: 700 }}>Loading discussion...</div>
        </section>
      ) : !viewerId ? (
        <section style={panelStyle()}>
          <div style={{ fontSize: 20, fontWeight: 900, color: "#0f172a" }}>Community sign-in required</div>
          <div style={{ fontSize: 14, lineHeight: 1.7, color: "#475569" }}>
            Sign in to read this discussion, reply, or support an idea.
          </div>
        </section>
      ) : !thread ? (
        <section style={panelStyle()}>
          <div style={{ fontSize: 20, fontWeight: 900, color: "#0f172a" }}>Discussion not found</div>
          <div style={{ fontSize: 14, lineHeight: 1.7, color: "#475569" }}>
            {message || "This discussion could not be found in the database."}
          </div>
          <Link href="/community" style={{ color: "#2563eb", fontWeight: 800, textDecoration: "none" }}>
            Back to Community
          </Link>
        </section>
      ) : (
        <>
          <section style={{ ...panelStyle(), marginBottom: 18 }}>
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

              <Link
                href={backHref}
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
            </div>

            <div
              style={{
                border: "1px solid #e2e8f0",
                background: "#f8fafc",
                borderRadius: 18,
                padding: 16,
                display: "grid",
                gap: 10,
              }}
            >
              <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
                {thread.authorLabel} - {relativeTime(thread.created_at)}
              </div>
              <div style={{ fontSize: 15, lineHeight: 1.75, color: "#334155", whiteSpace: "pre-wrap" }}>
                {thread.body}
              </div>
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
                  disabled={thread.viewerSupports || supporting || !viewerId}
                  style={{
                    border: thread.viewerSupports || !viewerId ? "1px solid #d1d5db" : "1px solid #2563eb",
                    background: thread.viewerSupports ? "#f0fdf4" : !viewerId ? "#f8fafc" : "#2563eb",
                    color: thread.viewerSupports ? "#166534" : !viewerId ? "#64748b" : "#ffffff",
                    borderRadius: 10,
                    padding: "10px 14px",
                    fontSize: 14,
                    fontWeight: 800,
                    cursor: thread.viewerSupports || !viewerId ? "default" : "pointer",
                    opacity: supporting || !viewerId ? 0.8 : 1,
                  }}
                >
                  {!viewerId
                    ? "Sign in to support this idea"
                    : thread.viewerSupports
                      ? "You support this idea"
                      : supporting
                        ? "Saving..."
                        : "Support this idea"}
                </button>
              </div>
            ) : null}
          </section>

          <section style={{ display: "grid", gap: 14, marginBottom: 18 }}>
            {replies.length === 0 ? (
              <article
                style={{
                  border: "1px solid #e5e7eb",
                  background: "#ffffff",
                  borderRadius: 18,
                  padding: 18,
                  boxShadow: "0 10px 30px rgba(15,23,42,0.04)",
                  display: "grid",
                  gap: 8,
                }}
              >
                <div style={{ fontSize: 16, fontWeight: 900, color: "#0f172a" }}>
                  This conversation is ready for the first reply.
                </div>
                <div style={{ fontSize: 14, lineHeight: 1.7, color: "#475569" }}>
                  Add a thoughtful response to help the discussion begin.
                </div>
              </article>
            ) : (
              replies.map((reply) => (
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
                    {reply.authorLabel} - {relativeTime(reply.created_at)}
                  </div>
                  <div style={{ fontSize: 14, lineHeight: 1.7, color: "#334155", whiteSpace: "pre-wrap" }}>
                    {reply.body}
                  </div>
                </article>
              ))
            )}
          </section>

          <section style={panelStyle()}>
            <div style={{ fontSize: 18, fontWeight: 900, color: "#0f172a" }}>Reply to this discussion</div>
            <textarea
              value={replyBody}
              onChange={(event) => setReplyBody(event.target.value)}
              rows={5}
              disabled={!canReply || replying}
              placeholder={
                !canReply
                  ? "Sign in to reply"
                  : isFeatureCategory
                    ? "Add a thoughtful reply or build on the idea"
                    : "Add a thoughtful reply"
              }
              style={{
                width: "100%",
                border: "1px solid #d1d5db",
                borderRadius: 12,
                padding: "12px 14px",
                fontSize: 14,
                lineHeight: 1.6,
                background: canReply ? "#ffffff" : "#f8fafc",
                resize: "vertical",
              }}
            />
            {message ? <div style={{ fontSize: 13, color: "#475569", fontWeight: 700 }}>{message}</div> : null}
            <div>
              <button
                type="button"
                onClick={() => void handleReply()}
                disabled={!canReply || replying}
                style={{
                  border: canReply ? "1px solid #2563eb" : "1px solid #d1d5db",
                  background: canReply ? "#2563eb" : "#f8fafc",
                  color: canReply ? "#ffffff" : "#64748b",
                  borderRadius: 10,
                  padding: "10px 14px",
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: !canReply ? "default" : replying ? "wait" : "pointer",
                  opacity: replying || !canReply ? 0.8 : 1,
                }}
              >
                {!canReply ? "Sign in to reply" : replying ? "Posting..." : "Post reply"}
              </button>
            </div>
          </section>
        </>
      )}
    </FamilyTopNavShell>
  );
}
