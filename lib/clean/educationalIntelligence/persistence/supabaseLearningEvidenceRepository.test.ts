import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Supabase learning evidence repository", () => {
  it("selects review state through the tenant-owning foreign key", () => {
    const source = readFileSync(
      "lib/clean/educationalIntelligence/persistence/supabaseLearningEvidenceRepository.server.ts",
      "utf8",
    );

    expect(source).toContain(
      "learning_evidence_result_reviews!learning_evidence_result_reviews_result_owner_fk",
    );
    expect(source).not.toContain(
      '"learning_evidence_result_reviews(review_state',
    );
  });
});
