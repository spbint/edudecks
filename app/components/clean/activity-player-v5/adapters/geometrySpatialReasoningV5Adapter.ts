import type {
  ActivityV5,
  ActivityV5CorrectState,
  ActivityV5InteractionType,
  ActivityV5Object,
  ActivityV5ResponseState,
  ActivityV5Target,
  ActivityV5VisualModel,
} from "@/app/components/clean/activity-player-v5/types";
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

type QuestionVisualSpec = {
  worksheetSection: string;
  visualRequired: string;
  instruction: string;
  interactionType: ActivityV5InteractionType;
  visualModel: ActivityV5VisualModel;
  objects: ActivityV5Object[];
  targets: ActivityV5Target[];
  correctState: ActivityV5CorrectState;
};

const TARGET_STEP_PATTERN = /geometry-spatial-reasoning-step-(4|6|7)-/;

const STEP_4_SPECS: QuestionVisualSpec[] = [
  {
    worksheetSection: "Follow the Route",
    visualRequired: "A route grid showing the start and a path that moves up 2, then right 1.",
    instruction: "Follow the highlighted route: up two squares, then right one. Tap the finish square.",
    interactionType: "move_along_route",
    visualModel: "route_grid",
    objects: [{ id: "start", label: "Start", type: "star", value: "A3" }],
    targets: [],
    correctState: { finalPosition: "B1", routePath: ["A3", "A2", "A1", "B1"] },
  },
  {
    worksheetSection: "Treasure Map",
    visualRequired: "A simple treasure grid with A as the start and treasure three squares to the right.",
    instruction: "Start at A. Count three squares to the right and tap the treasure square.",
    interactionType: "move_along_route",
    visualModel: "route_grid",
    objects: [
      { id: "start-a", label: "A", type: "star", value: "A2" },
      { id: "treasure", label: "Treasure", type: "circle", value: "D2" },
    ],
    targets: [],
    correctState: { finalPosition: "D2", routePath: ["A2", "B2", "C2", "D2"] },
  },
  {
    worksheetSection: "Object Arrangement",
    visualRequired: "A sphere and cube arrangement board with above and below targets.",
    instruction: "Place the sphere above the cube to match the worksheet arrangement.",
    interactionType: "drag_to_place",
    visualModel: "shape_board",
    objects: [
      { id: "sphere", label: "Sphere", type: "sphere", draggable: true },
      { id: "cube", label: "Cube", type: "cube", draggable: true },
    ],
    targets: [
      { id: "above", label: "above position", accepts: ["sphere"] },
      { id: "below", label: "below position", accepts: ["cube"] },
    ],
    correctState: { placements: { sphere: "above", cube: "below" } },
  },
  {
    worksheetSection: "Create a Route",
    visualRequired: "A simple map with a start square and a house two squares above it.",
    instruction: "The house is two squares above the start. Tap the house location.",
    interactionType: "move_along_route",
    visualModel: "route_grid",
    objects: [
      { id: "start", label: "Start", type: "star", value: "B4" },
      { id: "house", label: "House", type: "house", value: "B2" },
    ],
    targets: [],
    correctState: { finalPosition: "B2", routePath: ["B4", "B3", "B2"] },
  },
  {
    worksheetSection: "Obstacle Route",
    visualRequired: "A route grid with a pond obstacle and the safe path around it.",
    instruction: "Avoid the pond. Tap the safe finish after moving right, right, then up.",
    interactionType: "move_along_route",
    visualModel: "route_grid",
    objects: [
      { id: "start", label: "Start", type: "star", value: "A3" },
      { id: "pond", label: "Pond", type: "pond", value: "B2" },
    ],
    targets: [],
    correctState: { finalPosition: "C2", routePath: ["A3", "B3", "C3", "C2"] },
  },
  {
    worksheetSection: "Position Plan",
    visualRequired: "A room plan showing a wall and bed placement choices.",
    instruction: "Place the bed next to the wall.",
    interactionType: "drag_to_place",
    visualModel: "shape_board",
    objects: [
      { id: "bed", label: "Bed", type: "bed", draggable: true },
      { id: "wall", label: "Wall", type: "wall" },
    ],
    targets: [
      { id: "beside-wall", label: "beside the wall", accepts: ["bed"] },
      { id: "middle", label: "middle of room", accepts: ["bed"] },
    ],
    correctState: { placements: { bed: "beside-wall" } },
  },
  {
    worksheetSection: "Reverse Route",
    visualRequired: "A route grid showing a move two squares right from start.",
    instruction: "The first path went right two squares. Tap the square that returns to the start.",
    interactionType: "move_along_route",
    visualModel: "route_grid",
    objects: [
      { id: "start", label: "Start", type: "star", value: "A2" },
      { id: "after-right", label: "After R2", type: "circle", value: "C2" },
    ],
    targets: [],
    correctState: { finalPosition: "A2", routePath: ["C2", "B2", "A2"] },
  },
  {
    worksheetSection: "Describe Path",
    visualRequired: "A path card with a tree at the turning point and the route turning left after it.",
    instruction: "Click the path parts that show: go to the tree, then turn left.",
    interactionType: "click_objects",
    visualModel: "route_grid",
    objects: [
      { id: "go-tree", label: "Go to tree", type: "tree", selectable: true },
      { id: "turn-left-after", label: "Turn left after tree", type: "arrow-left", selectable: true },
      { id: "turn-before", label: "Turn before tree", type: "arrow-right", selectable: true },
      { id: "loop", label: "Go around twice", type: "circle", selectable: true },
    ],
    targets: [],
    correctState: { selectedObjectIds: ["go-tree", "turn-left-after"] },
  },
  {
    worksheetSection: "Build Arrangement",
    visualRequired: "Three block targets arranged in one straight row.",
    instruction: "Place the three blocks into one straight row.",
    interactionType: "drag_to_place",
    visualModel: "shape_board",
    objects: [
      { id: "block-1", label: "Block 1", type: "block", draggable: true },
      { id: "block-2", label: "Block 2", type: "block", draggable: true },
      { id: "block-3", label: "Block 3", type: "block", draggable: true },
    ],
    targets: [
      { id: "row-1", label: "row spot 1", accepts: ["block"] },
      { id: "row-2", label: "row spot 2", accepts: ["block"] },
      { id: "row-3", label: "row spot 3", accepts: ["block"] },
    ],
    correctState: { placements: { "block-1": "row-1", "block-2": "row-2", "block-3": "row-3" } },
  },
  {
    worksheetSection: "Map Symbols",
    visualRequired: "A map key card showing a star symbol marking the library location.",
    instruction: "Click the map symbol card that tells where the library is.",
    interactionType: "click_objects",
    visualModel: "shape_board",
    objects: [
      { id: "library-star", label: "Star = library", type: "star", selectable: true },
      { id: "distance", label: "Distance only", type: "line", selectable: true },
      { id: "shape-name", label: "Shape name only", type: "triangle", selectable: true },
    ],
    targets: [],
    correctState: { selectedObjectIds: ["library-star"] },
  },
  {
    worksheetSection: "Route Length",
    visualRequired: "Three route cards showing paths of 4, 6, and 8 grid steps.",
    instruction: "Click the shortest route card.",
    interactionType: "click_objects",
    visualModel: "route_grid",
    objects: [
      { id: "route-4", label: "4 step route", type: "line", selectable: true },
      { id: "route-6", label: "6 step route", type: "line", selectable: true },
      { id: "route-8", label: "8 step route", type: "line", selectable: true },
    ],
    targets: [],
    correctState: { selectedObjectIds: ["route-4"] },
  },
  {
    worksheetSection: "Explain Arrangement",
    visualRequired: "A square, triangle, and circle in order, with the triangle between the other two shapes.",
    instruction: "Click the shape that is between the square and the circle.",
    interactionType: "click_objects",
    visualModel: "shape_board",
    objects: [
      { id: "square", label: "Square", type: "square", selectable: true },
      { id: "triangle", label: "Triangle", type: "triangle", selectable: true },
      { id: "circle", label: "Circle", type: "circle", selectable: true },
    ],
    targets: [],
    correctState: { selectedObjectIds: ["triangle"] },
  },
];

