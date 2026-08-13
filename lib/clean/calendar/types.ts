export type CleanCalendarItemSourceType = "manual" | "generated" | "template";

export type CleanCalendarItem = {
  id: string;
  familyId: string;
  learnerId: string | null;
  programId: string | null;
  programSegmentId: string | null;
  title: string;
  description: string | null;
  startsAt: string | null;
  endsAt: string | null;
  plannedDate: string;
  learningArea: string | null;
  sessionLabel: string | null;
  sourceType: CleanCalendarItemSourceType;
  sourceTemplateBlockId: string | null;
  sourceProgramSegmentId: string | null;
  generationRunId: string | null;
  isHighlighted: boolean;
  marketplaceResourceId: string | null;
  completedAt: string | null;
  createdByUserId: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type CleanCalendarItemInput = {
  title: string;
  plannedDate: string;
  learnerId?: string | null;
  programId?: string | null;
  programSegmentId?: string | null;
  description?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  learningArea?: string | null;
  sessionLabel?: string | null;
  sourceType?: CleanCalendarItemSourceType;
  sourceTemplateBlockId?: string | null;
  sourceProgramSegmentId?: string | null;
  generationRunId?: string | null;
  isHighlighted?: boolean;
};

export type CleanCalendarItemUpdate = Partial<CleanCalendarItemInput> & {
  completedAt?: string | null;
};

export type CleanCalendarItemsOptions = {
  fromDate?: string | null;
  toDate?: string | null;
  learnerId?: string | null;
  limit?: number;
};
