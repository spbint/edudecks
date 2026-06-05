"use client";

import { carterFamilyDemo } from "@/lib/demo/carterFamilyDemoData";
import {
  demoButton,
  demoCard,
  demoColors,
  demoSecondaryButton,
} from "@/components/demo/DemoShell";

export default function DemoPathways({ onNext }: { onNext: () => void }) {
  return (
    <section id="demo-pathways" style={{ ...demoCard, display: "grid", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
        <div>
          <div style={{ color: demoColors.purple, fontWeight: 900, fontSize: 12 }}>
            MY PATHWAYS DEMO
          </div>
          <h2 style={{ margin: "6px 0", fontSize: 30 }}>Math pathways in progress</h2>
          <p style={{ margin: 0, color: demoColors.slate, lineHeight: 1.7 }}>
            Demo buttons are local only. They do not save data or write to an account.
          </p>
        </div>
        <button type="button" onClick={onNext} style={demoButton}>
          Capture evidence
        </button>
      </div>

      <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
        {carterFamilyDemo.pathways.map((pathway) => (
          <article
            key={pathway.learnerId}
            style={{
              border: `1px solid ${demoColors.line}`,
              borderRadius: 20,
              padding: 18,
              background: "#ffffff",
              display: "grid",
              gap: 12,
            }}
          >
            <div>
              <strong style={{ fontSize: 18 }}>
                {pathway.learnerId === "emma" ? "Emma Carter" : "Noah Carter"}
              </strong>
              <div style={{ color: demoColors.slate }}>{pathway.subject} · {pathway.pathway}</div>
            </div>
            <span
              style={{
                width: "fit-content",
                borderRadius: 999,
                padding: "7px 10px",
                background: pathway.status === "Secure" ? "#dcfce7" : "#ffedd5",
                color: pathway.status === "Secure" ? "#166534" : "#c2410c",
                fontWeight: 900,
                fontSize: 12,
              }}
            >
              Auto-check signal: {pathway.status}
            </span>
            <div style={{ color: demoColors.slate, lineHeight: 1.6 }}>
              <strong style={{ color: demoColors.navy }}>Current focus:</strong>{" "}
              {pathway.currentFocus}
            </div>
            <div>
              <strong>Secure history</strong>
              <ul style={{ margin: "8px 0 0", paddingLeft: 18, color: demoColors.slate }}>
                {pathway.secureHistory.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
            <div style={{ border: "1px solid #dbeafe", background: "#f8fbff", borderRadius: 14, padding: 12 }}>
              <strong>Current step</strong>
              <div style={{ color: demoColors.slate }}>{pathway.currentStep}</div>
            </div>
            <div>
              <strong>Later</strong>
              <ul style={{ margin: "8px 0 0", paddingLeft: 18, color: demoColors.slate }}>
                {pathway.later.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="button" style={demoButton}>Practise</button>
              <button type="button" style={demoSecondaryButton}>Assess</button>
              <button type="button" onClick={onNext} style={demoButton}>Capture evidence</button>
            </div>
            <div style={{ borderTop: `1px solid ${demoColors.line}`, paddingTop: 12 }}>
              <strong>Sample assessment</strong>
              <p style={{ color: demoColors.slate, lineHeight: 1.6 }}>{pathway.assessment.question}</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {pathway.assessment.options.map((option) => (
                  <span key={option} style={{ border: "1px solid #cbd5e1", borderRadius: 999, padding: "7px 10px" }}>{option}</span>
                ))}
              </div>
              <p style={{ color: demoColors.slate, lineHeight: 1.6 }}>
                <strong>Demo result:</strong> {pathway.assessment.summary}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
