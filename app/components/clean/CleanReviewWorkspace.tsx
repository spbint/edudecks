"use client";

import React, { useMemo, useState } from "react";
import { V2Card, V2PageHeader, v2Tokens } from "@/app/components/clean/design-v2/MyLearnaAppShellV2";
import CleanReviewPlayer from "@/app/components/clean/review/CleanReviewPlayer";
import {
  MATHS_REVIEW_BANKS,
  MATHS_REVIEW_GROUPS,
  type MathsReviewBank,
  type MathsReviewBankGroup,
} from "@/lib/clean/review/mathsReviewBanks";
import {
  generateMathsReview,
  getReadyMathsReviewBanks,
  type MathsReviewOrder,
  type MathsReviewQuestion,
} from "@/lib/clean/review/mathsReviewGenerator";

type ReviewMode = {
  id: "quick" | "daily" | "deep" | "custom";
  title: string;
  questionCount: number;
  description: string;
};

const reviewModes: ReviewMode[] = [
  { id: "quick", title: "Quick Review", questionCount: 5, description: "5 questions" },
  { id: "daily", title: "Daily Review", questionCount: 10, description: "10 questions" },
  { id: "deep", title: "Deep Review", questionCount: 20, description: "20 questions" },
  { id: "custom", title: "Custom Review", questionCount: 12, description: "Choose the count" },
];

const defaultSelected = [
  "one-after",
  "one-before",
  "ten-after",
  "ten-before",
  "odd-even",
  "double",
  "addition",
  "subtraction",
];

const sectionIntroStyle: React.CSSProperties = {
  margin: 0,
  color: v2Tokens.slate,
  lineHeight: 1.55,
  fontSize: 14,
};

const labelStyle: React.CSSProperties = {
  display: "grid",
  gap: 6,
  color: v2Tokens.navy,
  fontSize: 13,
  fontWeight: 700,
};

const inputStyle: React.CSSProperties = {
  minHeight: 42,
  borderRadius: 12,
  border: `1px solid ${v2Tokens.border}`,
  padding: "8px 11px",
  color: v2Tokens.navy,
  background: "#FFFFFF",
  fontSize: 15,
};

const primaryButtonStyle: React.CSSProperties = {
  minHeight: 44,
  border: 0,
  borderRadius: 999,
  background: v2Tokens.purple,
  color: "#FFFFFF",
  fontWeight: 800,
  padding: "10px 16px",
  cursor: "pointer",
  boxShadow: "0 10px 20px rgba(108,77,246,0.18)",
};

const secondaryButtonStyle: React.CSSProperties = {
  minHeight: 42,
  borderRadius: 999,
  border: `1px solid ${v2Tokens.border}`,
  background: "#FFFFFF",
  color: v2Tokens.navy,
  fontWeight: 750,
  padding: "9px 14px",
  cursor: "pointer",
};

function BankPill({
  bank,
  selected,
  onToggle,
}: {
  bank: MathsReviewBank;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      style={{
        minHeight: 44,
        textAlign: "left",
        borderRadius: 14,
        border: `1px solid ${selected ? v2Tokens.purple : v2Tokens.border}`,
        background: selected ? v2Tokens.lavender : "#FFFFFF",
        color: v2Tokens.navy,
        padding: "10px 12px",
        display: "grid",
        gap: 4,
        cursor: "pointer",
        boxShadow: selected ? "0 8px 18px rgba(108,77,246,0.08)" : "none",
      }}
    >
      <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span style={{ fontWeight: 750, fontSize: 13 }}>{bank.label}</span>
        <span
          style={{
            flex: "0 0 auto",
            borderRadius: 999,
            padding: "2px 7px",
            color: v2Tokens.green,
            background: v2Tokens.mint,
            fontSize: 11,
            fontWeight: 800,
          }}
        >
          v1
        </span>
      </span>
      {bank.stageHint ? <span style={{ color: v2Tokens.slate, fontSize: 12 }}>{bank.stageHint}</span> : null}
    </button>
  );
}

