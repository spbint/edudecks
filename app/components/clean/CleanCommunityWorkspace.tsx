"use client";

import { useSearchParams } from "next/navigation";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  COMMUNITY_STARTER_THREADS,
  getStarterPostAuthorLabel,
  getStarterRepliesForThread,
  getStarterThreadBadge,
  isStarterCommunityPostId,
  isStarterCommunityThreadId,
} from "@/lib/clean/community/communityStarterThreads";
import {
  COMMUNITY_NOT_AVAILABLE_MESSAGE,
  createCommunityPost,
  createCommunityThread,
  deleteCommunityPost,
  deleteCommunityThread,
  listCommunityPosts,
  listCommunityReactionSummary,
  listCommunityReplyCounts,
  listCommunityThreads,
  toggleCommunityReaction,
  updateCommunityPost,
  updateCommunityThread,
} from "@/lib/clean/community/client";
import { submitReportProblem } from "@/app/components/clean/feedback/reportProblemClient";
import { getCurrentCleanUserId } from "@/lib/clean/family/client";
import {
  COMMUNITY_CATEGORIES,
  COMMUNITY_CATEGORY_LABELS,
  COMMUNITY_REACTION_LABELS,
  COMMUNITY_REACTION_TYPES,
  type CommunityCategory,
  type CommunityPost,
  type CommunityReactionSummary,
  type CommunityReactionTargetType,
  type CommunityReactionType,
  type CommunityThread,
} from "@/lib/clean/community/types";

const shellStyle: React.CSSProperties = {
  minHeight: "auto",
  background: "transparent",
  padding: 0,
};

const wrapStyle: React.CSSProperties = {
  maxWidth: 1180,
  margin: "0 auto",
  display: "grid",
  gap: 20,
};

const cardStyle: React.CSSProperties = {
  border: "1px solid #E7EAF2",
  borderRadius: 20,
  background: "#ffffff",
  padding: "clamp(16px, 3vw, 22px)",
  boxShadow: "0 8px 24px rgba(23,32,75,0.06)",
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
  border: "1px solid #6C4DF6",
  background: "#6C4DF6",
  color: "#ffffff",
  borderRadius: 14,
  padding: "10px 14px",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
  border: "1px solid #E7EAF2",
  background: "#ffffff",
  color: "#17204B",
  borderRadius: 14,
  padding: "10px 14px",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
};

const smallButtonStyle: React.CSSProperties = {
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
  borderRadius: 999,
  padding: "7px 11px",
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
};

