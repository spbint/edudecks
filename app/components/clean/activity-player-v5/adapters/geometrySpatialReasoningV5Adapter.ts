import type { ActivityV5, ActivityV5ResponseState } from "@/app/components/clean/activity-player-v5/types";
import type { NumberAssessmentBankItem } from "@/lib/clean/assessments/numberAssessmentBanks";
import type { NumberPracticeTask } from "@/lib/clean/practice/numberPowersRootsPracticeModules";

type SourceActivity = {
  id: string;
  title: string;
  prompt: string;
  expectedAnswer?: string;
  workedSolution?: string;
  supportPrompt?: string;
};

type AdapterMode = ActivityV5["mode"];

const TARGET_STEP_PATTERN = /geometry-spatial-reasoning-step-(4|6|7)-/;

function getStepNumber(id: string) {
  const match = id.match(/geometry-spatial-reasoning-step-(\d+)-/);
  return match ? Number(match[1]) : null;
}

function getItemIndex(id: string) {
  const match = id.match(/-(?:practice|assess)-(\d+)$/);
  return match ? Number(match[1]) - 1 : 0;
}

function isTargetGeometryActivity(activity: SourceActivity) {
  return TARGET_STEP_PATTERN.test(activity.id);
}

function feedbackFor(activity: SourceActivity) {
  const expected = activity.expectedAnswer ? ` Expected answer: ${activity.expectedAnswer}.` : "";
  return {
    correct: "Correct. Your model matches the spatial task.",
    incorrect:
      activity.workedSolution ||
      `Check the visual model again and compare your answer with the worksheet task.${expected}`,
    hint: activity.supportPrompt,
  };
}

function baseActivity(activity: SourceActivity, mode: AdapterMode, step: number): Pick<ActivityV5, "id" | "strand" | "step" | "mode" | "prompt" | "instruction" | "feedback" | "supportHint" | "worksheetReference" | "metadata"> {
  return {
    id: activity.id,
    strand: "Geometry and Spatial Reasoning",
    step: `Step ${step}`,
    mode,
    prompt: activity.title || activity.prompt,
    instruction: activity.prompt,
    feedback: feedbackFor(activity),
    supportHint: activity.supportPrompt,
    worksheetReference: `GSR Step ${step} worksheet activity`,
    metadata: {
      expectedAnswer: activity.expectedAnswer ?? null,
      source: "geometry-spatial-reasoning-live-adapter",
    },
  };
}

function step4Activity(activity: SourceActivity, mode: AdapterMode, index: number): ActivityV5 {
  const base = baseActivity(activity, mode, 4);
  const variant = index % 6;

  if (variant === 1 || variant === 4) {
    return {
      ...base,
      prompt: activity.title || "Copy the arrangement",
      instruction: "Drag each object to copy the worksheet-style arrangement.",
      interactionType: "drag_to_place",
      visualModel: "shape_board",
      objects: [
        { id: "house", label: "House", type: "square", draggable: true },
        { id: "tree", label: "Tree", type: "triangle", draggable: true },
      ],
      targets: [
        { id: "left", label: "left position", accepts: ["square"] },
        { id: "right", label: "right position", accepts: ["triangle"] },
      ],
      correctState: { placements: { house: "left", tree: "right" } },
    };
  }

  if (variant === 2 || variant === 5) {
    return {
      ...base,
      prompt: activity.title || "Select the matching route evidence",
      instruction: "Click the route clue that matches the shown start, moves, and finish.",
      interactionType: "click_objects",
      visualModel: "route_grid",
      objects: [
        { id: "start", label: "Start at A1", type: "circle", selectable: true },
        { id: "moves", label: "Move right, right, up", type: "rectangle", selectable: true },
        { id: "finish", label: "Finish at C2", type: "star", selectable: true },
        { id: "wrong-finish", label: "Finish at B4", type: "triangle", selectable: true },
      ],
      targets: [],
      correctState: { selectedObjectIds: ["start", "moves", "finish"] },
    };
  }

  return {
    ...base,
    prompt: activity.title || "Follow the route",
    instruction: "Start at A1. Follow the route right, right, up, then tap the finish square.",
    interactionType: "move_along_route",
    visualModel: "route_grid",
    objects: [],
    targets: [],
    correctState: { finalPosition: "C2" },
  };
}

