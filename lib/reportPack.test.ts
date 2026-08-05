import * as reportPack from "@/lib/reportPack";
import { describe, expect, it } from "vitest";

describe("legacy submission pack helper", () => {
  it("remains unavailable after migration to validated report exports", () => {
    expect(reportPack).not.toHaveProperty("buildSubmissionPack");
  });
});
