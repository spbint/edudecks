import { NextRequest, NextResponse } from "next/server";
import {
  CalendarFeedManagementError,
  createAppleCalendarFeed,
  getAppleCalendarFeedStatus,
  revokeAppleCalendarFeed,
  rotateAppleCalendarFeed,
} from "@/lib/clean/calendar-integrations/management";
import {
  CalendarRouteAuthorizationError,
  authorizeCalendarIntegrationManager,
} from "@/lib/clean/calendar-integrations/serverAuthorization";
import { createCalendarFeedManagementStore } from "@/lib/clean/calendar-integrations/serverRepositories";
import { buildCalendarFeedAddress } from "@/lib/clean/calendar-integrations/urls";
import type { CalendarFeedSubscriptionMetadata } from "@/lib/clean/calendar-integrations/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function noStoreJson(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "cache-control": "private, no-store" },
  });
}

function validFamilyId(value: unknown) {
  const familyId = String(value ?? "").trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    familyId,
  )
    ? familyId
    : null;
}

function safeMetadata(metadata: CalendarFeedSubscriptionMetadata | null) {
  if (!metadata) return null;
  return {
    status: metadata.status,
    createdAt: metadata.createdAt,
    updatedAt: metadata.updatedAt,
    rotatedAt: metadata.rotatedAt,
    revokedAt: metadata.revokedAt,
    lastAccessedAt: metadata.lastAccessedAt,
  };
}

function mutationOriginAllowed(request: NextRequest) {
  const origin = request.headers.get("origin");
  return Boolean(origin && origin === request.nextUrl.origin);
}

async function readFamilyId(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    return validFamilyId(body.familyId);
  } catch {
    return null;
  }
}

function errorResponse(error: unknown) {
  if (error instanceof CalendarRouteAuthorizationError) {
    return noStoreJson({ ok: false, code: error.code, error: error.message }, error.status);
  }
  if (error instanceof CalendarFeedManagementError) {
    const status =
      error.code === "forbidden" ? 403 : error.code === "already_active" ? 409 : 404;
    return noStoreJson({ ok: false, code: error.code, error: error.message }, status);
  }
  return noStoreJson(
    {
      ok: false,
      code: "calendar_connection_failed",
      error: "Apple Calendar could not be updated right now.",
    },
    500,
  );
}

async function authorize(familyId: string) {
  const authorized = await authorizeCalendarIntegrationManager(familyId);
  return {
    context: authorized.context,
    store: createCalendarFeedManagementStore(authorized.supabase),
  };
}

export async function GET(request: NextRequest) {
  const familyId = validFamilyId(request.nextUrl.searchParams.get("familyId"));
  if (!familyId) {
    return noStoreJson({ ok: false, code: "invalid_family" }, 400);
  }

  try {
    const { context, store } = await authorize(familyId);
    const metadata = await getAppleCalendarFeedStatus(context, store);
    return noStoreJson({
      ok: true,
      status: metadata?.status === "active" ? "active" : "not_connected",
      metadata: safeMetadata(metadata),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  if (!mutationOriginAllowed(request)) {
    return noStoreJson({ ok: false, code: "invalid_origin" }, 403);
  }
  const familyId = await readFamilyId(request);
  if (!familyId) return noStoreJson({ ok: false, code: "invalid_family" }, 400);

  try {
    const { context, store } = await authorize(familyId);
    const result = await createAppleCalendarFeed(context, store);
    return noStoreJson(
      {
        ok: true,
        status: "active",
        metadata: safeMetadata(result.subscription),
        feedAddress: buildCalendarFeedAddress(
          request.nextUrl.origin,
          result.tokenPrefix,
        ),
        subscriptionPassword: result.rawToken,
      },
      201,
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  if (!mutationOriginAllowed(request)) {
    return noStoreJson({ ok: false, code: "invalid_origin" }, 403);
  }
  const familyId = await readFamilyId(request);
  if (!familyId) return noStoreJson({ ok: false, code: "invalid_family" }, 400);

  try {
    const { context, store } = await authorize(familyId);
    const result = await rotateAppleCalendarFeed(context, store);
    return noStoreJson({
      ok: true,
      status: "active",
      metadata: safeMetadata(result.subscription),
      feedAddress: buildCalendarFeedAddress(
        request.nextUrl.origin,
        result.tokenPrefix,
      ),
      subscriptionPassword: result.rawToken,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: NextRequest) {
  if (!mutationOriginAllowed(request)) {
    return noStoreJson({ ok: false, code: "invalid_origin" }, 403);
  }
  const familyId = await readFamilyId(request);
  if (!familyId) return noStoreJson({ ok: false, code: "invalid_family" }, 400);

  try {
    const { context, store } = await authorize(familyId);
    const metadata = await revokeAppleCalendarFeed(context, store);
    return noStoreJson({
      ok: true,
      status: "not_connected",
      metadata: safeMetadata(metadata),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
