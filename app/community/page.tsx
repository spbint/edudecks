"use client";

import React, { useEffect, useMemo, useState } from "react";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";
import CommunityPostCard, {
  type CommunityPostCardData,
  type CommunityPostType,
  type CommunityReply,
} from "@/app/components/CommunityPostCard";
import { supabase } from "@/lib/supabaseClient";

type PostRow = {
  id: string;
  user_id: string;
  type: CommunityPostType;
  title: string;
  body: string | null;
  created_at: string;
};

type ReplyRow = {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  created_at: string;
};

type ReactionRow = {
  id: string;
  post_id: string;
  user_id: string;
  type: "helpful";
};

type DraftPost = {
  type: CommunityPostType;
  title: string;
  body: string;
};

const STORAGE_KEY = "edudecks.community.v1";
const POST_TYPES: CommunityPostType[] = [
  "Question",
  "Idea",
  "Learning Moment",
  "Encouragement",
];

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function parseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function isMissingRelationOrColumn(err: any) {
  const message = String(err?.message ?? "").toLowerCase();
  return message.includes("does not exist") && (message.includes("relation") || message.includes("column"));
}

function buildAuthorLabel(userId: string, viewerId: string | null) {
  if (!safe(userId)) return "Parent";
  if (viewerId && userId === viewerId) return "You";
  return `Parent ${safe(userId).slice(0, 4)}`;
}

function readLocalCommunity() {
  if (typeof window === "undefined") {
    return {
      posts: [] as PostRow[],
      replies: [] as ReplyRow[],
      reactions: [] as ReactionRow[],
    };
  }

  return parseJson(
    window.localStorage.getItem(STORAGE_KEY),
    {
      posts: [] as PostRow[],
      replies: [] as ReplyRow[],
      reactions: [] as ReactionRow[],
    }
  );
}

