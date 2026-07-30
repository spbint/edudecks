import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getContext: vi.fn() }));
vi.mock("@/lib/intelligence/serverAuth", () => ({ getIntelligenceServerContext: mocks.getContext }));

import { GET } from "@/app/share/route";
import { extractSharedHttpUrl } from "@/lib/shareIntake";

describe("PWA share intake", () => {
  it("extracts direct and embedded HTTP URLs while rejecting unsafe schemes", () => {
    expect(extractSharedHttpUrl("https://example.com/activity")).toBe("https://example.com/activity");
    expect(extractSharedHttpUrl("Try this: https://example.com/activity.")).toBe("https://example.com/activity");
    expect(extractSharedHttpUrl("javascript:alert(1)")).toBeNull();
  });

  it("redirects signed-in parents to a confirmed My Ideas prefill", async () => {
    mocks.getContext.mockResolvedValue({ user: { id: "user-1" } });
    const response = await GET(new Request("http://localhost/share?url=https%3A%2F%2Fexample.com%2Factivity&title=Weather"));
    expect(response.headers.get("location")).toBe("http://localhost/my-ideas?sharedUrl=https%3A%2F%2Fexample.com%2Factivity&sharedTitle=Weather&source=share");
  });

  it("uses a safe login next value when signed out", async () => {
    mocks.getContext.mockResolvedValue(null);
    const response = await GET(new Request("http://localhost/share?text=See%20https%3A%2F%2Fexample.com%2Factivity"));
    const location = new URL(response.headers.get("location") || "http://localhost");
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("next")).toBe("/my-ideas?sharedUrl=https%3A%2F%2Fexample.com%2Factivity&source=share");
  });
});
