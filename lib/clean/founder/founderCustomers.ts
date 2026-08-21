import { createClient, type User } from "@supabase/supabase-js";

const AUTH_PAGE_SIZE = 1000;
const ROW_PAGE_SIZE = 1000;

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

export type FounderCustomerStatus = "New" | "Onboarding" | "Active" | "At risk" | "Inactive";

export type FounderCustomer = {
  userId: string;
  email: string | null;
  joinedAt: string;
  lastActiveAt: string | null;
  familyDisplayName: string | null;
  countryCode: string | null;
  jurisdictionCode: string | null;
  learnerCount: number;
  profileCompleted: boolean;
  status: FounderCustomerStatus;
};

export type FounderCustomersData = {
  generatedAt: string;
  totals: {
    customers: number;
    completedProfiles: number;
    learners: number;
    activeLast7Days: number;
  };
  customers: FounderCustomer[];
};

type FamilyMemberRow = { user_id: string; family_id: string };
type FamilyProfileRow = {
  id: string;
  display_name: string | null;
  country_code: string | null;
  jurisdiction_code: string | null;
};
type LearnerRow = { family_id: string };
type AdminProfileRow = { id: string; is_admin: boolean | null };

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

function customerStatus(
  joinedAt: string,
  lastActiveAt: string | null,
  profileCompleted: boolean,
  now: Date,
): FounderCustomerStatus {
  if (!profileCompleted) return "Onboarding";

  const joined = new Date(joinedAt);
  const joinedAgeMs = now.getTime() - joined.getTime();
  if (joinedAgeMs <= 48 * 60 * 60 * 1000) return "New";

  if (!lastActiveAt) return "Inactive";
  const lastActive = new Date(lastActiveAt);
  const inactiveMs = now.getTime() - lastActive.getTime();
  if (inactiveMs <= 7 * 24 * 60 * 60 * 1000) return "Active";
  if (inactiveMs <= 30 * 24 * 60 * 60 * 1000) return "At risk";
  return "Inactive";
}

export async function loadFounderAdminUserIds(): Promise<string[]> {
  const admin = createFounderAdminClient();
  if (!admin) return [];

  try {
    const profiles = await listAllRows<AdminProfileRow>((from, to) =>
      admin.from("profiles").select("id,is_admin").eq("is_admin", true).range(from, to),
    );
    return profiles.filter((profile) => profile.is_admin === true).map((profile) => profile.id);
  } catch {
    return [];
  }
}

export async function loadFounderCustomers(now = new Date()): Promise<FounderCustomersData> {
  const admin = createFounderAdminClient();
  if (!admin) {
    return {
      generatedAt: now.toISOString(),
      totals: { customers: 0, completedProfiles: 0, learners: 0, activeLast7Days: 0 },
      customers: [],
    };
  }

  const [users, members, profiles, learners, adminProfiles] = await Promise.all([
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
    listAllRows<AdminProfileRow>((from, to) =>
      admin.from("profiles").select("id,is_admin").eq("is_admin", true).range(from, to),
    ),
  ]);

  const adminUserIds = new Set(
    adminProfiles.filter((profile) => profile.is_admin === true).map((profile) => profile.id),
  );
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
    .filter((user) => !adminUserIds.has(user.id))
    .map((user): FounderCustomer | null => {
      const joinedAt = validIso(user.created_at);
      if (!joinedAt) return null;
      const familyId = familyIdByUserId.get(user.id) ?? null;
      const profile = familyId ? profileById.get(familyId) ?? null : null;
      const lastActiveAt = validIso(user.last_sign_in_at);
      const profileCompleted = Boolean(profile);

      return {
        userId: user.id,
        email: clean(user.email) || null,
        joinedAt,
        lastActiveAt,
        familyDisplayName: profile ? clean(profile.display_name) || null : null,
        countryCode: profile ? clean(profile.country_code) || null : null,
        jurisdictionCode: profile ? clean(profile.jurisdiction_code) || null : null,
        learnerCount: familyId ? learnerCountByFamilyId.get(familyId) ?? 0 : 0,
        profileCompleted,
        status: customerStatus(joinedAt, lastActiveAt, profileCompleted, now),
      };
    })
    .filter((customer): customer is FounderCustomer => customer !== null)
    .sort((left, right) => Date.parse(right.joinedAt) - Date.parse(left.joinedAt));

  const activeCutoff = now.getTime() - 7 * 24 * 60 * 60 * 1000;

  return {
    generatedAt: now.toISOString(),
    totals: {
      customers: customers.length,
      completedProfiles: customers.filter((customer) => customer.profileCompleted).length,
      learners: customers.reduce((total, customer) => total + customer.learnerCount, 0),
      activeLast7Days: customers.filter(
        (customer) => customer.lastActiveAt && Date.parse(customer.lastActiveAt) >= activeCutoff,
      ).length,
    },
    customers,
  };
}
