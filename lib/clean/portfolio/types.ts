import type { CleanEvidenceEntry } from "@/lib/clean/evidence/types";

export type CleanPortfolioHighlightsOptions = {
  learnerId?: string | null;
  evidenceEntryId?: string | null;
  limit?: number;
};

export type CleanPortfolioItemsOptions = {
  learnerId?: string | null;
  fromDate?: string | null;
  toDate?: string | null;
  highlightedOnly?: boolean;
  limit?: number;
};

export type CleanPortfolioHighlight = {
  id: string;
  familyId: string;
  learnerId: string;
  evidenceEntryId: string | null;
  calendarItemId: string | null;
  note: string | null;
  createdByUserId: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type CleanPortfolioHighlightInput = {
  learnerId: string;
  evidenceEntryId?: string | null;
  calendarItemId?: string | null;
  note?: string | null;
};

export type CleanPortfolioHighlightUpdate = Partial<CleanPortfolioHighlightInput>;

export type CleanPortfolioItem = {
  evidence: CleanEvidenceEntry;
  highlight: CleanPortfolioHighlight | null;
  isHighlighted: boolean;
};
