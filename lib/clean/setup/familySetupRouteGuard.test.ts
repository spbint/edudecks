import { describe, expect, it } from "vitest";
import {
  getFamilySetupRedirectPath,
  shouldHoldForFamilySetup,
} from "./familySetupRouteGuard";

const baseState = {
  authenticated: true,
  pathname: "/my-day",
  loading: false,
  setupLoading: false,
  error: null,
  schemaMissing: false,
  hasProfile: false,
  learnerCount: 0,
};

describe("authenticated family setup route guard", () => {
  it("routes a fresh account and direct My Day visit to My Profile", () => {
    expect(getFamilySetupRedirectPath(baseState)).toBe("/my-profile");
  });

  it("routes a profile without learners back to My Profile", () => {
    expect(
      getFamilySetupRedirectPath({ ...baseState, hasProfile: true, pathname: "/my-settings" }),
    ).toBe("/my-profile");
  });

  it("keeps a configured returning family on its requested route", () => {
    expect(
      getFamilySetupRedirectPath({ ...baseState, hasProfile: true, learnerCount: 1 }),
    ).toBeNull();
  });

  it("waits for workspace state but leaves optional setup enrichment non-blocking", () => {
    expect(getFamilySetupRedirectPath({ ...baseState, loading: true })).toBeNull();
    expect(getFamilySetupRedirectPath({ ...baseState, setupLoading: true })).toBeNull();
    expect(getFamilySetupRedirectPath({ ...baseState, error: "workspace unavailable" })).toBeNull();
    expect(getFamilySetupRedirectPath({ ...baseState, schemaMissing: true })).toBeNull();
    expect(shouldHoldForFamilySetup({ ...baseState, loading: true })).toBe(true);
    expect(shouldHoldForFamilySetup({ ...baseState, setupLoading: true })).toBe(false);
  });

  it("allows the profile route and clean route keeps its clean destination", () => {
    expect(getFamilySetupRedirectPath({ ...baseState, pathname: "/my-profile" })).toBeNull();
    expect(getFamilySetupRedirectPath({ ...baseState, pathname: "/clean-my-day" })).toBe("/clean-my-profile");
  });
});
