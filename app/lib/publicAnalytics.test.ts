import { describe, expect, it } from "vitest";
import {
  buildPublicAcquisitionParams,
  classifyPublicTrafficSource,
  getOrSetPublicTrafficSource,
  PUBLIC_SOURCE_STORAGE_KEY,
} from "./publicAnalytics";

describe("public traffic source classification", () => {
  it.each([
    ["https://chatgpt.com/", null, "chatgpt"],
    ["https://www.perplexity.ai/", null, "perplexity"],
    ["https://gemini.google.com/", null, "gemini"],
    ["https://copilot.microsoft.com/", null, "copilot"],
    ["https://claude.ai/", null, "claude"],
    [null, "other-ai-assistant", "other-ai"],
    [null, null, "direct"],
    ["https://example.com/", null, "other-referral"],
  ])("classifies %s / %s as %s", (referrer, source, expected) => {
    expect(classifyPublicTrafficSource({ referrer, source })).toBe(expected);
  });

  it("preserves the original category across same-site navigation", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    };

    expect(getOrSetPublicTrafficSource({ referrer: "https://chatgpt.com/" }, storage)).toBe("chatgpt");
    expect(getOrSetPublicTrafficSource({ referrer: "https://www.mylearna.com/" }, storage)).toBe("chatgpt");
    expect(values.get(PUBLIC_SOURCE_STORAGE_KEY)).toBe("chatgpt");
  });

  it("classifies an explicit AI source before query data is discarded", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    };

    expect(getOrSetPublicTrafficSource({ source: "claude" }, storage)).toBe("claude");
  });

  it("emits only an anonymous category and pathname", () => {
    const params = buildPublicAcquisitionParams("perplexity", "/demo");
    expect(params).toEqual({ public_source: "perplexity", page_path: "/demo" });
    expect(JSON.stringify(params)).not.toContain("perplexity.ai");
    expect(JSON.stringify(params)).not.toContain("utm_");
    expect(JSON.stringify(params)).not.toMatch(/learner|family|evidence|report|child/i);
  });
});
