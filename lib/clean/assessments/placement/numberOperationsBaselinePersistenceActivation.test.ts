import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const foundation = readFileSync(
  join(
    process.cwd(),
    "sql/clean/20261004_number_operations_baseline_persistence_review.sql",
  ),
  "utf8",
);

const activation = readFileSync(
  join(
    process.cwd(),
    "sql/clean/20261004_number_operations_baseline_persistence_activation_review.sql",
  ),
  "utf8",
);

describe("Number & Operations baseline persistence activation split", () => {
  it("keeps authenticated write execution revoked in the foundation", () => {
    expect(foundation).toContain(
      "revoke all on function public.mylearna_save_number_operations_baseline",
    );
    expect(foundation).toContain("from authenticated");
    expect(foundation).not.toMatch(
      /grant execute on function public\.mylearna_save_number_operations_baseline/,
    );
  });

  it("puts the authenticated execute grant only in the explicit activation file", () => {
    expect(activation).toContain("DESIGN / REVIEW ACTIVATION ONLY");
    expect(activation).toContain("DO NOT APPLY with the foundation migration");
    expect(activation).toMatch(
      /grant execute on function public\.mylearna_save_number_operations_baseline/,
    );
    expect(activation).toContain("to_regprocedure");
    expect(activation).toContain("Emergency containment / rollback");
  });
});
