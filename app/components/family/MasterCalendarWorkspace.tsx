"use client";

import Link from "next/link";
import React from "react";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";

const SECTIONS = [
  {
    title: "Template rhythm",
    description: "Reusable weekly and rotation patterns that future planning can inherit.",
    items: ["Days", "Slots", "Rotations"],
  },
  {
    title: "Subjects",
    description: "The subject lanes that make calendar blocks and programs easier to scan.",
    items: ["Core", "Project", "Flexible"],
  },
  {
    title: "Term structure",
    description: "A high-level shape for terms, weeks, breaks, or flexible cycles.",
    items: ["Terms", "Weeks", "Breaks"],
  },
  {
    title: "Defaults",
    description: "The planning assumptions that should stay consistent across the family workflow.",
    items: ["Planning", "Reports", "Review"],
  },
] as const;

const LABEL = "text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500";
const H2 = "text-[18px] font-bold tracking-tight text-slate-950";
const BODY = "text-[14px] leading-6 text-slate-600";
const META = "text-[13px] leading-5 text-slate-500";

export default function MasterCalendarWorkspace() {
  return (
    <FamilyTopNavShell
      subtitle="Master Calendar"
      heroTitle="Master Calendar"
      heroText="Set the reusable structure your calendar, programs, and day build from."
      heroAsideTitle="Settings layer"
      heroAsideText="This is the reusable template layer. Active day-to-day planning stays in My Calendar and My Day."
    >
      <div className="grid gap-5 pb-14">
        <section className="grid gap-4 rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className={LABEL}>Template layer</div>
              <h1 className="mt-2 text-[28px] font-black tracking-tight text-slate-950">
                Master Calendar
              </h1>
              <p className="mt-2 max-w-[760px] text-[15px] leading-6 text-slate-600">
                Set the reusable structure your calendar, programs, and day build from.
              </p>
              <p className="mt-2 max-w-[760px] text-[13px] font-semibold leading-5 text-slate-500">
                Visual settings surface only. No saved template logic or active day-to-day planning is wired here.
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

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <main className="grid gap-4">
            <section className="grid gap-4 md:grid-cols-2">
              {SECTIONS.map((section) => (
                <article
                  key={section.title}
                  className="grid gap-4 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)]"
                >
                  <div>
                    <div className={LABEL}>Template section</div>
                    <h2 className={`mt-2 ${H2}`}>{section.title}</h2>
                    <p className={`mt-2 ${BODY}`}>{section.description}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {section.items.map((item) => (
                      <span
                        key={item}
                        className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[12px] font-semibold text-slate-700"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </section>

            <section className="rounded-[22px] border border-dashed border-slate-200 bg-white px-5 py-5 text-[13px] font-semibold text-slate-500">
              Stub only. No scheduling engine, saved template handler, drag/drop, or active planning logic is wired here.
            </section>
          </main>

          <aside className="grid gap-4 xl:sticky xl:top-4 xl:self-start">
            <section className="grid gap-3 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
              <div className={LABEL}>Where this fits</div>
              <h2 className={H2}>Reusable setup layer</h2>
              <p className={BODY}>
                Master Calendar sits above My Calendar, My Programs, My Day, and Outputs.
              </p>
              <div className="grid gap-2">
                {["Master Calendar", "My Calendar", "My Programs", "My Day", "Outputs"].map((item) => (
                  <div
                    key={item}
                    className="rounded-[16px] border border-slate-200 bg-slate-50 px-3 py-2.5 text-[13px] font-semibold text-slate-700"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </section>

            <section className="grid gap-3 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
              <div className={LABEL}>Next planning surface</div>
              <h2 className={H2}>Move to My Calendar</h2>
              <p className={BODY}>
                Use My Calendar to shape the active weekly rhythm after the reusable structure is understood.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/my-calendar"
                  className="inline-flex w-fit items-center justify-center rounded-full bg-slate-950 px-4 py-2 text-[14px] font-semibold text-white transition hover:bg-slate-800"
                >
                  Open My Calendar
                </Link>
              </div>
            </section>

            <section className="grid gap-3 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
              <div className={LABEL}>Status</div>
              <h2 className={H2}>Visual template stub</h2>
              <p className={META}>
                No backend writes, database saves, or working settings controls are active on this page.
              </p>
              <span className="inline-flex w-fit rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-amber-700">
                Not connected
              </span>
            </section>
          </aside>
        </div>
      </div>
    </FamilyTopNavShell>
  );
}
