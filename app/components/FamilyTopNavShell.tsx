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
  curriculum?: string;
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

function routeSubtitle(pathname: string) {
  if (pathname === "/family") return "Family Home";
  if (pathname === "/calendar") return "Calendar";
  if (pathname === "/capture") return "Capture";
  if (pathname === "/curriculum") return "Curriculum";
  if (pathname === "/planner") return "Planner";
  if (pathname === "/portfolio") return "Portfolio";
  if (pathname === "/reports") return "Reports";
  if (pathname === "/profile") return "Profile";
  if (pathname === "/settings") return "Settings";
  if (pathname === "/community") return "Community";
  return "Family workspace";
}

function routeTitle(_pathname: string) {
  return "EduDecks Family";
}

function routeHeroTitle(pathname: string, subtitle: string) {
  if (pathname === "/family") return "Keep the family rhythm calm and connected";
  if (pathname === "/calendar") return "See the week clearly before it fills up";
  if (pathname === "/capture") return "Capture the learning while it is still fresh";
  if (pathname === "/curriculum") return "See curriculum coverage clearly for the current learner";
  if (pathname === "/planner") return "Shape the next week with confidence";
  if (pathname === "/portfolio") return "Curate the learning story as it grows";
  if (pathname === "/reports") return "Turn captured moments into clear family reporting";
  if (pathname === "/community") return "A calm place to ask, share, and encourage";
  return subtitle;
}

function routeHeroText(pathname: string) {
  if (pathname === "/family") {
    return "Keep the next step visible across capture, planning, portfolio, and reporting without losing the wider family picture.";
  }
  if (pathname === "/calendar") {
    return "Place learning moments into the week gently so the family workflow stays practical rather than overwhelming.";
  }
  if (pathname === "/capture") {
    return "One useful learning note at the right moment can build a stronger record than a large system left untouched.";
  }
  if (pathname === "/curriculum") {
    return "Track what has started, what is secure, and what needs the next calm step without leaving the family workflow.";
  }
  if (pathname === "/planner") {
    return "A light, clear weekly plan helps the whole family move forward without pressure.";
  }
  if (pathname === "/portfolio") {
    return "Review the moments that matter and keep the story of progress easy to see and share.";
  }
  if (pathname === "/reports") {
    return "Bring together evidence, reflection, and structure so reporting feels calmer and more trustworthy.";
  }
  if (pathname === "/community") {
    return "Connect with other homeschool families in a space designed for clear, useful, and encouraging conversation.";
  }
  return "Keep the family workspace calm, connected, and ready for the next meaningful step.";
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
  curriculum,
  heroTitle,
  heroText,
  heroAsideTitle = "Family Snapshot",
  heroAsideText = "A calm, clear view of the current family workspace and the next connected step.",
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
    familyName || workspace.profile.family_display_name || "EduDecks Family";
  const resolvedEmail = email || user?.email || "Signed-in family workspace";
  const resolvedDefaultLearner =
    defaultLearner || activeLearner?.label || workspace.learners[0]?.label || "No learner selected";
  const resolvedCurriculum =
    curriculum ||
    workspace.profile.curriculum_preferences.framework_id ||
    workspace.profile.preferred_market?.toUpperCase() ||
    "Curriculum not set";

  return (
    <div className={cx("w-full bg-slate-50", className)}>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-6 px-6 py-5">
          <div className="flex min-w-0 items-center gap-4">
            <div className="shrink-0">
              <BrandHomeLink href="/family" />
            </div>

            <div className="min-w-0">
              <div className="truncate text-[16px] font-black text-slate-950">
                {resolvedTitle}
              </div>
              <div className="truncate text-sm font-semibold text-slate-500">
                {resolvedSubtitle}
              </div>
            </div>
          </div>

          <div className="shrink-0">
            <FamilyProfileMenu
              familyName={resolvedFamilyName}
              email={resolvedEmail}
              defaultLearner={resolvedDefaultLearner}
              curriculum={resolvedCurriculum}
            />
          </div>
        </div>
      </header>

      <div className={cx("mx-auto w-full max-w-[1440px] px-6 py-6", contentClassName)}>
        {!hideHero ? (
          <section className="mb-6 grid gap-5 rounded-[26px] border border-blue-100 bg-[linear-gradient(135deg,rgba(255,255,255,0.98)_0%,rgba(239,246,255,0.96)_100%)] px-6 py-7 shadow-[0_16px_44px_rgba(15,23,42,0.05)] md:grid-cols-[minmax(0,1.35fr)_minmax(260px,0.75fr)]">
            <div className="max-w-[860px]">
              <div className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                Family workspace
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
                <div className="mt-3 text-sm leading-7 text-slate-600">
                  {heroAsideText}
                </div>
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
  eyebrow = "Family Command Layer",
  title = "Move from capture to planning, portfolio, reporting, and readiness without losing the thread.",
  primaryActionLabel = "Workspace Home",
  primaryActionHref = "/family",
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
        title: "Open Planner",
        description: "See what is coming up and shape the next learning step.",
        href: "/planner",
      },
      {
        title: "Go to Portfolio",
        description: "Review the story your evidence is building over time.",
        href: "/portfolio",
      },
      {
        title: "Build Report",
        description: "Turn captured evidence into a clear family report.",
        href: "/reports",
      },
      {
        title: "Check Readiness",
        description: "Confirm what is ready for authority review and export.",
        href: pathname?.startsWith("/authority") ? pathname : "/authority",
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
