export type ActivityPlayerV4Mode = "practice" | "assess";

export type ActivityPlayerV4Sample = {
  id: string;
  label: string;
  mode: ActivityPlayerV4Mode;
  source: string;
  stepLabel: string;
  title: string;
  prompt: string;
  options: string[];
  expectedAnswer: string;
  hint?: string | null;
  feedback?: string | null;
  visualDescription?: string | null;
  visualKind?: "dots" | "objects" | "numbers" | "table" | "text" | null;
  metadata?: Record<string, unknown> | null;
};

export type ActivityPlayerV4VisualMode = "compact" | "full" | "feedback" | "worksheet";

export type ActivityPlayerV4Props = {
  samples: ActivityPlayerV4Sample[];
  chrome?: "standalone" | "embedded";
  previewLabel?: string;
  showQuestionPicker?: boolean;
  onSubmitAnswer?: (input: {
    sample: ActivityPlayerV4Sample;
    selectedAnswer: string;
    correct: boolean;
    index: number;
  }) => void;
  onComplete?: () => void;
  allowNotSure?: boolean;
  onNotSure?: (input: { sample: ActivityPlayerV4Sample; index: number }) => void;
};
