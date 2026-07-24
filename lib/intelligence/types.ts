export type IntelligenceId = string;

export type IdeaStatus = "active" | "archived";

export type IdeaSourceType = "url" | "manual";
export type IdeaSourceMetadataStatus = "pending" | "ready" | "failed";

export type PlanStatus = "draft" | "saved" | "archived";
export type PlanKind = "lesson" | "unit";

export interface Idea {
  id: IntelligenceId;
  userId: IntelligenceId;
  title: string;
  description: string;
  tags: string[];
  status: IdeaStatus;
  sources: IdeaSource[];
  createdAt: string;
  updatedAt: string;
}

export interface IdeaSource {
  id: IntelligenceId;
  ideaId: IntelligenceId;
  userId: IntelligenceId;
  sourceType: IdeaSourceType;
  url: string;
  canonicalUrl: string;
  provider: string | null;
  title: string | null;
  description: string | null;
  siteName: string | null;
  imageUrl: string | null;
  author: string | null;
  publishedAt: string | null;
  metadataStatus: IdeaSourceMetadataStatus;
  metadata: Record<string, unknown>;
  extractedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlanSourceProvenance {
  sourceId: IntelligenceId | null;
  sourceUrl: string;
  sourceTitle: string | null;
  sourceProvider: string | null;
  extractedAt: string | null;
}

export interface GenerationProvenance {
  model: string;
  modelVersion: string;
  promptVersion: string;
  schemaVersion: string;
  generatedAt: string;
}

export interface ParentEdit {
  version: number;
  editedAt: string;
  editedByUserId: IntelligenceId;
  fields: string[];
  summary?: string | null;
}

export interface PlanProvenance {
  sources: PlanSourceProvenance[];
  generation: GenerationProvenance;
  parentEdits: ParentEdit[];
  finalApprovedVersion: number | null;
  finalApprovedAt: string | null;
  finalApprovedByUserId: IntelligenceId | null;
}

export interface LessonPlan {
  id: IntelligenceId;
  userId: IntelligenceId;
  ideaId: IntelligenceId | null;
  title: string;
  summary: string;
  learningArea: string | null;
  yearLevel: string | null;
  objectives: string[];
  durationMinutes: number | null;
  sourceIds: IntelligenceId[];
  sequence: LessonSequence[];
  resources: ResourceRequirement[];
  status: PlanStatus;
  version: number;
  provenance: PlanProvenance;
  content: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface UnitPlan {
  id: IntelligenceId;
  userId: IntelligenceId;
  ideaId: IntelligenceId | null;
  title: string;
  summary: string;
  learningArea: string | null;
  yearLevel: string | null;
  objectives: string[];
  durationCount: number | null;
  durationUnit: "lessons" | "weeks" | "sessions" | null;
  sourceIds: IntelligenceId[];
  sequence: LessonSequence[];
  resources: ResourceRequirement[];
  status: PlanStatus;
  version: number;
  provenance: PlanProvenance;
  content: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface LessonSequence {
  id: IntelligenceId;
  lessonPlanId: IntelligenceId | null;
  unitPlanId: IntelligenceId | null;
  sequenceOrder: number;
  title: string;
  objective: string;
  activity: string;
  durationMinutes: number | null;
  notes: string;
  content: Record<string, unknown>;
}

export interface ResourceRequirement {
  id: IntelligenceId;
  lessonPlanId: IntelligenceId | null;
  unitPlanId: IntelligenceId | null;
  sequenceId: IntelligenceId | null;
  name: string;
  category: string | null;
  quantity: string | null;
  required: boolean;
  url: string | null;
  notes: string;
}
