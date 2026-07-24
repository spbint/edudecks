// @vitest-environment jsdom

import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useAuthUser } from "@/app/components/AuthUserProvider";
import MyIdeasWorkspace from "@/app/components/intelligence/MyIdeasWorkspace";
import type { IdeasService } from "@/lib/intelligence/ideas/service";
import type { Idea } from "@/lib/intelligence/types";

vi.mock("@/app/components/AuthUserProvider", () => ({
  useAuthUser: vi.fn(),
}));

const mockedUseAuthUser = vi.mocked(useAuthUser);

function makeIdea(url = "https://example.com/idea"): Idea {
  return {
    id: "idea-1",
    userId: "user-1",
    title: "Saved idea",
    description: "",
    tags: [],
    status: "active",
    sources: [
      {
        id: "source-1",
        ideaId: "idea-1",
        userId: "user-1",
        sourceType: "url",
        url,
        canonicalUrl: url,
        provider: null,
        title: null,
        description: null,
        siteName: null,
        imageUrl: null,
        author: null,
        publishedAt: null,
        metadataStatus: "pending",
        metadata: {},
        extractedAt: null,
        createdAt: "2026-07-23T00:00:00.000Z",
        updatedAt: "2026-07-23T00:00:00.000Z",
      },
    ],
    createdAt: "2026-07-23T00:00:00.000Z",
    updatedAt: "2026-07-23T00:00:00.000Z",
  };
}

function setupAuth() {
  mockedUseAuthUser.mockReturnValue({
    user: { id: "user-1" } as never,
    profile: null,
    loading: false,
  });
}

function renderWorkspace(service: IdeasService) {
  return render(React.createElement(MyIdeasWorkspace, { service }));
}

describe("MyIdeasWorkspace", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("shows the empty state and validates before persistence", async () => {
    setupAuth();
    const service: IdeasService = {
      listForUser: vi.fn(async () => []),
      createForUser: vi.fn(),
    };

    renderWorkspace(service);
    expect(await screen.findByText("No ideas saved yet. Add your first link above.")).toBeTruthy();

    fireEvent.submit(screen.getByRole("button", { name: "Save idea" }));

    expect((await screen.findByRole("alert")).textContent).toContain("A source URL is required.");
    expect(service.createForUser).not.toHaveBeenCalled();
  });

  it("shows success after saving an idea", async () => {
    setupAuth();
    const service: IdeasService = {
      listForUser: vi.fn(async () => []),
      createForUser: vi.fn(async () => makeIdea()),
    };

    renderWorkspace(service);
    await screen.findByText("No ideas saved yet. Add your first link above.");
    fireEvent.change(screen.getByLabelText("Idea URL"), {
      target: { value: "https://example.com/idea" },
    });
    fireEvent.change(screen.getByLabelText("Optional idea title"), {
      target: { value: "A saved idea" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save idea" }));

    await waitFor(() =>
      expect(screen.getByRole("status").textContent).toContain("Your idea was saved."),
    );
    expect(screen.getByText("https://example.com/idea")).toBeTruthy();
    expect(service.createForUser).toHaveBeenCalledWith("user-1", {
      url: "https://example.com/idea",
      title: "A saved idea",
    });
  });

  it("shows persistence errors without losing the form", async () => {
    setupAuth();
    const service: IdeasService = {
      listForUser: vi.fn(async () => []),
      createForUser: vi.fn(async () => {
        throw new Error("Storage is unavailable.");
      }),
    };

    renderWorkspace(service);
    await screen.findByText("No ideas saved yet. Add your first link above.");
    fireEvent.change(screen.getByLabelText("Idea URL"), {
      target: { value: "https://example.com/idea" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save idea" }));

    expect(await screen.findByText("Storage is unavailable.")).toBeTruthy();
    expect((screen.getByLabelText("Idea URL") as HTMLInputElement).value).toBe(
      "https://example.com/idea",
    );
  });
});
