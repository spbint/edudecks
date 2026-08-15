import { GOOGLE_CALENDAR_NAME } from "@/lib/clean/calendar-integrations/googleTypes";

const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3";

export class GoogleCalendarApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code:
      | "unauthorized"
      | "not_found"
      | "duplicate"
      | "rate_limited"
      | "provider_unavailable"
      | "invalid_request",
  ) {
    super("Google Calendar could not be updated.");
    this.name = "GoogleCalendarApiError";
  }

  get retryable() {
    return this.code === "rate_limited" || this.code === "provider_unavailable";
  }
}

async function classify(response: Response) {
  const status = response.status;
  if (status === 401) return "unauthorized" as const;
  if (status === 404 || status === 410) return "not_found" as const;
  if (status === 409) return "duplicate" as const;
  if (status === 403) {
    const body = (await response.clone().json().catch(() => null)) as {
      error?: { errors?: Array<{ reason?: string }> };
    } | null;
    const reasons = body?.error?.errors?.map((entry) => entry.reason) ?? [];
    if (
      reasons.some((reason) =>
        ["rateLimitExceeded", "userRateLimitExceeded", "quotaExceeded"].includes(
          String(reason),
        ),
      )
    ) {
      return "rate_limited" as const;
    }
    return "unauthorized" as const;
  }
  if (status === 429) return "rate_limited" as const;
  if (status >= 500) return "provider_unavailable" as const;
  return "invalid_request" as const;
}

async function googleRequest<T>(
  accessToken: string,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${GOOGLE_CALENDAR_API}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${accessToken}`,
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...init.headers,
    },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new GoogleCalendarApiError(response.status, await classify(response));
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export async function getGoogleCalendar(accessToken: string, calendarId: string) {
  return googleRequest<{ id: string; summary?: string }>(
    accessToken,
    `/calendars/${encodeURIComponent(calendarId)}`,
  );
}

export async function createGoogleCalendar(accessToken: string) {
  return googleRequest<{ id: string; summary?: string }>(accessToken, "/calendars", {
    method: "POST",
    body: JSON.stringify({ summary: GOOGLE_CALENDAR_NAME }),
  });
}

export async function deleteGoogleCalendar(accessToken: string, calendarId: string) {
  try {
    await googleRequest<void>(
      accessToken,
      `/calendars/${encodeURIComponent(calendarId)}`,
      { method: "DELETE" },
    );
  } catch (error) {
    if (error instanceof GoogleCalendarApiError && error.code === "not_found") return;
    throw error;
  }
}

export type GoogleEventBody = {
  id?: string;
  summary: string;
  start: { date?: string; dateTime?: string };
  end: { date?: string; dateTime?: string };
  sequence: number;
  reminders: { useDefault: boolean };
};

export async function insertGoogleEvent(
  accessToken: string,
  calendarId: string,
  event: GoogleEventBody,
) {
  return googleRequest<{ id: string; etag?: string }>(
    accessToken,
    `/calendars/${encodeURIComponent(calendarId)}/events`,
    { method: "POST", body: JSON.stringify(event) },
  );
}

export async function updateGoogleEvent(
  accessToken: string,
  calendarId: string,
  eventId: string,
  event: GoogleEventBody,
) {
  const body: GoogleEventBody = {
    summary: event.summary,
    start: event.start,
    end: event.end,
    sequence: event.sequence,
    reminders: event.reminders,
  };
  return googleRequest<{ id: string; etag?: string }>(
    accessToken,
    `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    { method: "PUT", body: JSON.stringify(body) },
  );
}

export async function deleteGoogleEvent(
  accessToken: string,
  calendarId: string,
  eventId: string,
) {
  try {
    await googleRequest<void>(
      accessToken,
      `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
      { method: "DELETE" },
    );
  } catch (error) {
    if (error instanceof GoogleCalendarApiError && error.code === "not_found") return;
    throw error;
  }
}
