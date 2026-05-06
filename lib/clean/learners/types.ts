export type Learner = {
  id: string;
  familyId: string;
  firstName: string;
  preferredName: string | null;
  surname: string | null;
  yearLevel: string | null;
  notes: string | null;
  createdByUserId: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type CreateCleanLearnerInput = {
  firstName: string;
  preferredName?: string | null;
  surname?: string | null;
  yearLevel?: string | null;
  notes?: string | null;
};

export type UpdateCleanLearnerInput = Partial<CreateCleanLearnerInput>;
