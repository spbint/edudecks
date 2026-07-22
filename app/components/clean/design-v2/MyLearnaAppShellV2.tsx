"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { useAuthUser } from "@/app/components/AuthUserProvider";
import ProductAnalyticsProvider from "@/app/components/clean/analytics/ProductAnalyticsProvider";
import CleanAccountMenu from "@/app/components/clean/CleanAccountMenu";
import CleanCommunityNotificationsMenu from "@/app/components/clean/CleanCommunityNotificationsMenu";
import ReportProblemButton from "@/app/components/clean/ReportProblemButton";
import { MobileSelectionLink } from "./MobileResponsivePrimitives";

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

type ProductNavIconName = "sun" | "calendar" | "route" | "camera" | "folder" | "chart" | "file" | "gear";

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

type MobileNavKey = "day" | "PLAN" | "CAPTURE" | "GROW" | "more";

const dayNavItem = {
  href: "/my-day",
  label: "My Day",
  shortLabel: "Day",
  icon: "sun",
  matches: ["/my-day", "/home", "/dashboard"],
} as const satisfies ProductNavItem;

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
      { href: "/my-calendar", label: "My Calendar", shortLabel: "Calendar", icon: "calendar", matches: ["/my-calendar", "/calendar"] },
      { href: "/my-pathways", label: "My Pathways", shortLabel: "Pathways", icon: "route", matches: ["/my-pathways"] },
    ],
  },
  {
    label: "CAPTURE",
    items: [
      { href: "/my-capture", label: "My Capture", shortLabel: "Capture", icon: "camera", matches: ["/my-capture", "/capture"] },
      { href: "/my-portfolio", label: "My Portfolio", shortLabel: "Portfolio", icon: "folder", matches: ["/my-portfolio", "/portfolio"] },
    ],
  },
  {
    label: "GROW",
    items: [
      { href: "/my-data", label: "My Data", shortLabel: "Data", icon: "chart", matches: ["/my-data", "/my-curriculum", "/curriculum", "/my-learna"] },
      { href: "/my-reports", label: "My Reports", shortLabel: "Reports", icon: "file", matches: ["/my-reports", "/reports"] },
    ],
  },
] as const satisfies readonly ProductNavSection[];

const groupedNavItems: readonly ProductNavItem[] = finalProductNavSections.flatMap(
  (section): readonly ProductNavItem[] => section.items,
);

const navItems: readonly ProductNavItem[] = [dayNavItem, ...groupedNavItems, settingsNavItem];

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

