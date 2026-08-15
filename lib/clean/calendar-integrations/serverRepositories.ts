import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { CalendarFeedManagementStore } from "@/lib/clean/calendar-integrations/management";
import type { CalendarFeedReadStore } from "@/lib/clean/calendar-integrations/publicFeed";
import type {
  CalendarFeedSubscriptionMetadata,
  CalendarFeedSubscriptionStatus,
  CalendarProjectionSource,
} from "@/lib/clean/calendar-integrations/types";
import { requireSupabasePublicEnv } from "@/lib/supabaseClient";

const METADATA_COLUMNS =
  "id,family_id,created_by_user_id,status,created_at,updated_at,rotated_at,revoked_at,last_accessed_at";

type MetadataRow = {
  id: string;
  family_id: string;
  created_by_user_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  rotated_at?: string | null;
  revoked_at?: string | null;
  last_accessed_at?: string | null;
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function nullable(value: unknown) {
  return safe(value) || null;
}

function toMetadata(row: MetadataRow): CalendarFeedSubscriptionMetadata {
  return {
    id: safe(row.id),
    familyId: safe(row.family_id),
    createdByUserId: safe(row.created_by_user_id),
    status: safe(row.status) as CalendarFeedSubscriptionStatus,
    createdAt: safe(row.created_at),
    updatedAt: safe(row.updated_at),
    rotatedAt: nullable(row.rotated_at),
    revokedAt: nullable(row.revoked_at),
    lastAccessedAt: nullable(row.last_accessed_at),
  };
}

function requireMetadata(
  data: unknown,
  error: unknown,
): CalendarFeedSubscriptionMetadata {
  if (error || !data) {
    throw error ?? new Error("Calendar feed metadata could not be saved.");
  }
  return toMetadata(data as MetadataRow);
}

export function createCalendarFeedManagementStore(
  supabase: SupabaseClient,
): CalendarFeedManagementStore {
  return {
    async findByFamily(familyId) {
      const response = await supabase
        .from("calendar_feed_subscriptions")
        .select(METADATA_COLUMNS)
        .eq("family_id", familyId)
        .maybeSingle();
      if (response.error) throw response.error;
      return response.data ? toMetadata(response.data as MetadataRow) : null;
    },

    async create(input) {
      const response = await supabase
        .from("calendar_feed_subscriptions")
        .insert({
          family_id: input.familyId,
          created_by_user_id: input.userId,
          token_hash: input.tokenHash,
          token_prefix: input.tokenPrefix,
          status: "active",
          created_at: input.now,
          updated_at: input.now,
        })
        .select(METADATA_COLUMNS)
        .maybeSingle();
      return requireMetadata(response.data, response.error);
    },

    async reactivate(input) {
      const response = await supabase
        .from("calendar_feed_subscriptions")
        .update({
          created_by_user_id: input.userId,
          token_hash: input.tokenHash,
          token_prefix: input.tokenPrefix,
          status: "active",
          updated_at: input.now,
          rotated_at: input.now,
          revoked_at: null,
          last_accessed_at: null,
        })
        .eq("id", input.id)
        .eq("family_id", input.familyId)
        .select(METADATA_COLUMNS)
        .maybeSingle();
      return requireMetadata(response.data, response.error);
    },

    async rotate(input) {
      const response = await supabase
        .from("calendar_feed_subscriptions")
        .update({
          token_hash: input.tokenHash,
          token_prefix: input.tokenPrefix,
          updated_at: input.now,
          rotated_at: input.now,
          last_accessed_at: null,
        })
        .eq("id", input.id)
        .eq("family_id", input.familyId)
        .eq("status", "active")
        .select(METADATA_COLUMNS)
        .maybeSingle();
      return requireMetadata(response.data, response.error);
    },

    async revoke(input) {
      const response = await supabase
        .from("calendar_feed_subscriptions")
        .update({
          status: "revoked",
          updated_at: input.now,
          revoked_at: input.now,
        })
        .eq("id", input.id)
        .eq("family_id", input.familyId)
        .eq("status", "active")
        .select(METADATA_COLUMNS)
        .maybeSingle();
      return requireMetadata(response.data, response.error);
    },
  };
}

function createCalendarFeedAdminClient() {
  const config = requireSupabasePublicEnv();
  const serviceRoleKey = safe(
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY,
  );
  if (!serviceRoleKey) {
    throw new Error("Calendar feed service configuration is unavailable.");
  }

  return createClient(config.supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export function createCalendarFeedReadStore(): CalendarFeedReadStore {
  const admin = createCalendarFeedAdminClient();

  return {
    async findActiveByTokenHash(tokenHash) {
      const response = await admin
        .from("calendar_feed_subscriptions")
        .select("id,family_id,token_prefix")
        .eq("token_hash", tokenHash)
        .eq("status", "active")
        .maybeSingle();
      if (response.error || !response.data) return null;
      return {
        id: safe(response.data.id),
        familyId: safe(response.data.family_id),
        tokenPrefix: safe(response.data.token_prefix),
      };
    },

    async loadCalendarItems(familyId): Promise<CalendarProjectionSource[]> {
      const pageSize = 500;
      const rows: Array<Record<string, unknown>> = [];

      for (let offset = 0; ; offset += pageSize) {
        const response = await admin
          .from("calendar_items")
          .select("id,title,planned_date,starts_at,ends_at,learning_area,updated_at")
          .eq("family_id", familyId)
          .order("planned_date", { ascending: true })
          .order("id", { ascending: true })
          .range(offset, offset + pageSize - 1);
        if (response.error) throw response.error;
        const page = (response.data ?? []) as Array<Record<string, unknown>>;
        rows.push(...page);
        if (page.length < pageSize) break;
      }

      return rows.map((row) => ({
        id: row.id,
        title: row.title,
        plannedDate: row.planned_date,
        startsAt: row.starts_at,
        endsAt: row.ends_at,
        learningArea: row.learning_area,
        updatedAt: row.updated_at,
      }));
    },

    async touchLastAccessed(id, familyId, now) {
      await admin
        .from("calendar_feed_subscriptions")
        .update({ last_accessed_at: now })
        .eq("id", id)
        .eq("family_id", familyId)
        .eq("status", "active");
    },
  };
}
