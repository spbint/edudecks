"use client";

import { supabase } from "@/lib/supabaseClient";

export type ForumThreadStatus = "under_review" | "planned" | "released" | null;

export type ForumCategory = {
  id: string;
  slug: string;
  name: string;
  description: string;
  created_at: string;
};

export type ForumThread = {
  id: string;
  category_id: string;
  user_id: string;
  title: string;
  body: string;
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
  created_at: string;
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
};

export type ForumThreadSummary = ForumThread & {
  authorLabel: string;
  replyCount: number;
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

const STORAGE_KEY = "edudecks.forum.v2";
const FEATURE_CATEGORY_SLUG = "help-shape-edudecks";

const nowIso = () => new Date().toISOString();

export const DEFAULT_FORUM_CATEGORIES: ForumCategory[] = [
  ["getting-started", "Getting Started", "Ask your first questions and get help finding your footing."],
  ["planning-ideas", "Planning Ideas", "Share practical ways to shape weeks, rhythms, and learning blocks."],
  ["learning-moments", "Learning Moments", "Talk about real learning moments and what they revealed."],
  ["report-help", "Report Help", "Get gentle help turning records into reports you can trust."],
  ["homeschool-encouragement", "Homeschool Encouragement", "Encourage one another through ordinary homeschool days."],
  ["subject-chats", "Subject Chats", "Swap ideas for literacy, numeracy, science, arts, and more."],
  ["christian-homeschooling", "Christian Homeschooling", "Discuss faith-shaped homeschool rhythms, resources, and questions."],
  ["special-needs-support", "Special Needs & Support", "Share thoughtful support ideas for different learner needs."],
  ["general-discussion", "General Discussion", "Everything else that fits the calm member conversation."],
  [FEATURE_CATEGORY_SLUG, "Help Shape EduDecks", "Share ideas, suggest improvements, and help shape the future of EduDecks."],
].map(([slug, name, description], index) => ({
  id: `default-category-${index + 1}`,
  slug,
  name,
  description,
  created_at: nowIso(),
}));

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

export function readLocalForum(): LocalForumStore {
  if (typeof window === "undefined") {
    return { categories: DEFAULT_FORUM_CATEGORIES, threads: [], posts: [], supports: [] };
  }

  const parsed = parseJson<Partial<LocalForumStore>>(window.localStorage.getItem(STORAGE_KEY), {});
  return {
    categories:
      Array.isArray(parsed.categories) && parsed.categories.length
        ? parsed.categories
        : DEFAULT_FORUM_CATEGORIES,
    threads: Array.isArray(parsed.threads) ? parsed.threads : [],
    posts: Array.isArray(parsed.posts) ? parsed.posts : [],
    supports: Array.isArray(parsed.supports) ? parsed.supports : [],
  };
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
  posts: ForumPost[]
): ForumCategorySummary[] {
  return categories.map((category) => {
    const categoryThreads = threads.filter((thread) => thread.category_id === category.id);
    const latestThread = [...categoryThreads].sort((a, b) =>
      safe(b.updated_at || b.created_at).localeCompare(safe(a.updated_at || a.created_at))
    )[0];

    const latestReply = latestThread
      ? [...posts]
          .filter((post) => post.thread_id === latestThread.id)
          .sort((a, b) => safe(b.updated_at || b.created_at).localeCompare(safe(a.updated_at || a.created_at)))[0]
      : null;

    const latestText = latestReply
      ? `Latest reply ${relativeTime(latestReply.updated_at || latestReply.created_at)}`
      : latestThread
      ? `${latestThread.title} · ${relativeTime(latestThread.updated_at || latestThread.created_at)}`
      : "No discussions yet";

    return {
      ...category,
      threadCount: categoryThreads.length,
      latestActivityText: latestText,
    };
  });
}

function buildThreadSummaries(
  threads: ForumThread[],
  posts: ForumPost[],
  supports: ForumThreadSupport[],
  viewerId: string | null
): ForumThreadSummary[] {
  return [...threads]
    .sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
      return safe(b.updated_at || b.created_at).localeCompare(safe(a.updated_at || a.created_at));
    })
    .map((thread) => {
      const replies = posts.filter((post) => post.thread_id === thread.id);
      const threadSupports = supports.filter((support) => support.thread_id === thread.id);
      const latest = replies.length
        ? [...replies].sort((a, b) => safe(b.updated_at || b.created_at).localeCompare(safe(a.updated_at || a.created_at)))[0]
        : null;

      return {
        ...thread,
        authorLabel: memberLabel(thread.user_id, viewerId),
        replyCount: replies.length,
        latestActivityText: latest
          ? `Latest reply ${relativeTime(latest.updated_at || latest.created_at)}`
          : `Started ${relativeTime(thread.created_at)}`,
        supportCount: threadSupports.length,
        viewerSupports: threadSupports.some((support) => support.user_id === viewerId),
      };
    });
}

