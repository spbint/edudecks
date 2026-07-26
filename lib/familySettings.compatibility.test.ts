import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  getSession: vi.fn(),
  getUser: vi.fn(),
}));

vi.mock("@/lib/supabaseClient", () => ({
  hasSupabaseEnv: true,
  supabase: {
    from: mocks.from,
    auth: {
      getSession: mocks.getSession,
      getUser: mocks.getUser,
    },
  },
}));

import {
  DEFAULT_FAMILY_SETTINGS,
  describeSupabaseError,
  loadFamilyProfile,
  upsertFamilyProfile,
} from "@/lib/familySettings";

type QueryKind = "direct-or" | "direct-eq" | "direct-in" | "family-settings" | "write";

function makeQuery(result: { data?: unknown; error?: unknown }, kind: QueryKind) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  chain.select = vi.fn(() => chain);
  chain.or = vi.fn(() => kind === "direct-or" ? Promise.resolve(result) : chain);
  chain.eq = vi.fn(() => kind === "direct-eq" ? Promise.resolve(result) : chain);
  chain.in = vi.fn(() => kind === "direct-in" ? Promise.resolve(result) : chain);
  chain.order = vi.fn(() => Promise.resolve(result));
  chain.update = vi.fn(() => chain);
  chain.insert = vi.fn(() => chain);
  chain.upsert = vi.fn(() => chain);
  chain.maybeSingle = vi.fn(() => Promise.resolve(result));
  chain.single = vi.fn(() => Promise.resolve(result));
  return chain;
}

function queueQueries(
  queries: Array<{ table: string; chain: Record<string, ReturnType<typeof vi.fn>> }>,
) {
  const pending = [...queries];
  mocks.from.mockImplementation((table: string) => {
    const next = pending.shift();
    if (!next) throw new Error(`Unexpected Supabase table: ${table}`);
    expect(table).toBe(next.table);
    return next.chain;
  });
  return queries;
}

const cleanProfile = {
  id: "family-clean",
  created_by_user_id: "user-1",
  display_name: "Staging family",
  country_code: "AU",
  jurisdiction_code: "TAS",
  curriculum_framework_id: "au-v9",
  reporting_mode: "compliance-support",
  week_start: "monday",
  privacy_default: "family",
  export_style: "calm",
  default_learner_id: "learner-1",
  created_at: "2026-07-25T00:00:00.000Z",
  updated_at: "2026-07-25T00:00:00.000Z",
};

const legacyProfile = {
  id: "family-legacy",
  user_id: "user-1",
  owner_user_id: "user-1",
  family_display_name: "Production family",
  preferred_market: "au",
  country: "au",
  curriculum_framework_id: "au-v9",
  curriculum_jurisdiction_id: "tas",
  reporting_mode: "family-summary",
  default_child_id: null,
  week_start: "monday",
  created_at: "2026-07-24T00:00:00.000Z",
  updated_at: "2026-07-24T00:00:00.000Z",
};

const settings = {
  ...DEFAULT_FAMILY_SETTINGS,
  family_display_name: "Saved family",
};

