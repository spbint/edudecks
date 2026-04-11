"use client";

import Link from "next/link";
import React from "react";

type StepState = "complete" | "active" | "upcoming";

type ProgressStep = {
  number: number;
  label: string;
  href: string;
  helper?: string;
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
    helper: "Start with the family view",
  },
  {
    number: 2,
    label: "Calendar",
    href: "/calendar",
    helper: "Plan this week gently",
  },
  {
    number: 3,
    label: "Capture",
    href: "/capture",
    helper: "Record what happened",
  },
  {
    number: 4,
    label: "Portfolio",
    href: "/portfolio",
    helper: "Build the story over time",
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
      className={cx(
        "hidden xl:block xl:w-[240px] xl:shrink-0",
        className,
      )}
      aria-label="Workflow progress"
    >
      <div className="sticky top-6 rounded-[24px] border border-slate-200 bg-white px-5 py-6 shadow-[0_10px_34px_rgba(15,23,42,0.05)]">
        <div className="mb-5 text-xs font-black uppercase tracking-[0.24em] text-slate-500">
          Guided steps
        </div>

        <div className="relative">
          <div className="absolute left-[18px] top-2 bottom-2 w-px bg-slate-200" />

          <div className="flex flex-col gap-5">
            {STEPS.map((step) => {
              const state = getStepState(step.number, current);

              return (
                <div key={step.href} className="relative">
                  <Link
                    href={step.href}
                    className="group flex items-start gap-4 rounded-[18px] p-2 transition hover:bg-slate-50"
                  >
                    <div
                      className={cx(
                        "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-black",
                        state === "complete" &&
                          "border-slate-200 bg-slate-100 text-slate-700",
                        state === "active" &&
                          "border-blue-200 bg-blue-50 text-blue-700",
                        state === "upcoming" &&
                          "border-slate-200 bg-white text-slate-400",
                      )}
                    >
                      {step.number}
                    </div>

                    <div className="min-w-0 pt-1">
                      <div
                        className={cx(
                          "text-[15px] font-bold",
                          state === "active" && "text-slate-950",
                          state === "complete" && "text-slate-700",
                          state === "upcoming" && "text-slate-500",
                        )}
                      >
                        {step.label}
                      </div>

                      <div
                        className={cx(
                          "mt-1 text-xs leading-5",
                          state === "active" && "text-slate-600",
                          state === "complete" && "text-slate-500",
                          state === "upcoming" && "text-slate-400",
                        )}
                      >
                        {step.helper}
                      </div>

                      {state === "active" && (
                        <div className="mt-2 inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">
                          You are here
                        </div>
                      )}

                      {state === "upcoming" && step.number === ORDER[current] + 1 && (
                        <div className="mt-2 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-600">
                          Next step
                        </div>
                      )}
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}