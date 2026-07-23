import { describe, expect, it } from "vitest";
import {
  validateIdeaInput,
  validatePlanTitle,
  validateSourceUrl,
} from "@/lib/intelligence/validation";

describe("Intelligence Engine validation", () => {
  it("requires an idea title and accepts a bounded description", () => {
    expect(validateIdeaInput({ title: "" }).valid).toBe(false);
    expect(validateIdeaInput({ title: "Nature study", description: "Observe leaves." })).toEqual({
      valid: true,
    });
  });

  it("accepts only HTTP and HTTPS source URL syntax", () => {
    expect(validateSourceUrl("https://example.com/article")).toEqual({ valid: true });
    expect(validateSourceUrl("file:///etc/passwd").valid).toBe(false);
    expect(validateSourceUrl("https://user:password@example.com").valid).toBe(false);
  });

  it("requires bounded plan titles", () => {
    expect(validatePlanTitle("A useful lesson")).toEqual({ valid: true });
    expect(validatePlanTitle(" ").valid).toBe(false);
  });
});
