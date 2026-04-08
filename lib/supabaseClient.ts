import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const hasSupabaseEnv = Boolean(supabaseUrl && supabaseAnonKey);
const fallbackSupabaseUrl = "https://placeholder.supabase.co";
const fallbackSupabaseAnonKey = "placeholder-anon-key";
const SUPABASE_REQUEST_TIMEOUT_MS = 10000;

if (!hasSupabaseEnv) {
  console.warn(
    "Supabase environment variables are missing. Using a placeholder client so static builds can complete."
  );
}

export { hasSupabaseEnv };

async function supabaseFetch(input: RequestInfo | URL, init?: RequestInit) {
  let timer: ReturnType<typeof setTimeout> | null = null;

  try {
    return await Promise.race([
      fetch(input, init),
      new Promise<Response>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error(`Supabase request timed out after ${SUPABASE_REQUEST_TIMEOUT_MS}ms.`));
        }, SUPABASE_REQUEST_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export const supabase = createClient(
  hasSupabaseEnv ? supabaseUrl! : fallbackSupabaseUrl,
  hasSupabaseEnv ? supabaseAnonKey! : fallbackSupabaseAnonKey,
  {
    global: {
      fetch: supabaseFetch,
    },
  }
);
