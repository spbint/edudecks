"use client";

import React from "react";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export const SECTION_LABEL = "text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500";
export const SECTION_TITLE = "text-[18px] font-bold tracking-tight text-slate-950";
export const CARD_TITLE = "text-[15px] font-semibold leading-[1.35] text-slate-950";
export const BODY_TEXT = "text-[14px] leading-6 text-slate-600";
export const META_TEXT = "text-[13px] leading-5 text-slate-500";
export const CTA_TEXT = "text-[14px] font-semibold";

export function CaptureSurface({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-4 rounded-[26px] border border-slate-200 bg-white px-6 py-6 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
      {children}
    </section>
  );
}

export function CaptureTextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cx(
        "h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-[14px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-300",
        props.className,
      )}
    />
  );
}

export function CaptureTextArea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>,
) {
  return (
    <textarea
      {...props}
      className={cx(
        "min-h-[120px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[14px] leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-300",
        props.className,
      )}
    />
  );
}

export function CaptureSelect(
  props: React.SelectHTMLAttributes<HTMLSelectElement>,
) {
  return (
    <select
      {...props}
      className={cx(
        "h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-[14px] text-slate-800 outline-none transition focus:border-blue-300",
        props.className,
      )}
    />
  );
}
