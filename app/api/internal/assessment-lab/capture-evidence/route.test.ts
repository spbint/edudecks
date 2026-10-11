import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  getServerAuthClient: vi.fn(),
  createSmokeClient: vi.fn(),
  parse: vi.fn(),
  govern: vi.fn(),
  load: vi.fn(),
}));

vi.mock("@/lib/auth/serverRouteAuth", () => ({ getServerAuthClient: mocks.getServerAuthClient }));
vi.mock("@/lib/clean/educationalIntelligence/persistence/staffLearningEvidenceSmokeEnvironment.server", () => ({
  createStaffLearningEvidenceSmokeClient: mocks.createSmokeClient,
}));
vi.mock("@/lib/clean/educationalIntelligence/capture/staffCaptureLearningEvidence.server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/clean/educationalIntelligence/capture/staffCaptureLearningEvidence.server")>();
  return {
    ...actual,
    parseStaffCaptureEvidenceRequest: mocks.parse,
    governStaffCaptureEvidence: mocks.govern,
    loadStaffCaptureEvidenceHistory: mocks.load,
  };
});

import { GET, POST } from "./route";

function authClient(input: { userId?: string; admin?: boolean }) {
  return {
    auth: { getUser: vi.fn(async () => ({ data: { user: input.userId ? { id: input.userId } : null }, error: input.userId ? null : { message: "missing" } })) },
    from: vi.fn(() => ({ select: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle: vi.fn(async () => ({ data: { is_admin: input.admin === true }, error: null })) })) })) })),
  };
}

const request = {
  operation: "link-capture-evidence" as const,
  familyId: "41000000-0000-4000-8000-000000000001",
  learnerId: "42000000-0000-4000-8000-000000000001",
  evidenceId: "43000000-0000-4000-8000-000000000001",
  constructId: "MYL-MATH-AU-NUMERACY-V9::additive-strategies::at-least-P10",
  sourceType: "work-sample" as const,
};

describe("staff Capture evidence bridge endpoint", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getServerAuthClient.mockResolvedValue(authClient({ userId: "staff", admin: true }));
    mocks.createSmokeClient.mockReturnValue({ client: { staging: true } });
    mocks.parse.mockReturnValue(request);
    mocks.govern.mockResolvedValue({ link: { linkId: "link" }, reused: false });
    mocks.load.mockResolvedValue({ timeline: [] });
  });

  it("denies unauthenticated and ordinary-customer writes before opening staging", async () => {
    mocks.getServerAuthClient.mockResolvedValueOnce(authClient({}));
    expect((await POST(new Request("http://localhost/api", { method: "POST", body: "{}" }))).status).toBe(401);
    expect(mocks.createSmokeClient).not.toHaveBeenCalled();

    mocks.getServerAuthClient.mockResolvedValueOnce(authClient({ userId: "customer", admin: false }));
    expect((await POST(new Request("http://localhost/api", { method: "POST", body: "{}" }))).status).toBe(404);
    expect(mocks.govern).not.toHaveBeenCalled();
  });

  it("passes only a strictly parsed request and authenticated staff identity to staging", async () => {
    const response = await POST(new Request("http://localhost/api", { method: "POST", body: "{}" }));
    expect(response.status).toBe(200);
    expect(mocks.govern).toHaveBeenCalledWith({ client: { staging: true }, actorUserId: "staff", request });
    expect(response.headers.get("cache-control")).toContain("no-store");
  });

  it("loads persisted multi-source history server-side", async () => {
    const response = await GET(new Request(`http://localhost/api?familyId=${request.familyId}&learnerId=${request.learnerId}`));
    expect(response.status).toBe(200);
    expect(mocks.load).toHaveBeenCalledWith({ client: { staging: true }, actorUserId: "staff", familyId: request.familyId, learnerId: request.learnerId });
  });
});
