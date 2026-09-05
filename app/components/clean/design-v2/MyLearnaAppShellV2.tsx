"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { useAuthUser } from "@/app/components/AuthUserProvider";
import ProductAnalyticsProvider from "@/app/components/clean/analytics/ProductAnalyticsProvider";
import CleanAccountMenu from "@/app/components/clean/CleanAccountMenu";
import ReportProblemButton from "@/app/components/clean/ReportProblemButton";
import GuidedStartFamilySetup from "@/app/components/clean/guidance/GuidedStartFamilySetup";
import { useCleanFamilyWorkspace } from "@/app/components/clean/CleanFamilyWorkspaceProvider";
import {
  getFamilySetupRedirectPath,
  isFamilyProfileRoute,
  shouldHoldForFamilySetup,
} from "@/lib/clean/setup/familySetupRouteGuard";

export const v2Tokens = {
  page: "#F7F9FC",
  card: "#FFFFFF",
  navy: "#17204B",
  slate: "#5B6478",
  purple: "#6C4DF6",
  lavender: "#F2EDFF",
  mint: "#ECFDF4",
  green: "#2F9D68",
  amber: "#F59E0B",
  softAmber: "#FFF7E6",
  red: "#E85D75",
  softRed: "#FFF0F3",
  border: "#E7EAF2",
  shadow: "0 6px 18px rgba(23, 32, 75, 0.05)",
};

type ProductNavIconName = "sun" | "calendar" | "route" | "camera" | "folder" | "chart" | "file" | "gear" | "learner";

type ProductNavItem = {
  href: string;
  label: string;
  shortLabel: string;
  icon: ProductNavIconName;
  matches: readonly string[];
};

type ProductNavSection = {
  label: "PLAN" | "CAPTURE" | "GROW";
  items: readonly ProductNavItem[];
};

type MobileNavKey = "today" | "capture" | "portfolio" | "more";

const MOBILE_MORE_FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function getMobileMoreFocusableElements(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>(MOBILE_MORE_FOCUSABLE_SELECTOR)).filter(
    (element) => element.getAttribute("aria-hidden") !== "true" && element.tabIndex >= 0,
  );
}

const dayNavItem = {
  href: "/my-day",
  label: "My Day",
  shortLabel: "My Day",
  icon: "sun",
  matches: ["/my-day", "/clean-my-day", "/home", "/dashboard", "/my-plan"],
} as const satisfies ProductNavItem;

const calendarNavItem = {
  href: "/my-calendar",
  label: "My Calendar",
  shortLabel: "My Calendar",
  icon: "calendar",
  matches: ["/my-calendar", "/clean-my-calendar", "/calendar", "/my-month", "/planner"],
} as const satisfies ProductNavItem;

const myPlanNavItems = [dayNavItem, calendarNavItem] as const;

const settingsNavItem = {
  href: "/my-settings",
  label: "My Settings",
  shortLabel: "Settings",
  icon: "gear",
  matches: ["/my-settings", "/settings"],
} as const satisfies ProductNavItem;

export const finalProductNavSections = [
  {
    label: "PLAN",
    items: [
      calendarNavItem,
      { href: "/my-pathways", label: "My Pathways", shortLabel: "Pathways", icon: "route", matches: ["/my-pathways", "/clean-my-pathways"] },
    ],
  },
  {
    label: "CAPTURE",
    items: [
      { href: "/my-capture", label: "Quick Capture", shortLabel: "Quick Capture", icon: "camera", matches: ["/my-capture", "/capture"] },
      { href: "/my-portfolio", label: "My Portfolio", shortLabel: "Portfolio", icon: "folder", matches: ["/my-portfolio", "/portfolio"] },
    ],
  },
  {
    label: "GROW",
    items: [
      { href: "/my-learna", label: "My Learna", shortLabel: "Learna", icon: "learner", matches: ["/my-learna", "/my-data", "/my-curriculum", "/curriculum"] },
      { href: "/my-reports", label: "My Reports", shortLabel: "Reports", icon: "file", matches: ["/my-reports", "/reports"] },
    ],
  },
] as const satisfies readonly ProductNavSection[];

const groupedNavItems: readonly ProductNavItem[] = finalProductNavSections.flatMap(
  (section): readonly ProductNavItem[] => section.items,
);

const navItems: readonly ProductNavItem[] = [...myPlanNavItems, ...groupedNavItems, settingsNavItem];

type ShellIconName = ProductNavIconName | "learner" | "review" | "help";