function writeLocalCommunity(payload: {
  posts: PostRow[];
  replies: ReplyRow[];
  reactions: ReactionRow[];
}) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export default function CommunityPage() {
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [replies, setReplies] = useState<ReplyRow[]>([]);
  const [reactions, setReactions] = useState<ReactionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [draft, setDraft] = useState<DraftPost>({
    type: "Question",
    title: "",
    body: "",
  });
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setMessage("");

      try {
        const authResp = await supabase.auth.getUser();
        const nextViewerId = authResp.data.user?.id || null;
        setViewerId(nextViewerId);

        const postsResp = await supabase
          .from("community_posts")
          .select("id,user_id,type,title,body,created_at")
          .order("created_at", { ascending: false });

        if (postsResp.error) {
          if (!isMissingRelationOrColumn(postsResp.error)) throw postsResp.error;
          const local = readLocalCommunity();
          setPosts(local.posts);
          setReplies(local.replies);
          setReactions(local.reactions);
          setLoading(false);
          return;
        }

        const repliesResp = await supabase
          .from("community_replies")
          .select("id,post_id,user_id,body,created_at")
          .order("created_at", { ascending: true });

        if (repliesResp.error && !isMissingRelationOrColumn(repliesResp.error)) {
          throw repliesResp.error;
        }

        const reactionsResp = await supabase
          .from("community_reactions")
          .select("id,post_id,user_id,type");

        if (reactionsResp.error && !isMissingRelationOrColumn(reactionsResp.error)) {
          throw reactionsResp.error;
        }

        setPosts(((postsResp.data ?? []) as PostRow[]) || []);
        setReplies(((repliesResp.data ?? []) as ReplyRow[]) || []);
        setReactions(((reactionsResp.data ?? []) as ReactionRow[]) || []);
      } catch (err: any) {
        setMessage(String(err?.message || err || "Community could not load just yet."));
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  const feed = useMemo<CommunityPostCardData[]>(() => {
    return posts.map((post) => {
      const postReplies: CommunityReply[] = replies
        .filter((reply) => reply.post_id === post.id)
        .slice(0, 8)
        .map((reply) => ({
          ...reply,
          authorLabel: buildAuthorLabel(reply.user_id, viewerId),
        }));

      const helpfulCount = reactions.filter(
        (reaction) => reaction.post_id === post.id && reaction.type === "helpful"
      ).length;

      return {
        ...post,
        body: safe(post.body),
        authorLabel: buildAuthorLabel(post.user_id, viewerId),
        replyCount: postReplies.length,
        helpfulCount,
        viewerMarkedHelpful: reactions.some(
          (reaction) =>
            reaction.post_id === post.id &&
            reaction.type === "helpful" &&
            reaction.user_id === viewerId
        ),
        replies: postReplies,
      };
    });
  }, [posts, reactions, replies, viewerId]);

  async function handleCreatePost() {
    if (!viewerId) {
      setMessage("Please sign in to post in Community.");
      return;
    }

    if (!safe(draft.title)) {
      setMessage("Add a short title first.");
      return;
    }

    setSaving(true);
    setMessage("");

    const payload = {
      user_id: viewerId,
      type: draft.type,
      title: safe(draft.title),
      body: safe(draft.body) || null,
    };

    try {
      const response = await supabase
        .from("community_posts")
        .insert(payload)
        .select("id,user_id,type,title,body,created_at")
        .single();

      if (response.error) {
        if (!isMissingRelationOrColumn(response.error)) throw response.error;

        const local = readLocalCommunity();
        const nextPost: PostRow = {
          id: `local-post-${Date.now()}`,
          user_id: viewerId,
          type: draft.type,
          title: safe(draft.title),
          body: safe(draft.body) || null,
          created_at: new Date().toISOString(),
        };
        const next = {
          ...local,
          posts: [nextPost, ...local.posts],
        };
        writeLocalCommunity(next);
        setPosts(next.posts);
        setReplies(next.replies);
        setReactions(next.reactions);
      } else if (response.data) {
        setPosts((current) => [response.data as PostRow, ...current]);
      }

      setDraft({ type: "Question", title: "", body: "" });
      setMessage("Your post is now in the community.");
    } catch (err: any) {
      setMessage(String(err?.message || err || "Your post could not be shared just yet."));
    } finally {
      setSaving(false);
    }
  }

  async function handleHelpful(postId: string) {
    if (!viewerId) {
      setMessage("Please sign in to mark a post as helpful.");
      return;
    }

    const existing = reactions.find(
      (reaction) =>
        reaction.post_id === postId &&
        reaction.user_id === viewerId &&
        reaction.type === "helpful"
    );

    try {
      if (existing) {
        const deleteResp = await supabase
          .from("community_reactions")
          .delete()
          .eq("id", existing.id);

        if (deleteResp.error && !isMissingRelationOrColumn(deleteResp.error)) {
          throw deleteResp.error;
        }

        const nextReactions = reactions.filter((reaction) => reaction.id !== existing.id);
        setReactions(nextReactions);

        if (deleteResp.error) {
          const local = readLocalCommunity();
          writeLocalCommunity({
            ...local,
            reactions: local.reactions.filter((reaction) => reaction.id !== existing.id),
          });
        }
        return;
      }

      const payload = {
        user_id: viewerId,
        post_id: postId,
        type: "helpful" as const,
      };

      const insertResp = await supabase
        .from("community_reactions")
        .insert(payload)
        .select("id,post_id,user_id,type")
        .single();

      if (insertResp.error) {
        if (!isMissingRelationOrColumn(insertResp.error)) throw insertResp.error;
        const local = readLocalCommunity();
        const nextReaction: ReactionRow = {
          id: `local-reaction-${Date.now()}`,
          post_id: postId,
          user_id: viewerId,
          type: "helpful",
        };
        const next = {
          ...local,
          reactions: [...local.reactions, nextReaction],
        };
        writeLocalCommunity(next);
        setReactions(next.reactions);
        return;
      }

      if (insertResp.data) {
        setReactions((current) => [...current, insertResp.data as ReactionRow]);
      }
    } catch (err: any) {
      setMessage(String(err?.message || err || "Helpful could not be updated just yet."));
    }
  }

  function handleReplyToggle(postId: string) {
    setReplyingTo((current) => (current === postId ? null : postId));
    setReplyDraft("");
  }

  async function handleReplySubmit(postId: string) {
    if (!viewerId) {
      setMessage("Please sign in to reply in Community.");
      return;
    }

    if (!safe(replyDraft)) {
      setMessage("Write a short reply first.");
      return;
    }

    try {
      const payload = {
        user_id: viewerId,
        post_id: postId,
        body: safe(replyDraft),
      };

      const response = await supabase
        .from("community_replies")
        .insert(payload)
        .select("id,post_id,user_id,body,created_at")
        .single();

      if (response.error) {
        if (!isMissingRelationOrColumn(response.error)) throw response.error;
        const local = readLocalCommunity();
        const nextReply: ReplyRow = {
          id: `local-reply-${Date.now()}`,
          post_id: postId,
          user_id: viewerId,
          body: safe(replyDraft),
          created_at: new Date().toISOString(),
        };
        const next = {
          ...local,
          replies: [...local.replies, nextReply],
        };
        writeLocalCommunity(next);
        setReplies(next.replies);
      } else if (response.data) {
        setReplies((current) => [...current, response.data as ReplyRow]);
      }

      setReplyDraft("");
      setReplyingTo(null);
    } catch (err: any) {
      setMessage(String(err?.message || err || "Reply could not be added just yet."));
    }
  }

  return (
    <FamilyTopNavShell
      title="EduDecks Family"
      subtitle="Community"
      heroTitle="Community"
      heroText="Learn from other homeschool families in a calm, structured space for questions, ideas, learning moments, and encouragement."
      hideHeroAside={true}
      workflowHelperText="Community sits alongside the family journey as a supportive place to learn from other families without losing your place."
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
          gap: 16,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: 1.1,
              textTransform: "uppercase",
              color: "#64748b",
            }}
          >
            Community
          </div>
          <div
            style={{
              fontSize: 28,
              lineHeight: 1.1,
              fontWeight: 900,
              color: "#0f172a",
              marginTop: 8,
            }}
          >
            Learn from other homeschool families
          </div>
        </div>

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
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: "#475569",
            }}
          >
            Share one useful thing with the community
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {POST_TYPES.map((type) => {
              const active = draft.type === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setDraft((current) => ({ ...current, type }))}
                  style={{
                    border: active ? "1px solid #2563eb" : "1px solid #d1d5db",
                    background: active ? "#eff6ff" : "#ffffff",
                    color: active ? "#1d4ed8" : "#334155",
                    borderRadius: 999,
                    padding: "8px 12px",
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  {type}
                </button>
              );
            })}
          </div>

          <input
            value={draft.title}
            onChange={(e) => setDraft((current) => ({ ...current, title: e.target.value }))}
            placeholder="Title"
            style={{
              width: "100%",
              border: "1px solid #d1d5db",
              borderRadius: 12,
              padding: "12px 14px",
              fontSize: 14,
              color: "#111827",
              background: "#ffffff",
            }}
          />

          <textarea
            value={draft.body}
            onChange={(e) => setDraft((current) => ({ ...current, body: e.target.value }))}
            placeholder="Add a little more context if helpful"
            rows={4}
            style={{
              width: "100%",
              border: "1px solid #d1d5db",
              borderRadius: 12,
              padding: "12px 14px",
              fontSize: 14,
              lineHeight: 1.6,
              color: "#111827",
              background: "#ffffff",
              resize: "vertical",
            }}
          />

          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
              Keep it practical, calm, and supportive.
            </div>

            <button
              type="button"
              onClick={() => void handleCreatePost()}
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
              {saving ? "Posting…" : "Post"}
            </button>
          </div>
        </div>

        {message ? (
          <div
            style={{
              border: "1px solid #e5e7eb",
              background: "#f8fafc",
              color: "#475569",
              borderRadius: 14,
              padding: 12,
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {message}
          </div>
        ) : null}
      </section>

      <section style={{ display: "grid", gap: 14 }}>
        {loading ? (
          <div
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
          </div>
        ) : feed.length === 0 ? (
          <div
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
              Start the first conversation
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.7, color: "#475569", maxWidth: 720 }}>
              Ask a question, share a learning moment, offer an idea, or leave encouragement for another family.
            </div>
          </div>
        ) : (
          feed.map((post) => (
            <CommunityPostCard
              key={post.id}
              post={post}
              replyingTo={replyingTo}
              replyDraft={replyDraft}
              onHelpful={handleHelpful}
              onReplyToggle={handleReplyToggle}
              onReplyDraftChange={setReplyDraft}
              onReplySubmit={(postId) => void handleReplySubmit(postId)}
            />
          ))
        )}
      </section>
    </FamilyTopNavShell>
  );
}