const STEP_6_SPECS: QuestionVisualSpec[] = [
  {
    worksheetSection: "Find the Location",
    visualRequired: "Object location grid with dog at A1, car at B2, house at C3, and star at D4.",
    instruction: "Find the dog on the grid and tap its coordinate.",
    interactionType: "plot_coordinates",
    visualModel: "coordinate_grid",
    objects: [
      { id: "dog", label: "Dog", type: "circle", value: "A1" },
      { id: "car", label: "Car", type: "rectangle", value: "B2" },
      { id: "house", label: "House", type: "house", value: "C3" },
      { id: "star", label: "Star", type: "star", value: "D4" },
    ],
    targets: [],
    correctState: { plottedCoordinates: ["A1"] },
  },
  {
    worksheetSection: "Find the Location",
    visualRequired: "Object location grid with the house visible at C3.",
    instruction: "Find the house on the grid and tap its coordinate.",
    interactionType: "plot_coordinates",
    visualModel: "coordinate_grid",
    objects: [
      { id: "dog", label: "Dog", type: "circle", value: "A1" },
      { id: "car", label: "Car", type: "rectangle", value: "B2" },
      { id: "house", label: "House", type: "house", value: "C3" },
      { id: "star", label: "Star", type: "star", value: "D4" },
    ],
    targets: [],
    correctState: { plottedCoordinates: ["C3"] },
  },
  {
    worksheetSection: "Place the Object",
    visualRequired: "Coordinate placement board with the square target at C3.",
    instruction: "Drag the square to C3.",
    interactionType: "drag_to_place",
    visualModel: "coordinate_grid",
    objects: [{ id: "square", label: "Square", type: "square", draggable: true }],
    targets: [{ id: "C3", label: "C3", accepts: ["square"] }],
    correctState: { placements: { square: "C3" } },
  },
  {
    worksheetSection: "Place the Object",
    visualRequired: "Coordinate placement board with the star target at A4.",
    instruction: "Drag the star to A4.",
    interactionType: "drag_to_place",
    visualModel: "coordinate_grid",
    objects: [{ id: "star", label: "Star", type: "star", draggable: true }],
    targets: [{ id: "A4", label: "A4", accepts: ["star"] }],
    correctState: { placements: { star: "A4" } },
  },
  {
    worksheetSection: "Follow the Coordinates",
    visualRequired: "Coordinate grid for plotting A1, A2, A3 and A4 as a vertical line.",
    instruction: "Plot A1, A2, A3, and A4.",
    interactionType: "plot_coordinates",
    visualModel: "coordinate_grid",
    objects: [],
    targets: [],
    correctState: { plottedCoordinates: ["A1", "A2", "A3", "A4"] },
  },
  {
    worksheetSection: "Follow the Coordinates",
    visualRequired: "Coordinate grid for plotting B1, C1 and D1 as a horizontal line.",
    instruction: "Plot B1, C1, and D1.",
    interactionType: "plot_coordinates",
    visualModel: "coordinate_grid",
    objects: [],
    targets: [],
    correctState: { plottedCoordinates: ["B1", "C1", "D1"] },
  },
  {
    worksheetSection: "Slide the Shape",
    visualRequired: "A square on a grid before and after sliding two spaces right.",
    instruction: "Slide the square two spaces right by tapping the new square position.",
    interactionType: "move_along_route",
    visualModel: "coordinate_grid",
    objects: [{ id: "square-start", label: "Start square", type: "square", value: "A2" }],
    targets: [],
    correctState: { finalPosition: "C2", routePath: ["A2", "B2", "C2"] },
  },
  {
    worksheetSection: "Slide the Shape",
    visualRequired: "A triangle on a grid before and after sliding one space up.",
    instruction: "Slide the triangle one space up by tapping the new triangle position.",
    interactionType: "move_along_route",
    visualModel: "coordinate_grid",
    objects: [{ id: "triangle-start", label: "Start triangle", type: "triangle", value: "B3" }],
    targets: [],
    correctState: { finalPosition: "B2", routePath: ["B3", "B2"] },
  },
  {
    worksheetSection: "Flip the Shape",
    visualRequired: "A square reflection grid with a vertical mirror line.",
    instruction: "Complete the square reflection across the mirror line.",
    interactionType: "flip_reflection",
    visualModel: "reflection_grid",
    objects: [
      { id: "square-left-1", label: "Square half", type: "square", value: "1-1" },
      { id: "square-left-2", label: "Square half", type: "square", value: "1-2" },
    ],
    targets: [],
    correctState: { reflectedCells: ["3-1", "3-2"] },
  },
  {
    worksheetSection: "Flip the Shape",
    visualRequired: "A heart reflection grid with one half shown and the mirror line visible.",
    instruction: "Complete the matching heart half across the line of symmetry.",
    interactionType: "flip_reflection",
    visualModel: "reflection_grid",
    objects: [
      { id: "heart-left-1", label: "Heart half", type: "circle", value: "1-1" },
      { id: "heart-left-2", label: "Heart half", type: "circle", value: "1-2" },
      { id: "heart-left-3", label: "Heart point", type: "triangle", value: "1-3" },
    ],
    targets: [],
    correctState: { reflectedCells: ["3-1", "3-2", "3-3"] },
  },
  {
    worksheetSection: "Turn the Shape",
    visualRequired: "Turn board with an arrow showing a quarter turn clockwise.",
    instruction: "Rotate the arrow a quarter turn clockwise.",
    interactionType: "rotate_shape",
    visualModel: "turn_board",
    objects: [{ id: "arrow", label: "Arrow", type: "arrow-up" }],
    targets: [],
    correctState: { orientation: 90 },
  },
  {
    worksheetSection: "Create Your Own Grid Picture",
    visualRequired: "Grid picture builder with two squares, two triangles and two circles to plot.",
    instruction: "Click the six coordinates used by the grid picture.",
    interactionType: "plot_coordinates",
    visualModel: "coordinate_grid",
    objects: [
      { id: "sq1", label: "Square", type: "square", value: "A1" },
      { id: "sq2", label: "Square", type: "square", value: "B1" },
      { id: "tri1", label: "Triangle", type: "triangle", value: "C2" },
      { id: "tri2", label: "Triangle", type: "triangle", value: "D2" },
      { id: "cir1", label: "Circle", type: "circle", value: "A3" },
      { id: "cir2", label: "Circle", type: "circle", value: "B3" },
    ],
    targets: [],
    correctState: { plottedCoordinates: ["A1", "B1", "C2", "D2", "A3", "B3"] },
  },
];

