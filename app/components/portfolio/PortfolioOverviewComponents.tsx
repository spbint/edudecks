"use client";

import Link from "next/link";
import React from "react";
import type { HomeSurfaceState } from "@/app/components/home/HomeOverviewComponents";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const SECTION_LABEL = "text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500";
const SECTION_TITLE = "text-[20px] font-black tracking-tight text-slate-950";
const CARD_TITLE = "text-[16px] font-semibold leading-[1.35] text-slate-950";
const BODY_TEXT = "text-[14px] leading-6 text-slate-600";
const META_TEXT = "text-[13px] leading-5 text-slate-500";
const CTA_TEXT = "text-[14px] font-semibold";

export type PortfolioCardItem = {
  id: string;
  title: string;
  meta: string;
  tag: string;
  type: "Evidence" | "Reflection" | "Achievement";
  eyebrow?: string;
  dateLabel?: string;
  description?: string;
  imageUrl?: string | null;
  thumbnailTone?: string;
  thumbnailLabel?: string;
  attachmentCount?: number;
  attachmentLabel?: string | null;
  attachmentNames?: string[];
  attachmentOverflowCount?: number;
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
    return "border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.99)_0%,rgba(248,250,252,0.97)_100%)]";
  }
  return "border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.99)_0%,rgba(255,250,245,0.96)_100%)]";
}

function typeTone(type: PortfolioCardItem["type"]) {
  if (type === "Reflection") return "border-violet-200 bg-violet-50/90 text-violet-700";
  if (type === "Achievement") return "border-emerald-200 bg-emerald-50/90 text-emerald-700";
  return "border-blue-200 bg-blue-50/90 text-blue-700";
}

function cardTint(item: PortfolioCardItem) {
  if (item.type === "Reflection") {
    return "bg-[linear-gradient(180deg,rgba(250,245,255,0.95)_0%,rgba(255,255,255,0.98)_100%)]";
  }
  if (item.type === "Achievement") {
    return "bg-[linear-gradient(180deg,rgba(240,253,244,0.95)_0%,rgba(255,255,255,0.98)_100%)]";
  }
  if (item.imageUrl) {
    return "bg-[linear-gradient(180deg,rgba(255,248,240,0.96)_0%,rgba(255,255,255,0.98)_100%)]";
  }
  return "bg-[linear-gradient(180deg,rgba(248,250,252,0.94)_0%,rgba(255,255,255,0.98)_100%)]";
}

function eyebrowTone(item: PortfolioCardItem) {
  if (item.imageUrl) return "border-amber-200 bg-amber-50/90 text-amber-700";
  if (item.type === "Reflection") return "border-violet-200 bg-violet-50/90 text-violet-700";
  if (item.type === "Achievement") return "border-emerald-200 bg-emerald-50/90 text-emerald-700";
  return "border-slate-200 bg-white/90 text-slate-600";
}

function attachmentTone(item: PortfolioCardItem) {
  if (item.imageUrl) return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-slate-200 bg-white text-slate-600";
}

