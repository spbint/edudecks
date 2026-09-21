import EmailAuthPage from "@/app/components/EmailAuthPage";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedRouteUser } from "@/lib/auth/serverRouteAuth";
import { MISSING_PUBLIC_SUPABASE_ENV_MESSAGE } from "@/lib/supabaseClient";
import { buildPublicMetadata } from "@/app/lib/publicMetadata";
import { normalizeAuthNextPath } from "@/lib/authRedirect";

export const metadata: Metadata = buildPublicMetadata({
  title: "Sign In to MyLearna | Homeschool Record Keeping",
  description:
    "Sign in to MyLearna to continue your homeschool record keeping, planning, portfolio, and reporting workflow.",
  path: "/login",
});

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const params = await searchParams;
  const rawNext = Array.isArray(params.next) ? params.next[0] : params.next;
  const nextPath = normalizeAuthNextPath(rawNext, "/my-day");

  try {
    const user = await getAuthenticatedRouteUser();

    if (user) {
      redirect(nextPath);
    }
  } catch (error) {
    const message = String((error as { message?: unknown })?.message ?? "").trim();
    if (message && message === MISSING_PUBLIC_SUPABASE_ENV_MESSAGE) {
      return <EmailAuthPage mode="login" />;
    }

    throw error;
  }

  return <EmailAuthPage mode="login" />;
}
