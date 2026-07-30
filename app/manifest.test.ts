import { describe, expect, it } from "vitest";
import manifest from "@/app/manifest";

describe("PWA share target", () => {
  it("maps title, text and url to the safe share route", () => {
    const value = manifest();
    expect(value.share_target).toEqual({ action: "/share", method: "GET", enctype: "application/x-www-form-urlencoded", params: { title: "title", text: "text", url: "url" } });
  });
});
