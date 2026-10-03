import { describe, expect, it } from "vitest";
import {
  bracketFromBranchRoute,
  getNumberOperationsAnchorSet,
  nextBoundaryTarget,
  resolveInitialAnchorWithReserve,
  routeBranchAnchor,
} from "./numberOperationsAnchors";

type Fixture = {
  name: string;
  key:
    | "number-place-value"
    | "counting-processes"
    | "additive-strategies"
    | "multiplicative-strategies"
    | "understanding-money";
  initial: [0 | 1, 0 | 1];
  reserve?: 0 | 1;
  branch: [0 | 1, 0 | 1];
  expected:
    | { kind: "bracket"; lowerP: number; upperP: number; nextBoundary: number | null }
    | { kind: "search-up"; fromP: number }
    | { kind: "search-down"; fromP: number };
};

const FIXTURES: Fixture[] = [
  {
    name: "NPV learner below P6 but secure at P3",
    key: "number-place-value",
    initial: [0, 0],
    branch: [1, 1],
    expected: { kind: "bracket", lowerP: 3, upperP: 6, nextBoundary: 4 },
  },
  {
    name: "Counting learner between P5 and P7",
    key: "counting-processes",
    initial: [1, 1],
    branch: [0, 0],
    expected: { kind: "bracket", lowerP: 5, upperP: 7, nextBoundary: 6 },
  },
  {
    name: "Additive mixed P6 cluster resolved upward by reserve",
    key: "additive-strategies",
    initial: [1, 0],
    reserve: 1,
    branch: [0, 1],
    expected: { kind: "bracket", lowerP: 6, upperP: 9, nextBoundary: 7 },
  },
  {
    name: "Multiplicative evidence remains strong above P9",
    key: "multiplicative-strategies",
    initial: [1, 1],
    branch: [1, 1],
    expected: { kind: "search-up", fromP: 9 },
  },
  {
    name: "Money evidence remains weak below P2 anchor",
    key: "understanding-money",
    initial: [0, 0],
    branch: [0, 0],
    expected: { kind: "search-down", fromP: 2 },
  },
];

describe("Number & Operations routing fixtures", () => {
  for (const fixture of FIXTURES) {
    it(fixture.name, () => {
      const set = getNumberOperationsAnchorSet(fixture.key);
      expect(set).not.toBeNull();
      if (!set) return;

      const initial = resolveInitialAnchorWithReserve(
        set,
        fixture.initial,
        fixture.reserve ?? null,
      );
      const branch = routeBranchAnchor(set, initial, fixture.branch);

      if (fixture.expected.kind === "bracket") {
        expect(branch).toEqual({
          kind: "bracket",
          lowerP: fixture.expected.lowerP,
          upperP: fixture.expected.upperP,
        });
        const bracket = bracketFromBranchRoute(branch);
        expect(bracket).not.toBeNull();
        expect(bracket ? nextBoundaryTarget(bracket) : null).toBe(
          fixture.expected.nextBoundary,
        );
        return;
      }

      expect(branch).toEqual(fixture.expected);
    });
  }
});
