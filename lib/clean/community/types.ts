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

export type CommunityThreadsOptions = {
  category?: CommunityCategory | null;
  limit?: number;
};
