import { NextRequest, NextResponse } from "next/server";
import { processGoogleCalendarSyncBatch } from "@/lib/clean/calendar-integrations/googleSync";
import { processMicrosoftCalendarSyncBatch } from "@/lib/clean/calendar-integrations/microsoftSync";
import {
  CalendarRouteAuthorizationError,
  authorizeCalendarFamilyMember,
} from "@/lib/clean/calendar-integrations/serverAuthorization";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function familyId(value: unknown) {
  const id = String(value ?? "").trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
    ? id
    : null;
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== request.nextUrl.origin) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const id = familyId(body.familyId);
    if (!id) return NextResponse.json({ ok: false }, { status: 400 });
    await authorizeCalendarFamilyMember(id);
    const [google, microsoft] = await Promise.all([
      processGoogleCalendarSyncBatch({ familyId: id, limit: 25 }),
      processMicrosoftCalendarSyncBatch({ familyId: id, limit: 25 }),
    ]);
    const result = {
      claimed: google.claimed + microsoft.claimed,
      succeeded: google.succeeded + microsoft.succeeded,
      failed: google.failed + microsoft.failed,
    };
    return NextResponse.json(
      { ok: true, result },
      { status: 202, headers: { "cache-control": "private, no-store" } },
    );
  } catch (error) {
    const status = error instanceof CalendarRouteAuthorizationError ? error.status : 503;
    return NextResponse.json({ ok: false }, { status });
  }
}
