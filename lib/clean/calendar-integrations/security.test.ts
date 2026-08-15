import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { canManageCalendarIntegrations } from "@/lib/clean/calendar-integrations/authorization";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
const migration = read(
  "supabase/migrations/20260815081154_apple_calendar_subscription_v1.sql",
);
const authorization = read(
  "lib/clean/calendar-integrations/serverAuthorization.ts",
);
const repository = read("lib/clean/calendar-integrations/serverRepositories.ts");
const managementRoute = read("app/api/calendar-connections/apple/route.ts");
const feedRoute = read("app/api/calendar-feeds/[feed]/route.ts");
const settingsCard = read("app/components/clean/AppleCalendarConnectionCard.tsx");
const robots = read("app/robots.ts");
const sentryServer = read("sentry.server.config.ts");
const sentryEdge = read("sentry.edge.config.ts");
const sentryClient = read("instrumentation-client.ts");

describe("Apple Calendar integration security boundaries", () => {
  it("creates a hash-only, one-per-family subscription table with RLS", () => {
    expect(migration).toContain("create table public.calendar_feed_subscriptions");
    expect(migration).toContain("token_hash text not null");
    expect(migration).toContain("unique (token_hash)");
    expect(migration).toContain("unique (family_id)");
    expect(migration).not.toMatch(/raw_token|feed_url/);
    expect(migration).toContain(
      "alter table public.calendar_feed_subscriptions enable row level security",
    );
    expect(migration).toContain("revoke all on table public.calendar_feed_subscriptions from anon");
    expect(migration).toContain(
      "revoke all on table public.calendar_feed_subscriptions from authenticated",
    );
    const selectGrant = migration.match(
      /grant select \([\s\S]*?\) on public\.calendar_feed_subscriptions to authenticated;/,
    )?.[0];
    expect(selectGrant).toBeTruthy();
    expect(selectGrant).not.toContain("token_hash");
    expect(migration).not.toMatch(/to anon/);
  });

  it("allows only owner and parent metadata management", () => {
    expect(canManageCalendarIntegrations("owner")).toBe(true);
    expect(canManageCalendarIntegrations("parent")).toBe(true);
    expect(canManageCalendarIntegrations("caregiver")).toBe(false);
    expect(canManageCalendarIntegrations(null)).toBe(false);
    expect(migration.match(/membership\.role in \('owner', 'parent'\)/g)).toHaveLength(4);
    expect(migration).not.toMatch(/role in \([^)]*caregiver/);
    expect(migration).not.toMatch(/for delete/);
  });

  it("authorizes the exact requested family and current authenticated user", () => {
    expect(authorization).toContain("supabase.auth.getUser()");
    expect(authorization).toContain('.eq("family_id", familyId)');
    expect(authorization).toContain('.eq("user_id", user.id)');
    expect(authorization).not.toContain("user_metadata");
    expect(authorization).not.toContain("memberships[0]");
  });

  it("keeps service credentials and sensitive calendar columns server-only", () => {
    expect(repository).toContain("process.env.SUPABASE_SERVICE_ROLE_KEY");
    expect(settingsCard).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(settingsCard).not.toContain("tokenHash");
    expect(settingsCard).not.toContain("localStorage");
    expect(repository).toContain(
      '.select("id,title,planned_date,starts_at,ends_at,learning_area,updated_at")',
    );
    expect(repository).not.toMatch(/\.select\([^)]*description/);
    expect(repository).not.toMatch(/\.select\([^)]*learner_id/);
    expect(repository).not.toContain("evidence_entries");
  });

  it("keeps feed responses private, non-indexable and analytics-free", () => {
    expect(feedRoute).toContain('"cache-control": "private, no-store"');
    expect(feedRoute).toContain('"x-robots-tag": "noindex, nofollow, noarchive"');
    expect(feedRoute).toContain('"content-type": "text/calendar; charset=utf-8"');
    expect(feedRoute).toContain("status: 404");
    expect(feedRoute).toContain("readCalendarFeedPassword");
    expect(feedRoute).toContain('request.headers.get("authorization")');
    expect(feedRoute).toContain('"www-authenticate"');
    expect(feedRoute).not.toMatch(/track(Product|Core|Apple)|console\./);
    expect(robots).toContain('"/api/calendar-feeds/"');
    for (const source of [sentryServer, sentryEdge, sentryClient]) {
      expect(source).toContain("redactCalendarFeedTelemetry");
      expect(source).toContain("beforeSend: redactCalendarFeedTelemetry");
      expect(source).toContain("beforeSendTransaction: redactCalendarFeedTelemetry");
    }
  });

  it("returns credentials only from create/rotate and keeps secrets out of paths", () => {
    expect(managementRoute.match(/feedAddress: buildCalendarFeedAddress/g)).toHaveLength(2);
    expect(managementRoute.match(/subscriptionPassword: result\.rawToken/g)).toHaveLength(2);
    expect(managementRoute).not.toMatch(/tokenHash|token_hash|token_prefix/);
    expect(managementRoute).not.toMatch(/\btokenPrefix\s*:/);
    expect(feedRoute).toContain(
      "const tokenPrefix = parseCalendarFeedPathSegment(feed)",
    );
    expect(feedRoute).not.toContain(
      "const rawToken = parseCalendarFeedPathSegment(feed)",
    );
    expect(managementRoute).toContain("mutationOriginAllowed");
    expect(managementRoute).toContain("Boolean(origin && origin === request.nextUrl.origin)");
    expect(managementRoute).toContain('"cache-control": "private, no-store"');
  });
});
