import { supabase } from "@/lib/supabaseClient";

export type ForumThreadStatus = "under_review" | "planned" | "released" | null;

export type ForumCategory = {
  id: string;
  slug: string;
  name: string;
  description: string;
  display_order?: number | null;
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

type LocalForumStore = {
  categories: ForumCategory[];
  threads: ForumThread[];
  posts: ForumPost[];
  supports: ForumThreadSupport[];
};

const STORAGE_KEY = "edudecks.forum.v3";
export const FEATURE_CATEGORY_SLUG = "help-shape-edudecks";

const CATEGORY_SEED_DATA = [
  ["getting-started", "Getting Started", "Ask your first questions and get help finding your footing."],
  ["planning-ideas", "Planning Ideas", "Share practical ways to shape weeks, rhythms, and learning blocks."],
  ["learning-moments", "Learning Moments", "Talk about real learning moments and what they revealed."],
  ["homeschool-resources", "Homeschool Resources", "Share and discover useful homeschool resources, tools, printables, and curriculum ideas."],
  ["classical-education", "Classical Education", "Discuss classical education approaches, great books, memory work, and structured learning rhythms."],
  ["report-help", "Report Help", "Get gentle help turning records into reports you can trust."],
  ["homeschool-encouragement", "Homeschool Encouragement", "Encourage one another through ordinary homeschool days."],
  ["subject-chats", "Subject Chats", "Swap ideas for literacy, numeracy, science, arts, and more."],
  ["christian-homeschooling", "Christian Homeschooling", "Discuss faith-shaped homeschool rhythms, resources, and questions."],
  ["special-needs-support", "Special Needs & Support", "Share thoughtful support ideas for different learner needs."],
  ["general-discussion", "General Discussion", "Everything else that fits the calm member conversation."],
  [FEATURE_CATEGORY_SLUG, "Help Shape MyLearna", "Share ideas, suggest improvements, and help shape the future of MyLearna."],
] as const;

const nowIso = () => new Date().toISOString();

export const DEFAULT_FORUM_CATEGORIES: ForumCategory[] = CATEGORY_SEED_DATA.map(
  ([slug, name, description], index) => ({
    id: `default-category-${index + 1}`,
    slug,
    name,
    description,
    display_order: index,
    created_at: nowIso(),
  }),
);

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

function plainTextSnippet(value: string, maxLength = 180) {
  const normalized = safe(value).replace(/\s+/g, " ");
  if (!normalized) return "";
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 1).trim()}...` : normalized;
}

function normalizeCategoryRecord(category: Partial<ForumCategory>, index = 0): ForumCategory {
  const slug = safe(category.slug) || `category-${index + 1}`;
  const seeded = DEFAULT_FORUM_CATEGORIES.find((item) => item.slug === slug);
  const name = safe(category.name) || seeded?.name || "Community";
  return {
    id: safe(category.id) || `default-category-${index + 1}`,
    slug,
    name: name === "Help Shape EduDecks" ? "Help Shape MyLearna" : name,
    description:
      safe(category.description) ||
      seeded?.description ||
      "A calm, structured place for thoughtful homeschool conversation.",
    display_order:
      typeof category.display_order === "number"
        ? category.display_order
        : seeded?.display_order ?? index,
    created_at: safe(category.created_at) || nowIso(),
  };
}

function normalizeThreadRecord(thread: Partial<ForumThread>): ForumThread {
  return {
    id: safe(thread.id),
    category_id: safe(thread.category_id),
    user_id: safe(thread.user_id),
    title: safe(thread.title),
    body: safe(thread.body),
    excerpt: safe(thread.excerpt) || plainTextSnippet(safe(thread.body)),
    is_pinned: Boolean(thread.is_pinned),
    status: (thread.status ?? null) as ForumThreadStatus,
    created_at: safe(thread.created_at) || nowIso(),
    updated_at: safe(thread.updated_at) || safe(thread.created_at) || nowIso(),
  };
}

function normalizePostRecord(post: Partial<ForumPost>): ForumPost {
  return {
    id: safe(post.id),
    thread_id: safe(post.thread_id),
    user_id: safe(post.user_id),
    body: safe(post.body),
    excerpt: safe(post.excerpt) || plainTextSnippet(safe(post.body)),
    created_at: safe(post.created_at) || nowIso(),
    updated_at: safe(post.updated_at) || safe(post.created_at) || nowIso(),
  };
}

function normalizeActivityRecord(activity: Partial<ForumThreadActivity>, thread?: ForumThread): ForumThreadActivity {
  const fallbackTime =
    safe(activity.last_activity_at) ||
    safe(thread?.updated_at) ||
    safe(thread?.created_at) ||
    nowIso();

  return {
    thread_id: safe(activity.thread_id) || safe(thread?.id),
    category_id: safe(activity.category_id) || safe(thread?.category_id),
    reply_count:
      typeof activity.reply_count === "number" && Number.isFinite(activity.reply_count)
        ? activity.reply_count
        : 0,
    last_activity_at: fallbackTime,
    latest_reply_excerpt: safe(activity.latest_reply_excerpt) || null,
    updated_at: safe(activity.updated_at) || fallbackTime,
  };
}

function buildLocalActivities(threads: ForumThread[], posts: ForumPost[]) {
  return threads.map((thread) => {
    const replies = posts
      .filter((post) => post.thread_id === thread.id)
      .sort((a, b) => safe(b.updated_at || b.created_at).localeCompare(safe(a.updated_at || a.created_at)));
    const latestReply = replies[0] || null;
    return {
      thread_id: thread.id,
      category_id: thread.category_id,
      reply_count: replies.length,
      last_activity_at: safe(latestReply?.updated_at || latestReply?.created_at || thread.updated_at || thread.created_at),
      latest_reply_excerpt: latestReply ? latestReply.excerpt : null,
      updated_at: safe(latestReply?.updated_at || latestReply?.created_at || thread.updated_at || thread.created_at),
    } satisfies ForumThreadActivity;
  });
}

export function isMissingRelationOrColumn(err: any) {
  const message = String(err?.message ?? "").toLowerCase();
  return message.includes("does not exist") && (message.includes("relation") || message.includes("column"));
}

export function memberLabel(userId: string, viewerId: string | null) {
  if (!safe(userId)) return "Member";
  if (viewerId && userId === viewerId) return "You";
  return "Member";
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

export function buildCommunityCategoryHref(slug: string) {
  return `/community/${encodeURIComponent(slug)}`;
}

export function buildCommunityThreadHref(categorySlug: string, threadId: string) {
  return `${buildCommunityCategoryHref(categorySlug)}/${encodeURIComponent(threadId)}`;
}

export function readLocalForum(): LocalForumStore {
  if (typeof window === "undefined") {
    return { categories: DEFAULT_FORUM_CATEGORIES, threads: [], posts: [], supports: [] };
  }

  const parsed = parseJson<Partial<LocalForumStore>>(window.localStorage.getItem(STORAGE_KEY), {});

  const categories =
    Array.isArray(parsed.categories) && parsed.categories.length
      ? parsed.categories.map((category, index) => normalizeCategoryRecord(category, index))
      : DEFAULT_FORUM_CATEGORIES;

  const threads = Array.isArray(parsed.threads)
    ? parsed.threads.map((thread) => normalizeThreadRecord(thread))
    : [];

  const posts = Array.isArray(parsed.posts)
    ? parsed.posts.map((post) => normalizePostRecord(post))
    : [];

  const supports = Array.isArray(parsed.supports)
    ? parsed.supports.map((support) => ({
        id: safe((support as ForumThreadSupport).id),
        thread_id: safe((support as ForumThreadSupport).thread_id),
        user_id: safe((support as ForumThreadSupport).user_id),
        created_at: safe((support as ForumThreadSupport).created_at) || nowIso(),
      }))
    : [];

  return { categories, threads, posts, supports };
}

export function writeLocalForum(store: LocalForumStore) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export async function requireCommunityUserId(): Promise<string | null> {
  const authResp = await supabase.auth.getUser();
  return authResp.data.user?.id || null;
}

function buildCategorySummaries(
  categories: ForumCategory[],
  threads: ForumThread[],
  activities: ForumThreadActivity[],
): ForumCategorySummary[] {
  const activityByThread = new Map(activities.map((activity) => [activity.thread_id, activity]));
  const categoryById = new Map(categories.map((category) => [category.id, category]));

  return [...categories]
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
    .map((category) => {
      const categoryThreads = threads.filter((thread) => thread.category_id === category.id);
      const recentThreads = [...categoryThreads]
        .sort((a, b) => {
          const aActivity = activityByThread.get(a.id);
          const bActivity = activityByThread.get(b.id);
          return safe(bActivity?.last_activity_at || b.updated_at || b.created_at).localeCompare(
            safe(aActivity?.last_activity_at || a.updated_at || a.created_at),
          );
        })
        .slice(0, 2);

      const latestThread = recentThreads[0] || null;
      const latestActivity = latestThread ? activityByThread.get(latestThread.id) : null;
      const latestText = latestThread
        ? `${latestThread.title} - ${relativeTime(
            safe(latestActivity?.last_activity_at || latestThread.updated_at || latestThread.created_at),
          )}`
        : "No discussions yet";

      return {
        ...categoryById.get(category.id)!,
        threadCount: categoryThreads.length,
        latestActivityText: latestText,
        latestThreads: recentThreads.map((thread) => {
          const activity = activityByThread.get(thread.id);
          return {
            id: thread.id,
            categorySlug: category.slug,
            title: thread.title,
            replyCount: activity?.reply_count ?? 0,
            relativeTime: relativeTime(safe(activity?.last_activity_at || thread.updated_at || thread.created_at)),
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
    .sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
      const aActivity = activityByThread.get(a.id);
      const bActivity = activityByThread.get(b.id);
      return safe(bActivity?.last_activity_at || b.updated_at || b.created_at).localeCompare(
        safe(aActivity?.last_activity_at || a.updated_at || a.created_at),
      );
    })
    .map((thread) => {
      const activity = activityByThread.get(thread.id);
      const threadSupports = supports.filter((support) => support.thread_id === thread.id);
      const category = categoryById.get(thread.category_id);
      const latestActivityAt = safe(activity?.last_activity_at || thread.updated_at || thread.created_at);

      return {
        ...thread,
        categorySlug: category?.slug || "",
        excerpt: safe(thread.excerpt) || plainTextSnippet(thread.body),
        authorLabel: memberLabel(thread.user_id, viewerId),
        replyCount: activity?.reply_count ?? 0,
        latestActivityAt,
        latestActivityText:
          activity?.reply_count && activity.reply_count > 0
            ? `Latest reply ${relativeTime(latestActivityAt)}`
            : `Started ${relativeTime(thread.created_at)}`,
        supportCount: threadSupports.length,
        viewerSupports: threadSupports.some((support) => support.user_id === viewerId),
      };
    });
}

async function loadDatabaseCategories() {
  const categoriesResp = await supabase
    .from("community_categories")
    .select("id,slug,name,description,display_order,created_at")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (categoriesResp.error) throw categoriesResp.error;
  return ((categoriesResp.data ?? []) as Partial<ForumCategory>[]).map((category, index) =>
    normalizeCategoryRecord(category, index),
  );
}

async function loadDatabaseActivities(threadIds?: string[]) {
  let query = supabase
    .from("community_thread_activity")
    .select("thread_id,category_id,reply_count,last_activity_at,latest_reply_excerpt,updated_at");

  if (threadIds?.length) {
    query = query.in("thread_id", threadIds);
  }

  const response = await query;
  if (response.error) throw response.error;

  return ((response.data ?? []) as Partial<ForumThreadActivity>[]).map((activity) =>
    normalizeActivityRecord(activity),
  );
}

async function loadDatabaseSupports(threadIds?: string[]) {
  let query = supabase
    .from("community_thread_support")
    .select("id,thread_id,user_id,created_at");

  if (threadIds?.length) {
    query = query.in("thread_id", threadIds);
  }

  const response = await query;
  if (response.error) throw response.error;

  return ((response.data ?? []) as ForumThreadSupport[]) || [];
}

export async function loadCommunityHomeData(viewerId: string | null) {
  const local = readLocalForum();

  try {
    const categories = await loadDatabaseCategories();
    if (!categories.length) {
      return {
        categories: buildCategorySummaries(
          local.categories,
          local.threads,
          buildLocalActivities(local.threads, local.posts),
        ),
        source: "local" as const,
      };
    }

    const threadsResp = await supabase
      .from("community_threads")
      .select("id,category_id,user_id,title,body,excerpt,is_pinned,status,created_at,updated_at")
      .order("is_pinned", { ascending: false })
      .order("updated_at", { ascending: false });

    if (threadsResp.error) throw threadsResp.error;

    const threads = ((threadsResp.data ?? []) as Partial<ForumThread>[]).map((thread) =>
      normalizeThreadRecord(thread),
    );
    const activities = await loadDatabaseActivities(threads.map((thread) => thread.id));

    void viewerId;
    return {
      categories: buildCategorySummaries(categories, threads, activities),
      source: "database" as const,
    };
  } catch (error) {
    if (!isMissingRelationOrColumn(error)) {
      console.error("Community home database load failed", error);
    }

    return {
      categories: buildCategorySummaries(
        local.categories,
        local.threads,
        buildLocalActivities(local.threads, local.posts),
      ),
      source: "local" as const,
    };
  }
}

export async function loadCategoryPageData(slug: string, viewerId: string | null) {
  const local = readLocalForum();
  const localCategory = local.categories.find((category) => category.slug === slug) || null;

  try {
    const categories = await loadDatabaseCategories();
    const category = categories.find((item) => item.slug === slug) || null;

    if (!category) {
      return localCategory
        ? {
            category: localCategory,
            threads: buildThreadSummaries(
              local.threads.filter((thread) => thread.category_id === localCategory.id),
              local.categories,
              buildLocalActivities(local.threads, local.posts),
              local.supports,
              viewerId,
            ),
            source: "local" as const,
          }
        : { category: null, threads: [], source: "local" as const };
    }

    const threadsResp = await supabase
      .from("community_threads")
      .select("id,category_id,user_id,title,body,excerpt,is_pinned,status,created_at,updated_at")
      .eq("category_id", category.id)
      .order("is_pinned", { ascending: false })
      .order("updated_at", { ascending: false });

    if (threadsResp.error) throw threadsResp.error;

    const threads = ((threadsResp.data ?? []) as Partial<ForumThread>[]).map((thread) =>
      normalizeThreadRecord(thread),
    );
    const threadIds = threads.map((thread) => thread.id);
    const [activities, supports] = threadIds.length
      ? await Promise.all([loadDatabaseActivities(threadIds), loadDatabaseSupports(threadIds)])
      : [[], []];

    return {
      category,
      threads: buildThreadSummaries(threads, categories, activities, supports, viewerId),
      source: "database" as const,
    };
  } catch (error) {
    if (!isMissingRelationOrColumn(error)) {
      console.error("Community category database load failed", error);
    }

    return localCategory
      ? {
          category: localCategory,
          threads: buildThreadSummaries(
            local.threads.filter((thread) => thread.category_id === localCategory.id),
            local.categories,
            buildLocalActivities(local.threads, local.posts),
            local.supports,
            viewerId,
          ),
          source: "local" as const,
        }
      : { category: null, threads: [], source: "local" as const };
  }
}

export async function loadThreadPageData(id: string, viewerId: string | null) {
  const local = readLocalForum();
  const localThread = local.threads.find((thread) => thread.id === id) || null;

  try {
    const threadResp = await supabase
      .from("community_threads")
      .select("id,category_id,user_id,title,body,excerpt,is_pinned,status,created_at,updated_at")
      .eq("id", id)
      .maybeSingle();

    if (threadResp.error) throw threadResp.error;

    const thread = threadResp.data ? normalizeThreadRecord(threadResp.data as Partial<ForumThread>) : null;
    if (!thread) {
      return localThread
        ? {
            thread: {
              ...localThread,
              categorySlug:
                local.categories.find((category) => category.id === localThread.category_id)?.slug || "",
              authorLabel: memberLabel(localThread.user_id, viewerId),
              replyCount: local.posts.filter((post) => post.thread_id === localThread.id).length,
              latestActivityAt: safe(localThread.updated_at || localThread.created_at),
              latestActivityText: `Started ${relativeTime(localThread.created_at)}`,
              supportCount: local.supports.filter((support) => support.thread_id === localThread.id).length,
              viewerSupports: local.supports.some(
                (support) => support.thread_id === localThread.id && support.user_id === viewerId,
              ),
            },
            replies: local.posts
              .filter((post) => post.thread_id === localThread.id)
              .sort((a, b) => safe(a.created_at).localeCompare(safe(b.created_at)))
              .map((post) => ({
                ...post,
                authorLabel: memberLabel(post.user_id, viewerId),
              })),
            category: local.categories.find((category) => category.id === localThread.category_id) || null,
            source: "local" as const,
          }
        : { thread: null, replies: [], category: null, source: "local" as const };
    }

    const [categories, repliesResp, activities, supports] = await Promise.all([
      loadDatabaseCategories(),
      supabase
        .from("community_replies")
        .select("id,thread_id,user_id,body,excerpt,created_at,updated_at")
        .eq("thread_id", thread.id)
        .order("created_at", { ascending: true }),
      loadDatabaseActivities([thread.id]),
      loadDatabaseSupports([thread.id]),
    ]);

    if (repliesResp.error) throw repliesResp.error;

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
      replies: (((repliesResp.data ?? []) as Partial<ForumPost>[]) || []).map((post) => ({
        ...normalizePostRecord(post),
        authorLabel: memberLabel(safe(post.user_id), viewerId),
      })),
      category,
      source: "database" as const,
    };
  } catch (error) {
    if (!isMissingRelationOrColumn(error)) {
      console.error("Community thread database load failed", error);
    }

    return localThread
      ? {
          thread: {
            ...localThread,
            categorySlug:
              local.categories.find((category) => category.id === localThread.category_id)?.slug || "",
            authorLabel: memberLabel(localThread.user_id, viewerId),
            replyCount: local.posts.filter((post) => post.thread_id === localThread.id).length,
            latestActivityAt: safe(localThread.updated_at || localThread.created_at),
            latestActivityText: `Started ${relativeTime(localThread.created_at)}`,
            supportCount: local.supports.filter((support) => support.thread_id === localThread.id).length,
            viewerSupports: local.supports.some(
              (support) => support.thread_id === localThread.id && support.user_id === viewerId,
            ),
          },
          replies: local.posts
            .filter((post) => post.thread_id === localThread.id)
            .sort((a, b) => safe(a.created_at).localeCompare(safe(b.created_at)))
            .map((post) => ({
              ...post,
              authorLabel: memberLabel(post.user_id, viewerId),
            })),
          category: local.categories.find((category) => category.id === localThread.category_id) || null,
          source: "local" as const,
        }
      : { thread: null, replies: [], category: null, source: "local" as const };
  }
}

export async function loadThreadRouteMeta(id: string) {
  try {
    const threadResp = await supabase
      .from("community_threads")
      .select("id,category_id")
      .eq("id", id)
      .maybeSingle();

    if (threadResp.error) throw threadResp.error;
    if (!threadResp.data) return null;

    const categoryResp = await supabase
      .from("community_categories")
      .select("slug")
      .eq("id", safe((threadResp.data as { category_id?: unknown }).category_id))
      .maybeSingle();

    if (categoryResp.error) throw categoryResp.error;

    const categorySlug = safe((categoryResp.data as { slug?: unknown } | null)?.slug);
    if (!categorySlug) return null;

    return {
      threadId: safe((threadResp.data as { id?: unknown }).id),
      categorySlug,
      href: buildCommunityThreadHref(categorySlug, id),
    };
  } catch (error) {
    if (!isMissingRelationOrColumn(error)) {
      console.error("Community thread route lookup failed", error);
    }
  }

  const local = readLocalForum();
  const thread = local.threads.find((item) => item.id === id);
  if (!thread) return null;

  const categorySlug = local.categories.find((category) => category.id === thread.category_id)?.slug || "";
  if (!categorySlug) return null;

  return {
    threadId: thread.id,
    categorySlug,
    href: buildCommunityThreadHref(categorySlug, thread.id),
  };
}

export async function createForumThread(input: {
  viewerId: string;
  category: ForumCategory;
  title: string;
  body: string;
}) {
  const payload = {
    category_id: input.category.id,
    user_id: input.viewerId,
    title: safe(input.title),
    body: safe(input.body),
    excerpt: plainTextSnippet(input.body),
    is_pinned: false,
    status: null,
  };

  try {
    const resp = await supabase
      .from("community_threads")
      .insert(payload)
      .select("id,category_id,user_id,title,body,excerpt,is_pinned,status,created_at,updated_at")
      .single();

    if (resp.error) throw resp.error;

    return { thread: normalizeThreadRecord(resp.data as Partial<ForumThread>), source: "database" as const };
  } catch (error) {
    if (!isMissingRelationOrColumn(error)) {
      console.error("Community thread create failed", error);
    }

    const local = readLocalForum();
    const nextThread: ForumThread = {
      id: `local-thread-${Date.now()}`,
      category_id: input.category.id,
      user_id: input.viewerId,
      title: safe(input.title),
      body: safe(input.body),
      excerpt: plainTextSnippet(input.body),
      is_pinned: false,
      status: null,
      created_at: nowIso(),
      updated_at: nowIso(),
    };

    writeLocalForum({
      ...local,
      threads: [nextThread, ...local.threads],
    });

    return { thread: nextThread, source: "local" as const };
  }
}

export async function createForumReply(input: {
  viewerId: string;
  threadId: string;
  body: string;
}) {
  const payload = {
    thread_id: input.threadId,
    user_id: input.viewerId,
    body: safe(input.body),
    excerpt: plainTextSnippet(input.body),
  };

  try {
    const postResp = await supabase
      .from("community_replies")
      .insert(payload)
      .select("id,thread_id,user_id,body,excerpt,created_at,updated_at")
      .single();

    if (postResp.error) throw postResp.error;

    return { post: normalizePostRecord(postResp.data as Partial<ForumPost>), source: "database" as const };
  } catch (error) {
    if (!isMissingRelationOrColumn(error)) {
      console.error("Community reply create failed", error);
    }

    const local = readLocalForum();
    const nextPost: ForumPost = {
      id: `local-post-${Date.now()}`,
      thread_id: input.threadId,
      user_id: input.viewerId,
      body: safe(input.body),
      excerpt: plainTextSnippet(input.body),
      created_at: nowIso(),
      updated_at: nowIso(),
    };

    writeLocalForum({
      ...local,
      posts: [...local.posts, nextPost],
      threads: local.threads.map((thread) =>
        thread.id === input.threadId
          ? { ...thread, updated_at: nextPost.updated_at }
          : thread,
      ),
    });

    return { post: nextPost, source: "local" as const };
  }
}

export async function supportForumThread(input: {
  viewerId: string;
  threadId: string;
}) {
  try {
    const existingResp = await supabase
      .from("community_thread_support")
      .select("id")
      .eq("thread_id", input.threadId)
      .eq("user_id", input.viewerId)
      .limit(1);

    if (existingResp.error) throw existingResp.error;

    const existing = (existingResp.data ?? [])[0];
    if (existing) {
      return { alreadySupported: true, source: "database" as const };
    }

    const insertResp = await supabase
      .from("community_thread_support")
      .insert({
        thread_id: input.threadId,
        user_id: input.viewerId,
      })
      .select("id,thread_id,user_id,created_at")
      .single();

    if (insertResp.error) throw insertResp.error;

    return {
      support: insertResp.data as ForumThreadSupport,
      alreadySupported: false,
      source: "database" as const,
    };
  } catch (error) {
    if (!isMissingRelationOrColumn(error)) {
      console.error("Community thread support failed", error);
    }

    const local = readLocalForum();
    const existing = local.supports.find(
      (support) => support.thread_id === input.threadId && support.user_id === input.viewerId,
    );

    if (existing) {
      return { alreadySupported: true, source: "local" as const };
    }

    const nextSupport: ForumThreadSupport = {
      id: `local-support-${Date.now()}`,
      thread_id: input.threadId,
      user_id: input.viewerId,
      created_at: nowIso(),
    };

    writeLocalForum({
      ...local,
      supports: [...local.supports, nextSupport],
    });

    return {
      support: nextSupport,
      alreadySupported: false,
      source: "local" as const,
    };
  }
}