function SelectedPanel({
  selectedBanks,
  readyCount,
  onRemove,
}: {
  selectedBanks: MathsReviewBank[];
  readyCount: number;
  onRemove: (bankId: string) => void;
}) {
  return (
    <V2Card style={{ display: "grid", gap: 12 }}>
      <div>
        <h2 style={{ margin: 0, color: v2Tokens.navy, fontSize: 18 }}>Selected for review</h2>
        <p style={sectionIntroStyle}>
          {selectedBanks.length
            ? `${readyCount} focus ${readyCount === 1 ? "area" : "areas"} will generate practice questions.`
            : "Choose at least one focus area."}
        </p>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {selectedBanks.length ? (
          selectedBanks.map((bank) => (
            <button
              key={bank.id}
              type="button"
              onClick={() => onRemove(bank.id)}
              style={{
                border: `1px solid ${bank.status === "ready" ? v2Tokens.border : "#D8DEE8"}`,
                borderRadius: 999,
                background: "#FFFFFF",
                color: v2Tokens.navy,
                padding: "7px 10px",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {bank.label} x
            </button>
          ))
        ) : (
          <span style={{ color: v2Tokens.slate, fontSize: 14 }}>Nothing selected yet.</span>
        )}
      </div>
    </V2Card>
  );
}

export default function CleanReviewWorkspace() {
  const groupedBanks = useMemo(
    () =>
      MATHS_REVIEW_GROUPS.map((group) => ({
        group,
        banks: MATHS_REVIEW_BANKS.filter((bank) => bank.group === group),
      })),
    [],
  );
  const bankById = useMemo(() => new Map(MATHS_REVIEW_BANKS.map((bank) => [bank.id, bank])), []);
  const [selectedMode, setSelectedMode] = useState<ReviewMode["id"]>("quick");
  const [selectedBankIds, setSelectedBankIds] = useState<string[]>(defaultSelected);
  const [openGroups, setOpenGroups] = useState<Record<MathsReviewBankGroup, boolean>>(() =>
    Object.fromEntries(MATHS_REVIEW_GROUPS.map((group) => [group, group === "Number" || group === "Counting"])) as Record<
      MathsReviewBankGroup,
      boolean
    >,
  );
  const [questionsPerFocusArea, setQuestionsPerFocusArea] = useState(1);
  const [lowestNumber, setLowestNumber] = useState(0);
  const [highestNumber, setHighestNumber] = useState(100);
  const [order, setOrder] = useState<MathsReviewOrder>("random");
  const [questionCount, setQuestionCount] = useState(5);
  const [questions, setQuestions] = useState<MathsReviewQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);

  const selectedBanks = selectedBankIds
    .map((bankId) => bankById.get(bankId))
    .filter((bank): bank is MathsReviewBank => Boolean(bank));
  const readySelectedBanks = getReadyMathsReviewBanks(selectedBankIds);

  function updateMode(mode: ReviewMode) {
    setSelectedMode(mode.id);
    if (mode.id !== "custom") {
      setQuestionCount(mode.questionCount);
    }
  }

  function toggleBank(bank: MathsReviewBank) {
    setSelectedBankIds((current) =>
      current.includes(bank.id) ? current.filter((bankId) => bankId !== bank.id) : [...current, bank.id],
    );
  }

  function startReview() {
    const generated = generateMathsReview({
      selectedBankIds,
      questionsPerFocusArea,
      lowestNumber,
      highestNumber,
      order,
      questionCount,
    });
    if (!generated.length) {
      setError("Choose at least one mathematics focus area before starting.");
      return;
    }
    setError(null);
    setQuestions(generated);
  }

  function resetBuilder() {
    setSelectedMode("quick");
    setSelectedBankIds(defaultSelected);
    setQuestionsPerFocusArea(1);
    setLowestNumber(0);
    setHighestNumber(100);
    setOrder("random");
    setQuestionCount(5);
    setError(null);
  }

  function backToBuilder() {
    setQuestions([]);
  }

  return (
    <div style={{ display: "grid", gap: 18 }}>
      {questions.length ? (
        <CleanReviewPlayer
          key={`${questions[0]?.id ?? "review"}-${questions.length}`}
          questions={questions}
          onExit={backToBuilder}
          onReviewAgain={startReview}
        />
      ) : null}

      <V2PageHeader
        eyebrow="Retrieval practice"
        title="My Review"
        subtitle="Choose skills to keep fresh, work together, and reteach straight away."
      />

      <V2Card style={{ background: v2Tokens.mint, borderColor: "#BDEFD4", boxShadow: "none" }}>
        <p style={{ ...sectionIntroStyle, color: "#176B45", fontWeight: 750 }}>
          Review results are for practice only and are not used as assessments.
        </p>
      </V2Card>

      <V2Card style={{ display: "grid", gap: 14 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <button type="button" style={{ ...primaryButtonStyle, boxShadow: "none" }}>
            Mathematics
          </button>
          <button
            type="button"
            disabled
            style={{
              ...secondaryButtonStyle,
              color: v2Tokens.slate,
              background: "#F8FAFC",
              cursor: "not-allowed",
            }}
          >
            English coming soon
          </button>
        </div>
      </V2Card>

      <div className="mylearna-review-layout">
        <div style={{ display: "grid", gap: 18, alignContent: "start" }}>
          <V2Card style={{ display: "grid", gap: 14 }}>
            <div>
              <h2 style={{ margin: 0, color: v2Tokens.navy, fontSize: 19, fontWeight: 750 }}>Review mode</h2>
              <p style={sectionIntroStyle}>Choose a preset or use Custom Review for a specific question count.</p>
            </div>
            <div className="mylearna-review-mode-grid">
              {reviewModes.map((mode) => {
                const active = selectedMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => updateMode(mode)}
                    style={{
                      borderRadius: 16,
                      border: `1px solid ${active ? v2Tokens.purple : v2Tokens.border}`,
                      background: active ? v2Tokens.lavender : "#FFFFFF",
                      color: v2Tokens.navy,
                      padding: 14,
                      textAlign: "left",
                      cursor: "pointer",
                      display: "grid",
                      gap: 6,
                    }}
                  >
                    <span style={{ fontSize: 16, fontWeight: 750 }}>{mode.title}</span>
                    <span style={{ color: v2Tokens.slate, fontSize: 13 }}>{mode.description}</span>
                  </button>
                );
              })}
            </div>
          </V2Card>

          <V2Card style={{ display: "grid", gap: 14 }}>
            <div>
              <h2 style={{ margin: 0, color: v2Tokens.navy, fontSize: 19, fontWeight: 750 }}>Focus areas</h2>
              <p style={sectionIntroStyle}>Every focus area is available for parent-led daily practice.</p>
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              {groupedBanks.map(({ group, banks }) => {
                const open = openGroups[group];
                const readyCount = banks.length;
                return (
                  <section
                    key={group}
                    style={{
                      border: `1px solid ${v2Tokens.border}`,
                      borderRadius: 18,
                      background: "#FFFFFF",
                      overflow: "hidden",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenGroups((current) => ({ ...current, [group]: !current[group] }))}
                      style={{
                        width: "100%",
                        border: 0,
                        background: open ? "#FAFBFF" : "#FFFFFF",
                        color: v2Tokens.navy,
                        padding: "14px 16px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        cursor: "pointer",
                      }}
                    >
                      <span style={{ fontSize: 15, fontWeight: 850 }}>{group}</span>
                      <span style={{ color: v2Tokens.slate, fontSize: 12, fontWeight: 750 }}>
                        {readyCount} skills {open ? "up" : "down"}
                      </span>
                    </button>
                    {open ? (
                      <div className="mylearna-review-bank-grid" style={{ padding: 14, borderTop: `1px solid ${v2Tokens.border}` }}>
                        {banks.map((bank) => (
                          <BankPill
                            key={bank.id}
                            bank={bank}
                            selected={selectedBankIds.includes(bank.id)}
                            onToggle={() => toggleBank(bank)}
                          />
                        ))}
                      </div>
                    ) : null}
                  </section>
                );
              })}
            </div>
          </V2Card>
        </div>

        <aside style={{ display: "grid", gap: 18, alignContent: "start" }}>
          <V2Card style={{ display: "grid", gap: 14 }}>
            <div>
              <h2 style={{ margin: 0, color: v2Tokens.navy, fontSize: 20 }}>Settings</h2>
              <p style={sectionIntroStyle}>Tune the number range and order for this review.</p>
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              <label style={labelStyle}>
                Questions per focus area
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={questionsPerFocusArea}
                  onChange={(event) => setQuestionsPerFocusArea(Number(event.target.value))}
                  style={inputStyle}
                />
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <label style={labelStyle}>
                  Lowest number
                  <input
                    type="number"
                    value={lowestNumber}
                    onChange={(event) => setLowestNumber(Number(event.target.value))}
                    style={inputStyle}
                  />
                </label>
                <label style={labelStyle}>
                  Highest number
                  <input
                    type="number"
                    value={highestNumber}
                    onChange={(event) => setHighestNumber(Number(event.target.value))}
                    style={inputStyle}
                  />
                </label>
              </div>
              <label style={labelStyle}>
                Order
                <select value={order} onChange={(event) => setOrder(event.target.value as MathsReviewOrder)} style={inputStyle}>
                  <option value="sequential">Sequential</option>
                  <option value="random">Random</option>
                </select>
              </label>
              <label style={labelStyle}>
                Question count
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={questionCount}
                  onChange={(event) => {
                    setSelectedMode("custom");
                    setQuestionCount(Number(event.target.value));
                  }}
                  style={inputStyle}
                />
              </label>
            </div>
            {error ? (
              <div style={{ borderRadius: 14, background: v2Tokens.softRed, color: "#9F2440", padding: 12, fontWeight: 750 }}>
                {error}
              </div>
            ) : null}
            <div style={{ display: "grid", gap: 10 }}>
              <button
                type="button"
                onClick={startReview}
                disabled={!readySelectedBanks.length}
                style={{
                  ...primaryButtonStyle,
                  opacity: readySelectedBanks.length ? 1 : 0.55,
                  cursor: readySelectedBanks.length ? "pointer" : "not-allowed",
                }}
              >
                Start Review
              </button>
              <button type="button" onClick={resetBuilder} style={secondaryButtonStyle}>
                Reset selections
              </button>
            </div>
          </V2Card>

          <SelectedPanel
            selectedBanks={selectedBanks}
            readyCount={readySelectedBanks.length}
            onRemove={(bankId) => setSelectedBankIds((current) => current.filter((selectedId) => selectedId !== bankId))}
          />

          <V2Card style={{ display: "grid", gap: 8, background: "#FBFCFF" }}>
            <h2 style={{ margin: 0, color: v2Tokens.navy, fontSize: 16 }}>Saving</h2>
            <p style={sectionIntroStyle}>
              Review sessions run locally in Maths Review v1. TODO: persist sessions once the review session table and RLS policy are introduced.
            </p>
          </V2Card>
        </aside>
      </div>

      <style jsx global>{`
        .mylearna-review-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(280px, 360px);
          gap: 18px;
          align-items: start;
        }

        .mylearna-review-mode-grid,
        .mylearna-review-bank-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        @media (max-width: 980px) {
          .mylearna-review-layout {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 680px) {
          .mylearna-review-mode-grid,
          .mylearna-review-bank-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
