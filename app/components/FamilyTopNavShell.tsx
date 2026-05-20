"use client";

import Link from "next/link";
import React from "react";
import { usePathname } from "next/navigation";
import { useAuthUser } from "@/app/components/AuthUserProvider";
import BetaV1Badge from "@/app/components/BetaV1Badge";
import BrandHomeLink from "@/app/components/BrandHomeLink";
import FamilyProfileMenu from "@/app/components/FamilyProfileMenu";
import { useFamilyWorkspace } from "@/app/components/FamilyWorkspaceProvider";

type FamilyTopNavShellProps = {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  contentClassName?: string;
  familyName?: string;
  email?: string;
  defaultLearner?: string;
  heroTitle?: string;
  heroText?: string;
  heroAsideTitle?: string;
  heroAsideText?: string;
  workflowHelperText?: string;
  workflowCurrentHref?: string;
  hideHero?: boolean;
  hideHeroAside?: boolean;
};

type FamilyCommandItem = {
  title: string;
  description: string;
  href?: string;
};

type FamilyCommandLayerProps = {
  eyebrow?: string;
  title?: string;
  primaryActionLabel?: string;
  primaryActionHref?: string;
  items?: FamilyCommandItem[];
  className?: string;
  pathname?: string;
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const PRIMARY_NAV = [
  { href: "/my-day", label: "My Day" },
  { href: "/my-calendar", label: "My Calendar" },
  { href: "/my-programs", label: "My Programs" },
  { href: "/my-pathways", label: "My Pathways" },
  { href: "/my-curriculum", label: "My Curriculum" },
  { href: "/my-assessments", label: "My Assessments" },
] as const;

const SECONDARY_NAV = [
  { href: "/my-capture", label: "My Capture" },
  { href: "/my-portfolio", label: "My Portfolio" },
  { href: "/my-reports", label: "My Reports" },
  { href: "/my-outputs", label: "My Outputs" },
] as const;

function normalizeOutputRoute(pathname: string) {
  if (pathname === "/capture" || pathname === "/my-capture") return "/my-capture";
  if (pathname === "/my-portfolio" || pathname === "/portfolio") return "/my-portfolio";
  if (pathname === "/my-reports" || pathname.startsWith("/reports")) return "/my-reports";
  if (pathname === "/my-outputs") return "/my-outputs";
  return "";
}

function normalizeRoute(pathname: string) {
  if (pathname === "/dashboard" || pathname === "/home" || pathname === "/my-day") {
    return "/my-day";
  }
  if (pathname === "/my-month") return "/my-calendar";
  if (pathname === "/calendar" || pathname === "/my-calendar") return "/my-calendar";
  if (pathname === "/planner" || pathname === "/my-plan") return "/my-calendar";
  if (pathname === "/my-programs") return "/my-programs";
  if (pathname === "/my-pathways") return "/my-pathways";
  if (
    pathname === "/curriculum" ||
    pathname === "/curriculum-map" ||
    pathname === "/my-curriculum"
  ) {
    return "/my-curriculum";
  }
  if (pathname === "/my-assessments") return "/my-assessments";
  return "";
}

function routeSubtitle(pathname: string) {
  if (pathname === "/my-day" || pathname === "/home" || pathname === "/dashboard") return "My Day";
  if (pathname === "/my-month") return "My Calendar";
  if (pathname === "/calendar" || pathname === "/my-calendar") return "My Calendar";
  if (pathname === "/capture" || pathname === "/my-capture") return "My Capture";
  if (pathname === "/my-programs") return "My Programs";
  if (pathname === "/my-pathways") return "My Pathways";
  if (pathname === "/planner" || pathname === "/my-plan") return "My Calendar";
  if (
    pathname === "/curriculum-map" ||
    pathname === "/curriculum" ||
    pathname === "/my-curriculum"
  ) {
    return "My Curriculum";
  }
  if (pathname === "/my-assessments") return "My Assessments";
  if (pathname === "/portfolio" || pathname === "/my-portfolio") return "My Portfolio";
  if (pathname === "/reports" || pathname === "/my-reports") return "My Reports";
  if (pathname === "/my-outputs") return "My Outputs";
  if (pathname === "/settings") return "My Settings";
  if (pathname === "/profile") return "My Profile";
  if (pathname === "/family") return "My Family";
  if (pathname === "/community" || pathname.startsWith("/community/")) return "Community";
  return "MyLearna";
}

function routeTitle(pathname: string) {
  if (normalizeRoute(pathname)) return "";
  return "MyLearna";
}

function routeHeroTitle(pathname: string, subtitle: string) {
  if (pathname === "/my-day" || pathname === "/home" || pathname === "/dashboard") {
    return "Move through today's learning with clarity";
  }
  if (pathname === "/calendar" || pathname === "/my-calendar") {
    return "See the week clearly before it fills up";
  }
  if (pathname === "/my-month") {
    return "See the week clearly before it fills up";
  }
  if (pathname === "/my-programs") {
    return "Shape longer sequences before they land in the live week";
  }
  if (pathname === "/my-pathways") {
    return "Follow the next useful learning step with more confidence";
  }
  if (pathname === "/capture" || pathname === "/my-capture") {
    return "Curate evidence while the learning is still fresh";
  }
  if (pathname === "/planner" || pathname === "/my-plan") {
    return "See the week clearly before it fills up";
  }
  if (
    pathname === "/curriculum" ||
    pathname === "/curriculum-map" ||
    pathname === "/my-curriculum"
  ) {
    return "See how evidence is building across the broader learning map";
  }
  if (pathname === "/my-assessments") {
    return "See assessed skill confidence in a calm, visual way";
  }
  if (pathname === "/portfolio" || pathname === "/my-portfolio") {
    return "Keep a visible story of progress as it grows";
  }
  if (pathname === "/reports" || pathname === "/my-reports") {
    return "Build clear family reports from real learning";
  }
  if (pathname === "/community" || pathname.startsWith("/community/")) {
    return "A place to ask, share, and encourage";
  }
  return subtitle;
}

function routeHeroText(pathname: string) {
  if (pathname === "/my-day" || pathname === "/home" || pathname === "/dashboard") {
    return "See what is planned for today, keep the next useful step close, and capture evidence without leaving the flow.";
  }
  if (pathname === "/calendar" || pathname === "/my-calendar") {
    return "Place learning moments into the week so the family workflow stays practical and visible.";
  }
  if (pathname === "/my-month") {
    return "Place learning moments into the week so the family workflow stays practical and visible.";
  }
  if (pathname === "/my-programs") {
    return "Build reusable sequences, units, and term plans here, then let them flow into the weekly rhythm without starting from scratch each time.";
  }
  if (pathname === "/my-pathways") {
    return "Use guided pathways to see what comes next, what to practise, and how progress can later become evidence and reporting.";
  }
  if (pathname === "/capture" || pathname === "/my-capture") {
    return "One useful learning note at the right moment can build a stronger record than a large system left untouched.";
  }
  if (pathname === "/planner" || pathname === "/my-plan") {
    return "Place learning moments into the week so the family workflow stays practical and visible.";
  }
  if (
    pathname === "/curriculum" ||
    pathname === "/curriculum-map" ||
    pathname === "/my-curriculum"
  ) {
    return "See how learning evidence is spreading across curriculum and reporting areas without interrupting the capture flow.";
  }
  if (pathname === "/my-assessments") {
    return "Use visual skill tracking to see where confidence is building across mathematics and English without turning the workflow into a test dashboard.";
  }
  if (pathname === "/portfolio" || pathname === "/my-portfolio") {
    return "Review the moments that matter and keep the story of progress easy to see and share.";
  }
  if (pathname === "/reports" || pathname === "/my-reports") {
    return "Bring together evidence, reflection, and structure so reporting is clearer and more trustworthy.";
  }
  if (pathname === "/community" || pathname.startsWith("/community/")) {
    return "Connect with other homeschool families in a space designed for clear, useful, and encouraging conversation.";
  }
  return "Keep your learning system connected and ready for the next meaningful step.";
}

function OutputsDropdown({ pathname }: { pathname: string }) {
  const [open, setOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement | null>(null);

  const normalizedOutputPath = normalizeOutputRoute(pathname);
  const secondaryActive = Boolean(normalizedOutputPath);

  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current) return;
      if (menuRef.current.contains(event.target as Node)) return;
      setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={menuRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={cx(
          "inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-[13px] font-semibold tracking-[-0.01em] transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2",
          secondaryActive
            ? "bg-slate-950 text-white shadow-[0_12px_30px_rgba(15,23,42,0.16)]"
            : "text-slate-500 hover:bg-white/90 hover:text-slate-900",
        )}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="outputs-navigation-menu"
      >
        Outputs
        <span aria-hidden="true" className="text-[11px] leading-none">
          ▾
        </span>
      </button>

      {open ? (
        <div
          id="outputs-navigation-menu"
          role="menu"
          className="absolute left-0 top-full z-[100] mt-3 w-72 rounded-[22px] border border-slate-200/90 bg-white p-2.5 shadow-[0_22px_50px_rgba(15,23,42,0.18)]"
        >
          {SECONDARY_NAV.map((item) => {
            const active = normalizedOutputPath === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                aria-current={active ? "page" : undefined}
                className={cx(
                  "block rounded-[16px] px-4 py-3 text-sm font-semibold tracking-[-0.01em] transition duration-150",
                  active
                    ? "bg-slate-950 text-white shadow-[0_10px_24px_rgba(15,23,42,0.12)]"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-950",
                )}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export default function FamilyTopNavShell({
  children,
  title,
  subtitle,
  className,
  contentClassName,
  familyName,
  email,
  defaultLearner,
  heroTitle,
  heroText,
  heroAsideTitle = "Family Snapshot",
  heroAsideText = "A clear view of the current family workspace, the current learner, and the next useful step.",
  workflowHelperText,
  workflowCurrentHref,
  hideHero = false,
  hideHeroAside = false,
}: FamilyTopNavShellProps) {
  const pathname = usePathname();
  const { user } = useAuthUser();
  const { workspace, activeLearner } = useFamilyWorkspace();

  const resolvedTitle = title ?? routeTitle(pathname);
  const resolvedSubtitle = subtitle ?? routeSubtitle(pathname);
  const resolvedHeroTitle = heroTitle ?? routeHeroTitle(pathname, resolvedSubtitle);
  const resolvedHeroText = heroText ?? routeHeroText(pathname);
  const resolvedFamilyName =
    familyName || workspace.profile.family_display_name || "MyLearna Family";
  const resolvedEmail = email || user?.email || "Signed-in family workspace";
  const resolvedDefaultLearner =
    defaultLearner || activeLearner?.label || workspace.learners[0]?.label || "No learner selected";
  const normalizedPath = normalizeRoute(pathname);
  const communityActive = pathname === "/community" || pathname.startsWith("/community/");
  const workspaceStatusLabel = workspace.syncIssue
    ? "Sync issue"
    : workspace.storageMode === "database"
      ? "In sync"
      : "Local only";
  const workspaceStatusClassName = workspace.syncIssue
    ? "border-amber-200 bg-amber-50 text-amber-700"
    : workspace.storageMode === "database"
      ? "border-slate-200 bg-white text-slate-500"
      : "border-slate-200 bg-slate-100 text-slate-600";

  return (
    <div
      className={cx("w-full bg-slate-50", className)}
      data-route-title={resolvedTitle || undefined}
    >
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/92 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-3 px-6 py-3.5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-3 sm:gap-7">
            <div className="flex shrink-0 items-center gap-3">
              <BrandHomeLink href="/my-day" />
              <BetaV1Badge compact />
            </div>

            <div className="min-w-0 rounded-full border border-slate-200/80 bg-slate-50/80 p-1">
              <nav className="flex min-w-max items-center gap-1.5 overflow-visible">
                {PRIMARY_NAV.map((item) => {
                  const active = normalizedPath === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cx(
                        "inline-flex items-center rounded-full px-4 py-2.5 text-[13px] font-semibold tracking-[-0.01em] transition duration-150",
                        active
                          ? "bg-white text-slate-950 shadow-[0_8px_22px_rgba(15,23,42,0.08)] ring-1 ring-slate-200"
                          : "text-slate-500 hover:bg-white/90 hover:text-slate-900",
                      )}
                    >
                      {item.label}
                    </Link>
                  );
                })}

                <OutputsDropdown pathname={pathname} />
              </nav>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 lg:justify-end">
            <Link
              href="/community"
              aria-current={communityActive ? "page" : undefined}
              className={cx(
                "group min-w-0 rounded-[18px] px-3 py-2 text-left transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2",
                communityActive
                  ? "bg-slate-100/90 shadow-[0_8px_20px_rgba(15,23,42,0.05)]"
                  : "hover:bg-slate-50",
              )}
            >
              <div
                className={cx(
                  "truncate text-[14px] font-bold tracking-[-0.01em] transition duration-150",
                  communityActive
                    ? "text-slate-950"
                    : "text-slate-900 group-hover:text-slate-950",
                )}
              >
                Community
              </div>
              <div
                className={cx(
                  "truncate text-[13px] font-medium tracking-[-0.01em] transition duration-150",
                  communityActive
                    ? "text-slate-700"
                    : "text-slate-500 group-hover:text-slate-700",
                )}
              >
                Separate from the core workflow
              </div>
            </Link>

            <span
              aria-label="Workspace status"
              title={workspace.syncIssue || workspaceStatusLabel}
              className={cx(
                "inline-flex items-center rounded-full border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] shadow-[0_8px_20px_rgba(15,23,42,0.04)]",
                workspaceStatusClassName,
              )}
            >
              {workspaceStatusLabel}
            </span>

            <FamilyProfileMenu
              familyName={resolvedFamilyName}
              email={resolvedEmail}
              defaultLearner={resolvedDefaultLearner}
            />
          </div>
        </div>
      </header>

      <div className={cx("mx-auto w-full max-w-[1440px] px-6 py-6", contentClassName)}>
        {!hideHero ? (
          <section className="mb-6 grid gap-5 rounded-[26px] border border-blue-100 bg-[linear-gradient(135deg,rgba(255,255,255,0.98)_0%,rgba(239,246,255,0.96)_100%)] px-6 py-7 shadow-[0_16px_44px_rgba(15,23,42,0.05)] md:grid-cols-[minmax(0,1.35fr)_minmax(260px,0.75fr)]">
            <div className="max-w-[860px]">
              <div className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                Plan / Capture / Reflect / Grow
              </div>
              <h1 className="text-[28px] font-black leading-tight text-slate-950 md:text-[36px]">
                {resolvedHeroTitle}
              </h1>
              <p className="mt-3 max-w-[760px] text-[15px] leading-8 text-slate-600">
                {resolvedHeroText}
              </p>
              {workflowHelperText ? (
                <div className="mt-5 rounded-[18px] border border-slate-200 bg-white/80 px-4 py-4 text-sm leading-7 text-slate-600 shadow-[0_8px_24px_rgba(15,23,42,0.03)]">
                  {workflowCurrentHref ? (
                    <div className="mb-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                      Current step: {workflowCurrentHref.replace("/", "") || "family"}
                    </div>
                  ) : null}
                  {workflowHelperText}
                </div>
              ) : null}
            </div>

            {!hideHeroAside ? (
              <aside className="rounded-[22px] border border-slate-200 bg-white/85 px-5 py-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
                <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                  {heroAsideTitle}
                </div>
                <div className="mt-3 text-sm leading-7 text-slate-600">{heroAsideText}</div>
              </aside>
            ) : null}
          </section>
        ) : null}

        {children}
      </div>
    </div>
  );
}

export function FamilyShellSurface({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-slate-50 text-slate-900">{children}</div>;
}

export function FamilyCommandLayer({
  eyebrow = "MyLearna Command Layer",
  title = "Move from plan to portfolio and reports without losing the thread.",
  primaryActionLabel = "Open My Day",
  primaryActionHref = "/my-day",
  items,
  className,
}: FamilyCommandLayerProps) {
  const resolvedItems: FamilyCommandItem[] =
    items ??
    [
      {
        title: "Capture Evidence",
        description: "Save a learning moment while it is still fresh.",
        href: "/capture",
      },
      {
        title: "Open My Calendar",
        description: "See what is coming up and shape the next weekly block.",
        href: "/my-calendar",
      },
      {
        title: "Open My Portfolio",
        description: "Review the story your evidence is building over time.",
        href: "/my-portfolio",
      },
      {
        title: "Build My Report",
        description: "Turn captured evidence into a clear family report.",
        href: "/my-reports",
      },
      {
        title: "Open My Family",
        description: "Review your learner list, family settings, and the current workspace.",
        href: "/family",
      },
    ];

  return (
    <section
      className={cx(
        "rounded-[24px] border border-slate-200 bg-slate-50/70 px-6 py-6 shadow-[0_10px_34px_rgba(15,23,42,0.04)]",
        className,
      )}
    >
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-[820px]">
          <div className="mb-2 text-xs font-black uppercase tracking-[0.24em] text-slate-500">
            {eyebrow}
          </div>
          <h2 className="text-[20px] font-black leading-tight text-slate-950 md:text-[24px]">
            {title}
          </h2>
        </div>

        <Link
          href={primaryActionHref}
          className="inline-flex items-center justify-center rounded-[18px] border border-slate-200 bg-white px-5 py-3 text-base font-bold text-slate-900 transition hover:bg-slate-100"
        >
          {primaryActionLabel}
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {resolvedItems.map((item) => {
          const content = (
            <div className="rounded-[20px] border border-slate-200 bg-white px-5 py-5 shadow-[0_8px_24px_rgba(15,23,42,0.03)] transition hover:bg-slate-50">
              <div className="text-[16px] font-black text-slate-950">{item.title}</div>
              <div className="mt-3 text-sm leading-7 text-slate-600">{item.description}</div>
            </div>
          );

          if (item.href) {
            return (
              <Link key={item.title} href={item.href}>
                {content}
              </Link>
            );
          }

          return <div key={item.title}>{content}</div>;
        })}
      </div>
    </section>
  );
}
