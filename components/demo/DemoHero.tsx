"use client";

import Link from "next/link";
import { carterFamilyDemo } from "@/lib/demo/carterFamilyDemoData";
import {
  demoButton,
  demoCard,
  demoColors,
  demoSecondaryButton,
} from "@/components/demo/DemoShell";

export default function DemoHero({ onStart }: { onStart: () => void }) {
  return (
    <section
      id="demo-family"
      style={{
        ...demoCard,
        display: "grid",
        gap: 22,
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        alignItems: "center",
      }}
    >
      <div style={{ display: "grid", gap: 14 }}>
        <span
          style={{
            color: demoColors.blue,
            fontWeight: 900,
            fontSize: 12,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          Public demo
        </span>
        <h1 style={{ margin: 0, fontSize: "clamp(34px, 7vw, 60px)", lineHeight: 1 }}>
          See how MyLearna works
        </h1>
        <p style={{ margin: 0, color: demoColors.slate, lineHeight: 1.7, fontSize: 17 }}>
          Explore a fictional U.S. homeschool family and follow the journey from
          planning, to evidence, to portfolio, to reports and sample outputs.
        </p>
        <p style={{ margin: 0, color: demoColors.slate, lineHeight: 1.65, fontSize: 15 }}>
          Explore a fictional homeschool month and see how MyLearna connects
          planning, evidence, portfolios and reports.
        </p>
        <p
          style={{
            margin: 0,
            border: "1px solid #bfdbfe",
            background: "#eff6ff",
            color: "#1e40af",
            borderRadius: 14,
            padding: 12,
            lineHeight: 1.55,
            fontWeight: 700,
          }}
        >
          This is a fictional demo family using sample data. No account is required.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="button" onClick={onStart} style={demoButton}>
            Start the demo
          </button>
          <Link href="/beta?source=demo" style={demoSecondaryButton}>
            Join the beta
          </Link>
        </div>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        <div style={{ ...demoCard, boxShadow: "none", background: "#f8fbff" }}>
          <strong>{carterFamilyDemo.family.name}</strong>
          <p style={{ margin: "8px 0 0", color: demoColors.slate, lineHeight: 1.6 }}>
            Parent: {carterFamilyDemo.family.parent}
            <br />
            Location: {carterFamilyDemo.family.location}
          </p>
        </div>
        {carterFamilyDemo.learners.map((learner) => (
          <div key={learner.id} style={{ ...demoCard, boxShadow: "none", padding: 18 }}>
            <strong>
              {learner.name}, age {learner.age}
            </strong>
            <div style={{ color: demoColors.blue, fontWeight: 800 }}>{learner.grade}</div>
            <ul style={{ margin: "10px 0 0", paddingLeft: 18, color: demoColors.slate }}>
              {Object.entries(learner.focus).map(([subject, focus]) => (
                <li key={subject}>
                  <strong>{subject}:</strong> {focus}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
