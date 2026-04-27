"use client";

import Link from "next/link";
import React from "react";
import type { HomeSurfaceState } from "@/app/components/home/HomeOverviewComponents";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const SECTION_LABEL = "text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500";
const SECTION_TITLE = "text-[18px] font-bold tracking-tight text-slate-950";
const CARD_TITLE = "text-[15px] font-semibold leading-[1.35] text-slate-950";
const BODY_TEXT = "text-[14px] leading-6 text-slate-600";
const META_TEXT = "text-[13px] leading-5 text-slate-500";
const CTA_TEXT = "text-[14px] font-semibold";

export type PortfolioCardItem = {
  id: string;
  title: string;
  meta: string;
  tag: string;
  type: "Evidence" | "Reflection" | "Achievement";
  imageUrl?: string | null;
  thumbnailTone?: string;
  thumbnailLabel?: string;
};

export type PortfolioActionItem = {
  href: string;
  icon: string;
  title: string;
  note: string;
  cta: string;
};

function stateTone(state: HomeSurfaceState) {
  if (state === "empty") return "border-dashed border-slate-200 bg-slate-50/80";
  if (state === "placeholder") {
    return "border-slate-200 bg-[linear-gradient(135deg,rgba(255,255,255,1)_0%,rgba(248,250,252,0.96)_100%)]";
  }
  return "border-slate-200 bg-white";
}

function typeTone(type: PortfolioCardItem["type"]) {
  if (type === "Reflection") return "border-violet-200 bg-violet-50 text-violet-700";
  if (type === "Achievement") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  return "border-blue-200 bg-blue-50 text-blue-700";
}

function PortfolioThumbnail({
  item,
}: {
  item: PortfolioCardItem;
}) {
  if (item.imageUrl) {
    return (
      <div className="relative h-40 overflow-hidden rounded-[18px] bg-slate-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.imageUrl}
          alt={item.title}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={cx(
        "relative flex h-40 items-end overflow-hidden rounded-[18px] border border-white/60 p-4",
        item.thumbnailTone ||
          "bg-[linear-gradient(135deg,rgba(219,234,254,0.96)_0%,rgba(233,213,255,0.88)_52%,rgba(220,252,231,0.9)_100%)]",
      )}
    >
      <div className="absolute right-3 top-3 rounded-full border border-white/70 bg-white/70 px-2.5 py-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-600">
        {item.type}
      </div>
      <div className="rounded-[16px] bg-white/80 px-3 py-2 shadow-[0_8px_18px_rgba(15,23,42,0.05)] backdrop-blur-sm">
        <div className="text-[15px] font-semibold text-slate-900">
          {item.thumbnailLabel || item.tag}
        </div>
      </div>
    </div>
  );
}

export function PortfolioGrid({
  items,
  state,
}: {
  items: PortfolioCardItem[];
  state: HomeSurfaceState;
}) {
  return (
    <section className="grid gap-4">
      <div className="flex items-end justify-between gap-4">
        <div className="grid gap-1.5">
          <div className={SECTION_LABEL}>Portfolio grid</div>
          <h2 className={SECTION_TITLE}>Learning moments</h2>
        </div>
      </div>

      {state === "loading" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <article
              key={index}
              className="grid gap-3 rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]"
            >
              <div className="h-40 animate-pulse rounded-[18px] bg-slate-100" />
              <div className="h-4 w-32 animate-pulse rounded-full bg-slate-100" />
              <div className="h-3 w-24 animate-pulse rounded-full bg-slate-100" />
              <div className="h-8 w-20 animate-pulse rounded-full bg-slate-100" />
            </article>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {items.map((item) => (
            <article
              key={item.id}
              className={cx(
                "grid gap-3 rounded-[24px] border p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]",
                stateTone(state),
              )}
            >
              <PortfolioThumbnail item={item} />

              <div className="grid gap-2">
                <div className="flex items-start justify-between gap-3">
                  <h3 className={CARD_TITLE}>{item.title}</h3>
                  <span
                    className={cx(
                      "inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-[12px] font-semibold uppercase tracking-[0.14em]",
                      typeTone(item.type),
                    )}
                  >
                    {item.type}
                  </span>
                </div>
                <div className={META_TEXT}>{item.meta}</div>
                <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[13px] font-medium text-slate-600">
                  {item.tag}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export function PortfolioEmptyState({
  learnerName,
}: {
  learnerName: string;
}) {
  return (
    <section className="grid gap-4 rounded-[26px] border border-dashed border-slate-200 bg-[linear-gradient(135deg,rgba(255,255,255,0.98)_0%,rgba(248,250,252,0.96)_50%,rgba(239,246,255,0.92)_100%)] px-6 py-8 text-center shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] bg-amber-50 text-[24px] shadow-[0_10px_22px_rgba(245,158,11,0.08)]">
        *
      </div>
      <div className="grid gap-2">
        <h2 className={SECTION_TITLE}>Start capturing learning moments to build {learnerName}&rsquo;s portfolio.</h2>
        <p className={`mx-auto max-w-[460px] ${BODY_TEXT}`}>
          This is where your learning story will grow over time.
        </p>
      </div>
      <div className="flex justify-center">
        <Link
          href="/capture"
          className={`inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 ${CTA_TEXT} text-white transition hover:bg-slate-800`}
        >
          Capture Evidence
        </Link>
      </div>
    </section>
  );
}

export function PortfolioActionsRow({
  items,
}: {
  items: PortfolioActionItem[];
}) {
  return (
    <section className="grid gap-4">
      <div className="grid gap-1.5">
        <div className={SECTION_LABEL}>Portfolio actions</div>
        <h2 className={SECTION_TITLE}>Keep the story moving</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="grid gap-3 rounded-[22px] border border-slate-200 bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)] transition hover:bg-slate-50"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-[16px] bg-slate-100 text-[14px] font-semibold text-slate-800">
                {item.icon}
              </span>
              <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                {item.cta}
              </span>
            </div>
            <div className={CARD_TITLE}>{item.title}</div>
            <div className={META_TEXT}>{item.note}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}
