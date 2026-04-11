"use client";

import React from "react";
import Link from "next/link";

type StepKey = "home" | "calendar" | "capture" | "portfolio";

type FamilyProgressRailProps = {
  current: StepKey;
};

type Step = {
  key: StepKey;
  label: string;
  hint: string;
  href: string;
};

const STEPS: Step[] = [
  {
    key: "home",
    label: "Home",
    hint: "Start with the family view",
    href: "/family",
  },
  {
    key: "calendar",
    label: "Calendar",
    hint: "Plan the week gently",
    href: "/calendar",
  },
  {
    key: "capture",
    label: "Capture",
    hint: "Record what happened",
    href: "/capture",
  },
  {
    key: "portfolio",
    label: "Portfolio",
    hint: "Build the story over time",
    href: "/portfolio",
  },
];

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export default function FamilyProgressRail({
  current,
}: FamilyProgressRailProps) {
  const currentIndex = STEPS.findIndex((step) => step.key === current);

  return (
    <aside className="hidden xl:block xl:w-[120px] xl:flex-shrink-0">
      <div className="sticky top-28">
        <div className="relative pl-2">
          <div className="mb-4 text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">
            Guided flow
          </div>

          <div className="absolute left-[21px] top-8 bottom-5 w-px bg-slate-200" />

          <div className="flex flex-col gap-5">
            {STEPS.map((step, index) => {
              const isCurrent = step.key === current;
              const isComplete = index < currentIndex;
              const isNext = index === currentIndex + 1;

              const markerClass = isCurrent
                ? "border-blue-300 bg-blue-50 text-blue-700 shadow-[0_0_0_4px_rgba(59,130,246,0.08)]"
                : isComplete
                  ? "border-slate-300 bg-slate-100 text-slate-700"
                  : isNext
                    ? "border-slate-300 bg-white text-slate-500"
                    : "border-slate-200 bg-white text-slate-400";

              const labelClass = isCurrent
                ? "text-slate-950"
                : isComplete
                  ? "text-slate-700"
                  : "text-slate-500";

              const metaText = isCurrent
                ? "You are here"
                : isNext
                  ? "Next step"
                  : isComplete
                    ? "Done"
                    : "";

              const content = (
                <>
                  <div className="relative z-10 flex items-start gap-3">
                    <div
                      className={cx(
                        "flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-black transition",
                        markerClass,
                      )}
                    >
                      {index + 1}
                    </div>

                    <div className="min-w-0 pt-0.5">
                      <div
                        className={cx(
                          "text-sm font-bold leading-none transition",
                          labelClass,
                        )}
                      >
                        {step.label}
                      </div>

                      <div className="mt-1 text-[11px] leading-4 text-slate-400">
                        {step.hint}
                      </div>

                      {metaText ? (
                        <div
                          className={cx(
                            "mt-1 text-[10px] font-black uppercase tracking-[0.18em]",
                            isCurrent
                              ? "text-blue-600"
                              : isNext
                                ? "text-slate-500"
                                : "text-slate-400",
                          )}
                        >
                          {metaText}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </>
              );

              if (isCurrent) {
                return (
                  <div key={step.key} className="select-none">
                    {content}
                  </div>
                );
              }

              return (
                <Link
                  key={step.key}
                  href={step.href}
                  className="group block rounded-2xl outline-none transition hover:translate-x-[1px] focus-visible:ring-2 focus-visible:ring-blue-200"
                >
                  {content}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}