import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Set both environment variables for the active deployment environment.",
  );
}

export const hasSupabaseEnv = true;
const SUPABASE_REQUEST_TIMEOUT_MS = 20000;

export function getSupabaseProjectRef(url: string) {
  const match = url.match(/^https:\/\/([a-z0-9-]+)\.supabase\.co$/i);
  return match?.[1] || "unknown";
}

export const supabaseProjectRef = getSupabaseProjectRef(supabaseUrl);

async function supabaseFetch(input: RequestInfo | URL, init?: RequestInit) {
  let timer: ReturnType<typeof setTimeout> | null = null;

  try {
    return (await Promise.race([
      fetch(input, init),
      new Promise<Response>((_, reject) => {
        timer = setTimeout(() => {
          reject(
            new Error(
              `Supabase request timed out after ${SUPABASE_REQUEST_TIMEOUT_MS}ms.`,
            ),
          );
        }, SUPABASE_REQUEST_TIMEOUT_MS);
      }),
    ])) as Response;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    fetch: supabaseFetch,
  },
});

export function createServerSupabaseClient(accessToken: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      fetch: supabaseFetch,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}
