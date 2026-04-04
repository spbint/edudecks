import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const hasSupabaseEnv = Boolean(supabaseUrl && supabaseAnonKey);
const fallbackSupabaseUrl = "https://placeholder.supabase.co";
const fallbackSupabaseAnonKey = "placeholder-anon-key";

if (!hasSupabaseEnv) {
  console.warn(
    "Supabase environment variables are missing. Using a placeholder client so static builds can complete."
  );
}

export { hasSupabaseEnv };

export const supabase = createClient(
  hasSupabaseEnv ? supabaseUrl! : fallbackSupabaseUrl,
  hasSupabaseEnv ? supabaseAnonKey! : fallbackSupabaseAnonKey
);
