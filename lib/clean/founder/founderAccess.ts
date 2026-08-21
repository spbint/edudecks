import { notFound, redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { getServerAuthClient } from "@/lib/auth/serverRouteAuth";
import { FOUNDER_EMAIL } from "@/lib/clean/founder/founderIdentity";

export type FounderAccessDecision = "allowed" | "forbidden" | "unauthenticated";

export type FounderAccessContext = {
  decision: FounderAccessDecision;
  user: User | null;
};

export function getFounderAccessDecision(
  user: Pick<User, "id" | "email"> | null,
  profile: { is_admin?: boolean | null } | null,
  profileError = false,
): FounderAccessDecision {
  if (!user) return "unauthenticated";
  if (user.email?.trim().toLowerCase() !== FOUNDER_EMAIL) return "forbidden";
  if (profileError || profile?.is_admin !== true) return "forbidden";
  return "allowed";
}

export async function getFounderAccessContext(): Promise<FounderAccessContext> {
  const supabase = await getServerAuthClient();
  const userResult = await supabase.auth.getUser();
  const user = userResult.data.user ?? null;

  if (!user || userResult.error) {
    return { decision: "unauthenticated", user: null };
  }

  const profileResult = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  return {
    decision: getFounderAccessDecision(user, profileResult.data, Boolean(profileResult.error)),
    user,
  };
}

export async function requireFounderAccess() {
  const access = await getFounderAccessContext();
  if (access.decision === "unauthenticated") redirect("/founder/login");
  if (access.decision !== "allowed") notFound();

  return access.user;
}
