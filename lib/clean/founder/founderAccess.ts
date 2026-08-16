import { notFound, redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { getServerAuthClient } from "@/lib/auth/serverRouteAuth";

export type FounderAccessDecision = "allowed" | "forbidden" | "unauthenticated";

export function getFounderAccessDecision(
  user: Pick<User, "id"> | null,
  profile: { is_admin?: boolean | null } | null,
  profileError = false,
): FounderAccessDecision {
  if (!user) return "unauthenticated";
  if (profileError || profile?.is_admin !== true) return "forbidden";
  return "allowed";
}

export async function requireFounderAccess() {
  const supabase = await getServerAuthClient();
  const userResult = await supabase.auth.getUser();
  const user = userResult.data.user ?? null;

  if (!user || userResult.error) {
    redirect("/login?next=%2Ffounder");
  }

  const profileResult = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (getFounderAccessDecision(user, profileResult.data, Boolean(profileResult.error)) !== "allowed") {
    notFound();
  }

  return user;
}

