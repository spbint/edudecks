# Mathematics Worksheet Fidelity Audit

Date: 2026-06-20

## Governed by MyLearna Mathematics Experience Standard v1

This audit and all follow-up mathematics remediation work are governed by
[MyLearna Mathematics Experience Standard v1](./mylearna-mathematics-experience-standard-v1.md).

The standard defines worksheet fidelity, premium maths interaction expectations, ActivityPlayer v5 requirements, touchscreen support, answer randomisation, strand-specific visual models, My Review expectations, and QA/release criteria.

## Scope

This audit reviewed the code paths that render MyLearna Mathematics worksheet resources, Practise activities, and Assess activities for:

- Number and Place Value
- Operations and Calculation
- Fractions, Decimals and Percentages
- Algebra, Patterns and Functions
- Measurement
- Geometry and Spatial Reasoning

The worksheet resource map currently contains 118 worksheet-backed mathematics steps: 57 Number and Place Value, 12 Operations and Calculation, 12 Fractions/Decimals/Percentages, 12 Algebra/Patterns/Functions, 12 Measurement, and 12 Geometry/Spatial Reasoning mappings.

The audit was performed by inspecting the pathway registries, worksheet resource mappings, practice registries, assessment registries, and shared renderers. Browser screenshots were not captured in this pass because the local in-app browser runtime was unavailable.

## Scoring

5 = excellent fidelity  
4 = mostly aligned  
3 = moderate mismatch  
2 = significant mismatch  
1 = poor alignment  
0 = disconnected

## Audit Table

### Number and Place Value

| Worksheet-backed stage | Steps | Score before | Score after | Notes |
| --- | ---: | ---: | ---: | --- |
| Foundation / Kindergarten | 10 | 4 | 4 | Uses worksheet-specific React visuals such as counters, ten frames, place-value blocks, and number lines. |
| Lower Primary | 10 | 3 | 4 | Existing number renderers plus shared fallbacks for counters, arrays, place-value, fractions, and number lines. |
| Middle Primary | 10 | 3 | 3 | Many steps use custom visuals, but some screens still rely on options plus small supporting visuals. |
| Upper Primary | 10 | 2 | 3 | Shared renderer now provides fallback number, array, place-value, fraction, decimal, money, and table models when descriptions reference those models. |
| Lower Secondary | 8 | 2 | 3 | Shared renderer improves number-line, ratio/rate, FDP, table, and context visuals, but upper content still needs structured payloads. |
| Years 9-10 / Consolidation | 9 | 2 | 3 | Shared renderer improves graph/table/FDP/money/context visuals, but these steps need worksheet-specific modelling components. |

### Operations and Calculation

| Step | Score before | Score after | Notes |
| --- | ---: | ---: | --- |
| 1 | 3 | 4 | Existing visual support for early addition/subtraction contexts. |
| 2 | 3 | 4 | Existing visual support for small practical calculation contexts. |
| 3 | 2 | 3 | Shared renderer now shows arrays/groups/bar-style model fallbacks for generated tasks. |
| 4 | 3 | 4 | Existing worksheet-style visual renderer used in player paths. |
| 5 | 3 | 4 | Existing worksheet-style visual renderer used in player paths. |
| 6 | 2 | 3 | Generated content now gets stronger array/place-value/measurement-style visual fallbacks. |
| 7 | 2 | 3 | Generated content now gets stronger visual fallbacks. |
| 8 | 2 | 3 | Generated content now gets stronger visual fallbacks. |
| 9 | 2 | 3 | Generated content now gets stronger visual fallbacks. |
| 10 | 2 | 3 | Generated content now gets stronger visual fallbacks. |
| 11 | 2 | 3 | Generated content now gets stronger visual fallbacks. |
| 12 | 2 | 3 | Generated content now gets stronger visual fallbacks. |

### Fractions, Decimals and Percentages

| Step | Score before | Score after | Notes |
| --- | ---: | ---: | --- |
| 1 | 2 | 3 | Needs worksheet-specific sharing visuals; fallback model now appears for halves/fair-sharing descriptions. |
| 2 | 2 | 3 | Needs section-specific half-shape interactions; fallback model now appears for half/quarter descriptions. |
| 3 | 2 | 3 | Needs practical fraction visuals in all items; fallback model now appears. |
| 4 | 2 | 3 | Needs matching and draw/label interactions; fallback model now appears. |
| 5 | 2 | 3 | Needs visual comparison interactions; fallback model now appears. |
| 6 | 2 | 3 | Needs equivalent-fraction match visuals; fallback model now appears. |
| 7 | 2 | 3 | Needs tenths and hundredths models; fallback decimal grid now appears. |
| 8 | 2 | 3 | Needs practical comparison visuals; fallback decimal grid now appears. |
| 9 | 2 | 3 | Needs percentage/hundred-grid consistency; fallback hundred-grid now appears. |
| 10 | 2 | 3 | Needs three-way equivalence table interactions; fallback model now appears. |
| 11 | 2 | 3 | Needs proportional context tables and scale visuals; fallback table/model visuals now appear where descriptions match. |
| 12 | 2 | 3 | Needs graph/table/decision visuals; fallback table/model visuals now appear where descriptions match. |

