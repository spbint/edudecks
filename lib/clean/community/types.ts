export const COMMUNITY_CATEGORIES = [
  "general",
  "resources",
  "curriculum",
  "reporting",
  "state-country",
  "mylearna-suggestions",
] as const;

export type CommunityCategory = (typeof COMMUNITY_CATEGORIES)[number];

export const COMMUNITY_CATEGORY_LABELS: Record<CommunityCategory, string> = {
  general: "General discussion",
  resources: "Resources",
  curriculum: "Curriculum ideas",
  reporting: "Reporting and records",
  "state-country": "State/country questions",
  "mylearna-suggestions": "MyLearna suggestions",
};

export type CommunityThreadStatus = "open" | "hidden" | "locked";

export type CommunityPostStatus = "open" | "hidden";

export type CommunityReportStatus = "open" | "reviewed" | "dismissed" | "actioned";

export type CommunityReportTargetType = "thread" | "post";

export type CommunityReactionTargetType = "thread" | "post";

export const COMMUNITY_REACTION_TYPES = ["like", "helpful", "thanks"] as const;

export type CommunityReactionType = (typeof COMMUNITY_REACTION_TYPES)[number];

export const COMMUNITY_REACTION_LABELS: Record<CommunityReactionType, string> = {
  like: "Like",
  helpful: "Helpful",
  thanks: "Thanks",
};

export type CommunityThread = {
  id: string;
  authorUserId: string;
  category: CommunityCategory;
  title: string;
  body: string;
  linkUrl: string | null;
  status: CommunityThreadStatus;
  createdAt: string | null;
  updatedAt: string | null;
};

export type CommunityPost = {
  id: string;
  threadId: string;
  authorUserId: string;
  body: string;
  status: CommunityPostStatus;
  createdAt: string | null;
  updatedAt: string | null;
};

export type CommunityReport = {
  id: string;
  reporterUserId: string;
  targetType: CommunityReportTargetType;
  targetId: string;
  reason: string;
  status: CommunityReportStatus;
  createdAt: string | null;
};

export type CommunityReaction = {
  id: string;
  targetType: CommunityReactionTargetType;
  targetId: string;
  reactionType: CommunityReactionType;
  userId: string;
  createdAt: string | null;
};

export type CommunityReactionCount = {
  count: number;
  reacted: boolean;
};

export type CommunityReactionCounts = Record<
  CommunityReactionType,
  CommunityReactionCount
>;

export type CommunityReactionSummary = Record<string, CommunityReactionCounts>;

export type CommunityNotificationType = "thread_reply" | "reaction";

export type CommunityNotification = {
  id: string;
  userId: string;
  type: CommunityNotificationType;
  targetType: CommunityReactionTargetType;
  targetId: string;
  actorUserId: string;
  readAt: string | null;
  createdAt: string | null;
};

export type CommunityNotificationItem = CommunityNotification & {
  actorLabel: string;
  message: string;
  threadId: string | null;
  threadTitle: string | null;
  href: string;
};

export type CommunityThreadInput = {
  category: CommunityCategory;
  title: string;
  body: string;
  linkUrl?: string | null;
};

export type CommunityPostInput = {
  body: string;
};

export type CommunityReportInput = {
  targetType: CommunityReportTargetType;
  targetId: string;
  reason: string;
};

export type CommunityReactionToggleInput = {
  targetType: CommunityReactionTargetType;
  targetId: string;
  reactionType: CommunityReactionType;
};

export type CommunityThreadsOptions = {
  category?: CommunityCategory | null;
  limit?: number;
};
