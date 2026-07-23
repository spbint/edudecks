import type { IdeaSource } from "@/lib/intelligence/types";

export type SourceExtractionStatus =
  | "fetching"
  | "ready"
  | "unsupported"
  | "blocked"
  | "timed_out"
  | "too_large"
  | "failed";

export type SourceExtractionFailureCode =
  | "malformed_url"
  | "blocked_host"
  | "blocked_by_robots"
  | "blocked_response"
  | "too_many_redirects"
  | "timed_out"
  | "too_large"
  | "unsupported_content_type"
  | "http_error"
  | "network_error"
  | "metadata_error";

export interface SourcePreviewMetadata {
  originalUrl: string;
  finalUrl: string | null;
  canonicalUrl: string | null;
  title: string | null;
  description: string | null;
  provider: string | null;
  previewImageUrl: string | null;
  faviconUrl: string | null;
  contentType: string | null;
  fetchedAt: string | null;
  extractionAttemptedAt: string;
  extractionStatus: SourceExtractionStatus;
  extractorVersion: string;
  failureCode?: SourceExtractionFailureCode;
  failureMessage?: string;
}

export interface SourceExtractionResult {
  source: IdeaSource;
  metadata: SourcePreviewMetadata;
}
