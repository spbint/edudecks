import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  userId: "user-1" as string | null,
  role: "owner" as "owner" | "parent" | "caregiver" | null,
  familyId: "family-1",
}));

const getServerAuthClient = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth/serverRouteAuth", () => ({ getServerAuthClient }));

import {
  authorizeCalendarFamilyMember,
  authorizeCalendarIntegrationManager,
} from "@/lib/clean/calendar-integrations/serverAuthorization";

function client() {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn(),
  };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.maybeSingle.mockImplementation(async () => ({
    data:
      state.userId && state.role
        ? { family_id: state.familyId, user_id: state.userId, role: state.role }
        : null,
    error: null,
  }));
  return {
    auth: {
      getUser: vi.fn().mockImplementation(async () => ({
        data: { user: state.userId ? { id: state.userId } : null },
        error: null,
      })),
    },
    from: vi.fn().mockReturnValue(query),
    query,
  };
}

describe("calendar server authorization", () => {
  beforeEach(() => {
    state.userId = "user-1";
    state.role = "owner";
    state.familyId = "family-1";
    getServerAuthClient.mockReset();
    getServerAuthClient.mockImplementation(async () => client());
  });

  it.each(["owner", "parent"] as const)("allows an exact family %s to manage", async (role) => {
    state.role = role;
    const result = await authorizeCalendarIntegrationManager("family-1");
    expect(result.context).toMatchObject({ familyId: "family-1", userId: "user-1", role });
  });

  it("denies caregivers from management while allowing ordinary family sync triggering", async () => {
    state.role = "caregiver";
    await expect(authorizeCalendarIntegrationManager("family-1")).rejects.toMatchObject({
      status: 403,
      code: "forbidden",
    });
    await expect(authorizeCalendarFamilyMember("family-1")).resolves.toMatchObject({
      context: { role: "caregiver" },
    });
  });

  it("denies non-members and unauthenticated callers", async () => {
    state.role = null;
    await expect(authorizeCalendarIntegrationManager("family-2")).rejects.toMatchObject({
      status: 403,
    });
    state.userId = null;
    await expect(authorizeCalendarIntegrationManager("family-1")).rejects.toMatchObject({
      status: 401,
    });
  });

  it("queries the explicit family and authenticated user", async () => {
    const fake = client();
    getServerAuthClient.mockResolvedValue(fake);
    await authorizeCalendarIntegrationManager("family-1");
    expect(fake.query.eq).toHaveBeenNthCalledWith(1, "family_id", "family-1");
    expect(fake.query.eq).toHaveBeenNthCalledWith(2, "user_id", "user-1");
  });
});
