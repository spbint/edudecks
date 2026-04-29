import { supabase } from "@/lib/supabaseClient";

export type ForumThreadStatus = "under_review" | "planned" | "released" | null;

export type ForumCategory = {
  id: string;
  slug: string;
  name: string;
  description: string;
  display_order: number | null;
  created_at: string;
};

export type ForumThread = {
  id: string;
  category_id: string;
  user_id: string;
  title: string;
  body: string;
  excerpt: string;
  is_pinned: boolean;
  status: ForumThreadStatus;
  created_at: string;
  updated_at: string;
};

export type ForumPost = {
  id: string;
  thread_id: string;
  user_id: string;
  body: string;
  excerpt: string;
  created_at: string;
  updated_at: string;
};

export type ForumThreadActivity = {
  thread_id: string;
  category_id: string;
  reply_count: number;
  last_activity_at: string;
  latest_reply_excerpt: string | null;
  updated_at: string;
};

export type ForumThreadSupport = {
  id: string;
  thread_id: string;
  user_id: string;
  created_at: string;
};

export type ForumCategorySummary = ForumCategory & {
  threadCount: number;
  latestActivityText: string;
  latestThreads: Array<{
    id: string;
    categorySlug: string;
    title: string;
    replyCount: number;
    relativeTime: string;
  }>;
};

export type ForumThreadSummary = ForumThread & {
  categorySlug: string;
  authorLabel: string;
  replyCount: number;
  latestActivityAt: string;
  latestActivityText: string;
  supportCount: number;
  viewerSupports: boolean;
};

type CommunityRow = Record<string, unknown>;

type CommunityCategorySeed = {
  slug: string;
  name: string;
  description: string;
  display_order: number;
};

export const FEATURE_CATEGORY_SLUG = "help-shape-edudecks";

export const CANONICAL_COMMUNITY_CATEGORIES: CommunityCategorySeed[] = [
  {
    slug: "getting-started",
    name: "Getting Started",
    description: "A gentle place to ask first questions and find a calm starting point.",
    display_order: 0,
  },
  {
    slug: "planning-ideas",
    name: "Planning Ideas",
    description: "Talk about planning rhythms, weekly structure, and practical homeschool flow.",
    display_order: 1,
  },
  {
    slug: "learning-moments",
    name: "Learning Moments",
    description: "Share real learning moments and what they revealed over time.",
    display_order: 2,
  },
  {
    slug: "homeschool-resources",
    name: "Homeschool Resources",
    description: "Share useful homeschool resources, tools, printables, and curriculum ideas.",
    display_order: 3,
  },
  {
    slug: "classical-education",
    name: "Classical Education",
    description: "Discuss classical education, great books, memory work, and structured learning rhythms.",
    display_order: 4,
  },
  {
    slug: "report-help",
    name: "Report Help",
    description: "Get practical help turning records and evidence into clearer reports.",
    display_order: 5,
  },
  {
    slug: "homeschool-encouragement",
    name: "Homeschool Encouragement",
    description: "A calm place to encourage one another through ordinary homeschool days.",
    display_order: 6,
  },
  {
    slug: "subject-chats",
    name: "Subject Chats",
    description: "Swap ideas for literacy, numeracy, science, arts, history, and more.",
    display_order: 7,
  },
  {
    slug: "christian-homeschooling",
    name: "Christian Homeschooling",
    description: "Discuss faith-shaped homeschool rhythms, resources, and questions.",
    display_order: 8,
  },
  {
    slug: "special-needs-support",
    name: "Special Needs & Support",
    description: "Share thoughtful support ideas for different learner needs and family situations.",
    display_order: 9,
  },
  {
    slug: "general-discussion",
    name: "General Discussion",
    description: "Everything else that fits a calm, practical homeschool conversation.",
    display_order: 10,
  },
  {
    slug: FEATURE_CATEGORY_SLUG,
    name: "Help Shape MyLearna",
    description: "Share ideas, pain points, and practical suggestions that would make MyLearna more helpful.",
    display_order: 11,
  },
];

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function text(value: unknown) {
  return String(value ?? "").trim();
}

