export type CleanMasterTemplateScopeType = "family" | "learner";

export type CleanMasterTemplate = {
  id: string;
  familyId: string;
  learnerId: string | null;
  title: string;
  description: string | null;
  scopeType: CleanMasterTemplateScopeType;
  isActive: boolean;
  createdByUserId: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type CleanMasterTemplateInput = {
  title: string;
  learnerId?: string | null;
  description?: string | null;
  scopeType?: CleanMasterTemplateScopeType;
  isActive?: boolean;
};

export type CleanMasterTemplateUpdate = Partial<CleanMasterTemplateInput>;

export type CleanMasterTemplatesOptions = {
  learnerId?: string | null;
  isActive?: boolean | null;
  limit?: number;
};

export type CleanTemplateBlock = {
  id: string;
  familyId: string;
  masterTemplateId: string;
  learnerId: string | null;
  weekday: number;
  title: string;
  learningArea: string | null;
  startsAt: string | null;
  endsAt: string | null;
  programId: string | null;
  programSegmentId: string | null;
  learnerProgramAssignmentId?: string | null;
  notes: string | null;
  sessionLabel: string | null;
  createdByUserId: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type CleanTemplateBlockInput = {
  learnerId?: string | null;
  weekday: number;
  title: string;
  learningArea?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  programId?: string | null;
  programSegmentId?: string | null;
  learnerProgramAssignmentId?: string | null;
  notes?: string | null;
  sessionLabel?: string | null;
};

export type CleanTemplateBlockUpdate = Partial<CleanTemplateBlockInput>;

export type CleanTemplateBlocksOptions = {
  learnerId?: string | null;
  weekday?: number | null;
};
