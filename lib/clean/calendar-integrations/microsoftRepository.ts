import type { SupabaseClient } from "@supabase/supabase-js";
import { OutboundCalendarRepository } from "@/lib/clean/calendar-integrations/outboundRepository";
import {
  MICROSOFT_CALENDAR_NAME,
  MICROSOFT_CALENDAR_PROVIDER,
  type MicrosoftConnection,
  type MicrosoftConnectionMetadata,
} from "@/lib/clean/calendar-integrations/microsoftTypes";

export function toMicrosoftConnectionMetadata(
  connection: MicrosoftConnection,
): MicrosoftConnectionMetadata {
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

export class MicrosoftCalendarRepository extends OutboundCalendarRepository {
  constructor(admin?: SupabaseClient) {
    super(MICROSOFT_CALENDAR_PROVIDER, MICROSOFT_CALENDAR_NAME, admin);
  }
}
