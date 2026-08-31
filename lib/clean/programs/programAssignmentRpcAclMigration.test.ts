import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260831100138_restrict_program_assignment_rpc.sql"),
  "utf8",
);

describe("program assignment RPC ACL migration contract", () => {
  it("explicitly removes anonymous execution while retaining authenticated and service-role execution", () => {
    const functionSignature = "public.clean_assign_program_learners(uuid, uuid, uuid[])";

    expect(migration).toContain(`revoke all on function ${functionSignature} from public`);
    expect(migration).toContain(`revoke all on function ${functionSignature} from anon`);
    expect(migration).toContain(`grant execute on function ${functionSignature} to authenticated`);
    expect(migration).toContain(`grant execute on function ${functionSignature} to service_role`);
  });
});
