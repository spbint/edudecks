import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getContext: vi.fn(),
  createRepository: vi.fn(),
  extractMetadata: vi.fn(),
}));

vi.mock("@/lib/intelligence/serverAuth", () => ({
  getIntelligenceServerContext: mocks.getContext,
}));
vi.mock("@/lib/intelligence/ideas/repository", () => ({
  createSupabaseIdeasRepository: mocks.createRepository,
}));
vi.mock("@/lib/intelligence/sources/metadataExtractor", () => ({
  extractMetadata: mocks.extractMetadata,
  failureMetadata: vi.fn(() => ({
    originalUrl: "https://example.com/article",
    finalUrl: null,
    canonicalUrl: null,
    title: null,
    description: null,
    provider: null,
    previewImageUrl: null,
    faviconUrl: null,
    contentType: null,
    fetchedAt: null,
    extractionAttemptedAt: "2026-07-23T00:00:00.000Z",
    extractionStatus: "failed",
    extractorVersion: "test",
  })),
  MetadataExtractionError: class MetadataExtractionError extends Error {},
}));

import { POST } from "@/app/api/intelligence/ideas/[ideaId]/sources/[sourceId]/metadata/route";

const source = {
  id: "source-1",
  ideaId: "idea-1",
  userId: "user-1",
  url: "https://example.com/article",
} as never;

function context() {
  return { params: Promise.resolve({ ideaId: "idea-1", sourceId: "source-1" }) };
}

describe("metadata extraction route", () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_ENABLE_INTELLIGENCE_ENGINE;
    vi.clearAllMocks();
  });

  it("hides the API when the Intelligence Engine flag is disabled", async () => {
    const response = await POST(new Request("http://localhost"), context());
    expect(response.status).toBe(404);
    expect(mocks.getContext).not.toHaveBeenCalled();
  });

  it("requires authentication", async () => {
    process.env.NEXT_PUBLIC_ENABLE_INTELLIGENCE_ENGINE = "true";
    mocks.getContext.mockResolvedValue(null);

    const response = await POST(new Request("http://localhost"), context());
    expect(response.status).toBe(401);
  });

  it("checks ownership before extraction", async () => {
    process.env.NEXT_PUBLIC_ENABLE_INTELLIGENCE_ENGINE = "true";
    mocks.getContext.mockResolvedValue({ user: { id: "user-1" }, client: {} });
    const repository = { getSourceForUser: vi.fn(async () => null) };
    mocks.createRepository.mockReturnValue(repository);

    const response = await POST(new Request("http://localhost"), context());
    expect(response.status).toBe(404);
    expect(repository.getSourceForUser).toHaveBeenCalledWith("user-1", "idea-1", "source-1");
    expect(mocks.extractMetadata).not.toHaveBeenCalled();
  });

  it("persists fetching and final metadata through the ownership-scoped repository", async () => {
    process.env.NEXT_PUBLIC_ENABLE_INTELLIGENCE_ENGINE = "true";
    const repository = {
      getSourceForUser: vi.fn(async () => source),
      updateSourceMetadataForUser: vi.fn(async (_userId, _ideaId, _sourceId, metadata) => ({
        ...source,
        metadata,
      })),
    };
    mocks.getContext.mockResolvedValue({ user: { id: "user-1" }, client: {} });
    mocks.createRepository.mockReturnValue(repository);
    mocks.extractMetadata.mockResolvedValue({
      originalUrl: source.url,
      finalUrl: "https://example.com/final",
      canonicalUrl: "https://example.com/canonical",
      title: "A preview",
      description: "Description",
      provider: "Example",
      previewImageUrl: null,
      faviconUrl: null,
      contentType: "text/html",
      fetchedAt: "2026-07-23T00:00:00.000Z",
      extractionAttemptedAt: "2026-07-23T00:00:00.000Z",
      extractionStatus: "ready",
      extractorVersion: "test",
    });

    const response = await POST(new Request("http://localhost"), context());
    expect(response.status).toBe(200);
    expect(repository.getSourceForUser).toHaveBeenCalledWith("user-1", "idea-1", "source-1");
    expect(repository.updateSourceMetadataForUser).toHaveBeenCalledTimes(2);
    expect(repository.updateSourceMetadataForUser.mock.calls[0][0]).toBe("user-1");
    expect(repository.updateSourceMetadataForUser.mock.calls[0][1]).toBe("idea-1");
    expect(repository.updateSourceMetadataForUser.mock.calls[0][2]).toBe("source-1");
    expect(mocks.extractMetadata).toHaveBeenCalledWith(source.url);
  });
});
