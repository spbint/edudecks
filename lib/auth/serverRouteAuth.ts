import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseAnonKey, supabaseUrl } from "@/lib/supabaseClient";

async function getServerAuthClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll() {
        // Server route layouts only need to read the session before render.
      },
    },
  });
}

export async function getAuthenticatedRouteUser() {
  const supabase = await getServerAuthClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  return data.user;
}

export async function requireAuthenticatedRoute(loginNext: string) {
  const user = await getAuthenticatedRouteUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(loginNext)}`);
  }

  return user;
}
