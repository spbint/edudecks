import "server-only";

import { redirect, notFound } from "next/navigation";
import { getServerAuthClient } from "@/lib/auth/serverRouteAuth";
import { canAccessAssessmentLab } from "./assessmentPermissions";

export async function requireAssessmentLabAccess(loginNext: string) {
  const supabase = await getServerAuthClient();
  const userResult = await supabase.auth.getUser();
  const user = userResult.data.user;

  if (userResult.error || !user) {
    redirect(`/login?next=${encodeURIComponent(loginNext)}`);
  }

  const profile = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (
    profile.error ||
    profile.data?.is_admin !== true ||
    !canAccessAssessmentLab({ id: user.id }, { is_admin: true })
  ) {
    notFound();
  }

  return { id: user.id };
}
