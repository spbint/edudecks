import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { MYLEARNA_CLASSICAL_ENCOUNTER_ONE } from "@/lib/clean/curriculum/classicalCurriculumRegistry";
import { MYLEARNA_MARKETPLACE_RESOURCES } from "@/lib/marketplace/mylearnaCatalog";

const home = readFileSync("app/marketplace/page.tsx", "utf8");
const card = readFileSync("app/marketplace/MylearnaIncludedResourceCard.tsx", "utf8");
const detail = readFileSync("app/marketplace/mylearna/[handle]/page.tsx", "utf8");
const catalogue = readFileSync("lib/marketplace/mylearnaCatalog.ts", "utf8");
const login = readFileSync("app/login/page.tsx", "utf8");
const emailAuth = readFileSync("app/components/EmailAuthPage.tsx", "utf8");
const authCallback = readFileSync("app/auth/callback/page.tsx", "utf8");
const settings = readFileSync("app/components/clean/CleanSettingsWorkspace.tsx", "utf8");
const calendar = readFileSync("app/components/clean/CleanCalendarWorkspace.tsx", "utf8");
const sessionEscape = readFileSync("lib/authSessionEscape.ts", "utf8");
const profile = readFileSync("app/components/clean/CleanProfileWorkspace.tsx", "utf8");

describe("first-party MyLearna Marketplace catalogue", () => {
  it("appears alongside Shopify without entering the cart flow", () => {
    expect(home).toContain("Included with MyLearna");
    expect(home).toContain("MYLEARNA_MARKETPLACE_RESOURCES");
    expect(card).toContain("Included with MyLearna Family");
    expect(detail).not.toContain("AddToCartPanel");
    expect(detail).not.toContain("useMarketplaceCart");
  });

  it("preserves Cupboard and Pathways destinations through sign-in and setup", () => {
    expect(detail).toContain('"/my-resources?add_marketplace="');
    expect(detail).toContain('const saveHref = \`/login?next=');
    expect(detail).toContain("pathwaysLoginHref");
    expect(detail).toContain("encodeURIComponent(resource.pathwayHref)");
    expect(detail).toContain("Save to My Resource Cupboard");
    expect(detail).toContain("Open in My Pathways");
    expect(login).toContain('<EmailAuthPage mode="login" />');
    expect(login).not.toContain("getAuthenticatedRouteUser");
    expect(login).not.toContain("redirect(");
    expect(emailAuth).toContain("handleContinueExistingSession");
    expect(emailAuth).toContain("router.replace(await resolveFirstAppPath(nextPath))");
    expect(emailAuth).toContain("rememberPendingMarketplaceDestination");
    expect(emailAuth).toContain('nextPath.startsWith("/my-resources")');
    expect(emailAuth).toContain('"My Resource Cupboard"');
    expect(authCallback).toContain("rememberPendingMarketplaceDestination");
    expect(settings).toContain("consumePendingMarketplaceDestination");
    expect(settings).toContain("if (firstSetupMode)");
    expect(settings).toContain('router.push("/my-calendar")');
    expect(calendar).toContain("consumePendingMarketplaceDestination");
    expect(calendar).toContain('pendingMarketplaceDestination || "/my-day"');
    expect(profile).toContain("consumePendingMarketplaceDestination");
    expect(profile).toContain('destination === "/my-day"');
    expect(profile).toContain(
      "router.push(pendingMarketplaceDestination || destination)",
    );
    expect(sessionEscape).toContain(
      '"mylearna.auth.pendingMarketplaceDestination"',
    );
    expect(catalogue).toContain("pathwayHref:");
    expect(MYLEARNA_MARKETPLACE_RESOURCES[0]).toMatchObject({
      externalProductId: MYLEARNA_CLASSICAL_ENCOUNTER_ONE.distribution.externalProductId,
      handle: MYLEARNA_CLASSICAL_ENCOUNTER_ONE.distribution.marketplaceHandle,
      pathwayStepId: MYLEARNA_CLASSICAL_ENCOUNTER_ONE.pathway.pathwayStepId,
      pdfHref: MYLEARNA_CLASSICAL_ENCOUNTER_ONE.resource.pdfHref,
      accessModel: "family_included",
      entitlementKey: "family_subscription",
    });
  });

  it("models encounter, unit, cycle, and future physical-pack hierarchy", () => {
    expect(catalogue).toContain('"encounter"');
    expect(catalogue).toContain('"unit"');
    expect(catalogue).toContain('"cycle"');
    expect(catalogue).toContain('"physical-pack"');
    expect(catalogue).toContain("unitBundleKey");
    expect(catalogue).toContain("cycleBundleKey");
    expect(catalogue).toContain("futurePhysicalPackSupported");
  });
});
