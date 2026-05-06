export type CleanAcademicYear = {
  id: string;
  familyId: string;
  title: string;
  countryCode: string | null;
  jurisdictionCode: string | null;
  startsOn: string;
  endsOn: string;
  weekStart: "monday" | "sunday";
  notes: string | null;
  createdByUserId: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type CleanAcademicYearInput = {
  title: string;
  startsOn: string;
  endsOn: string;
  countryCode?: string | null;
  jurisdictionCode?: string | null;
  weekStart?: "monday" | "sunday";
  notes?: string | null;
};

export type CleanAcademicYearUpdate = Partial<CleanAcademicYearInput>;

export type CleanAcademicYearsOptions = {
  limit?: number;
};

export type CleanLearningPeriodType =
  | "term"
  | "semester"
  | "unit"
  | "break"
  | "custom";

export type CleanLearningPeriod = {
  id: string;
  familyId: string;
  academicYearId: string;
  title: string;
  periodType: CleanLearningPeriodType;
  startsOn: string;
  endsOn: string;
  isBreak: boolean;
  notes: string | null;
  createdByUserId: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type CleanLearningPeriodInput = {
  academicYearId: string;
  title: string;
  periodType?: CleanLearningPeriodType;
  startsOn: string;
  endsOn: string;
  isBreak?: boolean;
  notes?: string | null;
};

export type CleanLearningPeriodUpdate = Partial<CleanLearningPeriodInput>;

export type CleanLearningPeriodsOptions = {
  academicYearId?: string | null;
  fromDate?: string | null;
  toDate?: string | null;
  limit?: number;
};

export type CleanBlackoutDay = {
  id: string;
  familyId: string;
  academicYearId: string | null;
  learningPeriodId: string | null;
  title: string;
  startsOn: string;
  endsOn: string;
  reason: string | null;
  isLearningBlocked: boolean;
  createdByUserId: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type CleanBlackoutDayInput = {
  title: string;
  startsOn: string;
  endsOn: string;
  academicYearId?: string | null;
  learningPeriodId?: string | null;
  reason?: string | null;
  isLearningBlocked?: boolean;
};

export type CleanBlackoutDayUpdate = Partial<CleanBlackoutDayInput>;

export type CleanBlackoutDaysOptions = {
  academicYearId?: string | null;
  learningPeriodId?: string | null;
  fromDate?: string | null;
  toDate?: string | null;
  limit?: number;
};