function ShellIcon({ name, size = 20 }: { name: ShellIconName; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (name === "sun") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2.8v2.1M12 19.1v2.1M4.9 4.9l1.5 1.5M17.6 17.6l1.5 1.5M2.8 12h2.1M19.1 12h2.1M4.9 19.1l1.5-1.5M17.6 6.4l1.5-1.5" />
      </svg>
    );
  }
  if (name === "calendar") {
    return (
      <svg {...common}>
        <path d="M7 3.5v3" />
        <path d="M17 3.5v3" />
        <path d="M5.2 6h13.6A2.2 2.2 0 0 1 21 8.2v9.6a2.2 2.2 0 0 1-2.2 2.2H5.2A2.2 2.2 0 0 1 3 17.8V8.2A2.2 2.2 0 0 1 5.2 6Z" />
        <path d="M3.5 10h17" />
        <path d="M8 14h.01" />
        <path d="M12 14h.01" />
        <path d="M16 14h.01" />
      </svg>
    );
  }
  if (name === "route") {
    return (
      <svg {...common}>
        <circle cx="6" cy="18" r="2.4" />
        <circle cx="18" cy="6" r="2.4" />
        <path d="M8.2 17.2c4.6-1 7.7-3.9 8.6-9" />
        <path d="M8.2 18H14a4 4 0 0 0 4-4v-1" />
      </svg>
    );
  }
  if (name === "review") {
    return (
      <svg {...common}>
        <path d="M7 4h10a2 2 0 0 1 2 2v13l-3-2-3 2-3-2-3 2V6a2 2 0 0 1 2-2Z" />
        <path d="M9.5 8.5h5" />
        <path d="M9.5 12h3.5" />
        <path d="M15 11.7l.8.8 1.7-2" />
      </svg>
    );
  }
  if (name === "camera") {
    return (
      <svg {...common}>
        <path d="M5 8.5A2.5 2.5 0 0 1 7.5 6H9l1.3-1.6h3.4L15 6h1.5A2.5 2.5 0 0 1 19 8.5v7A2.5 2.5 0 0 1 16.5 18h-9A2.5 2.5 0 0 1 5 15.5v-7Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }
  if (name === "folder") {
    return (
      <svg {...common}>
        <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H10l2 2.2h5.5A2.5 2.5 0 0 1 20 9.7v6.8a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5v-9Z" />
      </svg>
    );
  }
  if (name === "learner") {
    return (
      <svg {...common}>
        <circle cx="12" cy="8" r="3.2" />
        <path d="M5.5 19a6.5 6.5 0 0 1 13 0" />
        <path d="M17.8 5.2l1.4-1.4" />
        <path d="M19 9.2h2" />
        <path d="M6.2 5.2 4.8 3.8" />
      </svg>
    );
  }
  if (name === "chart") {
    return (
      <svg {...common}>
        <path d="M4 19h16" />
        <path d="M7 16v-5" />
        <path d="M12 16V7" />
        <path d="M17 16v-8" />
      </svg>
    );
  }
  if (name === "file") {
    return (
      <svg {...common}>
        <path d="M7 3.8h6.5L18 8.3v11.9H7V3.8Z" />
        <path d="M13.5 4v4.5H18" />
        <path d="M9.5 12h5" />
        <path d="M9.5 15h5" />
      </svg>
    );
  }
  if (name === "gear") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 3.5v2M12 18.5v2M5.8 5.8l1.4 1.4M16.8 16.8l1.4 1.4M3.5 12h2M18.5 12h2M5.8 18.2l1.4-1.4M16.8 7.2l1.4-1.4" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.8 9.4a2.4 2.4 0 0 1 4.6 1c0 1.8-2.4 2-2.4 3.8" />
      <path d="M12 17.2h.01" />
    </svg>
  );
}

