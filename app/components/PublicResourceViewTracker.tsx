"use client";

import { useEffect } from "react";
import {
  trackPublicAcquisitionEvent,
  type PublicResourceContext,
} from "@/app/lib/publicAnalytics";

export default function PublicResourceViewTracker({
  context,
}: {
  context: PublicResourceContext;
}) {
  const { resource_id, resource_asset } = context;

  useEffect(() => {
    trackPublicAcquisitionEvent("public_resource_viewed", window.location.pathname, {
      resource_id,
      resource_asset,
    });
  }, [resource_id, resource_asset]);

  return null;
}
