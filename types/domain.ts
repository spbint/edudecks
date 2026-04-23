// Phase 1 domain models aligned to the trimmed migration schema.

// Shared

export type UUID = string;

// Enums / string unions

export type SubscriptionTier = "free" | "pro" | "premium" | "enterprise";

export type FamilyRole = "owner" | "editor" | "viewer" | "tutor";

export type ReportingMode =
  | "family-summary"
  | "progress-review"
  | "authority-ready";

export type AcademicStructureType = "term" | "semester" | "quarter" | "custom";

export type CurriculumMode =
  | "national"
  | "state"
  | "common-core"
  | "custom"
  | "hybrid";

export type DisplayLanguage = "en" | "es" | "af";

export type LocaleCode = "en-AU" | "en-GB" | "en-US" | "es" | "af";

export type PlanType =
  | "yearly"
  | "term"
  | "unit"
  | "weekly"
  | "project"
  | "theme";

export type ApproachMode =
  | "subject"
  | "theme"
  | "project"
  | "activity"
  | "hybrid";

export type PlanStatus = "draft" | "active" | "archived" | "completed";

export type LearningAreaCode =
  | "english"
  | "mathematics"
  | "science"
  | "hass"
  | "arts"
  | "hpe"
  | "technologies"
  | "languages";

export type LearningMode =
  | "lesson"
  | "activity"
  | "project_work"
  | "excursion"
  | "discussion"
  | "reading"
  | "practical_life"
  | "free_play"
  | "assessment"
  | "routine";

export type DeliveryContext =
  | "home"
  | "community"
  | "outdoors"
  | "online"
  | "co_op"
  | "tutor";

export type RecordStatus = "active" | "archived";

export type TagType =
  | "learning_area"
  | "skill"
  | "theme"
  | "wellbeing"
  | "subject"
  | "custom";

export type EvidenceType =
  | "photo"
  | "video"
  | "audio"
  | "document"
  | "work_sample"
  | "observation_note"
  | "journal"
  | "assessment_result"
  | "certificate";

export type ReportStrength = "useful" | "strong" | "highlight";

// Family / workspace

export interface Family {
  id: UUID;
  ownerUserId: UUID;
  name: string;
  slug?: string | null;
  subscriptionTier: SubscriptionTier;
  storageBytesUsed: number;
  storageBytesLimit: number;
  createdAt: string;
  updatedAt: string;
}

export interface FamilyMember {
  id: UUID;
  familyId: UUID;
  userId: UUID;
  role: FamilyRole;
  displayName?: string | null;
  createdAt: string;
}

export interface FamilySettings {
  id: UUID;
  familyId: UUID;
  countryCode: string;
  stateCode: string;
  districtCode?: string | null;
  reportingMode: ReportingMode;
  academicStructureType: AcademicStructureType;
  cycleCount?: number | null;
  weeksPerCycle?: number | null;
  curriculumMode: CurriculumMode;
  timezone: string;
  displayLanguage: DisplayLanguage;
  locale: LocaleCode;
  reportLocale: LocaleCode;
  createdAt: string;
  updatedAt: string;
}

// Learners

export interface Learner {
  id: UUID;
  familyId: UUID;
  firstName: string;
  lastName?: string | null;
  preferredName?: string | null;
  dob?: string | null;
  yearLevel?: string | null;
  profilePhotoUrl?: string | null;
  strengths?: string | null;
  interests?: string | null;
  supportNeeds?: string | null;
  learningPreferences?: string | null;
  longTermGoals?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LearnerSettings {
  id: UUID;
  learnerId: UUID;
  reportingModeOverride?: ReportingMode | null;
  jurisdictionOverrideCountry?: string | null;
  jurisdictionOverrideState?: string | null;
  localeOverride?: LocaleCode | null;
  reportLocaleOverride?: LocaleCode | null;
  customNotes?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Plans

export interface LearningPlan {
  id: UUID;
  learnerId: UUID;
  title: string;
  description?: string | null;
  planType: PlanType;
  approachMode: ApproachMode;
  dateStart: string;
  dateEnd: string;
  status: PlanStatus;
  goals?: string | null;
  resources?: string | null;
  theme?: string | null;
  createdBy?: UUID | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlanLearningArea {
  id: UUID;
  planId: UUID;
  learningAreaCode: LearningAreaCode;
  createdAt: string;
}

export interface PlanGoal {
  id: UUID;
  planId: UUID;
  goalText: string;
  sortOrder: number;
  createdAt: string;
}

// Learning

export interface LearningExperience {
  id: UUID;
  learnerId: UUID;
  planId?: UUID | null;
  title: string;
  description: string;
  experienceDate: string;
  durationMinutes?: number | null;
  learningMode: LearningMode;
  deliveryContext?: DeliveryContext | null;
  parentObservation?: string | null;
  learnerReflection?: string | null;
  progressNote?: string | null;
  status: RecordStatus;
  createdBy?: UUID | null;
  createdAt: string;
  updatedAt: string;
}

export interface LearningExperienceTag {
  id: UUID;
  experienceId: UUID;
  tagType: TagType;
  tagValue: string;
  createdAt: string;
}

// Evidence

export interface EvidenceItem {
  id: UUID;
  learnerId: UUID;
  experienceId?: UUID | null;
  planId?: UUID | null;
  title: string;
  evidenceType: EvidenceType;
  storagePath?: string | null;
  fileUrl?: string | null;
  mimeType?: string | null;
  fileSizeBytes?: number | null;
  annotation?: string | null;
  transcript?: string | null;
  reportStrength: ReportStrength;
  capturedAt: string;
  createdBy?: UUID | null;
  createdAt: string;
  updatedAt: string;
}

export interface EvidenceTag {
  id: UUID;
  evidenceId: UUID;
  tagType: TagType;
  tagValue: string;
  createdAt: string;
}

// Storage

export interface StorageUsageEvent {
  id: UUID;
  familyId: UUID;
  evidenceId?: UUID | null;
  bytesDelta: number;
  eventType: "upload" | "delete" | "replace";
  createdAt: string;
}