function step6Activity(activity: SourceActivity, mode: AdapterMode, index: number): ActivityV5 {
  const base = baseActivity(activity, mode, 6);
  const variant = index % 4;

  if (variant === 0) {
    return {
      ...base,
      prompt: activity.title || "Plot the coordinates",
      instruction: "Plot A1, A2, A3, and A4 on the coordinate grid.",
      interactionType: "plot_coordinates",
      visualModel: "coordinate_grid",
      objects: [],
      targets: [],
      correctState: { plottedCoordinates: ["A1", "A2", "A3", "A4"] },
    };
  }

  if (variant === 1) {
    return {
      ...base,
      prompt: activity.title || "Place the shape",
      instruction: "Place the circle at B2 and the square at C3.",
      interactionType: "drag_to_place",
      visualModel: "coordinate_grid",
      objects: [
        { id: "circle", label: "Circle", type: "circle", draggable: true },
        { id: "square", label: "Square", type: "square", draggable: true },
      ],
      targets: [
        { id: "B2", label: "B2", accepts: ["circle"] },
        { id: "C3", label: "C3", accepts: ["square"] },
      ],
      correctState: { placements: { circle: "B2", square: "C3" } },
    };
  }

  if (variant === 2) {
    return {
      ...base,
      prompt: activity.title || "Complete the reflection",
      instruction: "Use the mirror line to complete the reflected shape.",
      interactionType: "flip_reflection",
      visualModel: "reflection_grid",
      objects: [],
      targets: [],
      correctState: { reflectedCells: ["3-1", "3-2", "3-3"] },
    };
  }

  return {
    ...base,
    prompt: activity.title || "Turn the shape",
    instruction: "Rotate the shape a quarter turn clockwise.",
    interactionType: "rotate_shape",
    visualModel: "turn_board",
    objects: [],
    targets: [],
    correctState: { orientation: 90 },
  };
}

function step7Activity(activity: SourceActivity, mode: AdapterMode, index: number): ActivityV5 {
  const base = baseActivity(activity, mode, 7);
  const variant = index % 3;

  if (variant === 0) {
    const orientation = index % 6 === 0 ? 90 : index % 6 === 3 ? 180 : 270;
    return {
      ...base,
      prompt: activity.title || "Show the turn",
      instruction:
        orientation === 90
          ? "Rotate the arrow a quarter turn clockwise."
          : orientation === 180
            ? "Rotate the arrow a half turn."
            : "Rotate the arrow a quarter turn anticlockwise.",
      interactionType: "rotate_shape",
      visualModel: "turn_board",
      objects: [],
      targets: [],
      correctState: { orientation },
    };
  }

  if (variant === 1) {
    return {
      ...base,
      prompt: activity.title || "Follow the robot route",
      instruction: "Start at A1. Move up, right, right, then tap the robot's finish square.",
      interactionType: "move_along_route",
      visualModel: "route_grid",
      objects: [],
      targets: [],
      correctState: { finalPosition: "C2" },
    };
  }

  return {
    ...base,
    prompt: activity.title || "Select the angle",
    instruction: "Click the card that shows a right angle.",
    interactionType: "click_objects",
    visualModel: "shape_board",
    objects: [
      { id: "acute", label: "Acute angle", type: "triangle", selectable: true },
      { id: "right", label: "Right angle", type: "square", selectable: true },
      { id: "obtuse", label: "Obtuse angle", type: "rectangle", selectable: true },
      { id: "straight", label: "Straight line", type: "line", selectable: true },
    ],
    targets: [],
    correctState: { selectedObjectIds: ["right"] },
  };
}

function toActivityV5(activity: SourceActivity, mode: AdapterMode): ActivityV5 | null {
  if (!isTargetGeometryActivity(activity)) return null;

  const step = getStepNumber(activity.id);
  const index = getItemIndex(activity.id);

  if (step === 4) return step4Activity(activity, mode, index);
  if (step === 6) return step6Activity(activity, mode, index);
  if (step === 7) return step7Activity(activity, mode, index);

  return null;
}

export function geometrySpatialReasoningPracticeTasksToActivityPlayerV5Activities(
  tasks: NumberPracticeTask[],
) {
  return tasks
    .map((task) => toActivityV5(task, "practise"))
    .filter((activity): activity is ActivityV5 => Boolean(activity));
}

export function geometrySpatialReasoningAssessmentItemsToActivityPlayerV5Activities(
  items: NumberAssessmentBankItem[],
) {
  return items
    .map((item) => toActivityV5(item, "assess"))
    .filter((activity): activity is ActivityV5 => Boolean(activity));
}

export function formatActivityPlayerV5Response(response: ActivityV5ResponseState) {
  const parts = [
    response.finalPosition ? `finish:${response.finalPosition}` : "",
    response.orientation !== undefined ? `orientation:${response.orientation}` : "",
    response.selectedObjectIds?.length ? `selected:${response.selectedObjectIds.join(",")}` : "",
    response.plottedCoordinates?.length ? `plotted:${response.plottedCoordinates.join(",")}` : "",
    response.reflectedCells?.length ? `reflection:${response.reflectedCells.join(",")}` : "",
    response.placements ? `placements:${Object.entries(response.placements).map(([key, value]) => `${key}->${value}`).join(",")}` : "",
  ].filter(Boolean);

  return parts.length ? parts.join("; ") : JSON.stringify(response);
}
