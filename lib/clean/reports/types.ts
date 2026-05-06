export type CleanReportingPeriod = {
  id: string;
  familyId: string;
  learnerId: string;
  title: string;
  startsOn: string;
  endsOn: string;
  createdByUserId: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type CleanReportingPeriodInput = {
  learnerId: string;
  title: string;
  startsOn: string;
  endsOn: string;
};

export type CleanReportingPeriodUpdate = Partial<CleanReportingPeriodInput>;

export type CleanReportingPeriodsOptions = {
  learnerId?: string | null;
  limit?: number;
};

export type CleanReportStatus = "draft" | "ready" | "archived";

export type CleanReport = {
  id: string;
  familyId: string;
  learnerId: string;
  reportingPeriodId: string;
  title: string;
  status: CleanReportStatus;
  createdByUserId: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type CleanReportInput = {
  learnerId: string;
  reportingPeriodId: string;
  title: string;
  status?: CleanReportStatus;
};

export type CleanReportUpdate = Partial<CleanReportInput>;

export type CleanReportsOptions = {
  learnerId?: string | null;
  reportingPeriodId?: string | null;
  limit?: number;
};

export type CleanReportSection = {
  id: string;
  reportId: string;
  familyId: string;
  learnerId: string;
  sectionKey: string;
  heading: string;
  content: string;
  sortOrder: number;
  createdByUserId: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type CleanReportSectionInput = {
  reportId: string;
  learnerId: string;
  sectionKey: string;
  heading: string;
  content: string;
  sortOrder?: number;
};

export type CleanReportSectionsOptions = {
  learnerId?: string | null;
};
