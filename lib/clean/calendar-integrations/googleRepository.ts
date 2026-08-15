import type { SupabaseClient } from "@supabase/supabase-js";
import { OutboundCalendarRepository } from "@/lib/clean/calendar-integrations/outboundRepository";
import {
  GOOGLE_CALENDAR_NAME,
  GOOGLE_CALENDAR_PROVIDER,
  type GoogleConnection,
  type GoogleConnectionMetadata,
} from "@/lib/clean/calendar-integrations/googleTypes";
import type { CalendarSyncJob } from "@/lib/clean/calendar-integrations/types";

export type { CalendarSyncJob };

export function toGoogleConnectionMetadata(
  connection: GoogleConnection,
): GoogleConnectionMetadata {
  return {
    externalCalendarName: connection.externalCalendarName,
    status: connection.status,
    lastSyncAt: connection.lastSyncAt,
    lastSyncStatus: connection.lastSyncStatus,
    lastErrorCode: connection.lastErrorCode,
    connectedAt: connection.connectedAt,
    disconnectedAt: connection.disconnectedAt,
  };
}

export class GoogleCalendarRepository extends OutboundCalendarRepository {
  constructor(admin?: SupabaseClient) {
    super(GOOGLE_CALENDAR_PROVIDER, GOOGLE_CALENDAR_NAME, admin);
  }
}
