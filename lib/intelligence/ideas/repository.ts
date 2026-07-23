import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import type { Idea, IdeaSource, IdeaSourceMetadataStatus, IdeaStatus } from "@/lib/intelligence/types";

export type CreateIdeaRepositoryInput = {
  url: string;
  title: string | null;
};

export interface IdeasRepository {
  listByUser(userId: string): Promise<Idea[]>;
  createForUser(userId: string, input: CreateIdeaRepositoryInput): Promise<Idea>;
}

export type IdeasRepositoryErrorKind = "schema" | "persistence";

export class IdeasRepositoryError extends Error {
  readonly kind: IdeasRepositoryErrorKind;

  constructor(kind: IdeasRepositoryErrorKind, message: string) {
    super(message);
    this.name = "IdeasRepositoryError";
    this.kind = kind;
  }
}

type IdeaRow = {
  id?: unknown;
  user_id?: unknown;
  title?: unknown;
  description?: unknown;
  tags?: unknown;
  status?: unknown;
  created_at?: unknown;
  updated_at?: unknown;
};

type SourceRow = {
  id?: unknown;
  idea_id?: unknown;
  user_id?: unknown;
  source_type?: unknown;
  url?: unknown;
  canonical_url?: unknown;
  provider?: unknown;
  title?: unknown;
  description?: unknown;
  site_name?: unknown;
  image_url?: unknown;
  author?: unknown;
  published_at?: unknown;
  metadata_status?: unknown;
  metadata?: unknown;
  extracted_at?: unknown;
  created_at?: unknown;
  updated_at?: unknown;
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function nullableText(value: unknown) {
  return safe(value) || null;
}

function stringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => safe(entry)).filter(Boolean);
}

function record(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function normalizeIdeaStatus(value: unknown): IdeaStatus {
  return safe(value) === "archived" ? "archived" : "active";
}

function normalizeMetadataStatus(value: unknown): IdeaSourceMetadataStatus {
  const status = safe(value);
  if (status === "ready" || status === "failed") return status;
  return "pending";
}

function toIdeaSource(row: SourceRow): IdeaSource {
  return {
    id: safe(row.id),
    ideaId: safe(row.idea_id),
    userId: safe(row.user_id),
    sourceType: safe(row.source_type) === "manual" ? "manual" : "url",
    url: safe(row.url),
    canonicalUrl: safe(row.canonical_url) || safe(row.url),
    provider: nullableText(row.provider),
    title: nullableText(row.title),
    description: nullableText(row.description),
    siteName: nullableText(row.site_name),
    imageUrl: nullableText(row.image_url),
    author: nullableText(row.author),
    publishedAt: nullableText(row.published_at),
    metadataStatus: normalizeMetadataStatus(row.metadata_status),
    metadata: record(row.metadata),
    extractedAt: nullableText(row.extracted_at),
    createdAt: safe(row.created_at),
    updatedAt: safe(row.updated_at),
  };
}

function toIdea(row: IdeaRow, sources: IdeaSource[]): Idea {
  const id = safe(row.id);
  return {
    id,
    userId: safe(row.user_id),
    title: safe(row.title),
    description: safe(row.description),
    tags: stringArray(row.tags),
    status: normalizeIdeaStatus(row.status),
    sources: sources.filter((source) => source.ideaId === id),
    createdAt: safe(row.created_at),
    updatedAt: safe(row.updated_at),
  };
}

function isSchemaError(error: unknown) {
  const message = safe((error as { message?: unknown })?.message).toLowerCase();
  return (
    message.includes("does not exist") ||
    message.includes("could not find the table") ||
    message.includes("schema cache") ||
    message.includes("relation")
  );
}

function repositoryError(error: unknown, operation: string) {
  if (isSchemaError(error)) {
    return new IdeasRepositoryError(
      "schema",
      "My Ideas storage is not available yet. Apply the Intelligence Engine migration before saving ideas.",
    );
  }

  const message = safe((error as { message?: unknown })?.message);
  return new IdeasRepositoryError(
    "persistence",
    message || `We could not ${operation} your ideas right now.`,
  );
}

function assertUserId(userId: string) {
  if (!safe(userId)) {
    throw new IdeasRepositoryError("persistence", "A signed-in user is required.");
  }
}

export function createSupabaseIdeasRepository(
  client: Pick<SupabaseClient, "from"> = supabase,
): IdeasRepository {
  return {
    async listByUser(userId) {
      assertUserId(userId);

      const ideasResponse = await client
        .from("intelligence_ideas")
        .select("id,user_id,title,description,tags,status,created_at,updated_at")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });

      if (ideasResponse.error) {
        throw repositoryError(ideasResponse.error, "load");
      }

      const ideaRows = (ideasResponse.data ?? []) as IdeaRow[];
      if (!ideaRows.length) return [];

      const ideaIds = ideaRows.map((row) => safe(row.id)).filter(Boolean);
      const sourcesResponse = await client
        .from("intelligence_idea_sources")
        .select(
          "id,idea_id,user_id,source_type,url,canonical_url,provider,title,description,site_name,image_url,author,published_at,metadata_status,metadata,extracted_at,created_at,updated_at",
        )
        .eq("user_id", userId)
        .in("idea_id", ideaIds);

      if (sourcesResponse.error) {
        throw repositoryError(sourcesResponse.error, "load");
      }

      const sources = ((sourcesResponse.data ?? []) as SourceRow[]).map(toIdeaSource);
      return ideaRows.map((row) => toIdea(row, sources));
    },

    async createForUser(userId, input) {
      assertUserId(userId);

      const ideaResponse = await client
        .from("intelligence_ideas")
        .insert({
          user_id: userId,
          title: input.title || "Saved idea",
          description: "",
          tags: [],
          status: "active",
        })
        .select("id,user_id,title,description,tags,status,created_at,updated_at")
        .single();

      if (ideaResponse.error || !ideaResponse.data) {
        throw repositoryError(ideaResponse.error, "save");
      }

      const idea = ideaResponse.data as IdeaRow;
      const ideaId = safe(idea.id);
      const sourceResponse = await client
        .from("intelligence_idea_sources")
        .insert({
          idea_id: ideaId,
          user_id: userId,
          url: input.url,
          canonical_url: input.url,
        })
        .select(
          "id,idea_id,user_id,source_type,url,canonical_url,provider,title,description,site_name,image_url,author,published_at,metadata_status,metadata,extracted_at,created_at,updated_at",
        )
        .single();

      if (sourceResponse.error || !sourceResponse.data) {
        await client
          .from("intelligence_ideas")
          .delete()
          .eq("id", ideaId)
          .eq("user_id", userId);
        throw repositoryError(sourceResponse.error, "save");
      }

      return toIdea(idea, [toIdeaSource(sourceResponse.data as SourceRow)]);
    },
  };
}
