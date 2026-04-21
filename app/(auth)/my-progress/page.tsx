"use client";

import React from "react";
import Link from "next/link";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";
import { useFamilyWorkspace } from "@/app/components/FamilyWorkspaceProvider";

const cards = [
  {
    title: "Readiness",
    text: "See what already feels strong enough to build on.",
    tone: "bg-blue-50 border-blue-100 text-blue-900",
  },
  {
    title: "Coverage snapshot",
    text: "Notice where your records already show a healthy spread of evidence.",
    tone: "bg-violet-50 border-violet-100 text-violet-900",
  },
  {
    title: "Suggested improvements",
    text: "Focus on the next useful strengthening move rather than trying to do everything at once.",
    tone: "bg-emerald-50 border-emerald-100 text-emerald-900",
  },
];

export default function MyProgressPage() {
  const { activeLearner, workspace } = useFamilyWorkspace();

  return (
    <FamilyTopNavShell
      subtitle="My Progress"
      heroTitle="A clearer view of readiness, growth, and the next best move"
      heroText="Use My Progress to keep the bigger picture visible without turning the product into an analytics dashboard."
      heroAsideTitle="Progress snapshot"
      heroAsideText="This space is designed to feel supportive, not evaluative. It helps families decide what matters next."
    >
      <div className="grid gap-6 pb-14">
        <section className="grid gap-4 md:grid-cols-3">
          {cards.map((card) => (
            <article
              key={card.title}
              className={`rounded-[22px] border p-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)] ${card.tone}`}
            >
              <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">
                {card.title}
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-700">{card.text}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_360px]">
          <article className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_12px_32px_rgba(15,23,42,0.04)]">
            <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">
              Next best move
            </div>
            <h2 className="mt-3 text-[28px] font-black leading-tight text-slate-950">
              {activeLearner
                ? `Curate one new learning moment for ${activeLearner.label}.`
                : "Set your learner context, then capture one fresh learning moment."}
            </h2>
            <p className="mt-3 max-w-[720px] text-sm leading-7 text-slate-600">
              MyLearna is designed to keep progress evidence-first. A small, well-chosen next step is usually more useful than adding more complexity.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/capture"
                className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                Curate evidence
              </Link>
              <Link
                href="/my-reports"
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-50"
              >
                Build report
              </Link>
            </div>
          </article>

          <aside className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_12px_32px_rgba(15,23,42,0.04)]">
            <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">
              Current context
            </div>
            <dl className="mt-4 grid gap-4">
              <div>
                <dt className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Family</dt>
                <dd className="mt-1 text-sm font-bold text-slate-900">
                  {workspace.profile.family_display_name || "Your family"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Learner</dt>
                <dd className="mt-1 text-sm font-bold text-slate-900">
                  {activeLearner?.label || "No learner selected"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Workspace mode</dt>
                <dd className="mt-1 text-sm font-bold text-slate-900">
                  {workspace.storageMode === "database" ? "Synced family workspace" : "Local family snapshot"}
                </dd>
              </div>
            </dl>
          </aside>
        </section>
      </div>
    </FamilyTopNavShell>
  );
}
