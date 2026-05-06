export type CleanEvidenceEntry = {
  id: string;
  familyId: string;
  learnerId: string;
  programId: string | null;
  calendarItemId: string | null;
  observedOn: string;
  title: string | null;
  whatHappened: string;
  reflection: string | null;
  learningArea: string | null;
  curriculumNodeIds: string[];
  includeInPortfolio: boolean;
  includeInReport: boolean;
  createdByUserId: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type CleanEvidenceEntryInput = {
  learnerId: string;
  observedOn: string;
  title?: string | null;
  whatHappened: string;
  reflection?: string | null;
  learningArea?: string | null;
  programId?: string | null;
  calendarItemId?: string | null;
  curriculumNodeIds?: string[];
  includeInPortfolio?: boolean;
  includeInReport?: boolean;
};

export type CleanEvidenceEntryUpdate = Partial<CleanEvidenceEntryInput>;

export type CleanEvidenceEntriesOptions = {
  learnerId?: string | null;
  programId?: string | null;
  calendarItemId?: string | null;
  fromDate?: string | null;
  toDate?: string | null;
  limit?: number;
};
