"use client";

import Link from "next/link";
import React from "react";
import { usePathname } from "next/navigation";
import { useAuthUser } from "@/app/components/AuthUserProvider";
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
  { href: "/my-plan", label: "My Plan" },
  { href: "/my-programs", label: "My Programs" },
  { href: "/curriculum", label: "My Curriculum" },
  { href: "/my-portfolio", label: "My Portfolio" },
  { href: "/my-progress", label: "My Progress" },
] as const;

function normalizeRoute(pathname: string) {
  if (pathname === "/dashboard" || pathname === "/home" || pathname === "/my-day") {
    return "/my-day";
  }
  if (pathname === "/calendar" || pathname === "/my-calendar") return "/my-calendar";
  if (pathname === "/planner" || pathname === "/my-plan") return "/my-plan";
  if (pathname === "/my-programs") return "/my-programs";
  if (pathname === "/curriculum-map" || pathname === "/curriculum") return "/curriculum";
  if (pathname === "/portfolio" || pathname === "/my-portfolio") return "/my-portfolio";
  if (pathname === "/my-progress") return "/my-progress";
  return "";
}

function routeSubtitle(pathname: string) {
  if (pathname === "/my-day" || pathname === "/home" || pathname === "/dashboard") return "My Day";
  if (pathname === "/calendar" || pathname === "/my-calendar") return "My Calendar";
  if (pathname === "/capture") return "My Capture";
  if (pathname === "/my-programs") return "My Programs";
  if (pathname === "/planner" || pathname === "/my-plan") return "My Plan";
  if (pathname === "/curriculum-map" || pathname === "/curriculum") return "My Curriculum";
  if (pathname === "/portfolio" || pathname === "/my-portfolio") return "My Portfolio";
  if (pathname === "/reports" || pathname === "/my-reports") return "My Reports";
  if (pathname === "/my-progress") return "My Progress";
  if (pathname === "/settings") return "My Settings";
  if (pathname === "/profile") return "My Profile";
  if (pathname === "/family") return "My Family";
  if (pathname === "/community") return "Community";
  return "MyLearna";
}

function routeTitle(pathname: string) {
  if (normalizeRoute(pathname)) return "";
  return "MyLearna";
}

function routeHeroTitle(pathname: string, subtitle: string) {
  if (pathname === "/my-day" || pathname === "/home" || pathname === "/dashboard") {
    return "Move through today’s learning with clarity";
  }
  if (pathname === "/calendar" || pathname === "/my-calendar") {
    return "See the week clearly before it fills up";
  }
  if (pathname === "/my-programs") {
    return "Shape longer sequences before they land in the live week";
  }
  if (pathname === "/capture") {
    return "Curate evidence while the learning is still fresh";
  }
  if (pathname === "/planner" || pathname === "/my-plan") {
    return "Shape the next week with confidence";
  }
  if (pathname === "/portfolio" || pathname === "/my-portfolio") {
    return "Keep a visible story of progress as it grows";
  }
  if (pathname === "/reports" || pathname === "/my-reports") {
    return "Build clear family reports from real learning";
  }
  if (pathname === "/my-progress") {
    return "Notice what is moving well and what needs the next gentle step";
  }
  if (pathname === "/community") {
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
  if (pathname === "/my-programs") {
    return "Build reusable sequences, units, and term plans here, then let them flow into the weekly rhythm without starting from scratch each time.";
  }
  if (pathname === "/capture") {
    return "One useful learning note at the right moment can build a stronger record than a large system left untouched.";
  }
  if (pathname === "/planner" || pathname === "/my-plan") {
    return "A light, clear weekly plan helps the whole family move forward with a visible next step.";
  }
  if (pathname === "/portfolio" || pathname === "/my-portfolio") {
    return "Review the moments that matter and keep the story of progress easy to see and share.";
  }
  if (pathname === "/reports" || pathname === "/my-reports") {
    return "Bring together evidence, reflection, and structure so reporting is clearer and more trustworthy.";
  }
  if (pathname === "/my-progress") {
    return "Readiness, coverage, and suggested improvements belong in one calm view so you can decide the next best move without overwhelm.";
  }
  if (pathname === "/community") {
    return "Connect with other homeschool families in a space designed for clear, useful, and encouraging conversation.";
  }
  return "Keep your learning system connected and ready for the next meaningful step.";
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

  return (
    <div className={cx("w-full bg-slate-50", className)}>
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-6">
            <div className="shrink-0">
              <BrandHomeLink href="/home" />
            </div>

            <nav className="hidden min-w-0 items-center gap-2 lg:flex">
              {PRIMARY_NAV.map((item) => {
                const active = normalizedPath === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cx(
                      "inline-flex items-center rounded-full px-4 py-2 text-sm font-bold transition",
                      active
                        ? "bg-slate-950 text-white shadow-[0_10px_26px_rgba(15,23,42,0.12)]"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center justify-between gap-3 lg:justify-end">
            <div className="min-w-0 lg:text-right">
              {resolvedTitle ? (
                <div className="truncate text-[15px] font-black text-slate-950">{resolvedTitle}</div>
              ) : null}
              <div className="truncate text-sm font-semibold text-slate-500">{resolvedSubtitle}</div>
            </div>

            <span
              aria-label="Workspace status"
              className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-500 shadow-[0_8px_20px_rgba(15,23,42,0.04)]"
            >
              In sync
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
                Plan • Capture • Grow
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
  title = "Move from plan to portfolio, reports, and progress without losing the thread.",
  primaryActionLabel = "Open Home",
  primaryActionHref = "/home",
  items,
  className,
  pathname,
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
        title: "Open My Plan",
        description: "See what is coming up and shape the next learning step.",
        href: "/my-plan",
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
        title: "Check My Progress",
        description: "Confirm what is ready for authority review and export.",
        href: pathname?.startsWith("/authority") ? pathname : "/my-progress",
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