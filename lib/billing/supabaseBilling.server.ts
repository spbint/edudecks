import "server-only";

import { createClient } from "@supabase/supabase-js";

export function createBillingAdminClient() {
  const url = String(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const serviceKey = String(
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY ?? "",
  ).trim();
  if (!url || !serviceKey) {
    throw new Error("Server billing requires Supabase service-role configuration.");
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export const BILLING_AUTHORITY_ROLES = ["owner", "parent"] as const;
