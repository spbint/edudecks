import "server-only";

import { createClient } from "@supabase/supabase-js";

import { buildMathResourceFactoryPlan } from "@/lib/resourceFactory/planner";

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function createAdminClient() {
  const url = clean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = clean(
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY,
  );
  if (!url || !key) {
    throw new Error("Resource Factory planner requires Supabase service-role configuration.");
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export async function planNextMathResourceFactorySeeds(limit = 10) {
  const admin = createAdminClient();
  const response = await admin
    .from("marketplace_resources")
    .select("external_product_id")
    .eq("source", "mylearna_agent");

  if (response.error) {
    throw new Error(
      `Unable to inspect Resource Factory catalogue: ${response.error.message}`,
    );
  }

  return buildMathResourceFactoryPlan({
    existingResourceIds: (response.data ?? []).map((row) =>
      clean(row.external_product_id),
    ),
    limit,
  });
}
