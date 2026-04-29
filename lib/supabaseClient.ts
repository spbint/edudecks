import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const hasSupabaseEnv = Boolean(supabaseUrl && supabaseAnonKey);
const SUPABASE_REQUEST_TIMEOUT_MS = 20000;

if (!hasSupabaseEnv) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Configure explicit Supabase environment values to avoid writing to the wrong project.",
  );
}

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

export const supabase = createClient(
  supabaseUrl as string,
  supabaseAnonKey as string,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    global: {
      fetch: supabaseFetch,
    },
  },
);

export function createServerSupabaseClient(accessToken: string) {
  return createClient(supabaseUrl as string, supabaseAnonKey as string, {
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
