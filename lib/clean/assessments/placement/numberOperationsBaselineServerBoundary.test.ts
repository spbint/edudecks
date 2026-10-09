import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const routeSource = readFileSync(
  join(
    process.cwd(),
    "app/api/assessments/maths-starting-point/save/route.ts",
  ),
  "utf8",
);

const clientSource = readFileSync(
  join(
    process.cwd(),
    "lib/clean/assessments/placement/numberOperationsBaselinePersistenceClient.ts",
  ),
  "utf8",
);

describe("Maths starting-point server-only save boundary", () => {
  it("keeps the route disabled by the release gate and validates evidence server-side", () => {
    expect(routeSource).toContain(
      "MATHS_STARTING_POINT_RELEASE.persistenceEnabled",
    );
    expect(routeSource).toContain(
      "buildTrustedNumberOperationsBaselinePersistenceDraft",
    );
    expect(routeSource).toContain('.from("profiles")');
    expect(routeSource).toContain('"is_admin"');
    expect(routeSource).toContain("!MATHS_STARTING_POINT_RELEASE.customerVisible");
    expect(routeSource).toContain('.from("family_members")');
    expect(routeSource).toContain('.from("learners")');
    expect(routeSource).toContain("p_actor_user_id: user.id");
  });

  it("keeps the browser away from direct Supabase baseline RPC execution", () => {
    expect(clientSource).toContain(
      '"/api/assessments/maths-starting-point/save"',
    );
    expect(clientSource).toContain("Authorization:");
    expect(clientSource).not.toContain(
      'supabase.rpc("mylearna_save_number_operations_baseline"',
    );
  });
});


it("keeps persistence staff-only while customer visibility is off", () => {
  expect(routeSource).toContain(
    "Maths starting-point persistence is currently limited to authorised staff preview.",
  );
  expect(routeSource).toContain("status: 403");
});
