import { NextResponse } from "next/server";
import { getServerAuthClient } from "@/lib/auth/serverRouteAuth";
import { canAccessAssessmentLab } from "@/lib/clean/assessments/assessmentPermissions";
import {
  createStaffLearningEvidenceSmokeClient,
} from "@/lib/clean/educationalIntelligence/persistence/staffLearningEvidenceSmokeEnvironment.server";
import {
  loadStaffLearningEvidenceHistory,
  parseStaffLearningEvidenceSaveRequest,
  saveTrustedStaffLearningEvidence,
  StaffLearningEvidenceSmokeError,
} from "@/lib/clean/educationalIntelligence/persistence/staffLearningEvidenceSmoke.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
};

async function requireStaffApiAccess() {
  const auth = await getServerAuthClient();
  const userResult = await auth.auth.getUser();
  const user = userResult.data.user;
  if (userResult.error || !user) {
    throw new StaffLearningEvidenceSmokeError("Authentication required.", 401);
  }
  const profile = await auth
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (
    profile.error ||
    profile.data?.is_admin !== true ||
    !canAccessAssessmentLab({ id: user.id }, { is_admin: true })
  ) {
    throw new StaffLearningEvidenceSmokeError("Staff access required.", 404);
  }
  return user;
}
function errorResponse(error: unknown) {
  if (error instanceof StaffLearningEvidenceSmokeError) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: error.status, headers: NO_STORE_HEADERS },
    );
  }
  return NextResponse.json(
    { ok: false, error: "The staff persistence smoke is unavailable." },
    { status: 503, headers: NO_STORE_HEADERS },
  );
}

export async function POST(request: Request) {
  try {
    const user = await requireStaffApiAccess();
    const raw = await request.json().catch(() => null);
    const parsed = parseStaffLearningEvidenceSaveRequest(raw);
    const { client } = createStaffLearningEvidenceSmokeClient();
    const result = await saveTrustedStaffLearningEvidence({
      client,
      actorUserId: user.id,
      request: parsed,
    });
    return NextResponse.json(
      { ok: true, ...result },
      { headers: NO_STORE_HEADERS },
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function GET(request: Request) {
  try {
    const user = await requireStaffApiAccess();
    const url = new URL(request.url);
    const { client } = createStaffLearningEvidenceSmokeClient();
    const history = await loadStaffLearningEvidenceHistory({
      client,
      actorUserId: user.id,
      familyId: url.searchParams.get("familyId") ?? "",
      learnerId: url.searchParams.get("learnerId") ?? "",
    });
    return NextResponse.json(
      { ok: true, history },
      { headers: NO_STORE_HEADERS },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
