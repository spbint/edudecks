import { createBrowserClient } from "@supabase/auth-helpers-nextjs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const MISSING_PUBLIC_SUPABASE_ENV_MESSAGE =
  "Missing Supabase public environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY before using MyLearna.";

export const supabaseUrl = String(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
export const supabaseAnonKey = String(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

export const hasSupabaseEnv = Boolean(supabaseUrl && supabaseAnonKey);
const SUPABASE_REQUEST_TIMEOUT_MS = 20000;
const SUPABASE_STORAGE_UPLOAD_TIMEOUT_MS = 60000;

export function requireSupabasePublicEnv() {
  if (!hasSupabaseEnv) {
    throw new Error(MISSING_PUBLIC_SUPABASE_ENV_MESSAGE);
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
  };
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
  const requestUrl =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.toString()
        : "url" in input
          ? String(input.url)
          : "";
  const timeoutMs = requestUrl.includes("/storage/v1/object/")
    ? SUPABASE_STORAGE_UPLOAD_TIMEOUT_MS
    : SUPABASE_REQUEST_TIMEOUT_MS;

  try {
    return (await Promise.race([
      fetch(input, init),
      new Promise<Response>((_, reject) => {
        timer = setTimeout(() => {
          reject(
            new Error(
              `Supabase request timed out after ${timeoutMs}ms.`,
            ),
          );
        }, timeoutMs);
      }),
    ])) as Response;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function createMissingEnvSupabaseProxy() {
  return new Proxy(
    {},
    {
      get() {
        throw new Error(MISSING_PUBLIC_SUPABASE_ENV_MESSAGE);
      },
    },
  ) as SupabaseClient;
}

function createConfiguredSupabaseClient() {
  const config = requireSupabasePublicEnv();

  if (typeof window === "undefined") {
    return createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        fetch: supabaseFetch,
      },
    });
  }

  return createBrowserClient(config.supabaseUrl, config.supabaseAnonKey, {
    isSingleton: true,
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    global: {
      fetch: supabaseFetch,
    },
  });
}

export const supabase = hasSupabaseEnv
  ? createConfiguredSupabaseClient()
  : createMissingEnvSupabaseProxy();

export function createServerSupabaseClient(accessToken: string) {
  const config = requireSupabasePublicEnv();

  return createClient(config.supabaseUrl, config.supabaseAnonKey, {
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
