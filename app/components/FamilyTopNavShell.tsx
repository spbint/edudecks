"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuthUser } from "@/app/components/AuthUserProvider";
import BrandHomeLink from "@/app/components/BrandHomeLink";
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
  if (pathname === "/planner") return "Planner";
  if (pathname === "/portfolio") return "Portfolio";
  if (pathname === "/reports") return "Reports";
  if (pathname === "/profile") return "Homeschool-first learning flow";
  if (pathname === "/settings") return "Settings";
  if (pathname === "/community") return "Community";
  return "Homeschool-first learning flow";
}

function routeTitle(_pathname: string) {
  return "EduDecks Family";
}

function routeHeroTitle(pathname: string, subtitle: string) {
  if (pathname === "/family") return "Keep the family rhythm calm and connected";
  if (pathname === "/calendar") return "See the week clearly before it fills up";
  if (pathname === "/capture") return "Capture the learning while it is still fresh";
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
              <div className="text-[16px] font-black text-slate-950">
                {item.title}
              </div>
              <div className="mt-3 text-sm leading-7 text-slate-600">
                {item.description}
              </div>
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

type FamilyProfileMenuProps = {
  familyName: string;
  email: string;
  defaultLearner: string;
  curriculum: string;
};

function FamilyProfileMenu({
  familyName,
  email,
  defaultLearner,
  curriculum,
}: FamilyProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const initials = useMemo(() => {
    return familyName
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [familyName]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-2 shadow-[0_8px_20px_rgba(15,23,42,0.05)] transition hover:bg-slate-50"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Open family profile menu"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-sm font-black text-blue-700">
          {initials}
        </div>

        <div className="hidden text-left sm:block">
          <div className="text-sm font-bold text-slate-900">{familyName}</div>
          <div className="text-xs text-slate-500">Family control centre</div>
        </div>

        <svg
          className={cx(
            "h-4 w-4 text-slate-500 transition-transform",
            open && "rotate-180",
          )}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 0l-4.25-4.51a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 top-[calc(100%+12px)] z-50 w-[340px] overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.14)]"
          role="menu"
        >
          <div className="border-b border-slate-200 px-5 py-5">
            <div className="text-lg font-black text-slate-950">{familyName}</div>
            <div className="mt-1 text-sm text-slate-500">{email}</div>

            <div className="mt-4 grid gap-3 rounded-[18px] border border-slate-200 bg-slate-50 p-4">
              <div>
                <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                  Default learner
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  {defaultLearner}
                </div>
              </div>

              <div>
                <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                  Curriculum
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  {curriculum}
                </div>
              </div>
            </div>
          </div>

          <div className="px-3 py-3">
            <MenuSection
              title="Family"
              items={[
                { label: "My profile", href: "/profile" },
                { label: "Manage family", href: "/profile#manage-family" },
                { label: "Family Home", href: "/family" },
              ]}
              onNavigate={() => setOpen(false)}
            />

            <MenuSection
              title="Setup"
              items={[
                { label: "Settings", href: "/settings" },
                { label: "Curriculum setup", href: "/profile#curriculum-setup" },
              ]}
              onNavigate={() => setOpen(false)}
            />

            <MenuSection
              title="Workspace"
              items={[
                { label: "Community", href: "/community" },
                { label: "Calendar", href: "/calendar" },
                { label: "Portfolio", href: "/portfolio" },
              ]}
              onNavigate={() => setOpen(false)}
            />

            <div className="mt-2 border-t border-slate-200 px-2 pt-3">
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="flex w-full items-center justify-center rounded-2xl bg-blue-600 px-3 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Sign out
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuSection({
  title,
  items,
  onNavigate,
}: {
  title: string;
  items: Array<{ label: string; href: string }>;
  onNavigate: () => void;
}) {
  return (
    <div className="mb-3">
      <div className="px-2 pb-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
        {title}
      </div>

      <div className="grid gap-2">
        {items.map((item) => (
          <Link
            key={`${item.href}-${item.label}`}
            href={item.href}
            onClick={onNavigate}
            className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-4 text-base font-bold text-slate-900 transition hover:bg-slate-100"
          >
            <span>{item.label}</span>
            <span className="text-slate-400">→</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