const STEP_7_SPECS: QuestionVisualSpec[] = [
  {
    worksheetSection: "Which Way Is It Facing?",
    visualRequired: "A direction card with an arrow facing right.",
    instruction: "Click the arrow that is facing right.",
    interactionType: "click_objects",
    visualModel: "turn_board",
    objects: [
      { id: "right", label: "Right", type: "arrow-right", selectable: true },
      { id: "up", label: "Up", type: "arrow-up", selectable: true },
      { id: "left", label: "Left", type: "arrow-left", selectable: true },
      { id: "down", label: "Down", type: "arrow-down", selectable: true },
    ],
    targets: [],
    correctState: { selectedObjectIds: ["right"] },
  },
  {
    worksheetSection: "Which Way Is It Facing?",
    visualRequired: "A direction card with an arrow facing down.",
    instruction: "Click the arrow that is facing down.",
    interactionType: "click_objects",
    visualModel: "turn_board",
    objects: [
      { id: "down", label: "Down", type: "arrow-down", selectable: true },
      { id: "up", label: "Up", type: "arrow-up", selectable: true },
      { id: "right", label: "Right", type: "arrow-right", selectable: true },
      { id: "left", label: "Left", type: "arrow-left", selectable: true },
    ],
    targets: [],
    correctState: { selectedObjectIds: ["down"] },
  },
  {
    worksheetSection: "Quarter Turn or Half Turn?",
    visualRequired: "Turn board showing an arrow from up to right.",
    instruction: "Rotate the arrow from up to right to show the turn.",
    interactionType: "rotate_shape",
    visualModel: "turn_board",
    objects: [{ id: "arrow", label: "Arrow", type: "arrow-up" }],
    targets: [],
    correctState: { orientation: 90 },
  },
  {
    worksheetSection: "Quarter Turn or Half Turn?",
    visualRequired: "Turn board showing an arrow from left to right.",
    instruction: "Rotate the arrow to show a half turn.",
    interactionType: "rotate_shape",
    visualModel: "turn_board",
    objects: [{ id: "arrow", label: "Arrow", type: "arrow-left" }],
    targets: [],
    correctState: { orientation: 180 },
  },
  {
    worksheetSection: "Draw the Turn",
    visualRequired: "Turn board starting with an arrow facing up and turning anticlockwise.",
    instruction: "Start facing up. Rotate a quarter turn anticlockwise.",
    interactionType: "rotate_shape",
    visualModel: "turn_board",
    objects: [{ id: "arrow", label: "Arrow", type: "arrow-up" }],
    targets: [],
    correctState: { orientation: 270 },
  },
  {
    worksheetSection: "Draw the Turn",
    visualRequired: "Turn board starting with an arrow facing down and making a half turn.",
    instruction: "Start facing down. Rotate a half turn.",
    interactionType: "rotate_shape",
    visualModel: "turn_board",
    objects: [{ id: "arrow", label: "Arrow", type: "arrow-down" }],
    targets: [],
    correctState: { orientation: 180 },
  },
  {
    worksheetSection: "Follow the Robot",
    visualRequired: "Robot route grid with a robot facing up and turning left, moving forward, then turning right.",
    instruction: "Follow the robot route and tap the final square.",
    interactionType: "move_along_route",
    visualModel: "route_grid",
    objects: [{ id: "robot", label: "Robot", type: "arrow-up", value: "B3" }],
    targets: [],
    correctState: { finalPosition: "A3", routePath: ["B3", "A3"] },
  },
  {
    worksheetSection: "Follow the Robot",
    visualRequired: "Robot turn card with a robot facing right and a quarter turn left.",
    instruction: "A robot faces right and turns left. Rotate the arrow to the final direction.",
    interactionType: "rotate_shape",
    visualModel: "turn_board",
    objects: [{ id: "robot", label: "Robot", type: "arrow-right" }],
    targets: [],
    correctState: { orientation: 270 },
  },
  {
    worksheetSection: "Angle Hunt",
    visualRequired: "Angle cards showing right, smaller-than-right, and larger-than-right angles.",
    instruction: "Click the angle that is the same size as a square corner.",
    interactionType: "click_objects",
    visualModel: "shape_board",
    objects: [
      { id: "right-angle", label: "Right angle", type: "angle-right", selectable: true },
      { id: "acute", label: "Smaller angle", type: "angle-acute", selectable: true },
      { id: "obtuse", label: "Larger angle", type: "angle-obtuse", selectable: true },
    ],
    targets: [],
    correctState: { selectedObjectIds: ["right-angle"] },
  },
  {
    worksheetSection: "Match the Angle",
    visualRequired: "Angle cards showing acute, right, and obtuse angles.",
    instruction: "Click the angle smaller than a right angle.",
    interactionType: "click_objects",
    visualModel: "shape_board",
    objects: [
      { id: "acute", label: "Acute angle", type: "angle-acute", selectable: true },
      { id: "obtuse", label: "Obtuse angle", type: "angle-obtuse", selectable: true },
      { id: "right", label: "Right angle", type: "angle-right", selectable: true },
    ],
    targets: [],
    correctState: { selectedObjectIds: ["acute"] },
  },
  {
    worksheetSection: "Match the Angle",
    visualRequired: "Angle cards showing obtuse, acute, and right angles.",
    instruction: "Click the angle larger than a right angle.",
    interactionType: "click_objects",
    visualModel: "shape_board",
    objects: [
      { id: "obtuse", label: "Obtuse angle", type: "angle-obtuse", selectable: true },
      { id: "acute", label: "Acute angle", type: "angle-acute", selectable: true },
      { id: "right", label: "Right angle", type: "angle-right", selectable: true },
    ],
    targets: [],
    correctState: { selectedObjectIds: ["obtuse"] },
  },
  {
    worksheetSection: "Create a Route",
    visualRequired: "Route builder board with one quarter turn, one half turn, and one forward move.",
    instruction: "Build the route evidence by clicking the required route parts.",
    interactionType: "click_objects",
    visualModel: "route_grid",
    objects: [
      { id: "quarter-turn", label: "Quarter turn", type: "arrow-right", selectable: true },
      { id: "half-turn", label: "Half turn", type: "arrow-down", selectable: true },
      { id: "forward", label: "Forward move", type: "arrow-up", selectable: true },
      { id: "colour-only", label: "Colour only", type: "circle", selectable: true },
    ],
    targets: [],
    correctState: { selectedObjectIds: ["quarter-turn", "half-turn", "forward"] },
  },
];

