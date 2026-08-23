"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MyPlanHeader() {
  const pathname = usePathname();
  const onToday = pathname.startsWith("/my-day") || pathname.startsWith("/clean-my-day");
  const onCalendar = pathname.startsWith("/my-calendar") || pathname.startsWith("/clean-my-calendar");

  return (
    <>
      <style jsx global>{`
        .mylearna-my-plan-header { display: grid; gap: 10px; padding: 14px 16px; border: 1px solid #e7eaf2; border-radius: 16px; background: rgba(255,255,255,0.94); box-shadow: 0 6px 18px rgba(23, 32, 75, 0.04); }
        .mylearna-my-plan-tabs { display: inline-flex; gap: 4px; width: fit-content; padding: 4px; border: 1px solid #e7eaf2; border-radius: 12px; background: #f7f9fc; }
        .mylearna-my-plan-tab { min-height: 36px; display: inline-flex; align-items: center; justify-content: center; border-radius: 9px; padding: 0 16px; color: #5b6478; font-size: 13px; font-weight: 800; text-decoration: none; }
        .mylearna-my-plan-tab:hover, .mylearna-my-plan-tab:focus-visible, .mylearna-my-plan-tab[aria-current="page"] { color: #6c4df6; background: #f2edff; }
        .mylearna-my-plan-tab[aria-current="page"] { background: #ffffff; box-shadow: 0 2px 8px rgba(23, 32, 75, 0.08); }
        @media (max-width: 900px) { .mylearna-my-plan-header { display: none !important; } }
      `}</style>
      <nav className="mylearna-my-plan-header" aria-label="My Plan">
        <div style={{ color: "#17204b", fontSize: 12, fontWeight: 850, letterSpacing: "0.12em", textTransform: "uppercase" }}>My Plan</div>
        <div className="mylearna-my-plan-tabs" role="tablist" aria-label="My Plan views">
          <Link href="/my-day" className="mylearna-my-plan-tab" role="tab" aria-selected={onToday} aria-current={onToday ? "page" : undefined}>Today</Link>
          <Link href="/my-calendar" className="mylearna-my-plan-tab" role="tab" aria-selected={onCalendar} aria-current={onCalendar ? "page" : undefined}>Calendar</Link>
        </div>
      </nav>
    </>
  );
}