function routeTitle(pathname: string) {
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

function routeCrumbs(pathname: string): BreadcrumbItem[] {
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

function NavLink({
  item,
  pathname,
}: {
  item: (typeof navItems)[number];
  pathname: string;
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
        padding: "9px 11px",
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

function getActiveMobileSection(pathname: string): MobileNavKey {
  if (isActive(pathname, dayNavItem.matches)) return "day";
  if (isActive(pathname, settingsNavItem.matches) || pathname.startsWith("/my-profile") || pathname.startsWith("/my-community")) {
    return "more";
  }

  const section = finalProductNavSections.find((candidate) =>
    candidate.items.some((item) => isActive(pathname, item.matches)),
  );

  return section?.label ?? "day";
}

export function getMobilePrefetchDestinations(activeSection: MobileNavKey): string[] {
  const destinations = new Set(["/my-day", "/my-settings"]);
  if (activeSection === "PLAN") {
    destinations.add("/my-calendar");
    destinations.add("/my-pathways");
  } else if (activeSection === "CAPTURE") {
    destinations.add("/my-capture");
    destinations.add("/my-portfolio");
  } else if (activeSection === "GROW") {
    destinations.add("/my-data");
    destinations.add("/my-reports");
  } else {
    destinations.add("/my-calendar");
    destinations.add("/my-capture");
    destinations.add("/my-data");
  }
  return [...destinations];
}

function MobilePillarSwitcher({ pathname }: { pathname: string }) {
  const section = finalProductNavSections.find((candidate) =>
    candidate.items.some((item) => isActive(pathname, item.matches)),
  );

  if (!section) return null;

  return (
    <nav
      className="mylearna-mobile-pillar-switcher"
      aria-label={`${section.label.toLowerCase()} destinations`}
      role="tablist"
    >
      {section.items.map((item) => (
        <MobileSelectionLink
          key={item.href}
          href={item.href}
          label={item.shortLabel}
          active={isActive(pathname, item.matches)}
        />
      ))}
    </nav>
  );
}

function MobileBottomNavButton({
  active,
  children,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  icon: ShellIconName;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
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
}

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
  const [openMobileNav, setOpenMobileNav] = React.useState<MobileNavKey | null>(null);
  const title = routeTitle(pathname);
  const breadcrumbs = routeCrumbs(pathname);
  const activityMode = getActivityMode(pathname);
  const activeMobileSection = getActiveMobileSection(pathname);

  React.useEffect(() => {
    setOpenMobileNav(null);
  }, [pathname]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const connection = (
      navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }
    ).connection;
    if (connection?.saveData || connection?.effectiveType === "slow-2g") return;

    const destinations = getMobilePrefetchDestinations(activeMobileSection);

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
  }, [activeMobileSection, router]);

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
        }

        .mylearna-v2-mobile-bottom-nav,
        .mylearna-v2-mobile-nav-sheet {
          display: none;
        }

        .mylearna-mobile-pillar-switcher {
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

          .mylearna-v2-content-inner {
            gap: 12px !important;
          }

          .mylearna-mobile-pillar-switcher {
            display: grid !important;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 6px;
            margin: -2px 0 0;
            padding: 4px;
            border: 1px solid ${v2Tokens.border};
            border-radius: 14px;
            background: rgba(255,255,255,0.78);
          }

          .mylearna-mobile-pillar-tab {
            min-height: 42px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 10px;
            font-size: 13px;
            font-weight: 750;
            text-decoration: none;
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

          .mylearna-v2-encouragement {
            display: none !important;
          }

          .mylearna-v2-mobile-bottom-nav {
            position: fixed !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            z-index: 60 !important;
            display: grid !important;
            grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
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
          <Link href="/my-day" style={{ display: "block", textDecoration: "none" }}>
            <Image
              src="/branding/MyLearna Logo.png"
              alt="MyLearna"
              width={1916}
              height={821}
              priority
              style={{ width: 154, height: "auto", display: "block" }}
            />
          </Link>

          <nav
            className="mylearna-v2-nav"
            aria-label="MyLearna sections"
            style={{ display: "grid", gap: 6, alignContent: "start" }}
          >
            <NavLink item={dayNavItem} pathname={pathname} />
            {finalProductNavSections.map((section) => (
              <div key={section.label} style={{ display: "grid", gap: 5 }}>
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
                {section.items.map((item) => (
                  <NavLink key={item.href} item={item} pathname={pathname} />
                ))}
              </div>
            ))}
            <NavLink item={settingsNavItem} pathname={pathname} />
          </nav>

          <div
            className="mylearna-v2-encouragement"
            style={{
              border: `1px solid ${v2Tokens.border}`,
              borderRadius: 18,
              background: "linear-gradient(145deg, #FFFFFF 0%, #F7F4FF 100%)",
              padding: 14,
              color: v2Tokens.navy,
              display: "grid",
              gap: 6,
              boxShadow: "0 8px 24px rgba(23,32,75,0.045)",
            }}
          >
            <strong style={{ fontSize: 13, fontWeight: 650 }}>Ready for today</strong>
            <span style={{ color: v2Tokens.slate, fontSize: 13, lineHeight: 1.5 }}>
              Choose one useful step, then let the pathway guide what comes next.
            </span>
          </div>
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
            <div className="mylearna-v2-header-actions" style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Link
                href="/my-community"
                aria-label="Open help and community"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 999,
                  border: `1px solid ${v2Tokens.border}`,
                  background: "#FFFFFF",
                  color: v2Tokens.slate,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textDecoration: "none",
                }}
              >
                <ShellIcon name="help" size={18} />
              </Link>
              <CleanCommunityNotificationsMenu />
              <CleanAccountMenu email={user?.email ?? null} redirectTo="/start-free" />
            </div>
          </header>

          <main className="mylearna-v2-content-main" style={{ padding: "clamp(16px, 3vw, 28px)" }}>
            <MobilePillarSwitcher pathname={pathname} />
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

      {openMobileNav === "more" ? (
        <div
          className="mylearna-v2-mobile-nav-sheet"
          role="dialog"
          aria-modal="true"
          aria-label="More navigation"
        >
          <p className="mylearna-v2-mobile-sheet-title">MORE</p>
          <div className="mylearna-v2-mobile-sheet-grid">
            {[settingsNavItem].map((item) => {
              const active = isActive(pathname, item.matches);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
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
              className="mylearna-v2-mobile-sheet-link"
              style={{ background: "#ffffff", color: v2Tokens.navy }}
            >
              <ShellIcon name="learner" size={19} />
              <span>Account</span>
            </Link>
            <Link
              href="/my-community"
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
          aria-label="Day"
          aria-current={activeMobileSection === "day" ? "page" : undefined}
          className="mylearna-v2-mobile-nav-button"
          style={{
            minHeight: 48,
            minWidth: 54,
            borderRadius: 14,
            background: activeMobileSection === "day" ? v2Tokens.lavender : "transparent",
            color: activeMobileSection === "day" ? v2Tokens.purple : v2Tokens.slate,
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
          <span>Day</span>
        </Link>
        {[
          { href: "/my-calendar", icon: "calendar" as const, label: "Plan", section: "PLAN" as const },
          { href: "/my-capture", icon: "camera" as const, label: "Capture", section: "CAPTURE" as const },
          { href: "/my-data", icon: "chart" as const, label: "Grow", section: "GROW" as const },
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
          label="Open More navigation"
          icon="gear"
          active={activeMobileSection === "more" || openMobileNav === "more"}
          onClick={() => setOpenMobileNav((current) => (current === "more" ? null : "more"))}
        >
          More
        </MobileBottomNavButton>
      </nav>
    </div>
  );
}
