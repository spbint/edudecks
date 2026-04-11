"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import BrandHomeLink from "@/app/components/BrandHomeLink";

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

function routeTitle(pathname: string) {
  if (
    pathname === "/family" ||
    pathname === "/calendar" ||
    pathname === "/capture" ||
    pathname === "/planner" ||
    pathname === "/portfolio" ||
    pathname === "/reports" ||
    pathname === "/profile" ||
    pathname === "/settings" ||
    pathname === "/community"
  ) {
    return "EduDecks Family";
  }

  return "EduDecks Family";
}

export default function FamilyTopNavShell({
  children,
  title,
  subtitle,
  className,
  contentClassName,
  familyName = "EduDecks Family",
  email = "seanbint@live.com",
  defaultLearner = "Ava",
  curriculum = "Australian Curriculum v9",
}: FamilyTopNavShellProps) {
  const pathname = usePathname();

  const resolvedTitle = title ?? routeTitle(pathname);
  const resolvedSubtitle = subtitle ?? routeSubtitle(pathname);

  return (
    <div className={cx("w-full", className)}>
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
              familyName={familyName}
              email={email}
              defaultLearner={defaultLearner}
              curriculum={curriculum}
            />
          </div>
        </div>
      </header>

      <div className={cx("mx-auto w-full max-w-[1440px]", contentClassName)}>
        {children}
      </div>
    </div>
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
      if (event.key === "Escape") setOpen(false);
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
        className={cx(
          "inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-2 shadow-[0_8px_20px_rgba(15,23,42,0.05)] transition hover:bg-slate-50"
        )}
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
            open && "rotate-180"
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