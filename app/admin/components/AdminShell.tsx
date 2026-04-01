"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";

type Props = {
  title: string;
  subtitle?: string;
  backHref?: string;
  children: ReactNode;
};

export default function AdminShell({ title, subtitle, backHref, children }: Props) {
  const router = useRouter();

  return (
    <div className="dash-page">
      {/* Top bar */}
      <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-100 to-sky-100 ring-1 ring-slate-200" />
            <div>
              <div className="text-[13px] font-semibold tracking-wide text-slate-500">ADMIN</div>
              <div className="text-2xl font-semibold tracking-tight text-slate-900">{title}</div>
              {subtitle ? <div className="mt-1 text-sm text-slate-600">{subtitle}</div> : null}
            </div>
          </div>

          {backHref ? (
            <button
              onClick={() => router.push(backHref)}
              className="dash-btn dash-btn-muted"
              type="button"
            >
              ← Back
            </button>
          ) : null}
        </div>
      </div>

      {/* Page container */}
      <div className="mx-auto max-w-6xl px-5 py-6">
        <div className="space-y-4">{children}</div>
      </div>
    </div>
  );
}
