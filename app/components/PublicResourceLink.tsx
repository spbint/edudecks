"use client";

import type { AnchorHTMLAttributes, ReactNode } from "react";
import {
  trackPublicAcquisitionEvent,
  type PublicAcquisitionEvent,
  type PublicResourceContext,
} from "@/app/lib/publicAnalytics";

type PublicResourceLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
  eventName?: PublicAcquisitionEvent;
  context?: PublicResourceContext;
};

export default function PublicResourceLink({
  children,
  eventName,
  context,
  onClick,
  ...props
}: PublicResourceLinkProps) {
  return (
    <a
      {...props}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented && eventName) {
          trackPublicAcquisitionEvent(
            eventName,
            window.location.pathname,
            context,
          );
        }
      }}
    >
      {children}
    </a>
  );
}
