"use client";

import React, { useEffect, useMemo, useState } from "react";
import CleanAppHeader from "@/app/components/clean/CleanAppHeader";
import {
  COMMUNITY_NOT_AVAILABLE_MESSAGE,
  createCommunityPost,
  createCommunityThread,
  listCommunityPosts,
  listCommunityReplyCounts,
  listCommunityThreads,
  reportCommunityContent,
} from "@/lib/clean/community/client";
import { getCurrentCleanUserId } from "@/lib/clean/family/client";
import {
  COMMUNITY_CATEGORIES,
  COMMUNITY_CATEGORY_LABELS,
  type CommunityCategory,
  type CommunityPost,
  type CommunityThread,
} from "@/lib/clean/community/types";

const shellStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#f8fafc",
  padding: "32px 20px 48px",
};

const wrapStyle: React.CSSProperties = {
  maxWidth: 1180,
  margin: "0 auto",
  display: "grid",
  gap: 20,
};

const cardStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 20,
  background: "#ffffff",
  padding: 20,
  boxShadow: "0 10px 28px rgba(15,23,42,0.05)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #cbd5e1",
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 14,
  background: "#ffffff",
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: 120,
  resize: "vertical",
  lineHeight: 1.5,
};

const buttonStyle: React.CSSProperties = {
  border: "1px solid #0f172a",
  background: "#0f172a",
  color: "#ffffff",
  borderRadius: 10,
  padding: "10px 14px",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
  borderRadius: 10,
  padding: "10px 14px",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
};

const subtleButtonStyle: React.CSSProperties = {
  border: "none",
  background: "transparent",
  color: "#1d4ed8",
  padding: 0,
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
};

type CategoryFilter = "all" | CommunityCategory;

