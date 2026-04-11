"use client";

import Link from "next/link";
import React from "react";

type StepState = "complete" | "active" | "upcoming";

type ProgressStep = {
  number: number;
  label: string;
  href: string;
};

export type FamilyProgressRailProps = {
  current: "home" | "calendar" | "capture" | "portfolio";
  className?: string;
};

const STEPS: ProgressStep[] = [
  {
    number: 1,
    label: "Home",
    href: "/family",
  },
  {
    number: 2,
    label: "Calendar",
    href: "/calendar",
  },
  {
    number: 3,
    label: "Capture",
    href: "/capture",
  },
  {
    number: 4,
    label: "Portfolio",
    href: "/portfolio",
  },
];

const ORDER: Record<FamilyProgressRailProps["current"], number> = {
  home: 1,
  calendar: 2,
  capture: 3,
  portfolio: 4,
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function getStepState(
  stepNumber: number,
  current: FamilyProgressRailProps["current"],
): StepState {
  const currentNumber = ORDER[current];
  if (stepNumber < currentNumber) return "complete";
  if (stepNumber === currentNumber) return "active";
  return "upcoming";
}

export default function FamilyProgressRail({
  current,
  className,
}: FamilyProgressRailProps) {
  return (
    <aside
      className={cx("hidden xl:block xl:w-[72px] xl:shrink-0", className)}
      aria-label="Workflow progress"
    >
      <div className="sticky top-6 flex justify-center">
        <div className="relative flex flex-col items-center py-3">
          <div className="absolute top-5 bottom-5 w-px bg-slate-200" />

          {STEPS.map((step, index) => {
            const state = getStepState(step.number, current);
            const isNext = step.number === ORDER[current] + 1;

            return (
              <Link
                key={step.href}
                href={step.href}
                className="relative z-10 mb-7 flex flex-col items-center gap-2 text-center no-underline last:mb-0"
              >
                <div
                  className={cx(
                    "flex h-10 w-10 items-center justify-center rounded-full border text-sm font-black transition",
                    state === "complete" &&
                      "border-slate-200 bg-slate-100 text-slate-700",
                    state === "active" &&
                      "border-blue-200 bg-blue-50 text-blue-700 shadow-[0_6px_18px_rgba(59,130,246,0.12)]",
                    state === "upcoming" &&
                      "border-slate-200 bg-white text-slate-400",
                  )}
                >
                  {step.number}
                </div>

                <div
                  className={cx(
                    "text-[11px] font-bold tracking-tight",
                    state === "active" && "text-slate-950",
                    state === "complete" && "text-slate-600",
                    state === "upcoming" && "text-slate-400",
                  )}
                >
                  {step.label}
                </div>

                {state === "active" && (
                  <div className="rounded-full bg-blue-50 px-2 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-blue-700">
                    Here
                  </div>
                )}

                {isNext && state === "upcoming" && (
                  <div className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-slate-600">
                    Next
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </aside>
  );
}