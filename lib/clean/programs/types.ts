export type CleanProgramStatus = "draft" | "active" | "archived";

export type CleanProgram = {
  id: string;
  familyId: string;
  learnerId: string | null;
  title: string;
  description: string | null;
  learningArea: string | null;
  curriculumNodeIds: string[];
  status: CleanProgramStatus;
  createdByUserId: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type CleanProgramInput = {
  title: string;
  learnerId?: string | null;
  description?: string | null;
  learningArea?: string | null;
  curriculumNodeIds?: string[];
  status?: CleanProgramStatus;
};

export type CleanProgramUpdate = Partial<CleanProgramInput>;

export type CleanProgramsOptions = {
  learnerId?: string | null;
  status?: CleanProgramStatus | null;
  limit?: number;
};

export type CleanProgramSegment = {
  id: string;
  familyId: string;
  programId: string;
  learnerId: string | null;
  title: string;
  notes: string | null;
  segmentOrder: number;
  startsOn: string | null;
  endsOn: string | null;
  createdByUserId: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type CleanProgramSegmentInput = {
  title: string;
  learnerId?: string | null;
  notes?: string | null;
  segmentOrder?: number;
  startsOn?: string | null;
  endsOn?: string | null;
};

export type CleanProgramSegmentUpdate = Partial<CleanProgramSegmentInput>;

export type CleanProgramLesson = {
  id: string;
  familyId: string;
  programId: string;
  position: number;
  title: string;
  instructions: string | null;
  estimatedDurationMinutes: number | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type CleanProgramLessonInput = {
  title: string;
  instructions?: string | null;
  estimatedDurationMinutes?: number | null;
};

export type CleanProgramLessonUpdate = Partial<CleanProgramLessonInput>;

export type LearnerProgramAssignment = {
  id: string;
  familyId: string;
  programId: string;
  learnerId: string;
  createdAt: string | null;
  updatedAt: string | null;
};
