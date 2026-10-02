import "server-only";

import { getServerAuthClient } from "@/lib/auth/serverRouteAuth";
import { canAccessAssessmentLab } from "@/lib/clean/assessments/assessmentPermissions";
import { isTrustedAssetProofEnabled } from "./environment";

export type ProofAccess =
  | { allowed: true; status: 200 }
  | { allowed: false; status: 401 | 403 | 404 | 503 };

/** No service-role client, email shortcut, client role, user_metadata trust, or write. */
export async function getTrustedAssetProofAccess(): Promise<ProofAccess> {
  if (!isTrustedAssetProofEnabled({
    MYLEARNA_ASSESS_ASSET_PROOF: process.env.MYLEARNA_ASSESS_ASSET_PROOF,
    VERCEL_ENV: process.env.VERCEL_ENV,
    NODE_ENV: process.env.NODE_ENV,
  })) return { allowed: false, status: 404 };
  try {
    const supabase = await getServerAuthClient();
    const result = await supabase.auth.getUser();
    const user = result.data.user;
    if (result.error || !user) return { allowed: false, status: 401 };
    const profile = await supabase.from("profiles").select("is_admin")
      .eq("id", user.id).maybeSingle();
    // Strict boolean, fetched server-side under the verified user's session.
    if (profile.error || profile.data?.is_admin !== true) {
      return { allowed: false, status: 403 };
    }
    if (!canAccessAssessmentLab({ id: user.id }, { is_admin: true })) {
      return { allowed: false, status: 403 };
    }
    return { allowed: true, status: 200 };
  } catch {
    // Fail closed without exposing configuration, user identifiers or auth errors.
    return { allowed: false, status: 503 };
  }
}
