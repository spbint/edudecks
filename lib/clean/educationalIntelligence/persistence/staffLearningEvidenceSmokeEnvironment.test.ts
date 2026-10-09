import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  getStaffLearningEvidenceSmokeConfiguration,
  isStaffLearningEvidenceSmokeConfigured,
} from "./staffLearningEvidenceSmokeEnvironment.server";

const stagingEnvironment = {
  VERCEL_ENV: "preview",
  EI_STAFF_PERSISTENCE_SMOKE_ENABLED: "true",
  EI_STAGING_SUPABASE_PROJECT_REF: "owvxggviughmpursepof",
  EI_STAGING_SUPABASE_URL: "https://owvxggviughmpursepof.supabase.co",
  EI_STAGING_SUPABASE_SERVICE_ROLE_KEY: "server-secret-placeholder",
  NEXT_PUBLIC_SUPABASE_URL: "https://owvxggviughmpursepof.supabase.co",
} as NodeJS.ProcessEnv;

describe("staff Learning Evidence smoke environment", () => {
  it("accepts only the explicit intelligence-staging Preview target", () => {
    expect(getStaffLearningEvidenceSmokeConfiguration(stagingEnvironment)).toMatchObject({
      branchName: "intelligence-staging",
      projectRef: "owvxggviughmpursepof",
      supabaseUrl: "https://owvxggviughmpursepof.supabase.co",
    });
    expect(isStaffLearningEvidenceSmokeConfigured(stagingEnvironment)).toBe(true);
  });

  it("refuses Production even when every staging variable is present", () => {
    expect(() =>
      getStaffLearningEvidenceSmokeConfiguration({
        ...stagingEnvironment,
        VERCEL_ENV: "production",
      }),
    ).toThrow(/forbidden in Production/i);
  });

  it("refuses a production or mixed public/server Supabase target", () => {
    expect(() =>
      getStaffLearningEvidenceSmokeConfiguration({
        ...stagingEnvironment,
        NEXT_PUBLIC_SUPABASE_URL: "https://jgllsqixpfypunnstinl.supabase.co",
      }),
    ).toThrow(/intelligence-staging exclusively/i);
    expect(() =>
      getStaffLearningEvidenceSmokeConfiguration({
        ...stagingEnvironment,
        EI_STAGING_SUPABASE_PROJECT_REF: "jgllsqixpfypunnstinl",
      }),
    ).toThrow(/intelligence-staging exclusively/i);
  });

  it("requires an explicit server-only credential and enable switch", () => {
    expect(
      isStaffLearningEvidenceSmokeConfigured({
        ...stagingEnvironment,
        EI_STAGING_SUPABASE_SERVICE_ROLE_KEY: "",
      }),
    ).toBe(false);
    expect(
      isStaffLearningEvidenceSmokeConfigured({
        ...stagingEnvironment,
        EI_STAFF_PERSISTENCE_SMOKE_ENABLED: "false",
      }),
    ).toBe(false);
  });
});
