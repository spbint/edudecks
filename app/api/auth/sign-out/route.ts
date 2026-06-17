import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requireSupabasePublicEnv } from "@/lib/supabaseClient";

export const runtime = "nodejs";

function isSupabaseAuthCookie(name: string) {
  return (
    name === "supabase-auth-token" ||
    name.startsWith("supabase-auth-token.") ||
    (name.startsWith("sb-") &&
      (name.includes("-auth-token") || name.endsWith("-code-verifier")))
  );
}

function expireAuthCookies(response: NextResponse, cookieNames: string[]) {
  for (const name of cookieNames) {
    if (!isSupabaseAuthCookie(name)) continue;

    response.cookies.set(name, "", {
      httpOnly: false,
      maxAge: 0,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }
}

export async function POST() {
  const cookieStore = await cookies();
  const response = NextResponse.json({ ok: true, status: "signed_out" });
  const initialCookieNames = cookieStore.getAll().map((cookie) => cookie.name);

  try {
    const config = requireSupabasePublicEnv();
    const supabase = createServerClient(config.supabaseUrl, config.supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    });

    const { error } = await supabase.auth.signOut({ scope: "global" });
    if (error) {
      console.warn("[auth] server sign-out failed", { message: error.message });
    }
  } catch (error) {
    console.warn("[auth] server sign-out cleanup failed", {
      message: (error as { message?: unknown } | null)?.message,
    });
  }

  expireAuthCookies(response, initialCookieNames);
  return response;
}
