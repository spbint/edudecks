import { describe, expect, it } from "vitest";
import { withCleanPlanningTimeout } from "./withTimeout";

describe("clean planning request timeout", () => {
  it("returns a settled request", async () => {
    await expect(withCleanPlanningTimeout(Promise.resolve("ready"), "calendar", 20)).resolves.toBe("ready");
  });

  it("rejects a request that does not settle", async () => {
    await expect(withCleanPlanningTimeout(new Promise(() => undefined), "calendar", 5)).rejects.toThrow(
      "calendar timed out after 5ms",
    );
  });
});
