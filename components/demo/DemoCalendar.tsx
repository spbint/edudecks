"use client";

import { useMemo, useState } from "react";
import {
  carterFamilyDemo,
  type DemoLearnerId,
  type DemoWeekId,
} from "@/lib/demo/carterFamilyDemoData";
import {
  demoButton,
  demoCard,
  demoColors,
  demoSecondaryButton,
} from "@/components/demo/DemoShell";

const weekLabels: Array<[DemoWeekId, string]> = [
  ["week-1", "Week 1"],
  ["week-2", "Week 2"],
  ["week-3", "Week 3"],
  ["week-4", "Week 4"],
];

const learnerLabels: Array<["all" | DemoLearnerId, string]> = [
  ["all", "All"],
  ["emma", "Emma"],
  ["noah", "Noah"],
];

export default function DemoCalendar({ onNext }: { onNext: () => void }) {
  const [weekId, setWeekId] = useState<DemoWeekId>("week-3");
  const [learnerFilter, setLearnerFilter] = useState<"all" | DemoLearnerId>("all");
  const blocks = useMemo(
    () =>
      carterFamilyDemo.timetable.filter(
        (block) =>
          block.weekId === weekId &&
          (learnerFilter === "all" || block.learnerId === learnerFilter),
      ),
    [learnerFilter, weekId],
  );
  const grouped = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => ({
    day,
    blocks: blocks.filter((block) => block.day === day),
  }));

  return (
    <section id="demo-calendar" style={{ ...demoCard, display: "grid", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
        <div>
          <div style={{ color: demoColors.blue, fontWeight: 900, fontSize: 12 }}>
            MY CALENDAR DEMO
          </div>
          <h2 style={{ margin: "6px 0", fontSize: 30 }}>Four-week March 2026 plan</h2>
          <p style={{ margin: 0, color: demoColors.slate, lineHeight: 1.7 }}>
            A public, demo-only calendar view showing the Carter family&apos;s March learning rhythm.
          </p>
        </div>
        <button type="button" onClick={onNext} style={demoButton}>
          Open today
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {weekLabels.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setWeekId(id)}
            style={id === weekId ? demoButton : demoSecondaryButton}
          >
            {label}
          </button>
        ))}
        {learnerLabels.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setLearnerFilter(id)}
            style={{
              ...(id === learnerFilter ? demoButton : demoSecondaryButton),
              borderColor: id === learnerFilter ? demoColors.green : "#cbd5e1",
              background: id === learnerFilter ? demoColors.green : "#ffffff",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
        }}
      >
        {grouped.map((group) => (
          <article
            key={group.day}
            style={{
              border: `1px solid ${demoColors.line}`,
              borderRadius: 18,
              background: "#fbfdff",
              padding: 14,
              display: "grid",
              gap: 10,
            }}
          >
            <strong>{group.day}</strong>
            {group.blocks.map((block) => (
              <div
                key={block.id}
                style={{
                  borderLeft: `4px solid ${
                    block.learnerId === "emma" ? demoColors.purple : demoColors.blue
                  }`,
                  padding: "8px 0 8px 10px",
                  display: "grid",
                  gap: 3,
                }}
              >
                <span style={{ color: demoColors.slate, fontSize: 12, fontWeight: 800 }}>
                  {block.time} · {block.learnerId === "emma" ? "Emma" : "Noah"} · {block.subject}
                </span>
                <strong style={{ fontSize: 14 }}>{block.title}</strong>
                <span style={{ color: demoColors.slate, fontSize: 13 }}>{block.note}</span>
              </div>
            ))}
          </article>
        ))}
      </div>
    </section>
  );
}
