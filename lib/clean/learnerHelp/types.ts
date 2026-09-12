export type LearnerHelpSourceType = "calendar_item" | "on_deck_item";

export type LearnerHelpRequest = {
  id: string;
  familyId: string;
  learnerId: string;
  sourceType: LearnerHelpSourceType;
  sourceId: string;
  requestedAt: string;
  clearedAt: string | null;
  createdByUserId: string;
  clearedByUserId: string | null;
  createdAt: string;
  updatedAt: string;
};
