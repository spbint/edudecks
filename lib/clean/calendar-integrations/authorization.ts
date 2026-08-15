import type { FamilyMemberRole } from "@/lib/clean/family/types";

export function canManageCalendarIntegrations(role: FamilyMemberRole | null) {
  return role === "owner" || role === "parent";
}
