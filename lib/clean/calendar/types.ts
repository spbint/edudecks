export type CleanCalendarItem = {
  id: string;
  familyId: string;
  learnerId: string | null;
  programId: string | null;
  title: string;
  description: string | null;
  startsAt: string | null;
  endsAt: string | null;
  plannedDate: string;
  isHighlighted: boolean;
  createdByUserId: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type CleanCalendarItemInput = {
  title: string;
  plannedDate: string;
  learnerId?: string | null;
  programId?: string | null;
  description?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  isHighlighted?: boolean;
};

export type CleanCalendarItemUpdate = Partial<CleanCalendarItemInput>;

export type CleanCalendarItemsOptions = {
  fromDate?: string | null;
  toDate?: string | null;
  learnerId?: string | null;
  limit?: number;
};
