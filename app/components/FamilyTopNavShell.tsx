"use client";

import Link from "next/link";
import React from "react";
import { usePathname } from "next/navigation";
import { useAuthUser } from "@/app/components/AuthUserProvider";
import BrandHomeLink from "@/app/components/BrandHomeLink";
import FamilyProfileMenu from "@/app/components/FamilyProfileMenu";
import { useFamilyWorkspace } from "@/app/components/FamilyWorkspaceProvider";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const PRIMARY_NAV = [
  { href: "/my-day", label: "My Day" },
  { href: "/my-calendar", label: "My Calendar" },
  { href: "/my-plan", label: "My Plan" },
  { href: "/my-programs", label: "My Programs" },
] as const;

const SECONDARY_NAV = [
  { href: "/curriculum", label: "My Curriculum" },
  { href: "/my-portfolio", label: "My Portfolio" },
  { href: "/my-reports", label: "My Reports" },
  { href: "/my-progress", label: "My Progress" },
] as const;

function normalizeRoute(pathname: string) {
  if (pathname === "/dashboard" || pathname === "/home" || pathname === "/my-day") return "/my-day";
  if (pathname === "/calendar" || pathname === "/my-calendar") return "/my-calendar";
  if (pathname === "/planner" || pathname === "/my-plan") return "/my-plan";
  if (pathname === "/my-programs") return "/my-programs";
  return "";
}

function OutputsDropdown() {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center rounded-full px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-950"
      >
        Outputs ▾
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white shadow-lg z-50">
          {SECONDARY_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FamilyTopNavShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuthUser();
  const { workspace, activeLearner } = useFamilyWorkspace();

  const normalizedPath = normalizeRoute(pathname);

  return (
    <div className="w-full bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-4">

          {/* LEFT SIDE */}
          <div className="flex items-center gap-6">
            <BrandHomeLink href="/home" />

            <nav className="hidden items-center gap-2 lg:flex">
              {PRIMARY_NAV.map((item) => {
                const active = normalizedPath === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cx(
                      "inline-flex items-center rounded-full px-4 py-2 text-sm font-bold transition",
                      active
                        ? "bg-slate-950 text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}

              <OutputsDropdown />
            </nav>
          </div>

          {/* RIGHT SIDE */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500 uppercase">
              In Sync
            </span>

            <FamilyProfileMenu
              familyName={workspace.profile.family_display_name || "MyLearna Family"}
              email={user?.email || ""}
              defaultLearner={activeLearner?.label || ""}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-6 py-6">
        {children}
      </main>
    </div>
  );
}