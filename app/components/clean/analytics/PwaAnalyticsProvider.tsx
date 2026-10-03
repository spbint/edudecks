"use client";

import { useEffect } from "react";
import {
  getProductDisplayMode,
  getProductViewportCategory,
  trackProductEvent,
} from "@/lib/clean/analytics/productAnalytics";

type InstallPromptEvent = Event & {
  userChoice?: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function PwaAnalyticsProvider() {
  useEffect(() => {
    const displayMode = getProductDisplayMode();
    if (displayMode === "standalone") {
      trackProductEvent("pwa_session_started", {
        displayMode,
        viewportCategory: getProductViewportCategory(),
      });
    }

    const onPrompt = (event: Event) => {
      const prompt = event as InstallPromptEvent;
      trackProductEvent("pwa_install_prompt_shown", {
        displayMode: getProductDisplayMode(),
        viewportCategory: getProductViewportCategory(),
      });
      void prompt.userChoice?.then(({ outcome }) => {
        trackProductEvent(
          outcome === "accepted" ? "pwa_install_accepted" : "pwa_install_dismissed",
          {
            displayMode: getProductDisplayMode(),
            viewportCategory: getProductViewportCategory(),
            installOutcome: outcome,
          },
        );
      });
    };
    const onInstalled = () => {
      trackProductEvent("pwa_installed", {
        displayMode: getProductDisplayMode(),
        viewportCategory: getProductViewportCategory(),
      });
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  return null;
}
