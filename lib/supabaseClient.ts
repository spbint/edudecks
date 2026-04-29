import { createClient } from "@supabase/supabase-js";

const bundledPublicSupabaseUrl = "https://jgllsqixpfypunnstinl.supabase.co";
const bundledPublicSupabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpnbGxzcWl4cGZ5cHVubnN0aW5sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MTc0MDYsImV4cCI6MjA4MjQ5MzQwNn0.YYKiRuxYye7_iDfQ4nZ6U4pFiTVtt1lIGSSwQa98CBE";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || bundledPublicSupabaseUrl;
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || bundledPublicSupabaseAnonKey;

export const hasSupabaseEnv = Boolean(supabaseUrl && supabaseAnonKey);
const SUPABASE_REQUEST_TIMEOUT_MS = 20000;

if (
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
) {
  console.warn(
    "Supabase public environment variables are missing. Using bundled public project auth configuration as a fallback.",
  );
}

function extractSupabaseProjectRef(url: string) {
  const match = url.match(/^https:\/\/([a-z0-9-]+)\.supabase\.co/i);
  return match?.[1] ?? null;
}

export function getSupabaseProjectRef() {
  return extractSupabaseProjectRef(supabaseUrl);
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
  supabaseUrl,
  supabaseAnonKey,
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
