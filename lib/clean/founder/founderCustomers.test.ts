import { describe, expect, it } from "vitest";
import {
  FOUNDER_ANALYTICS_EXCLUDED_EMAIL_DOMAINS,
  FOUNDER_ANALYTICS_INTERNAL_EMAILS,
  FOUNDER_ANALYTICS_INTERNAL_USER_IDS,
  FOUNDER_ANALYTICS_SUSPICIOUS_EMAILS,
  FOUNDER_ANALYTICS_SUSPICIOUS_USER_IDS,
  isFounderExcludedAccount,
  isFounderSuspiciousAccount,
} from "@/lib/clean/founder/founderCustomers";

describe("Founder analytics account hygiene", () => {
  it("excludes only the confirmed Founder/internal emails plus explicit synthetic domains", () => {
    expect(FOUNDER_ANALYTICS_INTERNAL_EMAILS).toEqual([
      "sean@mylearna.com",
      "seanbint@live.com",
      "sbint@channel.tas.edu.au",
    ]);
    expect(FOUNDER_ANALYTICS_INTERNAL_USER_IDS).toEqual([
      "dd9b618d-96a9-4c83-bbcb-8fe0ee824ee7",
      "01c1ad61-7c74-4c6d-86a6-e9d31769b761",
      "4ac4d07f-0bc5-4f3d-9c4d-331966d8ada3",
    ]);
    expect(FOUNDER_ANALYTICS_EXCLUDED_EMAIL_DOMAINS).toEqual([
      "mailinator.com",
      "codoteam.com",
      "bezill.com",
      "hutdot.com",
    ]);
    expect(isFounderExcludedAccount(" test@mailinator.com ")).toBe(true);
    expect(isFounderExcludedAccount("DEV@CODOTEAM.COM")).toBe(true);
    expect(isFounderExcludedAccount("SEAN@MYLEARNA.COM")).toBe(true);
    expect(isFounderExcludedAccount(" seanbint@live.com ")).toBe(true);
    expect(isFounderExcludedAccount("SBINT@CHANNEL.TAS.EDU.AU")).toBe(true);
  });

  it("does not exclude unrelated addresses on the same consumer or employer domains", () => {
    expect(isFounderExcludedAccount("another.person@live.com")).toBe(false);
    expect(isFounderExcludedAccount("another.teacher@channel.tas.edu.au")).toBe(false);
    expect(isFounderExcludedAccount("parent@gmail.com")).toBe(false);
    expect(isFounderExcludedAccount("family@yahoo.com")).toBe(false);
  });

  it("classifies the four review accounts as suspicious without treating them as internal", () => {
    expect(FOUNDER_ANALYTICS_SUSPICIOUS_EMAILS).toEqual([
      "nikow54520@prorises.com",
      "vatoh27112@mapsguy.com",
      "vegal19298@mediseat.com",
      "sodimin902@kikaga.com",
    ]);

    expect(FOUNDER_ANALYTICS_SUSPICIOUS_USER_IDS).toEqual([
      "5a36899d-e867-45fd-ac85-b0b23f556c00",
      "2bc5dc3b-bf3f-44a4-a9bd-a4f01bad81e5",
      "7e9f1ff7-9c42-4597-91a7-0dd47174f229",
      "b757c2bf-5bb4-4de5-b27c-1bc0df1a9398",
    ]);

    for (const email of FOUNDER_ANALYTICS_SUSPICIOUS_EMAILS) {
      expect(isFounderSuspiciousAccount(email.toUpperCase())).toBe(true);
      expect(isFounderExcludedAccount(email)).toBe(false);
    }
  });

  it("keeps ordinary customer addresses in the standard population", () => {
    expect(isFounderExcludedAccount("parent@example.com")).toBe(false);
    expect(isFounderExcludedAccount("family@mylearna.com")).toBe(false);
    expect(isFounderSuspiciousAccount("parent@example.com")).toBe(false);
    expect(isFounderSuspiciousAccount("family@gmail.com")).toBe(false);
  });
});
