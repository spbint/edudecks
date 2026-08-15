import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createCalendarIntegrationAdminClient } from "@/lib/clean/calendar-integrations/serverAdminClient";
import { hashCalendarOAuthState } from "@/lib/clean/calendar-integrations/secretProtection";
import type {
  CalendarItemExternalLink,
  CalendarOAuthState,
  CalendarProjectionSource,
  CalendarSyncJob,
  OutboundCalendarConnection,
  OutboundCalendarConnectionStatus,
  OutboundCalendarProvider,
} from "@/lib/clean/calendar-integrations/types";

const CONNECTION_COLUMNS =
  "id,family_id,connected_by_user_id,provider,external_calendar_id,external_calendar_name,refresh_token_ciphertext,granted_scopes,status,last_sync_at,last_sync_status,last_error_code,connected_at,disconnected_at";

type ConnectionRow = {
  id: string;
  family_id: string;
  connected_by_user_id: string;
  provider: string;
  external_calendar_id?: string | null;
  external_calendar_name?: string | null;
  refresh_token_ciphertext?: string | null;
  granted_scopes?: string[] | null;
  status: string;
  last_sync_at?: string | null;
  last_sync_status?: string | null;
  last_error_code?: string | null;
  connected_at?: string | null;
  disconnected_at?: string | null;
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function nullable(value: unknown) {
  return safe(value) || null;
}

function toConnection(
  row: ConnectionRow,
  fallbackCalendarName: string,
): OutboundCalendarConnection {
  return {
    id: safe(row.id),
    familyId: safe(row.family_id),
    connectedByUserId: safe(row.connected_by_user_id),
    provider: safe(row.provider) as OutboundCalendarProvider,
    externalCalendarId: nullable(row.external_calendar_id),
    externalCalendarName: safe(row.external_calendar_name) || fallbackCalendarName,
    refreshTokenCiphertext: nullable(row.refresh_token_ciphertext),
    grantedScopes: Array.isArray(row.granted_scopes)
      ? row.granted_scopes.map(safe).filter(Boolean)
      : [],
    status: safe(row.status) as OutboundCalendarConnectionStatus,
    lastSyncAt: nullable(row.last_sync_at),
    lastSyncStatus: nullable(row.last_sync_status) as OutboundCalendarConnection["lastSyncStatus"],
    lastErrorCode: nullable(row.last_error_code),
    connectedAt: nullable(row.connected_at),
    disconnectedAt: nullable(row.disconnected_at),
  };
}

export class OutboundCalendarRepository {
  constructor(
    readonly provider: OutboundCalendarProvider,
    private readonly calendarName: string,
    private readonly admin: SupabaseClient = createCalendarIntegrationAdminClient(),
  ) {}

  async getConnection(familyId: string) {
    const response = await this.admin
      .from("calendar_provider_connections")
      .select(CONNECTION_COLUMNS)
      .eq("family_id", familyId)
      .eq("provider", this.provider)
      .maybeSingle();
    if (response.error) throw response.error;
    return response.data
      ? toConnection(response.data as ConnectionRow, this.calendarName)
      : null;
  }

  async createOAuthState(input: {
    familyId: string;
    userId: string;
    rawState: string;
    codeVerifierCiphertext: string;
    expiresAt: string;
  }) {
    const now = new Date().toISOString();
    const invalidate = await this.admin
      .from("calendar_oauth_states")
      .update({ consumed_at: now })
      .eq("family_id", input.familyId)
      .eq("provider", this.provider)
      .is("consumed_at", null);
    if (invalidate.error) throw invalidate.error;

    const response = await this.admin.from("calendar_oauth_states").insert({
      family_id: input.familyId,
      user_id: input.userId,
      provider: this.provider,
      state_hash: hashCalendarOAuthState(input.rawState),
      code_verifier_ciphertext: input.codeVerifierCiphertext,
      expires_at: input.expiresAt,
    });
    if (response.error) throw response.error;
  }

  async consumeOAuthState(rawState: string): Promise<CalendarOAuthState | null> {
    const now = new Date().toISOString();
    const response = await this.admin
      .from("calendar_oauth_states")
      .update({ consumed_at: now })
      .eq("state_hash", hashCalendarOAuthState(rawState))
      .eq("provider", this.provider)
      .is("consumed_at", null)
      .gt("expires_at", now)
      .select("id,family_id,user_id,code_verifier_ciphertext,expires_at")
      .maybeSingle();
    if (response.error || !response.data) return null;
    return {
      id: safe(response.data.id),
      familyId: safe(response.data.family_id),
      userId: safe(response.data.user_id),
      codeVerifierCiphertext: safe(response.data.code_verifier_ciphertext),
      expiresAt: safe(response.data.expires_at),
    };
  }

  async saveConnected(input: {
    familyId: string;
    userId: string;
    externalCalendarId: string;
    refreshTokenCiphertext: string;
    scopes: string[];
  }) {
    const now = new Date().toISOString();
    const response = await this.admin
      .from("calendar_provider_connections")
      .upsert(
        {
          family_id: input.familyId,
          connected_by_user_id: input.userId,
          provider: this.provider,
          external_calendar_id: input.externalCalendarId,
          external_calendar_name: this.calendarName,
          refresh_token_ciphertext: input.refreshTokenCiphertext,
          token_key_version: 1,
          granted_scopes: input.scopes,
          status: "active",
          last_sync_status: "pending",
          last_error_code: null,
          connected_at: now,
          disconnected_at: null,
          updated_at: now,
        },
        { onConflict: "family_id,provider" },
      )
      .select(CONNECTION_COLUMNS)
      .maybeSingle();
    if (response.error || !response.data) {
      throw response.error ?? new Error("Calendar connection could not be saved.");
    }
    return toConnection(response.data as ConnectionRow, this.calendarName);
  }

  async updateRefreshToken(connectionId: string, refreshTokenCiphertext: string) {
    const response = await this.admin
      .from("calendar_provider_connections")
      .update({
        refresh_token_ciphertext: refreshTokenCiphertext,
        token_key_version: 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", connectionId)
      .eq("provider", this.provider);
    if (response.error) throw response.error;
  }

  async enqueueFamily(familyId: string) {
    const pageSize = 500;
    for (let offset = 0; ; offset += pageSize) {
      const page = await this.admin
        .from("calendar_items")
        .select("id")
        .eq("family_id", familyId)
        .order("id", { ascending: true })
        .range(offset, offset + pageSize - 1);
      if (page.error) throw page.error;
      const rows = (page.data ?? []) as Array<{ id: string }>;
      if (rows.length) {
        const now = new Date().toISOString();
        const queued = await this.admin.from("calendar_sync_outbox").upsert(
          rows.map((row) => ({
            family_id: familyId,
            calendar_item_id: row.id,
            provider: this.provider,
            operation: "upsert",
            status: "pending",
            attempts: 0,
            available_at: now,
            locked_at: null,
            lock_token: null,
            last_error_code: null,
            updated_at: now,
          })),
          { onConflict: "family_id,calendar_item_id,provider" },
        );
        if (queued.error) throw queued.error;
      }
      if (rows.length < pageSize) break;
    }
  }

  async markDisconnected(connectionId: string, warningCode: string | null) {
    const existing = await this.getConnectionById(connectionId);
    if (!existing) throw new Error("Calendar connection was not found.");
    const now = new Date().toISOString();
    const response = await this.admin
      .from("calendar_provider_connections")
      .update({
        status: "disconnected",
        refresh_token_ciphertext: null,
        granted_scopes: [],
        last_sync_status: warningCode ? "failed" : null,
        last_error_code: warningCode,
        disconnected_at: now,
        updated_at: now,
      })
      .eq("id", connectionId)
      .eq("provider", this.provider);
    if (response.error) throw response.error;
    const cleanup = await Promise.all([
      this.admin
        .from("calendar_sync_outbox")
        .delete()
        .eq("family_id", existing.familyId)
        .eq("provider", this.provider),
      this.admin
        .from("calendar_item_external_links")
        .delete()
        .eq("connection_id", connectionId)
        .eq("provider", this.provider),
    ]);
    for (const result of cleanup) if (result.error) throw result.error;
  }

  private async getConnectionById(connectionId: string) {
    const response = await this.admin
      .from("calendar_provider_connections")
      .select(CONNECTION_COLUMNS)
      .eq("id", connectionId)
      .eq("provider", this.provider)
      .maybeSingle();
    if (response.error) throw response.error;
    return response.data
      ? toConnection(response.data as ConnectionRow, this.calendarName)
      : null;
  }

  async reclaimStaleJobs() {
    const staleBefore = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const response = await this.admin
      .from("calendar_sync_outbox")
      .update({
        status: "pending",
        locked_at: null,
        lock_token: null,
        updated_at: new Date().toISOString(),
      })
      .eq("provider", this.provider)
      .eq("status", "processing")
      .lt("locked_at", staleBefore);
    if (response.error) throw response.error;
  }

  async claimJobs(limit: number, familyId?: string) {
    let query = this.admin
      .from("calendar_sync_outbox")
      .select("id,provider,family_id,calendar_item_id,operation,attempts")
      .eq("provider", this.provider)
      .eq("status", "pending")
      .lte("available_at", new Date().toISOString())
      .order("available_at", { ascending: true })
      .order("created_at", { ascending: true })
      .limit(Math.max(1, Math.min(100, limit)));
    if (familyId) query = query.eq("family_id", familyId);
    const response = await query;
    if (response.error) throw response.error;

    const claimed: CalendarSyncJob[] = [];
    for (const row of response.data ?? []) {
      const lockToken = randomUUID();
      const lock = await this.admin
        .from("calendar_sync_outbox")
        .update({
          status: "processing",
          locked_at: new Date().toISOString(),
          lock_token: lockToken,
        })
        .eq("id", row.id)
        .eq("provider", this.provider)
        .eq("status", "pending")
        .select("id")
        .maybeSingle();
      if (lock.error) throw lock.error;
      if (lock.data) {
        claimed.push({
          id: safe(row.id),
          provider: this.provider,
          familyId: safe(row.family_id),
          calendarItemId: safe(row.calendar_item_id),
          operation: safe(row.operation) as CalendarSyncJob["operation"],
          attempts: Number(row.attempts ?? 0),
          lockToken,
        });
      }
    }
    return claimed;
  }

  async loadProjectionSource(familyId: string, calendarItemId: string) {
    const response = await this.admin
      .from("calendar_items")
      .select("id,title,planned_date,starts_at,ends_at,learning_area,updated_at")
      .eq("family_id", familyId)
      .eq("id", calendarItemId)
      .maybeSingle();
    if (response.error) throw response.error;
    if (!response.data) return null;
    return {
      id: response.data.id,
      title: response.data.title,
      plannedDate: response.data.planned_date,
      startsAt: response.data.starts_at,
      endsAt: response.data.ends_at,
      learningArea: response.data.learning_area,
      updatedAt: response.data.updated_at,
    } satisfies CalendarProjectionSource;
  }

  async getExternalLink(
    connectionId: string,
    calendarItemId: string,
  ): Promise<CalendarItemExternalLink | null> {
    const response = await this.admin
      .from("calendar_item_external_links")
      .select("external_event_id,external_event_etag,last_synced_version")
      .eq("connection_id", connectionId)
      .eq("calendar_item_id", calendarItemId)
      .eq("provider", this.provider)
      .maybeSingle();
    if (response.error) throw response.error;
    if (!response.data) return null;
    return {
      eventId: safe(response.data.external_event_id),
      etag: nullable(response.data.external_event_etag),
      version: nullable(response.data.last_synced_version),
    };
  }

  async saveExternalLink(input: {
    connection: OutboundCalendarConnection;
    calendarItemId: string;
    eventId: string;
    etag: string | null;
    version: string | null;
  }) {
    const now = new Date().toISOString();
    const response = await this.admin.from("calendar_item_external_links").upsert(
      {
        family_id: input.connection.familyId,
        calendar_item_id: input.calendarItemId,
        connection_id: input.connection.id,
        provider: this.provider,
        external_event_id: input.eventId,
        external_event_etag: input.etag,
        last_synced_version: input.version,
        last_sync_status: "succeeded",
        last_error_code: null,
        last_synced_at: now,
        updated_at: now,
      },
      { onConflict: "connection_id,calendar_item_id" },
    );
    if (response.error) throw response.error;
  }

  async removeExternalLink(connectionId: string, calendarItemId: string) {
    const response = await this.admin
      .from("calendar_item_external_links")
      .delete()
      .eq("connection_id", connectionId)
      .eq("calendar_item_id", calendarItemId)
      .eq("provider", this.provider);
    if (response.error) throw response.error;
  }

  async completeJob(job: CalendarSyncJob, connectionId: string) {
    const now = new Date().toISOString();
    const completed = await this.admin
      .from("calendar_sync_outbox")
      .delete()
      .eq("id", job.id)
      .eq("provider", this.provider)
      .eq("status", "processing")
      .eq("lock_token", job.lockToken)
      .select("id")
      .maybeSingle();
    if (completed.error) throw completed.error;
    if (!completed.data) return;
    const connection = await this.admin
      .from("calendar_provider_connections")
      .update({
        status: "active",
        last_sync_at: now,
        last_sync_status: "succeeded",
        last_error_code: null,
        updated_at: now,
      })
      .eq("id", connectionId)
      .eq("provider", this.provider);
    if (connection.error) throw connection.error;
  }

  async discardJob(job: CalendarSyncJob) {
    const response = await this.admin
      .from("calendar_sync_outbox")
      .delete()
      .eq("id", job.id)
      .eq("provider", this.provider)
      .eq("status", "processing")
      .eq("lock_token", job.lockToken);
    if (response.error) throw response.error;
  }

  async failJob(
    job: CalendarSyncJob,
    connectionId: string,
    code: string,
    retryable: boolean,
    needsAttention: boolean,
  ) {
    const now = new Date();
    const attempts = job.attempts + 1;
    const delaySeconds = needsAttention
      ? 86400
      : Math.min(3600, 30 * 2 ** Math.min(attempts, 7));
    const connectionStatus = needsAttention ? "needs_attention" : "active";
    const connection = await this.admin
      .from("calendar_provider_connections")
      .update({
        status: connectionStatus,
        last_sync_status: "failed",
        last_error_code: code,
        updated_at: now.toISOString(),
      })
      .eq("id", connectionId)
      .eq("provider", this.provider);
    if (connection.error) throw connection.error;

    if (!retryable && !needsAttention) {
      await this.discardJob(job);
      return;
    }
    const retried = await this.admin
      .from("calendar_sync_outbox")
      .update({
        status: "pending",
        attempts,
        available_at: new Date(now.getTime() + delaySeconds * 1000).toISOString(),
        locked_at: null,
        lock_token: null,
        last_error_code: code,
        updated_at: now.toISOString(),
      })
      .eq("id", job.id)
      .eq("provider", this.provider)
      .eq("status", "processing")
      .eq("lock_token", job.lockToken);
    if (retried.error) throw retried.error;
  }
}
