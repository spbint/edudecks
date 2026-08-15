import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
const googleMigration = read(
  "supabase/migrations/20260815091149_google_calendar_outbound_sync_v1.sql",
);
const microsoftMigration = read(
  "supabase/migrations/20260815125043_microsoft_calendar_outbound_sync_v1.sql",
);
const managementRoute = read(
  "app/api/calendar-connections/microsoft/route.ts",
);
const callbackRoute = read(
  "app/api/calendar-connections/microsoft/callback/route.ts",
);
const repository = read(
  "lib/clean/calendar-integrations/outboundRepository.ts",
);
const oauth = read("lib/clean/calendar-integrations/microsoftOAuth.ts");
const microsoftTypes = read(
  "lib/clean/calendar-integrations/microsoftTypes.ts",
);
const event = read("lib/clean/calendar-integrations/microsoftEvent.ts");
const telemetry = read(
  "lib/clean/calendar-integrations/microsoftAnalytics.ts",
);

describe("Microsoft Calendar security and isolation boundaries", () => {
  it("extends the service-only schema without browser grants", () => {
    expect(microsoftMigration).toContain("'google', 'microsoft'");
    expect(microsoftMigration).toContain("to service_role");
    expect(microsoftMigration).toContain(
      "revoke all on table public.calendar_provider_connections from anon, authenticated",
    );
    expect(microsoftMigration).not.toMatch(/grant .* to (anon|authenticated)/i);
    expect(googleMigration).toContain(
      "alter table public.calendar_provider_connections enable row level security",
    );
  });

  it("gives every connected provider an independent idempotent outbox key", () => {
    expect(microsoftMigration).toContain(
      "unique (family_id, calendar_item_id, provider)",
    );
    expect(microsoftMigration).toContain(
      "on conflict (family_id, calendar_item_id, provider)",
    );
    expect(microsoftMigration).toMatch(
      /from public\.calendar_provider_connections connection[\s\S]*connection\.family_id = target_family_id/,
    );
    expect(repository).toContain('.eq("provider", this.provider)');
    expect(repository).toContain(
      'onConflict: "family_id,calendar_item_id,provider"',
    );
  });

  it("requires exact family manager authorization and same-origin mutations", () => {
    expect(managementRoute).toContain("authorizeCalendarIntegrationManager(id)");
    expect(managementRoute).toContain("sameOrigin(request)");
    expect(callbackRoute).toContain("authorizeCalendarIntegrationManager");
    expect(callbackRoute).toContain("authenticatedUserId: user.id");
    expect(managementRoute).not.toMatch(
      /refreshToken|refresh_token|clientSecret|client_secret/,
    );
  });

  it("uses PKCE, one-time state, a fixed redirect and calendar-only consent", () => {
    expect(oauth).toContain("code_challenge_method");
    expect(oauth).toContain("MICROSOFT_CALENDAR_REDIRECT_URI");
    expect(microsoftTypes).toContain('"offline_access"');
    expect(microsoftTypes).toContain('"Calendars.ReadWrite"');
    expect(`${oauth}\n${microsoftTypes}`).not.toMatch(
      /User\.Read|Mail\.|Files\.|openid|profile|email/,
    );
    expect(callbackRoute).not.toMatch(/next=|redirect_uri.*searchParams/);
  });

  it("exports only the shared calendar projection", () => {
    expect(event).toContain("subject: event.title");
    expect(event).not.toMatch(
      /description|learner|evidence|reflection|attachment|portfolio|report|webLink/i,
    );
    expect(repository).toContain(
      '.select("id,title,planned_date,starts_at,ends_at,learning_area,updated_at")',
    );
    expect(microsoftMigration).not.toMatch(/completed_at/);
  });

  it("keeps telemetry enum-safe and free of provider or educational identifiers", () => {
    expect(telemetry).toContain('area: "calendar_connections"');
    expect(telemetry).toContain('source: "microsoft"');
    expect(telemetry).not.toMatch(
      /familyId|calendarItemId|external|token|secret|email|title|learner/,
    );
  });
});
