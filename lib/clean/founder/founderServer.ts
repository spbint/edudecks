import { createClient, type User } from "@supabase/supabase-js";
import {
  buildFounderCockpitData,
  type FounderAccountSnapshot,
  type FounderAcquisitionChannel,
  type FounderCommerceSnapshot,
  type FounderDataProviders,
  type FounderProductAnalyticsSnapshot,
} from "@/lib/clean/founder/founderData";

const FOUNDER_TIME_ZONE = "Australia/Hobart";
const AUTH_PAGE_SIZE = 1000;

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function createFounderAdminClient() {
  const url = clean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = clean(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY);
  if (!url || !key) return null;

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

type FounderAdminClient = NonNullable<ReturnType<typeof createFounderAdminClient>>;

function dateKey(date: Date) {
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone: FOUNDER_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function weekStartKey(date: Date) {
  const localKey = dateKey(date);
  const [year, month, day] = localKey.split("-").map(Number);
  const localDateAsUtc = new Date(Date.UTC(year, month - 1, day));
  const daysSinceMonday = (localDateAsUtc.getUTCDay() + 6) % 7;
  localDateAsUtc.setUTCDate(localDateAsUtc.getUTCDate() - daysSinceMonday);
  return localDateAsUtc.toISOString().slice(0, 10);
}

function validDate(value: string | null | undefined) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

export function classifyFounderAcquisition(
  source: unknown,
  referrer: unknown,
): FounderAcquisitionChannel {
  const cleanSource = clean(source).toLowerCase();
  const cleanReferrer = clean(referrer).toLowerCase();
  const combined = `${cleanSource} ${cleanReferrer}`;
  if (/pinterest|pin\.it/.test(combined)) return "Pinterest";
  if (/google/.test(combined)) return "Google";
  if (!cleanSource && !cleanReferrer) return "Direct";
  if (/facebook|instagram|tiktok|twitter|x\.com|linkedin|threads\.net/.test(combined)) {
    return "Social";
  }
  return "Other";
}

async function listAllUsers(admin: FounderAdminClient) {
  const users: User[] = [];
  let page = 1;

  for (;;) {
    const response = await admin.auth.admin.listUsers({ page, perPage: AUTH_PAGE_SIZE });
    if (response.error) throw new Error("Founder account metrics are unavailable.");
    users.push(...response.data.users);
    if (response.data.users.length < AUTH_PAGE_SIZE) return users;
    page += 1;
  }
}

async function countActiveFamilies(
  admin: FounderAdminClient,
  activeUserIds: string[],
) {
  if (activeUserIds.length === 0) return 0;

  const familyIds = new Set<string>();
  for (let index = 0; index < activeUserIds.length; index += 200) {
    const userIdChunk = activeUserIds.slice(index, index + 200);
    const result = await admin
      .from("family_members")
      .select("family_id")
      .in("user_id", userIdChunk);
    if (result.error) return null;
    for (const row of (result.data ?? []) as Array<{ family_id?: unknown }>) {
      if (typeof row.family_id === "string") familyIds.add(row.family_id);
    }
  }
  return familyIds.size;
}

async function loadSignupAcquisition(
  admin: FounderAdminClient,
  now: Date,
): Promise<Record<FounderAcquisitionChannel, number> | null> {
  const earliestRelevantInstant = new Date(now.getTime() - 36 * 60 * 60 * 1000).toISOString();
  const rows: Array<{ source?: unknown; referrer?: unknown; created_at?: unknown }> = [];
  for (let page = 0; ; page += 1) {
    const result = await admin
      .from("signup_notifications")
      .select("source,referrer,created_at")
      .gte("created_at", earliestRelevantInstant)
      .range(page * 1000, page * 1000 + 999);
    if (result.error) return null;
    rows.push(
      ...((result.data ?? []) as Array<{
        source?: unknown;
        referrer?: unknown;
        created_at?: unknown;
      }>),
    );
    if ((result.data ?? []).length < 1000) break;
  }

  const counts: Record<FounderAcquisitionChannel, number> = {
    Pinterest: 0,
    Google: 0,
    Direct: 0,
    Social: 0,
    Other: 0,
  };
  const today = dateKey(now);
  for (const row of rows) {
    const createdAt = validDate(typeof row.created_at === "string" ? row.created_at : null);
    if (!createdAt || dateKey(createdAt) !== today) continue;
    counts[classifyFounderAcquisition(row.source, row.referrer)] += 1;
  }
  return counts;
}

export function summarizeFounderAuthUsers(users: User[], now = new Date()) {
  const today = dateKey(now);
  const currentWeekStart = weekStartKey(now);
  const activeUsers = users.filter((user) => {
    const signedInAt = validDate(user.last_sign_in_at);
    if (!signedInAt) return false;
    const signedInKey = dateKey(signedInAt);
    return signedInKey >= currentWeekStart && signedInKey <= today;
  });
  const returningActiveUsers = activeUsers.filter((user) => {
    const createdAt = validDate(user.created_at);
    return createdAt !== null && dateKey(createdAt) < currentWeekStart;
  });

  return {
    signupsToday: users.filter((user) => {
      const createdAt = validDate(user.created_at);
      return createdAt !== null && dateKey(createdAt) === today;
    }).length,
    returningToday: users.filter((user) => {
      const createdAt = validDate(user.created_at);
      const signedInAt = validDate(user.last_sign_in_at);
      return (
        createdAt !== null &&
        signedInAt !== null &&
        dateKey(createdAt) !== today &&
        dateKey(signedInAt) === today
      );
    }).length,
    activeThisWeek: activeUsers.length,
    returningUserIds: returningActiveUsers.map((user) => user.id),
    recentActivity: users
      .map((user) => validDate(user.created_at))
      .filter((createdAt): createdAt is Date => createdAt !== null)
      .sort((left, right) => right.getTime() - left.getTime())
      .slice(0, 8)
      .map((createdAt) => ({ kind: "signup" as const, occurredAt: createdAt.toISOString() })),
  };
}

export async function loadFounderAccountSnapshot(
  now = new Date(),
): Promise<FounderAccountSnapshot | null> {
  const admin = createFounderAdminClient();
  if (!admin) return null;

  try {
    const users = await listAllUsers(admin);
    const summary = summarizeFounderAuthUsers(users, now);

    return {
      signupsToday: summary.signupsToday,
      returningToday: summary.returningToday,
      activeThisWeek: summary.activeThisWeek,
      returningFamiliesThisWeek: await countActiveFamilies(
        admin,
        summary.returningUserIds,
      ),
      acquisitionToday: await loadSignupAcquisition(admin, now),
      recentActivity: summary.recentActivity,
    };
  } catch {
    return null;
  }
}

export async function loadFounderProductAnalyticsSnapshot(): Promise<FounderProductAnalyticsSnapshot | null> {
  // Product Analytics V1 captures privacy-safe events but has no server query client.
  return null;
}

export async function loadFounderCommerceSnapshot(): Promise<FounderCommerceSnapshot | null> {
  // The configured Storefront API supports catalogue/cart operations, not order analytics.
  return null;
}

export async function loadFounderCockpitData(
  overrides: Partial<FounderDataProviders> = {},
  now = new Date(),
) {
  return buildFounderCockpitData(
    {
      accounts: overrides.accounts ?? (() => loadFounderAccountSnapshot(now)),
      productAnalytics: overrides.productAnalytics ?? loadFounderProductAnalyticsSnapshot,
      commerce: overrides.commerce ?? loadFounderCommerceSnapshot,
    },
    now,
  );
}
