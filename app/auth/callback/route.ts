import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function safe(v: unknown) {
  return String(v ?? "").trim();
}

function getSiteUrl(req: NextRequest) {
  const envUrl = safe(process.env.NEXT_PUBLIC_APP_URL);
  if (envUrl) return envUrl.replace(/\/+$/, "");

  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}

function buildRedirect(req: NextRequest, pathname: string) {
  const base = getSiteUrl(req);
  return new URL(pathname, base);
}

export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url);

  const code = safe(requestUrl.searchParams.get("code"));
  const nextParam = safe(requestUrl.searchParams.get("next"));
  const error = safe(requestUrl.searchParams.get("error"));
  const errorDescription = safe(requestUrl.searchParams.get("error_description"));

  if (error) {
    const loginUrl = buildRedirect(req, "/login");
    loginUrl.searchParams.set("authError", errorDescription || error);
    return NextResponse.redirect(loginUrl);
  }

  const supabaseUrl = safe(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseAnonKey = safe(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!supabaseUrl || !supabaseAnonKey) {
    const loginUrl = buildRedirect(req, "/login");
    loginUrl.searchParams.set(
      "authError",
      "Supabase environment variables are missing."
    );
    return NextResponse.redirect(loginUrl);
  }

  const redirectPath =
    nextParam && nextParam.startsWith("/") ? nextParam : "/family";

  try {
    if (!code) {
      const fallbackUrl = buildRedirect(req, redirectPath);
      fallbackUrl.searchParams.set(
        "authMessage",
        "No auth code was returned. Please try again."
      );
      return NextResponse.redirect(fallbackUrl);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    const { data, error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      const loginUrl = buildRedirect(req, "/login");
      loginUrl.searchParams.set(
        "authError",
        safe(exchangeError.message) || "Could not complete sign-in."
      );
      return NextResponse.redirect(loginUrl);
    }

    const accessToken = safe(data.session?.access_token);
    const refreshToken = safe(data.session?.refresh_token);

    const response = NextResponse.redirect(buildRedirect(req, redirectPath));

    if (accessToken && refreshToken) {
      response.cookies.set("sb-access-token", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60,
      });

      response.cookies.set("sb-refresh-token", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
    }

    return response;
  } catch (err: any) {
    const loginUrl = buildRedirect(req, "/login");
    loginUrl.searchParams.set(
      "authError",
      safe(err?.message) || "Something went wrong during authentication."
    );
    return NextResponse.redirect(loginUrl);
  }
}