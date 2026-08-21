import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";

describe("Founder password setup utility", () => {
  it("is local-only, targets the exact account, and never logs the password", () => {
    const source = readFileSync("scripts/set-founder-password.mjs", "utf8");
    expect(source).toContain('const FOUNDER_EMAIL = "sean@mylearna.com"');
    expect(source).toContain("FOUNDER_NEW_PASSWORD");
    expect(source).toContain("MIN_PASSWORD_LENGTH = 16");
    expect(source).toContain("auth.admin.updateUserById");
    expect(source).toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(source).toContain("SUPABASE_SERVICE_KEY");
    expect(source).not.toMatch(/console\.(log|error)\(\s*(password|newPassword)/i);
    expect(source).not.toContain("writeFile");
    expect(source).not.toContain("NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY");
  });

  it("refuses a password shorter than the required minimum", () => {
    expect(() => execFileSync("node", ["scripts/set-founder-password.mjs"], {
      env: { ...process.env, FOUNDER_NEW_PASSWORD: "too-short" },
      stdio: "pipe",
    })).toThrow();
  });
});
