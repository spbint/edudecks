import type { ParentProgressStatus } from "@/lib/clean/pathways/parentProgress";

export type PathwayNextAction =
  | "check-understanding"
  | "practise"
  | "next-step"
  | "worksheet"
  | "capture-evidence";

export type PathwayNextActionAvailability = Record<PathwayNextAction, boolean>;

export type PathwayNextActionPlan = {
  primary: PathwayNextAction | null;
  secondary: PathwayNextAction[];
  supportingText: string | null;
};

function firstAvailable(
  availability: PathwayNextActionAvailability,
  candidates: PathwayNextAction[],
) {
  return candidates.find((candidate) => availability[candidate]) || null;
}

function supportingText(action: PathwayNextAction | null) {
  switch (action) {
    case "check-understanding":
      return "See how this skill is going.";
    case "practise":
      return "A little more practice may help before checking again.";
    case "next-step":
      return "This step is ready to review or build on.";
    case "worksheet":
      return "Use the available worksheet to work on this step.";
    case "capture-evidence":
      return "Record learning that has already happened.";
    default:
      return null;
  }
}

/**
 * Chooses a display-only next action from existing pathway signals and links.
 * It deliberately performs no progress, evidence, or navigation mutation.
 */
export function resolvePathwayNextAction(input: {
  autoCheckStatus: ParentProgressStatus | null;
  parentProgress: ParentProgressStatus;
  availability: PathwayNextActionAvailability;
}): PathwayNextActionPlan {
  const currentStatus = input.autoCheckStatus || input.parentProgress;
  let primary: PathwayNextAction | null;

  switch (currentStatus) {
    case "Secure":
      primary = firstAvailable(input.availability, [
        "next-step",
        "practise",
        "check-understanding",
        "worksheet",
        "capture-evidence",
      ]);
      break;
    case "Needs support":
    case "Developing":
      primary = firstAvailable(input.availability, [
        "practise",
        "check-understanding",
        "worksheet",
        "capture-evidence",
      ]);
      break;
    case "Consolidating":
      primary = firstAvailable(input.availability, [
        "check-understanding",
        "practise",
        "worksheet",
        "capture-evidence",
      ]);
      break;
    case "Not checked yet":
    default:
      primary = firstAvailable(input.availability, [
        "check-understanding",
        "practise",
        "worksheet",
        "capture-evidence",
      ]);
      break;
  }

  return {
    primary,
    secondary: (
      ["practise", "check-understanding", "next-step", "worksheet", "capture-evidence"] as const
    ).filter((action) => action !== primary && input.availability[action]),
    supportingText: supportingText(primary),
  };
}
