"use client";

import { useEffect, useState } from "react";

export type CaptureNetworkHint = "unknown" | "online" | "offline";

export function readCaptureNetworkHint(
  navigatorLike: Pick<Navigator, "onLine"> | null =
    typeof navigator === "undefined" ? null : navigator,
): CaptureNetworkHint {
  if (!navigatorLike || typeof navigatorLike.onLine !== "boolean") return "unknown";
  return navigatorLike.onLine ? "online" : "offline";
}

export function captureRecoveryMessage(networkHint: CaptureNetworkHint) {
  if (networkHint === "offline") {
    return "Your device appears offline. Your entries are still here. Reconnect, then choose Save again.";
  }
  return "Your entries are still here. Check your connection, then choose Save again.";
}

export function attachmentRecoveryMessage(networkHint: CaptureNetworkHint) {
  if (networkHint === "offline") {
    return "Your device appears offline. Reconnect, then choose Retry attachment.";
  }
  return "Check your connection, then choose Retry attachment.";
}

export function useCaptureNetworkHint() {
  const [networkHint, setNetworkHint] = useState<CaptureNetworkHint>("unknown");

  useEffect(() => {
    const updateNetworkHint = () => setNetworkHint(readCaptureNetworkHint());
    updateNetworkHint();
    window.addEventListener("online", updateNetworkHint);
    window.addEventListener("offline", updateNetworkHint);
    return () => {
      window.removeEventListener("online", updateNetworkHint);
      window.removeEventListener("offline", updateNetworkHint);
    };
  }, []);

  return networkHint;
}
