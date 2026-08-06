"use client";

import React from "react";
import { useMyLearnaCoach } from "./MyLearnaCoachProvider";

export default function MyLearnaCoachCard() {
  const { visibleRecommendation, openCoach, snoozeRecommendation, selectPrimaryAction, dismissRecommendation } = useMyLearnaCoach();
  if (!visibleRecommendation) return null;

  return (
    <aside className="mylearna-coach-card" aria-label="MyLearna Coach">
      <div className="mylearna-coach-card-header">
        <div className="mylearna-coach-card-label">MyLearna Coach</div>
        <button
          type="button"
          className="mylearna-coach-dismiss"
          aria-label="Dismiss MyLearna Coach"
          title="Dismiss MyLearna Coach"
          onClick={dismissRecommendation}
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
      <h2>{visibleRecommendation.title}</h2>
      <p>{visibleRecommendation.body}</p>
      <div className="mylearna-coach-card-actions">
        <button type="button" onClick={selectPrimaryAction}>
          {visibleRecommendation.primaryActionLabel}
        </button>
        <button type="button" className="mylearna-coach-secondary" onClick={() => openCoach("automatic")}>
          Why this?
        </button>
        {visibleRecommendation.canSnooze ? (
          <button type="button" className="mylearna-coach-secondary" onClick={snoozeRecommendation}>
            Not now
          </button>
        ) : null}
      </div>
      <style jsx global>{`
        .mylearna-coach-card {
          position: fixed;
          right: 24px;
          bottom: 24px;
          z-index: 48;
          width: min(360px, calc(100vw - 48px));
          display: grid;
          gap: 8px;
          padding: 16px;
          border: 1px solid #d8ccff;
          border-radius: 18px;
          background: linear-gradient(145deg, #ffffff 0%, #f7f4ff 100%);
          box-shadow: 0 16px 36px rgba(23, 32, 75, 0.14);
          color: #17204b;
        }
        .mylearna-coach-card-label {
          color: #6c4df6;
          font-size: 12px;
          font-weight: 850;
          letter-spacing: .06em;
          text-transform: uppercase;
        }
        .mylearna-coach-card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 8px;
        }
        .mylearna-coach-dismiss {
          min-width: 44px !important;
          min-height: 44px !important;
          display: grid;
          place-items: center;
          flex: 0 0 44px;
          margin: -8px -8px 0 0;
          border: 1px solid #d8ccff !important;
          border-radius: 12px !important;
          background: #ffffff !important;
          color: #17204b !important;
          padding: 0 !important;
          font-size: 24px !important;
          line-height: 1 !important;
        }
        .mylearna-coach-card h2 {
          margin: 0;
          font-size: 17px;
          line-height: 1.3;
        }
        .mylearna-coach-card p {
          margin: 0;
          color: #5b6478;
          font-size: 13px;
          line-height: 1.5;
        }
        .mylearna-coach-card-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 4px;
        }
        .mylearna-coach-card button {
          min-height: 44px;
          border: 1px solid #6c4df6;
          border-radius: 11px;
          background: #6c4df6;
          color: #ffffff;
          cursor: pointer;
          padding: 9px 12px;
          font: inherit;
          font-size: 13px;
          font-weight: 800;
        }
        .mylearna-coach-card .mylearna-coach-secondary {
          border-color: #d8ccff;
          background: #ffffff;
          color: #17204b;
        }
        .mylearna-coach-card button:focus-visible,
        .mylearna-coach-panel button:focus-visible {
          outline: 3px solid #8b72ff;
          outline-offset: 3px;
        }
        @media (max-width: 720px) {
          .mylearna-coach-card {
            right: 10px;
            bottom: calc(var(--mylearna-mobile-bottom-nav-height, 62px) + env(safe-area-inset-bottom, 0px) + 8px);
            left: 10px;
            width: auto;
          }
        }
      `}</style>
    </aside>
  );
}
