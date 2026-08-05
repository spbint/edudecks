import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

import { GET } from "@/app/api/reports/submission-pack/route";

function makeRequest(path: string, token?: string) {
  return new NextRequest(`http://localhost${path}`, {
    headers: token ? { authorization: `Bearer ${token}` } : undefined,
  });
}

describe("GET /api/reports/submission-pack", () => {
  it("truthfully quarantines the removed legacy endpoint", async () => {
    const response = await GET(
      makeRequest("/api/reports/submission-pack?draftId=draft-123", "token-123"),
    );

    expect(response.status).toBe(410);
    await expect(response.json()).resolves.toEqual({
      error: "Submission pack export is no longer available. Use the validated report export instead.",
      code: "submission_pack_unavailable",
    });
  });
});