function MyLearnaBrandMark({ compact = false, showBeta = true }: { compact?: boolean; showBeta?: boolean }) {
  return (
    <div
      className={`mylearna-v2-brand-mark${compact ? " mylearna-v2-mobile-brand" : ""}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: compact ? 5 : 8,
        minWidth: 0,
        flexShrink: 0,
      }}
    >
      <Link
        href="/my-day"
        aria-label="MyLearna home"
        className="mylearna-v2-brand-link"
        style={{ display: "block", textDecoration: "none", flexShrink: 0 }}
      >
        <Image
          src="/branding/MyLearna Logo.png"
          alt="MyLearna"
          width={1916}
          height={821}
          priority={!compact}
          className="mylearna-v2-brand-logo"
          style={{
            width: compact ? 68 : 154,
            height: "auto",
            display: "block",
          }}
        />
      </Link>
      {showBeta ? (
        <span
          className="mylearna-v2-beta-badge"
          style={{
            display: "inline-flex",
            alignItems: "center",
            border: `1px solid ${v2Tokens.border}`,
            borderRadius: 999,
            background: v2Tokens.lavender,
            color: v2Tokens.navy,
            padding: compact ? "3px 5px" : "4px 7px",
            fontSize: compact ? 9 : 10,
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: "0.02em",
            whiteSpace: "nowrap",
          }}
        >
          Beta v1
        </span>
      ) : null}
    </div>
  );
}

function routeTitle(pathname: string) {
  if (pathname === "/my-pathways") return "My Pathways";
  const item = navItems.find((candidate) =>
    candidate.matches.some((match) => pathname === match || pathname.startsWith(`${match}/`)),
  );
  if (pathname.startsWith("/my-profile") || pathname.startsWith("/clean-my-profile")) {
    return "My Profile";
  }
  if (pathname.startsWith("/my-settings") || pathname.startsWith("/clean-my-settings")) {
    return "My Settings";
  }
  if (pathname.startsWith("/my-community")) return "My Community";
  if (pathname.startsWith("/my-pathways/activity-player-v4-preview")) {
    return "Activity Player V4 Preview";
  }
  if (pathname.startsWith("/my-pathways/placement") || pathname.startsWith("/clean-my-pathways/placement")) {
    return "Pathway Placement";
  }
  if (pathname.startsWith("/pathways/practice-prototype")) return "Practise";
  if (pathname.startsWith("/practice/number-targeted")) return "Practise";
  if (pathname.startsWith("/assessments/number")) return "Assess";
  return item?.label ?? "MyLearna";
}

type BreadcrumbItem = {
  label: string;
  href?: string;
};

export function routeCrumbs(pathname: string): BreadcrumbItem[] {
  if (isActive(pathname, dayNavItem.matches)) {
    return [{ label: "My Plan" }, { label: "My Day" }];
  }
  if (isActive(pathname, calendarNavItem.matches)) {
    return [{ label: "My Plan" }, { label: "My Calendar" }];
  }
  if (pathname.startsWith("/my-profile") || pathname.startsWith("/clean-my-profile")) {
    return [{ label: "My Day", href: "/my-day" }, { label: "My Profile" }];
  }
  if (pathname.startsWith("/my-settings") || pathname.startsWith("/clean-my-settings")) {
    return [{ label: "My Day", href: "/my-day" }, { label: "My Settings", href: "/my-settings" }];
  }
  if (pathname.startsWith("/my-community")) return [{ label: "My Day", href: "/my-day" }, { label: "My Community" }];
  if (pathname.startsWith("/my-pathways/activity-player-v4-preview")) {
    return [
      { label: "My Day", href: "/my-day" },
      { label: "My Pathways", href: "/my-pathways" },
      { label: "Activity Player V4 Preview" },
    ];
  }
  if (pathname.startsWith("/my-pathways/placement") || pathname.startsWith("/clean-my-pathways/placement")) {
    return [{ label: "My Day", href: "/my-day" }, { label: "My Pathways", href: "/my-pathways" }, { label: "Placement" }];
  }
  if (pathname === "/my-pathways" || pathname === "/clean-my-pathways") {
    return [{ label: "My Day", href: "/my-day" }, { label: "My Pathways" }];
  }
  if (pathname.startsWith("/practice/number-targeted")) {
    return [{ label: "My Pathways", href: "/my-pathways" }, { label: "Practise" }];
  }
  if (pathname.startsWith("/pathways/practice-prototype")) {
    return [{ label: "My Pathways", href: "/my-pathways" }, { label: "Practise" }];
  }
  if (pathname.startsWith("/assessments/number")) {
    return [{ label: "My Pathways", href: "/my-pathways" }, { label: "Assess" }];
  }
  const navItem = navItems.find((candidate) =>
    candidate.matches.some((match) => pathname === match || pathname.startsWith(`${match}/`)),
  );
  return [{ label: "My Day", href: "/my-day" }, { label: routeTitle(pathname), href: navItem?.href }];
}

function getActivityMode(pathname: string): "practice" | "assess" | null {
  if (pathname.startsWith("/my-pathways/activity-player-v4-preview")) {
    return "practice";
  }
  if (pathname.startsWith("/practice/number-targeted") || pathname.startsWith("/pathways/practice-prototype")) {
    return "practice";
  }
  if (pathname.startsWith("/assessments/number")) {
    return "assess";
  }
  return null;
}

function formatActivityContext(value: string | null) {
  if (!value) return null;
  return value
    .replace(/^number-step-/i, "Step ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function isActive(pathname: string, matches: readonly string[]) {
  return matches.some((match) => pathname === match || pathname.startsWith(`${match}/`));
}

export function getVisibleDesktopSectionItems(items: readonly ProductNavItem[]) {
  return items.filter((item) => item.href !== "/my-calendar");
}

function NavLink({
  item,
  pathname,
  nested = false,
}: {
  item: ProductNavItem;
  pathname: string;
  nested?: boolean;
}) {
  const active = isActive(pathname, item.matches);

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      style={{
        minHeight: 44,
        display: "grid",
        gridTemplateColumns: "28px minmax(0, 1fr)",
        alignItems: "center",
        gap: 10,
        borderRadius: 14,
        padding: nested ? "9px 11px 9px 24px" : "9px 11px",
        textDecoration: "none",
        background: active ? v2Tokens.lavender : "transparent",
        color: active ? v2Tokens.purple : v2Tokens.navy,
        fontSize: 14,
        fontWeight: 650,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 26,
          height: 26,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          color: active ? v2Tokens.purple : v2Tokens.slate,
        }}
      >
        <ShellIcon name={item.icon} />
      </span>
      <span className="mylearna-v2-nav-label-full">{item.label}</span>
      <span className="mylearna-v2-nav-label-short" style={{ display: "none" }}>
        {item.shortLabel}
      </span>
    </Link>
  );
}

function MyPlanNavGroup({ pathname }: { pathname: string }) {
  const planActive = myPlanNavItems.some((item) => isActive(pathname, item.matches));
  const [expanded, setExpanded] = React.useState(planActive);

  React.useEffect(() => {
    if (planActive) setExpanded(true);
  }, [planActive]);

  return (
    <div style={{ display: "grid", gap: 4 }}>
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls="mylearna-my-plan-navigation"
        onClick={() => setExpanded((current) => !current)}
        style={{
          minHeight: 44,
          display: "grid",
          gridTemplateColumns: "28px minmax(0, 1fr) auto",
          alignItems: "center",
          gap: 10,
          border: 0,
          borderRadius: 14,
          padding: "9px 11px",
          background: planActive ? v2Tokens.lavender : "transparent",
          color: planActive ? v2Tokens.purple : v2Tokens.navy,
          font: "inherit",
          fontSize: 14,
          fontWeight: 650,
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span aria-hidden="true" style={{ width: 26, height: 26, display: "inline-flex", alignItems: "center", justifyContent: "center", color: planActive ? v2Tokens.purple : v2Tokens.slate }}>
          <ShellIcon name="calendar" />
        </span>
        <span>My Plan</span>
        <span aria-hidden="true" style={{ fontSize: 16, lineHeight: 1 }}>{expanded ? "▾" : "›"}</span>
      </button>
      {expanded ? (
        <div id="mylearna-my-plan-navigation" style={{ display: "grid", gap: 3 }}>
          {myPlanNavItems.map((item) => <NavLink key={item.href} item={item} pathname={pathname} nested />)}
        </div>
      ) : null}
    </div>
  );
}

function getActiveMobileSection(pathname: string): MobileNavKey {
  if (isActive(pathname, dayNavItem.matches)) return "today";
  if (pathname.startsWith("/my-capture") || pathname.startsWith("/capture")) return "capture";
  if (pathname.startsWith("/my-portfolio") || pathname.startsWith("/portfolio")) return "portfolio";
  return "more";
}

export function getMobilePrefetchDestinations(): string[] {
  return ["/my-day", "/my-capture?mode=quick", "/my-portfolio", "/my-calendar", "/my-settings"];
}

const MobileBottomNavButton = React.forwardRef<HTMLButtonElement, {
  active: boolean;
  controls?: string;
  children: React.ReactNode;
  expanded?: boolean;
  icon: ShellIconName;
  label: string;
  onClick: () => void;
}>(function MobileBottomNavButton({
  active,
  controls,
  children,
  expanded,
  icon,
  label,
  onClick,
}, ref) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      aria-controls={controls}
      aria-expanded={expanded}
      aria-current={active ? "page" : undefined}
      onClick={onClick}
      className="mylearna-v2-mobile-nav-button"
      style={{
        minHeight: 48,
        minWidth: 54,
        border: "none",
        borderRadius: 14,
        background: active ? v2Tokens.lavender : "transparent",
        color: active ? v2Tokens.purple : v2Tokens.slate,
        display: "grid",
        justifyItems: "center",
        alignContent: "center",
        gap: 2,
        fontSize: 11,
        fontWeight: 750,
        cursor: "pointer",
      }}
    >
      <ShellIcon name={icon} size={19} />
      <span>{children}</span>
    </button>
  );
});

export function V2Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <section
      style={{
        border: `1px solid ${v2Tokens.border}`,
        borderRadius: 18,
        background: v2Tokens.card,
        boxShadow: v2Tokens.shadow,
        padding: "clamp(14px, 2.4vw, 20px)",
        ...style,
      }}
    >
      {children}
    </section>
  );
}

export function V2PageHeader({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <V2Card>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 14 }}>
        <div style={{ display: "grid", gap: 6, maxWidth: 720 }}>
          {eyebrow ? (
            <div style={{ color: v2Tokens.purple, fontSize: 12, fontWeight: 700 }}>
              {eyebrow}
            </div>
          ) : null}
          <h1
            style={{
              margin: 0,
              color: v2Tokens.navy,
              fontSize: "clamp(24px, 3.2vw, 30px)",
              lineHeight: 1.18,
              fontWeight: 750,
            }}
          >
            {title}
          </h1>
          {subtitle ? (
            <p style={{ margin: 0, color: v2Tokens.slate, lineHeight: 1.5, fontSize: 14, maxWidth: 680 }}>
              {subtitle}
            </p>
          ) : null}
        </div>
        {children}
      </div>
    </V2Card>
  );
}

export default function MyLearnaAppShellV2({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthUser();
  const workspace = useCleanFamilyWorkspace();
  const [openMobileNav, setOpenMobileNav] = React.useState<MobileNavKey | null>(null);
  const moreTriggerRef = React.useRef<HTMLButtonElement | null>(null);
  const moreDialogRef = React.useRef<HTMLDivElement | null>(null);
  const moreCloseRef = React.useRef<HTMLButtonElement | null>(null);
  const restoreMoreTriggerFocusRef = React.useRef(false);
  const activityMode = getActivityMode(pathname);
  const activeMobileSection = getActiveMobileSection(pathname);
  const quickCaptureReturnPath = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
  const quickCaptureHref = `/my-capture?mode=quick&returnTo=${encodeURIComponent(quickCaptureReturnPath)}`;
  const quickCaptureRoute = pathname === "/my-capture" && searchParams.get("mode") === "quick";
  const title = quickCaptureRoute ? "Quick Capture" : routeTitle(pathname);
  const breadcrumbs = quickCaptureRoute
    ? [{ label: "My Day", href: "/my-day" }, { label: "Quick Capture" }]
    : routeCrumbs(pathname);
  const familySetupState = {
    authenticated: Boolean(user),
    pathname,
    loading: workspace.loading,
    setupLoading: workspace.setupLoading,
    error: workspace.error,
    schemaMissing: workspace.schemaMissing,
    hasProfile: Boolean(workspace.profile),
    learnerCount: workspace.learners.length,
  };
  const familySetupRedirect = getFamilySetupRedirectPath(familySetupState);
  const familySetupPending = shouldHoldForFamilySetup(familySetupState) || Boolean(familySetupRedirect);

  React.useEffect(() => {
    if (!familySetupRedirect) return;
    router.replace(familySetupRedirect);
  }, [familySetupRedirect, router]);

  const closeMobileMore = React.useCallback((restoreFocus = true) => {
    restoreMoreTriggerFocusRef.current = restoreFocus;
    setOpenMobileNav(null);
  }, []);

  React.useEffect(() => {
    if (openMobileNav !== "more") return;

    moreCloseRef.current?.focus();

    function handleDialogKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMobileMore();
        return;
      }

      if (event.key !== "Tab") return;
      const dialog = moreDialogRef.current;
      if (!dialog) return;
      const focusable = getMobileMoreFocusableElements(dialog);
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleDialogKeyDown);
    return () => document.removeEventListener("keydown", handleDialogKeyDown);
  }, [closeMobileMore, openMobileNav]);

  React.useEffect(() => {
    if (openMobileNav !== null || !restoreMoreTriggerFocusRef.current) return;
    restoreMoreTriggerFocusRef.current = false;
    moreTriggerRef.current?.focus();
  }, [openMobileNav]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const connection = (
      navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }
    ).connection;
    if (connection?.saveData || connection?.effectiveType === "slow-2g") return;

    const destinations = getMobilePrefetchDestinations();

    const prefetch = () => {
      destinations.forEach((destination) => {
        try {
          router.prefetch(destination);
        } catch {
          // Prefetch is advisory and must never block navigation.
        }
      });
    };
    const idleWindow = window as Window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    const idleId = idleWindow.requestIdleCallback
      ? idleWindow.requestIdleCallback(prefetch, { timeout: 900 })
      : undefined;
    const timeoutId = idleId === undefined ? window.setTimeout(prefetch, 180) : undefined;

    return () => {
      if (idleId !== undefined) idleWindow.cancelIdleCallback?.(idleId);
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, [router]);

  if (familySetupPending && !isFamilyProfileRoute(pathname)) {
    return (
      <div
        style={{
          minHeight: "100svh",
          display: "grid",
          placeItems: "center",
          padding: 24,
          background: v2Tokens.page,
          color: v2Tokens.navy,
        }}
      >
        <p role="status" style={{ margin: 0, color: v2Tokens.slate, fontWeight: 700 }}>
          Checking your family setup…
        </p>
      </div>
    );
  }

  const activityContext =
    pathname.startsWith("/my-pathways/activity-player-v4-preview")
      ? "Activity Player V4 preview"
      :
    formatActivityContext(searchParams.get("stepKey")) ||
    formatActivityContext(searchParams.get("pathwayStepId")) ||
    "My Pathways";

  if (activityMode) {
    const modeLabel = activityMode === "practice" ? "Practise" : "Assess";
    const modeSubtitle = activityMode === "practice" ? "Let's try together." : "Have a go on your own.";
    const modeColor = activityMode === "practice" ? v2Tokens.purple : v2Tokens.green;
    const modeFill = activityMode === "practice" ? v2Tokens.lavender : v2Tokens.mint;

    return (
      <div
        className="mylearna-activity-focus-shell"
        style={{
          minHeight: "100vh",
          background: v2Tokens.page,
          color: v2Tokens.navy,
        }}
      >
        <ProductAnalyticsProvider />
        <style jsx global>{`
          @media (max-width: 720px) {
            .mylearna-activity-focus-header {
              align-items: flex-start !important;
              flex-direction: column !important;
            }

            .mylearna-activity-focus-main {
              padding: 10px !important;
            }
          }
        `}</style>
        <header
          className="mylearna-activity-focus-header"
          style={{
            minHeight: 54,
            position: "sticky",
            top: 0,
            zIndex: 40,
            borderBottom: `1px solid ${v2Tokens.border}`,
            background: "rgba(247,249,252,0.94)",
            backdropFilter: "blur(14px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "9px clamp(12px, 3vw, 24px)",
          }}
        >
          <Link
            href="/my-pathways"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              color: v2Tokens.navy,
              textDecoration: "none",
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 999,
              padding: "8px 10px",
              background: "#FFFFFF",
              border: `1px solid ${v2Tokens.border}`,
              boxShadow: "0 6px 16px rgba(23,32,75,0.04)",
            }}
          >
            <span aria-hidden="true">&larr;</span>
            Back to My Pathways
          </Link>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 9,
              minWidth: 0,
              textAlign: "center",
            }}
          >
            <span
              style={{
                borderRadius: 999,
                background: modeFill,
                color: modeColor,
                padding: "4px 9px",
                fontSize: 12,
                fontWeight: 650,
                lineHeight: 1.2,
              }}
            >
              {modeLabel}
            </span>
            <span
              style={{
                color: v2Tokens.slate,
                fontSize: 13,
                lineHeight: 1.35,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "min(48vw, 520px)",
              }}
            >
              {activityContext}
            </span>
          </div>

          <div
            aria-label={`${modeLabel}: ${modeSubtitle}`}
            style={{
              color: v2Tokens.slate,
              fontSize: 13,
              lineHeight: 1.35,
              fontWeight: 500,
            }}
          >
            {modeSubtitle}
          </div>
        </header>

        <main
          className="mylearna-activity-focus-main"
          style={{
            padding: "clamp(12px, 3vw, 28px)",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 1040,
              margin: "0 auto",
              display: "grid",
              gap: 12,
            }}
          >
            {children}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="mylearna-v2-shell" style={{ minHeight: "100vh", background: v2Tokens.page, color: v2Tokens.navy }}>
      <ProductAnalyticsProvider />
      <style jsx global>{`
        .mylearna-v2-shell {
          min-height: 100svh;
          --mylearna-mobile-bottom-nav-height: 62px;
        }

        .mylearna-v2-mobile-bottom-nav,
        .mylearna-v2-mobile-nav-sheet {
          display: none;
        }

        .mylearna-mobile-action-bar {
            display: none;
          }

        @media (max-width: 900px) {
          html {
            scroll-padding-bottom: calc(92px + env(safe-area-inset-bottom, 0px));
          }

          .mylearna-v2-grid {
            grid-template-columns: 1fr !important;
            min-height: 100dvh !important;
          }

          .mylearna-v2-sidebar {
            display: none !important;
          }

          .mylearna-v2-mobile-header {
            min-height: 52px !important;
            padding: calc(env(safe-area-inset-top, 0px) + 7px) 12px 7px !important;
            gap: 10px !important;
          }

          .mylearna-v2-mobile-header-leading {
            gap: 8px !important;
          }

          .mylearna-v2-mobile-brand .mylearna-v2-brand-logo {
            width: 62px !important;
          }

          .mylearna-v2-shell {
            min-height: 100dvh;
          }

          .mylearna-v2-breadcrumb {
            display: none !important;
          }

          .mylearna-v2-mobile-title {
            font-size: 16px !important;
            line-height: 1.25 !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            white-space: nowrap !important;
          }

          .mylearna-v2-header-actions {
            gap: 6px !important;
          }

          .mylearna-v2-header-actions > a {
            width: 38px !important;
            height: 38px !important;
          }

          .mylearna-v2-content-main {
            padding: 12px 10px calc(96px + env(safe-area-inset-bottom, 0px)) !important;
          }

          .mylearna-v2-quick-capture-content {
            padding-bottom: calc(var(--mylearna-mobile-bottom-nav-height) + 112px + env(safe-area-inset-bottom, 0px)) !important;
          }

          .mylearna-v2-content-inner {
            gap: 12px !important;
          }

          .mylearna-mobile-action-bar {
            position: fixed;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 55;
            display: block !important;
            padding: 8px max(12px, env(safe-area-inset-left, 0px)) calc(8px + env(safe-area-inset-bottom, 0px)) max(12px, env(safe-area-inset-right, 0px));
            border-top: 1px solid ${v2Tokens.border};
            background: rgba(255,255,255,0.96);
            backdrop-filter: blur(16px);
          }

          .mylearna-mobile-action-bar-inner {
            display: grid;
            grid-template-columns: auto minmax(0, 1fr);
            gap: 8px;
            max-width: 760px;
            margin: 0 auto;
          }

          .mylearna-mobile-action-bar button {
            min-height: 46px;
            border-radius: 12px;
            padding: 10px 14px;
            font: inherit;
            font-size: 14px;
            font-weight: 800;
          }

          .mylearna-mobile-action-primary {
            border: 1px solid ${v2Tokens.purple};
            background: ${v2Tokens.purple};
            color: #ffffff;
          }

          .mylearna-mobile-action-primary:disabled {
            opacity: 0.55;
          }

          .mylearna-mobile-action-secondary {
            border: 1px solid ${v2Tokens.border};
            background: #ffffff;
            color: ${v2Tokens.navy};
          }

          @media (prefers-reduced-motion: reduce) {
            *, *::before, *::after {
              scroll-behavior: auto !important;
              transition-duration: 0.01ms !important;
              animation-duration: 0.01ms !important;
              animation-iteration-count: 1 !important;
            }
          }

          input, select, textarea {
            font-size: 16px !important;
          }

          [data-mobile-action-bar] ~ * {
            scroll-margin-bottom: 90px;
          }

          .mylearna-v2-mobile-bottom-nav {
            position: fixed !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            z-index: 60 !important;
            display: grid !important;
            grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
            gap: 4px !important;
            padding: 7px max(8px, env(safe-area-inset-left, 0px)) calc(7px + env(safe-area-inset-bottom, 0px)) max(8px, env(safe-area-inset-right, 0px)) !important;
            border-top: 1px solid ${v2Tokens.border} !important;
            background: rgba(255, 255, 255, 0.96) !important;
            box-shadow: 0 -14px 34px rgba(15, 23, 42, 0.11) !important;
            backdrop-filter: blur(16px) !important;
          }

          .mylearna-v2-mobile-nav-sheet {
            position: fixed !important;
            left: 10px !important;
            right: 10px !important;
            bottom: calc(72px + env(safe-area-inset-bottom, 0px)) !important;
            z-index: 59 !important;
            display: grid !important;
            gap: 8px !important;
            border: 1px solid ${v2Tokens.border} !important;
            border-radius: 18px !important;
            background: #ffffff !important;
            box-shadow: 0 20px 50px rgba(15, 23, 42, 0.16) !important;
            padding: 12px !important;
            max-height: min(360px, calc(100dvh - 140px)) !important;
            overflow-y: auto !important;
          }

          .mylearna-v2-mobile-nav-sheet[aria-modal="true"] {
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            max-height: min(560px, calc(100dvh - 24px)) !important;
            padding: 20px 16px calc(20px + env(safe-area-inset-bottom, 0px)) !important;
            border-radius: 20px 20px 0 0 !important;
          }

          .mylearna-v2-mobile-sheet-title {
            margin: 0 !important;
            color: ${v2Tokens.navy} !important;
            font-size: 13px !important;
            font-weight: 850 !important;
            letter-spacing: 0.08em !important;
          }

          .mylearna-v2-mobile-sheet-grid {
            display: grid !important;
            gap: 8px !important;
          }

          .mylearna-v2-mobile-sheet-link {
            min-height: 46px !important;
            border-radius: 14px !important;
            padding: 10px 12px !important;
            display: grid !important;
            grid-template-columns: 28px minmax(0, 1fr) !important;
            align-items: center !important;
            gap: 10px !important;
            border: 1px solid ${v2Tokens.border} !important;
            text-decoration: none !important;
            font-size: 14px !important;
            font-weight: 750 !important;
          }
        }

        @media (max-width: 430px) {
          .mylearna-v2-mobile-nav-button {
            min-width: 0 !important;
            font-size: 10px !important;
          }
        }
      `}</style>
      <div
        className="mylearna-v2-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "244px minmax(0, 1fr)",
          minHeight: "100vh",
        }}
      >
        <aside
          className="mylearna-v2-sidebar"
          style={{
            position: "sticky",
            top: 0,
            height: "100vh",
            borderRight: `1px solid ${v2Tokens.border}`,
            background: "rgba(255,255,255,0.92)",
            boxShadow: "10px 0 30px rgba(23,32,75,0.035)",
            padding: 18,
            display: "grid",
            gridTemplateRows: "auto 1fr auto",
            gap: 22,
          }}
        >
          <MyLearnaBrandMark />

          <nav
            className="mylearna-v2-nav"
            aria-label="MyLearna sections"
            style={{ display: "grid", gap: 6, alignContent: "start" }}
          >
            <MyPlanNavGroup pathname={pathname} />
            {finalProductNavSections.map((section) => {
              const visibleItems = getVisibleDesktopSectionItems(section.items);
              if (!visibleItems.length) return null;

              return <div key={section.label} style={{ display: "grid", gap: 5 }}>
                <div
                  className="mylearna-v2-nav-section-label"
                  aria-hidden="true"
                  style={{
                    padding: "12px 11px 2px",
                    color: v2Tokens.slate,
                    fontSize: 10,
                    fontWeight: 850,
                    letterSpacing: "0.12em",
                  }}
                >
                  {section.label}
                </div>
                {visibleItems.map((item) => (
                  <NavLink key={item.href} item={item} pathname={pathname} />
                ))}
              </div>;
            })}
            <NavLink item={settingsNavItem} pathname={pathname} />
          </nav>

        </aside>

        <div style={{ minWidth: 0 }}>
          <header
            className="mylearna-v2-mobile-header"
            style={{
              minHeight: 58,
              position: "sticky",
              top: 0,
              zIndex: 30,
              borderBottom: `1px solid ${v2Tokens.border}`,
              background: "rgba(247,249,252,0.88)",
              backdropFilter: "blur(14px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 14,
              padding: "8px clamp(16px, 3vw, 26px)",
            }}
          >
            <div
              className="mylearna-v2-mobile-header-leading"
              style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}
            >
              <MyLearnaBrandMark compact showBeta={false} />
              <div style={{ display: "grid", gap: 2, minWidth: 0 }}>
              <nav
                className="mylearna-v2-breadcrumb"
                aria-label="Breadcrumb"
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: 5,
                  color: v2Tokens.slate,
                  fontSize: 12,
                  fontWeight: 550,
                }}
              >
                {breadcrumbs.map((crumb, index) => {
                  const current = index === breadcrumbs.length - 1;
                  const clickable = Boolean(crumb.href && !current);
                  return (
                    <React.Fragment key={`${crumb.label}-${index}`}>
                      {index > 0 ? <span aria-hidden="true" style={{ color: "#94A3B8" }}>&gt;</span> : null}
                      {clickable ? (
                        <Link
                          href={crumb.href || "#"}
                          style={{
                            color: v2Tokens.navy,
                            textDecoration: "none",
                            borderRadius: 6,
                            outlineOffset: 3,
                          }}
                          onMouseEnter={(event) => {
                            event.currentTarget.style.color = v2Tokens.purple;
                            event.currentTarget.style.textDecoration = "underline";
                          }}
                          onMouseLeave={(event) => {
                            event.currentTarget.style.color = v2Tokens.navy;
                            event.currentTarget.style.textDecoration = "none";
                          }}
                        >
                          {crumb.label}
                        </Link>
                      ) : (
                        <span aria-current={current ? "page" : undefined} style={{ color: current ? v2Tokens.slate : v2Tokens.slate }}>
                          {crumb.label}
                        </span>
                      )}
                    </React.Fragment>
                  );
                })}
              </nav>
              <div className="mylearna-v2-mobile-title" style={{ color: v2Tokens.navy, fontSize: 17, fontWeight: 650 }}>
                {title}
              </div>
              </div>
            </div>
            <div className="mylearna-v2-header-actions" style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <CleanAccountMenu email={user?.email ?? null} redirectTo="/start-free" />
            </div>
          </header>

          <main className={`mylearna-v2-content-main${quickCaptureRoute ? " mylearna-v2-quick-capture-content" : ""}`} style={{ padding: "clamp(16px, 3vw, 28px)" }}>
            <div className="mylearna-v2-content-inner" style={{ maxWidth: 1240, margin: "0 auto", display: "grid", gap: 18 }}>
              {children}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  paddingTop: 4,
                }}
              >
                <ReportProblemButton pageTitle={title} />
              </div>
            </div>
          </main>
        </div>
      </div>

      <GuidedStartFamilySetup />

      {openMobileNav === "more" ? (
        <div
          ref={moreDialogRef}
          className="mylearna-v2-mobile-nav-sheet"
          id="mylearna-mobile-more-navigation"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mylearna-mobile-more-title"
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <p id="mylearna-mobile-more-title" className="mylearna-v2-mobile-sheet-title">MORE</p>
            <button
              ref={moreCloseRef}
              type="button"
              onClick={() => closeMobileMore()}
              style={{ minHeight: 44, minWidth: 44, border: `1px solid ${v2Tokens.border}`, borderRadius: 12, background: "#ffffff", color: v2Tokens.navy, padding: "8px 12px", fontWeight: 750, cursor: "pointer" }}
            >
              Close
            </button>
          </div>
          <div className="mylearna-v2-mobile-sheet-grid">
            <Link
              href="/my-calendar"
              onClick={() => closeMobileMore(false)}
              className="mylearna-v2-mobile-sheet-link"
              style={{ background: isActive(pathname, calendarNavItem.matches) ? v2Tokens.lavender : "#ffffff", color: isActive(pathname, calendarNavItem.matches) ? v2Tokens.purple : v2Tokens.navy }}
            >
              <ShellIcon name="calendar" size={19} />
              <span>My Calendar</span>
            </Link>
            {[settingsNavItem].map((item) => {
              const active = isActive(pathname, item.matches);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => closeMobileMore(false)}
                  className="mylearna-v2-mobile-sheet-link"
                  style={{
                    background: active ? v2Tokens.lavender : "#ffffff",
                    color: active ? v2Tokens.purple : v2Tokens.navy,
                  }}
                >
                  <ShellIcon name={item.icon} size={19} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <Link
              href="/my-profile"
              onClick={() => closeMobileMore(false)}
              className="mylearna-v2-mobile-sheet-link"
              style={{ background: "#ffffff", color: v2Tokens.navy }}
            >
              <ShellIcon name="learner" size={19} />
              <span>Account</span>
            </Link>
            <Link
              href="/my-community"
              onClick={() => closeMobileMore(false)}
              className="mylearna-v2-mobile-sheet-link"
              style={{ background: "#ffffff", color: v2Tokens.navy }}
            >
              <ShellIcon name="help" size={19} />
              <span>Help and feedback</span>
            </Link>
          </div>
        </div>
      ) : null}

      <nav className="mylearna-v2-mobile-bottom-nav" aria-label="Mobile primary navigation">
        <Link
          href={dayNavItem.href}
          aria-label="Today"
          aria-current={activeMobileSection === "today" ? "page" : undefined}
          className="mylearna-v2-mobile-nav-button"
          style={{
            minHeight: 48,
            minWidth: 54,
            borderRadius: 14,
            background: activeMobileSection === "today" ? v2Tokens.lavender : "transparent",
            color: activeMobileSection === "today" ? v2Tokens.purple : v2Tokens.slate,
            display: "grid",
            justifyItems: "center",
            alignContent: "center",
            gap: 2,
            fontSize: 11,
            fontWeight: 750,
            textDecoration: "none",
          }}
        >
          <ShellIcon name="sun" size={19} />
          <span>Today</span>
        </Link>
        {[
          { href: quickCaptureHref, icon: "camera" as const, label: "Capture", section: "capture" as const },
          { href: "/my-portfolio", icon: "folder" as const, label: "Portfolio", section: "portfolio" as const },
        ].map((item) => (
          <Link
            key={item.label}
            href={item.href}
            aria-label={item.label}
            aria-current={activeMobileSection === item.section ? "page" : undefined}
            className="mylearna-v2-mobile-nav-button"
            style={{
              minHeight: 48,
              minWidth: 54,
              borderRadius: 14,
              background: activeMobileSection === item.section ? v2Tokens.lavender : "transparent",
              color: activeMobileSection === item.section ? v2Tokens.purple : v2Tokens.slate,
              display: "grid",
              justifyItems: "center",
              alignContent: "center",
              gap: 2,
              fontSize: 11,
              fontWeight: 750,
              textDecoration: "none",
            }}
          >
            <ShellIcon name={item.icon} size={19} />
            <span>{item.label}</span>
          </Link>
        ))}
        <MobileBottomNavButton
          ref={moreTriggerRef}
          label="Open More navigation"
          controls="mylearna-mobile-more-navigation"
          expanded={openMobileNav === "more"}
          icon="gear"
          active={activeMobileSection === "more" || openMobileNav === "more"}
          onClick={() => {
            if (openMobileNav === "more") closeMobileMore();
            else setOpenMobileNav("more");
          }}
        >
          More
        </MobileBottomNavButton>
      </nav>
    </div>
  );
}
