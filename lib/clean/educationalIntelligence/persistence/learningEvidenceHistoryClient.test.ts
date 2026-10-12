import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("canonical Learning Evidence read client", () => {
  it("is RLS-governed and strictly read-only", () => {
    const source = readFileSync(
      join(process.cwd(), "lib/clean/educationalIntelligence/persistence/learningEvidenceHistoryClient.ts"),
      "utf8",
    );

    expect(source).toContain('.from("learning_evidence_results")');
    expect(source).toContain('.select("canonical_payload,evaluated_at")');
    expect(source).toContain('.eq("family_id", input.familyId)');
    expect(source).toContain('.eq("learner_id", input.learnerId)');
    expect(source).not.toMatch(/\.insert\(|\.update\(|\.delete\(|\.upsert\(|\.rpc\(/);
    expect(source).not.toMatch(/SUPABASE_SERVICE_ROLE_KEY|createClient\(/);
  });
});
