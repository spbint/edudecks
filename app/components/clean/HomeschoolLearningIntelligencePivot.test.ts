import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (file: string) => readFileSync(join(process.cwd(), file), "utf8");

describe("Homeschool Learning Intelligence product pivot", () => {
  const homepage = read("app/page.tsx");
  const learnerHub = read("app/components/clean/CleanMyLearnaWorkspace.tsx");
  const positioning = read("docs/product/homeschool-learning-intelligence-positioning-v1.md");

  it("makes understanding and next learning the public promise", () => {
    expect(homepage).toContain("Know what they know. Know what to do next.");
    expect(homepage).toContain("Understand their learning");
    expect(homepage).toContain("Know what comes next");
    expect(homepage).not.toContain('heroTitle="Plan');
  });

  it("presents the complete loop while leaving planning as supporting infrastructure", () => {
    for (const label of ["Understand", "Learn", "Capture", "Recheck", "See change", "Report"]) {
      expect(homepage).toContain(`title: "${label}"`);
    }
    expect(homepage).toContain("Planning and calendars still support the week");
    expect(positioning).toContain("Planning and calendar capabilities support this loop.");
  });

  it("keeps assessment interpretation distinct from everyday Capture evidence", () => {
    expect(homepage).toContain("A photo, observation or work sample is authentic evidence; it does not automatically become mastery.");
    expect(learnerHub).toContain("Everyday learning records add context without changing the judgement automatically.");
    expect(positioning).toContain("A photo, parent observation");
    expect(positioning).toContain("does not automatically establish mastery");
  });

  it("makes uncertainty and next learning visible without a combined score", () => {
    expect(learnerHub).toContain("What remains unknown");
    expect(learnerHub).toContain("Recommended next action");
    expect(homepage).toContain("No one Maths score. No hidden certainty.");
    expect(homepage).not.toMatch(/overall percentage|percentile|ranking/i);
  });

  it("states the current assessment boundary and progressive rollout", () => {
    expect(homepage).toContain("starting with Maths Starting Point — Number &amp; Operations");
    expect(homepage).toContain("does not claim to assess all of Mathematics or every subject");
    expect(learnerHub).toContain("The trusted assessment view is starting with Maths Starting Point — Number &amp; Operations.");
    expect(positioning).toContain("does not produce one overall Maths score");
  });

  it("keeps registration paused and uses demo or sign-in actions", () => {
    expect(homepage).toContain("New registrations remain paused");
    expect(homepage).not.toContain('href: "/start-free');
    expect(homepage).toContain('href: "/login"');
    expect(homepage).toContain('/demo?source=home-primary-demo');
  });

  it("does not add AI educational judgement or customer write claims", () => {
    expect(homepage).not.toMatch(/AI scoring|AI recommendation|confidence algorithm/i);
    expect(learnerHub).not.toContain("LearningEvidenceResultV1");
    expect(positioning).toContain("does not authorise customer release");
  });

  it("uses fluid grids suitable for phone through desktop widths", () => {
    expect(homepage).toContain("minmax(min(100%, 220px), 1fr)");
    expect(homepage).toContain("minmax(min(100%, 280px), 1fr)");
    expect(learnerHub).toContain("minmax(min(100%, 130px), 1fr)");
    expect(learnerHub).toContain("overflow-wrap: anywhere");
    expect(learnerHub).toContain(":focus-visible");
  });
});
