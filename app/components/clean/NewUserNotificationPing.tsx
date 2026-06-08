"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

const CLEAN_ROUTE_PREFIXES = [
  "/my-profile",
  "/my-settings",
  "/my-calendar",
  "/my-day",
  "/my-pathways",
  "/my-capture",
  "/my-portfolio",
  "/my-reports",
  "/my-outputs",
  "/clean-my-profile",
  "/clean-my-settings",
  "/clean-my-calendar",
  "/clean-my-day",
  "/clean-my-pathways",
  "/clean-my-capture",
  "/clean-my-portfolio",
  "/clean-my-reports",
  "/clean-my-outputs",
];

function isCleanRoute(pathname: string) {
  return CLEAN_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export default function NewUserNotificationPing() {
  const pathname = usePathname() || "";
  const searchParams = useSearchParams();
  const hasPinged = useRef(false);

  useEffect(() => {
    if (hasPinged.current || !isCleanRoute(pathname)) return;
    hasPinged.current = true;

    const controller = new AbortController();
    const source = searchParams.get("source") || searchParams.get("utm_source") || null;

    fetch("/api/internal/new-user-notification", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source,
        referrer: document.referrer || null,
      }),
      signal: controller.signal,
    }).catch((error) => {
      if ((error as { name?: string }).name !== "AbortError") {
        console.warn("Could not check new user notification status.");
      }
    });

    return () => controller.abort();
  }, [pathname, searchParams]);

  return null;
}
