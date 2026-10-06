import { describe, expect, it } from "vitest";
import {
  PLAYER_LAYOUT,
  PLAYER_MOTION,
  motionDuration,
} from "./startingPointPlayerDesignSystem";

describe("Starting Point player design system", () => {
  it("keeps touch and motion tokens within the approved interaction ranges", () => {
    expect(PLAYER_LAYOUT.minimumTarget).toBeGreaterThanOrEqual(48);
    expect(PLAYER_MOTION.pressMs).toBeGreaterThanOrEqual(80);
    expect(PLAYER_MOTION.pressMs).toBeLessThanOrEqual(140);
    expect(PLAYER_MOTION.selectMs).toBeGreaterThanOrEqual(120);
    expect(PLAYER_MOTION.selectMs).toBeLessThanOrEqual(180);
    expect(PLAYER_MOTION.snapMs).toBeGreaterThanOrEqual(150);
    expect(PLAYER_MOTION.snapMs).toBeLessThanOrEqual(240);
    expect(PLAYER_MOTION.sceneMs).toBeGreaterThanOrEqual(220);
    expect(PLAYER_MOTION.sceneMs).toBeLessThanOrEqual(350);
  });

  it("removes decorative transition time when reduced motion is requested", () => {
    expect(motionDuration({ reduced: true }, PLAYER_MOTION.sceneMs)).toBe(0);
    expect(motionDuration({ reduced: false }, PLAYER_MOTION.sceneMs)).toBe(
      PLAYER_MOTION.sceneMs,
    );
  });
});