### Algebra, Patterns and Functions

| Step | Score before | Score after | Notes |
| --- | ---: | ---: | --- |
| 1 | 2 | 3 | Needs repeating-pattern builder; shared shape/array/table fallbacks now support generated items. |
| 2 | 2 | 3 | Needs sorting interaction; shared shape/object fallbacks now support generated items. |
| 3 | 2 | 3 | Needs growing-pattern visuals; shared array/table fallbacks now support generated items. |
| 4 | 2 | 3 | Needs input-output machine visuals; shared table/number visuals now support generated items. |
| 5 | 2 | 3 | Needs pattern tables and growing groups; shared table/array fallbacks now support generated items. |
| 6 | 2 | 3 | Needs same-rule/different-rule interaction; shared table/array fallbacks now support generated items. |
| 7 | 2 | 3 | Needs unknown-box and letter-rule visuals; shared table/model fallbacks now support generated items. |
| 8 | 2 | 3 | Needs expression/equation matching visuals; shared table/model fallbacks now support generated items. |
| 9 | 2 | 3 | Needs balance-scale equations; shared model fallbacks now support generated items but does not yet render balances. |
| 10 | 2 | 3 | Needs table-rule-graph plotting; shared table and number-line fallbacks now support generated items. |
| 11 | 2 | 3 | Needs real-world modelling, substitution, and graph visuals; shared table/context fallbacks now support generated items. |
| 12 | 2 | 3 | Needs error-checking and generalising visuals; shared table/context fallbacks now support generated items. |

### Measurement

| Step | Score before | Score after | Notes |
| --- | ---: | ---: | --- |
| 1 | 2 | 3 | Needs object comparison visuals; fallback measurement/object model now appears. |
| 2 | 2 | 3 | Needs Australian coin and everyday time visuals; fallback money/time visuals now appear. |
| 3 | 2 | 3 | Needs block, paperclip, and ruler visuals; fallback ruler visual now appears. |
| 4 | 2 | 3 | Needs clocks and coin groups; fallback clock/money visuals now appear. |
| 5 | 2 | 3 | Needs tool-selection visuals; fallback ruler/jug/scale visuals now appear. |
| 6 | 2 | 3 | Needs estimate-measure-compare visuals; fallback measurement visuals now appear. |
| 7 | 2 | 3 | Needs practical measurement calculation contexts; fallback measurement visuals now appear. |
| 8 | 2 | 3 | Needs fraction-decimal-conversion measurement models; fallback measurement/FDP visuals now appear. |
| 9 | 2 | 3 | Needs precision/conversion tools; fallback measurement visuals now appear. |
| 10 | 2 | 3 | Needs design/science investigation visuals; fallback measurement/table visuals now appear where descriptions match. |
| 11 | 2 | 3 | Needs modelling/design layouts; fallback measurement/shape visuals now appear where descriptions match. |
| 12 | 2 | 3 | Needs reasonableness and accuracy visuals; fallback measurement visuals now appear. |

### Geometry and Spatial Reasoning

| Step | Score before | Score after | Notes |
| --- | ---: | ---: | --- |
| 1 | 2 | 3 | Shape recognition now gets large shape model fallback. Needs worksheet scene reconstruction. |
| 2 | 1 | 3 | Position/direction now gets route/grid fallback. Needs worksheet-specific position scenes. |
| 3 | 2 | 3 | Shape features and symmetry now get shape fallback. Needs symmetry builder. |
| 4 | 1 | 3 | Step 4 worksheet mapping is now present. Route and arrangement tasks now use explicit GSR route/arrangement visual payloads. |
| 5 | 2 | 3 | Classification now gets shape fallback. Needs sorting interaction. |
| 6 | 1 | 3 | Coordinate and transformation tasks now get grids/routes/transform visuals. Needs true plotting and transform interactions. |
| 7 | 1 | 3 | Turns and orientation now get route/transform visuals. Needs robot navigation interaction. |
| 8 | 1 | 3 | 2D/3D tasks now get shape/3D fallback. Needs nets and block-view builders. |
| 9 | 1 | 3 | Transformations now get slide/flip/turn fallback. Needs grid transformations. |
| 10 | 1 | 3 | Mapping/layout now gets coordinate grid fallback. Needs floor-plan/park planner. |
| 11 | 1 | 3 | Geometry modelling now gets shape/grid fallback. Needs classroom/floor-plan builders. |
| 12 | 1 | 3 | Spatial judgement now gets shape/grid fallback. Needs rotate/predict and design-evaluate interactions. |

## Failure Inventory

