import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getAuthenticatedRouteUser } from "@/lib/auth/serverRouteAuth";
import {
  MATHS_STARTING_POINT_RELEASE,
} from "@/lib/clean/assessments/mathsStartingPointRelease";
import type {
  NumberOperationsBaselinePersistenceDraft,
} from "@/lib/clean/assessments/placement/numberOperationsPersistenceDraft";
import {
  buildTrustedNumberOperationsBaselinePersistenceDraft,
} from "@/lib/clean/assessments/placement/numberOperationsPersistenceRouteReplay";
import {
  createServerSupabaseClient,
  supabaseUrl,
} from "@/lib/supabaseClient";

export const runtime = "nodejs";

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function createAdminClient() {
  const serviceRoleKey = safe(
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY,
  );
  if (!supabaseUrl || !serviceRoleKey) return null;

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

async function authenticatedUser(request: Request) {
  let user = await getAuthenticatedRouteUser();
  if (user) return user;

  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : "";
  if (!token) return null;

  const tokenClient = createServerSupabaseClient(token);
  const result = await tokenClient.auth.getUser();
  return result.data.user ?? null;
}

export async function POST(request: Request) {
  if (!MATHS_STARTING_POINT_RELEASE.persistenceEnabled) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Maths starting-point persistence is not enabled for this release phase.",
      },
      { status: 409 },
    );
  }

  const user = await authenticatedUser(request);
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Sign in to save this Maths starting point." },
      { status: 401 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid save request." },
      { status: 400 },
    );
  }

  const familyId = safe(body.familyId);
  const learnerId = safe(body.learnerId);
  const clientSubmissionId = safe(body.clientSubmissionId);
  const draft = body.draft as NumberOperationsBaselinePersistenceDraft | undefined;

  if (
    !familyId ||
    !learnerId ||
    clientSubmissionId.length < 8 ||
    clientSubmissionId.length > 128 ||
    /\s/.test(clientSubmissionId) ||
    !draft
  ) {
    return NextResponse.json(
      { ok: false, error: "Invalid baseline save request." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      { ok: false, error: "Baseline persistence is not configured." },
      { status: 500 },
    );
  }

  if (!MATHS_STARTING_POINT_RELEASE.customerVisible) {
    const staffProfile = await admin
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();

    if (staffProfile.error) {
      return NextResponse.json(
        { ok: false, error: "Could not verify preview access." },
        { status: 500 },
      );
    }
    if (!staffProfile.data?.is_admin) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Maths starting-point persistence is currently limited to authorised staff preview.",
        },
        { status: 403 },
      );
    }
  }

  const membership = await admin
    .from("family_members")
    .select("id,role")
    .eq("family_id", familyId)
    .eq("user_id", user.id)
    .in("role", ["owner", "parent", "caregiver"])
    .maybeSingle();

  if (membership.error) {
    return NextResponse.json(
      { ok: false, error: "Could not verify family access." },
      { status: 500 },
    );
  }
  if (!membership.data) {
    return NextResponse.json(
      { ok: false, error: "Family workspace unavailable." },
      { status: 403 },
    );
  }

  const learner = await admin
    .from("learners")
    .select("id")
    .eq("id", learnerId)
    .eq("family_id", familyId)
    .maybeSingle();

  if (learner.error) {
    return NextResponse.json(
      { ok: false, error: "Could not verify learner access." },
      { status: 500 },
    );
  }
  if (!learner.data) {
    return NextResponse.json(
      { ok: false, error: "Choose a learner from this family." },
      { status: 403 },
    );
  }

  let trusted: NumberOperationsBaselinePersistenceDraft;
  try {
    trusted = buildTrustedNumberOperationsBaselinePersistenceDraft(draft, {
      allowNonPublishedItems: !MATHS_STARTING_POINT_RELEASE.customerVisible,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "The assessment evidence could not be validated." },
      { status: 400 },
    );
  }

  const save = await admin.rpc("mylearna_save_number_operations_baseline", {
    p_actor_user_id: user.id,
    p_family_id: familyId,
    p_learner_id: learnerId,
    p_client_submission_id: clientSubmissionId,
    p_attempt: trusted.attempt,
    p_responses: trusted.responses,
  });

  if (save.error) {
    return NextResponse.json(
      { ok: false, error: "The Maths starting point could not be saved." },
      { status: 500 },
    );
  }

  const attemptId = safe(save.data);
  if (!attemptId) {
    return NextResponse.json(
      { ok: false, error: "The save completed without an attempt id." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, attemptId });
}
