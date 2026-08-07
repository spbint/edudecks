import type { DemoViewId } from "@/lib/demo/demoTypes";
import { demoColors } from "@/components/demo/DemoShell";

const navigationItems: Array<{ id: DemoViewId; label: string }> = [
  { id: "today", label: "Today" },
  { id: "capture", label: "Capture" },
  { id: "portfolio", label: "Portfolio" },
  { id: "report", label: "Report" },
];

export default function DemoNavigation({
  activeView,
  onNavigate,
}: {
  activeView: DemoViewId;
  onNavigate: (view: DemoViewId) => void;
}) {
  return (
    <nav aria-label="Carter demo workspace" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {navigationItems.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onNavigate(item.id)}
          aria-current={activeView === item.id ? "page" : undefined}
          style={{
            minHeight: 44,
            border: `1px solid ${activeView === item.id ? "#93c5fd" : demoColors.line}`,
            borderRadius: 12,
            background: activeView === item.id ? "#eff6ff" : "#ffffff",
            color: activeView === item.id ? demoColors.blue : demoColors.slate,
            padding: "9px 14px",
            fontSize: 14,
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
