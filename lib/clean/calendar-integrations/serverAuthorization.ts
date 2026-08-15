import type { SupabaseClient } from "@supabase/supabase-js";
import { getServerAuthClient } from "@/lib/auth/serverRouteAuth";
import type { FamilyMemberRole } from "@/lib/clean/family/types";
import { canManageCalendarIntegrations } from "@/lib/clean/calendar-integrations/authorization";
import type { CalendarIntegrationManagerContext } from "@/lib/clean/calendar-integrations/types";

export class CalendarRouteAuthorizationError extends Error {
  constructor(
    public readonly status: 401 | 403,
    public readonly code: "unauthenticated" | "forbidden",
  ) {
    super(
      status === 401
        ? "Sign in to manage calendar connections."
        : "Only a family owner or parent can manage calendar connections.",
    );
    this.name = "CalendarRouteAuthorizationError";
  }
}

async function requireCalendarFamilyMembership(familyId: string) {
  const supabase = await getServerAuthClient();
  const userResponse = await supabase.auth.getUser();
  const user = userResponse.data.user;
  if (userResponse.error || !user) {
    throw new CalendarRouteAuthorizationError(401, "unauthenticated");
  }

  const membershipResponse = await supabase
    .from("family_members")
    .select("family_id,user_id,role")
    .eq("family_id", familyId)
    .eq("user_id", user.id)
    .maybeSingle();
  const role = String(membershipResponse.data?.role ?? "") as FamilyMemberRole;
  if (membershipResponse.error || !membershipResponse.data) {
    throw new CalendarRouteAuthorizationError(403, "forbidden");
  }
  return { supabase, user, role };
}

export async function authorizeCalendarFamilyMember(familyId: string) {
  const authorized = await requireCalendarFamilyMembership(familyId);
  return {
    supabase: authorized.supabase,
    context: {
      familyId,
      userId: authorized.user.id,
      role: authorized.role,
    } satisfies CalendarIntegrationManagerContext,
  };
}

export async function authorizeCalendarIntegrationManager(
  familyId: string,
): Promise<{
  supabase: SupabaseClient;
  context: CalendarIntegrationManagerContext;
}> {
  const authorized = await requireCalendarFamilyMembership(familyId);
  if (!canManageCalendarIntegrations(authorized.role)) {
    throw new CalendarRouteAuthorizationError(403, "forbidden");
  }

  return {
    supabase: authorized.supabase,
    context: {
      familyId,
      userId: authorized.user.id,
      role: authorized.role,
    },
  };
}