- Generated practice registries commonly convert worksheet-derived sections into `multiple_choice` tasks.
- Generated assessment items often carry only a short visual description string, such as "Map reading activity", instead of a real map/layout/diagram payload.
- Several generated strands use the assessment item as the source for practice, so practice and assessment are aligned with each other but not always aligned to the worksheet visual structure.
- Geometry and Spatial Reasoning had the largest drift: maps, routes, floor plans, transformations, nets, and 3D structures were often reduced to text prompts.
- Algebra, Patterns and Functions had broad drift: repeating patterns, sorting, input-output machines, balance scales, and graphing were often reduced to text or generic options.
- Measurement tasks frequently referenced tools without rendering the tool.
- FDP tasks frequently referenced fractions, decimals, and percentages without enough model support.
- Operations tasks lacked consistent arrays, equal groups, part-whole models, and bar models outside the older custom renderers.
- Number and Place Value is strongest in early steps but still has upper-step content that needs richer structured models.

## Component Inventory

### Already Exists

- CounterGroupVisual
- FractionStripVisual
- NumberChipVisual
- SimpleTableVisual
- EarlyNumberWorksheetVisuals custom renderers

### Improved In This Pass

- ActivityPlayerV4 shared visual renderer
- Text fallback path now attempts worksheet-model visuals before plain text

### Created In This Pass

- WorksheetPanel
- ShapeGlyph
- ShapeModelVisual
- CoordinateGridVisual
- RouteVisual
- TransformationVisual
- MeasurementToolVisual
- MoneyVisual
- ArrayOrPlaceValueVisual
- FractionDecimalModelVisual
- WorksheetModelVisual
- AngleVisual
- NumberLineVisual
- FloorPlanVisual
- NetVisual

### Still Missing

- ShapeSortingActivity
- MapReadingActivity with real map payloads
- CoordinateGridBoard with item placement
- TransformationGrid with slide/flip/turn manipulation
- ClockReadingVisual with dynamic times
- MoneyModelVisual with Australian note/coin group payloads
- MeasurementToolVisual with dynamic rulers, scales, jugs, and tapes
- PlaceValueBlocks with dynamic values
- RouteBuilder
- FloorPlanDesigner
- ArrayBuilder
- NumberLineVisual with dynamic ticks and jumps
- 3DShapeExplorer
- NetBuilder
- SymmetryBuilder
- BalanceScaleEquationVisual
- InputOutputMachineVisual
- PatternBuilderActivity

## Remediation Completed

The shared ActivityPlayerV4 renderer now upgrades many generated context-card descriptions into instructional worksheet-style visuals before falling back to text. This improves both Practise and Assess paths that use ActivityPlayerV4.

The visual routing now handles:

- fraction, decimal, percentage, and hundred-grid descriptions before generic grid detection
- number-line and rounding descriptions
- angle and right-angle descriptions before generic direction detection
- floor-plan, room, playground, and layout descriptions
- net and fold descriptions
- slide, flip, turn, rotate, and transformation descriptions
- map, coordinate, compass, and grid descriptions
- route and movement descriptions
- ruler, clock, scale, jug, capacity, mass, and time descriptions
- Australian money descriptions
- array, equal-group, place-value, and block descriptions

## GSR Step 1-12 Review

Geometry and Spatial Reasoning was reviewed from Step 1 through Step 12. The GSR assessment registry contains 144 cases, 12 per step. Before remediation, many cases had three options and the correct answer was commonly the first option. Practice reused that raw order.

Remediation applied:

- GSR assessment options now pass through `buildGeometrySpatialReasoningAnswerOptions`.
- The helper guarantees four de-duplicated answer options wherever practical by combining the worksheet case options with a GSR distractor pool.
- The helper uses a seeded Fisher-Yates shuffle based on the assessment item id, so the item is stable for review but not biased toward option A.
- GSR practice now reuses the already-shuffled assessment options and the enriched assessment visual description.
- GSR visual descriptions now include the pathway step title and an explicit instruction to use the diagram, shape, grid, route, map, layout, net, angle, or transformation model.
- GSR visual descriptions now use explicit `gsr|kind=...` payloads for route, position, coordinate, transformation, turn, angle, net, block, solid, layout, arrangement, symmetry, map and shape-sort tasks.
- ActivityPlayerV4 now renders those GSR payloads as direct task boards rather than generic keyword fallback visuals.

Answer-position verification:

- First 24 sampled GSR items: A=9, B=2, C=6, D=7, bad option counts=0.
- All 144 GSR items via the same seeded helper logic: A=26, B=47, C=35, D=36, bad option counts=0.

## Remaining Remediation Required

- Replace generated `multiple_choice`-only tasks with richer interactions where the worksheet requires placing, drawing, building, rotating, flipping, or matching.
- Add structured visual payloads to assessment and practice registries instead of relying on description parsing.
- Rebuild GSR Steps 2, 6, 7, 8, 9, 10, 11, and 12 with worksheet-specific interactive components.
- Rebuild Measurement Steps 3 through 12 with dynamic tool visuals and design/investigation layouts.
- Rebuild FDP Steps 1 through 12 with section-specific fraction, decimal, and percentage models.
- Rebuild APF Steps 1 through 12 with pattern builders, sorters, input-output machines, balance scales, and graphing components.
- Expand Operations Steps 3 and 6 through 12 with arrays, equal groups, part-whole models, bar models, and number-line jumps.
- Expand upper Number and Place Value content with structured place-value, decimal, percentage, number-line, and statistics visuals.
