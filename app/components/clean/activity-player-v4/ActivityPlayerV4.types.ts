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
};

export type ActivityPlayerV4VisualMode = "compact" | "full" | "feedback" | "worksheet";

export type ActivityPlayerV4Props = {
  samples: ActivityPlayerV4Sample[];
};
