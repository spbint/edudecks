"use client";

import React from "react";

export type CommunityPostType =
  | "Question"
  | "Idea"
  | "Learning Moment"
  | "Encouragement";

export type CommunityReply = {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  created_at: string;
  authorLabel: string;
};

export type CommunityPostCardData = {
  id: string;
  type: CommunityPostType;
  title: string;
  body: string;
  created_at: string;
  authorLabel: string;
  replyCount: number;
  helpfulCount: number;
  viewerMarkedHelpful: boolean;
  replies: CommunityReply[];
};

type CommunityPostCardProps = {
  post: CommunityPostCardData;
  replyingTo: string | null;
  replyDraft: string;
  onHelpful: (postId: string) => void;
  onReplyToggle: (postId: string) => void;
  onReplyDraftChange: (value: string) => void;
  onReplySubmit: (postId: string) => void;
};

function relativeTime(input: string) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "Just now";

  const diffMs = Date.now() - date.getTime();
  const minutes = Math.max(1, Math.floor(diffMs / 60000));
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString();
}

function typeTone(type: CommunityPostType): React.CSSProperties {
  if (type === "Question") {
    return {
      background: "#eff6ff",
      border: "1px solid #bfdbfe",
      color: "#1d4ed8",
    };
  }
  if (type === "Idea") {
    return {
      background: "#f8fafc",
      border: "1px solid #dbe3ef",
      color: "#334155",
    };
  }
  if (type === "Learning Moment") {
    return {
      background: "#ecfdf5",
      border: "1px solid #a7f3d0",
      color: "#166534",
    };
  }
  return {
    background: "#fff7ed",
    border: "1px solid #fed7aa",
    color: "#9a3412",
  };
}

export default function CommunityPostCard({
  post,
  replyingTo,
  replyDraft,
  onHelpful,
  onReplyToggle,
  onReplyDraftChange,
  onReplySubmit,
}: CommunityPostCardProps) {
  const preview = post.body.trim();
  const isReplying = replyingTo === post.id;

  return (
    <article
      style={{
        border: "1px solid #e5e7eb",
        background: "#ffffff",
        borderRadius: 20,
        padding: 18,
        boxShadow: "0 10px 30px rgba(15,23,42,0.04)",
        display: "grid",
        gap: 14,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "grid", gap: 10 }}>
          <span
            style={{
              ...typeTone(post.type),
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 999,
              padding: "5px 10px",
              width: "fit-content",
              fontSize: 12,
              fontWeight: 800,
            }}
          >
            {post.type}
          </span>

          <div style={{ fontSize: 20, lineHeight: 1.2, fontWeight: 900, color: "#0f172a" }}>
            {post.title}
          </div>

          {preview ? (
            <div style={{ fontSize: 14, lineHeight: 1.7, color: "#475569", maxWidth: 760 }}>
              {preview.length > 220 ? `${preview.slice(0, 220)}…` : preview}
            </div>
          ) : null}
        </div>

        <div style={{ fontSize: 12, lineHeight: 1.6, color: "#64748b", fontWeight: 700 }}>
          {post.authorLabel} · {relativeTime(post.created_at)}
        </div>
      </div>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", color: "#64748b", fontSize: 13, fontWeight: 700 }}>
        <span>{post.replyCount} replies</span>
        <span>{post.helpfulCount} helpful</span>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => onHelpful(post.id)}
          style={{
            border: post.viewerMarkedHelpful ? "1px solid #bfdbfe" : "1px solid #d1d5db",
            background: post.viewerMarkedHelpful ? "#eff6ff" : "#ffffff",
            color: post.viewerMarkedHelpful ? "#1d4ed8" : "#334155",
            borderRadius: 10,
            padding: "9px 12px",
            fontSize: 13,
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          Helpful
        </button>

        <button
          type="button"
          onClick={() => onReplyToggle(post.id)}
          style={{
            border: "1px solid #d1d5db",
            background: "#ffffff",
            color: "#334155",
            borderRadius: 10,
            padding: "9px 12px",
            fontSize: 13,
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          Reply
        </button>
      </div>

      {isReplying ? (
        <div
          style={{
            border: "1px solid #e5e7eb",
            background: "#f8fafc",
            borderRadius: 16,
            padding: 14,
            display: "grid",
            gap: 10,
          }}
        >
          <textarea
            value={replyDraft}
            onChange={(e) => onReplyDraftChange(e.target.value)}
            placeholder="Write a supportive reply..."
            rows={3}
            style={{
              width: "100%",
              border: "1px solid #d1d5db",
              borderRadius: 12,
              padding: "12px 14px",
              resize: "vertical",
              fontSize: 14,
              lineHeight: 1.6,
              color: "#111827",
              background: "#ffffff",
            }}
          />

          <div>
            <button
              type="button"
              onClick={() => onReplySubmit(post.id)}
              style={{
                border: "1px solid #2563eb",
                background: "#2563eb",
                color: "#ffffff",
                borderRadius: 10,
                padding: "10px 14px",
                fontSize: 13,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Reply
            </button>
          </div>
        </div>
      ) : null}

      {post.replies.length ? (
        <div style={{ display: "grid", gap: 10 }}>
          {post.replies.map((reply) => (
            <div
              key={reply.id}
              style={{
                borderLeft: "3px solid #dbeafe",
                background: "#f8fafc",
                borderRadius: 14,
                padding: "12px 14px",
              }}
            >
              <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 6 }}>
                {reply.authorLabel} · {relativeTime(reply.created_at)}
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.65, color: "#334155" }}>{reply.body}</div>
            </div>
          ))}
        </div>
      ) : null}
    </article>
  );
}
