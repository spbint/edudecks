import { createClient } from "@supabase/supabase-js";
import { requireSupabasePublicEnv } from "@/lib/supabaseClient";

function safe(value: unknown) {
  return String(value ?? "").trim();
}

export function calendarIntegrationAdminEnvironmentReady() {
  return Boolean(
    safe(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      safe(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) &&
      safe(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY) &&
      safe(process.env.CRON_SECRET),
  );
}

export function createCalendarIntegrationAdminClient() {
  const config = requireSupabasePublicEnv();
  const serviceRoleKey = safe(
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY,
  );
  if (!serviceRoleKey) {
    throw new Error("Calendar integration service configuration is unavailable.");
  }

  return createClient(config.supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
