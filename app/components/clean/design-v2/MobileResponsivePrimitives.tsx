"use client";

import Link from "next/link";
import React from "react";

export type MobileActionBarProps = {
  primaryLabel: string;
  primaryDisabled?: boolean;
  primaryBusy?: boolean;
  onPrimary?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  children?: React.ReactNode;
};

export function MobileActionBar({
  primaryLabel,
  primaryDisabled = false,
  primaryBusy = false,
  onPrimary,
  secondaryLabel,
  onSecondary,
  children,
}: MobileActionBarProps) {
  return (
    <div className="mylearna-mobile-action-bar" data-mobile-action-bar>
      <div className="mylearna-mobile-action-bar-inner">
        {secondaryLabel && onSecondary ? (
          <button type="button" className="mylearna-mobile-action-secondary" onClick={onSecondary}>
            {secondaryLabel}
          </button>
        ) : null}
        {children}
        <button
          type="button"
          className="mylearna-mobile-action-primary"
          disabled={primaryDisabled || primaryBusy}
          onClick={onPrimary}
        >
          {primaryBusy ? "Saving..." : primaryLabel}
        </button>
      </div>
    </div>
  );
}

export function MobileSelectionLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      role="tab"
      aria-selected={active}
      className="mylearna-mobile-pillar-tab"
      style={{
        color: active ? "#6C4DF6" : "#5B6478",
        background: active ? "#F2EDFF" : "transparent",
      }}
    >
      {label}
    </Link>
  );
}
