import { beforeEach, describe, expect, it, vi } from "vitest";

const buildResponse = vi.hoisted(() =>
  vi.fn(async (bookletKey: string) =>
    new Response(bookletKey, { status: bookletKey === "y3-4-a-u1-e01" ? 200 : 404 }),
  ),
);

vi.mock("@/lib/clean/resources/classicalBookletPdf.server", () => ({
  buildClassicalBookletPdfResponse: buildResponse,
}));

import { GET, revalidate, runtime } from "@/app/api/classical/booklets/[bookletKey]/route";

describe("Classical booklet route", () => {
  beforeEach(() => vi.clearAllMocks());

  it("keeps the Encounter 1 URL key and delivery configuration compatible", async () => {
    const response = await GET(
      new Request("https://mylearna.test/api/classical/booklets/y3-4-a-u1-e01"),
      { params: Promise.resolve({ bookletKey: "y3-4-a-u1-e01" }) },
    );

    expect(runtime).toBe("nodejs");
    expect(revalidate).toBe(86400);
    expect(response.status).toBe(200);
    expect(buildResponse).toHaveBeenCalledWith("y3-4-a-u1-e01");
  });

  it("passes an unknown key to the trusted registry-backed resolver", async () => {
    const response = await GET(
      new Request("https://mylearna.test/api/classical/booklets/unknown"),
      { params: Promise.resolve({ bookletKey: "unknown" }) },
    );

    expect(response.status).toBe(404);
    expect(buildResponse).toHaveBeenCalledWith("unknown");
  });
});
