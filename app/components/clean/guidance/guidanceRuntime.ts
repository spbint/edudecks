import type { Driver } from "driver.js";

let activeDriver: Driver | null = null;
export const GUIDANCE_SURFACE_EVENT = "mylearna:guidance-surface";

export function setActiveDriver(driverInstance: Driver | null) {
  const wasActive = Boolean(activeDriver);
  activeDriver = driverInstance;
  if (wasActive !== Boolean(driverInstance) && typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(GUIDANCE_SURFACE_EVENT, { detail: { active: Boolean(driverInstance) } }));
  }
}

export function closeActiveDriverTour() {
  const driverToClose = activeDriver;
  activeDriver = null;
  driverToClose?.destroy();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(GUIDANCE_SURFACE_EVENT, { detail: { active: false } }));
  }
}