type ReportTarget = {
  id: string;
  type: "thread" | "post";
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function getPreviewText(value: string, maxLength = 170) {
  const text = safe(value);
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}...`;
}

function formatDateLabel(value: string | null) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "Recently";

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTarget = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayDiff = Math.round(
    (startOfToday.getTime() - startOfTarget.getTime()) / (24 * 60 * 60 * 1000),
  );

  if (dayDiff === 0) return "Today";
  if (dayDiff === 1) return "Yesterday";

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTimeLabel(value: string | null) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "Recently";

  const dateLabel = formatDateLabel(value);
  const timeLabel = date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  if (dateLabel === "Today" || dateLabel === "Yesterday") {
    return `${dateLabel} at ${timeLabel}`;
  }

  return `${dateLabel} at ${timeLabel}`;
}

function formatReplyCount(count: number) {
  if (count === 1) return "1 reply";
  return `${count} replies`;
}

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function messageFromError(error: unknown, fallback: string) {
  return String((error as { message?: unknown })?.message ?? fallback).trim();
}

function getAuthorLabel(authorUserId: string, currentUserId: string | null) {
  if (currentUserId && safe(authorUserId) === safe(currentUserId)) {
    return "You";
  }

  return "Community member";
}

export default function CleanCommunityWorkspace() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [threads, setThreads] = useState<CommunityThread[]>([]);
  const [replyCounts, setReplyCounts] = useState<Record<string, number>>({});
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("all");
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [replies, setReplies] = useState<CommunityPost[]>([]);
  const [threadsLoading, setThreadsLoading] = useState(true);
  const [threadsError, setThreadsError] = useState<string | null>(null);
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [repliesError, setRepliesError] = useState<string | null>(null);
  const [threadTitle, setThreadTitle] = useState("");
  const [threadCategory, setThreadCategory] = useState<CommunityCategory>("general");
  const [threadBody, setThreadBody] = useState("");
  const [threadLinkUrl, setThreadLinkUrl] = useState("");
  const [threadSubmitting, setThreadSubmitting] = useState(false);
  const [threadMessage, setThreadMessage] = useState<string | null>(null);
  const [threadError, setThreadError] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [replyMessage, setReplyMessage] = useState<string | null>(null);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportMessage, setReportMessage] = useState<string | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);

  const filteredThreads = useMemo(() => {
    if (selectedCategory === "all") return threads;
    return threads.filter((thread) => thread.category === selectedCategory);
  }, [selectedCategory, threads]);

  const selectedThread = useMemo(
    () => filteredThreads.find((thread) => thread.id === selectedThreadId) ?? null,
    [filteredThreads, selectedThreadId],
  );

  const communityUnavailable = threadsError === COMMUNITY_NOT_AVAILABLE_MESSAGE;

  async function loadThreads() {
    setThreadsLoading(true);
    setThreadsError(null);

    try {
      const nextThreads = await listCommunityThreads();
      setThreads(nextThreads);

      const nextCounts = await listCommunityReplyCounts(nextThreads.map((thread) => thread.id));
      setReplyCounts(nextCounts);
    } catch (nextError) {
      setThreads([]);
      setReplyCounts({});
      setThreadsError(
        messageFromError(nextError, "We could not load MyLearna Community just now."),
      );
    } finally {
      setThreadsLoading(false);
    }
  }

  useEffect(() => {
    void loadThreads();
  }, []);

  useEffect(() => {
    let active = true;

    async function loadCurrentUser() {
      try {
        const nextUserId = await getCurrentCleanUserId();
        if (active) {
          setCurrentUserId(nextUserId);
        }
      } catch {
        if (active) {
          setCurrentUserId(null);
        }
      }
    }

    void loadCurrentUser();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!filteredThreads.length) {
      setSelectedThreadId(null);
      return;
    }

    if (!selectedThreadId || !filteredThreads.some((thread) => thread.id === selectedThreadId)) {
      setSelectedThreadId(filteredThreads[0]?.id ?? null);
    }
  }, [filteredThreads, selectedThreadId]);

  useEffect(() => {
    async function loadReplies() {
      if (!selectedThreadId) {
        setReplies([]);
        setRepliesError(null);
        return;
      }

      setRepliesLoading(true);
      setRepliesError(null);

      try {
        const nextReplies = await listCommunityPosts(selectedThreadId);
        setReplies(nextReplies);
      } catch (nextError) {
        setReplies([]);
        setRepliesError(
          messageFromError(nextError, "We could not load replies for this thread."),
        );
      } finally {
        setRepliesLoading(false);
      }
    }

    void loadReplies();
  }, [selectedThreadId]);

  async function handleCreateThread(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = safe(threadTitle);
    const body = safe(threadBody);
    const linkUrl = safe(threadLinkUrl);

    if (!title) {
      setThreadError("Add a title for your thread.");
      setThreadMessage(null);
      return;
    }

    if (!body) {
      setThreadError("Add your message before posting.");
      setThreadMessage(null);
      return;
    }

    if (linkUrl && !isValidHttpUrl(linkUrl)) {
      setThreadError("Add a full link starting with http:// or https://, or leave it blank.");
      setThreadMessage(null);
      return;
    }

    setThreadSubmitting(true);
    setThreadError(null);
    setThreadMessage(null);

    try {
      const createdThread = await createCommunityThread({
        category: threadCategory,
        title,
        body,
        linkUrl: linkUrl || null,
      });

      setThreads((current) => [createdThread, ...current]);
      setReplyCounts((current) => ({ ...current, [createdThread.id]: 0 }));
      setSelectedCategory("all");
      setSelectedThreadId(createdThread.id);
      setThreadTitle("");
      setThreadBody("");
      setThreadLinkUrl("");
      setThreadCategory("general");
      setThreadMessage("Thread posted.");
    } catch (nextError) {
      setThreadError(
        messageFromError(nextError, "We could not post this community thread."),
      );
    } finally {
      setThreadSubmitting(false);
    }
  }

  async function handleReplySubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedThread) {
      setReplyError("Choose a thread before replying.");
      setReplyMessage(null);
      return;
    }

    const body = safe(replyBody);
    if (!body) {
      setReplyError("Add your reply before posting.");
      setReplyMessage(null);
      return;
    }

    setReplySubmitting(true);
    setReplyError(null);
    setReplyMessage(null);

    try {
      const createdReply = await createCommunityPost(selectedThread.id, { body });
      setReplies((current) => [...current, createdReply]);
      setReplyCounts((current) => ({
        ...current,
        [selectedThread.id]: (current[selectedThread.id] ?? 0) + 1,
      }));
      setReplyBody("");
      setReplyMessage("Reply posted.");
    } catch (nextError) {
      setReplyError(messageFromError(nextError, "We could not post this reply."));
    } finally {
      setReplySubmitting(false);
    }
  }

  async function handleReportSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!reportTarget) {
      setReportError("Choose something to report.");
      setReportMessage(null);
      return;
    }

    const reason = safe(reportReason);
    if (!reason) {
      setReportError("Add a reason before sending this report.");
      setReportMessage(null);
      return;
    }

    setReportSubmitting(true);
    setReportError(null);
    setReportMessage(null);

    try {
      await reportCommunityContent({
        targetType: reportTarget.type,
        targetId: reportTarget.id,
        reason,
      });
      setReportReason("");
      setReportMessage("Thanks. We'll review this.");
    } catch (nextError) {
      setReportError(
        messageFromError(nextError, "We could not send this community report."),
      );
    } finally {
      setReportSubmitting(false);
    }
  }

  function openReportForm(target: ReportTarget) {
    setReportTarget(target);
    setReportReason("");
    setReportError(null);
    setReportMessage(null);
  }

  return (
    <div style={shellStyle}>
      <div style={wrapStyle}>
        <CleanAppHeader />

        <section style={cardStyle}>
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ color: "#1d4ed8", fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Community
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              <h1 style={{ margin: 0, fontSize: 32, color: "#0f172a" }}>MyLearna Community</h1>
              <p style={{ margin: 0, color: "#475569", fontSize: 16, lineHeight: 1.7 }}>
                A place for homeschool families to share ideas, resources, reporting questions,
                and suggestions for MyLearna.
              </p>
            </div>
          </div>
        </section>

        <div
          style={{
            display: "grid",
            gap: 20,
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          }}
        >
          <section style={{ ...cardStyle, display: "grid", gap: 18 }}>
            <div style={{ display: "grid", gap: 10 }}>
              <h2 style={{ margin: 0, fontSize: 20, color: "#0f172a" }}>Browse discussions</h2>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                <button
                  type="button"
                  onClick={() => setSelectedCategory("all")}
                  aria-pressed={selectedCategory === "all"}
                  style={{
                    ...secondaryButtonStyle,
                    borderColor: selectedCategory === "all" ? "#1d4ed8" : "#cbd5e1",
                    background: selectedCategory === "all" ? "#eff6ff" : "#ffffff",
                    color: selectedCategory === "all" ? "#1d4ed8" : "#0f172a",
                    padding: "8px 12px",
                    fontSize: 13,
                  }}
                >
                  All discussions
                </button>
                {COMMUNITY_CATEGORIES.map((category) => {
                  const active = selectedCategory === category;

                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setSelectedCategory(category)}
                      aria-pressed={active}
                      style={{
                        ...secondaryButtonStyle,
                        borderColor: active ? "#1d4ed8" : "#cbd5e1",
                        background: active ? "#eff6ff" : "#ffffff",
                        color: active ? "#1d4ed8" : "#0f172a",
                        padding: "8px 12px",
                        fontSize: 13,
                      }}
                    >
                      {COMMUNITY_CATEGORY_LABELS[category]}
                    </button>
                  );
                })}
              </div>
            </div>

            {threadsError && !communityUnavailable ? (
              <div
                role="alert"
                style={{
                  border: "1px solid #fecaca",
                  borderRadius: 14,
                  background: "#fef2f2",
                  padding: 14,
                  color: "#991b1b",
                  fontSize: 14,
                  lineHeight: 1.6,
                }}
              >
                {threadsError}
              </div>
            ) : null}

            {communityUnavailable ? (
              <div
                style={{
                  border: "1px solid #dbeafe",
                  borderRadius: 16,
                  background: "#f8fbff",
                  padding: 18,
                  display: "grid",
                  gap: 8,
                }}
              >
                <h2 style={{ margin: 0, fontSize: 18, color: "#0f172a" }}>
                  MyLearna Community is not available yet.
                </h2>
                <p style={{ margin: 0, color: "#475569", fontSize: 14, lineHeight: 1.6 }}>
                  Check back once Community has been turned on for this workspace.
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gap: 18,
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  alignItems: "start",
                }}
              >
                <div style={{ display: "grid", gap: 10 }}>
                  {threadsLoading ? (
                    <div style={{ color: "#64748b", fontSize: 14 }}>Loading community threads...</div>
                  ) : filteredThreads.length ? (
                    filteredThreads.map((thread) => {
                      const active = thread.id === selectedThreadId;
                      const replyCount = replyCounts[thread.id] ?? 0;
                      const authorLabel = getAuthorLabel(thread.authorUserId, currentUserId);

                      return (
                        <button
                          key={thread.id}
                          type="button"
                          onClick={() => {
                            setSelectedThreadId(thread.id);
                            setReplyMessage(null);
                            setReplyError(null);
                            setReportMessage(null);
                            setReportError(null);
                            setReportTarget(null);
                          }}
                          style={{
                            border: active ? "1px solid #1d4ed8" : "1px solid #e2e8f0",
                            background: active ? "#eff6ff" : "#ffffff",
                            borderRadius: 16,
                            padding: 16,
                            textAlign: "left",
                            cursor: "pointer",
                            display: "grid",
                            gap: 10,
                            boxShadow: active ? "0 10px 24px rgba(29,78,216,0.08)" : "none",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                padding: "6px 10px",
                                borderRadius: 999,
                                background: "#ffffff",
                                border: "1px solid #dbeafe",
                                color: "#1d4ed8",
                                fontSize: 12,
                                fontWeight: 700,
                              }}
                            >
                              {COMMUNITY_CATEGORY_LABELS[thread.category]}
                            </span>
                            <span style={{ color: "#64748b", fontSize: 12, whiteSpace: "nowrap" }}>
                              {formatDateLabel(thread.createdAt)}
                            </span>
                          </div>
                          <div style={{ display: "grid", gap: 6 }}>
                            <div style={{ color: "#0f172a", fontSize: 16, fontWeight: 800 }}>
                              {thread.title}
                            </div>
                            <div
                              style={{
                                color: "#475569",
                                fontSize: 14,
                                lineHeight: 1.6,
                                wordBreak: "break-word",
                              }}
                            >
                              {getPreviewText(thread.body)}
                            </div>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              gap: 12,
                              alignItems: "center",
                              flexWrap: "wrap",
                              color: "#64748b",
                              fontSize: 12,
                              fontWeight: 600,
                            }}
                          >
                            <span>{authorLabel}</span>
                            <span>
                              {formatReplyCount(replyCount)}
                              {active ? " · Selected" : ""}
                            </span>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div
                      style={{
                        border: "1px dashed #cbd5e1",
                        borderRadius: 16,
                        padding: 18,
                        color: "#475569",
                        fontSize: 14,
                        lineHeight: 1.7,
                      }}
                    >
                      {threads.length
                        ? "No threads match this category yet."
                        : "No threads yet. Start the first discussion from the panel on the right."}
                    </div>
                  )}
                </div>

                <div style={{ display: "grid", gap: 16 }}>
                  {selectedThread ? (
                    <section
                      style={{
                        border: "1px solid #e2e8f0",
                        borderRadius: 18,
                        background: "#ffffff",
                        padding: 20,
                        display: "grid",
                        gap: 16,
                      }}
                    >
                      <div style={{ display: "grid", gap: 14 }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 12,
                            alignItems: "flex-start",
                            flexWrap: "wrap",
                          }}
                        >
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                padding: "6px 10px",
                                borderRadius: 999,
                                background: "#eff6ff",
                                color: "#1d4ed8",
                                fontSize: 12,
                                fontWeight: 700,
                              }}
                            >
                              {COMMUNITY_CATEGORY_LABELS[selectedThread.category]}
                            </span>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                padding: "6px 10px",
                                borderRadius: 999,
                                background: "#f8fafc",
                                color: "#475569",
                                fontSize: 12,
                                fontWeight: 700,
                                border: "1px solid #e2e8f0",
                              }}
                            >
                              {formatReplyCount(replyCounts[selectedThread.id] ?? 0)}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => openReportForm({ id: selectedThread.id, type: "thread" })}
                            style={subtleButtonStyle}
                          >
                            Report thread
                          </button>
                        </div>

                        <div style={{ display: "grid", gap: 8 }}>
                          <h2 style={{ margin: 0, fontSize: 26, color: "#0f172a", lineHeight: 1.2 }}>
                            {selectedThread.title}
                          </h2>
                          <div
                            style={{
                              display: "flex",
                              gap: 10,
                              flexWrap: "wrap",
                              alignItems: "center",
                              color: "#64748b",
                              fontSize: 13,
                            }}
                          >
                            <span style={{ color: "#0f172a", fontWeight: 700 }}>
                              {getAuthorLabel(selectedThread.authorUserId, currentUserId)}
                            </span>
                            <span aria-hidden="true">•</span>
                            <span>{formatDateTimeLabel(selectedThread.createdAt)}</span>
                          </div>
                        </div>

                        <div
                          style={{
                            border: "1px solid #dbeafe",
                            borderRadius: 18,
                            background: "#f8fbff",
                            padding: 18,
                            display: "grid",
                            gap: 12,
                          }}
                        >
                          <div
                            style={{
                              color: "#64748b",
                              fontSize: 12,
                              fontWeight: 800,
                              letterSpacing: "0.08em",
                              textTransform: "uppercase",
                            }}
                          >
                            Original post
                          </div>
                          <div
                            style={{
                              margin: 0,
                              color: "#334155",
                              fontSize: 15,
                              lineHeight: 1.9,
                              whiteSpace: "pre-wrap",
                              wordBreak: "break-word",
                            }}
                          >
                            {selectedThread.body}
                          </div>
                          {selectedThread.linkUrl ? (
                            <a
                              href={selectedThread.linkUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                color: "#1d4ed8",
                                fontSize: 14,
                                fontWeight: 700,
                                wordBreak: "break-word",
                              }}
                            >
                              Visit shared link
                            </a>
                          ) : null}
                        </div>
                      </div>

                      {reportTarget?.type === "thread" && reportTarget.id === selectedThread.id ? (
                        <form
                          onSubmit={(event) => void handleReportSubmit(event)}
                          style={{
                            borderTop: "1px solid #e2e8f0",
                            paddingTop: 16,
                            display: "grid",
                            gap: 10,
                          }}
                        >
                          <label style={{ display: "grid", gap: 6 }}>
                            <span style={{ color: "#0f172a", fontSize: 13, fontWeight: 700 }}>
                              Tell us what needs review
                            </span>
                            <textarea
                              value={reportReason}
                              onChange={(event) => setReportReason(event.target.value)}
                              style={{ ...textareaStyle, minHeight: 96 }}
                              placeholder="Briefly explain why this thread should be reviewed."
                            />
                          </label>
                          {reportError ? (
                            <div role="alert" style={{ color: "#b91c1c", fontSize: 13 }}>
                              {reportError}
                            </div>
                          ) : null}
                          {reportMessage ? (
                            <div role="status" style={{ color: "#166534", fontSize: 13 }}>
                              {reportMessage}
                            </div>
                          ) : null}
                          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                            <button type="submit" disabled={reportSubmitting} style={buttonStyle}>
                              {reportSubmitting ? "Sending..." : "Submit report"}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setReportTarget(null);
                                setReportReason("");
                                setReportError(null);
                              }}
                              style={secondaryButtonStyle}
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : null}

                      <div style={{ display: "grid", gap: 14 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                          <h3 style={{ margin: 0, fontSize: 18, color: "#0f172a" }}>Conversation</h3>
                          <span style={{ color: "#64748b", fontSize: 13 }}>
                            {formatReplyCount(replyCounts[selectedThread.id] ?? 0)}
                          </span>
                        </div>

                        {repliesError ? (
                          <div role="alert" style={{ color: "#b91c1c", fontSize: 13 }}>
                            {repliesError}
                          </div>
                        ) : null}

                        {repliesLoading ? (
                          <div style={{ color: "#64748b", fontSize: 14 }}>Loading replies...</div>
                        ) : replies.length ? (
                          <div style={{ display: "grid", gap: 14 }}>
                            {replies.map((reply, index) => {
                              const isOriginalPoster =
                                reply.authorUserId === selectedThread.authorUserId;

                              return (
                                <article
                                  key={reply.id}
                                  style={{
                                    display: "grid",
                                    gridTemplateColumns: "18px minmax(0, 1fr)",
                                    gap: 12,
                                    alignItems: "stretch",
                                  }}
                                >
                                  <div
                                    aria-hidden="true"
                                    style={{
                                      display: "grid",
                                      justifyItems: "center",
                                      gridTemplateRows: "18px minmax(0, 1fr)",
                                    }}
                                  >
                                    <span
                                      style={{
                                        width: 10,
                                        height: 10,
                                        borderRadius: 999,
                                        background: "#93c5fd",
                                        marginTop: 4,
                                      }}
                                    />
                                    {index < replies.length - 1 ? (
                                      <span
                                        style={{
                                          width: 2,
                                          height: "100%",
                                          background: "#dbeafe",
                                          borderRadius: 999,
                                        }}
                                      />
                                    ) : null}
                                  </div>

                                  <div
                                    style={{
                                      borderLeft: "3px solid #dbeafe",
                                      borderRadius: 16,
                                      padding: "14px 16px",
                                      display: "grid",
                                      gap: 10,
                                      background: "#f8fafc",
                                    }}
                                  >
                                    <div
                                      style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        gap: 12,
                                        alignItems: "flex-start",
                                        flexWrap: "wrap",
                                      }}
                                    >
                                      <div style={{ display: "grid", gap: 6 }}>
                                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                                          <span
                                            style={{
                                              display: "inline-flex",
                                              alignItems: "center",
                                              padding: "5px 9px",
                                              borderRadius: 999,
                                              background: "#ffffff",
                                              border: "1px solid #dbeafe",
                                              color: "#1d4ed8",
                                              fontSize: 11,
                                              fontWeight: 800,
                                            }}
                                          >
                                            Reply {index + 1}
                                          </span>
                                          {isOriginalPoster ? (
                                            <span
                                              style={{
                                                display: "inline-flex",
                                                alignItems: "center",
                                                padding: "5px 9px",
                                                borderRadius: 999,
                                                background: "#ffffff",
                                                border: "1px solid #e2e8f0",
                                                color: "#475569",
                                                fontSize: 11,
                                                fontWeight: 700,
                                              }}
                                            >
                                              Original poster
                                            </span>
                                          ) : null}
                                        </div>
                                        <div
                                          style={{
                                            display: "flex",
                                            gap: 10,
                                            flexWrap: "wrap",
                                            alignItems: "center",
                                            color: "#64748b",
                                            fontSize: 12,
                                          }}
                                        >
                                          <span style={{ color: "#0f172a", fontWeight: 700 }}>
                                            {getAuthorLabel(reply.authorUserId, currentUserId)}
                                          </span>
                                          <span aria-hidden="true">•</span>
                                          <span>{formatDateTimeLabel(reply.createdAt)}</span>
                                        </div>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => openReportForm({ id: reply.id, type: "post" })}
                                        style={subtleButtonStyle}
                                      >
                                        Report reply
                                      </button>
                                    </div>

                                    <div
                                      style={{
                                        color: "#334155",
                                        fontSize: 14,
                                        lineHeight: 1.8,
                                        whiteSpace: "pre-wrap",
                                        wordBreak: "break-word",
                                      }}
                                    >
                                      {reply.body}
                                    </div>

                                    {reportTarget?.type === "post" && reportTarget.id === reply.id ? (
                                      <form
                                        onSubmit={(event) => void handleReportSubmit(event)}
                                        style={{
                                          borderTop: "1px solid #dbeafe",
                                          paddingTop: 12,
                                          display: "grid",
                                          gap: 10,
                                        }}
                                      >
                                        <label style={{ display: "grid", gap: 6 }}>
                                          <span style={{ color: "#0f172a", fontSize: 13, fontWeight: 700 }}>
                                            Tell us what needs review
                                          </span>
                                          <textarea
                                            value={reportReason}
                                            onChange={(event) => setReportReason(event.target.value)}
                                            style={{ ...textareaStyle, minHeight: 88 }}
                                            placeholder="Briefly explain why this reply should be reviewed."
                                          />
                                        </label>
                                        {reportError ? (
                                          <div role="alert" style={{ color: "#b91c1c", fontSize: 13 }}>
                                            {reportError}
                                          </div>
                                        ) : null}
                                        {reportMessage ? (
                                          <div role="status" style={{ color: "#166534", fontSize: 13 }}>
                                            {reportMessage}
                                          </div>
                                        ) : null}
                                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                                          <button type="submit" disabled={reportSubmitting} style={buttonStyle}>
                                            {reportSubmitting ? "Sending..." : "Submit report"}
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setReportTarget(null);
                                              setReportReason("");
                                              setReportError(null);
                                            }}
                                            style={secondaryButtonStyle}
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </form>
                                    ) : null}
                                  </div>
                                </article>
                              );
                            })}
                          </div>
                        ) : (
                          <div
                            style={{
                              border: "1px dashed #cbd5e1",
                              borderRadius: 16,
                              padding: 16,
                              color: "#475569",
                              fontSize: 14,
                              lineHeight: 1.7,
                            }}
                          >
                            No replies yet. Add the first response below.
                          </div>
                        )}

                        <form
                          onSubmit={(event) => void handleReplySubmit(event)}
                          style={{
                            borderTop: "1px solid #e2e8f0",
                            paddingTop: 16,
                            display: "grid",
                            gap: 10,
                          }}
                        >
                          <label style={{ display: "grid", gap: 6 }}>
                            <span style={{ color: "#0f172a", fontSize: 14, fontWeight: 700 }}>
                              Add a reply
                            </span>
                            <textarea
                              value={replyBody}
                              onChange={(event) => setReplyBody(event.target.value)}
                              style={{ ...textareaStyle, minHeight: 110 }}
                              placeholder="Share a practical response for other homeschool families."
                            />
                          </label>
                          {replyError ? (
                            <div role="alert" style={{ color: "#b91c1c", fontSize: 13 }}>
                              {replyError}
                            </div>
                          ) : null}
                          {replyMessage ? (
                            <div role="status" style={{ color: "#166534", fontSize: 13 }}>
                              {replyMessage}
                            </div>
                          ) : null}
                          <div>
                            <button type="submit" disabled={replySubmitting} style={buttonStyle}>
                              {replySubmitting ? "Posting..." : "Post reply"}
                            </button>
                          </div>
                        </form>
                      </div>
                    </section>
                  ) : (
                    <section
                      style={{
                        border: "1px dashed #cbd5e1",
                        borderRadius: 18,
                        padding: 20,
                        color: "#475569",
                        fontSize: 14,
                        lineHeight: 1.7,
                      }}
                    >
                      {threads.length
                        ? "Choose a thread to read the full discussion and reply."
                        : "Community conversations will appear here once the first thread is posted."}
                    </section>
                  )}
                </div>
              </div>
            )}
          </section>

          <aside style={{ display: "grid", gap: 20, alignContent: "start" }}>
            <section style={cardStyle}>
              <div style={{ display: "grid", gap: 10 }}>
                <h2 style={{ margin: 0, fontSize: 18, color: "#0f172a" }}>Community guidelines</h2>
                <ul style={{ margin: 0, paddingLeft: 18, color: "#475569", fontSize: 14, lineHeight: 1.8 }}>
                  <li>Do not share children&apos;s full names or identifying details.</li>
                  <li>Do not post private family learning records.</li>
                  <li>Community discussion is not legal advice.</li>
                  <li>Be respectful and practical.</li>
                </ul>
              </div>
            </section>

            <section style={cardStyle}>
              <form onSubmit={(event) => void handleCreateThread(event)} style={{ display: "grid", gap: 12 }}>
                <div style={{ display: "grid", gap: 6 }}>
                  <h2 style={{ margin: 0, fontSize: 18, color: "#0f172a" }}>Start a thread</h2>
                  <p style={{ margin: 0, color: "#64748b", fontSize: 13, lineHeight: 1.6 }}>
                    Text-only for now. Media sharing and direct messages are not part of Community.
                  </p>
                </div>

                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ color: "#0f172a", fontSize: 13, fontWeight: 700 }}>Title</span>
                  <input
                    value={threadTitle}
                    onChange={(event) => setThreadTitle(event.target.value)}
                    style={inputStyle}
                    maxLength={160}
                    placeholder="What would you like help with or share?"
                  />
                </label>

                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ color: "#0f172a", fontSize: 13, fontWeight: 700 }}>Category</span>
                  <select
                    value={threadCategory}
                    onChange={(event) => setThreadCategory(event.target.value as CommunityCategory)}
                    style={inputStyle}
                  >
                    {COMMUNITY_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {COMMUNITY_CATEGORY_LABELS[category]}
                      </option>
                    ))}
                  </select>
                </label>

                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ color: "#0f172a", fontSize: 13, fontWeight: 700 }}>Message</span>
                  <textarea
                    value={threadBody}
                    onChange={(event) => setThreadBody(event.target.value)}
                    style={textareaStyle}
                    placeholder="Share the question, idea, or resource you want to discuss."
                  />
                </label>

                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ color: "#0f172a", fontSize: 13, fontWeight: 700 }}>
                    Optional link
                  </span>
                  <input
                    value={threadLinkUrl}
                    onChange={(event) => setThreadLinkUrl(event.target.value)}
                    style={inputStyle}
                    placeholder="https://example.com/resource"
                  />
                </label>

                {threadError ? (
                  <div role="alert" style={{ color: "#b91c1c", fontSize: 13 }}>
                    {threadError}
                  </div>
                ) : null}
                {threadMessage ? (
                  <div role="status" style={{ color: "#166534", fontSize: 13 }}>
                    {threadMessage}
                  </div>
                ) : null}

                <div>
                  <button type="submit" disabled={threadSubmitting || communityUnavailable} style={buttonStyle}>
                    {threadSubmitting ? "Posting..." : "Post thread"}
                  </button>
                </div>
              </form>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