function numberOrNull(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function nowIso() {
  return new Date().toISOString();
}

function plainTextSnippet(value: string, maxLength = 180) {
  const normalized = text(value).replace(/\s+/g, " ");
  if (!normalized) return "";
  return normalized.length > maxLength
    ? `${normalized.slice(0, maxLength - 3).trim()}...`
    : normalized;
}

function isMissingContractError(error: unknown) {
  const message = text((error as { message?: unknown })?.message).toLowerCase();
  return (
    (message.includes("relation") || message.includes("column")) &&
    message.includes("does not exist")
  );
}

function isRlsError(error: unknown) {
  return text((error as { message?: unknown })?.message)
    .toLowerCase()
    .includes("row-level security");
}

function describeCommunityError(action: string, error: unknown) {
  if (isMissingContractError(error)) {
    return `Community could not ${action} because the database contract is not ready. Run the Community rebuild SQL first.`;
  }

  if (isRlsError(error)) {
    return `Community could not ${action} because the current database policy blocked the write. Run the Community rebuild SQL and verify the signed-in user matches user_id.`;
  }

  const message = text(
    (error as { details?: unknown; message?: unknown; hint?: unknown })?.details ||
      (error as { message?: unknown; hint?: unknown })?.message ||
      (error as { hint?: unknown })?.hint,
  );

  if (message) {
    return `Community could not ${action}: ${message}`;
  }

  return `Community could not ${action}.`;
}

function memberLabel(userId: string, viewerId: string | null) {
  if (!userId) return "Member";
  if (viewerId && userId === viewerId) return "You";
  return "Member";
}

function seedForSlug(slug: string) {
  return CANONICAL_COMMUNITY_CATEGORIES.find((item) => item.slug === slug) || null;
}

function normalizeCategoryRecord(record: CommunityRow, index = 0): ForumCategory {
  const slug = text(record.slug) || `community-category-${index + 1}`;
  const seed = seedForSlug(slug);
  const rawName = text(record.name) || text(record.title) || seed?.name || "Community";

  return {
    id: text(record.id),
    slug,
    name: rawName === "Help Shape EduDecks" ? "Help Shape MyLearna" : rawName,
    description:
      text(record.description) ||
      seed?.description ||
      "A calm, structured place for thoughtful homeschool conversation.",
    display_order: numberOrNull(record.display_order) ?? seed?.display_order ?? index,
    created_at: text(record.created_at) || nowIso(),
  };
}

function normalizeThreadStatus(value: unknown): ForumThreadStatus {
  const status = text(value);
  if (status === "under_review" || status === "planned" || status === "released") {
    return status;
  }
  return null;
}

function normalizeThreadRecord(record: CommunityRow): ForumThread {
  return {
    id: text(record.id),
    category_id: text(record.category_id),
    user_id: text(record.user_id) || text(record.author_user_id),
    title: text(record.title),
    body: text(record.body),
    excerpt: text(record.excerpt) || plainTextSnippet(text(record.body)),
    is_pinned: Boolean(record.is_pinned),
    status: normalizeThreadStatus(record.status),
    created_at: text(record.created_at) || nowIso(),
    updated_at: text(record.updated_at) || text(record.created_at) || nowIso(),
  };
}

function normalizeReplyRecord(record: CommunityRow): ForumPost {
  return {
    id: text(record.id),
    thread_id: text(record.thread_id),
    user_id: text(record.user_id) || text(record.author_user_id),
    body: text(record.body),
    excerpt: text(record.excerpt) || plainTextSnippet(text(record.body)),
    created_at: text(record.created_at) || nowIso(),
    updated_at: text(record.updated_at) || text(record.created_at) || nowIso(),
  };
}

function normalizeActivityRecord(
  record: CommunityRow,
  thread?: ForumThread | null,
): ForumThreadActivity {
  const fallbackTime =
    text(record.last_activity_at) ||
    text(thread?.updated_at) ||
    text(thread?.created_at) ||
    nowIso();

  return {
    thread_id: text(record.thread_id) || text(thread?.id),
    category_id: text(record.category_id) || text(thread?.category_id),
    reply_count: numberOrNull(record.reply_count) ?? 0,
    last_activity_at: fallbackTime,
    latest_reply_excerpt: text(record.latest_reply_excerpt) || null,
    updated_at: text(record.updated_at) || fallbackTime,
  };
}

function normalizeSupportRecord(record: CommunityRow): ForumThreadSupport {
  return {
    id: text(record.id),
    thread_id: text(record.thread_id),
    user_id: text(record.user_id) || text(record.author_user_id),
    created_at: text(record.created_at) || nowIso(),
  };
}

function sortCategories(categories: ForumCategory[]) {
  return [...categories].sort((a, b) => {
    const orderDelta = (a.display_order ?? 999) - (b.display_order ?? 999);
    if (orderDelta !== 0) return orderDelta;
    return a.slug.localeCompare(b.slug);
  });
}

function buildCategorySummaries(
  categories: ForumCategory[],
  threads: ForumThread[],
  activities: ForumThreadActivity[],
): ForumCategorySummary[] {
  const activityByThread = new Map(activities.map((activity) => [activity.thread_id, activity]));

  return sortCategories(categories).map((category) => {
    const categoryThreads = threads.filter((thread) => thread.category_id === category.id);
    const recentThreads = [...categoryThreads]
      .sort((left, right) => {
        if (left.is_pinned !== right.is_pinned) return left.is_pinned ? -1 : 1;

        const leftActivity = activityByThread.get(left.id);
        const rightActivity = activityByThread.get(right.id);

        return text(rightActivity?.last_activity_at || right.updated_at || right.created_at).localeCompare(
          text(leftActivity?.last_activity_at || left.updated_at || left.created_at),
        );
      })
      .slice(0, 2);

    const latestThread = recentThreads[0] || null;
    const latestActivity = latestThread ? activityByThread.get(latestThread.id) : null;

    return {
      ...category,
      threadCount: categoryThreads.length,
      latestActivityText: latestThread
        ? `${latestThread.title} - ${relativeTime(
            text(latestActivity?.last_activity_at || latestThread.updated_at || latestThread.created_at),
          )}`
        : "No discussions yet",
      latestThreads: recentThreads.map((thread) => {
        const activity = activityByThread.get(thread.id);
        return {
          id: thread.id,
          categorySlug: category.slug,
          title: thread.title,
          replyCount: activity?.reply_count ?? 0,
          relativeTime: relativeTime(
            text(activity?.last_activity_at || thread.updated_at || thread.created_at),
          ),
        };
      }),
    };
  });
}

function buildThreadSummaries(
  threads: ForumThread[],
  categories: ForumCategory[],
  activities: ForumThreadActivity[],
  supports: ForumThreadSupport[],
  viewerId: string | null,
): ForumThreadSummary[] {
  const activityByThread = new Map(activities.map((activity) => [activity.thread_id, activity]));
  const categoryById = new Map(categories.map((category) => [category.id, category]));

  return [...threads]
    .sort((left, right) => {
      if (left.is_pinned !== right.is_pinned) return left.is_pinned ? -1 : 1;

      const leftActivity = activityByThread.get(left.id);
      const rightActivity = activityByThread.get(right.id);

      return text(rightActivity?.last_activity_at || right.updated_at || right.created_at).localeCompare(
        text(leftActivity?.last_activity_at || left.updated_at || left.created_at),
      );
    })
    .map((thread) => {
      const activity = activityByThread.get(thread.id) || normalizeActivityRecord({}, thread);
      const threadSupports = supports.filter((support) => support.thread_id === thread.id);
      const category = categoryById.get(thread.category_id) || null;
      const latestActivityAt = text(activity.last_activity_at || thread.updated_at || thread.created_at);

      return {
        ...thread,
        categorySlug: category?.slug || "",
        authorLabel: memberLabel(thread.user_id, viewerId),
        replyCount: activity.reply_count,
        latestActivityAt,
        latestActivityText:
          activity.reply_count > 0
            ? `Latest reply ${relativeTime(latestActivityAt)}`
            : `Started ${relativeTime(thread.created_at)}`,
        supportCount: threadSupports.length,
        viewerSupports: threadSupports.some((support) => support.user_id === viewerId),
      };
    });
}

async function loadCategoriesFromDatabase() {
  const response = await supabase.from("community_categories").select("*");
  if (response.error) {
    throw new Error(describeCommunityError("load categories", response.error));
  }

  return sortCategories(
    ((response.data ?? []) as CommunityRow[]).map((record, index) =>
      normalizeCategoryRecord(record, index),
    ),
  );
}

async function loadActivities(threadIds?: string[]) {
  try {
    let query = supabase.from("community_thread_activity").select("*");
    if (threadIds?.length) {
      query = query.in("thread_id", threadIds);
    }

    const response = await query;
    if (response.error) throw response.error;

    return ((response.data ?? []) as CommunityRow[]).map((record) =>
      normalizeActivityRecord(record),
    );
  } catch (error) {
    if (isMissingContractError(error)) return [];
    throw new Error(describeCommunityError("load thread activity", error));
  }
}

async function loadSupports(threadIds?: string[]) {
  try {
    let query = supabase.from("community_thread_support").select("*");
    if (threadIds?.length) {
      query = query.in("thread_id", threadIds);
    }

    const response = await query;
    if (response.error) throw response.error;

    return ((response.data ?? []) as CommunityRow[]).map((record) =>
      normalizeSupportRecord(record),
    );
  } catch (error) {
    if (isMissingContractError(error)) return [];
    throw new Error(describeCommunityError("load thread support", error));
  }
}

async function loadThreadsFromDatabase(categoryId?: string) {
  let query = supabase.from("community_threads").select("*");
  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  const response = await query.order("is_pinned", { ascending: false }).order("updated_at", {
    ascending: false,
  });

  if (response.error) {
    throw new Error(describeCommunityError("load threads", response.error));
  }

  return ((response.data ?? []) as CommunityRow[]).map((record) => normalizeThreadRecord(record));
}

async function loadThreadById(threadId: string) {
  const response = await supabase
    .from("community_threads")
    .select("*")
    .eq("id", threadId)
    .maybeSingle();

  if (response.error) {
    throw new Error(describeCommunityError("load the discussion", response.error));
  }

  return response.data ? normalizeThreadRecord(response.data as CommunityRow) : null;
}

async function loadRepliesByThreadId(threadId: string) {
  const response = await supabase
    .from("community_replies")
    .select("*")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  if (response.error) {
    throw new Error(describeCommunityError("load replies", response.error));
  }

  return ((response.data ?? []) as CommunityRow[]).map((record) => normalizeReplyRecord(record));
}

async function loadCategoryBySlug(slug: string) {
  const response = await supabase
    .from("community_categories")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (response.error) {
    throw new Error(describeCommunityError("load the category", response.error));
  }

  return response.data ? normalizeCategoryRecord(response.data as CommunityRow) : null;
}

async function loadCategoryById(id: string) {
  const response = await supabase
    .from("community_categories")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (response.error) {
    throw new Error(describeCommunityError("load the category", response.error));
  }

  return response.data ? normalizeCategoryRecord(response.data as CommunityRow) : null;
}

async function refreshThreadActivityRecord(input: {
  threadId: string;
  categoryId: string;
  lastActivityAt: string;
  latestReplyExcerpt: string | null;
}) {
  try {
    const replyCountResponse = await supabase
      .from("community_replies")
      .select("id", { count: "exact", head: true })
      .eq("thread_id", input.threadId);

    if (replyCountResponse.error) throw replyCountResponse.error;

    const upsertResponse = await supabase.from("community_thread_activity").upsert(
      {
        thread_id: input.threadId,
        category_id: input.categoryId,
        reply_count: replyCountResponse.count ?? 0,
        last_activity_at: input.lastActivityAt,
        latest_reply_excerpt: input.latestReplyExcerpt,
        updated_at: input.lastActivityAt,
      },
      { onConflict: "thread_id" },
    );

    if (upsertResponse.error) throw upsertResponse.error;
  } catch (error) {
    if (!isMissingContractError(error)) {
      console.error("Community thread activity sync failed", error);
    }
  }
}

export function relativeTime(value: string) {
  const date = new Date(value);
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

export function getThreadStatusLabel(status: ForumThreadStatus) {
  if (status === "under_review") return "Under Review";
  if (status === "planned") return "Planned";
  if (status === "released") return "Released";
  return null;
}

export function isFeatureSuggestionCategory(category: Pick<ForumCategory, "slug"> | null | undefined) {
  return category?.slug === FEATURE_CATEGORY_SLUG;
}

export function isDatabaseCategoryId(value: string | null | undefined) {
  return UUID_PATTERN.test(text(value));
}

export function buildCommunityCategoryHref(slug: string) {
  return `/community/${encodeURIComponent(slug)}`;
}

export function buildCommunityThreadHref(categorySlug: string, threadId: string) {
  return `${buildCommunityCategoryHref(categorySlug)}/${encodeURIComponent(threadId)}`;
}

export async function requireCommunityUserId(): Promise<string | null> {
  const response = await supabase.auth.getUser();
  return response.data.user?.id || null;
}

export async function loadCommunityHomeData(viewerId: string) {
  if (!text(viewerId)) {
    throw new Error("Sign in to browse Community.");
  }

  const categories = await loadCategoriesFromDatabase();
  const threads = await loadThreadsFromDatabase();
  const activities = await loadActivities(threads.map((thread) => thread.id));

  return {
    categories: buildCategorySummaries(categories, threads, activities),
    source: "database" as const,
  };
}

export async function loadCategoryPageData(slug: string, viewerId: string) {
  if (!text(viewerId)) {
    throw new Error("Sign in to browse Community.");
  }

  const category = await loadCategoryBySlug(slug);
  if (!category) {
    return {
      category: null,
      threads: [],
      source: "database" as const,
    };
  }

  const [allCategories, threads] = await Promise.all([
    loadCategoriesFromDatabase(),
    loadThreadsFromDatabase(category.id),
  ]);
  const threadIds = threads.map((thread) => thread.id);
  const [activities, supports] = await Promise.all([
    loadActivities(threadIds),
    loadSupports(threadIds),
  ]);

  return {
    category,
    threads: buildThreadSummaries(threads, allCategories, activities, supports, viewerId),
    source: "database" as const,
  };
}

export async function loadThreadPageData(threadId: string, viewerId: string) {
  if (!text(viewerId)) {
    throw new Error("Sign in to browse Community.");
  }

  const thread = await loadThreadById(threadId);
  if (!thread) {
    return {
      thread: null,
      replies: [],
      category: null,
      source: "database" as const,
    };
  }

  const [categories, replies, activities, supports] = await Promise.all([
    loadCategoriesFromDatabase(),
    loadRepliesByThreadId(threadId),
    loadActivities([threadId]),
    loadSupports([threadId]),
  ]);
  const category = categories.find((item) => item.id === thread.category_id) || null;
  const activity = activities[0] || normalizeActivityRecord({}, thread);

  return {
    thread: {
      ...thread,
      categorySlug: category?.slug || "",
      authorLabel: memberLabel(thread.user_id, viewerId),
      replyCount: activity.reply_count,
      latestActivityAt: activity.last_activity_at,
      latestActivityText:
        activity.reply_count > 0
          ? `Latest reply ${relativeTime(activity.last_activity_at)}`
          : `Started ${relativeTime(thread.created_at)}`,
      supportCount: supports.length,
      viewerSupports: supports.some((support) => support.user_id === viewerId),
    },
    replies: replies.map((reply) => ({
      ...reply,
      authorLabel: memberLabel(reply.user_id, viewerId),
    })),
    category,
    source: "database" as const,
  };
}

export async function loadThreadRouteMeta(threadId: string) {
  const thread = await loadThreadById(threadId);
  if (!thread) return null;

  const category = await loadCategoryById(thread.category_id);
  if (!category) return null;

  return {
    threadId: thread.id,
    categorySlug: category.slug,
    href: buildCommunityThreadHref(category.slug, thread.id),
  };
}

export async function createForumThread(input: {
  viewerId: string;
  categoryId: string;
  title: string;
  body: string;
}) {
  const viewerId = text(input.viewerId);
  const categoryId = text(input.categoryId);
  const title = text(input.title);
  const body = text(input.body);

  if (!viewerId) {
    throw new Error("Sign in to start a conversation.");
  }

  if (!isDatabaseCategoryId(categoryId)) {
    throw new Error("This category is not available in the database yet.");
  }

  if (!title) {
    throw new Error("Add a discussion title.");
  }

  if (!body) {
    throw new Error("Add an opening post.");
  }

  const category = await loadCategoryById(categoryId);
  if (!category) {
    throw new Error("This category could not be found in the database.");
  }

  const response = await supabase
    .from("community_threads")
    .insert({
      category_id: category.id,
      user_id: viewerId,
      title,
      body,
      excerpt: plainTextSnippet(body),
      is_pinned: false,
      status: null,
    })
    .select("*")
    .single();

  if (response.error) {
    throw new Error(describeCommunityError("post that discussion", response.error));
  }

  const thread = normalizeThreadRecord(response.data as CommunityRow);
  await refreshThreadActivityRecord({
    threadId: thread.id,
    categoryId: category.id,
    lastActivityAt: thread.updated_at || thread.created_at,
    latestReplyExcerpt: null,
  });

  return {
    category,
    thread,
    source: "database" as const,
  };
}

export async function createForumReply(input: {
  viewerId: string;
  threadId: string;
  body: string;
}) {
  const viewerId = text(input.viewerId);
  const threadId = text(input.threadId);
  const body = text(input.body);

  if (!viewerId) {
    throw new Error("Sign in to reply.");
  }

  if (!UUID_PATTERN.test(threadId)) {
    throw new Error("This discussion is not ready for replies.");
  }

  if (!body) {
    throw new Error("Write a reply first.");
  }

  const thread = await loadThreadById(threadId);
  if (!thread) {
    throw new Error("This discussion could not be found.");
  }

  const response = await supabase
    .from("community_replies")
    .insert({
      thread_id: thread.id,
      user_id: viewerId,
      body,
      excerpt: plainTextSnippet(body),
    })
    .select("*")
    .single();

  if (response.error) {
    throw new Error(describeCommunityError("post that reply", response.error));
  }

  const post = normalizeReplyRecord(response.data as CommunityRow);
  const activityTime = post.updated_at || post.created_at || nowIso();

  try {
    const updateResponse = await supabase
      .from("community_threads")
      .update({ updated_at: activityTime })
      .eq("id", thread.id);

    if (updateResponse.error) throw updateResponse.error;
  } catch (error) {
    if (!isMissingContractError(error)) {
      console.error("Community thread timestamp sync failed", error);
    }
  }

  await refreshThreadActivityRecord({
    threadId: thread.id,
    categoryId: thread.category_id,
    lastActivityAt: activityTime,
    latestReplyExcerpt: plainTextSnippet(post.body),
  });

  return {
    post,
    source: "database" as const,
  };
}

export async function supportForumThread(input: { viewerId: string; threadId: string }) {
  const viewerId = text(input.viewerId);
  const threadId = text(input.threadId);

  if (!viewerId) {
    throw new Error("Sign in to support this discussion.");
  }

  if (!UUID_PATTERN.test(threadId)) {
    throw new Error("This discussion is not ready for support yet.");
  }

  const existingResponse = await supabase
    .from("community_thread_support")
    .select("*")
    .eq("thread_id", threadId)
    .eq("user_id", viewerId)
    .limit(1);

  if (existingResponse.error) {
    throw new Error(describeCommunityError("save support", existingResponse.error));
  }

  const existing = (existingResponse.data ?? [])[0];
  if (existing) {
    return {
      support: normalizeSupportRecord(existing as CommunityRow),
      alreadySupported: true,
      source: "database" as const,
    };
  }

  const insertResponse = await supabase
    .from("community_thread_support")
    .insert({
      thread_id: threadId,
      user_id: viewerId,
    })
    .select("*")
    .single();

  if (insertResponse.error) {
    throw new Error(describeCommunityError("save support", insertResponse.error));
  }

  return {
    support: normalizeSupportRecord(insertResponse.data as CommunityRow),
    alreadySupported: false,
    source: "database" as const,
  };
}
