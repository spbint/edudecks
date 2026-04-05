"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";
import {
  createForumReply,
  loadThreadPageData,
  relativeTime,
  requireCommunityUserId,
  type ForumCategory,
} from "@/lib/communityForum";

type ThreadView = {
  id: string;
  category_id: string;
  user_id: string;
  title: string;
  body: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  authorLabel: string;
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
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      const userId = await requireCommunityUserId();
      if (!userId) {
        router.replace("/login");
        return;
      }

      setViewerId(userId);
      const data = await loadThreadPageData(id, userId);
      setThread(data.thread as ThreadView | null);
      setReplies(data.replies as ReplyView[]);
      setCategory(data.category);
      setLoading(false);
    }

    void load();
  }, [id, router]);

  async function handleReply() {
    if (!viewerId || !thread) return;
    if (!replyBody.trim()) {
      setMessage("Write a reply first.");
      return;
    }

    setReplying(true);
    setMessage("");

    const result = await createForumReply({
      viewerId,
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
    setReplying(false);
  }

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
          Loading discussion…
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
                <div style={{ fontSize: 30, lineHeight: 1.1, fontWeight: 900, color: "#0f172a" }}>
                  {thread.title}
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
              placeholder="Write a thoughtful reply"
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
                {replying ? "Posting…" : "Reply"}
              </button>
            </div>
          </section>
        </>
      )}
    </FamilyTopNavShell>
  );
}
