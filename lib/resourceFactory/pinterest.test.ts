import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { buildPinterestPinPayload } from "@/lib/resourceFactory/pinterest.server";

describe("Resource Factory Pinterest", () => {
  it("builds an image-url pin linked back to the MyLearna worksheet", () => {
    const payload = buildPinterestPinPayload({
      boardId: "123",
      destinationUrl:
        "https://www.mylearna.com/marketplace/worksheets/year-4-place-value",
      imageUrl:
        "https://www.mylearna.com/api/resource-factory/pinterest/year-4-place-value",
      title: "Year 4 Place Value Worksheet",
      description: "Free printable homeschool maths practice with answers.",
    });

    expect(payload).toMatchObject({
      board_id: "123",
      link:
        "https://www.mylearna.com/marketplace/worksheets/year-4-place-value",
      media_source: {
        source_type: "image_url",
        is_standard: true,
      },
    });
  });
});
