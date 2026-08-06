"use client";

import { useCallback } from "react";
import { driver, type DriveStep } from "driver.js";
import { useGuidance } from "@/app/components/clean/guidance/GuidanceProvider";
import { GUIDANCE_TOURS, type GuidanceTourId } from "@/app/components/clean/guidance/guidanceTours";
import { setActiveDriver } from "@/app/components/clean/guidance/guidanceRuntime";

function getGuidanceSelector(guidanceId: string) {
  return `[data-guidance-id="${guidanceId}"]`;
}

function targetIsVisible(selector: string) {
  const element = document.querySelector<HTMLElement>(selector);
  if (!element) return false;
  const style = window.getComputedStyle(element);
  return style.display !== "none" && style.visibility !== "hidden" && element.getClientRects().length > 0;
}

function buildDriverSteps(tourId: GuidanceTourId): DriveStep[] {
  return GUIDANCE_TOURS[tourId].steps
    .filter((step) => targetIsVisible(getGuidanceSelector(step.guidanceId)))
    .map((step) => ({
      element: getGuidanceSelector(step.guidanceId),
      popover: {
        title: step.title,
        description: step.body,
        side: "bottom",
        align: "start",
      },
    }));
}

export function useDriverTour() {
  const { enabled, isGuidanceRoute, markTourCompleted } = useGuidance();

  return useCallback(
    (tourId: GuidanceTourId) => {
      if (!enabled || !isGuidanceRoute || typeof document === "undefined") return;
      const steps = buildDriverSteps(tourId);
      if (!steps.length) {
        markTourCompleted(tourId);
        return;
      }

      const driverInstance = driver({
        animate: true,
        allowClose: true,
        allowKeyboardControl: true,
        disableActiveInteraction: false,
        doneBtnText: "Finish",
        nextBtnText: "Next",
        overlayClickBehavior: "close",
        overlayColor: "#0f172a",
        overlayOpacity: 0.34,
        popoverClass: "mylearna-driver-popover",
        popoverOffset: 12,
        prevBtnText: "Back",
        progressText: "Step {{current}} of {{total}}",
        showButtons: ["next", "previous", "close"],
        showProgress: true,
        smoothScroll: true,
        stagePadding: 8,
        stageRadius: 16,
        steps,
        onDestroyed: () => {
          setActiveDriver(null);
          markTourCompleted(tourId);
        },
      });

      setActiveDriver(driverInstance);
      driverInstance.drive();
    },
    [enabled, isGuidanceRoute, markTourCompleted],
  );
}