const dangerButtonStyle: React.CSSProperties = {
  ...smallButtonStyle,
  border: "1px solid #fecaca",
  background: "#fff5f5",
  color: "#b91c1c",
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

type SuggestFeedbackType =
  | "suggest-improvement"
  | "suggest-tool"
  | "report-problem"
  | "general-feedback";

const SUGGEST_SOURCE_PAGE_LABELS: Record<string, string> = {
  "my-day": "My Day",
  "my-calendar": "My Calendar",
  "my-programs": "My Programs",
  "my-pathways": "My Pathways",
  "my-curriculum": "My Data",
  "my-data": "My Data",
  "my-assessments": "My Assessments",
  "my-capture": "My Capture",
  "my-portfolio": "My Portfolio",
  "my-reports": "My Reports",
  "my-outputs": "My Outputs",
  "my-profile": "My Profile",
  "my-settings": "My Settings",
  "my-community": "My Community",
  "current-page": "Current page",
};

const SUGGEST_FEEDBACK_LABELS: Record<SuggestFeedbackType, string> = {
  "suggest-improvement": "Suggest improvement",
  "suggest-tool": "Suggest a tool",
  "report-problem": "Report a problem",
  "general-feedback": "General feedback",
};

const FORUM_ROOM_DETAILS: Record<
  CommunityCategory,
  {
    title: string;
    description: string;
  }
> = {
  general: {
    title: "General Homeschool Discussion",
    description:
      "For everyday homeschool questions, encouragement, routines, weekly rhythm, and family learning life.",
  },
  resources: {
    title: "Resources",
    description:
      "For books, websites, printables, learning tools, groups, and low-cost resource ideas.",
  },
  curriculum: {
    title: "Curriculum & Resources",
    description:
      "For programs, curriculum ideas, subject balance, affordable materials, and learning adjustments.",
  },
  reporting: {
    title: "Evidence, Portfolios & Reporting",
    description:
      "For capturing learning, record keeping, portfolios, samples, and report preparation.",
  },
  "state-country": {
    title: "State / Country Questions",
    description:
      "For general discussion about regional expectations, registration, reporting, and homeschool requirements.",
  },
  "mylearna-suggestions": {
    title: "MyLearna Suggestions",
    description:
      "For feedback, feature ideas, product suggestions, and improvements to the app.",
  },
};

function buildReactionTargetKey(
  targetType: CommunityReactionTargetType,
  targetId: string,
  reactionType?: CommunityReactionType,
) {
  return reactionType
    ? `${targetType}:${targetId}:${reactionType}`
    : `${targetType}:${targetId}`;
}

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function getSourceUrl() {
  if (typeof window === "undefined") return "";
  return window.location.href;
}

function getRoute() {
  if (typeof window === "undefined") return "/my-community";
  return `${window.location.pathname}${window.location.search}`;
}

function getUserAgent() {
  if (typeof navigator === "undefined") return "";
  return navigator.userAgent;
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

function getSafeHttpUrl(value: string | null) {
  const text = safe(value);
  if (!text) return null;

  try {
    const url = new URL(text);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

function getHostnameLabel(value: string | null) {
  const safeUrl = getSafeHttpUrl(value);
  if (!safeUrl) return null;

  try {
    return new URL(safeUrl).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function getLinkPathLabel(value: string | null) {
  const safeUrl = getSafeHttpUrl(value);
  if (!safeUrl) return null;

  try {
    const url = new URL(safeUrl);
    const path = `${url.pathname}${url.search}`.trim();
    if (!path || path === "/") {
      return "Open shared resource";
    }

    return path.length > 46 ? `${path.slice(0, 43).trimEnd()}...` : path;
  } catch {
    return null;
  }
}

function getThreadBodyPlaceholder(category: CommunityCategory) {
  switch (category) {
    case "resources":
      return "Share why this resource is useful, who it may suit, and any practical notes for other families.";
    case "curriculum":
      return "Share the curriculum idea, how you are using it, and what other families should know before trying it.";
    case "reporting":
      return "Explain the reporting question or record-keeping approach you want to discuss.";
    case "state-country":
      return "Share the state or country context and the practical question you want help with.";
    case "mylearna-suggestions":
      return "Share the improvement or workflow idea you would like to see in MyLearna.";
    default:
      return "Share the question, idea, or resource you want to discuss.";
  }
}

function getCategoryHelperText(category: CommunityCategory) {
  switch (category) {
    case "resources":
      return "Share public resources that other homeschool families can review safely.";
    case "curriculum":
      return "Discuss curriculum ideas, how they fit into real weeks, and what has worked for your family.";
    case "reporting":
      return "Use this space for practical record-keeping, progress, and reporting questions.";
    case "state-country":
      return "Ask about state or country reporting expectations without posting private family records.";
    case "mylearna-suggestions":
      return "Suggest practical product improvements and explain the problem you are trying to solve.";
    default:
      return "Start a practical discussion for other homeschool families.";
  }
}

function getLinkHelperText(category: CommunityCategory) {
  if (category === "resources" || category === "curriculum") {
    return "Share a full public webpage link only. Do not post private drive links, child records, or copyrighted file downloads.";
  }

  return "Optional public webpage link. Leave this blank if your thread does not need a shared resource.";
}

function messageFromError(error: unknown, fallback: string) {
  return String((error as { message?: unknown })?.message ?? fallback).trim();
}

function normalizeSuggestFeedbackType(value: unknown): SuggestFeedbackType {
  const feedbackType = safe(value);
  if (
    feedbackType === "suggest-tool" ||
    feedbackType === "report-problem" ||
    feedbackType === "general-feedback"
  ) {
    return feedbackType;
  }

  return "suggest-improvement";
}

function normalizeRequestedCommunityCategory(value: unknown): CommunityCategory | null {
  const category = safe(value) as CommunityCategory;
  return COMMUNITY_CATEGORIES.includes(category) ? category : null;
}

function getSuggestionSourceLabel(value: string) {
  return SUGGEST_SOURCE_PAGE_LABELS[value] ?? "Current page";
}

function buildSuggestionDraftTitle(
  feedbackType: SuggestFeedbackType,
  sourcePageLabel: string,
) {
  const label = SUGGEST_FEEDBACK_LABELS[feedbackType];
  if (!safe(sourcePageLabel) || sourcePageLabel === "Current page") {
    return label;
  }

  return `${label}: ${sourcePageLabel}`;
}

function buildSuggestionDraftBody(
  feedbackType: SuggestFeedbackType,
  sourcePageLabel: string,
) {
  const contextLine =
    safe(sourcePageLabel) && sourcePageLabel !== "Current page"
      ? `Context: ${sourcePageLabel}`
      : "Context: Current page";

  switch (feedbackType) {
    case "suggest-tool":
      return `${contextLine}\n\nWhat tool or workflow would help?\n\nWhere would it fit in MyLearna?\n\nWhy would this help your family?`;
    case "report-problem":
      return `${contextLine}\n\nWhat happened?\n\nWhat did you expect instead?\n\nHow often does this happen?`;
    case "general-feedback":
      return `${contextLine}\n\nWhat feedback would you like to share?\n\nWhat should stay the same?\n\nWhat should improve next?`;
    default:
      return `${contextLine}\n\nWhat would make this part of MyLearna work better?\n\nWhat were you trying to do?\n\nWhy would this improvement help your family?`;
  }
}

function getAuthorLabel(authorUserId: string, currentUserId: string | null) {
  if (currentUserId && safe(authorUserId) === safe(currentUserId)) {
    return "You";
  }

  return "Community member";
}

function getCommunityThreadAuthorLabel(thread: CommunityThread, currentUserId: string | null) {
  if (isStarterCommunityThreadId(thread.id)) {
    return "MyLearna Team";
  }

  return getAuthorLabel(thread.authorUserId, currentUserId);
}

function getCommunityPostAuthorLabel(reply: CommunityPost, currentUserId: string | null) {
  const starterLabel = getStarterPostAuthorLabel(reply.id);
  if (starterLabel) return starterLabel;

  return getAuthorLabel(reply.authorUserId, currentUserId);
}

function buildEmptyReactionCounts() {
  return {
    like: { count: 0, reacted: false },
    helpful: { count: 0, reacted: false },
    thanks: { count: 0, reacted: false },
  };
}

function getReactionCounts(
  summary: CommunityReactionSummary,
  targetId: string,
) {
  return summary[targetId] ?? buildEmptyReactionCounts();
}

function CommunityReactionBar({
  targetType,
  targetId,
  summary,
  busyKey,
  errorKey,
  errorMessage,
  onToggle,
}: {
  targetType: CommunityReactionTargetType;
  targetId: string;
  summary: CommunityReactionSummary;
  busyKey: string | null;
  errorKey: string | null;
  errorMessage: string | null;
  onToggle: (
    targetType: CommunityReactionTargetType,
    targetId: string,
    reactionType: CommunityReactionType,
  ) => void;
}) {
  const counts = getReactionCounts(summary, targetId);
  const targetKey = buildReactionTargetKey(targetType, targetId);

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        {COMMUNITY_REACTION_TYPES.map((reactionType) => {
          const state = counts[reactionType];
          const isBusy = busyKey === buildReactionTargetKey(targetType, targetId, reactionType);

          return (
            <button
              key={reactionType}
              type="button"
              onClick={() => onToggle(targetType, targetId, reactionType)}
              disabled={isBusy}
              aria-pressed={state.reacted}
              style={{
                border: state.reacted ? "1px solid #1d4ed8" : "1px solid #dbeafe",
                background: state.reacted ? "#eff6ff" : "#ffffff",
                color: state.reacted ? "#1d4ed8" : "#475569",
                borderRadius: 999,
                padding: "7px 11px",
                fontSize: 12,
                fontWeight: 700,
                cursor: isBusy ? "wait" : "pointer",
                opacity: isBusy ? 0.7 : 1,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span>{COMMUNITY_REACTION_LABELS[reactionType]}</span>
              {state.count > 0 ? <span>{state.count}</span> : null}
            </button>
          );
        })}
      </div>

      {errorKey === targetKey && errorMessage ? (
        <div role="alert" style={{ color: "#b91c1c", fontSize: 12 }}>
          {errorMessage}
        </div>
      ) : null}
    </div>
  );
}

function CommunitySharedLinkCard({
  url,
  compact = false,
}: {
  url: string | null;
  compact?: boolean;
}) {
  const safeUrl = getSafeHttpUrl(url);
  if (!safeUrl) return null;

  const hostname = getHostnameLabel(safeUrl);
  const pathLabel = getLinkPathLabel(safeUrl);

  return (
    <a
      href={safeUrl}
      target="_blank"
      rel="noreferrer"
      style={{
        display: "grid",
        gap: compact ? 4 : 8,
        textDecoration: "none",
        border: "1px solid #dbeafe",
        borderRadius: compact ? 14 : 16,
        background: compact ? "#ffffff" : "#f8fbff",
        padding: compact ? "10px 12px" : "14px 16px",
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 10,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "5px 9px",
            borderRadius: 999,
            background: "#eff6ff",
            color: "#1d4ed8",
            fontSize: 11,
            fontWeight: 800,
          }}
        >
          Shared resource
        </span>
        {hostname ? (
          <span style={{ color: "#64748b", fontSize: 12, fontWeight: 700 }}>
            {hostname}
          </span>
        ) : null}
      </div>

      {pathLabel ? (
        <div
          style={{
            color: "#0f172a",
            fontSize: compact ? 13 : 14,
            fontWeight: 700,
            lineHeight: 1.5,
            wordBreak: "break-word",
          }}
        >
          {pathLabel}
        </div>
      ) : null}

      <span style={{ color: "#1d4ed8", fontSize: 13, fontWeight: 700 }}>
        Open resource
      </span>
    </a>
  );
}

export default function CleanCommunityWorkspace() {
  const searchParams = useSearchParams();
  const replyComposerRef = useRef<HTMLTextAreaElement | null>(null);
  const threadTitleInputRef = useRef<HTMLInputElement | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isWideScreen, setIsWideScreen] = useState(false);
  const [threads, setThreads] = useState<CommunityThread[]>([]);
  const [replyCounts, setReplyCounts] = useState<Record<string, number>>({});
  const [threadReactionSummary, setThreadReactionSummary] =
    useState<CommunityReactionSummary>({});
  const [replyReactionSummary, setReplyReactionSummary] =
    useState<CommunityReactionSummary>({});
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
  const [reactionBusyKey, setReactionBusyKey] = useState<string | null>(null);
  const [reactionErrorKey, setReactionErrorKey] = useState<string | null>(null);
  const [reactionError, setReactionError] = useState<string | null>(null);
  const [threadEditing, setThreadEditing] = useState(false);
  const [threadEditTitle, setThreadEditTitle] = useState("");
  const [threadEditCategory, setThreadEditCategory] =
    useState<CommunityCategory>("general");
  const [threadEditBody, setThreadEditBody] = useState("");
  const [threadEditLinkUrl, setThreadEditLinkUrl] = useState("");
  const [threadEditSubmitting, setThreadEditSubmitting] = useState(false);
  const [threadEditError, setThreadEditError] = useState<string | null>(null);
  const [threadDeleting, setThreadDeleting] = useState(false);
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [replyEditBody, setReplyEditBody] = useState("");
  const [replyEditSubmitting, setReplyEditSubmitting] = useState(false);
  const [replyEditError, setReplyEditError] = useState<string | null>(null);
  const [replyDeletingId, setReplyDeletingId] = useState<string | null>(null);
  const [appliedSuggestionPrefillKey, setAppliedSuggestionPrefillKey] = useState("");
  const requestedThreadId = safe(searchParams.get("thread"));
  const requestedCompose = safe(searchParams.get("compose")) === "1";
  const requestedCategory = normalizeRequestedCommunityCategory(
    searchParams.get("category"),
  );
  const requestedFeedbackType = normalizeSuggestFeedbackType(
    searchParams.get("feedbackType"),
  );
  const requestedSourcePage = safe(searchParams.get("sourcePage"));
  const requestedSourceLabel = getSuggestionSourceLabel(requestedSourcePage);
  const suggestionPrefillKey = [
    requestedCompose ? "1" : "0",
    requestedCategory ?? "",
    requestedFeedbackType,
    requestedSourcePage,
  ].join("|");
  const showSuggestionDraftHelper =
    requestedCompose ||
    requestedCategory === "mylearna-suggestions" ||
    Boolean(requestedSourcePage);
  const categoryHelperText = getCategoryHelperText(threadCategory);
  const linkHelperText = getLinkHelperText(threadCategory);
  const threadBodyPlaceholder = getThreadBodyPlaceholder(threadCategory);
  const draftLinkPreview = getSafeHttpUrl(threadLinkUrl);
  const threadEditCategoryHelperText = getCategoryHelperText(threadEditCategory);
  const threadEditLinkHelperText = getLinkHelperText(threadEditCategory);
  const threadEditBodyPlaceholder = getThreadBodyPlaceholder(threadEditCategory);
  const threadEditLinkPreview = getSafeHttpUrl(threadEditLinkUrl);

  const displayThreads = useMemo(
    () => [...threads, ...COMMUNITY_STARTER_THREADS],
    [threads],
  );

  const filteredThreads = useMemo(() => {
    if (selectedCategory === "all") return displayThreads;
    return displayThreads.filter((thread) => thread.category === selectedCategory);
  }, [displayThreads, selectedCategory]);

  const selectedThread = useMemo(
    () => filteredThreads.find((thread) => thread.id === selectedThreadId) ?? null,
    [filteredThreads, selectedThreadId],
  );

  const communityUnavailable = threadsError === COMMUNITY_NOT_AVAILABLE_MESSAGE;
  const selectedThreadIsStarter = Boolean(
    selectedThread && isStarterCommunityThreadId(selectedThread.id),
  );
  const canEditSelectedThread = Boolean(
    selectedThread &&
      !selectedThreadIsStarter &&
      currentUserId &&
      safe(selectedThread.authorUserId) === safe(currentUserId),
  );
  const selectedStarterReplies = selectedThreadIsStarter && selectedThread
    ? getStarterRepliesForThread(selectedThread.id)
    : [];
  const displayReplies = selectedThreadIsStarter ? selectedStarterReplies : replies;

  function getDisplayReplyCount(threadId: string) {
    if (isStarterCommunityThreadId(threadId)) {
      return getStarterRepliesForThread(threadId).length;
    }

    return replyCounts[threadId] ?? 0;
  }

  async function loadThreads() {
    setThreadsLoading(true);
    setThreadsError(null);

    try {
      const nextThreads = await listCommunityThreads();
      setThreads(nextThreads);

      const nextCounts = await listCommunityReplyCounts(nextThreads.map((thread) => thread.id));
      setReplyCounts(nextCounts);

      try {
        const nextReactions = await listCommunityReactionSummary(
          "thread",
          nextThreads.map((thread) => thread.id),
        );
        setThreadReactionSummary(nextReactions);
      } catch {
        setThreadReactionSummary({});
      }
    } catch (nextError) {
      setThreads([]);
      setReplyCounts({});
      setThreadReactionSummary({});
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
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(min-width: 1100px)");
    const sync = () => setIsWideScreen(mediaQuery.matches);

    sync();
    mediaQuery.addEventListener("change", sync);

    return () => {
      mediaQuery.removeEventListener("change", sync);
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
    if (!requestedThreadId) return;

    const matchingThread = threads.find((thread) => thread.id === requestedThreadId);
    if (!matchingThread) return;

    setSelectedCategory("all");
    setSelectedThreadId(requestedThreadId);
  }, [requestedThreadId, threads]);

  useEffect(() => {
    if (!showSuggestionDraftHelper) return;
    if (appliedSuggestionPrefillKey === suggestionPrefillKey) return;

    setThreadCategory(requestedCategory ?? "mylearna-suggestions");
    setSelectedCategory(requestedCategory ?? "mylearna-suggestions");
    setThreadError(null);
    setThreadMessage("Suggestion draft ready. Edit it, then post it to the community.");

    setThreadTitle((current) =>
      safe(current) || buildSuggestionDraftTitle(requestedFeedbackType, requestedSourceLabel),
    );
    setThreadBody((current) =>
      safe(current) || buildSuggestionDraftBody(requestedFeedbackType, requestedSourceLabel),
    );

    setAppliedSuggestionPrefillKey(suggestionPrefillKey);
  }, [
    appliedSuggestionPrefillKey,
    requestedCategory,
    requestedFeedbackType,
    requestedSourceLabel,
    showSuggestionDraftHelper,
    suggestionPrefillKey,
  ]);

  useEffect(() => {
    if (!showSuggestionDraftHelper) return;

    const nextFrame = window.requestAnimationFrame(() => {
      threadTitleInputRef.current?.scrollIntoView({
        block: "center",
        behavior: "smooth",
      });
      threadTitleInputRef.current?.focus();
    });

    return () => {
      window.cancelAnimationFrame(nextFrame);
    };
  }, [showSuggestionDraftHelper, suggestionPrefillKey]);

  useEffect(() => {
    setThreadEditing(false);
    setThreadEditError(null);
    setEditingReplyId(null);
    setReplyEditBody("");
    setReplyEditError(null);
  }, [selectedThreadId]);

  useEffect(() => {
    async function loadReplies() {
      if (!selectedThreadId) {
        setReplies([]);
        setRepliesError(null);
        setReplyReactionSummary({});
        return;
      }

      if (isStarterCommunityThreadId(selectedThreadId)) {
        setReplies([]);
        setRepliesError(null);
        setReplyReactionSummary({});
        setRepliesLoading(false);
        return;
      }

      setRepliesLoading(true);
      setRepliesError(null);

      try {
        const nextReplies = await listCommunityPosts(selectedThreadId);
        setReplies(nextReplies);

        try {
          const nextReactions = await listCommunityReactionSummary(
            "post",
            nextReplies.map((reply) => reply.id),
          );
          setReplyReactionSummary(nextReactions);
        } catch {
          setReplyReactionSummary({});
        }
      } catch (nextError) {
        setReplies([]);
        setReplyReactionSummary({});
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
      setThreadError(
        "Add a full public link starting with http:// or https://, or leave it blank.",
      );
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

    if (isStarterCommunityThreadId(selectedThread.id)) {
      try {
        const createdThread = await createCommunityThread({
          category: selectedThread.category,
          title: `Response to: ${selectedThread.title}`,
          body: [
            `In response to starter discussion: ${selectedThread.title}`,
            "",
            "Starter prompt:",
            selectedThread.body,
            "",
            "My response:",
            body,
          ].join("\n"),
          linkUrl: null,
        });

        setThreads((current) => [createdThread, ...current]);
        setReplyCounts((current) => ({ ...current, [createdThread.id]: 0 }));
        setSelectedCategory("all");
        setSelectedThreadId(createdThread.id);
        setReplyBody("");
        setReplyMessage("Your response was saved as a real community thread.");
      } catch (nextError) {
        setReplyError(
          messageFromError(nextError, "We could not start a thread from this prompt."),
        );
      } finally {
        setReplySubmitting(false);
      }
      return;
    }

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
      const result = await submitReportProblem({
        type: "page",
        category:
          reportTarget.type === "thread"
            ? "Community thread report"
            : "Community reply report",
        message: reason,
        context: {
          Page: "My Community",
          Route: getRoute(),
          URL: getSourceUrl(),
          "Target type": reportTarget.type,
          "Target ID": reportTarget.id,
          "Thread ID": selectedThread?.id,
          "Thread title": selectedThread?.title,
          Timestamp: new Date().toISOString(),
          Browser: getUserAgent(),
        },
      });

      if (!result.ok) {
        throw new Error(result.message);
      }

      setReportReason("");
      setReportMessage("Thanks — your report has been sent.");
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

  function focusReplyComposer() {
    replyComposerRef.current?.focus();
    replyComposerRef.current?.scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    });
  }

  function focusStartDiscussion() {
    setSelectedThreadId(null);
    window.setTimeout(() => {
      threadTitleInputRef.current?.focus();
      threadTitleInputRef.current?.scrollIntoView({
        block: "center",
        behavior: "smooth",
      });
    }, 0);
  }

  function openThreadEdit(thread: CommunityThread) {
    setThreadEditTitle(thread.title);
    setThreadEditCategory(thread.category);
    setThreadEditBody(thread.body);
    setThreadEditLinkUrl(thread.linkUrl ?? "");
    setThreadEditError(null);
    setThreadEditing(true);
    setReportTarget(null);
  }

  async function handleThreadEditSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedThread) {
      setThreadEditError("Choose a thread before editing.");
      return;
    }

    const title = safe(threadEditTitle);
    const body = safe(threadEditBody);
    const linkUrl = safe(threadEditLinkUrl);

    if (!title) {
      setThreadEditError("Add a title for your thread.");
      return;
    }

    if (!body) {
      setThreadEditError("Add your message before saving.");
      return;
    }

    if (linkUrl && !isValidHttpUrl(linkUrl)) {
      setThreadEditError(
        "Add a full public link starting with http:// or https://, or leave it blank.",
      );
      return;
    }

    setThreadEditSubmitting(true);
    setThreadEditError(null);

    try {
      const updatedThread = await updateCommunityThread(selectedThread.id, {
        category: threadEditCategory,
        title,
        body,
        linkUrl: linkUrl || null,
      });

      setThreads((current) =>
        current.map((thread) => (thread.id === updatedThread.id ? updatedThread : thread)),
      );
      setThreadEditing(false);
    } catch (nextError) {
      setThreadEditError(
        messageFromError(nextError, "We could not save this thread just now."),
      );
    } finally {
      setThreadEditSubmitting(false);
    }
  }

  async function handleDeleteThread() {
    if (!selectedThread) return;

    const confirmed = window.confirm(
      "Delete this thread? This will also remove its replies.",
    );
    if (!confirmed) return;

    setThreadDeleting(true);
    setThreadEditError(null);

    try {
      await deleteCommunityThread(selectedThread.id);

      setThreads((current) =>
        current.filter((thread) => thread.id !== selectedThread.id),
      );
      setReplyCounts((current) => {
        const next = { ...current };
        delete next[selectedThread.id];
        return next;
      });
      setThreadReactionSummary((current) => {
        const next = { ...current };
        delete next[selectedThread.id];
        return next;
      });
      setReplies([]);
      setReplyReactionSummary({});
      setReportTarget(null);
      setReportReason("");
      setReportError(null);
      setReplyMessage(null);
      setReplyError(null);
      setThreadEditing(false);
    } catch (nextError) {
      setThreadEditError(
        messageFromError(nextError, "We could not delete this thread just now."),
      );
    } finally {
      setThreadDeleting(false);
    }
  }

  function openReplyEdit(reply: CommunityPost) {
    setEditingReplyId(reply.id);
    setReplyEditBody(reply.body);
    setReplyEditError(null);
    setReportTarget(null);
  }

  async function handleReplyEditSubmit(
    event: React.FormEvent<HTMLFormElement>,
    replyId: string,
  ) {
    event.preventDefault();

    const body = safe(replyEditBody);
    if (!body) {
      setReplyEditError("Add your reply before saving.");
      return;
    }

    setReplyEditSubmitting(true);
    setReplyEditError(null);

    try {
      const updatedReply = await updateCommunityPost(replyId, { body });
      setReplies((current) =>
        current.map((reply) => (reply.id === updatedReply.id ? updatedReply : reply)),
      );
      setEditingReplyId(null);
      setReplyEditBody("");
    } catch (nextError) {
      setReplyEditError(
        messageFromError(nextError, "We could not save this reply just now."),
      );
    } finally {
      setReplyEditSubmitting(false);
    }
  }

  async function handleDeleteReply(reply: CommunityPost) {
    if (!selectedThread) return;

    const confirmed = window.confirm("Delete this reply?");
    if (!confirmed) return;

    setReplyDeletingId(reply.id);
    setReplyEditError(null);
    setReplyError(null);

    try {
      await deleteCommunityPost(reply.id);
      setReplies((current) => current.filter((item) => item.id !== reply.id));
      setReplyReactionSummary((current) => {
        const next = { ...current };
        delete next[reply.id];
        return next;
      });
      setReplyCounts((current) => ({
        ...current,
        [selectedThread.id]: Math.max(0, (current[selectedThread.id] ?? 0) - 1),
      }));

      if (editingReplyId === reply.id) {
        setEditingReplyId(null);
        setReplyEditBody("");
      }

      if (reportTarget?.type === "post" && reportTarget.id === reply.id) {
        setReportTarget(null);
        setReportReason("");
        setReportError(null);
      }
    } catch (nextError) {
      const message = messageFromError(
        nextError,
        "We could not delete this reply just now.",
      );

      if (editingReplyId === reply.id) {
        setReplyEditError(message);
      } else {
        setReplyError(message);
      }
    } finally {
      setReplyDeletingId(null);
    }
  }

  async function handleToggleReaction(
    targetType: CommunityReactionTargetType,
    targetId: string,
    reactionType: CommunityReactionType,
  ) {
    const busyKey = buildReactionTargetKey(targetType, targetId, reactionType);
    const targetKey = buildReactionTargetKey(targetType, targetId);

    setReactionBusyKey(busyKey);
    setReactionErrorKey(null);
    setReactionError(null);

    try {
      const result = await toggleCommunityReaction({
        targetType,
        targetId,
        reactionType,
      });

      const applyUpdate = (
        setter: React.Dispatch<React.SetStateAction<CommunityReactionSummary>>,
      ) => {
        setter((current) => {
          const nextCounts = {
            ...getReactionCounts(current, targetId),
            [reactionType]: {
              count: Math.max(
                0,
                getReactionCounts(current, targetId)[reactionType].count +
                  (result.active ? 1 : -1),
              ),
              reacted: result.active,
            },
          };

          return {
            ...current,
            [targetId]: nextCounts,
          };
        });
      };

      if (targetType === "thread") {
        applyUpdate(setThreadReactionSummary);
      } else {
        applyUpdate(setReplyReactionSummary);
      }
    } catch (nextError) {
      setReactionErrorKey(targetKey);
      setReactionError(
        messageFromError(nextError, "We could not update this reaction just now."),
      );
    } finally {
      setReactionBusyKey(null);
    }
  }

  return (
    <div style={shellStyle}>
      <div style={wrapStyle}>
        <section style={cardStyle}>
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ color: "#1d4ed8", fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Community
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              <h1 style={{ margin: 0, fontSize: 32, color: "#0f172a" }}>MyLearna Community</h1>
              <p style={{ margin: 0, color: "#475569", fontSize: 16, lineHeight: 1.7 }}>
                A calm forum for homeschool families to ask questions, share resources, talk
                about planning and reporting, and help shape MyLearna.
              </p>
              <p
                style={{
                  margin: 0,
                  border: "1px solid #dbeafe",
                  borderRadius: 14,
                  background: "#f8fbff",
                  color: "#1e3a8a",
                  padding: "10px 12px",
                  fontSize: 14,
                  lineHeight: 1.6,
                  fontWeight: 700,
                }}
              >
                Starter discussions are included to help early-access families begin the
                conversation. Add your own experience, question, or suggestion.
              </p>
              <div>
                <button type="button" onClick={focusStartDiscussion} style={buttonStyle}>
                  Start a discussion
                </button>
              </div>
            </div>
          </div>
        </section>

        <div
          style={{
            display: "grid",
            gap: 20,
            gridTemplateColumns: "1fr",
            alignItems: "start",
          }}
        >
          <section style={{ ...cardStyle, display: "grid", gap: 18 }}>
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "end" }}>
                <div style={{ display: "grid", gap: 6 }}>
                  <h2 style={{ margin: 0, fontSize: 22, color: "#0f172a" }}>Forum rooms</h2>
                  <p style={{ margin: 0, color: "#64748b", fontSize: 14, lineHeight: 1.7 }}>
                    Choose a room to browse related conversations, or view every discussion below.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCategory("all")}
                  aria-pressed={selectedCategory === "all"}
                  style={{
                    ...secondaryButtonStyle,
                    borderColor: selectedCategory === "all" ? "#1d4ed8" : "#cbd5e1",
                    background: selectedCategory === "all" ? "#eff6ff" : "#ffffff",
                    color: selectedCategory === "all" ? "#1d4ed8" : "#0f172a",
                  }}
                >
                  All discussions
                </button>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isWideScreen
                    ? "repeat(3, minmax(0, 1fr))"
                    : "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: 12,
                }}
              >
                {COMMUNITY_CATEGORIES.map((category) => {
                  const active = selectedCategory === category;
                  const roomThreads = displayThreads.filter(
                    (thread) => thread.category === category,
                  );
                  const latestThread = roomThreads[0] ?? null;
                  const roomDetails = FORUM_ROOM_DETAILS[category];

                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setSelectedCategory(category)}
                      aria-pressed={active}
                      style={{
                        border: active ? "1px solid #1d4ed8" : "1px solid #dbeafe",
                        background: active ? "#eff6ff" : "#ffffff",
                        color: active ? "#1d4ed8" : "#0f172a",
                        borderRadius: 18,
                        padding: 16,
                        textAlign: "left",
                        cursor: "pointer",
                        display: "grid",
                        gap: 10,
                        boxShadow: active ? "0 12px 26px rgba(29,78,216,0.08)" : "none",
                      }}
                    >
                      <span style={{ color: "#0f172a", fontSize: 16, fontWeight: 800 }}>
                        {roomDetails.title}
                      </span>
                      <span style={{ color: "#475569", fontSize: 13, lineHeight: 1.6, fontWeight: 500 }}>
                        {roomDetails.description}
                      </span>
                      <span
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 12,
                          alignItems: "center",
                          color: "#64748b",
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        <span>{roomThreads.length} discussions</span>
                        <span>{active ? "Viewing room" : "Open room"}</span>
                      </span>
                      {latestThread ? (
                        <span
                          style={{
                            borderTop: "1px solid #e2e8f0",
                            paddingTop: 10,
                            color: "#334155",
                            fontSize: 13,
                            lineHeight: 1.5,
                            fontWeight: 700,
                          }}
                        >
                          Latest: {latestThread.title}
                        </span>
                      ) : null}
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
                  gridTemplateColumns: "1fr",
                  alignItems: "start",
                }}
              >
                {!selectedThread ? (
                <div
                  style={{
                    display: "grid",
                    gap: 14,
                    alignContent: "start",
                  }}
                >
                  <div style={{ display: "grid", gap: 6 }}>
                    <h2 style={{ margin: 0, fontSize: 22, color: "#0f172a" }}>
                      Latest discussions
                    </h2>
                    <p style={{ margin: 0, color: "#64748b", fontSize: 14, lineHeight: 1.7 }}>
                      Real family posts appear first. Starter prompts stay visible below them so
                      new users have useful places to begin.
                    </p>
                  </div>
                  {threadsLoading ? (
                    <div style={{ color: "#64748b", fontSize: 14 }}>Loading community threads...</div>
                  ) : filteredThreads.length ? (
                    filteredThreads.map((thread) => {
                      const active = thread.id === selectedThreadId;
                      const replyCount = getDisplayReplyCount(thread.id);
                      const authorLabel = getCommunityThreadAuthorLabel(thread, currentUserId);
                      const hasSharedResource = Boolean(getSafeHttpUrl(thread.linkUrl));
                      const starterBadge = getStarterThreadBadge(thread.id);

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
                            background: active
                              ? "#eff6ff"
                              : hasSharedResource
                                ? "#f8fbff"
                                : "#ffffff",
                            borderRadius: 16,
                            padding: isWideScreen ? 20 : 16,
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
                            {starterBadge ? (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  padding: "6px 10px",
                                  borderRadius: 999,
                                  background: "#f0fdf4",
                                  border: "1px solid #bbf7d0",
                                  color: "#166534",
                                  fontSize: 12,
                                  fontWeight: 800,
                                }}
                              >
                                {starterBadge}
                              </span>
                            ) : null}
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
                          {hasSharedResource ? (
                            <CommunitySharedLinkCard url={thread.linkUrl} compact />
                          ) : null}
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
                            </span>
                            <span style={{ color: "#1d4ed8", fontWeight: 800 }}>
                              Open discussion
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
                        : "No threads yet. Start the first discussion using the form below."}
                    </div>
                  )}
                </div>
                ) : null}

                {selectedThread ? (
                <div style={{ display: "grid", gap: 16 }}>
                    <section
                      style={{
                        border: "1px solid #e2e8f0",
                        borderRadius: 18,
                        background: "#ffffff",
                        padding: isWideScreen ? 28 : 18,
                        display: "grid",
                        gap: 16,
                      }}
                    >
                      <div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedThreadId(null);
                            setReplyMessage(null);
                            setReplyError(null);
                            setReportMessage(null);
                            setReportError(null);
                            setReportTarget(null);
                          }}
                          style={subtleButtonStyle}
                        >
                          Back to discussions
                        </button>
                      </div>
                      <div style={{ display: "grid", gap: 14 }}>
                        {selectedThreadIsStarter ? (
                          <div
                            style={{
                              border: "1px solid #bbf7d0",
                              borderRadius: 16,
                              background: "#f0fdf4",
                              color: "#166534",
                              padding: 12,
                              fontSize: 13,
                              fontWeight: 800,
                              lineHeight: 1.6,
                            }}
                          >
                            This is a clearly labelled starter discussion from MyLearna. Add your own
                            experience, question, or suggestion below.
                          </div>
                        ) : null}
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
                              {formatReplyCount(getDisplayReplyCount(selectedThread.id))}
                            </span>
                            {getStarterThreadBadge(selectedThread.id) ? (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  padding: "6px 10px",
                                  borderRadius: 999,
                                  background: "#f0fdf4",
                                  color: "#166534",
                                  fontSize: 12,
                                  fontWeight: 800,
                                  border: "1px solid #bbf7d0",
                                }}
                              >
                                {getStarterThreadBadge(selectedThread.id)}
                              </span>
                            ) : null}
                          </div>
                          <div
                            style={{
                              display: "flex",
                              gap: 8,
                              flexWrap: "wrap",
                              alignItems: "center",
                            }}
                          >
                            <button type="button" onClick={focusReplyComposer} style={smallButtonStyle}>
                              {selectedThreadIsStarter ? "Start from this prompt" : "Reply"}
                            </button>
                            {canEditSelectedThread ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => openThreadEdit(selectedThread)}
                                  style={smallButtonStyle}
                                >
                                  Edit thread
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void handleDeleteThread()}
                                  disabled={threadDeleting}
                                  style={dangerButtonStyle}
                                >
                                  {threadDeleting ? "Deleting..." : "Delete thread"}
                                </button>
                              </>
                            ) : null}
                            {!selectedThreadIsStarter ? (
                              <button
                                type="button"
                                onClick={() =>
                                  openReportForm({ id: selectedThread.id, type: "thread" })
                                }
                                style={subtleButtonStyle}
                              >
                                Report thread
                              </button>
                            ) : null}
                          </div>
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
                              {getCommunityThreadAuthorLabel(selectedThread, currentUserId)}
                            </span>
                            <span aria-hidden="true">|</span>
                            <span>{formatDateTimeLabel(selectedThread.createdAt)}</span>
                          </div>
                        </div>

                        {threadEditError ? (
                          <div role="alert" style={{ color: "#b91c1c", fontSize: 13 }}>
                            {threadEditError}
                          </div>
                        ) : null}

                        {threadEditing ? (
                          <form
                            onSubmit={(event) => void handleThreadEditSubmit(event)}
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
                              Edit thread
                            </div>

                            <label style={{ display: "grid", gap: 6 }}>
                              <span style={{ color: "#0f172a", fontSize: 13, fontWeight: 700 }}>
                                Title
                              </span>
                              <input
                                value={threadEditTitle}
                                onChange={(event) => setThreadEditTitle(event.target.value)}
                                style={inputStyle}
                                maxLength={160}
                              />
                            </label>

                            <label style={{ display: "grid", gap: 6 }}>
                              <span style={{ color: "#0f172a", fontSize: 13, fontWeight: 700 }}>
                                Category
                              </span>
                              <select
                                value={threadEditCategory}
                                onChange={(event) =>
                                  setThreadEditCategory(event.target.value as CommunityCategory)
                                }
                                style={inputStyle}
                              >
                                {COMMUNITY_CATEGORIES.map((category) => (
                                  <option key={category} value={category}>
                                    {COMMUNITY_CATEGORY_LABELS[category]}
                                  </option>
                                ))}
                              </select>
                              <span style={{ color: "#64748b", fontSize: 12, lineHeight: 1.6 }}>
                                {threadEditCategoryHelperText}
                              </span>
                            </label>

                            <label style={{ display: "grid", gap: 6 }}>
                              <span style={{ color: "#0f172a", fontSize: 13, fontWeight: 700 }}>
                                Message
                              </span>
                              <textarea
                                value={threadEditBody}
                                onChange={(event) => setThreadEditBody(event.target.value)}
                                style={textareaStyle}
                                placeholder={threadEditBodyPlaceholder}
                              />
                            </label>

                            <label style={{ display: "grid", gap: 6 }}>
                              <span style={{ color: "#0f172a", fontSize: 13, fontWeight: 700 }}>
                                Optional resource link
                              </span>
                              <input
                                value={threadEditLinkUrl}
                                onChange={(event) => setThreadEditLinkUrl(event.target.value)}
                                style={inputStyle}
                                placeholder="https://example.com/resource"
                              />
                              <span style={{ color: "#64748b", fontSize: 12, lineHeight: 1.6 }}>
                                {threadEditLinkHelperText}
                              </span>
                            </label>

                            {threadEditLinkPreview ? (
                              <CommunitySharedLinkCard url={threadEditLinkPreview} />
                            ) : null}

                            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                              <button
                                type="submit"
                                disabled={threadEditSubmitting}
                                style={buttonStyle}
                              >
                                {threadEditSubmitting ? "Saving..." : "Save thread"}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setThreadEditing(false);
                                  setThreadEditError(null);
                                }}
                                style={secondaryButtonStyle}
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        ) : (
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
                            <CommunitySharedLinkCard url={selectedThread.linkUrl} />
                            {!selectedThreadIsStarter ? (
                              <CommunityReactionBar
                                targetType="thread"
                                targetId={selectedThread.id}
                                summary={threadReactionSummary}
                                busyKey={reactionBusyKey}
                                errorKey={reactionErrorKey}
                                errorMessage={reactionError}
                                onToggle={handleToggleReaction}
                              />
                            ) : null}
                          </div>
                        )}
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
                              {reportSubmitting ? "Sending..." : "Send report"}
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
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 12,
                            alignItems: "center",
                            flexWrap: "wrap",
                          }}
                        >
                          <h3 style={{ margin: 0, fontSize: 18, color: "#0f172a" }}>Conversation</h3>
                          <div
                            style={{
                              display: "flex",
                              gap: 10,
                              flexWrap: "wrap",
                              alignItems: "center",
                            }}
                          >
                            <span style={{ color: "#64748b", fontSize: 13 }}>
                              {formatReplyCount(getDisplayReplyCount(selectedThread.id))}
                            </span>
                            <button type="button" onClick={focusReplyComposer} style={smallButtonStyle}>
                              {selectedThreadIsStarter ? "Start from this prompt" : "Jump to reply box"}
                            </button>
                          </div>
                        </div>

                        {repliesError ? (
                          <div role="alert" style={{ color: "#b91c1c", fontSize: 13 }}>
                            {repliesError}
                          </div>
                        ) : null}

                        {repliesLoading ? (
                          <div style={{ color: "#64748b", fontSize: 14 }}>Loading replies...</div>
                        ) : displayReplies.length ? (
                          <div style={{ display: "grid", gap: 14 }}>
                            {displayReplies.map((reply, index) => {
                              const isOriginalPoster =
                                reply.authorUserId === selectedThread.authorUserId;
                              const replyIsStarter = isStarterCommunityPostId(reply.id);
                              const canEditReply = Boolean(
                                !replyIsStarter &&
                                  currentUserId &&
                                  safe(reply.authorUserId) === safe(currentUserId),
                              );
                              const replyIsEditing = editingReplyId === reply.id;
                              const starterAuthorLabel = getStarterPostAuthorLabel(reply.id);

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
                                    {index < displayReplies.length - 1 ? (
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
                                          {starterAuthorLabel ? (
                                            <span
                                              style={{
                                                display: "inline-flex",
                                                alignItems: "center",
                                                padding: "5px 9px",
                                                borderRadius: 999,
                                                background: "#f0fdf4",
                                                border: "1px solid #bbf7d0",
                                                color: "#166534",
                                                fontSize: 11,
                                                fontWeight: 800,
                                              }}
                                            >
                                              Starter reply
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
                                            {getCommunityPostAuthorLabel(reply, currentUserId)}
                                          </span>
                                          <span aria-hidden="true">|</span>
                                          <span>{formatDateTimeLabel(reply.createdAt)}</span>
                                        </div>
                                      </div>

                                      <div
                                        style={{
                                          display: "flex",
                                          gap: 8,
                                          flexWrap: "wrap",
                                          alignItems: "center",
                                        }}
                                      >
                                        {canEditReply ? (
                                          <>
                                            <button
                                              type="button"
                                              onClick={() => openReplyEdit(reply)}
                                              style={smallButtonStyle}
                                            >
                                              Edit reply
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => void handleDeleteReply(reply)}
                                              disabled={replyDeletingId === reply.id}
                                              style={dangerButtonStyle}
                                            >
                                              {replyDeletingId === reply.id
                                                ? "Deleting..."
                                                : "Delete reply"}
                                            </button>
                                          </>
                                        ) : null}
                                        {!replyIsStarter ? (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              openReportForm({ id: reply.id, type: "post" })
                                            }
                                            style={subtleButtonStyle}
                                          >
                                            Report reply
                                          </button>
                                        ) : null}
                                      </div>
                                    </div>

                                    {replyIsEditing ? (
                                      <form
                                        onSubmit={(event) =>
                                          void handleReplyEditSubmit(event, reply.id)
                                        }
                                        style={{ display: "grid", gap: 10 }}
                                      >
                                        <label style={{ display: "grid", gap: 6 }}>
                                          <span
                                            style={{
                                              color: "#0f172a",
                                              fontSize: 13,
                                              fontWeight: 700,
                                            }}
                                          >
                                            Edit reply
                                          </span>
                                          <textarea
                                            value={replyEditBody}
                                            onChange={(event) => setReplyEditBody(event.target.value)}
                                            style={{ ...textareaStyle, minHeight: 96 }}
                                          />
                                        </label>
                                        {replyEditError ? (
                                          <div role="alert" style={{ color: "#b91c1c", fontSize: 13 }}>
                                            {replyEditError}
                                          </div>
                                        ) : null}
                                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                                          <button
                                            type="submit"
                                            disabled={replyEditSubmitting}
                                            style={buttonStyle}
                                          >
                                            {replyEditSubmitting ? "Saving..." : "Save reply"}
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setEditingReplyId(null);
                                              setReplyEditBody("");
                                              setReplyEditError(null);
                                            }}
                                            style={secondaryButtonStyle}
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </form>
                                    ) : (
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
                                    )}

                                    {!replyIsStarter ? (
                                      <CommunityReactionBar
                                        targetType="post"
                                        targetId={reply.id}
                                        summary={replyReactionSummary}
                                        busyKey={reactionBusyKey}
                                        errorKey={reactionErrorKey}
                                        errorMessage={reactionError}
                                        onToggle={handleToggleReaction}
                                      />
                                    ) : null}

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
                                            {reportSubmitting ? "Sending..." : "Send report"}
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
                            background: "#ffffff",
                          }}
                        >
                          <label style={{ display: "grid", gap: 6 }}>
                            <span style={{ color: "#0f172a", fontSize: 14, fontWeight: 700 }}>
                              {selectedThreadIsStarter ? "Start a real thread from this prompt" : "Add a reply"}
                            </span>
                            {selectedThreadIsStarter ? (
                              <span
                                style={{
                                  border: "1px solid #dbeafe",
                                  borderRadius: 14,
                                  background: "#f8fbff",
                                  color: "#1e3a8a",
                                  padding: "10px 12px",
                                  fontSize: 13,
                                  fontWeight: 700,
                                  lineHeight: 1.6,
                                }}
                              >
                                Starter discussions are prompts. Your response will be saved as a
                                real community thread so other families can see and reply.
                              </span>
                            ) : null}
                            <textarea
                              ref={replyComposerRef}
                              value={replyBody}
                              onChange={(event) => setReplyBody(event.target.value)}
                              style={{ ...textareaStyle, minHeight: 110 }}
                              placeholder={
                                selectedThreadIsStarter
                                  ? "Share your response. We will save it as a new community thread linked to this prompt."
                                  : "Share a practical response for other homeschool families."
                              }
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
                          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                            <button type="submit" disabled={replySubmitting} style={buttonStyle}>
                              {replySubmitting
                                ? "Posting..."
                                : selectedThreadIsStarter
                                  ? "Start real thread"
                                  : "Post reply"}
                            </button>
                          </div>
                        </form>
                      </div>
                    </section>
                </div>
                ) : null}
              </div>
            )}
          </section>

          <aside
            style={{
              display: "grid",
              gap: 20,
              alignContent: "start",
            }}
          >
            <section style={{ ...cardStyle, order: 2 }}>
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

            <section style={{ ...cardStyle, order: 1 }}>
              <form onSubmit={(event) => void handleCreateThread(event)} style={{ display: "grid", gap: 12 }}>
                {showSuggestionDraftHelper ? (
                  <div
                    style={{
                      border: "1px solid #dbeafe",
                      borderRadius: 16,
                      background: "#f8fbff",
                      padding: 14,
                      display: "grid",
                      gap: 8,
                    }}
                  >
                    <strong style={{ color: "#0f172a" }}>Help shape MyLearna</strong>
                    <p style={{ margin: 0, color: "#475569", fontSize: 14, lineHeight: 1.7 }}>
                      This draft started from {requestedSourceLabel}. It will be posted in
                      MyLearna suggestions so early users can share practical ideas together.
                    </p>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        width: "fit-content",
                        padding: "6px 10px",
                        borderRadius: 999,
                        background: "#ffffff",
                        border: "1px solid #dbeafe",
                        color: "#1d4ed8",
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {SUGGEST_FEEDBACK_LABELS[requestedFeedbackType]}
                    </div>
                  </div>
                ) : null}

                <div style={{ display: "grid", gap: 6 }}>
                  <h2 style={{ margin: 0, fontSize: 22, color: "#0f172a" }}>Start a discussion</h2>
                  <p style={{ margin: 0, color: "#64748b", fontSize: 14, lineHeight: 1.7 }}>
                    Start a practical discussion for other homeschool families. Ask a question,
                    share an idea, suggest a resource, or tell us what would make MyLearna easier
                    to use.
                  </p>
                  <p style={{ margin: 0, color: "#64748b", fontSize: 13, lineHeight: 1.6 }}>
                    Text-only for now. Media sharing and direct messages are not part of Community.
                  </p>
                </div>

                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ color: "#0f172a", fontSize: 13, fontWeight: 700 }}>Title</span>
                  <input
                    ref={threadTitleInputRef}
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
                  <span style={{ color: "#64748b", fontSize: 12, lineHeight: 1.6 }}>
                    {categoryHelperText}
                  </span>
                </label>

                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ color: "#0f172a", fontSize: 13, fontWeight: 700 }}>Message</span>
                  <textarea
                    value={threadBody}
                    onChange={(event) => setThreadBody(event.target.value)}
                    style={textareaStyle}
                    placeholder={threadBodyPlaceholder}
                  />
                </label>

                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ color: "#0f172a", fontSize: 13, fontWeight: 700 }}>
                    Optional resource link
                  </span>
                  <input
                    value={threadLinkUrl}
                    onChange={(event) => setThreadLinkUrl(event.target.value)}
                    style={inputStyle}
                    placeholder="https://example.com/resource"
                  />
                  <span style={{ color: "#64748b", fontSize: 12, lineHeight: 1.6 }}>
                    {linkHelperText}
                  </span>
                </label>

                {draftLinkPreview ? <CommunitySharedLinkCard url={draftLinkPreview} /> : null}

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
