import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const panel = readFileSync(
  join(
    process.cwd(),
    "app/components/clean/assessment-starting-point/StaffLearningEvidenceSavePanel.tsx",
  ),
  "utf8",
);
const route = readFileSync(
  join(
    process.cwd(),
    "app/api/internal/assessment-lab/learning-evidence/route.ts",
  ),
  "utf8",
);

describe("staff Learning Evidence save panel", () => {
  it("submits raw assessment evidence only to the internal staff endpoint", () => {
    expect(panel).toContain("/api/internal/assessment-lab/learning-evidence");
    expect(panel).toContain("draft,");
    expect(panel).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(panel).not.toMatch(/createClient\(|\.from\(|\.rpc\(/);
  });

  it("keeps the service credential and canonical projection on the server", () => {
    expect(route).toContain("createStaffLearningEvidenceSmokeClient");
    expect(route).toContain("saveTrustedStaffLearningEvidence");
    expect(route).not.toContain("NEXT_PUBLIC_SUPABASE_SERVICE");
  });

  it("supports reload, idempotent retry and a separate recheck journey", () => {
    expect(panel).toContain("Retry the same canonical save");
    expect(panel).toContain("Leave and reopen My Results");
    expect(panel).toContain("Run a genuine recheck");
    expect(panel).toContain('attemptKind: "recheck"');
  });
});
