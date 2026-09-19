import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { GET } from "@/app/api/report/export/route";

const RETIRED_RESPONSE = {
  error: "This legacy report export endpoint has been retired. Use My Reports.",
  code: "legacy_report_export_retired",
  canonicalRoute: "/my-reports",
};

describe("GET /api/report/export", () => {
  it("returns the canonical retirement response without caching", async () => {
    const response = await GET();

    expect(response.status).toBe(410);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual(RETIRED_RESPONSE);
  });

  it("does not retain legacy report export dependencies", () => {
    const source = readFileSync(
      join(process.cwd(), "app/api/report/export/route.ts"),
      "utf8",
    );

    expect(source).not.toContain("@/lib/reportExport");
    expect(source).not.toContain("@/lib/reportExportHistory");
    expect(source).not.toContain("report_documents");
    expect(source).not.toContain("report_export_events");
  });
});
