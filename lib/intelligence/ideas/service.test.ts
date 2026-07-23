import { describe, expect, it, vi } from "vitest";
import { createIdeasService } from "@/lib/intelligence/ideas/service";
import type { Idea } from "@/lib/intelligence/types";
import type { IdeasRepository } from "@/lib/intelligence/ideas/repository";

function makeIdea(userId: string): Idea {
  return {
    id: "idea-1",
    userId,
    title: "Saved idea",
    description: "",
    tags: [],
    status: "active",
    sources: [],
    createdAt: "2026-07-23T00:00:00.000Z",
    updatedAt: "2026-07-23T00:00:00.000Z",
  };
}

describe("Intelligence Ideas service", () => {
  it("passes the authenticated user id to reads", async () => {
    const repository: IdeasRepository = {
      listByUser: vi.fn(async (userId: string) => [makeIdea(userId)]),
      createForUser: vi.fn(),
    };
    const service = createIdeasService(repository);

    await service.listForUser("user-1");

    expect(repository.listByUser).toHaveBeenCalledWith("user-1");
  });

  it("validates URLs before attempting persistence", async () => {
    const repository: IdeasRepository = {
      listByUser: vi.fn(),
      createForUser: vi.fn(),
    };
    const service = createIdeasService(repository);

    await expect(
      service.createForUser("user-1", { url: "javascript:alert(1)" }),
    ).rejects.toThrow("Only HTTP and HTTPS source URLs are supported.");
    expect(repository.createForUser).not.toHaveBeenCalled();
  });

  it("passes only the URL and optional title with the authenticated user id", async () => {
    const repository: IdeasRepository = {
      listByUser: vi.fn(),
      createForUser: vi.fn(async (userId: string) => makeIdea(userId)),
    };
    const service = createIdeasService(repository);

    await service.createForUser("user-1", {
      url: " https://example.com/lesson ",
      title: "  Fractions in the kitchen  ",
    });

    expect(repository.createForUser).toHaveBeenCalledWith("user-1", {
      url: "https://example.com/lesson",
      title: "Fractions in the kitchen",
    });
  });
});
