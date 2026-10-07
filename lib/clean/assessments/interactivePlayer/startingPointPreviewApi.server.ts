import "server-only";

import { canAccessAssessmentLab } from "@/lib/clean/assessments/assessmentPermissions";
import { getServerAuthClient } from "@/lib/auth/serverRouteAuth";

export async function hasStartingPointPreviewApiAccess() {
  const supabase = await getServerAuthClient();
  const userResult = await supabase.auth.getUser();
  const user = userResult.data.user;
  if (userResult.error || !user) return false;

  const profile = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  return Boolean(
    !profile.error &&
      profile.data?.is_admin === true &&
      canAccessAssessmentLab({ id: user.id }, { is_admin: true }),
  );
}
