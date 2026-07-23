import { NextResponse } from "next/server";
import { isIntelligenceEngineEnabled } from "@/lib/intelligence/featureFlags";
import { getIntelligenceServerContext } from "@/lib/intelligence/serverAuth";
import { createSupabaseIdeasRepository } from "@/lib/intelligence/ideas/repository";
import {
  extractMetadata,
  failureMetadata,
  MetadataExtractionError,
} from "@/lib/intelligence/sources/metadataExtractor";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  context: { params: Promise<{ ideaId: string; sourceId: string }> },
) {
  if (!isIntelligenceEngineEnabled()) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const auth = await getIntelligenceServerContext();
  if (!auth) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { ideaId, sourceId } = await context.params;
  const repository = createSupabaseIdeasRepository(auth.client);
  const source = await repository.getSourceForUser(auth.user.id, ideaId, sourceId);
  if (!source) return NextResponse.json({ error: "Source not found." }, { status: 404 });

  const attemptedAt = new Date();
  const fetchingMetadata = {
    ...failureMetadata(source.url, new Error("fetching"), () => attemptedAt),
    extractionStatus: "fetching" as const,
    failureCode: undefined,
    failureMessage: undefined,
  };

  try {
    await repository.updateSourceMetadataForUser(auth.user.id, ideaId, sourceId, fetchingMetadata);
    const metadata = await extractMetadata(source.url);
    const updatedSource = await repository.updateSourceMetadataForUser(
      auth.user.id,
      ideaId,
      sourceId,
      metadata,
    );
    return NextResponse.json({ source: updatedSource });
  } catch (error) {
    if (!(error instanceof MetadataExtractionError)) {
      // Persistence errors must not be hidden as source failures.
      throw error;
    }
    const metadata = failureMetadata(source.url, error);
    const updatedSource = await repository.updateSourceMetadataForUser(
      auth.user.id,
      ideaId,
      sourceId,
      metadata,
    );
    return NextResponse.json({ source: updatedSource });
  }
}
