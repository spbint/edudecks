import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  join(
    process.cwd(),
    "app/api/assessments/maths-starting-point/save/route.ts",
  ),
  "utf8",
);

describe("Maths starting-point save route contract", () => {
  it("keeps persistence behind the application release gate", () => {
    expect(source).toContain(
      "if (!MATHS_STARTING_POINT_RELEASE.persistenceEnabled)",
    );
    expect(source).toContain("status: 409");
  });

  it("requires an authenticated user, family membership and same-family learner before the service-role RPC", () => {
    expect(source).toContain("authenticatedUser(request)");
    expect(source).toContain('from("family_members")');
    expect(source).toContain('.in("role", ["owner", "parent", "caregiver"])');
    expect(source).toContain('from("learners")');
    expect(source).toContain('.eq("family_id", familyId)');
    expect(source).toContain(
      'admin.rpc("mylearna_save_number_operations_baseline"',
    );
    expect(source.indexOf('from("family_members")')).toBeLessThan(
      source.indexOf('admin.rpc("mylearna_save_number_operations_baseline"'),
    );
  });

  it("allows non-published placement items only during staff-only preview", () => {
    expect(source).toContain(
      "allowNonPublishedItems: !MATHS_STARTING_POINT_RELEASE.customerVisible",
    );
    expect(source).toContain(
      "if (!MATHS_STARTING_POINT_RELEASE.customerVisible)",
    );
    expect(source).toContain('.select("is_admin")');
    expect(source).toContain("currently limited to authorised staff preview");
  });

  it("never trusts the browser draft directly when writing", () => {
    expect(source).toContain(
      "buildTrustedNumberOperationsBaselinePersistenceDraft",
    );
    expect(source).toContain("p_attempt: trusted.attempt");
    expect(source).toContain("p_responses: trusted.responses");
    expect(source).not.toContain("p_attempt: draft.attempt");
    expect(source).not.toContain("p_responses: draft.responses");
  });
});
