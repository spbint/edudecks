import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { processGoogleCalendarSyncBatch } from "@/lib/clean/calendar-integrations/googleSync";
import { processMicrosoftCalendarSyncBatch } from "@/lib/clean/calendar-integrations/microsoftSync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function validCronAuthorization(request: NextRequest) {
  const secret = String(process.env.CRON_SECRET ?? "").trim();
  const authorization = request.headers.get("authorization") ?? "";
  if (!secret) return false;
  const expected = Buffer.from(`Bearer ${secret}`, "utf8");
  const received = Buffer.from(authorization, "utf8");
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export async function GET(request: NextRequest) {
  if (!validCronAuthorization(request)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  try {
    const [google, microsoft] = await Promise.all([
      processGoogleCalendarSyncBatch({ limit: 100 }),
      processMicrosoftCalendarSyncBatch({ limit: 100 }),
    ]);
    return NextResponse.json({ google, microsoft }, {
      headers: { "cache-control": "private, no-store" },
    });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
