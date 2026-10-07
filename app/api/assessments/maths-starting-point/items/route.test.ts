import { beforeEach, describe, expect, it, vi } from "vitest";

const { accessMock } = vi.hoisted(() => ({
  accessMock: vi.fn<() => Promise<boolean>>(),
}));

vi.mock(
  "@/lib/clean/assessments/interactivePlayer/startingPointPreviewApi.server",
  () => ({ hasStartingPointPreviewApiAccess: accessMock }),
);

import { GET } from "./route";
import { POST } from "../score/route";

beforeEach(() => {
  accessMock.mockReset();
  accessMock.mockResolvedValue(true);
});

describe("Starting Point protected item and scoring boundary", () => {
  it("returns only the requested answer-safe cluster", async () => {
    const response = await GET(
      new Request(
        "http://localhost/api/assessments/maths-starting-point/items?continuum=counting-processes&pool=anchor&pLevel=5&itemIndex=0",
      ),
    );
    const payload = (await response.json()) as {
      ok: boolean;
      item: Record<string, unknown>;
      itemCount: number;
    };

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.itemCount).toBe(2);
    expect(payload.item).toMatchObject({ id: "myl-anchor-cnt-p05-a-v1" });
    const serialized = JSON.stringify(payload);
    expect(serialized).not.toContain("correctOptionIds");
    expect(serialized).not.toContain("correctValue");
    expect(serialized).not.toContain("acceptableValues");
    expect(serialized).not.toContain("numberOperationsP0Items");
    expect(serialized).not.toContain('"curriculum"');
    expect(serialized).not.toContain('"misconceptionTags"');
    expect(serialized).not.toContain('"estimatedTimeSeconds"');
  });

  it("scores one versioned answer without returning its answer key", async () => {
    const response = await POST(
      new Request(
        "http://localhost/api/assessments/maths-starting-point/score",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            itemId: "myl-anchor-cnt-p05-a-v1",
            itemVersion: 1,
            selectedOptionIds: [],
            responseValue: "62",
            timeSpentSeconds: 8,
          }),
        },
      ),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      ok: true,
      response: {
        itemId: "myl-anchor-cnt-p05-a-v1",
        responseValue: "62",
        correct: true,
        timeSpentSeconds: 8,
      },
    });
    expect(JSON.stringify(payload)).not.toContain("correctValue");
    expect(JSON.stringify(payload)).not.toContain("acceptableValues");
  });

  it("rejects unauthorised item and scoring requests", async () => {
    accessMock.mockResolvedValue(false);

    const itemResponse = await GET(
      new Request(
        "http://localhost/api/assessments/maths-starting-point/items?continuum=counting-processes&pool=anchor&pLevel=5&itemIndex=0",
      ),
    );
    const scoreResponse = await POST(
      new Request(
        "http://localhost/api/assessments/maths-starting-point/score",
        { method: "POST", body: "{}" },
      ),
    );

    expect(itemResponse.status).toBe(403);
    expect(scoreResponse.status).toBe(403);
  });
});
