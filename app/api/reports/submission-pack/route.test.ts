import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  buildSubmissionPack: vi.fn(),
}));

vi.mock("@/lib/reportPack", () => ({
  buildSubmissionPack: mocks.buildSubmissionPack,
}));

import { GET } from "@/app/api/reports/submission-pack/route";

function makeRequest(path: string, token?: string) {
  return new NextRequest(`http://localhost${path}`, {
    headers: token ? { authorization: `Bearer ${token}` } : undefined,
  });
}

describe("GET /api/reports/submission-pack", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.buildSubmissionPack.mockResolvedValue({
      bytes: Buffer.from("zip-bytes"),
      filename: "avery-submission-pack.zip",
    });
  });

  it("returns a zip response for a valid request", async () => {
    const response = await GET(
      makeRequest("/api/reports/submission-pack?draftId=draft-123", "token-123"),
    );

    expect(mocks.buildSubmissionPack).toHaveBeenCalledWith({
      draftId: "draft-123",
      accessToken: "token-123",
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/zip");
    expect(response.headers.get("content-disposition")).toBe(
      'attachment; filename="avery-submission-pack.zip"',
    );
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(Buffer.from(await response.arrayBuffer())).toEqual(Buffer.from("zip-bytes"));
  });

  it("returns 400 when draftId is missing and does not call the pack helper", async () => {
    const response = await GET(makeRequest("/api/reports/submission-pack", "token-123"));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "A draftId query parameter is required.",
    });
    expect(mocks.buildSubmissionPack).not.toHaveBeenCalled();
  });

  it("returns 401 when the bearer token is missing and does not call the pack helper", async () => {
    const response = await GET(makeRequest("/api/reports/submission-pack?draftId=draft-123"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "A signed-in access token is required for submission pack export.",
    });
    expect(mocks.buildSubmissionPack).not.toHaveBeenCalled();
  });

  it("returns 404 when downstream reports a missing draft", async () => {
    mocks.buildSubmissionPack.mockRejectedValueOnce(new Error("Report draft not found."));

    const response = await GET(
      makeRequest("/api/reports/submission-pack?draftId=missing", "token-123"),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Report draft not found.",
    });
  });

  it("returns 400 when downstream reports learner context failure", async () => {
    mocks.buildSubmissionPack.mockRejectedValueOnce(
      new Error("No learner is attached to this draft."),
    );

    const response = await GET(
      makeRequest("/api/reports/submission-pack?draftId=draft-123", "token-123"),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "No learner is attached to this draft.",
    });
  });

  it("returns 401 when downstream reports a token or session failure", async () => {
    mocks.buildSubmissionPack.mockRejectedValueOnce(
      new Error("A valid signed-in session is required to export this pack."),
    );

    const response = await GET(
      makeRequest("/api/reports/submission-pack?draftId=draft-123", "token-123"),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "A valid signed-in session is required to export this pack.",
    });
  });

  it("returns 500 when downstream pack generation fails", async () => {
    mocks.buildSubmissionPack.mockRejectedValueOnce(
      new Error("Failed to generate submission pack."),
    );

    const response = await GET(
      makeRequest("/api/reports/submission-pack?draftId=draft-123", "token-123"),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Failed to generate submission pack.",
    });
  });

  it("falls back to a safe generic 500 message when the thrown error has no usable message", async () => {
    mocks.buildSubmissionPack.mockRejectedValueOnce({ message: "   " });

    const response = await GET(
      makeRequest("/api/reports/submission-pack?draftId=draft-123", "token-123"),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Failed to generate submission pack.",
    });
  });
});
