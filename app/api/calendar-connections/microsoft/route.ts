import { NextRequest, NextResponse } from "next/server";
import {
  CalendarRouteAuthorizationError,
  authorizeCalendarIntegrationManager,
} from "@/lib/clean/calendar-integrations/serverAuthorization";
import {
  MicrosoftConnectionError,
  disconnectMicrosoftCalendar,
  startMicrosoftCalendarConnection,
} from "@/lib/clean/calendar-integrations/microsoftConnectionService";
import { microsoftCalendarEnvironmentReady } from "@/lib/clean/calendar-integrations/microsoftOAuth";
import {
  MicrosoftCalendarRepository,
  toMicrosoftConnectionMetadata,
} from "@/lib/clean/calendar-integrations/microsoftRepository";
import { processMicrosoftCalendarSyncBatch } from "@/lib/clean/calendar-integrations/microsoftSync";

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
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    id,
  )
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
  if (
    error instanceof MicrosoftConnectionError &&
    error.code === "not_connected"
  ) {
    return json({ ok: false, code: error.code }, 404);
  }
  return json({ ok: false, code: "microsoft_calendar_unavailable" }, 503);
}

export async function GET(request: NextRequest) {
  const id = familyId(request.nextUrl.searchParams.get("familyId"));
  if (!id) return json({ ok: false, code: "invalid_family" }, 400);
  try {
    await authorizeCalendarIntegrationManager(id);
    if (!microsoftCalendarEnvironmentReady()) {
      return json({ ok: true, status: "unavailable", metadata: null });
    }
    const connection = await new MicrosoftCalendarRepository().getConnection(id);
    const active = connection && connection.status !== "disconnected";
    return json({
      ok: true,
      status: active ? connection.status : "not_connected",
      metadata: connection ? toMicrosoftConnectionMetadata(connection) : null,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) {
    return json({ ok: false, code: "invalid_origin" }, 403);
  }
  const id = await bodyFamilyId(request);
  if (!id) return json({ ok: false, code: "invalid_family" }, 400);
  try {
    const authorized = await authorizeCalendarIntegrationManager(id);
    const result = await startMicrosoftCalendarConnection({
      familyId: id,
      userId: authorized.context.userId,
    });
    return json({ ok: true, authorizationUrl: result.authorizationUrl }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  if (!sameOrigin(request)) {
    return json({ ok: false, code: "invalid_origin" }, 403);
  }
  const id = await bodyFamilyId(request);
  if (!id) return json({ ok: false, code: "invalid_family" }, 400);
  try {
    await authorizeCalendarIntegrationManager(id);
    const repository = new MicrosoftCalendarRepository();
    await repository.enqueueFamily(id);
    const result = await processMicrosoftCalendarSyncBatch({
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
  if (!sameOrigin(request)) {
    return json({ ok: false, code: "invalid_origin" }, 403);
  }
  const id = await bodyFamilyId(request);
  if (!id) return json({ ok: false, code: "invalid_family" }, 400);
  try {
    await authorizeCalendarIntegrationManager(id);
    const result = await disconnectMicrosoftCalendar({ familyId: id });
    return json({ ok: true, ...result });
  } catch (error) {
    return errorResponse(error);
  }
}
