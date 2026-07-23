import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { requireSupabasePublicEnv } from "@/lib/supabaseClient";

export async function getIntelligenceServerContext(): Promise<{
  user: User;
  client: SupabaseClient;
} | null> {
  const cookieStore = await cookies();
  const config = requireSupabasePublicEnv();
  const client = createServerClient(config.supabaseUrl, config.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll() {
        // This route only reads the authenticated session.
      },
    },
  });
  const { data, error } = await client.auth.getUser();

  if (error || !data.user) return null;
  return { user: data.user, client };
}
