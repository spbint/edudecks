import type { NumberAssessmentBankItem } from "@/lib/clean/assessments/numberAssessmentBanks";
import {
  NUMBER_STEP_ASSESSMENT_DEPTH_OPTIONS,
  getNumberStepAssessmentDepthItemCount,
  type NumberStepAssessmentDepth,
} from "@/lib/clean/assessments/numberStepAssessmentTypes";
import type { CleanAssessmentStageKey } from "@/lib/clean/assessments/types";

export const GEOMETRY_SPATIAL_REASONING_STRAND_KEY =
  "geometry-and-spatial-reasoning";
export const GEOMETRY_SPATIAL_REASONING_PARENT_FAMILY_KEY =
  "geometry-and-spatial-reasoning-foundations";
export const GEOMETRY_SPATIAL_REASONING_PARENT_FAMILY_TITLE =
  "Geometry and spatial reasoning";
export const GEOMETRY_SPATIAL_REASONING_ITEM_BANK_KEY =
  "geometry-spatial-reasoning-step-assessment-items-v1";
export const GEOMETRY_SPATIAL_REASONING_SOURCE_ROUTE = "/assessments/number";

type GeometryCase = {
  title: string;
  prompt: string;
  practicePrompt: string;
  options: string[];
  answer: string;
  visual: string;
  cluster: string;
  clusterTitle: string;
  misconceptionTargets: string[];
};

type RawGeometryCase = [
  string,
  string,
  string,
  string[],
  string,
  string,
  string,
  string,
  string[],
];

export type GeometrySpatialReasoningStepSpec = {
  order: number;
  stepNumber: number;
  stageKey: CleanAssessmentStageKey;
  stageTitle: string;
  stepKey: string;
  pathwayStepId: string;
  title: string;
  shortTitle: string;
  description: string;
  cases: GeometryCase[];
};

export type GeometrySpatialReasoningStepAssessment = {
  key: string;
  stepNumber: number;
  stepKey: string;
  pathwayStepId: string;
  title: string;
  shortTitle: string;
  description: string;
  subjectKey: "mathematics";
  strandKey: typeof GEOMETRY_SPATIAL_REASONING_STRAND_KEY;
  stageKey: CleanAssessmentStageKey;
  parentBankKey: typeof GEOMETRY_SPATIAL_REASONING_PARENT_FAMILY_KEY;
  parentBankTitle: typeof GEOMETRY_SPATIAL_REASONING_PARENT_FAMILY_TITLE;
  parentItemBankKey: typeof GEOMETRY_SPATIAL_REASONING_ITEM_BANK_KEY;
  progressionBandKey: typeof GEOMETRY_SPATIAL_REASONING_PARENT_FAMILY_KEY;
  sourceRoute: typeof GEOMETRY_SPATIAL_REASONING_SOURCE_ROUTE;
  depthOptions: typeof NUMBER_STEP_ASSESSMENT_DEPTH_OPTIONS;
  items: NumberAssessmentBankItem[];
};

