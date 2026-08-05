"use client";

import React from "react";
import { useMyLearnaCoach } from "./MyLearnaCoachProvider";

export default function MyLearnaCoachPanel() {
  const { recommendation, state, closeCoach, snoozeRecommendation, selectPrimaryAction } = useMyLearnaCoach();

  return (
    <div className="mylearna-coach-panel-backdrop" role="presentation">
      <section className="mylearna-coach-panel" role="dialog" aria-modal="false" aria-labelledby="mylearna-coach-panel-title">
        <div className="mylearna-coach-panel-header">
          <div>
            <div className="mylearna-coach-card-label">MyLearna Coach</div>
            <h2 id="mylearna-coach-panel-title">What would be most useful next?</h2>
          </div>
          <button type="button" className="mylearna-coach-close" aria-label="Close MyLearna Coach" onClick={closeCoach}>
            ×
          </button>
        </div>
        {recommendation ? (
          <div className="mylearna-coach-panel-content">
            <div className="mylearna-coach-panel-step">One clear next action</div>
            <h3>{recommendation.title}</h3>
            <p>{recommendation.body}</p>
            <p className="mylearna-coach-reason">Why this? {recommendation.reason}</p>
            <div className="mylearna-coach-card-actions">
              <button type="button" onClick={selectPrimaryAction}>{recommendation.primaryActionLabel}</button>
              {recommendation.canSnooze ? (
                <button type="button" className="mylearna-coach-secondary" onClick={snoozeRecommendation}>Not now</button>
              ) : null}
            </div>
          </div>
        ) : (
          <p className="mylearna-coach-empty">Your workspace is still getting ready. You can continue using the page while Coach checks again.</p>
        )}
        <p className="mylearna-coach-panel-note">
          Coach uses your authorised family workspace. It does not make recommendations from private text or photos.
          {state.hasMultipleLearners ? " Choose the learner you are supporting before learner-specific actions." : ""}
        </p>
      </section>
      <style jsx global>{`
        .mylearna-coach-panel-backdrop {
          position: fixed;
          inset: 0;
          z-index: 75;
          display: grid;
          place-items: center;
          padding: 24px;
          background: rgba(15, 23, 42, .22);
        }
        .mylearna-coach-panel {
          width: min(520px, 100%);
          max-height: min(650px, calc(100dvh - 48px));
          overflow: auto;
          display: grid;
          gap: 18px;
          padding: 22px;
          border: 1px solid #d8ccff;
          border-radius: 22px;
          background: #ffffff;
          color: #17204b;
          box-shadow: 0 24px 64px rgba(23, 32, 75, .22);
        }
        .mylearna-coach-panel-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
        }
        .mylearna-coach-panel h2,
        .mylearna-coach-panel h3 {
          margin: 0;
          line-height: 1.3;
        }
        .mylearna-coach-panel h2 { font-size: 22px; }
        .mylearna-coach-panel h3 { font-size: 20px; }
        .mylearna-coach-panel-content { display: grid; gap: 10px; }
        .mylearna-coach-panel p { margin: 0; color: #5b6478; line-height: 1.6; }
        .mylearna-coach-panel-step { color: #6c4df6; font-size: 12px; font-weight: 850; text-transform: uppercase; letter-spacing: .06em; }
        .mylearna-coach-reason { font-size: 13px; }
        .mylearna-coach-panel-note { border-top: 1px solid #e7eaf2; padding-top: 14px; font-size: 12px; }
        .mylearna-coach-close {
          min-width: 44px;
          min-height: 44px;
          border: 1px solid #e7eaf2;
          border-radius: 12px;
          background: #ffffff;
          color: #17204b;
          cursor: pointer;
          font-size: 24px;
          line-height: 1;
        }
        .mylearna-coach-panel .mylearna-coach-card-actions { display: flex; flex-wrap: wrap; gap: 8px; }
        .mylearna-coach-panel .mylearna-coach-card-actions button { min-height: 48px; border: 1px solid #6c4df6; border-radius: 12px; background: #6c4df6; color: #ffffff; cursor: pointer; padding: 11px 16px; font: inherit; font-weight: 800; }
        .mylearna-coach-panel .mylearna-coach-card-actions .mylearna-coach-secondary { border-color: #d8ccff; background: #ffffff; color: #17204b; }
        @media (max-width: 720px) {
          .mylearna-coach-panel-backdrop { align-items: end; padding: 0; }
          .mylearna-coach-panel { width: 100%; max-height: calc(100dvh - 24px); border-radius: 22px 22px 0 0; padding: 18px 14px calc(18px + var(--mylearna-mobile-bottom-nav-height, 62px) + env(safe-area-inset-bottom, 0px)); }
        }
      `}</style>
    </div>
  );
}
