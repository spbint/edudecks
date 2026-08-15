import { MICROSOFT_CALENDAR_NAME } from "@/lib/clean/calendar-integrations/microsoftTypes";

const MICROSOFT_GRAPH_API = "https://graph.microsoft.com/v1.0";

export class MicrosoftCalendarApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code:
      | "unauthorized"
      | "not_found"
      | "conflict"
      | "rate_limited"
      | "provider_unavailable"
      | "invalid_request",
  ) {
    super("Microsoft Calendar could not be updated.");
    this.name = "MicrosoftCalendarApiError";
  }

  get retryable() {
    return (
      this.code === "conflict" ||
      this.code === "rate_limited" ||
      this.code === "provider_unavailable"
    );
  }
}

function classify(status: number) {
  if (status === 401 || status === 403) return "unauthorized" as const;
  if (status === 404 || status === 410) return "not_found" as const;
  if (status === 409 || status === 412) return "conflict" as const;
  if (status === 429) return "rate_limited" as const;
  if (status >= 500) return "provider_unavailable" as const;
  return "invalid_request" as const;
}

async function microsoftRequest<T>(
  accessToken: string,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${MICROSOFT_GRAPH_API}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${accessToken}`,
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...init.headers,
    },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new MicrosoftCalendarApiError(
      response.status,
      classify(response.status),
    );
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export async function getMicrosoftCalendar(
  accessToken: string,
  calendarId: string,
) {
  return microsoftRequest<{ id: string; name?: string }>(
    accessToken,
    `/me/calendars/${encodeURIComponent(calendarId)}`,
  );
}

export async function createMicrosoftCalendar(accessToken: string) {
  return microsoftRequest<{ id: string; name?: string }>(
    accessToken,
    "/me/calendars",
    { method: "POST", body: JSON.stringify({ name: MICROSOFT_CALENDAR_NAME }) },
  );
}

export async function deleteMicrosoftCalendar(
  accessToken: string,
  calendarId: string,
) {
  try {
    await microsoftRequest<void>(
      accessToken,
      `/me/calendars/${encodeURIComponent(calendarId)}`,
      { method: "DELETE" },
    );
  } catch (error) {
    if (
      error instanceof MicrosoftCalendarApiError &&
      error.code === "not_found"
    ) {
      return;
    }
    throw error;
  }
}

export type MicrosoftEventBody = {
  subject: string;
  start: { dateTime: string; timeZone: "UTC" };
  end: { dateTime: string; timeZone: "UTC" };
  isAllDay: boolean;
  categories?: string[];
  transactionId?: string;
};

type MicrosoftEventResponse = {
  id: string;
  "@odata.etag"?: string;
};

export async function insertMicrosoftEvent(
  accessToken: string,
  calendarId: string,
  event: MicrosoftEventBody,
) {
  return microsoftRequest<MicrosoftEventResponse>(
    accessToken,
    `/me/calendars/${encodeURIComponent(calendarId)}/events`,
    { method: "POST", body: JSON.stringify(event) },
  );
}

export async function updateMicrosoftEvent(
  accessToken: string,
  calendarId: string,
  eventId: string,
  event: MicrosoftEventBody,
) {
  const body = { ...event };
  delete body.transactionId;
  return microsoftRequest<MicrosoftEventResponse>(
    accessToken,
    `/me/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    { method: "PATCH", body: JSON.stringify(body) },
  );
}

export async function deleteMicrosoftEvent(
  accessToken: string,
  calendarId: string,
  eventId: string,
) {
  try {
    await microsoftRequest<void>(
      accessToken,
      `/me/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
      { method: "DELETE" },
    );
  } catch (error) {
    if (
      error instanceof MicrosoftCalendarApiError &&
      error.code === "not_found"
    ) {
      return;
    }
    throw error;
  }
}
