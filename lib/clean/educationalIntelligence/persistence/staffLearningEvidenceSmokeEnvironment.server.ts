import "server-only";

import { createClient } from "@supabase/supabase-js";
import {
  EI_STAGING_BRANCH_NAME,
  EI_STAGING_PROJECT_REF,
} from "./staffLearningEvidenceSmoke";

const ENABLED_VALUE = "true";

function clean(value: unknown) {
  return String(value ?? "").trim();
}
function projectRefFromUrl(value: string) {
  try {
    const hostname = new URL(value).hostname.toLowerCase();
    const suffix = ".supabase.co";
    return hostname.endsWith(suffix) ? hostname.slice(0, -suffix.length) : "";
  } catch {
    return "";
  }
}

export type StaffLearningEvidenceSmokeConfig = {
  branchName: typeof EI_STAGING_BRANCH_NAME;
  projectRef: typeof EI_STAGING_PROJECT_REF;
  supabaseUrl: string;
  serviceRoleKey: string;
};

export function getStaffLearningEvidenceSmokeConfiguration(
  environment: NodeJS.ProcessEnv = process.env,
): StaffLearningEvidenceSmokeConfig {
  if (clean(environment.VERCEL_ENV).toLowerCase() === "production") {
    throw new Error("Staff EI persistence smoke is forbidden in Production.");
  }
  if (
    clean(environment.EI_STAFF_PERSISTENCE_SMOKE_ENABLED).toLowerCase() !==
    ENABLED_VALUE
  ) {
    throw new Error("Staff EI persistence smoke is not enabled.");
  }

  const projectRef = clean(environment.EI_STAGING_SUPABASE_PROJECT_REF);
  const supabaseUrl = clean(environment.EI_STAGING_SUPABASE_URL);
  const serviceRoleKey = clean(environment.EI_STAGING_SUPABASE_SERVICE_ROLE_KEY);
  const publicProjectRef = projectRefFromUrl(
    clean(environment.NEXT_PUBLIC_SUPABASE_URL),
  );

  if (
    projectRef !== EI_STAGING_PROJECT_REF ||
    projectRefFromUrl(supabaseUrl) !== EI_STAGING_PROJECT_REF ||
    publicProjectRef !== EI_STAGING_PROJECT_REF
  ) {
    throw new Error(
      "Staff EI persistence smoke must target intelligence-staging exclusively.",
    );
  }
  if (!serviceRoleKey) {
    throw new Error("Staff EI persistence smoke has no server credential.");
  }

  return {
    branchName: EI_STAGING_BRANCH_NAME,
    projectRef: EI_STAGING_PROJECT_REF,
    supabaseUrl,
    serviceRoleKey,
  };
}

export function isStaffLearningEvidenceSmokeConfigured(
  environment: NodeJS.ProcessEnv = process.env,
) {
  try {
    getStaffLearningEvidenceSmokeConfiguration(environment);
    return true;
  } catch {
    return false;
  }
}

export function createStaffLearningEvidenceSmokeClient(
  environment: NodeJS.ProcessEnv = process.env,
) {
  const config = getStaffLearningEvidenceSmokeConfiguration(environment);
  return {
    config,
    client: createClient(config.supabaseUrl, config.serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }),
  };
}
