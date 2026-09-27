import "server-only";

import { createClient } from "@supabase/supabase-js";

import type {
  ResourceFactoryGenerationSeed,
  ResourceFactoryJobStatus,
} from "@/lib/resourceFactory/types";

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function createAdminClient() {
  const url = clean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = clean(
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY,
  );
  if (!url || !key) {
    throw new Error("Resource Factory jobs require Supabase service-role configuration.");
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export async function listRecordedResourceFactoryIds() {
  const admin = createAdminClient();
  const response = await admin
    .from("resource_factory_jobs")
    .select("resource_id");

  if (response.error) {
    throw new Error(
      `Unable to inspect Resource Factory jobs: ${response.error.message}`,
    );
  }

  return (response.data ?? [])
    .map((row) => clean(row.resource_id))
    .filter(Boolean);
}

export async function createResourceFactoryJob(seed: ResourceFactoryGenerationSeed) {
  const admin = createAdminClient();
  const response = await admin
    .from("resource_factory_jobs")
    .insert({
      resource_id: seed.resourceId,
      status: "planned",
      seed,
      attempt_count: 0,
    })
    .select("id")
    .single();

  if (response.error) {
    if (response.error.code === "23505") return null;
    throw new Error(
      `Unable to create Resource Factory job: ${response.error.message}`,
    );
  }

  return clean(response.data.id);
}

export async function updateResourceFactoryJob(input: {
  jobId: string;
  status: ResourceFactoryJobStatus;
  attemptCount?: number;
  qaReport?: unknown;
  marketplaceResourceId?: string | null;
  lastError?: string | null;
}) {
  const admin = createAdminClient();
  const patch: Record<string, unknown> = {
    status: input.status,
    updated_at: new Date().toISOString(),
  };

  if (typeof input.attemptCount === "number") {
    patch.attempt_count = input.attemptCount;
  }
  if (input.qaReport !== undefined) {
    patch.qa_report = input.qaReport;
  }
  if (input.marketplaceResourceId !== undefined) {
    patch.marketplace_resource_id = input.marketplaceResourceId;
  }
  if (input.lastError !== undefined) {
    patch.last_error = input.lastError;
  }

  const response = await admin
    .from("resource_factory_jobs")
    .update(patch)
    .eq("id", input.jobId);

  if (response.error) {
    throw new Error(
      `Unable to update Resource Factory job: ${response.error.message}`,
    );
  }
}