function PortfolioThumbnail({
  item,
}: {
  item: PortfolioCardItem;
}) {
  if (item.imageUrl) {
    return (
      <div className="relative h-52 overflow-hidden rounded-[22px] bg-slate-100 shadow-[0_18px_28px_rgba(15,23,42,0.12)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.imageUrl}
          alt={item.title}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3">
          <span
            className={cx(
              "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] backdrop-blur-sm",
              eyebrowTone(item),
            )}
          >
            {item.eyebrow || "Photo evidence"}
          </span>
          <span
            className={cx(
              "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] backdrop-blur-sm",
              typeTone(item.type),
            )}
          >
            {item.type}
          </span>
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,rgba(15,23,42,0)_0%,rgba(15,23,42,0.72)_100%)] p-4">
          <div className="flex flex-wrap items-center gap-2">
            {item.dateLabel ? (
              <span className="inline-flex rounded-full border border-white/30 bg-white/16 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white">
                {item.dateLabel}
              </span>
            ) : null}
            {item.attachmentLabel ? (
              <span className="inline-flex rounded-full border border-white/30 bg-white/16 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white">
                {item.attachmentLabel}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cx(
        "relative flex h-52 flex-col justify-between overflow-hidden rounded-[22px] border border-white/70 p-4 shadow-[0_12px_24px_rgba(15,23,42,0.07)]",
        item.thumbnailTone ||
          "bg-[linear-gradient(135deg,rgba(255,247,237,0.98)_0%,rgba(254,249,195,0.74)_48%,rgba(239,246,255,0.92)_100%)]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={cx(
            "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
            eyebrowTone(item),
          )}
        >
          {item.eyebrow || "Learning moment"}
        </span>
        <span
          className={cx(
            "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
            typeTone(item.type),
          )}
        >
          {item.type}
        </span>
      </div>

      <div className="grid gap-3">
        <div className="rounded-[18px] bg-white/82 px-4 py-3 shadow-[0_10px_18px_rgba(15,23,42,0.05)] backdrop-blur-sm">
          <div className="text-[13px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            {item.dateLabel || "Saved moment"}
          </div>
          <div className="mt-2 text-[18px] font-semibold leading-tight text-slate-950">
            {item.thumbnailLabel || item.tag}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {item.attachmentLabel ? (
            <span className="inline-flex rounded-full border border-white/70 bg-white/84 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-700">
              {item.attachmentLabel}
            </span>
          ) : null}
          <span className="inline-flex rounded-full border border-white/70 bg-white/84 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-700">
            Learning area: {item.tag}
          </span>
        </div>
      </div>
      <div className="rounded-[16px] bg-white/82 px-3 py-2 shadow-[0_8px_18px_rgba(15,23,42,0.05)] backdrop-blur-sm">
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          Saved moment
        </div>
        <div className="mt-1 text-[15px] font-semibold text-slate-900">
          {item.thumbnailLabel || item.title}
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
    <section className="grid gap-5">
      <div className="flex items-end justify-between gap-4">
        <div className="grid gap-1.5">
          <div className={SECTION_LABEL}>Learning portfolio</div>
          <h2 className="text-[24px] font-black tracking-tight text-slate-950">
            Moments worth keeping
          </h2>
          <p className={`${BODY_TEXT} max-w-[620px]`}>
            Photos, reflections, work samples, and small achievements stay together here as a calm record of learning worth keeping.
          </p>
        </div>
      </div>

      {state === "loading" ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 8 }).map((_, index) => (
            <article
              key={index}
              className="grid gap-4 rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_14px_28px_rgba(15,23,42,0.05)]"
            >
              <div className="h-52 animate-pulse rounded-[22px] bg-slate-100" />
              <div className="h-4 w-32 animate-pulse rounded-full bg-slate-100" />
              <div className="h-3 w-24 animate-pulse rounded-full bg-slate-100" />
              <div className="h-14 w-full animate-pulse rounded-[18px] bg-slate-100" />
            </article>
          ))}
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <article
              key={item.id}
              className={cx(
                "grid gap-4 overflow-hidden rounded-[28px] border p-5 shadow-[0_14px_28px_rgba(15,23,42,0.05)]",
                stateTone(state),
                cardTint(item),
              )}
            >
              <PortfolioThumbnail item={item} />

              <div className="grid gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cx(
                      "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
                      eyebrowTone(item),
                    )}
                  >
                    {item.eyebrow || "Learning moment"}
                  </span>
                  {item.dateLabel ? (
                    <span className="inline-flex rounded-full border border-slate-200 bg-white/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                      {item.dateLabel}
                    </span>
                  ) : null}
                </div>

                <div className="grid gap-2">
                  <h3 className="text-[19px] font-black leading-tight text-slate-950">
                    {item.title}
                  </h3>
                  {item.description ? (
                    <p className="[display:-webkit-box] overflow-hidden text-[14px] leading-6 text-slate-600 [-webkit-box-orient:vertical] [-webkit-line-clamp:3]">
                      {item.description}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full border border-slate-200 bg-white/92 px-2.5 py-1 text-[12px] font-semibold text-slate-600">
                    Learning area: {item.tag}
                  </span>
                  <span
                    className={cx(
                      "inline-flex items-center rounded-full border px-2.5 py-1 text-[12px] font-semibold",
                      typeTone(item.type),
                    )}
                  >
                    {item.type}
                  </span>
                  {item.attachmentCount ? (
                    <span
                      className={cx(
                        "inline-flex items-center rounded-full border px-2.5 py-1 text-[12px] font-semibold",
                        attachmentTone(item),
                      )}
                    >
                      {item.attachmentLabel || `${item.attachmentCount} attachments`}
                    </span>
                  ) : null}
                </div>

                {item.attachmentNames?.length ? (
                  <div className="grid gap-2 rounded-[18px] border border-white/80 bg-white/78 px-3.5 py-3">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Evidence attached
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {item.attachmentNames.map((name) => (
                        <span
                          key={`${item.id}-${name}`}
                          className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[12px] font-medium text-slate-600"
                        >
                          {name}
                        </span>
                      ))}
                      {item.attachmentOverflowCount ? (
                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[12px] font-medium text-slate-500">
                          +{item.attachmentOverflowCount} more
                        </span>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                {!item.imageUrl && !item.attachmentCount ? (
                  <div className="rounded-[18px] border border-dashed border-slate-200 bg-white/68 px-3.5 py-3 text-[13px] leading-6 text-slate-500">
                    A saved learning moment ready to be woven into portfolio and report stories.
                  </div>
                ) : null}

                <div className={META_TEXT}>{item.meta}</div>
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
    <section className="grid gap-5 rounded-[28px] border border-dashed border-slate-200 bg-[linear-gradient(135deg,rgba(255,255,255,0.99)_0%,rgba(255,247,237,0.9)_46%,rgba(239,246,255,0.92)_100%)] px-6 py-8 shadow-[0_12px_28px_rgba(15,23,42,0.04)] md:grid-cols-[120px_minmax(0,1fr)] md:items-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[24px] border border-white/80 bg-white/88 text-[30px] text-slate-900 shadow-[0_14px_28px_rgba(15,23,42,0.06)]">
        *
      </div>
      <div className="grid gap-4 text-center md:text-left">
        <div className="grid gap-2">
          <div className={SECTION_LABEL}>Start the portfolio</div>
          <h2 className={SECTION_TITLE}>No learning moments saved yet for {learnerName}</h2>
          <p className={`max-w-[560px] ${BODY_TEXT}`}>
            Start with one photo, a short reflection, or a work sample. The portfolio will gather those moments into a calm record you can reuse in reports later.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2 md:justify-start">
          <span className="inline-flex rounded-full border border-slate-200 bg-white/86 px-3 py-1.5 text-[12px] font-semibold text-slate-600">
            Photo evidence
          </span>
          <span className="inline-flex rounded-full border border-slate-200 bg-white/86 px-3 py-1.5 text-[12px] font-semibold text-slate-600">
            Learning moment
          </span>
          <span className="inline-flex rounded-full border border-slate-200 bg-white/86 px-3 py-1.5 text-[12px] font-semibold text-slate-600">
            Included in report
          </span>
        </div>
        <div className="flex justify-center md:justify-start">
          <Link
            href="/capture"
            className={`inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 ${CTA_TEXT} text-white transition hover:bg-slate-800`}
          >
            Add evidence
          </Link>
        </div>
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
        <p className={`${BODY_TEXT} max-w-[620px]`}>
          Move easily from fresh evidence to planning, progress, and report building without leaving the family workflow behind.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="grid gap-3 rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.99)_0%,rgba(248,250,252,0.96)_100%)] p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)] transition hover:-translate-y-[1px] hover:border-slate-300 hover:bg-white"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-[16px] border border-slate-200 bg-white text-[14px] font-semibold text-slate-800 shadow-[0_8px_18px_rgba(15,23,42,0.04)]">
                {item.icon}
              </span>
              <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                {item.cta}
              </span>
            </div>
            <div className={CARD_TITLE}>{item.title}</div>
            <div className={`${META_TEXT} leading-6`}>{item.note}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}
