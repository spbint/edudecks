import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
const migration = read(
  "supabase/migrations/20260815091149_google_calendar_outbound_sync_v1.sql",
);
const managementRoute = read("app/api/calendar-connections/google/route.ts");
const callbackRoute = read("app/api/calendar-connections/google/callback/route.ts");
const repository = read("lib/clean/calendar-integrations/googleRepository.ts");
const oauth = read("lib/clean/calendar-integrations/googleOAuth.ts");
const googleTypes = read("lib/clean/calendar-integrations/googleTypes.ts");
const event = read("lib/clean/calendar-integrations/googleEvent.ts");
const telemetry = read("lib/clean/calendar-integrations/googleAnalytics.ts");

describe("Google Calendar security boundaries", () => {
  it("keeps credentials encrypted and unavailable to browser roles", () => {
    expect(migration).toContain("refresh_token_ciphertext text");
    expect(migration).not.toMatch(/refresh_token text/);
    expect(migration).toContain(
      "revoke all on table public.calendar_provider_connections from authenticated",
    );
    expect(migration).not.toMatch(/grant .*calendar_provider_connections/);
  });

  it("limits metadata to exact family managers and service-only work tables", () => {
    expect(migration).toContain(
      "alter table public.calendar_provider_connections enable row level security",
    );
    expect(migration).toContain("alter table public.calendar_oauth_states enable row level security");
    expect(migration).toContain("alter table public.calendar_sync_outbox enable row level security");
    expect(migration).toContain(
      "calendar_item_external_links_calendar_item_idx",
    );
    expect(migration).not.toMatch(/to anon/);
    expect(repository).toContain('.eq("family_id", familyId)');
  });

  it("uses one-time hashed state, PKCE, fixed redirect and least privilege scope", () => {
    expect(migration).toContain("state_hash text not null unique");
    expect(migration).toContain("where consumed_at is null");
    expect(oauth).toContain("code_challenge_method");
    expect(googleTypes).toContain("calendar.app.created");
    expect(oauth).toContain("GOOGLE_CALENDAR_REDIRECT_URI");
    expect(callbackRoute).toContain("authorizeCalendarIntegrationManager");
    expect(callbackRoute).not.toMatch(/next=|redirect_uri.*searchParams/);
  });

  it("requires same-origin mutations and never returns provider credentials", () => {
    expect(managementRoute).toContain("sameOrigin(request)");
    expect(managementRoute).not.toMatch(/refreshToken|refresh_token|clientSecret|client_secret/);
    expect(managementRoute).toContain('"cache-control": "private, no-store"');
  });

  it("syncs only approved projection fields and ignores completed_at changes", () => {
    expect(event).toContain("summary: event.title");
    expect(event).not.toMatch(/description|learner|evidence|portfolio|attachment|report/i);
    expect(migration).toContain(
      "after insert or update of title, planned_date, starts_at, ends_at, learning_area or delete",
    );
    expect(migration).not.toMatch(/update of[^\n]*completed_at/);
    expect(repository).toContain(
      '.select("id,title,planned_date,starts_at,ends_at,learning_area,updated_at")',
    );
    expect(repository).toContain("const pageSize = 500");
    expect(repository).toContain(".range(offset, offset + pageSize - 1)");
  });

  it("prevents a stale worker from consuming a newer queued mutation", () => {
    expect(migration).toContain("lock_token uuid");
    expect(migration).toMatch(/do update set[\s\S]*?lock_token = null/);
    expect(repository).toContain('.eq("lock_token", job.lockToken)');
    expect(repository).toContain('.eq("status", "processing")');
  });

  it("allowlists analytics fields and excludes identifiers and provider secrets", () => {
    expect(telemetry).toContain('area: "calendar_connections"');
    expect(telemetry).toContain('source: "google"');
    expect(telemetry).not.toMatch(/familyId|calendarItemId|external|token|email|title|learner/);
  });
});
