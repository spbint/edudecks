"use client";

import Link from "next/link";
import React from "react";

type Step = {
  label: string;
  href: string;
  number: number;
};

export type FamilyWorkflowStripProps = {
  current?: string;
  currentHref?: string;
  className?: string;
};

const STEPS: Step[] = [
  { number: 1, label: "Home", href: "/family" },
  { number: 2, label: "Calendar", href: "/calendar" },
  { number: 3, label: "Capture", href: "/capture" },
  { number: 4, label: "Curriculum", href: "/curriculum" },
  { number: 5, label: "Reports", href: "/reports" },
];

function isActiveStep(currentHref: string, stepHref: string) {
  if (!currentHref || !stepHref) return false;
  if (currentHref === stepHref) return true;
  return currentHref.startsWith(`${stepHref}/`);
}

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export default function FamilyWorkflowStrip({
  current,
  currentHref,
  className,
}: FamilyWorkflowStripProps) {
  const resolvedHref =
    currentHref ?? (current ? `/${current.replace(/^\//, "")}` : "");

  return (
    <div
      className={cx(
        "mx-auto w-full max-w-[1180px] px-6 pt-6",
        className,
      )}
    >
      <section className="rounded-[22px] border border-slate-200 bg-white px-5 py-5 shadow-[0_8px_28px_rgba(15,23,42,0.04)]">
        <div className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-slate-500">
          How it flows
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {STEPS.map((step, index) => {
            const active = isActiveStep(resolvedHref, step.href);

            return (
              <React.Fragment key={step.href}>
                <Link
                  href={step.href}
                  className={cx(
                    "inline-flex items-center gap-3 rounded-[18px] border px-4 py-3 transition",
                    active
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                  )}
                >
                  <span
                    className={cx(
                      "flex h-8 w-8 items-center justify-center rounded-full border text-sm font-black",
                      active
                        ? "border-blue-200 bg-white text-blue-700"
                        : "border-slate-200 bg-slate-50 text-slate-500",
                    )}
                  >
                    {step.number}
                  </span>
                  <span className="text-[15px] font-semibold">{step.label}</span>
                </Link>

                {index < STEPS.length - 1 && (
                  <span className="text-slate-400">→</span>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </section>
    </div>
  );
}
