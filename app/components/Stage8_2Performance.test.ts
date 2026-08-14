import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { getMobilePrefetchDestinations } from "@/app/components/clean/design-v2/MyLearnaAppShellV2";

const providerSource = readFileSync(
  join(process.cwd(), "app/components/FamilyWorkspaceProvider.tsx"),
  "utf8",
);
const cleanProviderSource = readFileSync(
  join(process.cwd(), "app/components/clean/CleanFamilyWorkspaceProvider.tsx"),
  "utf8",
);
const shellSource = readFileSync(
  join(process.cwd(), "app/components/clean/design-v2/MyLearnaAppShellV2.tsx"),
  "utf8",
);

describe("Stage 8.2 loading and navigation fluidity", () => {
  it("prefetches only predictable lightweight destinations by pillar", () => {
    expect(getMobilePrefetchDestinations("PLAN")).toEqual([
      "/my-day",
      "/my-settings",
      "/my-capture?mode=quick",
      "/my-calendar",
    ]);
    expect(getMobilePrefetchDestinations("CAPTURE")).toContain("/my-portfolio");
    expect(getMobilePrefetchDestinations("GROW")).toContain("/my-reports");
    expect(getMobilePrefetchDestinations("day")).not.toContain("/my-reports");
    expect(shellSource).toContain("requestIdleCallback");
    expect(shellSource).toContain("connection?.saveData");
  });

  it("keeps valid workspace content during warm refreshes", () => {
    expect(providerSource).toContain("hasLoadedWorkspaceRef");
    expect(providerSource).toContain("if (!hasLoadedWorkspaceRef.current) setLoading(true)");
    expect(providerSource).toContain("requestGenerationRef");
    expect(cleanProviderSource).toContain("if (!hasLoadedWorkspaceRef.current) setLoading(true)");
  });

  it("clears the previous workspace when the authenticated user changes", () => {
    expect(providerSource).toContain("emptyWorkspace(nextUserId)");
    expect(providerSource).toContain("reloadInFlightRef.current = null");
    expect(providerSource).toContain("requestGenerationRef.current += 1");
  });
});
