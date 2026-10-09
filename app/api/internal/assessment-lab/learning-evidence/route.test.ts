import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  getServerAuthClient: vi.fn(),
  createSmokeClient: vi.fn(),
  parse: vi.fn(),
  save: vi.fn(),
  load: vi.fn(),
}));

vi.mock("@/lib/auth/serverRouteAuth", () => ({
  getServerAuthClient: mocks.getServerAuthClient,
}));
vi.mock(
  "@/lib/clean/educationalIntelligence/persistence/staffLearningEvidenceSmokeEnvironment.server",
  () => ({ createStaffLearningEvidenceSmokeClient: mocks.createSmokeClient }),
);
vi.mock(
  "@/lib/clean/educationalIntelligence/persistence/staffLearningEvidenceSmoke.server",
  async (importOriginal) => {
    const actual = await importOriginal<
      typeof import("@/lib/clean/educationalIntelligence/persistence/staffLearningEvidenceSmoke.server")
    >();
    return {
      ...actual,
      parseStaffLearningEvidenceSaveRequest: mocks.parse,
      saveTrustedStaffLearningEvidence: mocks.save,
      loadStaffLearningEvidenceHistory: mocks.load,
    };
  },
);

import { GET, POST } from "./route";

function authClient(input: { userId?: string; admin?: boolean; profileError?: boolean }) {
  return {
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: input.userId ? { id: input.userId } : null },
        error: input.userId ? null : { message: "missing" },
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(async () => ({
            data: input.admin ? { is_admin: true } : { is_admin: false },
            error: input.profileError ? { message: "profile error" } : null,
          })),
        })),
      })),
    })),
  };
}

const parsedRequest = {
  operation: "save-starting-point" as const,
  familyId: "20000000-0000-4000-8000-000000000001",
  learnerId: "30000000-0000-4000-8000-000000000001",
  attemptId: "staff-ei-smoke:initial:learner:2026-10-09",
  attemptKind: "initial" as const,
  draft: { attempt: {}, responses: [] },
};

describe("staff Learning Evidence persistence endpoint", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getServerAuthClient.mockResolvedValue(
      authClient({ userId: "10000000-0000-4000-8000-000000000001", admin: true }),
    );
    mocks.createSmokeClient.mockReturnValue({ client: { staging: true } });
    mocks.parse.mockReturnValue(parsedRequest);
    mocks.save.mockResolvedValue({
      target: { branchName: "intelligence-staging", projectRef: "owvxggviughmpursepof" },
      saved: { attemptId: parsedRequest.attemptId, resultCount: 5 },
    });
    mocks.load.mockResolvedValue({
      target: { branchName: "intelligence-staging", projectRef: "owvxggviughmpursepof" },
      learner: { id: parsedRequest.learnerId, displayName: "Test learner" },
      attempts: [],
    });
  });

  it("denies unauthenticated writes before parsing or opening staging", async () => {
    mocks.getServerAuthClient.mockResolvedValue(authClient({}));
    const response = await POST(
      new Request("http://localhost/api/internal/assessment-lab/learning-evidence", {
        method: "POST",
        body: "{}",
      }),
    );
    expect(response.status).toBe(401);
    expect(mocks.parse).not.toHaveBeenCalled();
    expect(mocks.createSmokeClient).not.toHaveBeenCalled();
  });

  it("denies an authenticated ordinary customer without revealing the route", async () => {
    mocks.getServerAuthClient.mockResolvedValue(
      authClient({ userId: "customer", admin: false }),
    );
    const response = await POST(
      new Request("http://localhost/api/internal/assessment-lab/learning-evidence", {
        method: "POST",
        body: "{}",
      }),
    );
    expect(response.status).toBe(404);
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it("passes only parsed evidence plus the authenticated staff identity to authority replay", async () => {
    const response = await POST(
      new Request("http://localhost/api/internal/assessment-lab/learning-evidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft: { client: "untrusted" } }),
      }),
    );
    expect(response.status).toBe(200);
    expect(mocks.save).toHaveBeenCalledWith({
      client: { staging: true },
      actorUserId: "10000000-0000-4000-8000-000000000001",
      request: parsedRequest,
    });
    expect(response.headers.get("cache-control")).toContain("no-store");
  });

  it("loads persisted history server-side for an authorised staff tenant", async () => {
    const response = await GET(
      new Request(
        `http://localhost/api/internal/assessment-lab/learning-evidence?familyId=${parsedRequest.familyId}&learnerId=${parsedRequest.learnerId}`,
      ),
    );
    expect(response.status).toBe(200);
    expect(mocks.load).toHaveBeenCalledWith({
      client: { staging: true },
      actorUserId: "10000000-0000-4000-8000-000000000001",
      familyId: parsedRequest.familyId,
      learnerId: parsedRequest.learnerId,
    });
  });
});