const STEP_SPECS: Record<number, QuestionVisualSpec[]> = {
  4: STEP_4_SPECS,
  6: STEP_6_SPECS,
  7: STEP_7_SPECS,
};

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
    correct: "Correct. Your interaction matches the worksheet visual.",
    incorrect:
      activity.workedSolution ||
      `Check the visual model again and compare your answer with the worksheet task.${expected}`,
    hint: activity.supportPrompt,
  };
}

function toActivityV5(activity: SourceActivity, mode: AdapterMode): ActivityV5 | null {
  if (!isTargetGeometryActivity(activity)) return null;

  const step = getStepNumber(activity.id);
  const index = getItemIndex(activity.id);
  if (!step) return null;

  const spec = STEP_SPECS[step]?.[index];
  if (!spec) return null;

  return {
    id: activity.id,
    strand: "Geometry and Spatial Reasoning",
    step: `Step ${step}`,
    mode,
    prompt: activity.title || activity.prompt,
    instruction: spec.instruction,
    interactionType: spec.interactionType,
    visualModel: spec.visualModel,
    objects: spec.objects,
    targets: spec.targets,
    correctState: spec.correctState,
    feedback: feedbackFor(activity),
    supportHint: activity.supportPrompt,
    worksheetReference: `GSR Step ${step}: ${spec.worksheetSection}`,
    metadata: {
      expectedAnswer: activity.expectedAnswer ?? null,
      source: "geometry-spatial-reasoning-live-adapter",
      worksheetSection: spec.worksheetSection,
      visualRequired: spec.visualRequired,
    },
  };
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
    response.placements
      ? `placements:${Object.entries(response.placements)
          .map(([key, value]) => `${key}->${value}`)
          .join(",")}`
      : "",
  ].filter(Boolean);

  return parts.length ? parts.join("; ") : JSON.stringify(response);
}
