export type FamilyMemberRole = "owner" | "parent" | "caregiver";

export type FamilyProfile = {
  id: string;
  createdByUserId: string;
  displayName: string;
  countryCode: string | null;
  jurisdictionCode: string | null;
  curriculumFrameworkId: string | null;
  reportingMode: string;
  weekStart: string;
  privacyDefault: string;
  exportStyle: string;
  defaultLearnerId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type FamilyMember = {
  id: string;
  familyId: string;
  userId: string;
  role: FamilyMemberRole;
  createdByUserId: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type CreateCleanFamilyProfileInput = {
  displayName: string;
  countryCode?: string | null;
  jurisdictionCode?: string | null;
  curriculumFrameworkId?: string | null;
  reportingMode?: string | null;
  weekStart?: string | null;
  privacyDefault?: string | null;
  exportStyle?: string | null;
};

export type UpdateCleanFamilyProfileInput = Partial<CreateCleanFamilyProfileInput> & {
  defaultLearnerId?: string | null;
};

export type LoadCleanFamilyProfileResult = {
  currentUserId: string | null;
  profile: FamilyProfile | null;
  membership: FamilyMember | null;
  members: FamilyMember[];
};
