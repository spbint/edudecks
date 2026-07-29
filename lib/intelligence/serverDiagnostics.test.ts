import { afterEach, describe, expect, it, vi } from "vitest";
import { createIntelligenceRouteDiagnostics } from "@/lib/intelligence/serverDiagnostics";

describe("intelligence route diagnostics", () => {
  afterEach(() => vi.restoreAllMocks());

  it("logs only sanitised diagnostic fields with one correlation id", () => {
    const error = Object.assign(new Error("failed for user 6705a62b-cfcb-41d8-8f13-5c8f7128f525 at https://private.example/token"), { code: "PGRST204", status: 503 });
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const failure = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const diagnostics = createIntelligenceRouteDiagnostics("/api/intelligence/resources");

    diagnostics.stageStart("owned_resources_lookup");
    diagnostics.stageFailure("owned_resources_lookup", error);
    diagnostics.responseReady();

    expect(failure).toHaveBeenCalledWith("intelligence_route_stage_failed", expect.objectContaining({
      route: "/api/intelligence/resources",
      stage: "owned_resources_lookup_failure",
      errorClass: "Error",
      code: "PGRST204",
      status: 503,
    }));
    const failurePayload = failure.mock.calls[0][1] as Record<string, unknown>;
    expect(String(failurePayload.message)).not.toContain("6705a62b-cfcb");
    expect(String(failurePayload.message)).not.toContain("https://");
    const ids = [...info.mock.calls, ...failure.mock.calls].map(([, payload]) => (payload as { correlationId: string }).correlationId);
    expect(new Set(ids).size).toBe(1);
  });
});
