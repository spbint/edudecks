# MyLearna Assess Visual Templates

MyLearna Assess visuals must be deterministic and rendered from structured item data. Arbitrary static images, AI-generated images, or decorative assets must not carry the core mathematical meaning of an assessment item.

The central renderer is `AssessmentStimulus` in `lib/clean/assessments/visualTemplates`. It maps `stimulus.type` to a renderer:

- `counter-set` -> `CounterSetVisual`
- `ten-frame` -> `TenFrameVisual`
- `number-line` -> `NumberLineVisual`
- `array` -> `ArrayVisual`
- `place-value-blocks` -> `PlaceValueBlocksVisual`
- `fraction-bar` -> `FractionBarVisual`
- `shape-set` -> `ShapeSetVisual`

Each renderer uses `stimulus.data` as the source of truth. For example, `filled: 7` renders exactly seven filled ten-frame cells, `rows: 3` and `columns: 4` renders exactly twelve array items, and `numerator: 3` with `denominator: 4` renders four equal parts with three shaded.

To add a new template:

1. Add the stimulus data type in `mylearnaAssessTypes.ts`.
2. Create a visual renderer in `visualTemplates`.
3. Add an accessible description helper if needed.
4. Register the new `stimulus.type` in `AssessmentStimulus`.
5. Add a draft demo item for Assessment Lab only.
6. Add tests for exact rendered counts, accessibility text, invalid data fallback, and player integration if needed.

Customer assessment exposure remains disabled. The current templates and demo items are internal draft tools for `/assessment-lab`.
