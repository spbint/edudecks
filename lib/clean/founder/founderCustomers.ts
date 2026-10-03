import { createClient, type User } from "@supabase/supabase-js";

const AUTH_PAGE_SIZE = 1000;
const ROW_PAGE_SIZE = 1000;
export const FOUNDER_ANALYTICS_INTERNAL_ACCOUNTS = [
  { email: "sean@mylearna.com", userId: "dd9b618d-96a9-4c83-bbcb-8fe0ee824ee7" },
  { email: "seanbint@live.com", userId: "01c1ad61-7c74-4c6d-86a6-e9d31769b761" },
  { email: "sbint@channel.tas.edu.au", userId: "4ac4d07f-0bc5-4f3d-9c4d-331966d8ada3" },
] as const;
export const FOUNDER_ANALYTICS_SUSPICIOUS_ACCOUNTS = [
  { email: "nikow54520@prorises.com", userId: "5a36899d-e867-45fd-ac85-b0b23f556c00" },
  { email: "vatoh27112@mapsguy.com", userId: "2bc5dc3b-bf3f-44a4-a9bd-a4f01bad81e5" },
  { email: "vegal19298@mediseat.com", userId: "7e9f1ff7-9c42-4597-91a7-0dd47174f229" },
  { email: "sodimin902@kikaga.com", userId: "b757c2bf-5bb4-4de5-b27c-1bc0df1a9398" },
] as const;
export const FOUNDER_ANALYTICS_INTERNAL_EMAILS = FOUNDER_ANALYTICS_INTERNAL_ACCOUNTS.map((account) => account.email);
export const FOUNDER_ANALYTICS_INTERNAL_USER_IDS = FOUNDER_ANALYTICS_INTERNAL_ACCOUNTS.map((account) => account.userId);
export const FOUNDER_ANALYTICS_SUSPICIOUS_EMAILS = FOUNDER_ANALYTICS_SUSPICIOUS_ACCOUNTS.map((account) => account.email);
export const FOUNDER_ANALYTICS_SUSPICIOUS_USER_IDS = FOUNDER_ANALYTICS_SUSPICIOUS_ACCOUNTS.map((account) => account.userId);
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
