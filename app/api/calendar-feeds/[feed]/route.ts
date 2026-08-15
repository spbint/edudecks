import { NextResponse } from "next/server";
import { readCalendarFeedPassword } from "@/lib/clean/calendar-integrations/basicAuth";
import { renderICalendar } from "@/lib/clean/calendar-integrations/ics";
import { loadAppleCalendarFeed } from "@/lib/clean/calendar-integrations/publicFeed";
import { createCalendarFeedReadStore } from "@/lib/clean/calendar-integrations/serverRepositories";
import { parseCalendarFeedPathSegment } from "@/lib/clean/calendar-integrations/urls";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PRIVATE_HEADERS = {
  "cache-control": "private, no-store",
  "x-robots-tag": "noindex, nofollow, noarchive",
};

function notFound() {
  return new NextResponse("Not found", {
    status: 404,
    headers: PRIVATE_HEADERS,
  });
}

function authenticationRequired() {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      ...PRIVATE_HEADERS,
      "www-authenticate": 'Basic realm="MyLearna Calendar", charset="UTF-8"',
    },
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ feed: string }> },
) {
  const { feed } = await params;
  const tokenPrefix = parseCalendarFeedPathSegment(feed);
  if (!tokenPrefix) return notFound();
  const rawToken = readCalendarFeedPassword(
    request.headers.get("authorization"),
  );
  if (!rawToken) return authenticationRequired();

  try {
    const result = await loadAppleCalendarFeed(
      rawToken,
      tokenPrefix,
      createCalendarFeedReadStore(),
    );
    if (!result) return notFound();

    return new NextResponse(renderICalendar(result.events), {
      status: 200,
      headers: {
        ...PRIVATE_HEADERS,
        "content-type": "text/calendar; charset=utf-8",
      },
    });
  } catch {
    return new NextResponse("Calendar temporarily unavailable", {
      status: 503,
      headers: PRIVATE_HEADERS,
    });
  }
}
