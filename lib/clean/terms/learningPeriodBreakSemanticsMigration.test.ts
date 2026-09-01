import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260901091652_repair_learning_period_break_semantics.sql"),
  "utf8",
);

describe("learning-period break semantic repair", () => {
  it("normalises only semantically inverted terms and breaks", () => {
    expect(migration).toContain("where period_type = 'term'");
    expect(migration).toContain("and is_break = true");
    expect(migration).toContain("set is_break = false");
    expect(migration).toContain("where period_type = 'break'");
    expect(migration).toContain("set is_break = true");
  });

  it("releases only unprotected future generated Program reservations outside teaching periods", () => {
    expect(migration).toContain("using public.program_occurrences occurrence");
    expect(migration).toContain("item.source_type = 'generated'");
    expect(migration).toContain("item.completed_at is null");
    expect(migration).toContain("evidence.calendar_item_id = item.id");
    expect(migration).toContain("period.period_type <> 'break'");
    expect(migration).toContain("period.is_break = false");
  });
});