export async function loadCommunityHomeData(viewerId: string | null) {
  const local = readLocalForum();

  try {
    const categoriesResp = await supabase
      .from("forum_categories")
      .select("id,slug,name,description,created_at")
      .order("created_at", { ascending: true });

    if (categoriesResp.error) {
      if (!isMissingRelationOrColumn(categoriesResp.error)) throw categoriesResp.error;
      return {
        categories: buildCategorySummaries(local.categories, local.threads, local.posts),
        source: "local" as const,
      };
    }

    const categories = ((categoriesResp.data ?? []) as ForumCategory[]) || [];
    if (!categories.length) {
      return {
        categories: buildCategorySummaries(local.categories, local.threads, local.posts),
        source: "local" as const,
      };
    }

    const threadsResp = await supabase
      .from("forum_threads")
      .select("id,category_id,user_id,title,body,is_pinned,status,created_at,updated_at")
      .order("is_pinned", { ascending: false })
      .order("updated_at", { ascending: false });

    if (threadsResp.error) {
      if (!isMissingRelationOrColumn(threadsResp.error)) throw threadsResp.error;
      return {
        categories: buildCategorySummaries(local.categories, local.threads, local.posts),
        source: "local" as const,
      };
    }

    const postsResp = await supabase
      .from("forum_posts")
      .select("id,thread_id,user_id,body,created_at,updated_at")
      .order("created_at", { ascending: true });

    if (postsResp.error) {
      if (!isMissingRelationOrColumn(postsResp.error)) throw postsResp.error;
      return {
        categories: buildCategorySummaries(local.categories, local.threads, local.posts),
        source: "local" as const,
      };
    }

    void viewerId;
    return {
      categories: buildCategorySummaries(
        categories,
        ((threadsResp.data ?? []) as ForumThread[]) || [],
        ((postsResp.data ?? []) as ForumPost[]) || []
      ),
      source: "database" as const,
    };
  } catch {
    return {
      categories: buildCategorySummaries(local.categories, local.threads, local.posts),
      source: "local" as const,
    };
  }
}

