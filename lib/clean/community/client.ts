import { supabase } from "@/lib/supabaseClient";
import {
  getCurrentCleanUserId,
  isCleanSchemaMissingError,
} from "@/lib/clean/family/client";
import type {
  CommunityCategory,
  CommunityPost,
  CommunityPostInput,
  CommunityPostStatus,
  CommunityReaction,
  CommunityReactionCounts,
  CommunityReactionSummary,
  CommunityReactionTargetType,
  CommunityReactionToggleInput,
  CommunityReactionType,
  CommunityReport,
  CommunityReportInput,
  CommunityReportStatus,
  CommunityReportTargetType,
  CommunityThread,
  CommunityThreadInput,
  CommunityThreadsOptions,
  CommunityThreadStatus,
} from "@/lib/clean/community/types";
import {
  COMMUNITY_CATEGORIES,
  COMMUNITY_REACTION_TYPES,
} from "@/lib/clean/community/types";

export const COMMUNITY_NOT_AVAILABLE_MESSAGE =
  "MyLearna Community is not available yet.";

export const COMMUNITY_REACTIONS_NOT_AVAILABLE_MESSAGE =
  "Community reactions are not available yet.";

type CommunityThreadRow = {
  id: string;
  author_user_id: string;
  category: string;
  title: string;
  body: string;
  link_url?: string | null;
  status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type CommunityPostRow = {
  id: string;
  thread_id: string;
  author_user_id: string;
  body: string;
  status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type CommunityReportRow = {
  id: string;
  reporter_user_id: string;
  target_type: string;
  target_id: string;
  reason: string;
  status?: string | null;
  created_at?: string | null;
};

type CommunityReactionRow = {
  id: string;
  target_type: string;
  target_id: string;
  reaction_type: string;
  user_id: string;
  created_at?: string | null;
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeNullString(value: unknown) {
  const text = safe(value);
  return text || null;
}

function normalizeCommunityCategory(
  value: unknown,
  fallback: CommunityCategory = "general",
): CommunityCategory {
  const category = safe(value) as CommunityCategory;
  return COMMUNITY_CATEGORIES.includes(category) ? category : fallback;
}

function normalizeCommunityThreadStatus(value: unknown): CommunityThreadStatus {
  const status = safe(value);
  if (status === "hidden" || status === "locked") return status;
  return "open";
}

function normalizeCommunityPostStatus(value: unknown): CommunityPostStatus {
  return safe(value) === "hidden" ? "hidden" : "open";
}

function normalizeCommunityReportStatus(value: unknown): CommunityReportStatus {
  const status = safe(value);
  if (status === "reviewed" || status === "dismissed" || status === "actioned") {
    return status;
  }

  return "open";
}

function normalizeCommunityReportTargetType(
  value: unknown,
): CommunityReportTargetType {
  return safe(value) === "post" ? "post" : "thread";
}

function normalizeCommunityReactionTargetType(
  value: unknown,
): CommunityReactionTargetType {
  return safe(value) === "post" ? "post" : "thread";
}

function normalizeCommunityReactionType(
  value: unknown,
  fallback: CommunityReactionType = "like",
): CommunityReactionType {
  const reactionType = safe(value) as CommunityReactionType;
  return COMMUNITY_REACTION_TYPES.includes(reactionType) ? reactionType : fallback;
}

function toCommunityThread(row: CommunityThreadRow): CommunityThread {
  return {
    id: safe(row.id),
    authorUserId: safe(row.author_user_id),
    category: normalizeCommunityCategory(row.category),
    title: safe(row.title),
    body: safe(row.body),
    linkUrl: normalizeNullString(row.link_url),
    status: normalizeCommunityThreadStatus(row.status),
    createdAt: normalizeNullString(row.created_at),
    updatedAt: normalizeNullString(row.updated_at),
  };
}

function toCommunityPost(row: CommunityPostRow): CommunityPost {
  return {
    id: safe(row.id),
    threadId: safe(row.thread_id),
    authorUserId: safe(row.author_user_id),
    body: safe(row.body),
    status: normalizeCommunityPostStatus(row.status),
    createdAt: normalizeNullString(row.created_at),
    updatedAt: normalizeNullString(row.updated_at),
  };
}

function toCommunityReport(row: CommunityReportRow): CommunityReport {
  return {
    id: safe(row.id),
    reporterUserId: safe(row.reporter_user_id),
    targetType: normalizeCommunityReportTargetType(row.target_type),
    targetId: safe(row.target_id),
    reason: safe(row.reason),
    status: normalizeCommunityReportStatus(row.status),
    createdAt: normalizeNullString(row.created_at),
  };
}

function toCommunityReaction(row: CommunityReactionRow): CommunityReaction {
  return {
    id: safe(row.id),
    targetType: normalizeCommunityReactionTargetType(row.target_type),
    targetId: safe(row.target_id),
    reactionType: normalizeCommunityReactionType(row.reaction_type),
    userId: safe(row.user_id),
    createdAt: normalizeNullString(row.created_at),
  };
}

function sortCommunityThreads(items: CommunityThread[]) {
  return [...items].sort((left, right) => {
    const leftCreated = Date.parse(left.createdAt || left.updatedAt || "");
    const rightCreated = Date.parse(right.createdAt || right.updatedAt || "");

    if (!Number.isNaN(leftCreated) || !Number.isNaN(rightCreated)) {
      if (Number.isNaN(leftCreated)) return 1;
      if (Number.isNaN(rightCreated)) return -1;
      if (leftCreated !== rightCreated) return rightCreated - leftCreated;
    }

    return left.title.localeCompare(right.title);
  });
}

function sortCommunityPosts(items: CommunityPost[]) {
  return [...items].sort((left, right) => {
    const leftCreated = Date.parse(left.createdAt || left.updatedAt || "");
    const rightCreated = Date.parse(right.createdAt || right.updatedAt || "");

    if (!Number.isNaN(leftCreated) || !Number.isNaN(rightCreated)) {
      if (Number.isNaN(leftCreated)) return 1;
      if (Number.isNaN(rightCreated)) return -1;
      if (leftCreated !== rightCreated) return leftCreated - rightCreated;
    }

    return left.id.localeCompare(right.id);
  });
}

function validateCommunityCategory(value: unknown) {
  const category = safe(value) as CommunityCategory;
  if (!COMMUNITY_CATEGORIES.includes(category)) {
    throw new Error("Choose a valid community category.");
  }

  return category;
}

function validateCommunityReportTargetType(value: unknown) {
  const targetType = safe(value);
  if (targetType !== "thread" && targetType !== "post") {
    throw new Error("Choose valid community content to report.");
  }

  return targetType as CommunityReportTargetType;
}

function validateCommunityReactionType(value: unknown) {
  const reactionType = safe(value) as CommunityReactionType;
  if (!COMMUNITY_REACTION_TYPES.includes(reactionType)) {
    throw new Error("Choose a valid reaction.");
  }

  return reactionType;
}

function normalizeCommunityErrorMessage(error: unknown, fallback: string) {
  if (isCleanSchemaMissingError(error)) {
    return COMMUNITY_NOT_AVAILABLE_MESSAGE;
  }

  return String((error as { message?: unknown })?.message ?? fallback).trim();
}

async function requireCommunityUser(message: string) {
  const currentUserId = await getCurrentCleanUserId();
  if (!currentUserId) {
    throw new Error(message);
  }

  return currentUserId;
}

function normalizeCommunityReactionErrorMessage(error: unknown, fallback: string) {
  if (isCleanSchemaMissingError(error)) {
    return COMMUNITY_REACTIONS_NOT_AVAILABLE_MESSAGE;
  }

  return String((error as { message?: unknown })?.message ?? fallback).trim();
}

function sanitizeCommunityThreadInput(
  input: CommunityThreadInput | Partial<CommunityThreadInput>,
) {
  return {
    category:
      "category" in input && input.category !== undefined
        ? validateCommunityCategory(input.category)
        : undefined,
    title:
      "title" in input && input.title !== undefined ? safe(input.title) || null : undefined,
    body: "body" in input && input.body !== undefined ? safe(input.body) || null : undefined,
    link_url:
      "linkUrl" in input && input.linkUrl !== undefined
        ? normalizeNullString(input.linkUrl)
        : undefined,
  };
}

function sanitizeCommunityPostInput(
  input: CommunityPostInput | Partial<CommunityPostInput>,
) {
  return {
    body: "body" in input && input.body !== undefined ? safe(input.body) || null : undefined,
  };
}

function sanitizeCommunityReportInput(input: CommunityReportInput) {
  return {
    target_type: validateCommunityReportTargetType(input.targetType),
    target_id: safe(input.targetId) || null,
    reason: safe(input.reason) || null,
  };
}

function buildEmptyReactionCounts(): CommunityReactionCounts {
  return {
    like: { count: 0, reacted: false },
    helpful: { count: 0, reacted: false },
    thanks: { count: 0, reacted: false },
  };
}

function buildReactionSummary(targetIds: string[]) {
  const summary: CommunityReactionSummary = {};

  for (const targetId of targetIds) {
    summary[targetId] = buildEmptyReactionCounts();
  }

  return summary;
}

export async function listCommunityThreads(options: CommunityThreadsOptions = {}) {
  await requireCommunityUser("You need to sign in before opening MyLearna Community.");

  let query = supabase
    .from("community_threads")
    .select(
      "id,author_user_id,category,title,body,link_url,status,created_at,updated_at",
    )
    .order("created_at", { ascending: false });

  if (options.category) {
    query = query.eq("category", validateCommunityCategory(options.category));
  }

  if (typeof options.limit === "number" && options.limit > 0) {
    query = query.limit(options.limit);
  }

  const response = await query;

  if (response.error) {
    throw new Error(
      normalizeCommunityErrorMessage(
        response.error,
        "We could not load MyLearna Community just now.",
      ),
    );
  }

  return sortCommunityThreads(
    (response.data ?? []).map((row) => toCommunityThread(row as CommunityThreadRow)),
  );
}

export async function listCommunityReactionSummary(
  targetType: CommunityReactionTargetType,
  targetIds: string[],
) {
  const currentUserId = await requireCommunityUser(
    "You need to sign in before reacting in MyLearna Community.",
  );

  const normalizedTargetType = normalizeCommunityReactionTargetType(targetType);
  const normalizedTargetIds = [...new Set(targetIds.map((value) => safe(value)).filter(Boolean))];
  const summary = buildReactionSummary(normalizedTargetIds);

  if (!normalizedTargetIds.length) {
    return summary;
  }

  const response = await supabase
    .from("community_reactions")
    .select("id,target_type,target_id,reaction_type,user_id,created_at")
    .eq("target_type", normalizedTargetType)
    .in("target_id", normalizedTargetIds);

  if (response.error) {
    throw new Error(
      normalizeCommunityReactionErrorMessage(
        response.error,
        "We could not load community reactions just now.",
      ),
    );
  }

  for (const row of response.data ?? []) {
    const reaction = toCommunityReaction(row as CommunityReactionRow);
    const targetSummary =
      summary[reaction.targetId] ?? (summary[reaction.targetId] = buildEmptyReactionCounts());
    const reactionState = targetSummary[reaction.reactionType];

    reactionState.count += 1;

    if (reaction.userId === currentUserId) {
      reactionState.reacted = true;
    }
  }

  return summary;
}

export async function listCommunityReplyCounts(threadIds: string[]) {
  await requireCommunityUser("You need to sign in before opening MyLearna Community.");

  const normalizedThreadIds = [...new Set(threadIds.map((value) => safe(value)).filter(Boolean))];
  if (!normalizedThreadIds.length) {
    return {} as Record<string, number>;
  }

  const response = await supabase
    .from("community_posts")
    .select("thread_id")
    .in("thread_id", normalizedThreadIds);

  if (response.error) {
    throw new Error(
      normalizeCommunityErrorMessage(
        response.error,
        "We could not load community reply counts just now.",
      ),
    );
  }

  const counts: Record<string, number> = {};

  for (const row of response.data ?? []) {
    const threadId = safe((row as { thread_id?: unknown })?.thread_id);
    if (!threadId) continue;
    counts[threadId] = (counts[threadId] ?? 0) + 1;
  }

  return counts;
}

export async function toggleCommunityReaction(input: CommunityReactionToggleInput) {
  const currentUserId = await requireCommunityUser(
    "You need to sign in before reacting in MyLearna Community.",
  );

  const targetType = normalizeCommunityReactionTargetType(input.targetType);
  const targetId = safe(input.targetId);
  const reactionType = validateCommunityReactionType(input.reactionType);

  if (!targetId) {
    throw new Error("Choose a community thread or reply first.");
  }

  const existingResponse = await supabase
    .from("community_reactions")
    .select("id,target_type,target_id,reaction_type,user_id,created_at")
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .eq("reaction_type", reactionType)
    .eq("user_id", currentUserId)
    .maybeSingle();

  if (existingResponse.error) {
    throw new Error(
      normalizeCommunityReactionErrorMessage(
        existingResponse.error,
        "We could not update this reaction just now.",
      ),
    );
  }

  if (existingResponse.data) {
    const deleteResponse = await supabase
      .from("community_reactions")
      .delete()
      .eq("id", safe((existingResponse.data as CommunityReactionRow).id));

    if (deleteResponse.error) {
      throw new Error(
        normalizeCommunityReactionErrorMessage(
          deleteResponse.error,
          "We could not remove this reaction just now.",
        ),
      );
    }

    return {
      active: false,
      targetType,
      targetId,
      reactionType,
    };
  }

  const insertResponse = await supabase
    .from("community_reactions")
    .insert({
      target_type: targetType,
      target_id: targetId,
      reaction_type: reactionType,
      user_id: currentUserId,
    })
    .select("id,target_type,target_id,reaction_type,user_id,created_at")
    .maybeSingle();

  if (insertResponse.error || !insertResponse.data) {
    throw new Error(
      normalizeCommunityReactionErrorMessage(
        insertResponse.error,
        "We could not add this reaction just now.",
      ),
    );
  }

  return {
    active: true,
    targetType,
    targetId,
    reactionType,
  };
}

export async function getCommunityThread(threadId: string) {
  await requireCommunityUser("You need to sign in before opening MyLearna Community.");

  const normalizedThreadId = safe(threadId);
  if (!normalizedThreadId) {
    throw new Error("A community thread is required.");
  }

  const response = await supabase
    .from("community_threads")
    .select(
      "id,author_user_id,category,title,body,link_url,status,created_at,updated_at",
    )
    .eq("id", normalizedThreadId)
    .maybeSingle();

  if (response.error) {
    throw new Error(
      normalizeCommunityErrorMessage(
        response.error,
        "We could not open this community thread just now.",
      ),
    );
  }

  if (!response.data) {
    return null;
  }

  return toCommunityThread(response.data as CommunityThreadRow);
}

export async function createCommunityThread(input: CommunityThreadInput) {
  const currentUserId = await requireCommunityUser(
    "You need to sign in before starting a community thread.",
  );

  const payload = sanitizeCommunityThreadInput(input);

  if (!payload.category) {
    throw new Error("Choose a community category.");
  }

  if (!safe(payload.title)) {
    throw new Error("A thread title is required.");
  }

  if (!safe(payload.body)) {
    throw new Error("Add a message before starting this thread.");
  }

  const response = await supabase
    .from("community_threads")
    .insert({
      author_user_id: currentUserId,
      category: payload.category,
      title: payload.title,
      body: payload.body,
      link_url: payload.link_url,
    })
    .select(
      "id,author_user_id,category,title,body,link_url,status,created_at,updated_at",
    )
    .maybeSingle();

  if (response.error || !response.data) {
    throw new Error(
      normalizeCommunityErrorMessage(
        response.error,
        "We could not start this community thread.",
      ),
    );
  }

  return toCommunityThread(response.data as CommunityThreadRow);
}

export async function updateCommunityThread(
  threadId: string,
  input: Partial<CommunityThreadInput>,
) {
  await requireCommunityUser("You need to sign in before editing this community thread.");

  const normalizedThreadId = safe(threadId);
  if (!normalizedThreadId) {
    throw new Error("A community thread is required.");
  }

  const payload = Object.fromEntries(
    Object.entries(sanitizeCommunityThreadInput(input)).filter(
      ([, value]) => value !== undefined,
    ),
  );

  if (!Object.keys(payload).length) {
    throw new Error("Choose something to update in this thread.");
  }

  if (payload.category !== undefined) {
    validateCommunityCategory(payload.category);
  }

  if (payload.title !== undefined && !safe(payload.title)) {
    throw new Error("A thread title is required.");
  }

  if (payload.body !== undefined && !safe(payload.body)) {
    throw new Error("Add a message before saving this thread.");
  }

  const response = await supabase
    .from("community_threads")
    .update(payload)
    .eq("id", normalizedThreadId)
    .select(
      "id,author_user_id,category,title,body,link_url,status,created_at,updated_at",
    )
    .maybeSingle();

  if (response.error || !response.data) {
    throw new Error(
      normalizeCommunityErrorMessage(
        response.error,
        "We could not update this community thread.",
      ),
    );
  }

  return toCommunityThread(response.data as CommunityThreadRow);
}

export async function deleteCommunityThread(threadId: string) {
  await requireCommunityUser("You need to sign in before deleting this community thread.");

  const normalizedThreadId = safe(threadId);
  if (!normalizedThreadId) {
    throw new Error("A community thread is required.");
  }

  const response = await supabase
    .from("community_threads")
    .delete()
    .eq("id", normalizedThreadId);

  if (response.error) {
    throw new Error(
      normalizeCommunityErrorMessage(
        response.error,
        "We could not delete this community thread.",
      ),
    );
  }
}

export async function listCommunityPosts(threadId: string) {
  await requireCommunityUser("You need to sign in before opening MyLearna Community.");

  const normalizedThreadId = safe(threadId);
  if (!normalizedThreadId) {
    throw new Error("A community thread is required.");
  }

  const response = await supabase
    .from("community_posts")
    .select("id,thread_id,author_user_id,body,status,created_at,updated_at")
    .eq("thread_id", normalizedThreadId)
    .order("created_at", { ascending: true });

  if (response.error) {
    throw new Error(
      normalizeCommunityErrorMessage(
        response.error,
        "We could not load community replies just now.",
      ),
    );
  }

  return sortCommunityPosts(
    (response.data ?? []).map((row) => toCommunityPost(row as CommunityPostRow)),
  );
}

export async function createCommunityPost(
  threadId: string,
  input: CommunityPostInput,
) {
  const currentUserId = await requireCommunityUser(
    "You need to sign in before replying in MyLearna Community.",
  );

  const normalizedThreadId = safe(threadId);
  if (!normalizedThreadId) {
    throw new Error("A community thread is required.");
  }

  const payload = sanitizeCommunityPostInput(input);

  if (!safe(payload.body)) {
    throw new Error("Add a reply before posting.");
  }

  const response = await supabase
    .from("community_posts")
    .insert({
      thread_id: normalizedThreadId,
      author_user_id: currentUserId,
      body: payload.body,
    })
    .select("id,thread_id,author_user_id,body,status,created_at,updated_at")
    .maybeSingle();

  if (response.error || !response.data) {
    throw new Error(
      normalizeCommunityErrorMessage(
        response.error,
        "We could not post this reply.",
      ),
    );
  }

  return toCommunityPost(response.data as CommunityPostRow);
}

export async function updateCommunityPost(
  postId: string,
  input: Partial<CommunityPostInput>,
) {
  await requireCommunityUser("You need to sign in before editing this reply.");

  const normalizedPostId = safe(postId);
  if (!normalizedPostId) {
    throw new Error("A community reply is required.");
  }

  const payload = Object.fromEntries(
    Object.entries(sanitizeCommunityPostInput(input)).filter(
      ([, value]) => value !== undefined,
    ),
  );

  if (!Object.keys(payload).length) {
    throw new Error("Choose something to update in this reply.");
  }

  if (payload.body !== undefined && !safe(payload.body)) {
    throw new Error("Add a reply before saving.");
  }

  const response = await supabase
    .from("community_posts")
    .update(payload)
    .eq("id", normalizedPostId)
    .select("id,thread_id,author_user_id,body,status,created_at,updated_at")
    .maybeSingle();

  if (response.error || !response.data) {
    throw new Error(
      normalizeCommunityErrorMessage(
        response.error,
        "We could not update this reply.",
      ),
    );
  }

  return toCommunityPost(response.data as CommunityPostRow);
}

export async function deleteCommunityPost(postId: string) {
  await requireCommunityUser("You need to sign in before deleting this reply.");

  const normalizedPostId = safe(postId);
  if (!normalizedPostId) {
    throw new Error("A community reply is required.");
  }

  const response = await supabase
    .from("community_posts")
    .delete()
    .eq("id", normalizedPostId);

  if (response.error) {
    throw new Error(
      normalizeCommunityErrorMessage(
        response.error,
        "We could not delete this reply.",
      ),
    );
  }
}

export async function reportCommunityContent(input: CommunityReportInput) {
  const currentUserId = await requireCommunityUser(
    "You need to sign in before reporting community content.",
  );

  const payload = sanitizeCommunityReportInput(input);

  if (!safe(payload.target_id)) {
    throw new Error("Choose community content to report.");
  }

  if (!safe(payload.reason)) {
    throw new Error("Add a reason before sending this report.");
  }

  const response = await supabase
    .from("community_reports")
    .insert({
      reporter_user_id: currentUserId,
      target_type: payload.target_type,
      target_id: payload.target_id,
      reason: payload.reason,
    })
    .select("id,reporter_user_id,target_type,target_id,reason,status,created_at")
    .maybeSingle();

  if (response.error || !response.data) {
    throw new Error(
      normalizeCommunityErrorMessage(
        response.error,
        "We could not send this community report.",
      ),
    );
  }

  return toCommunityReport(response.data as CommunityReportRow);
}
