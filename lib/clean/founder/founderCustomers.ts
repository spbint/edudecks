import { createClient, type User } from "@supabase/supabase-js";

const AUTH_PAGE_SIZE = 1000;
const ROW_PAGE_SIZE = 1000;
export const FOUNDER_ANALYTICS_INTERNAL_EMAILS = [
  "sean@mylearna.com",
  "seanbint@live.com",
  "sbint@channel.tas.edu.au",
] as const;
export const FOUNDER_ANALYTICS_SUSPICIOUS_EMAILS = [
  "nikow54520@prorises.com",
  "vatoh27112@mapsguy.com",
  "vegal19298@mediseat.com",
  "sodimin902@kikaga.com",
] as const;
export const FOUNDER_ANALYTICS_EXCLUDED_EMAIL_DOMAINS = [
  "mailinator.com",
  "codoteam.com",
  "bezill.com",
  "hutdot.com",
] as const;

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

/** Explicit, auditable exclusions for confirmed Founder/internal and known synthetic accounts. */
export function isFounderExcludedAccount(email: unknown) {
  const normalized = clean(email).toLowerCase();
  if (!normalized) return false;
  if (FOUNDER_ANALYTICS_INTERNAL_EMAILS.includes(
    normalized as (typeof FOUNDER_ANALYTICS_INTERNAL_EMAILS)[number],
  )) return true;
  const atIndex = normalized.lastIndexOf("@");
  if (atIndex <= 0) return false;
  return FOUNDER_ANALYTICS_EXCLUDED_EMAIL_DOMAINS.includes(
    normalized.slice(atIndex + 1) as (typeof FOUNDER_ANALYTICS_EXCLUDED_EMAIL_DOMAINS)[number],
  );
}

/** Accounts worth comparing separately without declaring them internal or fake. */
export function isFounderSuspiciousAccount(email: unknown) {
  const normalized = clean(email).toLowerCase();
  if (!normalized) return false;
  return FOUNDER_ANALYTICS_SUSPICIOUS_EMAILS.includes(
    normalized as (typeof FOUNDER_ANALYTICS_SUSPICIOUS_EMAILS)[number],
  );
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

export type FounderCustomerBase = {
  userId: string;
  familyId: string | null;
  email: string | null;
  joinedAt: string;
  lastSignInAt: string | null;
  confirmedAt?: string | null;
  familyDisplayName: string | null;
  countryCode: string | null;
  jurisdictionCode: string | null;
  learnerCount: number;
  profileCompleted: boolean;
};

export type FounderCustomersSnapshot = {
  generatedAt: string;
  customers: FounderCustomerBase[];
};

type FamilyMemberRow = { user_id: string; family_id: string };
type FamilyProfileRow = {
  id: string;
  display_name: string | null;
  country_code: string | null;
  jurisdiction_code: string | null;
};
type LearnerRow = { family_id: string };

async function listAllUsers(admin: FounderAdminClient) {
  const users: User[] = [];
  let page = 1;
  for (;;) {
    const response = await admin.auth.admin.listUsers({ page, perPage: AUTH_PAGE_SIZE });
    if (response.error) throw new Error("Founder customer accounts are unavailable.");
    users.push(...response.data.users);
    if (response.data.users.length < AUTH_PAGE_SIZE) return users;
    page += 1;
  }
}

async function listAllRows<T>(
  loader: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
) {
  const rows: T[] = [];
  for (let page = 0; ; page += 1) {
    const result = await loader(page * ROW_PAGE_SIZE, page * ROW_PAGE_SIZE + ROW_PAGE_SIZE - 1);
    if (result.error) throw new Error("Founder customer profile data are unavailable.");
    const batch = result.data ?? [];
    rows.push(...batch);
    if (batch.length < ROW_PAGE_SIZE) return rows;
  }
}

function validIso(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

export async function loadFounderCustomers(
  now = new Date(),
  options: { includeInternal?: boolean } = {},
): Promise<FounderCustomersSnapshot> {
  const admin = createFounderAdminClient();
  if (!admin) return { generatedAt: now.toISOString(), customers: [] };

  const [users, members, profiles, learners] = await Promise.all([
    listAllUsers(admin),
    listAllRows<FamilyMemberRow>((from, to) =>
      admin.from("family_members").select("user_id,family_id").range(from, to),
    ),
    listAllRows<FamilyProfileRow>((from, to) =>
      admin
        .from("family_profiles")
        .select("id,display_name,country_code,jurisdiction_code")
        .range(from, to),
    ),
    listAllRows<LearnerRow>((from, to) =>
      admin.from("learners").select("family_id").range(from, to),
    ),
  ]);

  const familyIdByUserId = new Map(members.map((row) => [row.user_id, row.family_id]));
  const profileById = new Map(profiles.map((row) => [row.id, row]));
  const learnerCountByFamilyId = new Map<string, number>();
  for (const learner of learners) {
    learnerCountByFamilyId.set(
      learner.family_id,
      (learnerCountByFamilyId.get(learner.family_id) ?? 0) + 1,
    );
  }

  const customers = users
    .filter((user) => options.includeInternal || !isFounderExcludedAccount(user.email))
    .map((user): FounderCustomerBase | null => {
      const joinedAt = validIso(user.created_at);
      if (!joinedAt) return null;
      const familyId = familyIdByUserId.get(user.id) ?? null;
      const profile = familyId ? profileById.get(familyId) ?? null : null;

      return {
        userId: user.id,
        familyId,
        email: clean(user.email) || null,
        joinedAt,
        lastSignInAt: validIso(user.last_sign_in_at),
        confirmedAt: validIso(user.email_confirmed_at ?? user.confirmed_at),
        familyDisplayName: profile ? clean(profile.display_name) || null : null,
        countryCode: profile ? clean(profile.country_code) || null : null,
        jurisdictionCode: profile ? clean(profile.jurisdiction_code) || null : null,
        learnerCount: familyId ? learnerCountByFamilyId.get(familyId) ?? 0 : 0,
        profileCompleted: Boolean(profile),
      };
    })
    .filter((customer): customer is FounderCustomerBase => customer !== null)
    .sort((left, right) => Date.parse(right.joinedAt) - Date.parse(left.joinedAt));

  return { generatedAt: now.toISOString(), customers };
}