describe("family profile schema compatibility", () => {
  afterEach(() => {
    mocks.from.mockReset();
    mocks.getSession.mockReset();
    mocks.getUser.mockReset();
    vi.restoreAllMocks();
  });

  it("uses the legacy read without invoking the clean fallback", async () => {
    const legacyQuery = makeQuery({ data: [legacyProfile], error: null }, "direct-or");
    const settingsQuery = makeQuery({ data: null, error: null }, "family-settings");
    queueQueries([
      { table: "family_profiles", chain: legacyQuery },
      { table: "family_settings", chain: settingsQuery },
    ]);

    const profile = await loadFamilyProfile("user-1");

    expect(profile.family_display_name).toBe("Production family");
    expect(mocks.from).toHaveBeenCalledTimes(2);
  });

  it.each([
    ["42703", "column family_profiles.user_id does not exist"],
    ["PGRST204", "Could not find the 'user_id' column of 'family_profiles' in the schema cache"],
  ])("falls back to the clean schema for %s", async (code, message) => {
    const legacyQuery = makeQuery(
      { data: null, error: { code, message } },
      "direct-or",
    );
    const membershipQuery = makeQuery(
      {
        data: [{ id: "membership-1", family_id: "family-clean", user_id: "user-1" }],
        error: null,
      },
      "direct-eq",
    );
    const cleanQuery = makeQuery({ data: [cleanProfile], error: null }, "direct-in");
    queueQueries([
      { table: "family_profiles", chain: legacyQuery },
      { table: "family_members", chain: membershipQuery },
      { table: "family_profiles", chain: cleanQuery },
    ]);

    const profile = await loadFamilyProfile("user-1");

    expect(profile).toMatchObject({
      id: "family-clean",
      user_id: "user-1",
      owner_user_id: "user-1",
      family_display_name: "Staging family",
      country: "au",
      curriculum_jurisdiction_id: "TAS",
      default_child_id: "learner-1",
      evidence_privacy_default: "family",
      portfolio_print_style: "calm",
      reporting_mode: "authority-ready",
    });
    expect(membershipQuery.eq).toHaveBeenCalledWith("user_id", "user-1");
  });

  it.each([
    [{ status: 401, message: "Invalid JWT" }],
    [{ status: 403, message: "Forbidden" }],
    [{ code: "42501", message: "permission denied for table family_profiles" }],
    [new Error("fetch failed")],
    [new Error("family_profiles timed out after 12000ms")],
    [{ code: "42P01", message: 'relation "family_profiles" does not exist' }],
  ])("does not use clean fallback for non-column failures", async (error) => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    queueQueries([
      { table: "family_profiles", chain: makeQuery({ data: null, error }, "direct-or") },
    ]);

    const profile = await loadFamilyProfile("user-1");

    expect(profile.id).toBe("local");
    expect(mocks.from).toHaveBeenCalledTimes(1);
    expect(describeSupabaseError(error)).not.toBe("{}");
    expect(consoleError).toHaveBeenCalled();
  });

  it("preserves a successful legacy write without touching clean tables", async () => {
    mocks.getSession.mockResolvedValue({ data: { session: { user: { id: "user-1" } } } });
    const legacyRead = makeQuery({ data: [], error: null }, "direct-or");
    const legacyWrite = makeQuery({ data: legacyProfile, error: null }, "write");
    const settingsWrite = makeQuery({ data: null, error: null }, "family-settings");
    const queries = queueQueries([
      { table: "family_profiles", chain: legacyRead },
      { table: "family_profiles", chain: legacyWrite },
      { table: "family_settings", chain: settingsWrite },
    ]);

    const profile = await upsertFamilyProfile(settings);

    expect(profile.family_display_name).toBe("Saved family");
    expect(queries[1].chain.insert).toHaveBeenCalled();
    expect(mocks.from).toHaveBeenCalledTimes(3);
  });

  it("uses the clean write contract after a legacy schema error", async () => {
    mocks.getSession.mockResolvedValue({ data: { session: { user: { id: "user-1" } } } });
    const legacyRead = makeQuery(
      { data: null, error: { code: "42703", message: "column family_profiles.user_id does not exist" } },
      "direct-or",
    );
    const membershipQuery = makeQuery(
      { data: [{ id: "membership-1", family_id: "family-clean", user_id: "user-1" }], error: null },
      "direct-eq",
    );
    const cleanRead = makeQuery({ data: [], error: null }, "direct-in");
    const cleanWrite = makeQuery({ data: cleanProfile, error: null }, "write");
    const queries = queueQueries([
      { table: "family_profiles", chain: legacyRead },
      { table: "family_members", chain: membershipQuery },
      { table: "family_profiles", chain: cleanRead },
      { table: "family_profiles", chain: cleanWrite },
    ]);

    const profile = await upsertFamilyProfile(settings);

    expect(profile.id).toBe("family-clean");
    expect(queries[3].chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        created_by_user_id: "user-1",
        display_name: "Saved family",
      }),
    );
    expect(queries[3].chain.insert.mock.calls[0][0]).not.toHaveProperty("user_id");
    expect(queries[3].chain.insert.mock.calls[0][0]).not.toHaveProperty("owner_user_id");
    expect(mocks.from).toHaveBeenCalledTimes(4);
  });

  it("falls back to a membership-scoped clean write when the legacy write fails its schema contract", async () => {
    mocks.getSession.mockResolvedValue({ data: { session: { user: { id: "user-1" } } } });
    const legacyRead = makeQuery({ data: [legacyProfile], error: null }, "direct-or");
    const legacyWrite = makeQuery(
      { data: null, error: { code: "42703", message: "column family_profiles.user_id does not exist" } },
      "write",
    );
    const membershipQuery = makeQuery(
      { data: [{ id: "membership-1", family_id: "family-clean", user_id: "user-1" }], error: null },
      "direct-eq",
    );
    const cleanRead = makeQuery({ data: [cleanProfile], error: null }, "direct-in");
    const cleanWrite = makeQuery({ data: cleanProfile, error: null }, "write");
    const queries = queueQueries([
      { table: "family_profiles", chain: legacyRead },
      { table: "family_profiles", chain: legacyWrite },
      { table: "family_members", chain: membershipQuery },
      { table: "family_profiles", chain: cleanRead },
      { table: "family_profiles", chain: cleanWrite },
    ]);

    const profile = await upsertFamilyProfile(settings);

    expect(profile.id).toBe("family-clean");
    expect(queries[4].chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ display_name: "Saved family" }),
    );
    expect(queries[4].chain.update.mock.calls[0][0]).not.toHaveProperty("user_id");
    expect(queries[4].chain.update.mock.calls[0][0]).not.toHaveProperty("owner_user_id");
  });
});
