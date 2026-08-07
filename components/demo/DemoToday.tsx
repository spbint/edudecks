import { carterFamilyDemo } from "@/lib/demo/carterFamilyDemoData";
import { demoButton, demoCard, demoColors } from "@/components/demo/DemoShell";

export default function DemoToday({ onStartCapture }: { onStartCapture: () => void }) {
  const todayBlocks = carterFamilyDemo.timetable.filter((block) => block.date === "2026-03-19");
  const emmaMath = todayBlocks.find((block) => block.learnerId === "emma" && block.subject === "Math");
  const noahBlock = todayBlocks.find((block) => block.learnerId === "noah");

  return (
    <section aria-labelledby="demo-today-title" style={{ ...demoCard, display: "grid", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div>
          <div style={{ color: demoColors.blue, fontWeight: 900, fontSize: 12, letterSpacing: "0.06em" }}>TODAY</div>
          <h1 id="demo-today-title" style={{ margin: "6px 0", fontSize: "clamp(26px, 5vw, 36px)" }}>
            Thursday, March 19
          </h1>
          <p style={{ margin: 0, color: demoColors.slate, lineHeight: 1.6 }}>
            See what the Carter family planned, then choose one real learning moment to carry forward.
          </p>
        </div>
        <button type="button" onClick={onStartCapture} style={demoButton}>
          Choose Emma’s learning moment
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
        <article style={{ border: "1px solid #bfdbfe", borderRadius: 16, padding: 16, background: "#f8fbff" }}>
          <span style={{ color: demoColors.blue, fontWeight: 900, fontSize: 12 }}>Emma Carter · Grade 3</span>
          <h2 style={{ margin: "7px 0", fontSize: 21 }}>{emmaMath?.title ?? "Fractions in everyday contexts"}</h2>
          <p style={{ margin: 0, color: demoColors.slate, lineHeight: 1.55 }}>
            Maths pathway cue: {carterFamilyDemo.learners[0].focus.Math}.
          </p>
        </article>
        <article style={{ border: `1px solid ${demoColors.line}`, borderRadius: 16, padding: 16, background: "#ffffff" }}>
          <span style={{ color: demoColors.purple, fontWeight: 900, fontSize: 12 }}>Noah Carter · Grade 6</span>
          <h2 style={{ margin: "7px 0", fontSize: 21 }}>{noahBlock?.title ?? "Equivalent ratios"}</h2>
          <p style={{ margin: 0, color: demoColors.slate, lineHeight: 1.55 }}>
            A fictional planned learning block remains available while you explore Emma’s workflow.
          </p>
        </article>
      </div>
    </section>
  );
}
