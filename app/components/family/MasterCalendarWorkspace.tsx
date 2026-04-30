"use client";

import Link from "next/link";
import React from "react";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";

const SECTIONS = [
  {
    title: "Template rhythm",
    items: ["Days", "Slots", "Rotations"],
  },
  {
    title: "Subjects",
    items: ["Core", "Project", "Flexible"],
  },
  {
    title: "Term structure",
    items: ["Terms", "Weeks", "Breaks"],
  },
  {
    title: "Defaults",
    items: ["Planning", "Reports", "Review"],
  },
] as const;

export default function MasterCalendarWorkspace() {
  return (
    <FamilyTopNavShell
      subtitle="Master Calendar"
      heroTitle="Master Calendar"
      heroText="Set the reusable structure your month, week, programs, and day build from."
      heroAsideTitle="Settings layer"
      heroAsideText="This is a profile/settings surface, separate from daily planning."
    >
      <div className="grid gap-5 pb-14">
        <section className="grid gap-4 rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Template settings
              </div>
              <h1 className="mt-2 text-[28px] font-black tracking-tight text-slate-950">
                Master Calendar
              </h1>
              <p className="mt-2 max-w-[720px] text-[15px] leading-6 text-slate-600">
                Set the reusable structure your month, week, programs, and day build from.
              </p>
            </div>
            <Link
              href="/settings"
              className="inline-flex w-fit items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-[14px] font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Back to Settings
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {SECTIONS.map((section) => (
            <article
              key={section.title}
              className="grid gap-4 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)]"
            >
              <div>
                <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Section
                </div>
                <h2 className="mt-2 text-[18px] font-bold tracking-tight text-slate-950">
                  {section.title}
                </h2>
              </div>
              <div className="grid gap-2">
                {section.items.map((item) => (
                  <div
                    key={item}
                    className="rounded-[16px] border border-slate-200 bg-slate-50 px-3 py-3 text-[13px] font-semibold text-slate-700"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </article>
          ))}
        </section>

        <section className="rounded-[22px] border border-dashed border-slate-200 bg-white px-5 py-5 text-[13px] font-semibold text-slate-500">
          Stub only. No scheduling engine or saved template logic is active here.
        </section>
      </div>
    </FamilyTopNavShell>
  );
}