export async function loadCategoryPageData(slug: string, viewerId: string | null) {
  const local = readLocalForum();
  const localCategory = local.categories.find((category) => category.slug === slug) || null;

  try {
    const categoriesResp = await supabase
      .from("forum_categories")
      .select("id,slug,name,description,created_at")
      .eq("slug", slug)
      .limit(1);

    if (categoriesResp.error) {
      if (!isMissingRelationOrColumn(categoriesResp.error)) throw categoriesResp.error;
      return localCategory
        ? {
            category: localCategory,
            threads: buildThreadSummaries(
              local.threads.filter((thread) => thread.category_id === localCategory.id),
              local.posts,
              local.supports,
              viewerId
            ),
            source: "local" as const,
          }
        : { category: null, threads: [], source: "local" as const };
    }

    const category = (((categoriesResp.data ?? []) as ForumCategory[]) || [])[0] || null;
    if (!category) {
      return localCategory
        ? {
            category: localCategory,
            threads: buildThreadSummaries(
              local.threads.filter((thread) => thread.category_id === localCategory.id),
              local.posts,
              local.supports,
              viewerId
            ),
            source: "local" as const,
          }
        : { category: null, threads: [], source: "local" as const };
    }

    const threadsResp = await supabase
      .from("forum_threads")
      .select("id,category_id,user_id,title,body,is_pinned,status,created_at,updated_at")
      .eq("category_id", category.id)
      .order("is_pinned", { ascending: false })
      .order("updated_at", { ascending: false });

    if (threadsResp.error) {
      if (!isMissingRelationOrColumn(threadsResp.error)) throw threadsResp.error;
      return localCategory
        ? {
            category: localCategory,
            threads: buildThreadSummaries(
              local.threads.filter((thread) => thread.category_id === localCategory.id),
              local.posts,
              local.supports,
              viewerId
            ),
            source: "local" as const,
          }
        : { category, threads: [], source: "database" as const };
    }

    const threads = ((threadsResp.data ?? []) as ForumThread[]) || [];
    const threadIds = threads.map((thread) => thread.id);

    let posts: ForumPost[] = [];
    let supports: ForumThreadSupport[] = [];

    if (threadIds.length) {
      const postsResp = await supabase
        .from("forum_posts")
        .select("id,thread_id,user_id,body,created_at,updated_at")
        .in("thread_id", threadIds)
        .order("created_at", { ascending: true });

      if (postsResp.error && !isMissingRelationOrColumn(postsResp.error)) {
        throw postsResp.error;
      }
      posts = ((postsResp.data ?? []) as ForumPost[]) || [];

      const supportsResp = await supabase
        .from("forum_thread_support")
        .select("id,thread_id,user_id,created_at")
        .in("thread_id", threadIds);

      if (supportsResp.error && !isMissingRelationOrColumn(supportsResp.error)) {
        throw supportsResp.error;
      }
      supports = ((supportsResp.data ?? []) as ForumThreadSupport[]) || [];
    }

    return {
      category,
      threads: buildThreadSummaries(threads, posts, supports, viewerId),
      source: "database" as const,
    };
  } catch {
    return localCategory
      ? {
          category: localCategory,
          threads: buildThreadSummaries(
            local.threads.filter((thread) => thread.category_id === localCategory.id),
            local.posts,
            local.supports,
            viewerId
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
      .from("forum_threads")
      .select("id,category_id,user_id,title,body,is_pinned,status,created_at,updated_at")
      .eq("id", id)
      .limit(1);

    if (threadResp.error) {
      if (!isMissingRelationOrColumn(threadResp.error)) throw threadResp.error;
      return localThread
        ? {
            thread: {
              ...localThread,
              authorLabel: memberLabel(localThread.user_id, viewerId),
              supportCount: local.supports.filter((support) => support.thread_id === localThread.id).length,
              viewerSupports: local.supports.some(
                (support) => support.thread_id === localThread.id && support.user_id === viewerId
              ),
            },
            replies: local.posts
              .filter((post) => post.thread_id === localThread.id)
              .sort((a, b) => safe(a.created_at).localeCompare(safe(b.created_at)))
              .map((post) => ({
                ...post,
                authorLabel: memberLabel(post.user_id, viewerId),
              })),
            category:
              local.categories.find((category) => category.id === localThread.category_id) || null,
            source: "local" as const,
          }
        : { thread: null, replies: [], category: null, source: "local" as const };
    }

    const thread = (((threadResp.data ?? []) as ForumThread[]) || [])[0] || null;
    if (!thread) {
      return localThread
        ? {
            thread: {
              ...localThread,
              authorLabel: memberLabel(localThread.user_id, viewerId),
              supportCount: local.supports.filter((support) => support.thread_id === localThread.id).length,
              viewerSupports: local.supports.some(
                (support) => support.thread_id === localThread.id && support.user_id === viewerId
              ),
            },
            replies: local.posts
              .filter((post) => post.thread_id === localThread.id)
              .sort((a, b) => safe(a.created_at).localeCompare(safe(b.created_at)))
              .map((post) => ({
                ...post,
                authorLabel: memberLabel(post.user_id, viewerId),
              })),
            category:
              local.categories.find((category) => category.id === localThread.category_id) || null,
            source: "local" as const,
          }
        : { thread: null, replies: [], category: null, source: "local" as const };
    }

    const categoryResp = await supabase
      .from("forum_categories")
      .select("id,slug,name,description,created_at")
      .eq("id", thread.category_id)
      .limit(1);

    if (categoryResp.error && !isMissingRelationOrColumn(categoryResp.error)) {
      throw categoryResp.error;
    }

    const postsResp = await supabase
      .from("forum_posts")
      .select("id,thread_id,user_id,body,created_at,updated_at")
      .eq("thread_id", thread.id)
      .order("created_at", { ascending: true });

    if (postsResp.error && !isMissingRelationOrColumn(postsResp.error)) {
      throw postsResp.error;
    }

    const supportResp = await supabase
      .from("forum_thread_support")
      .select("id,thread_id,user_id,created_at")
      .eq("thread_id", thread.id);

    if (supportResp.error && !isMissingRelationOrColumn(supportResp.error)) {
      throw supportResp.error;
    }

    const supports = ((supportResp.data ?? []) as ForumThreadSupport[]) || [];

    return {
      thread: {
        ...thread,
        authorLabel: memberLabel(thread.user_id, viewerId),
        supportCount: supports.length,
        viewerSupports: supports.some((support) => support.user_id === viewerId),
      },
      replies: (((postsResp.data ?? []) as ForumPost[]) || []).map((post) => ({
        ...post,
        authorLabel: memberLabel(post.user_id, viewerId),
      })),
      category: ((((categoryResp.data ?? []) as ForumCategory[]) || [])[0] || null),
      source: "database" as const,
    };
  } catch {
    return localThread
      ? {
          thread: {
            ...localThread,
            authorLabel: memberLabel(localThread.user_id, viewerId),
            supportCount: local.supports.filter((support) => support.thread_id === localThread.id).length,
            viewerSupports: local.supports.some(
              (support) => support.thread_id === localThread.id && support.user_id === viewerId
            ),
          },
          replies: local.posts
            .filter((post) => post.thread_id === localThread.id)
            .sort((a, b) => safe(a.created_at).localeCompare(safe(b.created_at)))
            .map((post) => ({
              ...post,
              authorLabel: memberLabel(post.user_id, viewerId),
            })),
          category:
            local.categories.find((category) => category.id === localThread.category_id) || null,
          source: "local" as const,
        }
      : { thread: null, replies: [], category: null, source: "local" as const };
  }
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
    is_pinned: false,
    status: null,
  };

  try {
    const resp = await supabase
      .from("forum_threads")
      .insert(payload)
      .select("id,category_id,user_id,title,body,is_pinned,status,created_at,updated_at")
      .single();

    if (resp.error) {
      if (!isMissingRelationOrColumn(resp.error)) throw resp.error;
      throw resp.error;
    }

    return { thread: resp.data as ForumThread, source: "database" as const };
  } catch {
    const local = readLocalForum();
    const nextThread: ForumThread = {
      id: `local-thread-${Date.now()}`,
      category_id: input.category.id,
      user_id: input.viewerId,
      title: safe(input.title),
      body: safe(input.body),
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
  };

  try {
    const postResp = await supabase
      .from("forum_posts")
      .insert(payload)
      .select("id,thread_id,user_id,body,created_at,updated_at")
      .single();

    if (postResp.error) {
      if (!isMissingRelationOrColumn(postResp.error)) throw postResp.error;
      throw postResp.error;
    }

    await supabase
      .from("forum_threads")
      .update({ updated_at: nowIso() })
      .eq("id", input.threadId);

    return { post: postResp.data as ForumPost, source: "database" as const };
  } catch {
    const local = readLocalForum();
    const nextPost: ForumPost = {
      id: `local-post-${Date.now()}`,
      thread_id: input.threadId,
      user_id: input.viewerId,
      body: safe(input.body),
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    writeLocalForum({
      ...local,
      posts: [...local.posts, nextPost],
      threads: local.threads.map((thread) =>
        thread.id === input.threadId
          ? { ...thread, updated_at: nextPost.updated_at }
          : thread
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
      .from("forum_thread_support")
      .select("id")
      .eq("thread_id", input.threadId)
      .eq("user_id", input.viewerId)
      .limit(1);

    if (existingResp.error && !isMissingRelationOrColumn(existingResp.error)) {
      throw existingResp.error;
    }

    const existing = (existingResp.data ?? [])[0];
    if (existing) {
      return { alreadySupported: true, source: "database" as const };
    }

    const insertResp = await supabase
      .from("forum_thread_support")
      .insert({
        thread_id: input.threadId,
        user_id: input.viewerId,
      })
      .select("id,thread_id,user_id,created_at")
      .single();

    if (insertResp.error) {
      if (!isMissingRelationOrColumn(insertResp.error)) throw insertResp.error;
      throw insertResp.error;
    }

    return {
      support: insertResp.data as ForumThreadSupport,
      alreadySupported: false,
      source: "database" as const,
    };
  } catch {
    const local = readLocalForum();
    const existing = local.supports.find(
      (support) => support.thread_id === input.threadId && support.user_id === input.viewerId
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
