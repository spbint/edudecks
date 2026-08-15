import type { ReactNode } from "react";

export type CoreJourneyStage = "plan" | "capture" | "portfolio" | "report";

const JOURNEY_STAGES: ReadonlyArray<{
  id: CoreJourneyStage;
  label: string;
}> = [
  { id: "plan", label: "Plan" },
  { id: "capture", label: "Capture" },
  { id: "portfolio", label: "Portfolio" },
  { id: "report", label: "Report" },
];

export default function CoreJourneyCue({ stage }: { stage: CoreJourneyStage }) {
  const currentLabel = JOURNEY_STAGES.find((item) => item.id === stage)?.label ?? "Plan";

  return (
    <div
      className="mylearna-core-journey"
      role="group"
      aria-label={`Core learning journey. Current stage: ${currentLabel}`}
    >
      <span className="mylearna-core-journey-label">Core journey</span>
      <ol className="mylearna-core-journey-list">
        {JOURNEY_STAGES.map((item) => {
          const current = item.id === stage;
          return (
            <li
              key={item.id}
              className={current ? "is-current" : undefined}
              aria-current={current ? "step" : undefined}
            >
              <span>{item.label}</span>
            </li>
          );
        })}
      </ol>
      <style>{`
        .mylearna-core-journey {
          width: 100%;
          min-width: 0;
          box-sizing: border-box;
          display: grid;
          gap: 8px;
          border: 1px solid #e7eaf2;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.94);
          padding: 12px 14px;
          box-shadow: 0 5px 16px rgba(23, 32, 75, 0.04);
        }

        .mylearna-core-journey-label {
          color: #64748b;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.08em;
          line-height: 1.2;
          text-transform: uppercase;
        }

        .mylearna-core-journey-list {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .mylearna-core-journey-list li {
          position: relative;
          min-width: 0;
          min-height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid transparent;
          border-radius: 10px;
          color: #5b6478;
          font-size: 12px;
          font-weight: 750;
          line-height: 1.2;
          text-align: center;
        }

        .mylearna-core-journey-list li:not(:last-child)::after {
          content: "›";
          position: absolute;
          right: -9px;
          color: #94a3b8;
          font-size: 18px;
          font-weight: 500;
          line-height: 1;
        }

        .mylearna-core-journey-list li.is-current {
          border-color: #c4b5fd;
          background: #f2edff;
          color: #5b21b6;
          font-weight: 850;
        }

        .mylearna-core-help-mobile {
          display: none;
        }

        .mylearna-core-help-desktop {
          color: #475569;
          line-height: 1.65;
        }

        .mylearna-core-help-desktop > :first-child,
        .mylearna-core-help-mobile-body > :first-child {
          margin-top: 0;
        }

        .mylearna-core-help-desktop > :last-child,
        .mylearna-core-help-mobile-body > :last-child {
          margin-bottom: 0;
        }

        @media (max-width: 720px) {
          .mylearna-core-journey {
            gap: 6px;
            border-radius: 14px;
            padding: 9px 10px;
          }

          .mylearna-core-journey-list {
            gap: 8px;
          }

          .mylearna-core-journey-list li {
            min-height: 34px;
            border-radius: 9px;
            font-size: clamp(10.5px, 3.25vw, 12px);
          }

          .mylearna-core-journey-list li:not(:last-child)::after {
            right: -7px;
            font-size: 15px;
          }

          .mylearna-core-help-desktop {
            display: none;
          }

          .mylearna-core-help-mobile {
            display: block;
            border-top: 1px solid #e7eaf2;
          }

          .mylearna-core-help-mobile summary {
            min-height: 44px;
            display: flex;
            align-items: center;
            width: fit-content;
            color: #4338ca;
            cursor: pointer;
            font-weight: 800;
          }

          .mylearna-core-help-mobile summary:focus-visible {
            border-radius: 8px;
            outline: 3px solid rgba(108, 77, 246, 0.35);
            outline-offset: 2px;
          }

          .mylearna-core-help-mobile-body {
            padding: 0 0 12px;
            color: #475569;
            font-size: 14px;
            line-height: 1.6;
          }
        }

        @media (min-width: 768px) {
          .mylearna-core-journey {
            grid-template-columns: minmax(100px, 0.22fr) minmax(0, 1fr);
            align-items: center;
            gap: 18px;
            padding: 14px 18px;
          }

          .mylearna-core-journey-list {
            gap: 18px;
          }

          .mylearna-core-journey-list li {
            min-height: 44px;
            font-size: 14px;
          }

          .mylearna-core-journey-list li:not(:last-child)::after {
            right: -12px;
          }
        }
      `}</style>
    </div>
  );
}

export function CoreJourneyHelp({ children }: { children: ReactNode }) {
  return (
    <div className="mylearna-core-help">
      <div className="mylearna-core-help-desktop">{children}</div>
      <details className="mylearna-core-help-mobile">
        <summary>Need help?</summary>
        <div className="mylearna-core-help-mobile-body">{children}</div>
      </details>
    </div>
  );
}