type StepAssessmentContext = {
  stepKey?: string | null;
  pathwayStepId?: string | null;
  stepAssessmentKey?: string | null;
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function visual(description: string) {
  return { type: "context_card" as const, description };
}

function groups(caption: string, counts: number[], labels: string[] = counts.map(String)) {
  return `early-number|caption=${caption}|groups=${counts.join(",")}|labels=${labels.join(",")}`;
}

function numbers(caption: string, values: Array<string | number>) {
  return `early-number|caption=${caption}|numbers=${values.join(",")}`;
}

function makeCase([
  title,
  prompt,
  practicePrompt,
  options,
  answer,
  visual,
  cluster,
  clusterTitle,
  misconceptionTargets,
]: RawGeometryCase): GeometryCase {
  return {
    title,
    prompt,
    practicePrompt,
    options,
    answer,
    visual,
    cluster,
    clusterTitle,
    misconceptionTargets,
  };
}

function itemId(spec: GeometrySpatialReasoningStepSpec, index: number) {
  return `geometry-spatial-reasoning-step-${spec.order}-assess-${String(
    index + 1,
  ).padStart(3, "0")}`;
}

function makeItem(
  spec: GeometrySpatialReasoningStepSpec,
  item: GeometryCase,
  index: number,
): NumberAssessmentBankItem {
  return {
    id: itemId(spec, index),
    progressionBandKey: GEOMETRY_SPATIAL_REASONING_PARENT_FAMILY_KEY,
    progressionStepKey: spec.stepKey,
    subElementKey: item.cluster,
    subElementTitle: item.clusterTitle,
    subElementDescription: spec.description,
    title: item.title,
    prompt: item.prompt,
    difficulty: index < 4 ? "foundation" : index < 8 ? "developing" : "secure",
    answerType: "multiple_choice",
    format: "geometry_spatial_reasoning_visual_card",
    options: item.options,
    expectedAnswer: item.answer,
    acceptableAnswers: [item.answer],
    markingGuide: "Auto-check the selected option.",
    workedSolution: item.answer,
    misconceptionTargets: item.misconceptionTargets,
    adaptiveRoute: {
      ifIncorrectGoToStepKey: spec.stepKey,
      ifCorrectGoToStepKey: spec.stepKey,
      practiceRecommendation: `Practise ${spec.shortTitle.toLowerCase()} with shape cards, grids, maps, symmetry diagrams, angle cards, nets, and transformation models.`,
      diagnosticNote: `Checks whether the learner can use ${spec.shortTitle.toLowerCase()} for this exact pathway step.`,
    },
    visualSupport: visual(item.visual),
  };
}

const GEOMETRY_STEP_TITLES: Array<
  [string, string, CleanAssessmentStageKey, string, number, string, string]
> = [
  ["Recognise familiar shapes in everyday life", "recognise-familiar-shapes-in-everyday-life", "foundation-kindergarten", "Foundation / Kindergarten", 1, "Familiar shapes", "Recognise familiar shapes in objects, pictures, and constructions."],
  ["Use position and direction language in practical movement", "use-position-and-direction-language-in-practical-movement", "foundation-kindergarten", "Foundation / Kindergarten", 2, "Position and direction language", "Use simple position and direction words in practical movement and arrangement tasks."],
  ["Describe shape features and simple symmetry", "describe-shape-features-and-simple-symmetry", "lower-primary", "Lower Primary", 1, "Shape features and symmetry", "Describe sides, corners, curved edges, and simple symmetry in familiar shapes."],
  ["Follow and create simple routes or arrangements", "follow-and-create-simple-routes-or-arrangements", "lower-primary", "Lower Primary", 2, "Routes and arrangements", "Follow, create, and explain simple routes and spatial arrangements."],
  ["Classify shapes and reason about properties", "classify-shapes-and-reason-about-properties", "middle-primary", "Middle Primary", 1, "Shape classification and properties", "Classify shapes by properties and explain why they belong in a group."],
  ["Use grids, coordinates, and simple transformations", "use-grids-coordinates-and-simple-transformations", "middle-primary", "Middle Primary", 2, "Grids, coordinates, and transformations", "Use grids, coordinates, slides, flips, and turns to describe position and movement."],
  ["Use angles, turns, and orientation meaningfully", "use-angles-turns-and-orientation-meaningfully", "upper-primary", "Upper Primary", 1, "Angles, turns, and orientation", "Recognise, compare, and use angle and turn language in practical spatial tasks."],
  ["Visualise and build shapes in two and three dimensions", "visualise-and-build-shapes-in-two-and-three-dimensions", "upper-primary", "Upper Primary", 2, "2D and 3D visualisation", "Connect drawings, nets, models, and real objects through spatial visualisation."],
  ["Reason about geometric relationships and transformations", "reason-about-geometric-relationships-and-transformations", "lower-secondary", "Lower Secondary", 1, "Geometric relationships and transformations", "Use properties, angle relationships, and transformations to justify geometric conclusions."],
  ["Apply spatial reasoning in design, mapping, and layout", "apply-spatial-reasoning-in-design-mapping-and-layout", "lower-secondary", "Lower Secondary", 2, "Design, mapping, and layout", "Use geometry to plan, interpret, and critique arrangements of space."],
  ["Use geometry to model and interpret space", "use-geometry-to-model-and-interpret-space", "years-9-10-consolidation", "Years 9-10 / consolidation", 1, "Geometric modelling", "Use geometric relationships in plans, diagrams, transformations, and coordinate-based models."],
  ["Refine spatial judgement and explanation", "refine-spatial-judgement-and-explanation", "years-9-10-consolidation", "Years 9-10 / consolidation", 2, "Spatial judgement and explanation", "Check spatial claims and communicate geometric reasoning clearly."],
];

const RAW_GEOMETRY_CASES: RawGeometryCase[][] = [
  [
    ["Circle match", "Which shape is a circle?", "Look for the round shape with no corners.", ["circle", "square", "triangle"], "circle", numbers("Shape cards.", ["circle", "square", "triangle"]), "shape-recognition", "Shape recognition", ["corner-count-confusion"]],
    ["Triangle match", "Which shape has 3 straight sides?", "Count the sides.", ["triangle", "rectangle", "circle"], "triangle", groups("Triangle side count.", [3], ["sides"]), "shape-features", "Shape features", ["counts-corners-as-sides"]],
    ["Everyday circle", "Which object is shaped most like a circle?", "Match the object to the shape.", ["plate", "book", "door"], "plate", numbers("Everyday shape match.", ["plate", "book", "door"]), "everyday-shapes", "Everyday shapes", ["object-name-not-shape"]],
    ["Square feature", "Which shape has 4 equal sides?", "Look for equal side lengths.", ["square", "triangle", "circle"], "square", groups("Square side model.", [4], ["equal sides"]), "shape-features", "Shape features", ["four-sides-any-shape"]],
    ["Rectangle object", "Which object is usually rectangle-shaped?", "Match the everyday object.", ["window", "ball", "coin"], "window", numbers("Object cards.", ["window", "ball", "coin"]), "everyday-shapes", "Everyday shapes", ["orientation-confusion"]],
    ["Same shape", "A small triangle and a large triangle are shown. What is the same?", "Size can change but shape can stay the same.", ["shape", "size", "colour"], "shape", numbers("Two triangles, different sizes.", ["small triangle", "large triangle"]), "shape-constancy", "Shape constancy", ["size-changes-shape"]],
    ["Shape in picture", "Which shape could be used for a roof in a simple house drawing?", "Think of a common house picture.", ["triangle", "circle", "oval"], "triangle", numbers("House shape card.", ["roof", "triangle"]), "everyday-shapes", "Everyday shapes", ["context-feature-gap"]],
    ["Corner count", "Which shape has no corners?", "Look for a curved boundary.", ["circle", "square", "triangle"], "circle", numbers("Corners card.", ["circle: 0", "square: 4"]), "shape-features", "Shape features", ["corner-vocabulary-gap"]],
    ["Different orientation", "A square is turned like a diamond. What shape is it?", "Turning does not change the shape.", ["square", "triangle", "circle"], "square", numbers("Turned square.", ["square turned"]), "orientation", "Orientation", ["orientation-changes-shape"]],
    ["Sort shapes", "Which shape belongs with rectangles?", "Use the 4 straight sides rule.", ["square", "circle", "oval"], "square", numbers("Rectangle family card.", ["rectangle", "square"]), "classification", "Shape classification", ["category-exclusion-gap"]],
    ["Face shape", "A cereal box has rectangle faces. Which shape matches one face?", "Look at the flat face.", ["rectangle", "sphere", "cone"], "rectangle", numbers("Box face.", ["rectangle face"]), "2d-3d-link", "2D and 3D links", ["solid-face-confusion"]],
    ["Best description", "Which description fits a triangle?", "Choose the shape feature.", ["3 sides and 3 corners", "round with no sides", "4 equal sides"], "3 sides and 3 corners", groups("Triangle features.", [3, 3], ["sides", "corners"]), "shape-language", "Shape language", ["feature-language-gap"]],
  ],
  [
    ["Above", "Which object is above the table?", "Use the position word above.", ["lamp", "rug", "chair leg"], "lamp", numbers("Position card.", ["lamp above table", "rug below"]), "position-language", "Position language", ["above-below-confusion"]],
    ["Under", "Where is the ball if it is under the chair?", "Choose the matching position.", ["below the chair", "on top of the chair", "beside the chair"], "below the chair", numbers("Under chair card.", ["chair", "ball below"]), "position-language", "Position language", ["under-beside-confusion"]],
    ["Left turn", "Which instruction means turn left?", "Face forward, then choose the left turn.", ["turn to your left", "turn to your right", "stand still"], "turn to your left", numbers("Turn card.", ["left", "right"]), "direction-language", "Direction language", ["left-right-confusion"]],
    ["Beside", "Which word means next to?", "Choose the position word.", ["beside", "above", "inside"], "beside", numbers("Position words.", ["beside", "above", "inside"]), "position-language", "Position language", ["position-vocabulary-gap"]],
    ["In front", "A toy car is in front of a box. Where is it?", "Think about front and behind.", ["before the box", "inside the box", "under the box"], "before the box", numbers("Front and behind.", ["car", "box"]), "position-language", "Position language", ["front-behind-confusion"]],
    ["Path command", "Which path follows: forward, forward, right?", "Choose the route with two forward moves and a right turn.", ["two steps forward then right", "one step forward then left", "right then two steps back"], "two steps forward then right", numbers("Route card.", ["F", "F", "R"]), "directions", "Directions", ["order-of-directions-error"]],
    ["Inside", "Which item is inside the basket?", "Use the word inside.", ["apple in basket", "apple beside basket", "apple above basket"], "apple in basket", numbers("Basket position.", ["inside", "beside", "above"]), "position-language", "Position language", ["inside-outside-confusion"]],
    ["Near and far", "Which object is nearer to the door?", "Compare distance from the door.", ["mat", "tree", "cloud"], "mat", numbers("Near/far card.", ["door", "mat near", "tree far"]), "distance-language", "Distance language", ["near-far-gap"]],
    ["Arrange order", "Which instruction places the cup between the plate and spoon?", "Between means in the middle.", ["plate, cup, spoon", "cup, plate, spoon", "plate, spoon, cup"], "plate, cup, spoon", numbers("Arrangement card.", ["plate", "cup", "spoon"]), "arrangement", "Arrangement", ["between-language-gap"]],
    ["Clockwise turn", "Which turn follows a clock hand?", "Think of the direction clock hands move.", ["clockwise", "anticlockwise", "straight ahead"], "clockwise", numbers("Turn direction.", ["clockwise arrow"]), "turns", "Turns", ["clockwise-vocabulary-gap"]],
    ["Map position", "On a simple map, the park is right of the school. Which statement matches?", "Use left and right from the map view.", ["park is to the right of school", "park is below school", "park is inside school"], "park is to the right of school", numbers("Map card.", ["school", "park right"]), "maps", "Map position", ["map-orientation-confusion"]],
    ["Follow instruction", "Start at the star. Move up one and right one. Where do you land?", "Follow each movement in order.", ["top-right square", "bottom-left square", "same square"], "top-right square", numbers("Grid moves.", ["start", "up 1", "right 1"]), "directions", "Directions", ["movement-order-error"]],
  ],
  [
    ["Side count", "How many sides does a rectangle have?", "Count the straight sides.", ["4", "3", "0"], "4", groups("Rectangle sides.", [4], ["sides"]), "shape-features", "Shape features", ["side-corner-confusion"]],
    ["Corner count", "How many corners does a triangle have?", "Count the vertices.", ["3", "4", "0"], "3", groups("Triangle corners.", [3], ["corners"]), "shape-features", "Shape features", ["corner-vocabulary-gap"]],
    ["Curved edge", "Which shape has a curved edge?", "Look for a curve.", ["circle", "square", "rectangle"], "circle", numbers("Curved edge card.", ["circle", "square"]), "curves", "Curves", ["straight-curved-confusion"]],
    ["Line of symmetry", "Which line is a line of symmetry for a square?", "It must make two matching halves.", ["vertical line through the centre", "line near one edge", "line outside the square"], "vertical line through the centre", numbers("Symmetry square.", ["centre line"]), "symmetry", "Symmetry", ["line-anywhere-error"]],
    ["Symmetry picture", "Which picture has mirror symmetry?", "Look for two matching sides.", ["butterfly", "random scribble", "one shoe only"], "butterfly", numbers("Symmetry card.", ["butterfly mirror sides"]), "symmetry", "Symmetry", ["appearance-not-matching-halves"]],
    ["Compare shapes", "Which is true about a square and a rectangle?", "Compare properties.", ["both have 4 sides", "both have 3 sides", "both are round"], "both have 4 sides", numbers("Square and rectangle.", ["4 sides", "4 sides"]), "properties", "Shape properties", ["family-property-gap"]],
    ["Fold line", "A paper heart is folded so both sides match. What is the fold line?", "Name the symmetry line.", ["line of symmetry", "ruler line", "number line"], "line of symmetry", numbers("Folded heart.", ["matching halves"]), "symmetry", "Symmetry", ["symmetry-vocabulary-gap"]],
    ["Not symmetrical", "Which shape is least likely to have a line of symmetry as drawn?", "Look for matching halves.", ["uneven blob", "square", "circle"], "uneven blob", numbers("Symmetry examples.", ["blob", "square", "circle"]), "symmetry", "Symmetry", ["assumes-all-shapes-symmetric"]],
    ["Polygon feature", "Which description fits a polygon?", "Polygons have straight sides.", ["closed shape with straight sides", "open curved line", "solid object"], "closed shape with straight sides", numbers("Polygon card.", ["closed", "straight sides"]), "properties", "Shape properties", ["polygon-definition-gap"]],
    ["Sort by corners", "Which group has shapes with 4 corners?", "Use corner count.", ["square and rectangle", "circle and oval", "triangle and circle"], "square and rectangle", numbers("Four-corner group.", ["square", "rectangle"]), "classification", "Shape classification", ["sorts-by-name-only"]],
    ["Horizontal symmetry", "Which shape can have a horizontal line of symmetry?", "Imagine a line across the middle.", ["rectangle", "scalene triangle", "uneven arrow"], "rectangle", numbers("Horizontal symmetry.", ["rectangle centre line"]), "symmetry", "Symmetry", ["orientation-of-symmetry-gap"]],
    ["Feature reason", "Why is a circle different from a square?", "Use shape features.", ["circle has no straight sides", "circle has more corners", "square is always bigger"], "circle has no straight sides", numbers("Circle vs square.", ["curve", "straight sides"]), "reasoning", "Shape reasoning", ["size-not-property"]],
  ],
  [
    ["Grid route", "Which route follows: up 2, right 1?", "Follow the moves in order.", ["up two squares then right one", "right two then up one", "down two then left one"], "up two squares then right one", numbers("Route moves.", ["U", "U", "R"]), "routes", "Routes", ["movement-order-error"]],
    ["Treasure map", "Start at A. Move right 3. Where is the treasure?", "Count three squares to the right.", ["three squares right of A", "three squares left of A", "above A"], "three squares right of A", numbers("Grid treasure.", ["A", "R3"]), "maps", "Maps", ["left-right-confusion"]],
    ["Arrangement", "Put the cube below the sphere. Which arrangement matches?", "Use below.", ["sphere above cube", "cube above sphere", "cube beside sphere"], "sphere above cube", numbers("Object arrangement.", ["sphere", "cube below"]), "arrangements", "Arrangements", ["relative-position-confusion"]],
    ["Create route", "Which instruction gets from start to the house shown two squares up?", "Choose the matching route.", ["up 2", "right 2", "down 2"], "up 2", numbers("Simple map.", ["start", "house above"]), "routes", "Routes", ["direction-word-error"]],
    ["Obstacle route", "Which route avoids the pond?", "Choose the path around the obstacle.", ["right, right, up", "up into pond", "left into wall"], "right, right, up", numbers("Obstacle map.", ["start", "pond", "safe path"]), "route-planning", "Route planning", ["ignores-obstacle"]],
    ["Position plan", "Which plan puts the bed next to the wall?", "Look for the object beside the wall.", ["bed beside wall", "bed in middle only", "bed outside room"], "bed beside wall", numbers("Room plan.", ["wall", "bed beside"]), "layout", "Layout", ["layout-language-gap"]],
    ["Reverse route", "You went right 2. How do you return to start?", "Use the opposite direction.", ["left 2", "right 2", "up 2"], "left 2", numbers("Reverse route.", ["R2", "L2"]), "route-reversal", "Route reversal", ["opposite-direction-error"]],
    ["Describe path", "Which description matches a path that turns left after the tree?", "Check the turning point.", ["go to tree, then left", "turn left before tree", "go around twice"], "go to tree, then left", numbers("Path card.", ["tree", "left after"]), "directions", "Directions", ["turning-point-error"]],
    ["Build arrangement", "Which arrangement has three blocks in a row?", "Look for a straight row.", ["block-block-block", "blocks stacked", "blocks scattered"], "block-block-block", groups("Three in a row.", [1, 1, 1], ["block", "block", "block"]), "arrangements", "Arrangements", ["row-vs-stack"]],
    ["Map symbols", "On a map, a star marks the library. What does the star show?", "Use the map key idea.", ["library location", "distance only", "shape name only"], "library location", numbers("Map symbol.", ["star = library"]), "maps", "Maps", ["symbol-purpose-gap"]],
    ["Route length", "Which route is shorter?", "Compare the number of grid steps.", ["4 steps", "6 steps", "8 steps"], "4 steps", numbers("Grid route lengths.", [4, 6, 8]), "route-planning", "Route planning", ["path-length-gap"]],
    ["Explain arrangement", "Why is the triangle between the square and circle?", "Use between language.", ["it is in the middle", "it is above both", "it is outside"], "it is in the middle", numbers("Arrangement.", ["square", "triangle", "circle"]), "arrangements", "Arrangements", ["between-explanation-gap"]],
  ],
  [
    ["Quadrilateral", "Which shape is a quadrilateral?", "Look for 4 straight sides.", ["rectangle", "triangle", "circle"], "rectangle", groups("Four sides.", [4], ["sides"]), "classification", "Classification", ["shape-name-only"]],
    ["Right angle", "Which shape usually has right angles?", "Look for square corners.", ["rectangle", "circle", "oval"], "rectangle", numbers("Right angle card.", ["rectangle corners"]), "angles", "Angles", ["right-angle-vocabulary-gap"]],
    ["Parallel sides", "Which shape has two pairs of parallel opposite sides?", "Use side relationships.", ["parallelogram", "triangle", "circle"], "parallelogram", numbers("Parallel sides card.", ["opposite sides parallel"]), "properties", "Properties", ["parallel-vocabulary-gap"]],
    ["Triangle sort", "Which is true of every triangle?", "Use a property that always holds.", ["3 sides", "4 sides", "no corners"], "3 sides", groups("Triangle property.", [3], ["sides"]), "properties", "Properties", ["example-specific-property"]],
    ["Square and rhombus", "Which property do a square and rhombus share?", "Compare side lengths.", ["4 equal sides", "no angles", "curved edges"], "4 equal sides", groups("Equal side property.", [4, 4], ["square", "rhombus"]), "properties", "Properties", ["family-relationship-gap"]],
    ["Classify by symmetry", "Which shape is likely to have many lines of symmetry?", "Compare symmetry properties.", ["regular hexagon", "scalene triangle", "irregular quadrilateral"], "regular hexagon", numbers("Symmetry comparison.", ["regular hexagon", "scalene triangle"]), "symmetry", "Symmetry", ["regular-vs-irregular-gap"]],
    ["Polygon group", "Which item does not belong in a polygon group?", "Polygons are closed with straight sides.", ["circle", "pentagon", "triangle"], "circle", numbers("Polygon group.", ["triangle", "pentagon", "circle"]), "classification", "Classification", ["closed-straight-gap"]],
    ["3D object", "Which object has 6 rectangular faces?", "Use solid properties.", ["cuboid", "sphere", "cone"], "cuboid", numbers("Solid property card.", ["6 rectangular faces"]), "3d-properties", "3D properties", ["2d-3d-confusion"]],
    ["Net clue", "A net has 6 equal squares. Which solid can it make?", "Think of cube faces.", ["cube", "cone", "cylinder"], "cube", groups("Six square faces.", [1, 1, 1, 1, 1, 1], ["sq", "sq", "sq", "sq", "sq", "sq"]), "nets", "Nets", ["net-solid-gap"]],
    ["Property reason", "Why is a rectangle not usually called a regular polygon?", "Regular means all sides and angles equal.", ["not all sides are equal", "it has no straight sides", "it is open"], "not all sides are equal", numbers("Regular polygon idea.", ["equal sides", "equal angles"]), "reasoning", "Geometric reasoning", ["regular-definition-gap"]],
    ["Shape family", "Which statement is true?", "Use inclusive shape properties.", ["a square is a rectangle", "a circle is a rectangle", "a triangle is a square"], "a square is a rectangle", numbers("Shape families.", ["square", "rectangle"]), "classification", "Classification", ["exclusive-category-error"]],
    ["Angle property", "Which polygon has interior angles that are all right angles?", "Look for four square corners.", ["rectangle", "equilateral triangle", "regular pentagon"], "rectangle", numbers("Right-angle polygon.", ["rectangle"]), "angles", "Angles", ["angle-property-gap"]],
  ],
  [
    ["Find the dog", "On the worksheet grid, the dog is in A1. Which coordinate names the dog?", "Find the dog and read the column letter and row number.", ["A1", "B2", "D4"], "A1", numbers("Object location grid.", ["dog A1", "car B2", "house C3", "star D4"]), "coordinates", "Coordinates", ["row-column-confusion"]],
    ["Find the house", "On the worksheet grid, the house is in C3. Which coordinate names the house?", "Use the column letter first, then the row number.", ["C3", "3C", "B2"], "C3", numbers("Object location grid.", ["dog A1", "car B2", "house C3", "star D4"]), "coordinates", "Coordinates", ["coordinate-order-error"]],
    ["Place the square", "Where should you place the square?", "Use the coordinate card from the worksheet.", ["C3", "A4", "D1"], "C3", numbers("Place the objects.", ["circle B2", "square C3", "triangle D1", "star A4"]), "plotting", "Plotting coordinates", ["object-coordinate-mismatch"]],
    ["Place the star", "A star must go at A4. Which location is correct?", "Read A4 as column A, row 4.", ["column A row 4", "column 4 row A", "column D row 1"], "column A row 4", numbers("Place a star.", ["A4"]), "plotting", "Plotting coordinates", ["row-column-confusion"]],
    ["Connect vertical points", "Plot A1, A2, A3 and A4, then connect them. What line do you make?", "The column stays the same and the row changes.", ["vertical line", "horizontal line", "diagonal line"], "vertical line", numbers("Coordinate plot.", ["A1", "A2", "A3", "A4"]), "coordinate-patterns", "Coordinate patterns", ["line-direction-confusion"]],
    ["Connect horizontal points", "Plot B1, C1 and D1, then connect them. What line do you make?", "The row stays the same and the column changes.", ["horizontal line", "vertical line", "curved line"], "horizontal line", numbers("Coordinate plot.", ["B1", "C1", "D1"]), "coordinate-patterns", "Coordinate patterns", ["line-direction-confusion"]],
    ["Slide the square", "A square slides 2 spaces right. What changed?", "A slide changes position without turning or flipping.", ["position only", "shape size", "number of sides"], "position only", numbers("Slide on grid.", ["square", "right 2"]), "translation", "Slides", ["translation-changes-shape"]],
    ["Slide the triangle", "A triangle slides 1 space up. Which move matches?", "Move the triangle one grid space upward.", ["up 1", "right 1", "down 2"], "up 1", numbers("Slide on grid.", ["triangle", "up 1"]), "translation", "Slides", ["axis-direction-error"]],
    ["Flip over mirror line", "Which transformation completes a square reflection across a mirror line?", "A flip makes a mirror image on the other side of the line.", ["reflection", "slide", "quarter turn"], "reflection", numbers("Mirror line.", ["square", "mirror", "reflected square"]), "reflection", "Flips", ["reflection-rotation-confusion"]],
    ["Heart reflection", "When you complete the other half of a heart across a symmetry line, what should the new half do?", "The two sides should match like a mirror.", ["match the first half", "be larger than the first half", "turn into a triangle"], "match the first half", numbers("Mirror completion.", ["heart half", "symmetry line"]), "reflection", "Flips", ["appearance-not-matching-halves"]],
    ["Quarter turn", "Which turn matches a quarter turn clockwise?", "Use the worksheet arrow examples.", ["turn right 90 degrees", "turn halfway around", "flip over a mirror line"], "turn right 90 degrees", numbers("Turn arrows.", ["quarter clockwise", "half turn", "quarter anticlockwise"]), "turns", "Turns", ["turn-size-confusion"]],
    ["Grid picture", "A grid picture uses 2 squares, 2 triangles and 2 circles. What should you record after plotting it?", "The worksheet asks you to record where each shape is placed.", ["the coordinates", "only the colours", "only the page number"], "the coordinates", numbers("Grid picture builder.", ["2 squares", "2 triangles", "2 circles"]), "grid-picture", "Grid pictures", ["coordinate-recording-gap"]],
  ],
  [
    ["Arrow facing right", "Which way is the arrow facing?", "Read the arrow direction.", ["right", "up", "left"], "right", numbers("Arrow orientation.", ["right", "up", "left", "down"]), "orientation", "Orientation", ["left-right-confusion"]],
    ["Arrow facing down", "Which word matches an arrow pointing down?", "Use the worksheet direction words.", ["down", "up", "right"], "down", numbers("Arrow orientation.", ["down arrow"]), "orientation", "Orientation", ["direction-vocabulary-gap"]],
    ["Quarter or half turn", "An arrow turns from up to right. What kind of turn is shown?", "Up to right is one quarter of a full turn clockwise.", ["quarter turn", "half turn", "full turn"], "quarter turn", numbers("Turn arrows.", ["up", "right"]), "turns", "Turns", ["turn-size-confusion"]],
    ["Half turn", "An arrow turns from left to right. What kind of turn is shown?", "Left to right is halfway around.", ["half turn", "quarter turn", "no turn"], "half turn", numbers("Turn arrows.", ["left", "right"]), "turns", "Turns", ["turn-fraction-gap"]],
    ["Draw the turn", "Start facing up. After a quarter turn anticlockwise, which way do you face?", "Turn left from up.", ["left", "right", "down"], "left", numbers("Draw the turn.", ["start up", "quarter anticlockwise"]), "turn-drawing", "Draw turns", ["clockwise-anticlockwise-confusion"]],
    ["Half-turn result", "Start facing down. After a half turn, which way do you face?", "A half turn points in the opposite direction.", ["up", "down", "right"], "up", numbers("Draw the turn.", ["start down", "half turn"]), "turn-drawing", "Draw turns", ["opposite-direction-error"]],
    ["Follow the robot", "A robot faces up, makes a quarter turn left, moves forward, then makes a quarter turn right. What is its final direction?", "Track the turns in order.", ["up", "left", "right"], "up", numbers("Robot route.", ["face up", "turn left", "move", "turn right"]), "robot-navigation", "Robot navigation", ["movement-order-error"]],
    ["Robot turn", "A robot faces right and makes a quarter turn left. Which way does it face?", "Turn left from right.", ["up", "down", "left"], "up", numbers("Robot route.", ["right", "quarter left"]), "robot-navigation", "Robot navigation", ["left-right-turn-confusion"]],
    ["Angle hunt", "Which angle is the same size as a square corner?", "A square corner is a right angle.", ["right angle", "smaller than a right angle", "larger than a right angle"], "right angle", numbers("Angle hunt.", ["square corner", "small angle", "wide angle"]), "angles", "Angles", ["right-angle-gap"]],
    ["Smaller angle", "Which label fits an angle smaller than a right angle?", "Use the worksheet angle comparison.", ["acute angle", "obtuse angle", "right angle"], "acute angle", numbers("Angle match.", ["small angle", "right angle", "wide angle"]), "angle-types", "Angle types", ["acute-right-confusion"]],
    ["Larger angle", "Which label fits an angle larger than a right angle?", "Use the worksheet angle comparison.", ["obtuse angle", "acute angle", "right angle"], "obtuse angle", numbers("Angle match.", ["wide angle", "right angle", "small angle"]), "angle-types", "Angle types", ["obtuse-right-confusion"]],
    ["Create a route", "A route starts facing up and must use one quarter turn, one half turn, and one forward move. What should you record at the end?", "The worksheet asks for the final direction.", ["final direction", "only the colour", "only the page number"], "final direction", numbers("Route builder.", ["quarter turn", "half turn", "forward"]), "route-building", "Route building", ["final-orientation-gap"]],
  ],
  [
    ["2D or 3D square", "Is a square a 2D shape or a 3D shape?", "A square is flat.", ["2D", "3D", "both always"], "2D", numbers("2D or 3D classifier.", ["square", "cube", "circle", "sphere"]), "2d-3d", "2D and 3D", ["flat-solid-confusion"]],
    ["2D or 3D cylinder", "Is a cylinder a 2D shape or a 3D object?", "A cylinder has depth, like a can.", ["3D", "2D", "flat shape"], "3D", numbers("2D or 3D classifier.", ["rectangle", "cylinder"]), "2d-3d", "2D and 3D", ["object-shape-confusion"]],
    ["Match circle to object", "Which 3D object has circle faces?", "Think of the worksheet object matches.", ["cylinder", "cube", "rectangular prism"], "cylinder", numbers("Shape-object match.", ["circle", "cylinder"]), "shape-object-match", "Shape-object matching", ["face-vs-solid"]],
    ["Match rectangle to object", "Which everyday object is like a rectangular prism?", "Match the 2D rectangle idea to a box-shaped object.", ["shoebox", "ball", "traffic cone"], "shoebox", numbers("Shape-object match.", ["rectangle", "shoebox"]), "shape-object-match", "Shape-object matching", ["object-property-gap"]],
    ["Cube features", "How many faces does a cube have?", "Count the square faces.", ["6", "8", "12"], "6", groups("Cube faces, edges, corners.", [6, 12, 8], ["faces", "edges", "corners"]), "solid-features", "Faces, edges, and corners", ["edges-vs-faces"]],
    ["Rectangular prism features", "A rectangular prism has how many corners?", "Use the worksheet feature table.", ["8", "6", "12"], "8", groups("Rectangular prism features.", [6, 12, 8], ["faces", "edges", "corners"]), "solid-features", "Faces, edges, and corners", ["corner-face-confusion"]],
    ["Build a cube", "Which pieces do you need to build a cube model?", "A cube has square faces.", ["6 square faces", "2 circles and 1 rectangle", "4 triangles only"], "6 square faces", groups("Cube build.", [6], ["square faces"]), "building", "Build shapes", ["net-face-count-error"]],
    ["Build a tower", "Which description matches a tower using cubes?", "Use cube blocks stacked in layers.", ["cubes stacked upward", "one flat circle", "a single triangle"], "cubes stacked upward", numbers("Cube tower.", ["cube", "cube", "cube"]), "building", "Build shapes", ["2d-3d-build-confusion"]],
    ["Cube net", "Which net can fold into a cube?", "Look for 6 connected squares.", ["six connected squares", "one circle and one rectangle", "four loose triangles"], "six connected squares", groups("Cube net.", [1, 1, 1, 1, 1, 1], ["sq", "sq", "sq", "sq", "sq", "sq"]), "nets", "Nets and folding", ["net-face-count-error"]],
    ["Trace top and bottom", "On a cube net, which faces should you trace for top and bottom?", "Choose two square faces that become opposite faces when folded.", ["two square faces", "two circle faces", "no faces"], "two square faces", numbers("Cube net top and bottom.", ["top square", "bottom square"]), "nets", "Nets and folding", ["net-purpose-gap"]],
    ["Top view", "From above, what view might a cube-block tower show?", "Look from the top of the blocks.", ["top view", "front view", "side view only"], "top view", numbers("Block structure views.", ["front", "side", "top"]), "views", "Different views", ["viewpoint-confusion"]],
    ["Playground design", "A playground structure uses cubes, cylinders and rectangles. What kind of shapes are you using?", "The design challenge combines 2D drawings and 3D objects.", ["2D and 3D shapes", "letters only", "numbers only"], "2D and 3D shapes", numbers("Playground structure designer.", ["cube", "cylinder", "rectangle"]), "design", "Design with shapes", ["design-shape-link-gap"]],
  ],
  [
    ["Slide, flip, or turn", "A shape moves 3 squares right and keeps the same orientation. Which transformation is shown?", "Identify whether the movement is a slide, flip, or turn.", ["slide", "flip", "turn"], "slide", numbers("Transformation identifier.", ["start shape", "3 right", "same direction"]), "transformations", "Transformations", ["slide-flip-turn-confusion"]],
    ["Mirror line", "A shape is reflected across a vertical mirror line. Which transformation is shown?", "A mirror line creates a flip.", ["flip", "slide", "turn"], "flip", numbers("Mirror transformation.", ["shape", "mirror line", "image"]), "transformations", "Transformations", ["reflection-vocabulary-gap"]],
    ["Quarter turn", "A shape rotates a quarter turn clockwise. Which transformation is shown?", "A clockwise rotation is a turn.", ["turn", "slide", "flip"], "turn", numbers("Turn card.", ["quarter turn", "clockwise"]), "transformations", "Transformations", ["turn-direction-gap"]],
    ["Describe a slide", "Complete the description: The L-shape slides ___ and keeps the same size and direction.", "Describe movement using grid language.", ["4 squares right", "over a mirror line", "half turn"], "4 squares right", numbers("Transformation description.", ["L-shape", "right 4"]), "description", "Describe transformations", ["vague-transformation-language"]],
    ["Describe a flip", "Complete the sentence: The shape is flipped across the ___.", "Use the worksheet mirror-line language.", ["mirror line", "number line", "edge count"], "mirror line", numbers("Flip description.", ["shape", "mirror line"]), "description", "Describe transformations", ["mirror-line-language-gap"]],
    ["Predict the result", "If a triangle is turned a half turn, what changes?", "Predict the transformed shape.", ["orientation changes but size stays the same", "size doubles", "it becomes a circle"], "orientation changes but size stays the same", numbers("Predict transformation grid.", ["triangle", "half turn"]), "prediction", "Predict transformations", ["rotation-changes-size"]],
    ["Square and rectangle", "Is every square also a rectangle?", "Use properties of sides and right angles.", ["yes", "no", "only if it is large"], "yes", numbers("Relationship card.", ["square", "rectangle"]), "relationships", "Geometric relationships", ["shape-family-gap"]],
    ["Rectangle and square", "Is every rectangle also a square?", "A square needs four equal sides.", ["no", "yes", "only if it is turned"], "no", numbers("Relationship card.", ["rectangle", "square"]), "relationships", "Geometric relationships", ["overgeneralises-square"]],
    ["Triangle right angles", "Can a triangle have two right angles?", "Think about how triangle angles fit together.", ["no", "yes", "always"], "no", numbers("Triangle reasoning.", ["right angle", "right angle", "triangle"]), "relationships", "Geometric relationships", ["angle-relationship-gap"]],
    ["Shape investigation", "Which row best describes a square?", "Use the worksheet investigation table.", ["4 sides, 4 corners, 4 right angles", "3 sides, 3 corners, no right angles", "0 sides, 0 corners"], "4 sides, 4 corners, 4 right angles", groups("Shape investigation table.", [4, 4, 4], ["sides", "corners", "right angles"]), "properties", "Shape investigation", ["property-table-gap"]],
    ["Transformation grid", "An L-shape is slid, flipped, then rotated on a grid. What should stay the same each time?", "Transformations keep the shape's size.", ["size and shape", "colour only", "number of grid labels"], "size and shape", numbers("Transformation grid.", ["slide", "flip", "rotate"]), "transformation-grid", "Transformation grid", ["transformation-property-gap"]],
    ["Real-world geometry", "Why are doors, windows, and road signs useful for geometry reasoning?", "Connect shapes and transformations to real design.", ["they use shapes, positions, and turns", "they avoid all shapes", "they only use numbers"], "they use shapes, positions, and turns", numbers("Real-world geometry.", ["door", "window", "road sign"]), "real-world-geometry", "Real-world geometry", ["context-geometry-link-gap"]],
  ],
  [
    ["Read the map north", "On the worksheet map, which building is north of the park?", "Use the compass directions on the map.", ["school", "pond", "car park"], "school", numbers("Map reading activity.", ["park", "north", "school"]), "map-reading", "Map reading", ["compass-direction-confusion"]],
    ["Read the map east", "What is east of the library on the map?", "East means to the right on the compass rose.", ["shop", "school", "pond"], "shop", numbers("Map reading activity.", ["library", "east", "shop"]), "map-reading", "Map reading", ["east-west-confusion"]],
    ["Coordinate playground", "Which answer gives the playground location on a grid map?", "Use a letter-number coordinate.", ["B3", "north", "2 metres"], "B3", numbers("Map coordinates.", ["A1", "B3", "C2"]), "coordinates", "Coordinates", ["coordinate-format-gap"]],
    ["Follow the route", "Start at school. Move 3 squares right, 2 squares up, then 1 square left. What should you do first?", "Follow route instructions in order.", ["move 3 squares right", "move 2 squares up", "move 1 square left"], "move 3 squares right", numbers("Route navigation grid.", ["school", "R3", "U2", "L1"]), "routes", "Route following", ["movement-order-error"]],
    ["Create a route", "What information should a create-your-own-route answer include?", "A route needs a start, directions, and final location.", ["start, moves, and finish", "only a colour", "only the page number"], "start, moves, and finish", numbers("Route builder.", ["start", "moves", "finish"]), "routes", "Route following", ["route-communication-gap"]],
    ["Bedroom layout", "Which bedroom layout rule matches the worksheet?", "Use the layout constraints.", ["desk near window", "bookshelf blocking door", "bed floating outside room"], "desk near window", numbers("Bedroom layout designer.", ["bed", "desk", "window", "door"]), "layout-design", "Layout design", ["ignores-layout-constraint"]],
    ["Bedroom safety", "Why should the bookshelf not block the door?", "A good layout keeps movement paths clear.", ["so the doorway stays clear", "so the bookshelf disappears", "so the window moves"], "so the doorway stays clear", numbers("Bedroom layout designer.", ["bookshelf", "door", "clear path"]), "layout-design", "Layout design", ["spatial-conflict-gap"]],
    ["Floor plan closest", "On a house plan, what does closest room mean?", "Compare positions from the kitchen.", ["the room nearest the kitchen", "the room with the largest label", "the room outside the plan"], "the room nearest the kitchen", numbers("Floor plan reasoning.", ["kitchen", "rooms", "distance"]), "floor-plans", "Floor plans", ["distance-language-gap"]],
    ["Floor plan improvement", "Which is a useful improvement suggestion for a floor plan?", "Improve movement or space use.", ["keep a clear path from entrance to rooms", "remove all doors", "ignore room positions"], "keep a clear path from entrance to rooms", numbers("Floor plan critique.", ["entrance", "path", "rooms"]), "floor-plans", "Floor plans", ["layout-critique-gap"]],
    ["Scale playground width", "A playground is 4 grid squares wide. Scale is 1 square = 2 metres. What is the width?", "Multiply squares by 2 metres.", ["8 metres", "4 metres", "2 metres"], "8 metres", groups("Scale drawing activity.", [2, 2, 2, 2], ["m", "m", "m", "m"]), "scale-layout", "Scale and layout", ["scale-factor-error"]],
    ["Mini park planner", "Which set of features belongs in the mini park design?", "Use the worksheet park-planning list.", ["playground, trees, pond, walking path", "bed, desk, bookshelf", "school, library, shop only"], "playground, trees, pond, walking path", numbers("Mini park planner.", ["playground", "trees", "pond", "path"]), "park-design", "Mini park planning", ["context-mixup"]],
    ["Compass direction", "If the shop is east of the school, where is it on the map?", "East is to the right on the map compass.", ["right of the school", "below the school", "inside the school"], "right of the school", numbers("Compass direction challenge.", ["school", "east", "shop"]), "compass-directions", "Compass directions", ["direction-language-gap"]],
  ],
  [
    ["Coordinate model", "Which model best represents seats in a theatre?", "Use rows and columns.", ["coordinate grid", "capacity jug", "number line only"], "coordinate grid", numbers("Theatre seating.", ["row", "seat"]), "modelling", "Geometric modelling", ["representation-choice-gap"]],
    ["Transformation model", "A digital image is flipped over a vertical line. Which transformation models it?", "A mirror flip is a reflection.", ["reflection", "translation", "rotation"], "reflection", numbers("Image model.", ["vertical mirror line"]), "transformations", "Transformations", ["reflection-vocabulary-gap"]],
    ["Scale model", "A model bridge is 1:50. What does this mean?", "Compare model and real lengths.", ["1 unit on model represents 50 real units", "50 model units represent 1 real unit", "the model has 50 bridges"], "1 unit on model represents 50 real units", numbers("Scale ratio.", ["1:50"]), "scale", "Scale", ["scale-direction-error"]],
    ["Interpret plan", "A plan marks a wall as 4 m and door as 0.8 m. Which conclusion fits?", "Compare dimensions.", ["the door is shorter than the wall", "the door is longer", "they are the same"], "the door is shorter than the wall", numbers("Plan dimensions.", ["wall 4 m", "door 0.8 m"]), "plans", "Plans", ["decimal-comparison-gap"]],
    ["Geometric constraint", "A ramp needs a gentle angle. Which angle is more suitable?", "Choose the smaller angle.", ["10 degrees", "80 degrees", "120 degrees"], "10 degrees", numbers("Ramp angles.", [10, 80, 120]), "modelling", "Geometric modelling", ["angle-context-gap"]],
    ["Coordinate distance", "Points (2,3) and (2,8) are how far apart vertically?", "Only y changes.", ["5 units", "2 units", "11 units"], "5 units", numbers("Coordinate distance.", ["(2,3)", "(2,8)"]), "coordinates", "Coordinates", ["coordinate-difference-error"]],
    ["Model fit", "Which diagram best models a rectangular garden?", "Match the shape to the context.", ["rectangle with labelled sides", "circle only", "random curve"], "rectangle with labelled sides", numbers("Garden model.", ["rectangle", "side labels"]), "modelling", "Geometric modelling", ["model-context-gap"]],
    ["Interpret transformation", "A shape and its image are same size but opposite orientation across a line. What happened?", "Use transformation properties.", ["reflection", "translation", "enlargement"], "reflection", numbers("Shape image.", ["mirror line"]), "transformations", "Transformations", ["orientation-property-gap"]],
    ["Graph-space link", "Which coordinate lies on the horizontal line y = 4?", "All points have y value 4.", ["(2, 4)", "(4, 2)", "(2, 5)"], "(2, 4)", numbers("Coordinate line.", ["y=4"]), "coordinates", "Coordinates", ["x-y-confusion"]],
    ["Useful geometry", "Why use a geometric model before building?", "It helps plan shape, size, and position.", ["to test the spatial plan", "to avoid measurements", "to make all shapes circles"], "to test the spatial plan", numbers("Planning model.", ["draw", "check", "build"]), "modelling", "Geometric modelling", ["model-purpose-gap"]],
    ["Angle model", "Which relationship helps model a straight path turning at an intersection?", "Use angles on a line.", ["angles on a straight line add to 180 degrees", "all angles are equal", "coordinates never change"], "angles on a straight line add to 180 degrees", numbers("Intersection model.", ["straight line", "180"]), "angle-relationships", "Angle relationships", ["angle-model-gap"]],
    ["Model critique", "A plan has no scale but claims exact distances. What is missing?", "Scale links the plan to real distances.", ["scale information", "shape colour", "north only"], "scale information", numbers("Plan critique.", ["no scale", "distance claim"]), "spatial-judgement", "Spatial judgement", ["scale-critique-gap"]],
  ],
  [
    ["Misleading diagram", "A triangle looks isosceles but no equal sides are marked. What should you do?", "Do not rely only on appearance.", ["check markings or measurements", "assume it is isosceles", "ignore the diagram"], "check markings or measurements", numbers("Diagram judgement.", ["looks equal", "no marks"]), "judgement", "Spatial judgement", ["visual-assumption-error"]],
    ["Clear explanation", "Which explanation best proves a square has equal diagonals?", "Use a property-based statement.", ["rectangles have equal diagonals and a square is a rectangle", "it looks neat", "all lines are equal"], "rectangles have equal diagonals and a square is a rectangle", numbers("Proof-style card.", ["square", "rectangle property"]), "explanation", "Geometric explanation", ["appearance-as-proof"]],
    ["Check coordinate claim", "A learner says (3,7) and (7,3) are the same point. What is wrong?", "Coordinate order matters.", ["the coordinates are in different order", "both use 10", "points have no order"], "the coordinates are in different order", numbers("Coordinate claim.", ["(3,7)", "(7,3)"]), "checking", "Check claims", ["coordinate-order-error"]],
    ["Critique scale", "A map has a scale but distances were measured from a photo taken at an angle. What is the issue?", "Perspective can distort distances.", ["the image may be distorted", "scale never matters", "angles are not geometry"], "the image may be distorted", numbers("Map critique.", ["photo angle", "distortion"]), "judgement", "Spatial judgement", ["scale-with-distortion-gap"]],
    ["Transformation explanation", "Which statement clearly describes a transformation?", "Name the action and effect.", ["translated 4 units right, same size", "moved somehow", "became different"], "translated 4 units right, same size", numbers("Transformation explanation.", ["right 4", "same size"]), "explanation", "Geometric explanation", ["vague-transformation-language"]],
    ["Reasonable claim", "Which spatial claim needs checking?", "Look for a possible conflict.", ["a sofa fits because width is 80 cm and doorway is 75 cm", "a 4 cm map line is longer than 3 cm", "a square has 4 sides"], "a sofa fits because width is 80 cm and doorway is 75 cm", numbers("Fit claim.", ["sofa 80", "door 75"]), "checking", "Check claims", ["constraint-not-checked"]],
    ["Diagram labels", "Why are labels important in a geometric diagram?", "They show what is known, not guessed.", ["they clarify given information", "they decorate the shape", "they make all lengths equal"], "they clarify given information", numbers("Diagram labels.", ["given", "unknown"]), "communication", "Communication", ["label-purpose-gap"]],
    ["Counterexample", "Which shape disproves 'all quadrilaterals have four right angles'?", "Find one quadrilateral without right angles.", ["rhombus with slanted sides", "rectangle", "square"], "rhombus with slanted sides", numbers("Quadrilateral examples.", ["rhombus", "rectangle"]), "counterexample", "Counterexamples", ["tests-only-fitting-examples"]],
    ["Angle check", "A triangle has angles 60, 60, and 80 degrees. What should you notice?", "Triangle angles should add to 180 degrees.", ["the angles add to 200 degrees, so something is wrong", "the triangle is correct", "triangles add to 200"], "the angles add to 200 degrees, so something is wrong", numbers("Triangle angle check.", [60, 60, 80]), "checking", "Check claims", ["angle-sum-not-checked"]],
    ["Stronger reason", "Which reason is stronger for classifying a shape as a parallelogram?", "Use a defining property.", ["both pairs of opposite sides are parallel", "it is tilted", "it is blue"], "both pairs of opposite sides are parallel", numbers("Parallelogram property.", ["opposite sides parallel"]), "reasoning", "Geometric reasoning", ["appearance-not-property"]],
    ["Revise explanation", "An explanation says 'these angles match because they look the same'. What would improve it?", "Use a geometric relationship.", ["name the angle relationship used", "make the diagram larger", "remove the labels"], "name the angle relationship used", numbers("Explanation critique.", ["looks same", "need reason"]), "communication", "Communication", ["visual-guess-as-proof"]],
    ["Final judgement", "Which conclusion is clearest after checking a layout?", "State evidence and decision.", ["The table fits because 85 cm is less than the 90 cm gap", "The table fits because I like it", "The table fits because it is drawn"], "The table fits because 85 cm is less than the 90 cm gap", numbers("Layout conclusion.", ["table 85", "gap 90"]), "communication", "Communication", ["unsupported-spatial-conclusion"]],
  ],
];

const GEOMETRY_CASES: GeometryCase[][] = RAW_GEOMETRY_CASES.map((cases) =>
  cases.map(makeCase),
);

export const GEOMETRY_SPATIAL_REASONING_STEP_SPECS: GeometrySpatialReasoningStepSpec[] =
  GEOMETRY_STEP_TITLES.map(
    ([title, stepKey, stageKey, stageTitle, stepNumber, shortTitle, description], index) => ({
      order: index + 1,
      stepNumber,
      stageKey,
      stageTitle,
      stepKey,
      pathwayStepId: `mathematics::geometry-and-spatial-reasoning::${stageKey}::${stepKey}`,
      title,
      shortTitle,
      description,
      cases: GEOMETRY_CASES[index],
    }),
  );

export const GEOMETRY_SPATIAL_REASONING_STEP_ASSESSMENTS:
  GeometrySpatialReasoningStepAssessment[] =
  GEOMETRY_SPATIAL_REASONING_STEP_SPECS.map((spec) => ({
    key: `geometry-spatial-reasoning-step-${spec.order}-${spec.stepKey}-assessment-v1`,
    stepNumber: spec.stepNumber,
    stepKey: spec.stepKey,
    pathwayStepId: spec.pathwayStepId,
    title: spec.title,
    shortTitle: spec.shortTitle,
    description: spec.description,
    subjectKey: "mathematics",
    strandKey: GEOMETRY_SPATIAL_REASONING_STRAND_KEY,
    stageKey: spec.stageKey,
    parentBankKey: GEOMETRY_SPATIAL_REASONING_PARENT_FAMILY_KEY,
    parentBankTitle: GEOMETRY_SPATIAL_REASONING_PARENT_FAMILY_TITLE,
    parentItemBankKey: GEOMETRY_SPATIAL_REASONING_ITEM_BANK_KEY,
    progressionBandKey: GEOMETRY_SPATIAL_REASONING_PARENT_FAMILY_KEY,
    sourceRoute: GEOMETRY_SPATIAL_REASONING_SOURCE_ROUTE,
    depthOptions: NUMBER_STEP_ASSESSMENT_DEPTH_OPTIONS,
    items: spec.cases.map((item, index) => makeItem(spec, item, index)),
  }));

export function getGeometrySpatialReasoningStepAssessmentForPathwayStep(
  context: StepAssessmentContext,
) {
  const stepAssessmentKey = safe(context.stepAssessmentKey);
  const stepKey = safe(context.stepKey);
  const pathwayStepId = safe(context.pathwayStepId);

  return (
    GEOMETRY_SPATIAL_REASONING_STEP_ASSESSMENTS.find(
      (assessment) =>
        (stepAssessmentKey && assessment.key === stepAssessmentKey) ||
        (pathwayStepId && assessment.pathwayStepId === pathwayStepId) ||
        (stepKey && assessment.stepKey === stepKey),
    ) || null
  );
}

export function getGeometrySpatialReasoningStepAssessmentItemsForDepth(
  assessmentKey: string,
  depth: NumberStepAssessmentDepth,
) {
  const assessment =
    GEOMETRY_SPATIAL_REASONING_STEP_ASSESSMENTS.find(
      (candidate) => candidate.key === assessmentKey,
    ) || null;

  if (!assessment) return [];

  return assessment.items.slice(0, getNumberStepAssessmentDepthItemCount(depth));
}
