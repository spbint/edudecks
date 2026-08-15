import { NextRequest, NextResponse } from "next/server";
import {
  CalendarRouteAuthorizationError,
  authorizeCalendarIntegrationManager,
} from "@/lib/clean/calendar-integrations/serverAuthorization";
import {
  GoogleConnectionError,
  disconnectGoogleCalendar,
  startGoogleCalendarConnection,
} from "@/lib/clean/calendar-integrations/googleConnectionService";
import {
  GoogleCalendarRepository,
  toGoogleConnectionMetadata,
} from "@/lib/clean/calendar-integrations/googleRepository";
import { googleCalendarEnvironmentReady } from "@/lib/clean/calendar-integrations/googleOAuth";
import { processGoogleCalendarSyncBatch } from "@/lib/clean/calendar-integrations/googleSync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "cache-control": "private, no-store" },
  });
}

function familyId(value: unknown) {
  const id = String(value ?? "").trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
    ? id
    : null;
}

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  return Boolean(origin && origin === request.nextUrl.origin);
}

async function bodyFamilyId(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    return familyId(body.familyId);
  } catch {
    return null;
  }
}

function errorResponse(error: unknown) {
  if (error instanceof CalendarRouteAuthorizationError) {
    return json({ ok: false, code: error.code }, error.status);
  }
  if (error instanceof GoogleConnectionError && error.code === "not_connected") {
    return json({ ok: false, code: error.code }, 404);
  }
  return json({ ok: false, code: "google_calendar_unavailable" }, 503);
}

export async function GET(request: NextRequest) {
  const id = familyId(request.nextUrl.searchParams.get("familyId"));
  if (!id) return json({ ok: false, code: "invalid_family" }, 400);
  try {
    await authorizeCalendarIntegrationManager(id);
    if (!googleCalendarEnvironmentReady()) {
      return json({ ok: true, status: "unavailable", metadata: null });
    }
    const connection = await new GoogleCalendarRepository().getConnection(id);
    const active = connection && connection.status !== "disconnected";
    return json({
      ok: true,
      status: active ? connection.status : "not_connected",
      metadata: connection ? toGoogleConnectionMetadata(connection) : null,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return json({ ok: false, code: "invalid_origin" }, 403);
  const id = await bodyFamilyId(request);
  if (!id) return json({ ok: false, code: "invalid_family" }, 400);
  try {
    const authorized = await authorizeCalendarIntegrationManager(id);
    const result = await startGoogleCalendarConnection({
      familyId: id,
      userId: authorized.context.userId,
    });
    return json({ ok: true, authorizationUrl: result.authorizationUrl }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  if (!sameOrigin(request)) return json({ ok: false, code: "invalid_origin" }, 403);
  const id = await bodyFamilyId(request);
  if (!id) return json({ ok: false, code: "invalid_family" }, 400);
  try {
    await authorizeCalendarIntegrationManager(id);
    const repository = new GoogleCalendarRepository();
    await repository.enqueueFamily(id);
    const result = await processGoogleCalendarSyncBatch({
      familyId: id,
      limit: 50,
      repository,
    });
    return json({ ok: true, result });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: NextRequest) {
  if (!sameOrigin(request)) return json({ ok: false, code: "invalid_origin" }, 403);
  const id = await bodyFamilyId(request);
  if (!id) return json({ ok: false, code: "invalid_family" }, 400);
  try {
    await authorizeCalendarIntegrationManager(id);
    const result = await disconnectGoogleCalendar({ familyId: id });
    return json({ ok: true, ...result });
  } catch (error) {
    return errorResponse(error);
  }
}
